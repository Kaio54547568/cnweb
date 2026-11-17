FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS api
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY viewer ./viewer
USER node
CMD ["node", "dist/api.js"]

FROM api AS worker
USER root
COPY nlp ./nlp
RUN apt-get update && apt-get install -y --no-install-recommends python3-venv \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m venv /opt/sudachi \
    && /opt/sudachi/bin/pip install --no-cache-dir --only-binary=:all: -r nlp/requirements.txt
ENV PYTHON_BIN=/opt/sudachi/bin/python
USER node
CMD ["node", "dist/worker.js"]

# infra

Hạ tầng cho môi trường dev (và sau này là file triển khai staging/production).

- `docker-compose.yml`: PostgreSQL 16, Redis 7, Meilisearch.

```bash
cp .env.example .env
docker compose -f infra/docker-compose.yml --env-file .env up -d
```

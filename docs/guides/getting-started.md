# Bắt đầu

## Yêu cầu

- Node.js ≥ 22
- pnpm (`corepack enable` hoặc `npm i -g pnpm`)
- Docker (cho PostgreSQL, Redis)

## Cài đặt

```bash
pnpm install
docker compose -f infra/docker-compose.yml up -d --wait
```

Sau đó:

1. [apps/api](../../apps/api/README.md#chạy-cục-bộ): tạo `.env`, chạy migration, khởi động API và worker.
2. [apps/web](../../apps/web/README.md#chạy-cục-bộ): cấu hình Google OAuth, chạy `pnpm --filter @cnweb/web dev`.

## Thêm package mới

1. Đặt `name` trong `package.json` là `@cnweb/<tên>`; có script `dev`, `build`, `lint`, `test` nếu cần (root chạy bằng `pnpm -r --if-present`).
2. Không tạo `package-lock.json`/`yarn.lock`; dùng `pnpm install` ở root.
3. Thêm `.env.example` cho biến của app và cập nhật README của app.
4. Gói có script cài đặt (như Prisma) phải được cho phép trong `allowBuilds` của `pnpm-workspace.yaml`.

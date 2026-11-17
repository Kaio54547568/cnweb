# Bắt đầu

## Yêu cầu

- Node.js ≥ 22
- pnpm (`corepack enable` hoặc `npm i -g pnpm`)
- Docker (cho PostgreSQL, Redis, Meilisearch)

## Cài đặt

```bash
pnpm install
cp .env.example .env
docker compose -f infra/docker-compose.yml --env-file .env up -d
```

## Khởi tạo một app mới

Các app trong `apps/` đang trống. Khi khởi tạo một app:

1. Tạo bằng công cụ chính thức ngay trong thư mục `apps/<tên>` (ví dụ `create-next-app`, `nest new`).
2. Đặt `name` trong `package.json` là `@cnweb/<tên>`; đảm bảo có script `dev`, `build`, `lint`, `test` (root chạy bằng `pnpm -r --if-present`).
3. Xóa `package-lock.json`/`yarn.lock` nếu công cụ tạo ra; dùng `pnpm install` ở root.
4. Thêm `.env.example` cho biến của app; cập nhật README của app.
5. Dùng `extends` từ `packages/config` khi package này đã có nội dung.

## Gợi ý thứ tự khởi tạo

`packages/shared` → `apps/api` (+ Prisma schema, migration đầu) → `apps/web` (trình xem) → `apps/worker` → `apps/cms`.

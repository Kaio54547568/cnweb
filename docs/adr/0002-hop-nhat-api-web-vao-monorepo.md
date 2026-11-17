# 0002. Hợp nhất API NestJS và web Next.js vào monorepo

- Trạng thái: Accepted
- Ngày: 2026-11-17

## Bối cảnh

Nhánh `reorganize-mvp` đã có backend NestJS + Prisma + worker và giao diện Next.js tham chiếu (Auth.js, BFF). Nhánh cấu trúc có monorepo `apps/` và giao diện Figma dạng Vite SPA dùng dữ liệu giả. Hai nhánh dùng cấu trúc thư mục khác nhau.

## Quyết định

- `backend/` → `apps/api`; `frontend/` → `apps/web`. Quản lý bằng pnpm workspace, bỏ `package-lock.json`.
- `apps/web` dùng Next.js vì Auth.js, BFF và quy tắc same-origin của API phụ thuộc Next.js. Giao diện Figma được port dần sang đây (Tailwind v4, design tokens từ Figma) thay vì giữ Vite SPA.
- Worker nằm trong `apps/api` (cùng codebase, hai tiến trình), nên bỏ thư mục `apps/worker`.
- CMS là trang `/editorial` trong `apps/web`, nên bỏ thư mục `apps/cms`.
- Docker Compose dev đặt ở `infra/docker-compose.yml` (PostgreSQL 18, Redis 7); chưa dùng Meilisearch vì MVP tìm kiếm bằng PostgreSQL.

## Hệ quả

- Lịch sử git của `backend/` và `frontend/` trên `reorganize-mvp` không được giữ theo đường dẫn mới (nội dung được đưa vào bằng commit mới).
- `apps/api/Dockerfile` vẫn viết cho npm và build từ thư mục `apps/api`; cần sửa cho pnpm workspace trước khi dùng để triển khai.
- Các trang `/account`, `/learning`, `/editorial` chưa thiết kế lại theo Figma.

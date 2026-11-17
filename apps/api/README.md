# apps/api (`@cnweb/api`)

API duy nhất cho mọi client (web, cms, extension). NestJS (REST + OpenAPI), PostgreSQL + Prisma, Redis.

Monolith chia mô-đun, dự kiến: `auth`, `users`, `catalog` (channels, series, episodes), `subtitles` (speakers, subtitle_lines, line_analyses), `dictionary`, `learning` (saved_items, watch_progress), `search`.

Mô hình dữ liệu: xem [docs/product/overview.md](../../docs/product/overview.md#mô-hình-dữ-liệu-chính). Schema Prisma đặt ở `prisma/schema.prisma` khi khởi tạo.

Trạng thái: chưa khởi tạo. Khi khởi tạo, thêm `.env.example` (DATABASE_URL, REDIS_URL, …).

# Kiến trúc

```
 trình duyệt ──► web (Next.js: UI, CMS /editorial, Auth.js, BFF)
                    │  xác nhận ngắn hạn
                    ▼
                api (NestJS REST) ──► PostgreSQL (Prisma)
                    │                      ▲
                    └──► Redis ◄── worker (BullMQ + SudachiPy)
 trình duyệt ──► YouTube IFrame (chỉ nhúng, không lưu video)
```

- Một API, một cơ sở dữ liệu; mọi client gọi qua BFF của `apps/web`.
- API và worker là hai tiến trình của cùng codebase `apps/api`.
- Worker xử lý phụ đề nền (furigana trước, AI dịch bật sau).

Tài liệu chi tiết: [backend-architecture.md](backend-architecture.md), [database.md](database.md).

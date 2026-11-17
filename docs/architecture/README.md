# Kiến trúc

```
 web (Next.js) ─┐
 cms            ├──► api (NestJS) ──► PostgreSQL
 extension      ┘        │  ├──────► Meilisearch
                         │  └──────► Redis ◄── worker (BullMQ)
                         │                       │
                         └─ YouTube (chỉ nhúng)  └─► NLP + LLM API
```

- Một API, một cơ sở dữ liệu; mọi client gọi chung API.
- Worker xử lý phụ đề nền: tách từ, furigana, dịch nháp.
- Video không qua server của dự án.

Thêm sơ đồ chi tiết (luồng nhập phụ đề, luồng đồng bộ trình phát) vào thư mục này khi thiết kế xong.

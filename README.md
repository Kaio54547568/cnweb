# Học tiếng Nhật qua video

Ứng dụng dùng video YouTube và phụ đề Nhật–Việt theo thời gian. Người học có thể lọc danh mục, tra từ, lưu câu và từ vào Sổ tay. Biên tập viên dùng CMS để nhập, duyệt và xuất bản phụ đề.

| Thư mục | Vai trò |
| --- | --- |
| [backend/](backend/README.md) | NestJS REST API, PostgreSQL/Prisma và worker BullMQ + SudachiPy |
| [frontend/](frontend/README.md) | Next.js cho danh mục, Auth.js, BFF, tài khoản, Sổ tay và CMS |
| [docs/](docs) | Kiến trúc, database và hướng dẫn tích hợp FE/BE |

## Chạy local

1. Chạy PostgreSQL và Redis bằng Docker Compose, áp migration rồi khởi động API và worker theo hướng dẫn backend. [Chạy backend](backend/README.md#chạy-cục-bộ)
2. Cấu hình Google OAuth và khởi động Next.js. Sau đó mở `http://localhost:3000`. [Chạy frontend](frontend/README.md#chạy-cục-bộ)

Xem các luồng và API đang có trong [tài liệu tích hợp FE/BE](docs/ban-giao-backend-frontend-mvp.md). Xem thêm [kiến trúc](docs/backend-architecture.md) và [database](docs/database.md).

## Kiểm tra

GitHub Actions build cả hai ứng dụng, kiểm tra migration trên PostgreSQL tạm và chạy smoke test API → Redis → worker khi push hoặc mở pull request. [Workflow CI](.github/workflows/ci.yml)

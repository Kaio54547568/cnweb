# cnweb — Học tiếng Nhật qua video

Website cho người Việt học tiếng Nhật qua video YouTube: phụ đề Nhật–Việt đồng bộ, furigana, tra từ, lưu câu/từ vào Sổ tay. Biên tập viên dùng CMS để nhập, duyệt và xuất bản phụ đề. Lấy cảm hứng từ Akaiwa.

- Tổng quan sản phẩm, phạm vi MVP, mô hình dữ liệu: [docs/product/overview.md](docs/product/overview.md)
- Quy ước làm việc (cho người và cho công cụ AI): [AGENTS.md](AGENTS.md)
- Hướng dẫn đóng góp: [CONTRIBUTING.md](CONTRIBUTING.md)
- Tích hợp FE/BE: [docs/guides/ban-giao-backend-frontend-mvp.md](docs/guides/ban-giao-backend-frontend-mvp.md), [kiến trúc](docs/architecture/backend-architecture.md), [database](docs/architecture/database.md)

## Cấu trúc

| Thư mục | Vai trò |
| --- | --- |
| [apps/api](apps/api/README.md) | NestJS REST API, PostgreSQL/Prisma và worker BullMQ + SudachiPy (API và worker cùng codebase) |
| [apps/web](apps/web/README.md) | Next.js: danh mục, Auth.js, BFF, tài khoản, Sổ tay và CMS (`/editorial`); giao diện đang port từ Figma |
| [apps/extension](apps/extension/README.md) | Extension trình duyệt (giai đoạn 3, chưa làm) |
| `packages/` | `shared`, `ui`, `config` dùng chung (chưa có nội dung) |
| [infra](infra/README.md) | docker-compose cho PostgreSQL và Redis |
| `docs/` | product, architecture, adr, guides |
| `prototypes/` | Mã thử nghiệm cũ, chỉ tham khảo |

## Chạy local

Yêu cầu: Node.js ≥ 22, pnpm, Docker.

```bash
pnpm install
docker compose -f infra/docker-compose.yml up -d --wait
```

Sau đó làm theo [README của API](apps/api/README.md#chạy-cục-bộ) (migration, API, worker) và [README của web](apps/web/README.md#chạy-cục-bộ) (Google OAuth, `pnpm --filter @cnweb/web dev`), rồi mở http://localhost:3000.

## Kiểm tra

GitHub Actions build API và web, kiểm tra migration trên PostgreSQL tạm và chạy smoke test API → Redis → worker khi push hoặc mở pull request: [ci.yml](.github/workflows/ci.yml).

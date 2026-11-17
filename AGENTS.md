# AGENTS.md

Hướng dẫn chung cho mọi công cụ AI coding (Claude Code, Codex, Cursor, Copilot…) và cho thành viên mới.
`CLAUDE.md` import file này, nên chỉ sửa ở đây.

## Dự án

Website học ngoại ngữ qua video (tương tự Akaiwa): người Việt học tiếng Nhật bằng cách xem video YouTube có phụ đề song ngữ đồng bộ, furigana, tra từ, lưu câu/từ. Chi tiết: [docs/product/overview.md](docs/product/overview.md).

Giai đoạn hiện tại: **MVP (Giai đoạn 1)**. Không làm tính năng Giai đoạn 2/3 (SRS, thanh toán, giáo trình, extension, cộng đồng sub) nếu chưa được yêu cầu.

## Cấu trúc thư mục

```
apps/
  api/         NestJS REST (OpenAPI) + Prisma/PostgreSQL + worker BullMQ/SudachiPy (nlp/) — API duy nhất cho mọi client
  web/         Next.js + Auth.js + BFF, Tailwind v4 — trang người học và CMS (/editorial); đang port giao diện từ Figma
  extension/   Extension trình duyệt (WXT/Plasmo) — Giai đoạn 3, chưa làm
packages/
  shared/      Kiểu dữ liệu, schema (zod), hằng số dùng chung giữa các app (chưa có nội dung)
  ui/          Component UI dùng chung (chưa có nội dung)
  config/      tsconfig, eslint, prettier cơ sở (chưa có nội dung)
infra/         docker-compose (PostgreSQL, Redis), file triển khai
docs/          product/ (yêu cầu), architecture/, adr/ (quyết định kiến trúc), guides/
scripts/       Script tiện ích chạy từ root
prototypes/    Mã thử nghiệm cũ, chỉ để tham khảo — KHÔNG phát triển thêm
```

API và worker là hai tiến trình của cùng codebase `apps/api` (`start:api`, `start:worker`). Trình duyệt chỉ gọi `apps/web` (BFF `/api/v1/*`), BFF ký xác nhận ngắn hạn rồi chuyển tới NestJS. Chi tiết: [docs/guides/ban-giao-backend-frontend-mvp.md](docs/guides/ban-giao-backend-frontend-mvp.md).

`prototypes/transcript-tool` là bản thử nghiệm Python (FastAPI + SudachiPy). Có thể đọc để lấy ý tưởng nhưng không import trực tiếp.

## Lệnh thường dùng (chạy ở root)

```bash
pnpm install            # cài toàn bộ workspace
pnpm dev                # chạy các app có script dev
pnpm lint               # lint mọi package
pnpm test               # test mọi package
pnpm build              # build mọi package
docker compose -f infra/docker-compose.yml up -d --wait   # PostgreSQL, Redis
```

Chạy riêng một app: `pnpm --filter @cnweb/web dev`. Tên package có dạng `@cnweb/<thư-mục>`.

## Quy ước

- Ngôn ngữ: TypeScript, `strict`. Package manager: **pnpm** (không dùng npm/yarn, không commit `package-lock.json`).
- Mọi client chỉ nói chuyện với `apps/api` (qua BFF của `apps/web`); không truy cập DB trực tiếp từ web.
- Kiểu dữ liệu dùng chung đặt ở `packages/shared`, không copy giữa các app.
- Video không lưu trên server: chỉ phát qua YouTube IFrame Player. Không tải lại video.
- AI chạy một lần khi nhập nội dung rồi cache kết quả; không gọi AI theo lượt xem.
- Bảng `subtitle_lines` là trung tâm của hệ thống; đổi schema phải qua migration Prisma và ghi ADR nếu đổi hướng thiết kế.
- Tên file/thư mục: `kebab-case`. Component React: `PascalCase`. Biến/hàm: `camelCase`.
- Không commit secret. Mỗi app có `.env.example`; file `.env` đã bị gitignore.
- UI và nội dung hướng tới người dùng bằng tiếng Việt; code, tên biến, commit message bằng tiếng Anh.

## Git workflow

- Nhánh mặc định `main` được bảo vệ: không push trực tiếp, làm qua Pull Request.
- Đặt tên nhánh: `feat/<mô-tả>`, `fix/<mô-tả>`, `chore/<mô-tả>`, `docs/<mô-tả>`.
- Commit theo Conventional Commits: `feat(web): add transcript panel`. Scope là tên thư mục trong `apps/` hoặc `packages/`.
- PR nhỏ, một mục đích; điền đủ mẫu PR; CI (lint + test) phải xanh trước khi merge.

## Khi dùng AI coding

- Đọc `docs/product/overview.md` và README của app liên quan trước khi sửa.
- Đổi phạm vi nhỏ nhất đủ để xong việc; không refactor ngoài yêu cầu, không đổi cấu trúc thư mục khi chưa thống nhất.
- Chạy `pnpm lint` và `pnpm test` trước khi báo xong.
- Quyết định kiến trúc mới → thêm file vào `docs/adr/` (xem `docs/adr/README.md`).
- Không đọc/ghi `.env`, không đưa khóa API vào prompt hay commit.

# AGENTS.md

Hướng dẫn chung cho mọi công cụ AI coding (Claude Code, Codex, Cursor, Copilot…) và cho thành viên mới.
`CLAUDE.md` import file này, nên chỉ sửa ở đây.

## Dự án

Website học ngoại ngữ qua video (tương tự Akaiwa): người Việt học tiếng Nhật bằng cách xem video YouTube có phụ đề song ngữ đồng bộ, furigana, tra từ, lưu câu/từ. Chi tiết: [docs/product/overview.md](docs/product/overview.md).

Giai đoạn hiện tại: **MVP (Giai đoạn 1)**. Không làm tính năng Giai đoạn 2/3 (SRS, thanh toán, giáo trình, extension, cộng đồng sub) nếu chưa được yêu cầu.

## Cấu trúc thư mục

```
apps/
  web/         React + Vite + TypeScript + Tailwind v4 (từ Figma, dữ liệu giả; dự kiến chuyển Next.js) — trang người học
  cms/         Trang quản trị nhập video, tải/sửa phụ đề, duyệt bản dịch
  api/         NestJS REST + OpenAPI, Prisma + PostgreSQL — API duy nhất cho mọi client
  worker/      BullMQ worker nền: tách từ, furigana, dịch nháp bằng AI
  extension/   Extension trình duyệt (WXT/Plasmo) — Giai đoạn 3, chưa làm
packages/
  shared/      Kiểu dữ liệu, schema (zod), hằng số dùng chung giữa các app
  ui/          Component UI dùng chung (web, cms, extension)
  config/      tsconfig, eslint, prettier cơ sở
infra/         docker-compose (PostgreSQL, Redis, Meilisearch), file triển khai
docs/          product/ (yêu cầu), architecture/, adr/ (quyết định kiến trúc), guides/
scripts/       Script tiện ích chạy từ root
prototypes/    Mã thử nghiệm cũ, chỉ để tham khảo — KHÔNG phát triển thêm
```

`prototypes/transcript-tool` là bản thử nghiệm Python (FastAPI + SudachiPy). Có thể đọc để lấy ý tưởng cho `apps/worker` (chia cue, furigana, prompt dịch), nhưng không import trực tiếp.

## Lệnh thường dùng (chạy ở root)

```bash
pnpm install            # cài toàn bộ workspace
pnpm dev                # chạy các app có script dev
pnpm lint               # lint mọi package
pnpm test               # test mọi package
pnpm build              # build mọi package
docker compose -f infra/docker-compose.yml up -d   # PostgreSQL, Redis, Meilisearch
```

Chạy riêng một app: `pnpm --filter @cnweb/web dev`. Tên package có dạng `@cnweb/<thư-mục>`.

## Quy ước

- Ngôn ngữ: TypeScript, `strict`. Package manager: **pnpm** (không dùng npm/yarn, không commit `package-lock.json`).
- Mọi client chỉ nói chuyện với `apps/api`; không truy cập DB trực tiếp từ web/cms.
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

# Đóng góp

## Quy trình

1. Nhận task từ backlog (Jira/Linear), tạo nhánh từ `main`: `feat/<mô-tả>`, `fix/<mô-tả>`, `chore/<mô-tả>`, `docs/<mô-tả>`.
2. Code, chạy `pnpm lint && pnpm test` ở root.
3. Commit theo Conventional Commits, ví dụ `feat(api): add episode list endpoint`. Scope là tên thư mục trong `apps/` hoặc `packages/`.
4. Mở Pull Request vào `main`, điền đủ mẫu PR. Cần ít nhất 1 người review; CI phải xanh.
5. Merge bằng squash để lịch sử `main` gọn.

## Quy tắc chung

- Một PR một mục đích, nhỏ gọn (ưu tiên < 400 dòng thay đổi).
- Không push trực tiếp lên `main`.
- Không commit secret, file `.env`, dữ liệu cá nhân, video hay file media lớn.
- Thay đổi schema DB phải có migration Prisma; thay đổi hướng kiến trúc phải có ADR trong `docs/adr/`.
- Thêm biến môi trường mới → cập nhật `.env.example` tương ứng.

## Dùng công cụ AI

Xem mục "Khi dùng AI coding" trong [AGENTS.md](AGENTS.md). Người mở PR chịu trách nhiệm về code do AI sinh ra: đọc lại, chạy test, và không để AI tự ý đổi cấu trúc dự án.

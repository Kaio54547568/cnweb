# 0001. Monorepo pnpm workspace

- Trạng thái: Accepted
- Ngày: 2026-11-17

## Bối cảnh

Hệ thống gồm web, CMS, API, worker và (sau này) extension, dùng chung kiểu dữ liệu và UI. Đội 6–7 người, đa số dùng TypeScript. Kế hoạch yêu cầu đi nhanh và tránh lệch kiểu dữ liệu giữa client và API.

## Quyết định

Dùng một repo (monorepo) với pnpm workspace: `apps/*` là ứng dụng chạy được, `packages/*` là thư viện dùng chung. Mã Python thử nghiệm cũ chuyển sang `prototypes/` để tham khảo, không phát triển tiếp.

## Hệ quả

- Chia sẻ `packages/shared` và `packages/ui` không cần publish.
- Một PR có thể sửa cả API và client; CI chạy chung.
- Cần quy ước scope commit và `CODEOWNERS` khi đội lớn lên.
- Chưa thêm Turborepo/Nx; xem xét khi thời gian build/test thành vấn đề.

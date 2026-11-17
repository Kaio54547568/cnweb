# packages/shared (`@cnweb/shared`)

Mã dùng chung giữa các app: kiểu dữ liệu domain (Episode, SubtitleLine, Token…), schema validate (zod), hằng số (cấp độ JLPT, vai trò…), hàm tiện ích thuần (không phụ thuộc framework).

Quy tắc: không import từ `apps/*`; không chứa code chỉ chạy được ở một môi trường (DOM hoặc Node).

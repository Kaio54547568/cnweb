# Web Next.js

Web chạy danh mục, đăng nhập Google qua Auth.js và trang biên tập. [Backend NestJS](../api/README.md) sở hữu tài khoản, vai trò và transcript.

Hai lớp giao diện cùng tồn tại:

- **Giao diện Figma** (`figma-ui/`, route `/` và `/wireframes`): Trang chủ, Kho nội dung, Xem tập, Hồ sơ/Đăng nhập, Sổ tay, đã nối API thật qua BFF cùng origin (`/api/v1/*`). Đăng nhập chỉ Google (Auth.js, `SessionProvider` trong `components/figma-app.tsx`). Cấu trúc: `screens/` (mỗi màn hình một file), `lib/api.ts` (client + kiểu phản hồi), `lib/mappers.ts` (API → kiểu giao diện), `components/YouTubePlayer.tsx` (IFrame, đồng bộ phụ đề), `components/appState.ts` (trạng thái dùng chung). Các trường API chưa có (ảnh bìa, thời lượng, từ loại…) được đọc sẵn dạng tùy chọn và ẩn khi thiếu; xem [docs/guides/yeu-cau-api-backend.md](../../docs/guides/yeu-cau-api-backend.md). `data/mockData.ts` chỉ còn dùng cho trang trình diễn design system và wireframes.
- **Trang nối API thật** (`app/(legacy)/`: `/catalog`, `/account`, `/learning`, `/editorial`): giao diện tham chiếu của backend, đã có đăng nhập Google, phân quyền và CMS. `/catalog` đã dùng Tailwind theo token Figma.

Design tokens ở `app/globals.css`. Chưa làm: CMS theo Figma (đang dùng `/editorial`), URL riêng cho từng màn hình (hiện chuyển màn bằng state, chưa có route/back-button).

## Chạy cục bộ

1. Chạy PostgreSQL, Redis, migration, API và worker theo README của backend.
2. Tạo `.env.local` từ `.env.example`. Dùng `AUTH_URL=http://localhost:3000` và `BACKEND_URL=http://127.0.0.1:3001` theo mặc định.
3. Tạo OAuth client loại Web application trong Google Cloud. Thêm redirect URI chính xác `http://localhost:3000/api/auth/callback/google`, rồi điền `AUTH_GOOGLE_ID` và `AUTH_GOOGLE_SECRET`. Nếu ứng dụng OAuth đang ở chế độ Testing, thêm tài khoản dùng để thử vào danh sách test users. [Hướng dẫn Auth.js cho Google](https://authjs.dev/getting-started/providers/google)
4. Sinh hai chuỗi ngẫu nhiên riêng cho `AUTH_SECRET` và `BACKEND_ASSERTION_KEY`. Có thể dùng lệnh sau hai lần. Đặt cùng `BACKEND_ASSERTION_KEY` trong môi trường NestJS và Next.js. Giữ cả hai khóa ở server.

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
pnpm install
pnpm dev
```

Mở `http://localhost:3000` và đăng nhập Google. Tài khoản mới có vai trò `LEARNER`. Để kiểm tra CMS, sao chép ID tài khoản trên trang chủ, chạy lệnh cấp `EDITOR` ở backend rồi tải lại trang.

## Kiểm tra quyền xem

Tạo hoặc tìm tập theo tiêu đề ở trang biên tập. Nhập phụ đề, sửa bản dịch và chọn người nói trong bảng theo câu, sau đó lưu bản nháp rồi duyệt xuất bản. Nút làm mới trạng thái NLP giữ các chỉnh sửa chưa lưu. Tìm tập theo tên tập, series hoặc kênh trên trang chủ. Dùng cửa sổ riêng tư để kiểm tra khách thấy metadata nhưng chỉ xem được tập đã đánh dấu mẫu. Đổi lại thành “Cần đăng nhập” để kiểm tra quyền có hiệu lực ngay.

Next.js chuyển tiếp các đường dẫn ứng dụng được cho phép. Khi gửi thao tác ghi, trình duyệt phải gửi JSON từ origin cấu hình trong `AUTH_URL`. Cookie phiên chỉ được đọc bởi Auth.js, còn NestJS nhận xác nhận có chữ ký hạn tối đa 30 giây và tự tra quyền hiện hành. Endpoint tạo tài khoản từ danh tính Google chỉ dùng cho callback server-to-server.

Trên staging, đặt `AUTH_URL` là URL HTTPS công khai của web, thêm URI callback tương ứng vào cấu hình Google, dùng khóa riêng của staging và cấu hình `BACKEND_URL` trỏ đến API staging.

## Kiểm tra tính năng học

Sau khi nạp dữ liệu từ điển theo README backend, mở tập đã xuất bản và tra từ hoặc kanji. Đăng nhập để lưu từ, lưu câu và ghi tiến độ. Trang **Sổ tay và Xem tiếp** hiển thị các mục đó. Biên tập viên có thể gỡ xuất bản để kiểm tra rằng mục đã lưu không còn trả phụ đề. Trang **Tài khoản** cho phép xóa dữ liệu học và phiên đăng nhập hiện tại.

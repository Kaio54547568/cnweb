# Backend NestJS

Backend gồm NestJS REST, PostgreSQL/Prisma và worker BullMQ. API và worker dùng chung codebase và lịch sử migration.

Xem [thiết kế database và hướng dẫn chuyển đổi](../docs/database.md) trước khi áp migration chuẩn hóa phụ đề lên DB đã có dữ liệu.

## Chạy cục bộ

Cần Node.js 22 trở lên, npm, PostgreSQL và Redis. Docker Compose là cách tùy chọn để chạy hai dịch vụ dữ liệu trên máy local.

Compose giữ tên project `backend-nest` để dùng lại các volume PostgreSQL và Redis từ trước khi đổi tên thư mục.

Từ thư mục `backend`, tạo `.env` từ `.env.example`, rồi chạy:

```sh
docker compose up -d --wait
npm ci
npm run build
npm run db:migrate:deploy
```

Khởi động API và worker trong hai terminal cùng thư mục:

```sh
npm run start:api
npm run start:worker
```

Để worker xử lý furigana, cài Python và các gói đã ghim trong môi trường riêng. Ví dụ trên PowerShell:

```powershell
python -m venv .venv
.venv/Scripts/python.exe -m pip install --only-binary=:all: -r nlp/requirements.txt
$env:PYTHON_BIN = (Resolve-Path .venv/Scripts/python.exe).Path
npm.cmd run start:worker
```

Khi triển khai bằng Docker, build `docker build --target api -t cnweb-api .` hoặc `docker build --target worker -t cnweb-worker .`. Target worker đóng gói Python, SudachiPy và từ điển. Target `build` có Prisma CLI và schema để chạy migration riêng.

- `GET /api/v1/health/live` kiểm tra tiến trình API.
- `GET /api/v1/health/ready` kiểm tra kết nối PostgreSQL. Redis gián đoạn được ghi log riêng để luồng đọc có thể tiếp tục.
- `GET /api/v1/openapi.json` trả hợp đồng OpenAPI.

## Kiểm tra API → worker

Đặt `SMOKE_TOKEN` ngẫu nhiên dài ít nhất 32 ký tự trong môi trường API local hoặc staging. Route thử trả 404 nếu token chưa cấu hình hoặc không khớp. Để tắt route sau khi kiểm tra, bỏ token khỏi cấu hình API.

```sh
curl -i -X POST http://127.0.0.1:3001/api/v1/internal/smoke \
  -H "Authorization: Bearer <SMOKE_TOKEN>"
```

Phản hồi `202` chứa `jobId` và `requestId`. Tìm hai ID trong log `smoke_enqueued` của API và `smoke_completed` của worker. Bảng `smoke_results` xác nhận worker đã ghi cùng hai ID xuống PostgreSQL.

## Biên tập và danh mục

Chạy [web Next.js](../frontend/README.md) để đăng nhập Google và mở trang biên tập. NestJS dùng vai trò trong PostgreSQL cho mọi thao tác biên tập. `EDITOR_TOKEN` của bước 2 đã được thay bằng phiên Auth.js và xác nhận ngắn hạn từ Next.js.

- `GET /api/v1/episodes?q=...&page=1` trả metadata các tập đã xuất bản, tìm theo tên tập, series hoặc kênh. Metadata không chứa YouTube ID hay transcript.
- `GET /api/v1/series` liệt kê series đã có tập xuất bản. Dùng `GET /api/v1/episodes?series=<slug>` để lấy các tập trong series theo số tập.
- `GET /api/v1/episodes/:id` trả bản công khai hiện hành. Khách chỉ đọc được tập `SAMPLE`. Tập `MEMBER` yêu cầu tài khoản đang hoạt động.
- Tập tạo mới và tập có sẵn từ bước 2 mặc định `MEMBER`. Biên tập viên có thể đổi quyền xem ở CMS. Khi triển khai bước 3, tắt instance API bước 2 trước khi công bố giới hạn mới, vì bản cũ vẫn đọc được tập đã xuất bản.
- SRT/VTT nhập câu gốc và timing. Sau khi nhập, bổ sung bản dịch và chọn người nói theo từng câu trong CMS. Lưu chỉnh sửa trên bảng giữ nguyên ID cue. Nhập lại SRT/VTT tạo cue mới. Dùng **Tải JSON bản đã lưu** khi cần sửa câu gốc hoặc timing rồi nhập lại. Giữ `id` với cue tương ứng và bỏ `id` với cue mới. JSON gốc có dạng `{ "cues": [{ "startMs": 500, "endMs": 2500, "text": "日本語", "translation": "Tiếng Nhật" }] }`.
- `GET /api/v1/editorial/episodes?page=1&q=...` tìm theo tiêu đề và trả `{ episodes, page, hasMore }` với 25 tập mỗi trang. Khi không truyền `page` hoặc `q`, API giữ dạng mảng và giới hạn 100 tập như trước.
- Worker định kỳ giao việc qua BullMQ, thử lại tối đa ba lần và khôi phục job chờ nếu mất dữ liệu hàng đợi. Có thể xuất bản khi NLP còn chờ hoặc lỗi nếu tất cả cue đã được duyệt. Xuất bản lại sau khi nháp chuyển sang `READY` để đưa furigana lên trang xem.

## Quản lý vai trò

Sau khi người dùng đăng nhập Google lần đầu, lấy ID tài khoản trên trang chủ. Người vận hành có quyền truy cập PostgreSQL của đúng môi trường chạy:

```sh
npm run account:role -- <account-id> EDITOR
```

Dùng `LEARNER` để thu hồi quyền biên tập. NestJS đọc vai trò từ PostgreSQL cho từng request nên thay đổi có hiệu lực ngay, kể cả khi cookie Auth.js còn hạn.

## Bước 4 · Từ điển, sổ tay và tiến độ

Sau khi chạy migration, tải `JMdict_e.gz` và `kanjidic2.xml.gz` từ [kho EDRDG](https://www.edrdg.org/pub/Nihongo/). Chạy từ máy vận hành có Python, Node.js và quyền ghi PostgreSQL. Dùng tệp XML đáng tin cậy. Dữ liệu nguồn không nằm trong Git.

```sh
npm run dictionary:import -- jmdict <đường-dẫn/JMdict_e.gz>
npm run dictionary:import -- kanjidic <đường-dẫn/kanjidic2.xml.gz>
```

Importer cập nhật theo ID gốc, nên có thể chạy lại sau lỗi và giữ tham chiếu trong sổ tay. Tra cứu chính xác theo cách viết hoặc cách đọc đã nhập. UI hiển thị nghĩa cùng mã ngôn ngữ. Bộ JMdict tiếng Anh dùng cho beta không cung cấp bản dịch Việt. Nguồn và điều kiện phân phối được ghi trong [giấy phép EDRDG](https://www.edrdg.org/edrdg/licence.html).

Để bổ sung nghĩa Việt đã duyệt, chuẩn bị CSV UTF-8 với header `entryId,meaningVi,source`, một dòng cho mỗi ID có sẵn trong từ điển. Có thể dùng dấu chấm phẩy để ngăn nhiều nghĩa trong một ô. Dùng dấu ngoặc kép CSV nếu ô có dấu phẩy hoặc xuống dòng. Sau khi chạy migration và build, dùng `npm run dictionary:import-vi -- <file.csv>`. Lệnh kiểm tra toàn bộ tệp trước khi ghi. Nhập lại JMdict/KANJIDIC2 không ghi đè nghĩa Việt.

Khi triển khai tra theo cả từ, cập nhật API trước rồi cập nhật worker cùng script SudachiPy. Với tập đã xuất bản từ trước, mở bản nháp và lưu lại JSON giữ nguyên ID cue, chờ NLP báo `READY` rồi xuất bản lại. Trong lúc đó, tập vẫn có thể tra thủ công.

- Sổ tay lưu ID từ điển hoặc ID tập và cue. Gỡ xuất bản hay bỏ cue làm mục đã lưu không còn mở được và vẫn cho xóa. Lúc xuất bản lại, cue giữ cùng ID sẽ tự mở lại theo bản mới.
- Tiến độ lưu theo tập và vị trí tính bằng mili giây. Trình xem gửi khoảng 15 giây một lần khi phát, và khi tạm dừng hoặc kết thúc. “Xem tiếp” chỉ liệt kê các tập còn xem được.
- Xóa tài khoản vô hiệu hóa ID tài khoản cũ, bỏ liên kết Google và xóa sổ tay/tiến độ trong một transaction. Mã nội bộ đã vô hiệu hóa được giữ để truy vết bản biên tập cũ. Đăng nhập lại bằng cùng tài khoản Google tạo tài khoản mới.
- Giới hạn beta theo cửa sổ 60 giây gồm 12 lần bắt đầu đăng nhập mỗi IP, 30 lượt tra từ cho khách theo IP, 90 lượt cho mỗi tài khoản và 15 lần lưu bản nháp mỗi biên tập viên. Khi vượt giới hạn, API trả `429` và `Retry-After`. Next.js chỉ tin header IP của Vercel khi chạy trên Vercel. Khi chạy local, các lượt khách dùng chung một bucket. Nếu Redis gián đoạn, tra từ và lưu nháp vẫn hoạt động, còn bắt đầu phiên đăng nhập mới trả `503`.

## Migration và staging

Tạo migration mới ở local với `npm run db:migrate:dev -- --name <ten>` và đưa SQL đã review vào Git. Staging cần PostgreSQL và Redis riêng, cùng `DATABASE_URL` và `REDIS_URL` cho API/worker. Dùng URL PostgreSQL có giới hạn thời gian kết nối và truy vấn. Với Redis TLS, dùng `rediss://`.

Trong mỗi lần triển khai, build từ cùng lockfile, chạy `npm run db:migrate:deploy` một lần bằng tác vụ triển khai có Prisma CLI, sau đó khởi động worker rồi API. Khi thay schema, thêm thay đổi tương thích trước và chỉ xóa cấu trúc cũ sau khi phiên bản cũ cùng job cũ đã ngừng sử dụng. Hai tiến trình đọc được `SIGTERM` để đóng kết nối. Worker đợi job đang xử lý trước khi đóng kết nối PostgreSQL.

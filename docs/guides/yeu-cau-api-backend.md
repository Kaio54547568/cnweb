# Yêu cầu bổ sung API cho backend

Giao diện Figma (`apps/web/figma-ui`) đã nối API hiện có. Tài liệu này liệt kê phần backend cần bổ sung để giao diện hiển thị đầy đủ. FE đã đọc sẵn các trường mới dưới dạng tùy chọn: khi backend trả thêm thì giao diện tự hiện, chưa trả thì ẩn hoặc dùng khối giữ chỗ, nên hai bên có thể làm độc lập.

Quyết định sản phẩm đã chốt: đăng nhập chỉ Google; bỏ lưu series; ghi chú ngữ pháp và level từng câu hoãn sang giai đoạn 2; ảnh bìa do API trả `thumbnailUrl` dựng từ YouTube ID.

## Bảng yêu cầu

| # | Ưu tiên | API | Yêu cầu | FE dùng ở | Hiện tại FE làm gì khi chưa có |
|---|---|---|---|---|---|
| 1 | P0 | `GET /episodes`, `GET /series`, `GET /learning/checkpoints` | Thêm `thumbnailUrl` (dựng từ YouTube ID, ví dụ `https://i.ytimg.com/vi/<id>/hqdefault.jpg`). Với series: ảnh của tập nổi bật/đầu tiên. | Thẻ series, dòng tập, Trang chủ | Hiện khối giữ chỗ. Chỉ Trang chủ lấy ảnh từ `youtubeId` của `GET /episodes/:id`. |
| 2 | P0 | `GET /episodes`, `GET /episodes/:id`, `GET /learning/checkpoints` | Thêm `durationMs` (DB đã có cột). | Thời lượng trên thẻ tập, thanh tiến độ, % đã xem | Thời lượng lấy từ YouTube player khi đang xem; thẻ tập không hiện thời lượng và % tiến độ. |
| 3 | P0 | `GET /series` | Thêm `description` (DB đã có), `episodeCount` (số tập đã xuất bản). | Thẻ series | Ẩn mô tả và nhãn "N tập". |
| 4 | P0 | `GET /episodes/:id` | Trả thêm metadata: `seriesSlug`, `seriesTitle`, `episodeNumber`, `channelName`, `visibility`, `level`. | Tiêu đề trang xem, "Tập trước/Tập sau" khi mở từ Sổ tay hoặc Xem tiếp | Mở từ Sổ tay/Xem tiếp chỉ có tiêu đề tập; không có tên series, số tập, nút chuyển tập. |
| 5 | P0 | `GET /learning/checkpoints` | Thêm tham số lặp `episodeId` (tối đa 32) để lấy vị trí xem của nhiều tập; khi không truyền giữ hành vi cũ (5 tập gần nhất). Phản hồi thêm `durationMs`, `episodeNumber`, `seriesTitle`. | Tiến độ trên thẻ ở Kho nội dung, "Đang học dở" | Chỉ biết tiến độ của 5 tập gần nhất. |
| 6 | P1 | `GET /dictionary` | Mỗi mục trả thêm `partsOfSpeech: string[]` (từ JMdict; nên có nhãn tiếng Việt) và `jlptLevel` (N5–N1, nếu có nguồn dữ liệu được phép dùng). | Hộp tra từ, thẻ từ ở Sổ tay | Ẩn từ loại và JLPT. |
| 7 | P1 | `GET /learning/bookmarks` | Với bookmark câu, trả thêm `cue.ruby`/`cue.words` để hiện furigana trong Sổ tay. | Thẻ câu trong Sổ tay | Hiện câu gốc dạng chữ thường, không furigana. |
| 8 | P1 | `POST /learning/bookmarks`, `GET /learning/bookmarks` | Bookmark từ nhận thêm `sourceEpisodeId`, `sourceCueId` (tùy chọn); danh sách trả lại cùng `episodeTitle`, `startMs`. | Thẻ từ ở Sổ tay ("Nguồn: tập X (00:14)", "Mở video") | Thẻ từ không có nguồn và không có nút mở video. |
| 9 | P1 | `GET /learning/bookmarks/summary` (mới) | Trả `{ words: number, cues: number }`. | Badge Sổ tay, thống kê hồ sơ | Badge chỉ đếm các mục đã tải (tối đa trang đầu 25). |
| 10 | P2 | `GET /series/:slug` (mới) | Chi tiết series kèm danh sách tập (đã sắp theo số tập). | Mục "Các tập: …" | FE gọi `GET /episodes?series=<slug>`; không bắt buộc. |
| 11 | P2 | `GET /episodes` | Thêm `level` và `genre` ở cấp tập (kế thừa từ series, tập lẻ gán trực tiếp). | Nhãn trình độ trên dòng tập, bộ lọc trình độ cho tập lẻ | Level lấy theo series; tập lẻ không có level. |
| 12 | P2 | `GET /episodes?q=` | `q` khớp cả `genre` của series. | Ô tìm kiếm | Chỉ khớp tên tập, series, kênh. |
| 13 | Giai đoạn 2 | `GET /episodes/:id` | Mỗi cue thêm `grammarNote`, `level` (bảng `line_analyses`, biên tập viên duyệt). | Ghi chú ngữ pháp dưới từng câu | Không hiển thị (component đã hỗ trợ sẵn). |

## Lưu ý khi thêm API

- **BFF của web có danh sách đường dẫn cho phép** (`apps/web/app/api/v1/[...path]/route.ts`). Endpoint mới (mục 9, 10) và tham số mới (mục 5) cần FE thêm vào danh sách đó. Báo FE khi backend sẵn sàng.
- Giữ `private, no-store` cho dữ liệu theo người dùng (checkpoints, bookmarks).
- Tên trường dùng camelCase, thời gian bằng mili giây như các API hiện tại.
- Tập `MEMBER` với khách: `GET /episodes/:id` đã trả `401`, FE hiện lời nhắc đăng nhập Google. Giữ hành vi này.

## FE đã làm, backend không cần xử lý

Đăng nhập Google, trình xem YouTube đồng bộ phụ đề, tra từ (kể cả tra thủ công), lưu câu/từ, Sổ tay, xem tiếp, hồ sơ và xóa tài khoản, xử lý lỗi 401/403/404/409/413/429, tập trước/sau theo series.

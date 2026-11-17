# Tổng quan sản phẩm

Nguồn: "Kế hoạch phát triển website học ngoại ngữ qua video (tương tự Akaiwa)" (5/11/2026). Đây là bản tóm tắt dạng text để cả đội và công cụ AI đọc được; khi kế hoạch thay đổi, sửa file này.

## Mục tiêu

Ra mắt MVP sau khoảng 16 tuần (8 sprint 2 tuần) với đội 6–7 người, tập trung vào **trình xem video có phụ đề song ngữ đồng bộ**, rồi mở rộng sang luyện tập, giáo trình và extension.

Đối tượng đầu tiên: người Việt học tiếng Nhật (N4–N2); sau đó Hàn, Trung, Anh. Video lấy từ YouTube qua trình nhúng chính thức.

## Phạm vi tính năng

| Tính năng | Mô tả | Giai đoạn |
|---|---|---|
| Tài khoản | Đăng ký/đăng nhập email + Google, hồ sơ, ngôn ngữ đang học, trình độ (N5–N1) | 1 – MVP |
| Kho nội dung | Trang chủ, danh mục series/tập, lọc theo trình độ/thể loại/kênh, tìm kiếm | 1 – MVP |
| Trình xem học tập | YouTube IFrame Player, transcript đồng bộ, click câu để tua, lặp câu, chỉnh tốc độ, ẩn/hiện bản dịch | 1 – MVP |
| Furigana & tra từ | Tách từ, furigana tự động; bấm từ xem nghĩa, cách đọc, Kanji | 1 – MVP |
| Lưu câu / từ | Nút tim lưu câu, lưu từ vào sổ tay | 1 – MVP |
| CMS nội dung | Nhập video, tải phụ đề (SRT/VTT/JSON), sửa bản dịch, gán người nói | 1 – MVP |
| Phân tích câu | Giải thích ngữ pháp, từ vựng từng câu (AI nháp, biên tập viên duyệt) | 2 |
| Luyện tập | Flashcard SRS, nghe–chép chính tả, shadowing có ghi âm | 2 |
| Bảng học | Tiến độ, chuỗi ngày học, số từ đã thuộc, lịch ôn | 2 |
| Gói trả phí | Giới hạn miễn phí, thanh toán (VNPay/MoMo/Stripe) | 2 |
| Giáo trình | Lộ trình theo cấp độ, ghép video thành bài học | 3 |
| Extension trình duyệt | Phụ đề song ngữ trên YouTube/Netflix, lưu từ về tài khoản | 3 |
| Cộng đồng sub | Người dùng đóng góp/sửa phụ đề, ghi công, kiểm duyệt | 3 |
| Đa ngôn ngữ | Thêm Hàn, Trung, Anh; ứng dụng di động | 3 |

## Kiến trúc & tech stack

Monolith chia mô-đun (một API, một DB), tách worker xử lý phụ đề chạy nền ngay từ đầu. Video không lưu trên server, phát qua YouTube. Web, CMS và extension đều gọi chung một API.

| Lớp | Lựa chọn |
|---|---|
| Frontend | Next.js + TypeScript, Tailwind CSS, shadcn/ui (SSR cho trang tập phim) |
| Trình phát | YouTube IFrame Player API; đọc thời gian phát mỗi 100–250 ms để tô sáng câu |
| Backend | NestJS (REST + OpenAPI) |
| Cơ sở dữ liệu | PostgreSQL + Prisma; token lưu JSONB |
| Cache, hàng đợi | Redis + BullMQ |
| Tìm kiếm | Meilisearch |
| Xử lý tiếng Nhật | SudachiPy hoặc MeCab + UniDic; từ điển JMdict, KANJIDIC (CC BY-SA, phải ghi nguồn EDRDG) |
| AI | API mô hình ngôn ngữ lớn: dịch nháp, phân tích ngữ pháp; biên tập viên duyệt |
| Đăng nhập | Auth.js (email, Google) |
| Thanh toán | VNPay, MoMo; Stripe cho quốc tế |
| Hạ tầng | Vercel (web); Railway/Fly.io/VPS (API, worker); Cloudflare CDN |
| Giám sát | Sentry, PostHog |
| Extension | WXT hoặc Plasmo (Manifest V3), dùng chung UI với web |

## Mô hình dữ liệu chính

Trung tâm là `subtitle_lines`: mỗi dòng có mốc thời gian, câu gốc đã tách từ và bản dịch. Thiết kế đúng từ sprint 1 để tránh migrate lớn.

| Bảng | Trường chính |
|---|---|
| users | id, email, tên, ngôn ngữ đang học, trình độ, gói (free/premium) |
| channels | id, tên, nguồn (YouTube), ảnh |
| series | id, tiêu đề, mô tả, ngôn ngữ, trình độ, thể loại, slug |
| episodes | id, series_id, số tập, youtube_id, thời lượng, trạng thái xuất bản (URL `/xem/<series>/ep01`) |
| speakers | id, episode_id, tên, màu/avatar |
| subtitle_lines | id, episode_id, speaker_id, start_ms, end_ms, text, tokens (JSONB: mặt chữ, cách đọc, từ gốc, từ loại), translation_vi — index `(episode_id, start_ms)` |
| line_analyses | line_id, giải thích ngữ pháp, từ vựng nổi bật, trạng thái duyệt |
| dictionary_entries | id, mặt chữ, cách đọc, nghĩa tiếng Việt, JLPT (nhập từ JMdict + dịch sang tiếng Việt) |
| saved_items | user_id, loại (câu/từ), ref_id, ghi chú |
| review_cards | user_id, item_id, độ khó, ngày ôn tiếp, số lần ôn (FSRS hoặc SM-2) |
| watch_progress | user_id, episode_id, vị trí, hoàn thành |
| subscriptions | user_id, gói, cổng thanh toán, ngày hết hạn |
| contributors | user_id, episode_id, vai trò (sub, dịch, duyệt) |

## Lộ trình

MVP 16 tuần, 5 chặng, 3 mốc kiểm tra. **Không qua mốc "Prototype chạy" thì chưa làm tiếp**, vì đồng bộ phụ đề với YouTube là phần kỹ thuật khó nhất. Nhập nội dung chạy song song từ tuần 5 để đủ 100 tập lúc beta. Giai đoạn 2 bắt đầu thu phí, giai đoạn 3 mở rộng nền tảng.

## Nhân sự

PO/PM 1; UI/UX 1 (bán thời gian); Frontend 2; Backend 1–2; Biên tập nội dung tiếng Nhật 1–2; QA kiêm nhiệm. Scrum sprint 2 tuần, task trên Jira/Linear, code trên GitHub với CI lint + test, có staging trước production.

## Rủi ro & ràng buộc cần nhớ khi code

- **Bản quyền:** chỉ phát qua YouTube IFrame, không tải lại/lưu trữ video; có quy trình gỡ nội dung khi bị khiếu nại.
- Video bị xóa/chặn nhúng: job định kỳ kiểm tra, tự ẩn tập lỗi, báo biên tập viên.
- Chất lượng phụ đề: AI dịch nháp + người duyệt; nút báo lỗi từng câu; công cụ chỉnh thời gian trong CMS.
- Chi phí AI: chạy một lần khi nhập nội dung, cache kết quả, không gọi AI theo lượt xem.
- Dữ liệu cá nhân: tuân thủ Nghị định 13/2023/NĐ-CP.
- Thanh toán: dùng cổng có phép, không tự lưu thông tin thẻ.
- Extension: chỉ đọc phụ đề có sẵn, xin quyền tối thiểu.

## KPI 3 tháng sau ra mắt

≥ 150 tập đã duyệt / ≥ 20 series; 5.000 đăng ký; 1.000 WAU; quay lại 7 ngày ≥ 25%; xem trung bình ≥ 15 phút/phiên; ≥ 10 câu/từ lưu mỗi người; chuyển đổi trả phí 2–4% (sau giai đoạn 2).

## Bước tiếp theo

- [ ] Chốt đối tượng và ngôn ngữ đầu tiên (đề xuất: người Việt học tiếng Nhật N4–N2)
- [ ] Phỏng vấn 10–15 người học
- [ ] Chọn 20 series thử nghiệm, kiểm tra video cho phép nhúng
- [ ] Wireframe trang xem tập (desktop + mobile)
- [ ] Prototype kỹ thuật: 1 video YouTube + transcript đồng bộ + furigana
- [ ] Hỏi luật sư về bản quyền trước khi thu phí
- [ ] Tạo repo, CI, staging; bắt đầu sprint 1

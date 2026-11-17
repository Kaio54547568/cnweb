# apps/worker (`@cnweb/worker`)

Worker chạy nền bằng BullMQ + Redis. Khi biên tập viên tải phụ đề, API đưa job vào hàng đợi; worker:

1. Chia/gộp cue theo thời gian.
2. Tách từ, sinh furigana, romaji (SudachiPy hoặc MeCab + UniDic; từ điển JMdict/KANJIDIC).
3. Dịch nháp và phân tích ngữ pháp/từ vựng bằng API mô hình ngôn ngữ lớn — chạy một lần mỗi tập và cache.
4. Job định kỳ kiểm tra video YouTube bị xóa/chặn nhúng.

Tham khảo ý tưởng ở `prototypes/transcript-tool/backend/app/pipeline/` (Python). Nếu phần NLP chạy bằng Python, đặt thành service riêng trong thư mục này và ghi ADR.

Trạng thái: chưa khởi tạo.

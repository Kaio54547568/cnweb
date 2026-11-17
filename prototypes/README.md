# prototypes

Mã thử nghiệm đã có trước khi dựng cấu trúc monorepo. **Chỉ để tham khảo, không phát triển thêm, không import vào `apps/` hay `packages/`.**

- `transcript-tool/` — công cụ Python (FastAPI + SudachiPy + Whisper + Claude) tạo transcript song ngữ có mốc thời gian, furigana, romaji. Xem `transcript-tool/README.md` để chạy thử. Phần `backend/app/pipeline/` là nguồn ý tưởng cho worker trong `apps/api`.

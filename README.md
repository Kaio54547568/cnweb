# cnweb — Học ngoại ngữ qua video

Website cho người Việt học tiếng Nhật qua video YouTube: phụ đề song ngữ đồng bộ, furigana, tra từ, lưu câu/từ. Lấy cảm hứng từ Akaiwa.

- Tổng quan sản phẩm, phạm vi MVP, mô hình dữ liệu: [docs/product/overview.md](docs/product/overview.md)
- Quy ước làm việc (cho người và cho công cụ AI): [AGENTS.md](AGENTS.md)
- Hướng dẫn đóng góp: [CONTRIBUTING.md](CONTRIBUTING.md)

## Cấu trúc

```
apps/        web, cms, api, worker, extension
packages/    shared, ui, config
infra/       docker-compose cho môi trường dev
docs/        product, architecture, adr, guides
scripts/     script tiện ích
prototypes/  mã thử nghiệm cũ (chỉ tham khảo)
```

Mô tả từng thư mục xem trong README của thư mục đó.

## Bắt đầu

Yêu cầu: Node.js ≥ 22, pnpm, Docker.

```bash
pnpm install
cp .env.example .env
docker compose -f infra/docker-compose.yml up -d
pnpm dev
```

Các app trong `apps/` hiện mới là thư mục trống; chúng sẽ được khởi tạo ở các PR tiếp theo (xem [docs/guides/getting-started.md](docs/guides/getting-started.md)).

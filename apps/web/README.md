# apps/web (`@cnweb/web`)

Giao diện người học "Kotoba", được tích hợp từ bản thiết kế Figma Make. React 19 + Vite + Tailwind CSS v4 + lucide-react.

```bash
pnpm --filter @cnweb/web dev      # http://localhost:3000
pnpm --filter @cnweb/web build
```

## Cấu trúc `src/`

- `App.tsx`, `main.tsx`, `index.css` — điểm vào, style toàn cục (Tailwind v4)
- `components/` — design system (`DesignSystem*.tsx`) và các màn hình MVP (`MVPScreens.tsx`)
- `wireframes/` — wireframe các màn hình
- `data/mockData.ts` — dữ liệu giả; thay bằng gọi `apps/api` khi API sẵn sàng

Alias `@` trỏ tới `src/`.

## Lưu ý

Hiện là SPA thuần với dữ liệu giả. Kế hoạch gốc dự kiến Next.js (SSR cho trang tập phim, SEO); cần quyết định có chuyển sang Next.js hay không và ghi vào `docs/adr/`.

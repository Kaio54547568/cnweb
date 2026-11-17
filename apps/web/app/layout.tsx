import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kotoba — Học tiếng Nhật qua video',
  description:
    'Học tiếng Nhật qua video YouTube với phụ đề Nhật–Việt, furigana và sổ tay lưu từ vựng, câu hữu ích.',
};

// Áp dụng chủ đề đã lưu (hoặc theo hệ thống) trước khi vẽ để không bị nháy màu.
const themeScript = `(function(){try{var t=localStorage.getItem("kotoba-theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme","dark")}})();`;

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

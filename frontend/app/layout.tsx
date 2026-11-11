import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body style={{ margin: '2rem auto', maxWidth: '58rem', padding: '0 1rem', fontFamily: 'system-ui' }}>
        {children}
      </body>
    </html>
  );
}

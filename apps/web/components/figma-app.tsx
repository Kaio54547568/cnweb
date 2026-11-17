'use client';

import dynamic from 'next/dynamic';
import { SessionProvider } from 'next-auth/react';

// Giao diện Figma là SPA dùng window/localStorage nên chỉ render ở client.
const App = dynamic(() => import('@/figma-ui/App'), { ssr: false });

export function FigmaApp() {
  return (
    <SessionProvider>
      <App />
    </SessionProvider>
  );
}

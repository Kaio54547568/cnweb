'use client';

import dynamic from 'next/dynamic';

// Giao diện Figma là SPA dùng window/localStorage nên chỉ render ở client.
const App = dynamic(() => import('@/figma-ui/App'), { ssr: false });

export function FigmaApp() {
  return <App />;
}

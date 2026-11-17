import type { ReactNode } from 'react';
import { SiteShell } from '@/components/site-shell';

/** Khung cho các trang nối API thật (danh mục, tài khoản, Sổ tay, biên tập). */
export default function LegacyLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}

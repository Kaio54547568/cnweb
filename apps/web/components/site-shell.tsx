import { BookOpen, Library, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';

const NAV = [
  { href: '/catalog', label: 'Kho nội dung (API)', icon: Library },
  { href: '/learning', label: 'Sổ tay', icon: BookOpen },
  { href: '/account', label: 'Tài khoản', icon: UserRound },
];

/** Khung chung: sidebar 240px trên desktop, thanh điều hướng ngang trên mobile. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen md:flex">
      <aside
        aria-label="Điều hướng chính"
        className="border-b border-line bg-canvas p-4 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r"
      >
        <a href="/" className="mb-4 block px-2 text-xl font-bold text-fg">
          Koto<span className="text-brand">ba</span>
        </a>
        <nav aria-label="Menu chính" className="flex gap-1 md:flex-col">
          {NAV.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-fg"
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mx-auto w-full max-w-[1280px]">{children}</div>
      </main>
    </div>
  );
}

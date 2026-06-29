'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/onboarding';

  return (
    <div className={isPublicPage ? 'app-shell-public' : 'app-shell'}>
      {!isPublicPage && <Sidebar />}
      <main className={isPublicPage ? 'main-content-public' : 'main-content'}>
        {children}
      </main>
    </div>
  );
}

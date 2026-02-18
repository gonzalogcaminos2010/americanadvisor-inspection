'use client';

import { Sidebar } from './sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex">
      <Sidebar />

      {/* Desktop: offset by sidebar width. Mobile: full width with top bar offset */}
      <main className="flex-1 lg:ml-64 mt-14 lg:mt-0 overflow-y-auto bg-gray-50 p-4 lg:p-6">
        {children}
      </main>
    </div>
  );
}

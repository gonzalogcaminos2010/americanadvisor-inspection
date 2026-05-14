'use client';

import { useAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui/spinner';
import { InspectorSidebar } from '@/components/layout/inspector-sidebar';

export default function InspectorLayout({ children }: { children: React.ReactNode }) {
  // Middleware already redirects unauthenticated users to /login.
  // We only show a spinner while the client-side auth state is hydrating.
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      <InspectorSidebar />
      <main className="flex-1 lg:ml-64 mt-14 lg:mt-0 overflow-y-auto bg-gray-50 p-4 lg:p-6">
        {children}
      </main>
    </div>
  );
}

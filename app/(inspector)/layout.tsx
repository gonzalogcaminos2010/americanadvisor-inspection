'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Spinner } from '@/components/ui/spinner';
import { InspectorSidebar } from '@/components/layout/inspector-sidebar';

export default function InspectorLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuthGuard();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
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

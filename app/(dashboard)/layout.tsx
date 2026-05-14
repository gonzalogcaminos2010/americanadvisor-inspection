'use client';

import { useAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui/spinner';
import { AppLayout } from '@/components/layout/app-layout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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

  return <AppLayout>{children}</AppLayout>;
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Inspection, PaginatedResponse } from '@/types';
import {
  LayoutDashboard,
  FileCheck,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { label: 'Inicio', href: '/inspector', icon: LayoutDashboard, exact: true },
  { label: 'Mis Ordenes', href: '/inspector/mis-ordenes', icon: FileCheck },
  { label: 'Mis Inspecciones', href: '/inspector/mis-inspecciones', icon: ClipboardCheck, badgeKey: 'returned' as const },
];

export function InspectorSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: returnedData } = useQuery<PaginatedResponse<Inspection>>({
    queryKey: ['inspector-returned-count', user?.id],
    queryFn: () => api.get('/inspections', { params: { inspector_id: user?.id, status: 'returned', per_page: 1 } }),
    enabled: !!user?.id,
    refetchInterval: 60000,
  });
  const returnedCount = returnedData?.meta?.total ?? 0;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-600 text-white font-bold text-sm">
          AI
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">Inspector</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
          PANEL INSPECTOR
        </p>
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href) && !navItems.some(
                  (other) => other !== item && !other.exact && pathname.startsWith(other.href) && other.href.length > item.href.length
                );
            const Icon = item.icon;
            const badgeCount = item.badgeKey === 'returned' ? returnedCount : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {badgeCount > 0 && (
                  <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-gray-200 px-4 py-4">
        {user && (
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="ml-2 p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Cerrar sesion"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 px-4 h-14 flex items-center">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="ml-2 text-lg font-bold text-gray-900">Inspector</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-white border-r border-gray-200">
        {sidebarContent}
      </aside>
    </>
  );
}

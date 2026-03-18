'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { PaginatedResponse, Inspection } from '@/types';
import {
  LayoutDashboard,
  Users,
  Wrench,
  ClipboardList,
  FileCheck,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles?: string[];
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const baseNavGroups: NavGroup[] = [
  {
    label: 'GESTIÓN',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Clientes', href: '/clients', icon: Users },
      { label: 'Equipos', href: '/equipment', icon: Wrench },
    ],
  },
  {
    label: 'OPERACIONES',
    items: [
      { label: 'Solicitudes', href: '/inspection-requests', icon: ClipboardList },
      { label: 'Órdenes de Trabajo', href: '/work-orders', icon: FileCheck },
    ],
  },
  {
    label: 'INSPECCIONES',
    items: [
      { label: 'Plantillas', href: '/templates', icon: FileText },
      { label: 'Inspecciones', href: '/inspections', icon: ClipboardCheck },
      { label: 'Revisiones Pendientes', href: '/revisiones', icon: ShieldCheck, roles: ['supervisor', 'admin'] },
      { label: 'Hallazgos', href: '/findings', icon: AlertTriangle },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSupervisorOrAdmin = user?.role === 'supervisor' || user?.role === 'admin';

  const { data: submittedCount } = useQuery<number>({
    queryKey: ['inspections-submitted-count'],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Inspection>>('/inspections?status=SUBMITTED&per_page=1');
      return res.meta?.total ?? 0;
    },
    enabled: isSupervisorOrAdmin,
    refetchInterval: 60000,
  });

  const navGroups = baseNavGroups.map((group) => ({
    ...group,
    items: group.items
      .filter((item) => {
        if (!item.roles) return true;
        return user?.role && item.roles.includes(user.role);
      })
      .map((item) => {
        if (item.href === '/revisiones' && submittedCount != null) {
          return { ...item, badge: submittedCount };
        }
        return item;
      }),
  }));

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm">
          AA
        </div>
        <span className="text-lg font-bold text-gray-900">American Advisor</span>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label} className={groupIndex > 0 ? 'mt-6' : ''}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {item.label}
                    {item.badge != null && item.badge > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 px-1.5">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
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
        <span className="ml-2 text-lg font-bold text-gray-900">American Advisor</span>
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

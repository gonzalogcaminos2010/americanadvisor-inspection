'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Wrench, 
  ClipboardList, 
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface DashboardStats {
  success: boolean;
  data: {
    clients: { total: number; active: number };
    equipment: { total: number; active: number };
    inspection_requests: {
      PENDING: number;
      IN_PROGRESS: number;
      COMPLETED: number;
      CANCELLED: number;
      total: number;
    };
    work_orders: {
      PENDING: number;
      IN_PROGRESS: number;
      COMPLETED: number;
      CANCELLED: number;
      total: number;
    };
    pending_orders_by_priority: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
      URGENT: number;
    };
  };
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats'),
    enabled: !!user,
  });

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const statsData = stats?.data?.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">American Advisor</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.name}</span>
              <button
                onClick={() => router.push('/login')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Bienvenido, {user.name}</p>
        </div>

        {statsData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Clientes"
                value={statsData.clients.total}
                subtitle={`${statsData.clients.active} activos`}
                icon={<Users className="h-6 w-6 text-blue-600" />}
                color="blue"
              />
              <StatCard
                title="Equipos"
                value={statsData.equipment.total}
                subtitle={`${statsData.equipment.active} activos`}
                icon={<Wrench className="h-6 w-6 text-green-600" />}
                color="green"
              />
              <StatCard
                title="Solicitudes"
                value={statsData.inspection_requests.total}
                subtitle={`${statsData.inspection_requests.PENDING} pendientes`}
                icon={<ClipboardList className="h-6 w-6 text-purple-600" />}
                color="purple"
              />
              <StatCard
                title="Órdenes de Trabajo"
                value={statsData.work_orders.total}
                subtitle={`${statsData.work_orders.PENDING} pendientes`}
                icon={<CheckCircle className="h-6 w-6 text-orange-600" />}
                color="orange"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Solicitudes de Inspección
                </h3>
                <div className="space-y-3">
                  <StatusItem 
                    label="Pendientes" 
                    value={statsData.inspection_requests.PENDING} 
                    icon={<Clock className="h-4 w-4" />}
                    color="yellow"
                  />
                  <StatusItem 
                    label="En Progreso" 
                    value={statsData.inspection_requests.IN_PROGRESS} 
                    icon={<AlertCircle className="h-4 w-4" />}
                    color="blue"
                  />
                  <StatusItem 
                    label="Completadas" 
                    value={statsData.inspection_requests.COMPLETED} 
                    icon={<CheckCircle className="h-4 w-4" />}
                    color="green"
                  />
                  <StatusItem 
                    label="Canceladas" 
                    value={statsData.inspection_requests.CANCELLED} 
                    icon={<XCircle className="h-4 w-4" />}
                    color="red"
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Órdenes de Trabajo Pendientes por Prioridad
                </h3>
                <div className="space-y-3">
                  <PriorityItem 
                    label="Urgente" 
                    value={statsData.pending_orders_by_priority.URGENT} 
                    color="red"
                  />
                  <PriorityItem 
                    label="Alta" 
                    value={statsData.pending_orders_by_priority.HIGH} 
                    color="orange"
                  />
                  <PriorityItem 
                    label="Media" 
                    value={statsData.pending_orders_by_priority.MEDIUM} 
                    color="yellow"
                  />
                  <PriorityItem 
                    label="Baja" 
                    value={statsData.pending_orders_by_priority.LOW} 
                    color="gray"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color 
}: { 
  title: string; 
  value: number; 
  subtitle: string; 
  icon: React.ReactNode; 
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ 
  label, 
  value, 
  icon, 
  color 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <span className={`p-1.5 rounded ${colorClasses[color]}`}>
          {icon}
        </span>
        <span className="ml-2 text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function PriorityItem({ 
  label, 
  value, 
  color 
}: { 
  label: string; 
  value: number; 
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-400',
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${colorClasses[color]}`} />
        <span className="ml-2 text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

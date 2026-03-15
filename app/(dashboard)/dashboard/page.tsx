'use client';

import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Users,
  Wrench,
  ClipboardList,
  AlertCircle,
  Clock,
  Plus,
  ClipboardCheck,
  ArrowRight,
  AlertTriangle,
  Activity,
  TrendingUp,
  FileCheck,
} from 'lucide-react';

interface StatsData {
  total_clients: number;
  total_equipment: number;
  total_inspections: number;
  pending_work_orders: number;
  pending_reviews: number;
  inspections_this_month: number;
  recent_inspections: Array<{
    id: number;
    status: string;
    equipment?: { name: string };
    created_at: string;
  }>;
}

interface ApiResponse {
  success: boolean;
  data: StatsData;
  message: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: stats, isLoading: statsLoading } = useQuery<ApiResponse>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats'),
    enabled: !!user,
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-slate-200" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-t-slate-800 animate-spin" />
          </div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Cargando</span>
        </div>
      </div>
    );
  }

  const statsData = stats?.data;
  if (!statsData) return null;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="dash-reveal" style={{ animationDelay: '0ms' }}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.15em]">
              Panel de Control
            </p>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
              Bienvenido, {user?.name?.split(' ')[0]}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Activity className="h-3.5 w-3.5" />
            <span>Ultima actualizacion: ahora</span>
          </div>
        </div>
      </div>

      {/* ── Pending Alert Strip ── */}
      {statsData.pending_work_orders > 0 && (
        <div className="dash-reveal" style={{ animationDelay: '60ms' }}>
          <button
            onClick={() => router.push('/work-orders')}
            className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4 text-left transition-all hover:shadow-lg hover:shadow-slate-900/20"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 dash-pulse" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {statsData.pending_work_orders} {statsData.pending_work_orders === 1 ? 'orden pendiente' : 'ordenes pendientes'}
                  </p>
                  {statsData.pending_reviews > 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {statsData.pending_reviews} pendientes de revision
                    </p>
                  )}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-amber-400" />
            </div>
          </button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KPICard
          title="Clientes"
          value={statsData.total_clients}
          sub="registrados"
          icon={Users}
          accent="blue"
          onClick={() => router.push('/clients')}
          delay={120}
        />
        <KPICard
          title="Equipos"
          value={statsData.total_equipment}
          sub="registrados"
          icon={Wrench}
          accent="emerald"
          onClick={() => router.push('/equipment')}
          delay={180}
        />
        <KPICard
          title="Inspecciones"
          value={statsData.total_inspections}
          sub={`${statsData.inspections_this_month} este mes`}
          icon={ClipboardList}
          accent="violet"
          onClick={() => router.push('/inspections')}
          delay={240}
        />
        <KPICard
          title="Ordenes Pend."
          value={statsData.pending_work_orders}
          sub={`${statsData.pending_reviews} por revisar`}
          icon={FileCheck}
          accent="amber"
          onClick={() => router.push('/work-orders')}
          delay={300}
        />
      </div>

      {/* ── Quick Actions ── */}
      <div className="dash-reveal" style={{ animationDelay: '350ms' }}>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.15em] mb-2.5">
          Acciones Rapidas
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <QuickAction
            label="Nueva Solicitud"
            icon={ClipboardList}
            onClick={() => router.push('/inspection-requests')}
          />
          <QuickAction
            label="Nueva Orden"
            icon={FileCheck}
            onClick={() => router.push('/work-orders')}
          />
          <QuickAction
            label="Nueva Plantilla"
            icon={Plus}
            onClick={() => router.push('/templates/builder')}
          />
          <QuickAction
            label="Ver Inspecciones"
            icon={ClipboardCheck}
            onClick={() => router.push('/inspections')}
          />
        </div>
      </div>

      {/* ── Recent Inspections ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className="dash-reveal bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden"
          style={{ animationDelay: '400ms' }}
        >
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Inspecciones Recientes
            </h3>
            <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
              {statsData.inspections_this_month} este mes
            </span>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {statsData.recent_inspections.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No hay inspecciones recientes</p>
            ) : (
              statsData.recent_inspections.map((insp) => (
                <div key={insp.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-600">
                      {insp.equipment?.name || `Inspeccion #${insp.id}`}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">{insp.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Summary */}
        <div
          className="dash-reveal bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden"
          style={{ animationDelay: '460ms' }}
        >
          <div className="px-5 pt-5 pb-3">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Resumen Operativo
            </h3>
          </div>
          <div className="px-5 pb-5 space-y-4">
            <MiniStat
              label="Ordenes Pendientes"
              value={statsData.pending_work_orders}
              icon={Clock}
              accent="amber"
            />
            <MiniStat
              label="Por Revisar"
              value={statsData.pending_reviews}
              icon={AlertCircle}
              accent="blue"
            />
            <MiniStat
              label="Inspecciones Este Mes"
              value={statsData.inspections_this_month}
              icon={TrendingUp}
              accent="emerald"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function KPICard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
  onClick,
  delay,
}: {
  title: string;
  value: number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  onClick: () => void;
  delay: number;
}) {
  const accents: Record<string, { bg: string; ring: string; text: string; iconBg: string }> = {
    blue: { bg: 'hover:border-blue-300', ring: 'ring-blue-500/10', text: 'text-blue-600', iconBg: 'bg-blue-50' },
    emerald: { bg: 'hover:border-emerald-300', ring: 'ring-emerald-500/10', text: 'text-emerald-600', iconBg: 'bg-emerald-50' },
    violet: { bg: 'hover:border-violet-300', ring: 'ring-violet-500/10', text: 'text-violet-600', iconBg: 'bg-violet-50' },
    amber: { bg: 'hover:border-amber-300', ring: 'ring-amber-500/10', text: 'text-amber-600', iconBg: 'bg-amber-50' },
  };
  const a = accents[accent] || accents.blue;

  return (
    <button
      onClick={onClick}
      className={`dash-reveal group relative bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 lg:p-5 text-left transition-all duration-200 ${a.bg} hover:shadow-md hover:ring-4 ${a.ring}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${a.iconBg}`}>
          <Icon className={`h-4 w-4 ${a.text}`} />
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-slate-300 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
      </div>
      <p className="dash-count text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight" style={{ animationDelay: `${delay + 150}ms` }}>
        {value}
      </p>
      <p className="text-xs font-semibold text-slate-500 mt-0.5">{title}</p>
      <p className="text-[11px] text-slate-400 mt-px">{sub}</p>
    </button>
  );
}

function QuickAction({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2.5 rounded-lg border border-slate-200/80 bg-white px-3.5 py-2.5 text-left transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
    >
      <Icon className="h-4 w-4 text-slate-400 transition-colors group-hover:text-slate-600" />
      <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-800 truncate">
        {label}
      </span>
    </button>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  const accents: Record<string, string> = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
      <Icon className={`h-4 w-4 ${accents[accent] || 'text-slate-500'}`} />
      <div className="min-w-0">
        <p className="text-lg font-extrabold text-slate-900 leading-tight tabular-nums">{value}</p>
        <p className="text-[11px] text-slate-400 truncate">{label}</p>
      </div>
    </div>
  );
}

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
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface MonthlyInspection {
  month: string;
  count: number;
  approved: number;
  rejected: number;
}

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
  // New fields — may not exist yet from the backend
  inspections_by_month?: MonthlyInspection[];
  approval_rate?: number;
  approved_count?: number;
  conditionally_approved_count?: number;
  rejected_count?: number;
  critical_findings_open?: number;
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

      {/* ── Section A: Inspecciones por mes ── */}
      <InspectionsByMonthChart data={statsData.inspections_by_month} />

      {/* ── Section B: Métricas de resultados ── */}
      <ResultsMetrics
        approvalRate={statsData.approval_rate}
        approvedCount={statsData.approved_count}
        conditionallyApprovedCount={statsData.conditionally_approved_count}
        rejectedCount={statsData.rejected_count}
        criticalFindingsOpen={statsData.critical_findings_open}
      />
    </div>
  );
}

/* ─── Chart helper ─── */

const MONTH_LABELS: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

function formatMonthLabel(month: string): string {
  const parts = month.split('-');
  const mm = parts[1] ?? '';
  return MONTH_LABELS[mm] ?? month;
}

/* ─── Section A ─── */

function InspectionsByMonthChart({ data }: { data?: MonthlyInspection[] }) {
  const chartData = data?.map((d) => ({ ...d, label: formatMonthLabel(d.month) }));

  return (
    <div
      className="dash-reveal bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden"
      style={{ animationDelay: '520ms' }}
    >
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Inspecciones por Mes
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5">Ultimos 6 meses</p>
      </div>

      {!chartData || chartData.length === 0 ? (
        <div className="px-5 pb-6">
          <div className="flex items-center justify-center h-[200px] rounded-lg bg-slate-50 border border-dashed border-slate-200">
            <div className="text-center space-y-1">
              <div className="flex justify-center gap-1">
                {[40, 60, 45, 70, 55, 80].map((h, i) => (
                  <div
                    key={i}
                    className="w-6 rounded-sm bg-slate-200 animate-pulse"
                    style={{ height: `${h}px`, animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
              <p className="text-xs font-medium text-slate-400 mt-3">Datos proximos</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 pb-5">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={22} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#cbd5e1' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    count: 'Total',
                    approved: 'Aprobadas',
                    rejected: 'Rechazadas',
                  };
                  return [value, labels[name] ?? name];
                }}
              />
              <Bar dataKey="count" name="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="approved" name="approved" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" name="rejected" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 px-1">
            <LegendDot color="bg-indigo-500" label="Total" />
            <LegendDot color="bg-emerald-500" label="Aprobadas" />
            <LegendDot color="bg-rose-500" label="Rechazadas" />
          </div>
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-[11px] font-medium text-slate-400">{label}</span>
    </div>
  );
}

/* ─── Section B ─── */

function ResultsMetrics({
  approvalRate,
  approvedCount,
  conditionallyApprovedCount,
  rejectedCount,
  criticalFindingsOpen,
}: {
  approvalRate?: number;
  approvedCount?: number;
  conditionallyApprovedCount?: number;
  rejectedCount?: number;
  criticalFindingsOpen?: number;
}) {
  const hasData =
    approvalRate !== undefined ||
    approvedCount !== undefined ||
    conditionallyApprovedCount !== undefined ||
    rejectedCount !== undefined;

  const rateColor =
    approvalRate === undefined
      ? 'bg-slate-300'
      : approvalRate >= 70
      ? 'bg-emerald-500'
      : approvalRate >= 40
      ? 'bg-amber-400'
      : 'bg-rose-500';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Tasa de aprobacion */}
      <div
        className="dash-reveal bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden"
        style={{ animationDelay: '580ms' }}
      >
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Tasa de Aprobacion
          </h3>
        </div>

        {!hasData ? (
          <div className="px-5 pb-6">
            <div className="flex items-center justify-center h-[120px] rounded-lg bg-slate-50 border border-dashed border-slate-200">
              <p className="text-xs font-medium text-slate-400">Datos proximos</p>
            </div>
          </div>
        ) : (
          <div className="px-5 pb-5 space-y-4">
            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {approvalRate !== undefined ? `${Math.round(approvalRate)}%` : '—'}
                </span>
                <span className="text-[11px] text-slate-400 font-medium pb-1">aprobadas</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${rateColor}`}
                  style={{ width: approvalRate !== undefined ? `${Math.min(100, Math.max(0, approvalRate))}%` : '0%' }}
                />
              </div>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-3 gap-2">
              <ResultCounter
                value={approvedCount}
                label="Aprobadas"
                colorText="text-emerald-600"
                colorBg="bg-emerald-50"
                colorBorder="border-emerald-100"
              />
              <ResultCounter
                value={conditionallyApprovedCount}
                label="Condicional"
                colorText="text-amber-600"
                colorBg="bg-amber-50"
                colorBorder="border-amber-100"
              />
              <ResultCounter
                value={rejectedCount}
                label="Rechazadas"
                colorText="text-rose-600"
                colorBg="bg-rose-50"
                colorBorder="border-rose-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Hallazgos criticos */}
      <div
        className="dash-reveal bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden"
        style={{ animationDelay: '620ms' }}
      >
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Hallazgos Criticos
          </h3>
        </div>

        {criticalFindingsOpen === undefined ? (
          <div className="px-5 pb-6">
            <div className="flex items-center justify-center h-[120px] rounded-lg bg-slate-50 border border-dashed border-slate-200">
              <p className="text-xs font-medium text-slate-400">Datos proximos</p>
            </div>
          </div>
        ) : (
          <div className="px-5 pb-5">
            {criticalFindingsOpen === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 flex-shrink-0">
                  <ShieldAlert className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-700">Sin hallazgos criticos</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Todos los hallazgos estan cerrados</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl bg-rose-50 border border-rose-200 px-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 flex-shrink-0">
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-rose-700 tabular-nums leading-none">
                    {criticalFindingsOpen}
                  </p>
                  <p className="text-xs font-semibold text-rose-600 mt-0.5">
                    {criticalFindingsOpen === 1 ? 'hallazgo critico abierto' : 'hallazgos criticos abiertos'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCounter({
  value,
  label,
  colorText,
  colorBg,
  colorBorder,
}: {
  value?: number;
  label: string;
  colorText: string;
  colorBg: string;
  colorBorder: string;
}) {
  return (
    <div className={`rounded-lg border ${colorBorder} ${colorBg} px-3 py-2.5 text-center`}>
      <p className={`text-xl font-extrabold tabular-nums ${colorText}`}>
        {value ?? '—'}
      </p>
      <p className={`text-[10px] font-semibold mt-0.5 ${colorText} opacity-80`}>{label}</p>
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

'use client';

import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Users,
  Wrench,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Plus,
  ClipboardCheck,
  ArrowRight,
  AlertTriangle,
  Activity,
  TrendingUp,
  Zap,
  FileCheck,
} from 'lucide-react';

interface StatsData {
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

  const urgentAndHigh =
    statsData.pending_orders_by_priority.URGENT +
    statsData.pending_orders_by_priority.HIGH;

  const totalPending =
    statsData.pending_orders_by_priority.URGENT +
    statsData.pending_orders_by_priority.HIGH +
    statsData.pending_orders_by_priority.MEDIUM +
    statsData.pending_orders_by_priority.LOW;

  const reqTotal = statsData.inspection_requests.total || 1;

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

      {/* ── Urgent Alert Strip ── */}
      {urgentAndHigh > 0 && (
        <div
          className="dash-reveal"
          style={{ animationDelay: '60ms' }}
        >
          <button
            onClick={() => router.push('/work-orders')}
            className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4 text-left transition-all hover:shadow-lg hover:shadow-slate-900/20"
          >
            {/* Animated accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 dash-pulse" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {urgentAndHigh} {urgentAndHigh === 1 ? 'orden requiere' : 'ordenes requieren'} atencion
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {statsData.pending_orders_by_priority.URGENT > 0 &&
                      `${statsData.pending_orders_by_priority.URGENT} urgente`}
                    {statsData.pending_orders_by_priority.URGENT > 0 &&
                      statsData.pending_orders_by_priority.HIGH > 0 &&
                      ' · '}
                    {statsData.pending_orders_by_priority.HIGH > 0 &&
                      `${statsData.pending_orders_by_priority.HIGH} alta prioridad`}
                  </p>
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
          value={statsData.clients.total}
          sub={`${statsData.clients.active} activos`}
          icon={Users}
          accent="blue"
          onClick={() => router.push('/clients')}
          delay={120}
        />
        <KPICard
          title="Equipos"
          value={statsData.equipment.total}
          sub={`${statsData.equipment.active} activos`}
          icon={Wrench}
          accent="emerald"
          onClick={() => router.push('/equipment')}
          delay={180}
        />
        <KPICard
          title="Solicitudes"
          value={statsData.inspection_requests.total}
          sub={`${statsData.inspection_requests.PENDING} pendientes`}
          icon={ClipboardList}
          accent="violet"
          onClick={() => router.push('/inspection-requests')}
          delay={240}
        />
        <KPICard
          title="Ordenes"
          value={statsData.work_orders.total}
          sub={`${statsData.work_orders.PENDING} pendientes`}
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

      {/* ── Analytics Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Solicitudes Breakdown */}
        <div
          className="dash-reveal bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden"
          style={{ animationDelay: '400ms' }}
        >
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Solicitudes de Inspeccion
            </h3>
            <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
              {statsData.inspection_requests.total} total
            </span>
          </div>
          <div className="px-5 pb-5 space-y-3">
            <StatusRow
              label="Pendientes"
              value={statsData.inspection_requests.PENDING}
              total={reqTotal}
              icon={Clock}
              color="amber"
            />
            <StatusRow
              label="En Progreso"
              value={statsData.inspection_requests.IN_PROGRESS}
              total={reqTotal}
              icon={AlertCircle}
              color="blue"
            />
            <StatusRow
              label="Completadas"
              value={statsData.inspection_requests.COMPLETED}
              total={reqTotal}
              icon={CheckCircle}
              color="emerald"
            />
            <StatusRow
              label="Canceladas"
              value={statsData.inspection_requests.CANCELLED}
              total={reqTotal}
              icon={XCircle}
              color="slate"
            />
          </div>
        </div>

        {/* Priority Breakdown */}
        <div
          className="dash-reveal bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden"
          style={{ animationDelay: '460ms' }}
        >
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Ordenes Pendientes por Prioridad
            </h3>
            <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
              {totalPending} pendientes
            </span>
          </div>
          <div className="px-5 pb-5">
            {/* Mini ring chart + legend */}
            <div className="flex items-center gap-6">
              <PriorityRing
                urgent={statsData.pending_orders_by_priority.URGENT}
                high={statsData.pending_orders_by_priority.HIGH}
                medium={statsData.pending_orders_by_priority.MEDIUM}
                low={statsData.pending_orders_by_priority.LOW}
                total={totalPending}
              />
              <div className="flex-1 space-y-2.5">
                <PriorityRow
                  label="Urgente"
                  value={statsData.pending_orders_by_priority.URGENT}
                  total={totalPending}
                  color="red"
                />
                <PriorityRow
                  label="Alta"
                  value={statsData.pending_orders_by_priority.HIGH}
                  total={totalPending}
                  color="amber"
                />
                <PriorityRow
                  label="Media"
                  value={statsData.pending_orders_by_priority.MEDIUM}
                  total={totalPending}
                  color="sky"
                />
                <PriorityRow
                  label="Baja"
                  value={statsData.pending_orders_by_priority.LOW}
                  total={totalPending}
                  color="slate"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Operational Summary Strip ── */}
      <div
        className="dash-reveal grid grid-cols-3 gap-3"
        style={{ animationDelay: '520ms' }}
      >
        <MiniStat
          label="En Progreso"
          value={statsData.work_orders.IN_PROGRESS}
          icon={TrendingUp}
          accent="blue"
        />
        <MiniStat
          label="Completadas"
          value={statsData.work_orders.COMPLETED}
          icon={CheckCircle}
          accent="emerald"
        />
        <MiniStat
          label="Hallazgos Abiertos"
          value={statsData.pending_orders_by_priority.URGENT + statsData.pending_orders_by_priority.HIGH}
          icon={Zap}
          accent="amber"
        />
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

function StatusRow({
  label,
  value,
  total,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  total: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;

  const colors: Record<string, { bar: string; icon: string; iconBg: string }> = {
    amber: { bar: 'bg-amber-400', icon: 'text-amber-600', iconBg: 'bg-amber-50' },
    blue: { bar: 'bg-blue-400', icon: 'text-blue-600', iconBg: 'bg-blue-50' },
    emerald: { bar: 'bg-emerald-400', icon: 'text-emerald-600', iconBg: 'bg-emerald-50' },
    slate: { bar: 'bg-slate-300', icon: 'text-slate-500', iconBg: 'bg-slate-50' },
  };
  const c = colors[color] || colors.slate;

  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-7 w-7 items-center justify-center rounded-md ${c.iconBg}`}>
        <Icon className={`h-3.5 w-3.5 ${c.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-600">{label}</span>
          <span className="text-xs font-bold text-slate-800 tabular-nums">{value}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${c.bar} dash-bar`}
            style={{ width: `${pct}%`, animationDelay: '600ms' }}
          />
        </div>
      </div>
    </div>
  );
}

function PriorityRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const dotColors: Record<string, string> = {
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    sky: 'bg-sky-500',
    slate: 'bg-slate-400',
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${dotColors[color] || 'bg-slate-400'}`} />
        <span className="text-xs font-medium text-slate-600">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-800 tabular-nums">{value}</span>
        <span className="text-[10px] text-slate-400 tabular-nums w-8 text-right">
          {total > 0 ? `${Math.round((value / total) * 100)}%` : '—'}
        </span>
      </div>
    </div>
  );
}

function PriorityRing({
  urgent,
  high,
  medium,
  low,
  total,
}: {
  urgent: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}) {
  const size = 96;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <div className="flex-shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={stroke}
          />
          <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" className="fill-slate-400 text-xs font-semibold">
            0
          </text>
        </svg>
      </div>
    );
  }

  const segments = [
    { value: urgent, color: '#ef4444' },
    { value: high, color: '#f59e0b' },
    { value: medium, color: '#0ea5e9' },
    { value: low, color: '#94a3b8' },
  ];

  let offset = circumference * 0.25; // Start from top

  return (
    <div className="flex-shrink-0 relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={stroke}
        />
        {/* Segments */}
        {segments.map((seg, i) => {
          if (seg.value === 0) return null;
          const segLength = (seg.value / total) * circumference;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${segLength} ${circumference - segLength}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              className="dash-arc"
              style={{
                '--arc-total': `${circumference}`,
                animationDelay: `${500 + i * 100}ms`,
              } as React.CSSProperties}
            />
          );
          offset += segLength;
          return el;
        })}
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold text-slate-900 leading-none tabular-nums">{total}</span>
        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">pend.</span>
      </div>
    </div>
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

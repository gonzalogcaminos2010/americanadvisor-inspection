'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { api } from '@/lib/api';
import { WorkOrder, WorkOrderStatus, PaginatedResponse } from '@/types';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Build the 6-week (42-cell) grid for a given month */
function buildCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { date: Date; isCurrentMonth: boolean }[] = [];

  // Leading days from previous month
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      date: new Date(prevYear, prevMonth, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }

  // Trailing days from next month
  const remaining = 42 - cells.length;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(nextYear, nextMonth, d), isCurrentMonth: false });
  }

  return cells;
}

function isoDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function scheduledDateKey(order: WorkOrder): string | null {
  if (!order.scheduled_date) return null;
  return order.scheduled_date.slice(0, 10);
}

// ─── status styles ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<WorkOrderStatus, { dot: string; bg: string; text: string }> = {
  [WorkOrderStatus.PENDING]: {
    dot: 'bg-blue-500',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
  },
  [WorkOrderStatus.IN_PROGRESS]: {
    dot: 'bg-yellow-500',
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-700',
  },
  [WorkOrderStatus.COMPLETED]: {
    dot: 'bg-green-500',
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-700',
  },
  [WorkOrderStatus.CANCELLED]: {
    dot: 'bg-gray-400',
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-500',
  },
};

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.PENDING]: 'Pendiente',
  [WorkOrderStatus.IN_PROGRESS]: 'En Progreso',
  [WorkOrderStatus.COMPLETED]: 'Completado',
  [WorkOrderStatus.CANCELLED]: 'Cancelado',
};

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_NAMES_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// ─── event chip component ────────────────────────────────────────────────────

function EventChip({
  order,
  onClick,
}: {
  order: WorkOrder;
  onClick: () => void;
}) {
  const status = order.status as WorkOrderStatus;
  const style = STATUS_STYLES[status] ?? STATUS_STYLES[WorkOrderStatus.PENDING];
  const label =
    order.items?.[0]?.equipment?.name ||
    order.equipment?.name ||
    `OT #${order.order_number ?? order.id}`;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={`${label} — ${order.order_number ?? order.id}`}
      className={`w-full text-left text-xs px-1.5 py-0.5 rounded border truncate flex items-center gap-1 transition-opacity hover:opacity-80 ${style.bg} ${style.text}`}
    >
      <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span className="truncate">{label}</span>
    </button>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function CalendarioPage() {
  const router = useRouter();
  const today = new Date();

  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());

  // Fetch a broad set of work orders for the 3-month window
  // We use per_page=100 which should cover most practical scenarios
  const { data: currentMonthData, isLoading: loadingCurrent } = useQuery<PaginatedResponse<WorkOrder>>({
    queryKey: ['work-orders-calendar', viewYear, viewMonth],
    queryFn: () =>
      api.get<PaginatedResponse<WorkOrder>>('/work-orders?per_page=100'),
    staleTime: 5 * 60 * 1000,
  });

  // Also fetch prev month
  const prevMonthNum = viewMonth === 0 ? 11 : viewMonth - 1;
  const prevMonthYear = viewMonth === 0 ? viewYear - 1 : viewYear;
  const { data: prevMonthData, isLoading: loadingPrev } = useQuery<PaginatedResponse<WorkOrder>>({
    queryKey: ['work-orders-calendar', prevMonthYear, prevMonthNum],
    queryFn: () =>
      api.get<PaginatedResponse<WorkOrder>>('/work-orders?per_page=100'),
    staleTime: 5 * 60 * 1000,
  });

  // Also fetch next month
  const nextMonthNum = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextMonthYear = viewMonth === 11 ? viewYear + 1 : viewYear;
  const { data: nextMonthData, isLoading: loadingNext } = useQuery<PaginatedResponse<WorkOrder>>({
    queryKey: ['work-orders-calendar', nextMonthYear, nextMonthNum],
    queryFn: () =>
      api.get<PaginatedResponse<WorkOrder>>('/work-orders?per_page=100'),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingCurrent || loadingPrev || loadingNext;

  // Merge all orders and index by ISO date key
  const ordersByDate = useMemo(() => {
    const map: Record<string, WorkOrder[]> = {};

    const addOrder = (order: WorkOrder) => {
      const key = scheduledDateKey(order);
      if (!key) return;
      if (!map[key]) map[key] = [];
      if (!map[key].some((o) => o.id === order.id)) {
        map[key].push(order);
      }
    };

    (currentMonthData?.data ?? []).forEach(addOrder);
    (prevMonthData?.data ?? []).forEach(addOrder);
    (nextMonthData?.data ?? []).forEach(addOrder);

    return map;
  }, [currentMonthData, prevMonthData, nextMonthData]);

  const calendarCells = useMemo(
    () => buildCalendarGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const todayKey = isoDateKey(today);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const handleEventClick = () => {
    router.push('/dashboard/work-orders');
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
            <p className="text-sm text-gray-500">Órdenes de trabajo por fecha programada</p>
          </div>
        </div>
      </div>

      {/* Calendar card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {MONTH_NAMES_ES[viewMonth]} {viewYear}
            </h2>
            {(viewYear !== today.getFullYear() || viewMonth !== today.getMonth()) && (
              <button
                onClick={goToToday}
                className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition-colors"
              >
                Hoy
              </button>
            )}
          </div>

          <button
            onClick={nextMonth}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="px-6 py-2 bg-blue-50 border-b border-blue-100">
            <p className="text-xs text-blue-600 font-medium">Cargando órdenes de trabajo…</p>
          </div>
        )}

        {/* Day names header row */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DAY_NAMES_ES.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
          {calendarCells.map((cell, index) => {
            const key = isoDateKey(cell.date);
            const orders = ordersByDate[key] ?? [];
            const visibleOrders = orders.slice(0, 3);
            const hiddenCount = orders.length - visibleOrders.length;
            const isToday = key === todayKey;
            const isCurrentMonth = cell.isCurrentMonth;

            return (
              <div
                key={index}
                className={`min-h-[100px] p-1.5 flex flex-col gap-1 ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                {/* Date number */}
                <div className="flex justify-end">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                      isToday
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                        : isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-300'
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                </div>

                {/* Work order chips */}
                <div className="flex flex-col gap-0.5 flex-1">
                  {visibleOrders.map((order) => (
                    <EventChip
                      key={order.id}
                      order={order}
                      onClick={handleEventClick}
                    />
                  ))}
                  {hiddenCount > 0 && (
                    <button
                      onClick={handleEventClick}
                      className="text-xs text-blue-600 hover:underline text-left pl-1 font-medium"
                    >
                      +{hiddenCount} más
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-4 px-1">
        {(Object.entries(STATUS_STYLES) as [WorkOrderStatus, typeof STATUS_STYLES[WorkOrderStatus]][]).map(
          ([status, style]) => (
            <div key={status} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
              <span>{STATUS_LABELS[status]}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { Eye, Users, MousePointerClick, UserCheck, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { WeeklySummary } from '../types';
import { formatNumber } from '../utils/analytics';

interface WeeklyKpiCardsProps {
  currentWeek: WeeklySummary;
  prevWeek: WeeklySummary | null;
  medianWeeksPv: number;
  medianWeeksDailyPv: number;
  activeMetric: 'pageview' | 'users' | 'session' | 'vne_user' | 'stickiness';
  onSelectMetric: (metric: 'pageview' | 'users' | 'session' | 'vne_user' | 'stickiness') => void;
  allWeeksMedian?: {
    pageview: number;
    users: number;
    session: number;
    vne_user: number;
    stickiness: number;
  };
}

export const WeeklyKpiCards: React.FC<WeeklyKpiCardsProps> = ({
  currentWeek,
  prevWeek,
  medianWeeksPv,
  activeMetric,
  onSelectMetric,
  allWeeksMedian,
}) => {
  const renderTrendBadge = (pct: number | undefined) => {
    if (pct === undefined) {
      return (
        <span className="text-[10px] font-medium text-slate-400 font-mono">
          Tuần đầu
        </span>
      );
    }
    const isUp = pct > 0;
    const isZero = pct === 0;
    return (
      <span
        className={`text-[10px] font-bold font-mono ${
          isZero
            ? 'text-slate-500'
            : isUp
            ? 'text-emerald-700'
            : 'text-rose-700'
        }`}
      >
        {isUp ? `+${pct}%` : `${pct}%`}
      </span>
    );
  };

  const cards = [
    {
      id: 'pageview' as const,
      title: 'Tổng Pageview',
      calcType: 'Tổng tuần',
      unit: 'PV',
      value: formatNumber(currentWeek.pageview),
      prevVal: prevWeek?.pageview,
      medianVal: medianWeeksPv || currentWeek.median_daily_pageview * currentWeek.dayCount,
      wowPct: currentWeek.wow_pageview_pct,
      vsMedianPct: currentWeek.vs_median_weeks_pageview_pct,
      icon: Eye,
      sub1: `TB ngày: ${formatNumber(currentWeek.median_daily_pageview)} PV`,
      sub2: `${currentWeek.pv_per_session} PV/phiên`,
    },
    {
      id: 'users' as const,
      title: 'Độc giả (Users)',
      calcType: 'TB tuần',
      unit: 'Users/ngày',
      value: formatNumber(currentWeek.users),
      prevVal: prevWeek?.users,
      medianVal: allWeeksMedian?.users || currentWeek.users,
      wowPct: currentWeek.wow_users_pct,
      vsMedianPct:
        allWeeksMedian && allWeeksMedian.users > 0
          ? Number((((currentWeek.users - allWeeksMedian.users) / allWeeksMedian.users) * 100).toFixed(1))
          : undefined,
      icon: Users,
      sub1: `Trung bình: ${formatNumber(currentWeek.users)}/ngày`,
      sub2: `${currentWeek.pv_per_user} PV/user`,
    },
    {
      id: 'session' as const,
      title: 'Tổng Phiên đọc',
      calcType: 'Tổng tuần',
      unit: 'Phiên',
      value: formatNumber(currentWeek.session),
      prevVal: prevWeek?.session,
      medianVal: allWeeksMedian?.session || currentWeek.session,
      wowPct: currentWeek.wow_session_pct,
      vsMedianPct:
        allWeeksMedian && allWeeksMedian.session > 0
          ? Number((((currentWeek.session - allWeeksMedian.session) / allWeeksMedian.session) * 100).toFixed(1))
          : undefined,
      icon: MousePointerClick,
      sub1: `TB: ${formatNumber(Math.round(currentWeek.session / (currentWeek.dayCount || 7)))}/ngày`,
      sub2: `${currentWeek.pv_per_session} PV/phiên`,
    },
    {
      id: 'vne_user' as const,
      title: 'Bạn đọc VnE',
      calcType: 'TB tuần',
      unit: 'Độc giả/ngày',
      value: formatNumber(currentWeek.vne_user),
      prevVal: prevWeek?.vne_user,
      medianVal: allWeeksMedian?.vne_user || currentWeek.vne_user,
      wowPct: currentWeek.wow_vne_user_pct,
      vsMedianPct:
        allWeeksMedian && allWeeksMedian.vne_user > 0
          ? Number((((currentWeek.vne_user - allWeeksMedian.vne_user) / allWeeksMedian.vne_user) * 100).toFixed(1))
          : undefined,
      icon: UserCheck,
      sub1: `Tỷ lệ: ${currentWeek.vne_user_ratio}% độc giả`,
      sub2: 'Độc giả nòng cốt',
    },
    {
      id: 'stickiness' as const,
      title: 'Độ gắn kết (Stickiness)',
      calcType: 'TB tuần',
      unit: '%',
      value: `${currentWeek.stickiness}%`,
      prevVal: prevWeek?.stickiness,
      medianVal: allWeeksMedian?.stickiness || currentWeek.stickiness,
      wowPct:
        prevWeek && prevWeek.stickiness > 0
          ? Number((currentWeek.stickiness - prevWeek.stickiness).toFixed(2))
          : undefined,
      vsMedianPct:
        allWeeksMedian && allWeeksMedian.stickiness > 0
          ? Number((currentWeek.stickiness - allWeeksMedian.stickiness).toFixed(2))
          : undefined,
      icon: Activity,
      sub1: `DAU/MAU bình quân`,
      sub2: currentWeek.stickiness >= 15 ? 'Gắn kết tốt' : 'Cần kích hoạt',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      {cards.map((card) => {
        const isSelected = activeMetric === card.id;

        return (
          <div
            key={card.id}
            id={`weekly-kpi-card-${card.id}`}
            onClick={() => onSelectMetric(card.id)}
            className={`bg-white rounded-xl p-3.5 border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
              isSelected
                ? 'border-slate-900 ring-1 ring-slate-900 shadow-xs'
                : 'border-slate-200 shadow-2xs hover:border-slate-300'
            }`}
          >
            <div>
              {/* Row 1: Title + Calc Type */}
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-700 truncate">
                  {card.title}
                </h4>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono shrink-0">
                  {card.calcType}
                </span>
              </div>

              {/* Row 2: Big Value & Unit */}
              <div className="mt-2 flex items-baseline gap-1 flex-wrap">
                <span className="text-xl sm:text-[22px] font-extrabold text-slate-900 tracking-tight leading-tight font-mono">
                  {card.value}
                </span>
                {card.unit && card.unit !== '%' && (
                  <span className="text-[11px] font-medium text-slate-400">
                    {card.unit}
                  </span>
                )}
              </div>

              {/* Row 3: Comparisons (WoW & vs Median) */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400 text-[11px]">vs Tuần trước:</span>
                  <div className="flex items-center gap-1.5">
                    {card.prevVal !== undefined ? (
                      <>
                        <span className="font-semibold font-mono text-slate-700 text-[11px]">
                          {card.id === 'stickiness' ? `${card.prevVal}%` : formatNumber(card.prevVal)}
                        </span>
                        {renderTrendBadge(card.wowPct)}
                      </>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">—</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400 text-[11px]">vs Trung vị:</span>
                  <span className="font-bold font-mono text-[11px]">
                    {card.vsMedianPct !== undefined ? (
                      <span className={card.vsMedianPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {card.vsMedianPct >= 0 ? `+${card.vsMedianPct}%` : `${card.vsMedianPct}%`}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">—</span>
                    )}
                  </span>
                </div>

                {/* Submetrics */}
                <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-100 text-[11px] text-slate-400">
                  <span className="text-slate-500">{card.sub1}</span>
                  <span className="font-medium text-slate-600">{card.sub2}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

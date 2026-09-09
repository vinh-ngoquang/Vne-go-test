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
        <span className="inline-flex items-center text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
          <Minus className="w-2.5 h-2.5 mr-0.5" /> Tuần đầu
        </span>
      );
    }
    const isUp = pct > 0;
    const isZero = pct === 0;
    return (
      <span
        className={`inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded ${
          isZero
            ? 'bg-slate-100 text-slate-700'
            : isUp
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}
      >
        {isUp ? (
          <TrendingUp className="w-3 h-3 mr-0.5 text-emerald-600 shrink-0" />
        ) : isZero ? (
          <Minus className="w-3 h-3 mr-0.5 text-slate-500 shrink-0" />
        ) : (
          <TrendingDown className="w-3 h-3 mr-0.5 text-rose-600 shrink-0" />
        )}
        <span>{isUp ? `+${pct}%` : `${pct}%`}</span>
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
        const Icon = card.icon;
        const isSelected = activeMetric === card.id;

        return (
          <div
            key={card.id}
            id={`weekly-kpi-card-${card.id}`}
            onClick={() => onSelectMetric(card.id)}
            className={`bg-white rounded-xl p-3.5 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
              isSelected
                ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/30 shadow-xs'
                : 'border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300'
            }`}
          >
            <div>
              {/* Row 1: Icon + Calculation Tag & Trend Badge */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      card.calcType === 'TB tuần'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {card.calcType}
                  </span>
                </div>
                <div>{renderTrendBadge(card.wowPct)}</div>
              </div>

              {/* Row 2: Title */}
              <h4 className="text-xs font-bold text-slate-800 mt-2.5 leading-snug">
                {card.title}
              </h4>

              {/* Row 3: Big Value & Unit */}
              <div className="mt-1 flex items-baseline gap-1 flex-wrap">
                <span className="text-xl sm:text-[22px] font-extrabold text-slate-900 tracking-tight leading-tight">
                  {card.value}
                </span>
                {card.unit && card.unit !== '%' && (
                  <span className="text-[11px] font-medium text-slate-500">
                    {card.unit}
                  </span>
                )}
              </div>

              {/* Row 4: Comparisons (WoW & vs Median) */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-500 text-[11px]">vs Tuần trước:</span>
                  <span className="font-semibold font-mono text-slate-800 text-[11px]">
                    {card.prevVal !== undefined ? (
                      card.id === 'stickiness' ? `${card.prevVal}%` : formatNumber(card.prevVal)
                    ) : (
                      '—'
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-500 text-[11px]">vs Trung vị:</span>
                  <span className="font-bold font-mono text-[11px]">
                    {card.vsMedianPct !== undefined ? (
                      <span className={card.vsMedianPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {card.vsMedianPct >= 0 ? `+${card.vsMedianPct}%` : `${card.vsMedianPct}%`}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">—</span>
                    )}
                  </span>
                </div>

                {/* Submetrics */}
                <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-100 text-[11px] text-slate-500">
                  <span className="text-slate-600">{card.sub1}</span>
                  <span className="font-medium text-slate-700">{card.sub2}</span>
                </div>
              </div>
            </div>

            {/* Row 5: Selection state */}
            <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
              {isSelected ? (
                <span className="text-blue-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block animate-pulse" />
                  Đang lọc biểu đồ
                </span>
              ) : (
                <span className="text-slate-400 hover:text-slate-700">
                  Bấm để lọc biểu đồ &rarr;
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React from 'react';
import { DailySummary } from '../types';
import { formatNumber, formatCompactNumber } from '../utils/analytics';
import { Eye, Users, MousePointerClick, UserCheck, CalendarDays, Clock, BarChart2, TrendingUp, TrendingDown, Minus, Magnet } from 'lucide-react';

interface DailyKpiCardsProps {
  current: DailySummary;
  prev: DailySummary | null;
  sameDayLastWeek: DailySummary | null;
  allTimeAvg: {
    pageview: number;
    users: number;
    session: number;
    vne_user: number;
    stickiness: number;
  };
  activeMetric: 'pageview' | 'users' | 'session' | 'vne_user' | 'stickiness';
  onSelectMetric: (metric: 'pageview' | 'users' | 'session' | 'vne_user' | 'stickiness') => void;
}

export const DailyKpiCards: React.FC<DailyKpiCardsProps> = ({
  current,
  prev,
  sameDayLastWeek,
  allTimeAvg,
  activeMetric,
  onSelectMetric,
}) => {
  const cards = [
    {
      id: 'pageview' as const,
      title: 'Lượt xem trang (Pageviews)',
      value: formatNumber(current.pageview),
      rawVal: current.pageview,
      prevVal: prev?.pageview,
      lastWeekVal: sameDayLastWeek?.pageview,
      avgVal: allTimeAvg.pageview,
      dodPct: current.dod_pageview_pct,
      wowPct:
        sameDayLastWeek && sameDayLastWeek.pageview > 0
          ? Number((((current.pageview - sameDayLastWeek.pageview) / sameDayLastWeek.pageview) * 100).toFixed(1))
          : undefined,
      vsAvgPct:
        allTimeAvg.pageview > 0
          ? Number((((current.pageview - allTimeAvg.pageview) / allTimeAvg.pageview) * 100).toFixed(1))
          : undefined,
      icon: Eye,
      isPercent: false,
      followUpTip: 'Theo dõi để phát hiện nội dung hot & điểm rơi lưu lượng',
    },
    {
      id: 'users' as const,
      title: 'Độc giả truy cập (Users)',
      value: formatNumber(current.users),
      rawVal: current.users,
      prevVal: prev?.users,
      lastWeekVal: sameDayLastWeek?.users,
      avgVal: allTimeAvg.users,
      dodPct: current.dod_users_pct,
      wowPct:
        sameDayLastWeek && sameDayLastWeek.users > 0
          ? Number((((current.users - sameDayLastWeek.users) / sameDayLastWeek.users) * 100).toFixed(1))
          : undefined,
      vsAvgPct:
        allTimeAvg.users > 0
          ? Number((((current.users - allTimeAvg.users) / allTimeAvg.users) * 100).toFixed(1))
          : undefined,
      icon: Users,
      isPercent: false,
      followUpTip: 'Theo dõi quy mô tiếp cận độc giả mới và tái truy cập',
    },
    {
      id: 'session' as const,
      title: 'Số phiên đọc (Sessions)',
      value: formatNumber(current.session),
      rawVal: current.session,
      prevVal: prev?.session,
      lastWeekVal: sameDayLastWeek?.session,
      avgVal: allTimeAvg.session,
      dodPct: current.dod_session_pct,
      wowPct:
        sameDayLastWeek && sameDayLastWeek.session > 0
          ? Number((((current.session - sameDayLastWeek.session) / sameDayLastWeek.session) * 100).toFixed(1))
          : undefined,
      vsAvgPct:
        allTimeAvg.session > 0
          ? Number((((current.session - allTimeAvg.session) / allTimeAvg.session) * 100).toFixed(1))
          : undefined,
      icon: MousePointerClick,
      isPercent: false,
      followUpTip: 'Đánh giá thói quen và tần suất quay lại trong ngày',
    },
    {
      id: 'vne_user' as const,
      title: 'Bạn đọc tài khoản (VnE User)',
      value: formatNumber(current.vne_user),
      rawVal: current.vne_user,
      prevVal: prev?.vne_user,
      lastWeekVal: sameDayLastWeek?.vne_user,
      avgVal: allTimeAvg.vne_user,
      dodPct:
        prev && prev.vne_user > 0
          ? Number((((current.vne_user - prev.vne_user) / prev.vne_user) * 100).toFixed(1))
          : 0,
      wowPct:
        sameDayLastWeek && sameDayLastWeek.vne_user > 0
          ? Number((((current.vne_user - sameDayLastWeek.vne_user) / sameDayLastWeek.vne_user) * 100).toFixed(1))
          : undefined,
      vsAvgPct:
        allTimeAvg.vne_user > 0
          ? Number((((current.vne_user - allTimeAvg.vne_user) / allTimeAvg.vne_user) * 100).toFixed(1))
          : undefined,
      icon: UserCheck,
      isPercent: false,
      followUpTip: 'Thước đo độc giả trung thành gắn kết định kỳ',
    },
    {
      id: 'stickiness' as const,
      title: 'Độ gắn kết (Stickiness DAU/MAU)',
      value: `${current.stickiness}%`,
      rawVal: current.stickiness,
      prevVal: prev?.stickiness,
      lastWeekVal: sameDayLastWeek?.stickiness,
      avgVal: allTimeAvg.stickiness,
      dodPct: current.dod_stickiness_pct,
      wowPct:
        sameDayLastWeek && sameDayLastWeek.stickiness > 0
          ? Number((((current.stickiness - sameDayLastWeek.stickiness) / sameDayLastWeek.stickiness) * 100).toFixed(1))
          : undefined,
      vsAvgPct:
        allTimeAvg.stickiness > 0
          ? Number((((current.stickiness - allTimeAvg.stickiness) / allTimeAvg.stickiness) * 100).toFixed(1))
          : undefined,
      icon: Magnet,
      isPercent: true,
      followUpTip: 'Tỷ lệ Users / MAU: Tần suất độc giả quay lại đọc báo trong tháng',
    },
  ];

  const renderGrowthBadge = (pct: number | undefined, prefix = '') => {
    if (pct === undefined) {
      return (
        <span className="text-[11px] text-slate-400 font-mono inline-flex items-center gap-0.5">
          <Minus className="w-3 h-3" /> N/A
        </span>
      );
    }
    const isPos = pct > 0;
    const isZero = pct === 0;

    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
          isPos
            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
            : isZero
            ? 'text-slate-600 bg-slate-100 border border-slate-200'
            : 'text-rose-700 bg-rose-50 border border-rose-200'
        }`}
      >
        {isPos ? (
          <TrendingUp className="w-3 h-3" />
        ) : isZero ? (
          <Minus className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        {prefix}
        {isPos ? `+${pct}%` : `${pct}%`}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {cards.map((card) => {
        const isSelected = activeMetric === card.id;
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            onClick={() => onSelectMetric(card.id)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none relative flex flex-col justify-between ${
              isSelected
                ? 'bg-blue-50/40 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
            }`}
          >
            {isSelected && (
              <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
            )}

            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-500 tracking-tight leading-tight">
                  {card.title}
                </span>
                <div
                  className={`p-1.5 rounded-lg shrink-0 ml-1 ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Main KPI Value */}
              <div className="flex items-baseline justify-between gap-1 mt-0.5">
                <span className="text-xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {card.value}
                </span>
                {card.dodPct !== undefined && renderGrowthBadge(card.dodPct)}
              </div>
            </div>

            {/* Multi-horizon Growth Comparisons */}
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1.5 text-[11px]">
              {/* 1. So với cùng kỳ tuần trước (WoW) */}
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1 font-medium">
                  <CalendarDays className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span>Tuần trước:</span>
                </span>
                <div className="flex items-center gap-1">
                  {card.lastWeekVal !== undefined && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({card.isPercent ? `${card.lastWeekVal}%` : formatCompactNumber(card.lastWeekVal)})
                    </span>
                  )}
                  {renderGrowthBadge(card.wowPct)}
                </div>
              </div>

              {/* 2. So với trung bình toàn thời gian */}
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1 font-medium">
                  <BarChart2 className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>TB toàn kỳ:</span>
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({card.isPercent ? `${card.avgVal}%` : formatCompactNumber(card.avgVal)})
                  </span>
                  {renderGrowthBadge(card.vsAvgPct)}
                </div>
              </div>

              {/* 3. So với ngày hôm trước (DoD) detail note */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-50">
                <span className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-slate-400" />
                  <span>Hôm trước:</span>
                </span>
                <span className="font-mono font-medium text-slate-600">
                  {card.prevVal !== undefined
                    ? card.isPercent
                      ? `${card.prevVal}%`
                      : formatNumber(card.prevVal)
                    : 'Chưa có'}
                </span>
              </div>
            </div>

            {/* Follow-up tip */}
            <div className="mt-2 pt-1.5 border-t border-slate-100/70">
              <p className="text-[10px] text-slate-500 italic leading-snug">
                🎯 {card.followUpTip}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

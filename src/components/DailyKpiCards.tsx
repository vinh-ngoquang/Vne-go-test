import React from 'react';
import { DailySummary } from '../types';
import { formatNumber, formatCompactNumber } from '../utils/analytics';
import { Eye, Users, MousePointerClick, UserCheck, CalendarDays, Clock, BarChart2, TrendingUp, TrendingDown, Minus, Magnet } from 'lucide-react';

interface DailyKpiCardsProps {
  current: DailySummary;
  prev: DailySummary | null;
  sameDayLastWeek: DailySummary | null;
  allTimeMedian: {
    pageview: number;
    users: number;
    session: number;
    vne_user: number;
    stickiness: number;
  };
  allTimeAvg?: {
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
  allTimeMedian,
  allTimeAvg,
  activeMetric,
  onSelectMetric,
}) => {
  const medianSource = allTimeMedian || allTimeAvg || { pageview: 0, users: 0, session: 0, vne_user: 0, stickiness: 0 };

  const cards = [
    {
      id: 'pageview' as const,
      title: 'Lượt xem trang (Pageviews)',
      value: formatNumber(current.pageview),
      rawVal: current.pageview,
      prevVal: prev?.pageview,
      lastWeekVal: sameDayLastWeek?.pageview,
      medianVal: medianSource.pageview,
      dodPct: current.dod_pageview_pct,
      wowPct:
        sameDayLastWeek && sameDayLastWeek.pageview > 0
          ? Number((((current.pageview - sameDayLastWeek.pageview) / sameDayLastWeek.pageview) * 100).toFixed(1))
          : undefined,
      vsMedianPct:
        medianSource.pageview > 0
          ? Number((((current.pageview - medianSource.pageview) / medianSource.pageview) * 100).toFixed(1))
          : undefined,
      icon: Eye,
      isPercent: false,
      followUpTip: 'Theo dõi để phát hiện nội dung hot & điểm rơi Pageview',
    },
    {
      id: 'users' as const,
      title: 'Độc giả truy cập (Users)',
      value: formatNumber(current.users),
      rawVal: current.users,
      prevVal: prev?.users,
      lastWeekVal: sameDayLastWeek?.users,
      medianVal: medianSource.users,
      dodPct: current.dod_users_pct,
      wowPct:
        sameDayLastWeek && sameDayLastWeek.users > 0
          ? Number((((current.users - sameDayLastWeek.users) / sameDayLastWeek.users) * 100).toFixed(1))
          : undefined,
      vsMedianPct:
        medianSource.users > 0
          ? Number((((current.users - medianSource.users) / medianSource.users) * 100).toFixed(1))
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
      medianVal: medianSource.session,
      dodPct: current.dod_session_pct,
      wowPct:
        sameDayLastWeek && sameDayLastWeek.session > 0
          ? Number((((current.session - sameDayLastWeek.session) / sameDayLastWeek.session) * 100).toFixed(1))
          : undefined,
      vsMedianPct:
        medianSource.session > 0
          ? Number((((current.session - medianSource.session) / medianSource.session) * 100).toFixed(1))
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
      medianVal: medianSource.vne_user,
      dodPct:
        prev && prev.vne_user > 0
          ? Number((((current.vne_user - prev.vne_user) / prev.vne_user) * 100).toFixed(1))
          : 0,
      wowPct:
        sameDayLastWeek && sameDayLastWeek.vne_user > 0
          ? Number((((current.vne_user - sameDayLastWeek.vne_user) / sameDayLastWeek.vne_user) * 100).toFixed(1))
          : undefined,
      vsMedianPct:
        medianSource.vne_user > 0
          ? Number((((current.vne_user - medianSource.vne_user) / medianSource.vne_user) * 100).toFixed(1))
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
      medianVal: medianSource.stickiness,
      dodPct: current.dod_stickiness_pct,
      wowPct:
        sameDayLastWeek && sameDayLastWeek.stickiness > 0
          ? Number((((current.stickiness - sameDayLastWeek.stickiness) / sameDayLastWeek.stickiness) * 100).toFixed(1))
          : undefined,
      vsMedianPct:
        medianSource.stickiness > 0
          ? Number((((current.stickiness - medianSource.stickiness) / medianSource.stickiness) * 100).toFixed(1))
          : undefined,
      icon: Magnet,
      isPercent: true,
      followUpTip: 'Tỷ lệ Users / MAU: Tần suất độc giả quay lại đọc báo trong tháng',
    },
  ];

  const renderGrowthBadge = (pct: number | undefined, prefix = '') => {
    if (pct === undefined || isNaN(pct)) return <span className="text-slate-400 font-mono text-[11px]">-</span>;
    const isZero = Math.abs(pct) < 0.05;
    const isPositive = pct > 0;

    let badgeClass = 'text-slate-600 bg-slate-100';
    let Icon = Minus;

    if (!isZero) {
      if (isPositive) {
        badgeClass = 'text-emerald-700 bg-emerald-50 border border-emerald-200';
        Icon = TrendingUp;
      } else {
        badgeClass = 'text-rose-700 bg-rose-50 border border-rose-200';
        Icon = TrendingDown;
      }
    }

    return (
      <span
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold font-mono ${badgeClass}`}
      >
        <Icon className="w-3 h-3" />
        {prefix}
        {isPositive ? `+${pct}%` : `${pct}%`}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      {cards.map((card) => {
        const isSelected = activeMetric === card.id;
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            onClick={() => onSelectMetric(card.id)}
            className={`rounded-xl border p-4 transition-all duration-200 cursor-pointer text-left relative flex flex-col justify-between ${
              isSelected
                ? 'bg-blue-50/40 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            {/* Top row: Label & Icon */}
            <div>
              <div className="flex items-start justify-between mb-1.5">
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
              <div className="mt-0.5">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {card.value}
                </span>
              </div>
            </div>

            {/* Multi-horizon Growth Comparisons */}
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1.5 text-[11px]">
              {/* 1. So với Trung vị toàn chu kỳ (Mốc chuẩn loại trừ giảm cuối tuần) */}
              <div className="flex items-center justify-between">
                <span className="text-slate-700 flex items-center gap-1 font-semibold">
                  <BarChart2 className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>Trung vị kỳ:</span>
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({card.isPercent ? `${card.medianVal}%` : formatCompactNumber(card.medianVal)})
                  </span>
                  {renderGrowthBadge(card.vsMedianPct)}
                </div>
              </div>

              {/* 2. So với cùng kỳ tuần trước (WoW) */}
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

              {/* 3. So với ngày hôm trước (DoD - tham khảo nhịp ngày) */}
              <div
                className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100/60 hover:bg-slate-100/80 px-1.5 py-0.5 rounded transition-colors cursor-help"
                title="Tăng trưởng so với ngày hôm trước (Day-over-Day). Lưu ý cuối tuần thường có nhịp giảm tự nhiên."
              >
                <span className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-slate-400" />
                  <span>DoD (nhịp ngày):</span>
                </span>
                <span className="font-mono font-medium text-slate-600">
                  {card.dodPct !== undefined ? (
                    <span className={card.dodPct >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                      {card.dodPct > 0 ? `+${card.dodPct}%` : `${card.dodPct}%`}
                    </span>
                  ) : (
                    'Mốc đầu'
                  )}
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

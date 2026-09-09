import React from 'react';
import { Sparkles, TrendingUp, TrendingDown, Target, Info, CheckCircle2, AlertCircle, BarChart2, ChevronRight } from 'lucide-react';
import { WeeklySummary, WeeklyCategorySummary } from '../types';
import { formatNumber } from '../utils/analytics';

interface WeeklyFollowUpBannerProps {
  currentWeek: WeeklySummary;
  prevWeek: WeeklySummary | null;
  categories: WeeklyCategorySummary[];
  medianWeeksPv?: number;
}

interface WeeklyAlert {
  id: string;
  title: string;
  changePct: number;
  detail: string;
  metric: string;
  type: 'positive' | 'negative' | 'warning' | 'info';
}

export const WeeklyFollowUpBanner: React.FC<WeeklyFollowUpBannerProps> = ({
  currentWeek,
  prevWeek,
  categories,
  medianWeeksPv,
}) => {
  const isUp = (currentWeek.wow_pageview_pct ?? 0) >= 0;
  const topCat = categories[0];
  const fastestGrowingCat = [...categories]
    .filter((c) => (c.wow_pageview_pct ?? 0) > 0 && c.pageview > 5000)
    .sort((a, b) => (b.wow_pageview_pct ?? 0) - (a.wow_pageview_pct ?? 0))[0];

  const mostDeclinedCat = [...categories]
    .filter((c) => (c.wow_pageview_pct ?? 0) < 0 && (c.prev_pageview ?? 0) > 5000)
    .sort((a, b) => (a.wow_pageview_pct ?? 0) - (b.wow_pageview_pct ?? 0))[0];

  // Vs Median calculation
  const vsMedianPct = currentWeek.vs_median_weeks_pageview_pct;
  const isAboveMedian = (vsMedianPct ?? 0) >= 0;

  // Key alerts
  const alerts: WeeklyAlert[] = [
    {
      id: 'pillar',
      title: topCat ? `Trụ cột: ${topCat.category}` : 'Cơ cấu chuyên mục',
      changePct: topCat?.wow_pageview_pct ?? 0,
      detail: topCat
        ? `${topCat.category} chiếm ${topCat.share_pct}% tổng Pageview (${formatNumber(topCat.pageview)} PV, trung vị ${formatNumber(topCat.median_daily_pageview)} PV/ngày).`
        : 'Dữ liệu chuyên mục đang được cập nhật.',
      metric: 'Tỷ trọng PV',
      type: 'positive' as const,
    },
    {
      id: 'momentum',
      title: fastestGrowingCat
        ? `Bứt phá: ${fastestGrowingCat.category}`
        : mostDeclinedCat
        ? `Cần lưu tâm: ${mostDeclinedCat.category}`
        : 'Động thái tăng trưởng',
      changePct: fastestGrowingCat?.wow_pageview_pct ?? (mostDeclinedCat?.wow_pageview_pct ?? 0),
      detail: fastestGrowingCat
        ? `${fastestGrowingCat.category} tăng trưởng ấn tượng +${fastestGrowingCat.wow_pageview_pct}% WoW so với tuần trước, đạt ${formatNumber(fastestGrowingCat.pageview)} PV.`
        : mostDeclinedCat
        ? `${mostDeclinedCat.category} suy giảm ${mostDeclinedCat.wow_pageview_pct}% WoW so với tuần trước, cần bổ sung nguồn phân phối.`
        : 'Duy trì nhịp độ ổn định trên các chuyên mục.',
      metric: 'Tăng trưởng WoW',
      type: fastestGrowingCat ? ('positive' as const) : ('warning' as const),
    },
    {
      id: 'channel_quality',
      title: 'Kênh & Chất lượng Độc giả',
      changePct: currentWeek.vne_user_ratio,
      detail: `Ngoại vi ${currentWeek.pageview > 0 ? ((currentWeek.total_external / currentWeek.pageview) * 100).toFixed(1) : 0}% vs Nội bộ ${currentWeek.pageview > 0 ? ((currentWeek.total_internal / currentWeek.pageview) * 100).toFixed(1) : 0}%. Tỷ lệ Bạn đọc VnE đạt ${currentWeek.vne_user_ratio}%, độ sâu ${currentWeek.pv_per_session} PV/phiên.`,
      metric: 'Tương tác & Kênh',
      type: 'info' as const,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 mb-6">
      {/* Top Header & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Kết luận &amp; Cảnh báo Follow-up &bull; {currentWeek.label}
          </h2>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-600">
            {currentWeek.dayCount} ngày dữ liệu
          </span>
        </div>

        {/* Primary comparison: Vs Median & Vs Last Week WoW */}
        <div className="flex items-center gap-2.5 text-xs flex-wrap">
          {vsMedianPct !== undefined && (
            <div className="flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-amber-600" />
              <span className="text-slate-600 font-medium">vs Trung vị tuần:</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold font-mono ${
                  isAboveMedian
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {isAboveMedian ? `▲ +${vsMedianPct}%` : `▼ ${vsMedianPct}%`} PV
              </span>
            </div>
          )}

          {currentWeek.wow_pageview_pct !== undefined && (
            <>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 font-medium">vs Tuần trước (WoW):</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold font-mono ${
                    isUp
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {isUp ? `+${currentWeek.wow_pageview_pct}%` : `${currentWeek.wow_pageview_pct}%`}
                </span>
              </div>
            </>
          )}

          <span className="text-slate-300">|</span>

          <span className="text-slate-500 text-[11px]">
            Trung vị ngày: <strong className="font-mono text-slate-800">{formatNumber(currentWeek.median_daily_pageview)} PV</strong>
          </span>
        </div>
      </div>

      {/* 3 Actionable Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {alerts.map((alert) => {
          let badgeStyle = 'bg-blue-50/80 border-blue-200 text-blue-900';
          let Icon = Info;

          if (alert.type === 'positive') {
            badgeStyle = 'bg-emerald-50/80 border-emerald-200 text-emerald-900';
            Icon = TrendingUp;
          } else if (alert.type === 'negative') {
            badgeStyle = 'bg-rose-50/80 border-rose-200 text-rose-900';
            Icon = TrendingDown;
          } else if (alert.type === 'warning') {
            badgeStyle = 'bg-amber-50/80 border-amber-200 text-amber-900';
            Icon = AlertCircle;
          }

          return (
            <div
              key={alert.id}
              className={`p-3.5 rounded-lg border flex flex-col justify-between ${badgeStyle} transition-all`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{alert.title}</span>
                  </div>
                  {alert.changePct !== 0 && (
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/80 border border-current">
                      {alert.changePct > 0 ? `+${alert.changePct}%` : `${alert.changePct}%`}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {alert.detail}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                <span>Chỉ số: {alert.metric}</span>
                <span className="flex items-center text-slate-800 font-semibold gap-0.5">
                  Theo dõi tiếp <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

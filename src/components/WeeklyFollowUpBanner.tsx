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
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 mb-6">
      {/* Top Header & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Kết luận &amp; Cảnh báo Follow-up &bull; {currentWeek.label}
          </h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-medium text-slate-600 font-mono">
            {currentWeek.dayCount} ngày
          </span>
        </div>

        {/* Primary comparison: Vs Median & Vs Last Week WoW */}
        <div className="flex items-center gap-2.5 text-xs flex-wrap">
          {vsMedianPct !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">vs Trung vị tuần:</span>
              <span
                className={`font-semibold font-mono text-[11px] ${
                  isAboveMedian ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {isAboveMedian ? `+${vsMedianPct}%` : `${vsMedianPct}%`} PV
              </span>
            </div>
          )}

          {currentWeek.wow_pageview_pct !== undefined && (
            <>
              <span className="text-slate-200">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">vs Tuần trước:</span>
                <span
                  className={`font-semibold font-mono text-[11px] ${
                    isUp ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {isUp ? `+${currentWeek.wow_pageview_pct}%` : `${currentWeek.wow_pageview_pct}%`}
                </span>
              </div>
            </>
          )}

          <span className="text-slate-200">|</span>

          <span className="text-slate-500 text-[11px]">
            Trung vị ngày: <strong className="font-mono text-slate-800">{formatNumber(currentWeek.median_daily_pageview)} PV</strong>
          </span>
        </div>
      </div>

      {/* 3 Actionable Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {alerts.map((alert) => {
          return (
            <div
              key={alert.id}
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="font-semibold text-xs text-slate-900">
                    {alert.title}
                  </span>
                  {alert.changePct !== 0 && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        alert.changePct > 0
                          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          : 'text-rose-700 bg-rose-50 border border-rose-200'
                      }`}
                    >
                      {alert.changePct > 0 ? `+${alert.changePct}%` : `${alert.changePct}%`}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {alert.detail}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Chỉ số: {alert.metric}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

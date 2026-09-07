import React from 'react';
import { DailySummary } from '../types';
import { formatNumber } from '../utils/analytics';
import { Eye, Users, MousePointerClick, UserCheck, Compass, Gauge } from 'lucide-react';

interface DailyKpiCardsProps {
  current: DailySummary;
  prev: DailySummary | null;
  activeMetric: 'pageview' | 'users' | 'session' | 'vne_user';
  onSelectMetric: (metric: 'pageview' | 'users' | 'session' | 'vne_user') => void;
}

export const DailyKpiCards: React.FC<DailyKpiCardsProps> = ({
  current,
  prev,
  activeMetric,
  onSelectMetric,
}) => {
  const extPct = current.pageview > 0 ? ((current.total_external / current.pageview) * 100).toFixed(1) : '0';
  const prevExtPct = prev && prev.pageview > 0 ? ((prev.total_external / prev.pageview) * 100).toFixed(1) : null;
  const extDiff = prevExtPct !== null ? (parseFloat(extPct) - parseFloat(prevExtPct)).toFixed(1) : null;

  const cards = [
    {
      id: 'pageview' as const,
      title: 'Lượt xem trang (Pageviews)',
      value: formatNumber(current.pageview),
      rawVal: current.pageview,
      prevVal: prev?.pageview,
      dodPct: current.dod_pageview_pct,
      icon: Eye,
      color: 'blue',
      benchmark: current.moving_avg_pv ? `ĐTB 3 ngày: ${formatNumber(current.moving_avg_pv)}` : undefined,
      followUpTip: 'Theo dõi để phát hiện nội dung hot trong ngày',
    },
    {
      id: 'users' as const,
      title: 'Độc giả truy cập (Users)',
      value: formatNumber(current.users),
      rawVal: current.users,
      prevVal: prev?.users,
      dodPct: current.dod_users_pct,
      icon: Users,
      color: 'indigo',
      benchmark: `Tỷ lệ PV/User: ${current.pv_per_user}`,
      followUpTip: 'Theo dõi quy mô tiếp cận độc giả mới & cũ',
    },
    {
      id: 'session' as const,
      title: 'Số phiên đọc (Sessions)',
      value: formatNumber(current.session),
      rawVal: current.session,
      prevVal: prev?.session,
      dodPct: current.dod_session_pct,
      icon: MousePointerClick,
      color: 'emerald',
      benchmark: `Độ sâu: ${current.pv_per_session} PV/phiên`,
      followUpTip: 'Đánh giá thói quen quay lại nhiều lần trong ngày',
    },
    {
      id: 'vne_user' as const,
      title: 'Bạn đọc có tài khoản (VnE User)',
      value: formatNumber(current.vne_user),
      rawVal: current.vne_user,
      prevVal: prev?.vne_user,
      dodPct: prev && prev.vne_user > 0 ? Number((((current.vne_user - prev.vne_user) / prev.vne_user) * 100).toFixed(1)) : 0,
      icon: UserCheck,
      color: 'amber',
      benchmark: `Chiếm ${current.vne_user_ratio}% tổng độc giả`,
      followUpTip: 'Thước đo độc giả trung thành gắn kết lâu dài',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const isSelected = activeMetric === card.id;
        const Icon = card.icon;
        const isPositive = (card.dodPct ?? 0) >= 0;

        return (
          <div
            key={card.id}
            onClick={() => onSelectMetric(card.id)}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none relative ${
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

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 tracking-tight">
                {card.title}
              </span>
              <div
                className={`p-2 rounded-lg ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {card.value}
              </span>

              {card.dodPct !== undefined && (
                <span
                  className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md ${
                    isPositive
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                      : 'text-rose-700 bg-rose-50 border border-rose-200'
                  }`}
                >
                  {isPositive ? `+${card.dodPct}%` : `${card.dodPct}%`}
                </span>
              )}
            </div>

            {/* Benchmark & follow-up tip */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <span>{card.benchmark}</span>
                {card.prevVal && (
                  <span className="text-slate-400 text-[11px]">
                    Hôm qua: {formatNumber(card.prevVal)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 italic mt-0.5">
                🎯 {card.followUpTip}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

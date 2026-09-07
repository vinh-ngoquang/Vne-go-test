import React from 'react';
import { DailyAlert } from '../types';
import { AlertCircle, TrendingUp, TrendingDown, Info, CheckCircle2, ChevronRight } from 'lucide-react';
import { getDayOfWeekVi } from '../utils/analytics';

interface FollowUpSummaryBannerProps {
  alerts: DailyAlert[];
  selectedDate: string;
  dodPageviewPct?: number;
}

export const FollowUpSummaryBanner: React.FC<FollowUpSummaryBannerProps> = ({
  alerts,
  selectedDate,
  dodPageviewPct = 0,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Mục tiêu Follow-up hàng ngày &bull; {getDayOfWeekVi(selectedDate)}, {selectedDate}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Biến động ngày (DoD):</span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold ${
              dodPageviewPct > 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : dodPageviewPct < 0
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {dodPageviewPct > 0 ? `▲ +${dodPageviewPct}%` : `${dodPageviewPct}%`} Pageview
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {alerts.map((alert) => {
          let badgeStyle = 'bg-blue-50 border-blue-200 text-blue-800';
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
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/70 border border-current">
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

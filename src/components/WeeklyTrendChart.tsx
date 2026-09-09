import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Activity, Eye, Users, MousePointerClick, UserCheck } from 'lucide-react';
import { WeeklySummary } from '../types';
import { formatNumber, calculateMedian } from '../utils/analytics';

interface WeeklyTrendChartProps {
  currentWeek: WeeklySummary;
  prevWeek: WeeklySummary | null;
  allWeeks: WeeklySummary[];
  medianWeeksPv: number;
  activeMetric: 'pageview' | 'users' | 'session' | 'vne_user' | 'stickiness';
  onChangeMetric: (metric: 'pageview' | 'users' | 'session' | 'vne_user' | 'stickiness') => void;
  onSelectWeek?: (weekKey: string) => void;
}

export const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({
  currentWeek,
  prevWeek,
  allWeeks,
  medianWeeksPv,
  activeMetric,
  onChangeMetric,
  onSelectWeek,
}) => {
  const metricConfigs = {
    pageview: {
      label: 'Tổng Pageview',
      unit: 'PV',
      color: '#2563eb',
      calcType: 'Tổng tuần',
      icon: Eye,
    },
    users: {
      label: 'Độc giả (Users - TB tuần)',
      unit: 'Users/ngày',
      color: '#4f46e5',
      calcType: 'TB ngày trong tuần',
      icon: Users,
    },
    session: {
      label: 'Tổng Phiên đọc (Sessions)',
      unit: 'Phiên',
      color: '#059669',
      calcType: 'Tổng tuần',
      icon: MousePointerClick,
    },
    vne_user: {
      label: 'Bạn đọc VnE (TB tuần)',
      unit: 'Độc giả/ngày',
      color: '#d97706',
      calcType: 'TB ngày trong tuần',
      icon: UserCheck,
    },
    stickiness: {
      label: 'Độ gắn kết Stickiness (TB tuần)',
      unit: '%',
      color: '#8b5cf6',
      calcType: 'TB ngày trong tuần',
      icon: Activity,
    },
  };

  const currentConfig = metricConfigs[activeMetric] || metricConfigs.pageview;
  const primaryColor = currentConfig.color;

  // Calculate Median across all weeks for the selected metric
  const allMetricVals = allWeeks.map((w) => w[activeMetric] ?? 0);
  const medianValAcrossWeeks =
    allMetricVals.length > 0
      ? activeMetric === 'stickiness'
        ? Number(calculateMedian(allMetricVals).toFixed(2))
        : Math.round(calculateMedian(allMetricVals))
      : 0;

  // Build chart points where X-axis is Week
  const chartData = allWeeks.map((w) => {
    const val = w[activeMetric] ?? 0;
    const vsMedianPct =
      medianValAcrossWeeks > 0
        ? Number((((val - medianValAcrossWeeks) / medianValAcrossWeeks) * 100).toFixed(1))
        : 0;

    let wowPct: number | undefined;
    if (activeMetric === 'pageview') wowPct = w.wow_pageview_pct;
    else if (activeMetric === 'users') wowPct = w.wow_users_pct;
    else if (activeMetric === 'session') wowPct = w.wow_session_pct;
    else if (activeMetric === 'vne_user') wowPct = w.wow_vne_user_pct;
    else if (activeMetric === 'stickiness') wowPct = w.wow_stickiness_pct;

    return {
      weekKey: w.weekKey,
      displayWeek: w.shortLabel, // "Tuần 35", "Tuần 36"
      label: w.label,
      value: val,
      vsMedianPct,
      wowPct,
      isSelected: w.weekKey === currentWeek.weekKey,
    };
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 mb-6">
      {/* Chart Header with Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Biểu đồ Xu hướng &amp; Đối chuẩn Trung vị (Median Baseline theo Tuần)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mục đích follow-up: Đánh giá hiệu suất tuần theo trục thời gian các tuần, đối chiếu trực tiếp mốc Trung vị chuẩn chu kỳ
          </p>
        </div>

        {/* Metric Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start md:self-auto flex-wrap">
          {(['pageview', 'users', 'session', 'vne_user', 'stickiness'] as const).map((m) => (
            <button
              key={m}
              onClick={() => onChangeMetric(m)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeMetric === m
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m === 'pageview'
                ? 'Pageviews'
                : m === 'users'
                ? 'Users (TB)'
                : m === 'session'
                ? 'Sessions'
                : m === 'vne_user'
                ? 'VnE Users (TB)'
                : 'Stickiness (%)'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                const clickedKey = state.activePayload[0].payload.weekKey;
                if (clickedKey && onSelectWeek) onSelectWeek(clickedKey);
              }
            }}
            margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="weeklyMetricGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="displayWeek"
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) =>
                activeMetric === 'stickiness'
                  ? `${val}%`
                  : val >= 1000000
                  ? `${(val / 1000000).toFixed(1)}M`
                  : `${Math.round(val / 1000)}k`
              }
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <Tooltip
              wrapperStyle={{ pointerEvents: 'none', zIndex: 1000 }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                const isAboveMed = d.vsMedianPct >= 0;
                return (
                  <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-lg border border-slate-800 space-y-1.5 min-w-[240px]">
                    <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 flex items-center justify-between gap-4">
                      <span>{d.label}</span>
                      <span className="text-[10px] text-blue-400 font-semibold">Click để chọn</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-1">
                      <span className="text-slate-300">{currentConfig.label}:</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {activeMetric === 'stickiness' ? `${d.value}%` : formatNumber(d.value)}
                        {currentConfig.unit && currentConfig.unit !== '%' && (
                          <span className="text-xs font-normal text-slate-400 ml-1">
                            {currentConfig.unit}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* So với Trung vị chu kỳ các tuần */}
                    <div className="flex items-center justify-between gap-4 text-amber-300">
                      <span>vs Trung vị các tuần:</span>
                      <span className="font-mono font-bold">
                        {isAboveMed ? `+${d.vsMedianPct}%` : `${d.vsMedianPct}%`}
                      </span>
                    </div>

                    {/* WoW */}
                    {d.wowPct !== undefined && (
                      <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800 text-[11px]">
                        <span className="text-slate-400">vs Tuần trước (WoW):</span>
                        <span
                          className={`font-bold font-mono ${
                            d.wowPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {d.wowPct >= 0 ? `+${d.wowPct}%` : `${d.wowPct}%`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
            />

            {/* Mốc Trung vị các tuần Reference Line */}
            <ReferenceLine
              y={medianValAcrossWeeks}
              stroke="#d97706"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Trung vị: ${
                  activeMetric === 'stickiness'
                    ? `${medianValAcrossWeeks}%`
                    : formatNumber(medianValAcrossWeeks)
                }`,
                fill: '#d97706',
                fontSize: 11,
                position: 'insideTopRight',
              }}
            />

            {/* Selected week highlight vertical reference line */}
            <ReferenceLine
              x={currentWeek.shortLabel}
              stroke="#3b82f6"
              strokeDasharray="3 3"
              strokeWidth={2}
              label={{
                value: 'Tuần đang xem',
                fill: '#2563eb',
                fontSize: 10,
                position: 'insideTop',
              }}
            />

            {/* Area gradient under line */}
            <Area
              type="monotone"
              dataKey="value"
              name={currentConfig.label}
              stroke={primaryColor}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#weeklyMetricGradient)"
              activeDot={{ r: 6, fill: primaryColor, stroke: '#fff', strokeWidth: 2 }}
              dot={{ r: 4, fill: primaryColor, strokeWidth: 1 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Follow-up Note & Insight below chart */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
            <span className="font-semibold text-slate-700">
              {currentWeek.shortLabel}: {activeMetric === 'stickiness' ? `${currentWeek[activeMetric]}%` : formatNumber(currentWeek[activeMetric])}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t border-dashed border-amber-500" />
            <span>Mốc Trung vị các tuần: <strong>{activeMetric === 'stickiness' ? `${medianValAcrossWeeks}%` : formatNumber(medianValAcrossWeeks)}</strong></span>
          </div>
          <span className="text-[11px] text-slate-400">
            ({currentConfig.calcType})
          </span>
        </div>
        <div className="text-[11px] text-blue-600 font-medium">
          Bấm vào cột mốc tuần trên biểu đồ để đổi tuần đang xem
        </div>
      </div>
    </div>
  );
};

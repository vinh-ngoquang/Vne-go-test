import React, { useState } from 'react';
import { DailySummary } from '../types';
import { formatNumber, getDayOfWeekVi, calculateMedian } from '../utils/analytics';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Activity, HelpCircle, ShieldCheck, MousePointer } from 'lucide-react';

interface DailyTrendChartProps {
  data: DailySummary[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  metric: 'pageview' | 'users' | 'session' | 'vne_user' | 'stickiness';
  onChangeMetric: (metric: 'pageview' | 'users' | 'session' | 'vne_user' | 'stickiness') => void;
}

export const DailyTrendChart: React.FC<DailyTrendChartProps> = ({
  data,
  selectedDate,
  onSelectDate,
  metric,
  onChangeMetric,
}) => {
  const [hoveredDod, setHoveredDod] = useState<{
    date: string;
    value: number;
    dodPct?: number;
    vsMedianPct: number;
  } | null>(null);

  const metricLabelMap = {
    pageview: 'Lượt xem trang (Pageviews)',
    users: 'Số lượng độc giả (Users)',
    session: 'Số phiên đọc (Sessions)',
    vne_user: 'Độc giả có tài khoản (VnE User)',
    stickiness: 'Độ gắn kết Stickiness (Users/MAU %)',
  };

  const metricColorMap = {
    pageview: '#2563eb', // blue
    users: '#4f46e5',    // indigo
    session: '#059669',  // emerald
    vne_user: '#d97706', // amber
    stickiness: '#8b5cf6', // purple
  };

  const primaryColor = metricColorMap[metric];

  // Calculate MEDIAN for reference line instead of arithmetic mean
  const metricValues = data.map((d) => d[metric] || 0);
  const medianVal = data.length > 0
    ? metric === 'stickiness'
      ? Number(calculateMedian(metricValues).toFixed(2))
      : Math.round(calculateMedian(metricValues))
    : 0;

  const chartData = data.map((d) => {
    const val = d[metric] || 0;
    const vsMedianPct = medianVal > 0 ? Number((((val - medianVal) / medianVal) * 100).toFixed(1)) : 0;
    return {
      date: d.date,
      displayDate: d.date.slice(5), // MM-DD
      value: val,
      vsMedianPct,
      dodPct:
        metric === 'pageview'
          ? d.dod_pageview_pct
          : metric === 'users'
          ? d.dod_users_pct
          : metric === 'session'
          ? d.dod_session_pct
          : metric === 'stickiness'
          ? d.dod_stickiness_pct
          : undefined,
      isSelected: d.date === selectedDate,
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
              Biểu đồ Xu hướng &amp; Đối chuẩn Trung vị (Median Baseline)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mục đích follow-up: Đánh giá hiệu suất so với mốc Trung vị chuẩn chu kỳ, loại bỏ nhiễu giảm tự nhiên vào các ngày cuối tuần
          </p>
        </div>

        {/* Metric Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start md:self-auto flex-wrap">
          {(['pageview', 'users', 'session', 'vne_user', 'stickiness'] as const).map((m) => (
            <button
              key={m}
              onClick={() => onChangeMetric(m)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                metric === m
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m === 'pageview'
                ? 'Pageviews'
                : m === 'users'
                ? 'Users'
                : m === 'session'
                ? 'Sessions'
                : m === 'vne_user'
                ? 'VnE Users'
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
                const clickedDate = state.activePayload[0].payload.date;
                if (clickedDate) onSelectDate(clickedDate);
              }
            }}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="displayDate"
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) =>
                metric === 'stickiness'
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
                  <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-lg border border-slate-800 space-y-1.5 min-w-[230px]">
                    <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 flex items-center justify-between gap-4">
                      <span>{getDayOfWeekVi(d.date)} &bull; {d.date}</span>
                      <span className="text-[10px] text-blue-400 font-semibold">Click để chọn</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-1">
                      <span className="text-slate-300">{metricLabelMap[metric]}:</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {metric === 'stickiness' ? `${d.value}%` : formatNumber(d.value)}
                      </span>
                    </div>

                    {/* So với Trung vị toàn kỳ */}
                    <div className="flex items-center justify-between gap-4 text-amber-300">
                      <span>vs Trung vị chu kỳ:</span>
                      <span className="font-mono font-bold">
                        {isAboveMed ? `+${d.vsMedianPct}%` : `${d.vsMedianPct}%`}
                      </span>
                    </div>

                    {d.dodPct !== undefined && (
                      <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800 text-[11px]">
                        <span className="text-slate-400">DoD (nhịp ngày):</span>
                        <span className={`font-bold font-mono ${d.dodPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {d.dodPct >= 0 ? `+${d.dodPct}%` : `${d.dodPct}%`}
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
            {/* Trung vị chu kỳ Reference Line */}
            <ReferenceLine
              y={medianVal}
              stroke="#d97706"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Mốc Trung vị kỳ: ${metric === 'stickiness' ? `${medianVal}%` : formatNumber(medianVal)}`,
                position: 'insideTopRight',
                fill: '#b45309',
                fontSize: 11,
                fontWeight: 600,
              }}
            />
            {selectedDate && (
              <ReferenceLine
                x={selectedDate.slice(5)}
                stroke="#2563eb"
                strokeDasharray="4 4"
                strokeWidth={2}
                strokeOpacity={0.8}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              name={metricLabelMap[metric]}
              stroke={primaryColor}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#metricGradient)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Sub-chart: Day-over-Day (DoD) Change Bar Box with FULL Interactive Hover */}
      <div className="mt-4 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all duration-200 shadow-2xs group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-600" />
              Nhịp độ tăng trưởng ngày (Day-over-Day % change):
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <MousePointer className="w-3 h-3 text-indigo-500" />
              Rê chuột vào cột để xem chi tiết
            </span>
          </div>

          {/* Dynamic hover indicator status badge */}
          {hoveredDod ? (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-xs animate-in fade-in duration-150">
              <span className="font-bold text-indigo-900">
                {getDayOfWeekVi(hoveredDod.date)}, {hoveredDod.date}:
              </span>
              <span className={`font-mono font-bold ${hoveredDod.dodPct !== undefined && hoveredDod.dodPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                DoD: {hoveredDod.dodPct !== undefined ? `${hoveredDod.dodPct > 0 ? '+' : ''}${hoveredDod.dodPct}%` : 'Mốc đầu'}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-amber-800 font-semibold font-mono">
                vs Trung vị: {hoveredDod.vsMedianPct > 0 ? `+${hoveredDod.vsMedianPct}%` : `${hoveredDod.vsMedianPct}%`}
              </span>
            </div>
          ) : (
            <span className="text-slate-500 italic text-[11px] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              Cuối tuần giảm tự nhiên &bull; Đối chiếu mốc Trung vị để đánh giá chuẩn
            </span>
          )}
        </div>

        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              onMouseMove={(state: any) => {
                if (state && state.activePayload && state.activePayload.length > 0) {
                  const d = state.activePayload[0].payload;
                  setHoveredDod({
                    date: d.date,
                    value: d.value,
                    dodPct: d.dodPct,
                    vsMedianPct: d.vsMedianPct,
                  });
                }
              }}
              onMouseLeave={() => setHoveredDod(null)}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload.length > 0) {
                  const clickedDate = state.activePayload[0].payload.date;
                  if (clickedDate && onSelectDate) onSelectDate(clickedDate);
                }
              }}
              margin={{ top: 8, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <Tooltip
                wrapperStyle={{ pointerEvents: 'none', zIndex: 1000 }}
                cursor={{ fill: 'rgba(226, 232, 240, 0.65)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const d = payload[0].payload;
                    const hasDod = d.dodPct !== undefined;
                    const isPos = (d.dodPct ?? 0) >= 0;
                    const isAboveMed = d.vsMedianPct >= 0;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700 min-w-[230px] z-50">
                        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
                          <span>
                            {getDayOfWeekVi(d.date)} &bull; {d.date}
                          </span>
                          {d.date === selectedDate && (
                            <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">
                              Đang chọn
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-400">Giá trị {metricLabelMap[metric]}:</span>
                          <span className="font-mono font-bold text-white">
                            {metric === 'stickiness' ? `${d.value}%` : formatNumber(d.value)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-slate-800 text-amber-300">
                          <span>So với Trung vị kỳ:</span>
                          <span className="font-mono font-bold">
                            {isAboveMed ? `+${d.vsMedianPct}%` : `${d.vsMedianPct}%`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-slate-800/80">
                          <span className="text-slate-400">Tốc độ tăng DoD:</span>
                          <span className={`font-mono font-bold ${hasDod ? (isPos ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-400'}`}>
                            {hasDod ? `${isPos ? '+' : ''}${d.dodPct}%` : 'Mốc ngày đầu'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-2 italic text-center pt-1.5 border-t border-slate-800">
                          Click vào cột để chuyển ngày theo dõi
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="#94a3b8" />
              {selectedDate && (
                <ReferenceLine
                  x={selectedDate.slice(5)}
                  stroke="#2563eb"
                  strokeDasharray="3 3"
                  strokeWidth={2}
                  strokeOpacity={0.8}
                />
              )}
              <Bar
                dataKey="dodPct"
                name="Tăng trưởng % DoD"
                shape={(props: any) => {
                  const { x, y, width, height, value, payload } = props;
                  const isPos = value >= 0;
                  const isCurrent = payload?.date === selectedDate;
                  const isHovered = hoveredDod?.date === payload?.date;
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={isHovered ? (isPos ? '#059669' : '#e11d48') : (isPos ? '#10b981' : '#f43f5e')}
                      stroke={isCurrent ? '#1e40af' : (isHovered ? '#0f172a' : 'none')}
                      strokeWidth={isCurrent ? 2 : (isHovered ? 1.5 : 0)}
                      rx={2}
                      style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                    />
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Follow-up Note */}
      <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Đánh giá chuẩn xác qua Trung vị:</strong> Nếu chỉ số nằm trên đường nét đứt màu cam (Mốc Trung vị kỳ) thì hiệu suất nội dung đạt chuẩn tăng trưởng vững chắc, loại trừ hoàn toàn nhịp giảm tự nhiên cuối tuần.
          </span>
        </div>
        <span className="font-medium text-blue-700 hidden sm:inline">
          Ngày đang chọn: <strong>{getDayOfWeekVi(selectedDate)}, {selectedDate}</strong>
        </span>
      </div>
    </div>
  );
};

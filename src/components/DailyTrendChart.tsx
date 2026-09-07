import React from 'react';
import { DailySummary } from '../types';
import { formatNumber } from '../utils/analytics';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Activity, HelpCircle } from 'lucide-react';

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

  // Calculate average for reference line
  const totalVal = data.reduce((sum, d) => sum + (d[metric] || 0), 0);
  const avgVal = data.length > 0
    ? metric === 'stickiness'
      ? Number((totalVal / data.length).toFixed(2))
      : Math.round(totalVal / data.length)
    : 0;

  const chartData = data.map((d) => ({
    date: d.date,
    displayDate: d.date.slice(5), // MM-DD
    value: d[metric],
    movingAvg:
      metric === 'pageview'
        ? d.moving_avg_pv
        : metric === 'stickiness'
        ? d.moving_avg_stickiness
        : undefined,
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
  }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 mb-6">
      {/* Chart Header with Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Biểu đồ Theo dõi Xu hướng &amp; Tốc độ tăng trưởng hàng ngày
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mục đích follow-up: Bám sát nhịp độ tăng/giảm qua đường Trung bình động (Rolling MA) và tỷ lệ biến động DoD
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
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-lg border border-slate-800 space-y-1">
                    <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 flex items-center justify-between gap-4">
                      <span>Ngày: {d.date}</span>
                      <span className="text-[10px] text-blue-400">Click để chọn ngày này</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-1">
                      <span className="text-slate-300">{metricLabelMap[metric]}:</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {metric === 'stickiness' ? `${d.value}%` : formatNumber(d.value)}
                      </span>
                    </div>
                    {d.movingAvg && (
                      <div className="flex items-center justify-between gap-4 text-amber-300">
                        <span>ĐTB động 3 ngày:</span>
                        <span className="font-mono">
                          {metric === 'stickiness' ? `${d.movingAvg}%` : formatNumber(d.movingAvg)}
                        </span>
                      </div>
                    )}
                    {d.dodPct !== undefined && (
                      <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
                        <span>Tăng trưởng DoD:</span>
                        <span className={`font-bold ${d.dodPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
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
            <ReferenceLine
              y={avgVal}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{
                value: `Mức TB giai đoạn: ${metric === 'stickiness' ? `${avgVal}%` : formatNumber(avgVal)}`,
                position: 'insideTopRight',
                fill: '#64748b',
                fontSize: 11,
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
            {(metric === 'pageview' || metric === 'stickiness') && (
              <Line
                type="monotone"
                dataKey="movingAvg"
                name="Đường trung bình động (Rolling 3-day MA)"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 2"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Sub-chart: Day-over-Day (DoD) Change Bar Chart */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            Nhịp độ tăng trưởng ngày (Day-over-Day % change):
          </span>
          <span className="text-slate-400 italic">
            Cột xanh: Tăng tốc &bull; Cột đỏ: Hạ nhiệt so với hôm trước
          </span>
        </div>
        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
              />
              <ReferenceLine y={0} stroke="#cbd5e1" />
              {selectedDate && (
                <ReferenceLine
                  x={selectedDate.slice(5)}
                  stroke="#2563eb"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  strokeOpacity={0.7}
                />
              )}
              <Bar
                dataKey="dodPct"
                name="Tăng trưởng % DoD"
                shape={(props: any) => {
                  const { x, y, width, height, value } = props;
                  const isPos = value >= 0;
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={isPos ? '#10b981' : '#f43f5e'}
                      rx={2}
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
          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Cách follow hàng ngày:</strong> Quan sát đường xanh nếu cắt lên trên đường nét đứt màu vàng (Rolling MA) nghĩa là tốc độ tăng trưởng đang vào chu kỳ bứt phá.
          </span>
        </div>
        <span className="font-medium text-blue-700 hidden sm:inline">
          Ngày đang chọn: <strong>{selectedDate}</strong>
        </span>
      </div>
    </div>
  );
};

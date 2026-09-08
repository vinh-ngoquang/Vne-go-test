import React from 'react';
import { DailySummary } from '../types';
import { calculateMedian, getDayOfWeekVi } from '../utils/analytics';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { HeartHandshake, Info } from 'lucide-react';

interface EngagementQualityChartProps {
  data: DailySummary[];
  selectedDate: string;
  onSelectDate?: (date: string) => void;
}

export const EngagementQualityChart: React.FC<EngagementQualityChartProps> = ({
  data,
  selectedDate,
  onSelectDate,
}) => {
  const chartData = data.map((d) => ({
    date: d.date,
    displayDate: d.date.slice(5),
    pvPerSession: d.pv_per_session,
    pvPerUser: d.pv_per_user,
    vneUserRatio: d.vne_user_ratio,
    stickiness: d.stickiness,
    isSelected: d.date === selectedDate,
  }));

  // Calculate Medians instead of arithmetic means
  const medianPvSession = data.length > 0
    ? Number(calculateMedian(data.map((c) => c.pv_per_session)).toFixed(2))
    : 0;

  const medianVneRatio = data.length > 0
    ? Number(calculateMedian(data.map((c) => c.vne_user_ratio)).toFixed(1))
    : 0;

  const medianStickiness = data.length > 0
    ? Number(calculateMedian(data.map((c) => c.stickiness)).toFixed(2))
    : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900">
              Theo dõi Chất lượng Bạn đọc &amp; Độ gắn kết (Engagement &amp; Loyalty Quality)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mục đích follow-up: Kiểm tra chất lượng tương tác thực chất — độ sâu phiên đọc, tỷ lệ bạn đọc có tài khoản và độ gắn kết đối chiếu mốc Trung vị chuẩn
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-md font-semibold">
            Trung vị Stickiness: <strong>{medianStickiness}%</strong>
          </span>
          <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-md font-semibold">
            Trung vị Độ sâu: <strong>{medianPvSession}</strong> PV/phiên
          </span>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-semibold">
            Trung vị VnE User: <strong>{medianVneRatio}%</strong>
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                const clickedDate = state.activePayload[0].payload.date;
                if (clickedDate && onSelectDate) onSelectDate(clickedDate);
              }
            }}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="displayDate" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
            {/* Left Axis: PV per Session / PV per User */}
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              domain={[0, 'auto']}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => `${v}`}
            />
            {/* Right Axis: Percentage % */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              domain={[0, 'auto']}
              tick={{ fontSize: 11, fill: '#8b5cf6' }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-lg border border-slate-800 space-y-1.5 min-w-[220px]">
                    <div className="font-bold text-slate-300 pb-1 border-b border-slate-800 flex items-center justify-between">
                      <span>{getDayOfWeekVi(d.date)} &bull; {d.date}</span>
                      {d.date === selectedDate && (
                        <span className="text-[10px] bg-blue-600 px-1 rounded text-white font-semibold">Đang chọn</span>
                      )}
                    </div>
                    <div className="flex justify-between gap-4 py-0.5 text-purple-300">
                      <span>Độ gắn kết Stickiness (Users/MAU):</span>
                      <span className="font-mono font-bold text-white">{d.stickiness}%</span>
                    </div>
                    <div className="flex justify-between gap-4 py-0.5">
                      <span className="text-blue-400">Độ sâu (PV/phiên):</span>
                      <span className="font-mono font-bold text-white">{d.pvPerSession}</span>
                    </div>
                    <div className="flex justify-between gap-4 py-0.5">
                      <span className="text-indigo-400">PV trên mỗi Độc giả (PV/User):</span>
                      <span className="font-mono font-bold text-white">{d.pvPerUser}</span>
                    </div>
                    <div className="flex justify-between gap-4 py-0.5 text-amber-300 border-t border-slate-800 pt-1">
                      <span>Tỷ lệ Độc giả VnE đăng nhập:</span>
                      <span className="font-mono font-bold">{d.vneUserRatio}%</span>
                    </div>
                  </div>
                );
              }}
            />
            <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            <ReferenceLine
              yAxisId="left"
              y={medianPvSession}
              stroke="#d97706"
              strokeDasharray="3 3"
              label={{
                value: `Trung vị độ sâu: ${medianPvSession}`,
                position: 'insideTopLeft',
                fill: '#b45309',
                fontSize: 10,
                fontWeight: 600,
              }}
            />
            {selectedDate && (
              <ReferenceLine
                yAxisId="left"
                x={selectedDate.slice(5)}
                stroke="#2563eb"
                strokeDasharray="4 4"
                strokeWidth={2}
                strokeOpacity={0.8}
              />
            )}
            <Bar
              yAxisId="left"
              dataKey="pvPerSession"
              name="Độ sâu đọc (PV / Phiên)"
              fill="#93c5fd"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="pvPerUser"
              name="Lượt xem / Độc giả (PV / User)"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#2563eb' }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="stickiness"
              name="Độ gắn kết Stickiness (% Users/MAU)"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#8b5cf6' }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="vneUserRatio"
              name="Tỷ lệ bạn đọc VnE (%)"
              stroke="#d97706"
              strokeWidth={2}
              strokeDasharray="3 2"
              dot={{ r: 2.5, fill: '#d97706' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Lưu ý chất lượng:</strong> Sử dụng các mốc Trung vị giúp loại trừ ngày có bài tin bùng nổ ảo (clickbait ngắn hạn) làm lệch trung bình, cho bức tranh chân thực về mức độ gắn kết bền vững của bạn đọc.
        </span>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { RawRecord, CategorySummary } from '../types';
import { formatNumber } from '../utils/analytics';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Layers, PieChart, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface CategoryDailyShareChartProps {
  records: RawRecord[];
  categories: string[];
  selectedDate: string;
  categorySummaries: CategorySummary[];
  onSelectCategory: (cat: string) => void;
  selectedCategory: string;
  onSelectDate?: (date: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Short: '#3b82f6',     // blue
  Podcast: '#8b5cf6',   // purple
  Vodcast: '#ec4899',   // pink
  Discovery: '#10b981', // emerald
  'VnE-GO': '#f59e0b',  // amber
  'Khác / Trang chung': '#64748b', // slate
  Khác: '#94a3b8',
};

export const CategoryDailyShareChart: React.FC<CategoryDailyShareChartProps> = ({
  records,
  categories,
  selectedDate,
  categorySummaries,
  onSelectCategory,
  selectedCategory,
  onSelectDate,
}) => {
  const [viewMode, setViewMode] = useState<'volume' | 'percent'>('volume');

  // Group records by date and category
  const dates = (Array.from(new Set(records.map((r) => r.date_days))).sort()) as string[];

  const chartData = dates.map((d) => {
    const dayRecords = records.filter((r) => r.date_days === d);
    const row: Record<string, any> = {
      date: d,
      displayDate: d.slice(5),
    };

    let dayTotal = 0;
    categories.forEach((cat) => {
      const match = dayRecords.find((r) => r.Catename === cat);
      const pv = match ? match.pageview : 0;
      row[cat] = pv;
      dayTotal += pv;
    });

    if (viewMode === 'percent' && dayTotal > 0) {
      categories.forEach((cat) => {
        row[cat] = Number(((row[cat] / dayTotal) * 100).toFixed(1));
      });
    }

    row.total = dayTotal;
    return row;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Theo dõi Cơ cấu &amp; Động lực tăng trưởng từng Subfolder (Catename)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mục đích follow-up: Xác định chính xác subfolder nào là đầu tàu kéo traffic hôm nay và subfolder nào đang chững lại
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode('volume')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'volume'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lượt xem (Volume)
            </button>
            <button
              onClick={() => setViewMode('percent')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'percent'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tỷ trọng % (Market Share)
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
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
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (viewMode === 'percent' ? `${v}%` : v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${Math.round(v / 1000)}k`)}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                return (
                  <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-lg border border-slate-800 space-y-1">
                    <div className="font-bold text-slate-300 pb-1 border-b border-slate-800">
                      Ngày {label}
                    </div>
                    {payload.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-xs"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-slate-300">{entry.name}:</span>
                        </div>
                        <span className="font-mono font-bold text-white">
                          {viewMode === 'percent'
                            ? `${entry.value}%`
                            : formatNumber(entry.value as number)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              height={32}
              iconType="circle"
              wrapperStyle={{ fontSize: '11px' }}
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
            {categories.map((cat) => {
              const color = CATEGORY_COLORS[cat] || '#64748b';
              const isSelected = selectedCategory === cat;
              return (
                <Area
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  name={cat}
                  stackId="1"
                  stroke={color}
                  fill={color}
                  fillOpacity={selectedCategory === 'ALL' || isSelected ? 0.75 : 0.15}
                  strokeWidth={isSelected ? 3 : 1}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Category Follow-up Leaderboard */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center justify-between">
          <span>Chi tiết hiệu quả theo từng Subfolder &bull; Ngày {selectedDate}</span>
          <span className="text-slate-400 font-normal normal-case">
            Click vào thẻ để lọc chuyên mục tương ứng
          </span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {categorySummaries.map((cat) => {
            const isSelected = selectedCategory === cat.category;
            const color = CATEGORY_COLORS[cat.category] || '#64748b';
            const isPos = (cat.dod_pageview_pct ?? 0) >= 0;

            return (
              <div
                key={cat.category}
                onClick={() => onSelectCategory(isSelected ? 'ALL' : cat.category)}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50 shadow-2xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs font-bold text-slate-800 truncate" title={cat.category}>
                      {cat.category}
                    </span>
                  </div>
                  {cat.dod_pageview_pct !== undefined && (
                    <span
                      className={`text-[10px] font-bold flex items-center ${
                        isPos ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {isPos ? '▲' : '▼'}{Math.abs(cat.dod_pageview_pct)}%
                    </span>
                  )}
                </div>

                <div className="text-sm font-extrabold text-slate-900 font-mono">
                  {formatNumber(cat.pageview)}
                </div>

                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Thị phần: {cat.share_pct}%</span>
                  <span className="font-semibold text-purple-700">Stickiness: {cat.stickiness}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

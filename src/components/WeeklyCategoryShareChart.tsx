import React, { useState } from 'react';
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
import { Layers } from 'lucide-react';
import { WeeklySummary, RawRecord, WeeklyCategorySummary } from '../types';
import { formatNumber, getISOWeekInfo } from '../utils/analytics';

interface WeeklyCategoryShareChartProps {
  allWeeks: WeeklySummary[];
  records: RawRecord[];
  categories: string[];
  selectedWeekKey: string;
  onSelectWeek?: (weekKey: string) => void;
  categorySummaries: WeeklyCategorySummary[];
  onSelectCategory?: (category: string) => void;
  selectedCategory?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Short: '#3b82f6', // blue
  Podcast: '#8b5cf6', // purple
  Vodcast: '#ec4899', // pink
  Discovery: '#10b981', // emerald
  'VnE-GO': '#f59e0b', // amber
  'Khác / Trang chung': '#64748b', // slate
  Khác: '#94a3b8',
};

export const WeeklyCategoryShareChart: React.FC<WeeklyCategoryShareChartProps> = ({
  allWeeks,
  records,
  categories,
  selectedWeekKey,
  onSelectWeek,
  categorySummaries,
  onSelectCategory,
  selectedCategory = 'ALL',
}) => {
  const [viewMode, setViewMode] = useState<'volume' | 'percent'>('volume');

  // Build weekly aggregated data for each category
  const chartData = allWeeks.map((w) => {
    const weekRecords = records.filter(
      (r) => getISOWeekInfo(r.date_days).weekKey === w.weekKey
    );

    const row: Record<string, any> = {
      weekKey: w.weekKey,
      displayWeek: w.shortLabel,
      label: w.label,
    };

    let weekTotal = 0;
    categories.forEach((cat) => {
      const catRecs = weekRecords.filter((r) => (r.Catename || 'Khác') === cat);
      const catPv = catRecs.reduce((sum, r) => sum + r.pageview, 0);
      row[cat] = catPv;
      weekTotal += catPv;
    });

    if (viewMode === 'percent' && weekTotal > 0) {
      categories.forEach((cat) => {
        row[cat] = Number(((row[cat] / weekTotal) * 100).toFixed(1));
      });
    }

    row.total = weekTotal;
    return row;
  });

  const selectedWeek = allWeeks.find((w) => w.weekKey === selectedWeekKey);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Theo dõi Cơ cấu &amp; Động lực tăng trưởng từng Subfolder theo Tuần
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mục đích follow-up: Xác định chính xác subfolder nào là đầu tàu kéo traffic trong tuần và subfolder nào đang chững lại
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
                const clickedKey = state.activePayload[0].payload.weekKey;
                if (clickedKey && onSelectWeek) onSelectWeek(clickedKey);
              }
            }}
            margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="displayWeek"
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) =>
                viewMode === 'percent'
                  ? `${v}%`
                  : v >= 1000000
                  ? `${(v / 1000000).toFixed(1)}M`
                  : `${Math.round(v / 1000)}k`
              }
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const item = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-lg border border-slate-800 space-y-1 min-w-[220px]">
                    <div className="font-bold text-slate-300 pb-1 border-b border-slate-800">
                      {item.label || label}
                    </div>
                    {payload.map((entry) => (
                      <div
                        key={entry.name}
                        className="flex items-center justify-between gap-4 py-0.5"
                      >
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
            {selectedWeek && (
              <ReferenceLine
                x={selectedWeek.shortLabel}
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
                  fillOpacity={
                    selectedCategory === 'ALL' || isSelected ? 0.85 : 0.2
                  }
                  strokeWidth={isSelected ? 3 : 1}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick category filter tags */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs pb-1">
        <span className="text-slate-400 shrink-0 text-[11px]">Lọc xem nhanh:</span>
        <button
          onClick={() => onSelectCategory && onSelectCategory('ALL')}
          className={`px-2.5 py-1 rounded-md transition-all shrink-0 cursor-pointer font-medium ${
            selectedCategory === 'ALL'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tất cả chuyên mục
        </button>
        {categorySummaries.map((cat) => {
          const isSelected = selectedCategory === cat.category;
          return (
            <button
              key={cat.category}
              onClick={() => onSelectCategory && onSelectCategory(cat.category)}
              className={`px-2.5 py-1 rounded-md transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: CATEGORY_COLORS[cat.category] || '#64748b',
                }}
              />
              <span>{cat.category}</span>
              <span
                className={`text-[10px] ${
                  isSelected ? 'text-blue-100' : 'text-slate-500'
                }`}
              >
                ({cat.share_pct}%)
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

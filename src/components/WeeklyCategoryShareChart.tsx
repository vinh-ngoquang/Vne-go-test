import React, { useState, useMemo } from 'react';
import {
  Layers,
  TrendingDown,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Sparkles,
  ArrowUpDown,
  LineChart as LineChartIcon,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { WeeklySummary, RawRecord, WeeklyCategorySummary } from '../types';
import { formatNumber, calculateMedian, getISOWeekInfo } from '../utils/analytics';

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

type FilterScope = 'all' | 'declining_only' | 'growth_only';
type SortField = 'delta_asc' | 'delta_desc' | 'pct_asc' | 'pct_desc' | 'current_val_desc' | 'name_asc';
type ChartStyle = 'area_stacked' | 'line';
type MetricView = 'volume' | 'percent';

interface SubfolderRowData {
  key: string;
  name: string;
  color: string;
  currentVal: number;
  currentShare: number;
  medianVal: number;
  medianShare: number;
  delta: number;
  pctChange: number;
  isDecline: boolean;
  dropContributionPct: number;
  wowPct?: number;
  prevVal?: number;
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

const FALLBACK_PALETTE = [
  '#06b6d4',
  '#f43f5e',
  '#84cc16',
  '#d946ef',
  '#14b8a6',
  '#eab308',
  '#6366f1',
  '#a855f7',
];

const getCategoryColor = (catName: string, index: number): string => {
  if (CATEGORY_COLORS[catName]) return CATEGORY_COLORS[catName];
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
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
  const [filterScope, setFilterScope] = useState<FilterScope>('all');
  const [sortField, setSortField] = useState<SortField>('delta_asc'); // Default: Largest drop first
  const [selectedSubfolderKey, setSelectedSubfolderKey] = useState<string | null>(null);
  const [showTrendChart, setShowTrendChart] = useState<boolean>(false);
  const [metricView, setMetricView] = useState<MetricView>('volume');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('area_stacked');

  // Selected current week object
  const currentWeek = useMemo(() => {
    return allWeeks.find((w) => w.weekKey === selectedWeekKey) || allWeeks[allWeeks.length - 1];
  }, [allWeeks, selectedWeekKey]);

  // Pre-aggregate category total PV per week
  // Map: weekKey -> Map<category, PV>
  const weeklyCatPvMap = useMemo(() => {
    const weekMap = new Map<string, Map<string, number>>();

    allWeeks.forEach((w) => {
      const catMap = new Map<string, number>();
      categories.forEach((c) => catMap.set(c, 0));
      weekMap.set(w.weekKey, catMap);
    });

    records.forEach((r) => {
      const wInfo = getISOWeekInfo(r.date_days);
      const catMap = weekMap.get(wInfo.weekKey);
      if (catMap) {
        const cat = r.Catename || 'Khác / Trang chung';
        catMap.set(cat, (catMap.get(cat) || 0) + r.pageview);
      }
    });

    return weekMap;
  }, [allWeeks, records, categories]);

  // Current week total PV across all subfolders
  const currentWeekTotalPV = useMemo(() => {
    const catMap = weeklyCatPvMap.get(selectedWeekKey);
    if (!catMap) return 0;
    let sum = 0;
    catMap.forEach((val) => {
      sum += val;
    });
    return sum;
  }, [weeklyCatPvMap, selectedWeekKey]);

  // Median total PV across all weeks
  const medianTotalPV = useMemo(() => {
    const weeklyTotals = allWeeks.map((w) => {
      const catMap = weeklyCatPvMap.get(w.weekKey);
      if (!catMap) return 0;
      let sum = 0;
      catMap.forEach((v) => {
        sum += v;
      });
      return sum;
    });
    return calculateMedian(weeklyTotals);
  }, [allWeeks, weeklyCatPvMap]);

  // Compute Subfolder rows with Median, Deltas, Shares (Strictly factual math)
  const allSubfolderRows = useMemo<SubfolderRowData[]>(() => {
    const rawRows = categories.map((catName, idx) => {
      const color = getCategoryColor(catName, idx);

      // Extract PV of this category across all weeks
      const valuesOnly = allWeeks.map((w) => {
        const catMap = weeklyCatPvMap.get(w.weekKey);
        return catMap?.get(catName) || 0;
      });

      const medianVal = Math.round(calculateMedian(valuesOnly));
      const catMapCurr = weeklyCatPvMap.get(selectedWeekKey);
      const currentVal = catMapCurr?.get(catName) || 0;

      const delta = currentVal - medianVal;
      const pctChange = medianVal > 0 ? Number(((delta / medianVal) * 100).toFixed(1)) : 0;

      const currentShare = currentWeekTotalPV > 0 ? Number(((currentVal / currentWeekTotalPV) * 100).toFixed(1)) : 0;
      const medianShare = medianTotalPV > 0 ? Number(((medianVal / medianTotalPV) * 100).toFixed(1)) : 0;

      // Check WoW pct from categorySummaries if available
      const summaryItem = categorySummaries.find((s) => s.category === catName);
      const wowPct = summaryItem?.wow_pageview_pct;
      const prevVal = summaryItem?.prev_pageview;

      return {
        key: catName,
        name: catName,
        color,
        currentVal,
        currentShare,
        medianVal,
        medianShare,
        delta,
        pctChange,
        isDecline: delta < 0,
        wowPct,
        prevVal,
      };
    });

    const totalDropPV = rawRows
      .filter((r) => r.delta < 0)
      .reduce((sum, r) => sum + Math.abs(r.delta), 0);

    return rawRows.map((r) => {
      const dropContributionPct =
        r.delta < 0 && totalDropPV > 0
          ? Number(((Math.abs(r.delta) / totalDropPV) * 100).toFixed(1))
          : 0;

      return {
        ...r,
        dropContributionPct,
      };
    });
  }, [categories, allWeeks, weeklyCatPvMap, selectedWeekKey, currentWeekTotalPV, medianTotalPV, categorySummaries]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    let list = [...allSubfolderRows];
    if (filterScope === 'declining_only') {
      list = list.filter((r) => r.isDecline);
    } else if (filterScope === 'growth_only') {
      list = list.filter((r) => !r.isDecline && r.delta > 0);
    }

    // Apply sorting
    list.sort((a, b) => {
      switch (sortField) {
        case 'delta_asc':
          return a.delta - b.delta; // Most negative first
        case 'delta_desc':
          return b.delta - a.delta;
        case 'pct_asc':
          return a.pctChange - b.pctChange;
        case 'pct_desc':
          return b.pctChange - a.pctChange;
        case 'current_val_desc':
          return b.currentVal - a.currentVal;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        default:
          return a.delta - b.delta;
      }
    });

    return list;
  }, [allSubfolderRows, filterScope, sortField]);

  // Top metric highlights (purely factual numbers)
  const topDroppingSubfolder = useMemo(() => {
    const drops = [...allSubfolderRows].filter((r) => r.delta < 0).sort((a, b) => a.delta - b.delta);
    return drops.length > 0 ? drops[0] : null;
  }, [allSubfolderRows]);

  const topGrowthSubfolder = useMemo(() => {
    const gains = [...allSubfolderRows].filter((r) => r.delta > 0).sort((a, b) => b.delta - a.delta);
    return gains.length > 0 ? gains[0] : null;
  }, [allSubfolderRows]);

  const topVolumeSubfolder = useMemo(() => {
    const sorted = [...allSubfolderRows].sort((a, b) => b.currentVal - a.currentVal);
    return sorted.length > 0 ? sorted[0] : null;
  }, [allSubfolderRows]);

  // Active selected row
  const activeSelectedRow = useMemo(() => {
    if (selectedSubfolderKey) {
      return allSubfolderRows.find((r) => r.key === selectedSubfolderKey) || null;
    }
    if (selectedCategory && selectedCategory !== 'ALL') {
      return allSubfolderRows.find((r) => r.key === selectedCategory) || null;
    }
    return topDroppingSubfolder || allSubfolderRows[0] || null;
  }, [selectedSubfolderKey, selectedCategory, allSubfolderRows, topDroppingSubfolder]);

  // Max absolute delta for relative bar scaling
  const maxAbsDelta = useMemo(() => {
    const deltas = allSubfolderRows.map((r) => Math.abs(r.delta));
    return Math.max(...deltas, 1);
  }, [allSubfolderRows]);

  const countDeclining = useMemo(() => {
    return allSubfolderRows.filter((r) => r.isDecline).length;
  }, [allSubfolderRows]);

  const countGrowth = useMemo(() => {
    return allSubfolderRows.filter((r) => !r.isDecline && r.delta > 0).length;
  }, [allSubfolderRows]);

  // Multi-week trend chart data for Recharts
  const trendChartData = useMemo(() => {
    return allWeeks.map((w) => {
      const catMap = weeklyCatPvMap.get(w.weekKey);
      const row: Record<string, any> = {
        weekKey: w.weekKey,
        shortLabel: w.shortLabel,
        label: w.label,
      };

      let weekTotal = 0;
      categories.forEach((cat) => {
        const pv = catMap?.get(cat) || 0;
        row[cat] = pv;
        weekTotal += pv;
      });

      if (metricView === 'percent' && weekTotal > 0) {
        categories.forEach((cat) => {
          row[cat] = Number(((row[cat] / weekTotal) * 100).toFixed(1));
        });
      }

      row.total = weekTotal;
      return row;
    });
  }, [allWeeks, weeklyCatPvMap, categories, metricView]);

  const handleRowClick = (catName: string) => {
    setSelectedSubfolderKey(catName);
    if (onSelectCategory) {
      onSelectCategory(catName);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 mb-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Theo dõi Cơ cấu &amp; Động lực tăng trưởng từng Subfolder theo Tuần
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Mốc {allWeeks.length} Tuần
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Đối chiếu số liệu thực tế từng Subfolder so với mốc Trung vị chuẩn &bull; Theo dõi quy mô và mức độ đóng góp
          </p>
        </div>

        {/* Action / Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Button Hiện / Ẩn Biểu Đồ Xu Hướng */}
          <button
            onClick={() => setShowTrendChart(!showTrendChart)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              showTrendChart
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-200'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
            title="Bật hoặc tắt biểu đồ xu hướng nhiều tuần"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{showTrendChart ? 'Ẩn Biểu Đồ Xu Hướng' : 'Hiện Biểu Đồ Xu Hướng'}</span>
          </button>

          {/* Filter Scope Pills */}
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setFilterScope('all')}
              className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                filterScope === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({allSubfolderRows.length})
            </button>
            <button
              onClick={() => setFilterScope('declining_only')}
              className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                filterScope === 'declining_only'
                  ? 'bg-rose-500 text-white font-bold shadow-2xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Sụt giảm ({countDeclining})</span>
            </button>
            <button
              onClick={() => setFilterScope('growth_only')}
              className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                filterScope === 'growth_only'
                  ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Tăng trưởng ({countGrowth})</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 text-[11px]">Xếp theo:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="delta_asc">Giảm nhiều nhất vs Trung vị (Mặc định)</option>
              <option value="delta_desc">Tăng nhiều nhất vs Trung vị</option>
              <option value="pct_asc">% Lệch giảm nhiều nhất</option>
              <option value="pct_desc">% Lệch tăng nhiều nhất</option>
              <option value="current_val_desc">PV Tuần này (Lớn nhất)</option>
              <option value="name_asc">Tên Subfolder (A - Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Factual Summary Metric Highlights (Purely quantitative numbers, no subjective text) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Card 1: Subfolder Giảm Nhiều Nhất */}
        <div className="p-3.5 rounded-xl border bg-rose-50/60 border-rose-200">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-rose-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Giảm Nhiều Nhất vs. Trung Vị</span>
            </span>
            {topDroppingSubfolder && topDroppingSubfolder.dropContributionPct > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-900">
                Chiếm {topDroppingSubfolder.dropContributionPct}% lượng giảm
              </span>
            )}
          </div>
          {topDroppingSubfolder ? (
            <div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-base font-black text-rose-900 font-mono">
                  {topDroppingSubfolder.name}
                </span>
                <span className="text-xs font-bold text-rose-700 font-mono">
                  {formatNumber(topDroppingSubfolder.delta)} PV ({topDroppingSubfolder.pctChange}%)
                </span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-3">
                <span>Tuần này: <strong className="font-mono">{formatNumber(topDroppingSubfolder.currentVal)} PV</strong></span>
                <span>Trung vị: <strong className="font-mono">{formatNumber(topDroppingSubfolder.medianVal)} PV</strong></span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-1">Không có subfolder nào giảm so với trung vị.</p>
          )}
        </div>

        {/* Card 2: Subfolder Có Lượng Xem Lớn Nhất */}
        <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Lượng Xem Lớn Nhất Tuần Này</span>
            </span>
            {topVolumeSubfolder && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                Thị phần {topVolumeSubfolder.currentShare}%
              </span>
            )}
          </div>
          {topVolumeSubfolder ? (
            <div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-base font-black text-slate-900 font-mono">
                  {topVolumeSubfolder.name}
                </span>
                <span className="text-xs font-bold text-slate-700 font-mono">
                  {formatNumber(topVolumeSubfolder.currentVal)} PV
                </span>
                <span className={`text-[11px] font-bold ${topVolumeSubfolder.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ({topVolumeSubfolder.delta >= 0 ? '+' : ''}{formatNumber(topVolumeSubfolder.delta)} vs Trung vị)
                </span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-3">
                <span>Thị phần tuần này: <strong className="font-mono">{topVolumeSubfolder.currentShare}%</strong></span>
                <span>Thị phần trung vị: <strong className="font-mono">{topVolumeSubfolder.medianShare}%</strong></span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-1">Chưa có dữ liệu subfolder.</p>
          )}
        </div>

        {/* Card 3: Subfolder Tăng Trưởng Tốt Nhất */}
        <div className="p-3.5 rounded-xl border bg-emerald-50/60 border-emerald-200">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-emerald-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Tăng Trưởng Tốt Nhất vs. Trung Vị</span>
            </span>
            {topGrowthSubfolder && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                +{topGrowthSubfolder.pctChange}% vs Trung vị
              </span>
            )}
          </div>
          {topGrowthSubfolder ? (
            <div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-base font-black text-emerald-900 font-mono">
                  {topGrowthSubfolder.name}
                </span>
                <span className="text-xs font-bold text-emerald-700 font-mono">
                  +{formatNumber(topGrowthSubfolder.delta)} PV
                </span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-3">
                <span>Tuần này: <strong className="font-mono">{formatNumber(topGrowthSubfolder.currentVal)} PV</strong></span>
                <span>Trung vị: <strong className="font-mono">{formatNumber(topGrowthSubfolder.medianVal)} PV</strong></span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-1">
              Chưa có subfolder nào vượt mốc trung vị trong tuần hiện tại.
            </p>
          )}
        </div>
      </div>

      {/* 3. Multi-Week Trend Chart (Triggered by Button) */}
      {showTrendChart && (
        <div className="mb-5 p-4 rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50/30 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-indigo-100">
            <div className="flex items-center gap-2">
              <LineChartIcon className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900">
                Biểu đồ Xu hướng &amp; Cơ cấu Subfolder qua {allWeeks.length} Tuần quan sát
              </h3>
              <span className="text-[11px] text-slate-500">
                (Đường nét đứt đánh dấu tuần: <strong>{currentWeek.shortLabel}</strong>)
              </span>
            </div>

            {/* Controls: Volume vs Percent & Area vs Line */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Metric View Toggle: Volume vs Percent */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  onClick={() => setMetricView('volume')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    metricView === 'volume'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Lượt xem (Volume)
                </button>
                <button
                  onClick={() => setMetricView('percent')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    metricView === 'percent'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tỷ trọng % (Market Share)
                </button>
              </div>

              {/* Chart Style: Stacked Area vs Multi-Line */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  onClick={() => setChartStyle('area_stacked')}
                  className={`px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                    chartStyle === 'area_stacked'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Biểu đồ diện tích xếp chồng"
                >
                  <BarChart3 className="w-3 h-3" />
                  <span>Xếp chồng</span>
                </button>
                <button
                  onClick={() => setChartStyle('line')}
                  className={`px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                    chartStyle === 'line'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Biểu đồ đường riêng biệt"
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>Từng đường</span>
                </button>
              </div>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartStyle === 'area_stacked' ? (
                <AreaChart
                  data={trendChartData}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      const clickedWeekKey = e.activePayload[0].payload?.weekKey;
                      if (clickedWeekKey && onSelectWeek) onSelectWeek(clickedWeekKey);
                    }
                  }}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => {
                      if (metricView === 'percent') return `${val}%`;
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                      if (val >= 1000) return `${Math.round(val / 1000)}k`;
                      return `${val}`;
                    }}
                    width={50}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      metricView === 'percent'
                        ? `${val}%`
                        : `${formatNumber(Number(val) || 0)} PV`,
                      name,
                    ]}
                    labelFormatter={(label, payload) => {
                      const item = payload && payload[0] ? payload[0].payload : null;
                      return item ? `${item.label || item.shortLabel}` : `${label}`;
                    }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      borderColor: '#cbd5e1',
                      fontSize: '11px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="circle" />
                  <ReferenceLine
                    x={currentWeek.shortLabel}
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{
                      value: `Tuần này (${currentWeek.shortLabel})`,
                      position: 'top',
                      fill: '#b91c1c',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  />
                  {categories.map((cat, idx) => {
                    const color = getCategoryColor(cat, idx);
                    const isSelected = selectedCategory === cat || activeSelectedRow?.name === cat;
                    return (
                      <Area
                        key={cat}
                        type="monotone"
                        dataKey={cat}
                        name={cat}
                        stackId="1"
                        stroke={color}
                        fill={color}
                        fillOpacity={isSelected || selectedCategory === 'ALL' ? 0.8 : 0.25}
                        strokeWidth={isSelected ? 2.5 : 1}
                      />
                    );
                  })}
                </AreaChart>
              ) : (
                <LineChart
                  data={trendChartData}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      const clickedWeekKey = e.activePayload[0].payload?.weekKey;
                      if (clickedWeekKey && onSelectWeek) onSelectWeek(clickedWeekKey);
                    }
                  }}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => {
                      if (metricView === 'percent') return `${val}%`;
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                      if (val >= 1000) return `${Math.round(val / 1000)}k`;
                      return `${val}`;
                    }}
                    width={50}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      metricView === 'percent'
                        ? `${val}%`
                        : `${formatNumber(Number(val) || 0)} PV`,
                      name,
                    ]}
                    labelFormatter={(label, payload) => {
                      const item = payload && payload[0] ? payload[0].payload : null;
                      return item ? `${item.label || item.shortLabel}` : `${label}`;
                    }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      borderColor: '#cbd5e1',
                      fontSize: '11px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="circle" />
                  <ReferenceLine
                    x={currentWeek.shortLabel}
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{
                      value: `Tuần này (${currentWeek.shortLabel})`,
                      position: 'top',
                      fill: '#b91c1c',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  />
                  {categories.map((cat, idx) => {
                    const color = getCategoryColor(cat, idx);
                    const isSelected = selectedCategory === cat || activeSelectedRow?.name === cat;
                    return (
                      <Line
                        key={cat}
                        type="monotone"
                        dataKey={cat}
                        name={cat}
                        stroke={color}
                        strokeWidth={isSelected ? 3.5 : 2}
                        dot={{ r: isSelected ? 4 : 2, fill: color }}
                        activeDot={{ r: 6 }}
                      />
                    );
                  })}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. The Clean Factual 5-Column Data Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <th className="py-2.5 px-4 min-w-[160px]">Subfolder / Chuyên Mục</th>
              <th className="py-2.5 px-3 text-right min-w-[120px]">Tỷ Trọng Tuần Này</th>
              <th className="py-2.5 px-4 text-right min-w-[140px]">
                Tuần Này ({currentWeek.shortLabel})
              </th>
              <th className="py-2.5 px-4 text-right min-w-[130px]">
                Mốc Trung Vị ({allWeeks.length} tuần)
              </th>
              <th className="py-2.5 px-4 text-right min-w-[160px]">
                Lệch vs. Trung Vị
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.map((row) => {
              const isSelected = activeSelectedRow?.key === row.key;
              const isDrop = row.delta < 0;
              const barWidth = Math.min(100, Math.round((Math.abs(row.delta) / maxAbsDelta) * 100));

              return (
                <tr
                  key={row.key}
                  onClick={() => handleRowClick(row.name)}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border-l-4 border-l-blue-600 font-medium'
                      : isDrop
                      ? 'bg-rose-50/20 hover:bg-rose-50/40'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Category Name */}
                  <td className="py-2.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: row.color }}
                      ></span>
                      <span className="font-mono text-[13px] font-bold text-slate-900">
                        {row.name}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] text-blue-600 font-bold">
                          &bull; Đang chọn
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Current Share vs Median Share */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="font-mono font-bold text-slate-900">
                      {row.currentShare}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Chuẩn: {row.medianShare}%
                    </div>
                  </td>

                  {/* Current Week Value & WoW */}
                  <td className="py-2.5 px-4 text-right">
                    <div className="font-mono font-bold text-slate-900">
                      {formatNumber(row.currentVal)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {row.wowPct !== undefined ? (
                        <span className={row.wowPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          WoW: {row.wowPct >= 0 ? '+' : ''}{row.wowPct}%
                        </span>
                      ) : (
                        'Tuần đầu tiên'
                      )}
                    </div>
                  </td>

                  {/* Median Value */}
                  <td className="py-2.5 px-4 text-right">
                    <div className="font-mono font-bold text-slate-700">
                      {formatNumber(row.medianVal)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Mốc chuẩn {allWeeks.length} tuần
                    </div>
                  </td>

                  {/* Delta & Percentage vs Median */}
                  <td className="py-2.5 px-4 text-right">
                    <div
                      className={`font-mono font-bold flex items-center justify-end gap-1 ${
                        isDrop ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {isDrop ? (
                        <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>
                        {row.delta > 0 ? '+' : ''}
                        {formatNumber(row.delta)}
                      </span>
                      <span className="text-[11px] font-semibold">
                        ({row.pctChange > 0 ? '+' : ''}{row.pctChange}%)
                      </span>
                    </div>

                    {/* Mini relative deviation bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden flex justify-end">
                      <div
                        className={`h-full rounded-full ${
                          isDrop ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Table Footer: Grand Total */}
          <tfoot>
            <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
              <td className="py-3 px-4 font-bold text-slate-900 text-[13px]">
                TỔNG TOÀN BỘ SUBFOLDER
              </td>
              <td className="py-3 px-3 text-right font-bold text-slate-700 text-xs">
                100%
              </td>
              <td className="py-3 px-4 text-right font-mono text-sm text-slate-950">
                {formatNumber(currentWeekTotalPV)}
              </td>
              <td className="py-3 px-4 text-right font-mono text-slate-700">
                {formatNumber(medianTotalPV)}
              </td>
              <td className="py-3 px-4 text-right font-mono">
                {(() => {
                  const totalDelta = currentWeekTotalPV - medianTotalPV;
                  const totalPct = medianTotalPV > 0 ? Number(((totalDelta / medianTotalPV) * 100).toFixed(1)) : 0;
                  return (
                    <span className={totalDelta < 0 ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                      {totalDelta > 0 ? '+' : ''}{formatNumber(totalDelta)} ({totalPct > 0 ? '+' : ''}{totalPct}%)
                    </span>
                  );
                })()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

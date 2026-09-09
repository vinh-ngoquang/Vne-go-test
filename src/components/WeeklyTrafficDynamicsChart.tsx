import React, { useState, useMemo } from 'react';
import {
  Share2,
  TrendingDown,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Sparkles,
  ArrowUpDown,
  Layers,
  LineChart as LineChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { WeeklySummary } from '../types';
import { formatNumber, calculateMedian } from '../utils/analytics';

interface WeeklyTrafficDynamicsChartProps {
  allWeeks: WeeklySummary[];
  currentWeek: WeeklySummary;
  prevWeek?: WeeklySummary | null;
  onSelectWeek?: (weekKey: string) => void;
}

type FilterScope = 'all' | 'declining_only' | 'internal_only' | 'external_only';
type SortField = 'delta_asc' | 'pct_asc' | 'current_val_desc' | 'name_asc';
type ChartMode = 'detail' | 'macro';

interface ChannelRowData {
  key: string;
  name: string; // Original exact name: I_Folder, I_Home, etc.
  type: 'internal' | 'external';
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

const CHANNEL_DEFS = [
  { key: 'I_Folder', name: 'I_Folder', type: 'internal' as const, color: '#ec4899' },
  { key: 'I_Home', name: 'I_Home', type: 'internal' as const, color: '#6366f1' },
  { key: 'I_Detail', name: 'I_Detail', type: 'internal' as const, color: '#06b6d4' },
  { key: 'E_Social', name: 'E_Social', type: 'external' as const, color: '#3b82f6' },
  { key: 'E_Search', name: 'E_Search', type: 'external' as const, color: '#f59e0b' },
  { key: 'E_Direct', name: 'E_Direct', type: 'external' as const, color: '#10b981' },
  { key: 'E_Referrer', name: 'E_Referrer', type: 'external' as const, color: '#8b5cf6' },
  { key: 'I_Other', name: 'I_Other', type: 'internal' as const, color: '#94a3b8' },
];

/**
 * Extract channel metric value for a given week summary
 */
const getChannelValue = (w: WeeklySummary, key: string): number => {
  if (!w) return 0;
  if (key === 'External') return w.total_external || 0;
  if (key === 'Internal') return w.total_internal || 0;
  if (key === 'I_Other') {
    return (w.I_Other || 0) + (w.I_24h || 0) + (w.I_Topic || 0) + (w.I_Tag || 0);
  }
  return (w as any)[key] || 0;
};

export const WeeklyTrafficDynamicsChart: React.FC<WeeklyTrafficDynamicsChartProps> = ({
  allWeeks,
  currentWeek,
  prevWeek,
  onSelectWeek,
}) => {
  const [filterScope, setFilterScope] = useState<FilterScope>('all');
  const [sortField, setSortField] = useState<SortField>('delta_asc'); // Default: Largest drop first
  const [selectedChannelKey, setSelectedChannelKey] = useState<string | null>(null);
  const [showTrendChart, setShowTrendChart] = useState<boolean>(false);
  const [chartMode, setChartMode] = useState<ChartMode>('detail');

  // Identify previous week
  const previousWeek = useMemo(() => {
    if (prevWeek) return prevWeek;
    const currentIndex = allWeeks.findIndex((w) => w.weekKey === currentWeek?.weekKey);
    if (currentIndex > 0) {
      return allWeeks[currentIndex - 1];
    }
    return null;
  }, [prevWeek, allWeeks, currentWeek]);

  // Total current week traffic
  const currentWeekTotalPV = useMemo(() => {
    return currentWeek ? (currentWeek.total_external || 0) + (currentWeek.total_internal || 0) : 0;
  }, [currentWeek]);

  // Total median traffic across all weeks
  const medianTotalPV = useMemo(() => {
    const weeklyTotals = allWeeks.map((w) => (w.total_external || 0) + (w.total_internal || 0));
    return calculateMedian(weeklyTotals);
  }, [allWeeks]);

  // Compute raw channel rows with median and deltas (strictly mathematical)
  const allChannelRows = useMemo<ChannelRowData[]>(() => {
    const rawRows = CHANNEL_DEFS.map((ch) => {
      const valuesOnly = allWeeks.map((w) => getChannelValue(w, ch.key));
      const medianVal = calculateMedian(valuesOnly);
      const currentVal = getChannelValue(currentWeek, ch.key);
      const delta = currentVal - medianVal;
      const pctChange = medianVal > 0 ? Number(((delta / medianVal) * 100).toFixed(1)) : 0;

      const currentShare = currentWeekTotalPV > 0 ? Number(((currentVal / currentWeekTotalPV) * 100).toFixed(1)) : 0;
      const medianShare = medianTotalPV > 0 ? Number(((medianVal / medianTotalPV) * 100).toFixed(1)) : 0;

      // Calculate WoW vs previous week
      const prevVal = previousWeek ? getChannelValue(previousWeek, ch.key) : undefined;
      let wowPct: number | undefined = undefined;
      if (prevVal !== undefined && prevVal > 0) {
        wowPct = Number((((currentVal - prevVal) / prevVal) * 100).toFixed(1));
      } else if (prevVal === 0 && currentVal > 0) {
        wowPct = 100;
      }

      return {
        key: ch.key,
        name: ch.name,
        type: ch.type,
        color: ch.color,
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
  }, [allWeeks, currentWeek, previousWeek, currentWeekTotalPV, medianTotalPV]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    let list = [...allChannelRows];
    if (filterScope === 'declining_only') {
      list = list.filter((r) => r.isDecline);
    } else if (filterScope === 'internal_only') {
      list = list.filter((r) => r.type === 'internal');
    } else if (filterScope === 'external_only') {
      list = list.filter((r) => r.type === 'external');
    }

    // Apply sorting
    list.sort((a, b) => {
      switch (sortField) {
        case 'delta_asc':
          return a.delta - b.delta; // Most negative first
        case 'pct_asc':
          return a.pctChange - b.pctChange;
        case 'current_val_desc':
          return b.currentVal - a.currentVal;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        default:
          return a.delta - b.delta;
      }
    });

    return list;
  }, [allChannelRows, filterScope, sortField]);

  // Highlights
  const topDroppingChannel = useMemo(() => {
    const drops = [...allChannelRows].filter((r) => r.delta < 0).sort((a, b) => a.delta - b.delta);
    return drops.length > 0 ? drops[0] : null;
  }, [allChannelRows]);

  const topGrowthChannel = useMemo(() => {
    const gains = [...allChannelRows].filter((r) => r.delta > 0).sort((a, b) => b.delta - a.delta);
    return gains.length > 0 ? gains[0] : null;
  }, [allChannelRows]);

  // Selected row for inspection
  const activeSelectedRow = useMemo(() => {
    if (selectedChannelKey) {
      return allChannelRows.find((r) => r.key === selectedChannelKey) || null;
    }
    return topDroppingChannel || allChannelRows[0] || null;
  }, [selectedChannelKey, allChannelRows, topDroppingChannel]);

  // Macro groups (Internal vs External)
  const macroStats = useMemo(() => {
    const extWeekly = allWeeks.map((w) => w.total_external || 0);
    const intWeekly = allWeeks.map((w) => w.total_internal || 0);

    const extMedian = calculateMedian(extWeekly);
    const intMedian = calculateMedian(intWeekly);

    const extCurrent = currentWeek ? currentWeek.total_external || 0 : 0;
    const intCurrent = currentWeek ? currentWeek.total_internal || 0 : 0;

    const extDelta = extCurrent - extMedian;
    const intDelta = intCurrent - intMedian;

    const extPct = extMedian > 0 ? Number(((extDelta / extMedian) * 100).toFixed(1)) : 0;
    const intPct = intMedian > 0 ? Number(((intDelta / intMedian) * 100).toFixed(1)) : 0;

    return {
      extMedian,
      intMedian,
      extCurrent,
      intCurrent,
      extDelta,
      intDelta,
      extPct,
      intPct,
    };
  }, [allWeeks, currentWeek]);

  // Total previous week traffic and WoW for total
  const prevWeekTotalPV = useMemo(() => {
    return previousWeek ? (previousWeek.total_external || 0) + (previousWeek.total_internal || 0) : undefined;
  }, [previousWeek]);

  const totalWoWPct = useMemo(() => {
    if (prevWeekTotalPV !== undefined && prevWeekTotalPV > 0) {
      return Number((((currentWeekTotalPV - prevWeekTotalPV) / prevWeekTotalPV) * 100).toFixed(1));
    }
    return undefined;
  }, [currentWeekTotalPV, prevWeekTotalPV]);

  // Multi-week trend series data for Recharts
  const trendChartData = useMemo(() => {
    return allWeeks.map((w) => {
      const extTotal = w.total_external || 0;
      const intTotal = w.total_internal || 0;
      const grandTotal = extTotal + intTotal;
      const otherVal = (w.I_Other || 0) + (w.I_24h || 0) + (w.I_Topic || 0) + (w.I_Tag || 0);

      return {
        weekKey: w.weekKey,
        shortLabel: w.shortLabel,
        label: w.label,
        I_Folder: w.I_Folder || 0,
        I_Home: w.I_Home || 0,
        I_Detail: w.I_Detail || 0,
        E_Social: w.E_Social || 0,
        E_Search: w.E_Search || 0,
        E_Direct: w.E_Direct || 0,
        E_Referrer: w.E_Referrer || 0,
        I_Other: otherVal,
        External: extTotal,
        Internal: intTotal,
        GrandTotal: grandTotal,
      };
    });
  }, [allWeeks]);

  // Visible lines in the trend chart according to filter and chart mode
  const visibleTrendLines = useMemo(() => {
    if (chartMode === 'macro') {
      return [
        { key: 'External', name: 'External', color: '#10b981', strokeWidth: 2.5 },
        { key: 'Internal', name: 'Internal', color: '#6366f1', strokeWidth: 2.5 },
        { key: 'GrandTotal', name: 'Tổng Toàn Kênh', color: '#0f172a', strokeWidth: 2, strokeDasharray: '4 4' },
      ];
    }

    if (filterScope === 'internal_only') {
      return CHANNEL_DEFS.filter((c) => c.type === 'internal').map((c) => ({
        key: c.key,
        name: c.name,
        color: c.color,
        strokeWidth: selectedChannelKey === c.key ? 3 : 2,
      }));
    }

    if (filterScope === 'external_only') {
      return CHANNEL_DEFS.filter((c) => c.type === 'external').map((c) => ({
        key: c.key,
        name: c.name,
        color: c.color,
        strokeWidth: selectedChannelKey === c.key ? 3 : 2,
      }));
    }

    if (filterScope === 'declining_only') {
      const decliningKeys = new Set(allChannelRows.filter((r) => r.isDecline).map((r) => r.key));
      return CHANNEL_DEFS.filter((c) => decliningKeys.has(c.key)).map((c) => ({
        key: c.key,
        name: c.name,
        color: c.color,
        strokeWidth: selectedChannelKey === c.key ? 3 : 2,
      }));
    }

    return CHANNEL_DEFS.map((c) => ({
      key: c.key,
      name: c.name,
      color: c.color,
      strokeWidth: selectedChannelKey === c.key ? 3 : 2,
    }));
  }, [chartMode, filterScope, selectedChannelKey, allChannelRows]);

  // Max absolute delta for relative bar scaling
  const maxAbsDelta = useMemo(() => {
    const deltas = allChannelRows.map((r) => Math.abs(r.delta));
    return Math.max(...deltas, 1);
  }, [allChannelRows]);

  const countDeclining = useMemo(() => {
    return allChannelRows.filter((r) => r.isDecline).length;
  }, [allChannelRows]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 mb-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Động thái &amp; Nguồn Sụt giảm Pageview theo Tuần
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Mốc {allWeeks.length} Tuần
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bóc tách từng nguồn lưu lượng so với mốc Trung vị chuẩn &bull; Theo dõi độ lệch và mức độ đóng góp
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
              Tất cả ({allChannelRows.length})
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
              onClick={() => setFilterScope('internal_only')}
              className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                filterScope === 'internal_only'
                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nội bộ (I_*)
            </button>
            <button
              onClick={() => setFilterScope('external_only')}
              className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                filterScope === 'external_only'
                  ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nguồn ngoài (E_*)
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
              <option value="delta_asc">Giảm sâu nhất vs Trung vị (Mặc định)</option>
              <option value="pct_asc">% Lệch giảm nhiều nhất</option>
              <option value="current_val_desc">PV Tuần này (Lớn nhất)</option>
              <option value="name_asc">Tên nguồn (A - Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Factual Summary Metric Highlights (Purely quantitative numbers, no subjective commentary) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Card 1: Top Dropping Channel */}
        <div className="p-3.5 rounded-xl border bg-rose-50/60 border-rose-200">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-rose-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Nguồn Sụt Giảm Sâu Nhất</span>
            </span>
            {topDroppingChannel && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-900">
                Chiếm {topDroppingChannel.dropContributionPct}% lượng hụt
              </span>
            )}
          </div>
          {topDroppingChannel ? (
            <div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-base font-black text-rose-900 font-mono">
                  {topDroppingChannel.name}
                </span>
                <span className="text-xs font-bold text-rose-700 font-mono">
                  {formatNumber(topDroppingChannel.delta)} PV ({topDroppingChannel.pctChange}%)
                </span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-3">
                <span>Tuần này: <strong className="font-mono">{formatNumber(topDroppingChannel.currentVal)} PV</strong></span>
                <span>Trung vị: <strong className="font-mono">{formatNumber(topDroppingChannel.medianVal)} PV</strong></span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-emerald-700 font-medium mt-1">
              Tất cả các nguồn lưu lượng tuần này đều đạt hoặc vượt mốc Trung vị chuẩn!
            </p>
          )}
        </div>

        {/* Card 2: Macro Balance - Internal vs External */}
        <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Cán Cân External vs. Internal</span>
            </span>
          </div>
          <div className="space-y-1.5 mt-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>External:</span>
              </span>
              <span className="font-mono font-bold">
                {formatNumber(macroStats.extCurrent)} PV{' '}
                <span className={macroStats.extDelta < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  ({macroStats.extDelta > 0 ? '+' : ''}{formatNumber(macroStats.extDelta)} | {macroStats.extPct}%)
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>Internal:</span>
              </span>
              <span className="font-mono font-bold">
                {formatNumber(macroStats.intCurrent)} PV{' '}
                <span className={macroStats.intDelta < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  ({macroStats.intDelta > 0 ? '+' : ''}{formatNumber(macroStats.intDelta)} | {macroStats.intPct}%)
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Top Growth Channel */}
        <div className="p-3.5 rounded-xl border bg-emerald-50/60 border-emerald-200">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-emerald-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Nguồn Tăng Trưởng Tốt Nhất</span>
            </span>
            {topGrowthChannel && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                +{topGrowthChannel.pctChange}% vs Trung vị
              </span>
            )}
          </div>
          {topGrowthChannel ? (
            <div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-base font-black text-emerald-900 font-mono">
                  {topGrowthChannel.name}
                </span>
                <span className="text-xs font-bold text-emerald-700 font-mono">
                  +{formatNumber(topGrowthChannel.delta)} PV
                </span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-3">
                <span>Tuần này: <strong className="font-mono">{formatNumber(topGrowthChannel.currentVal)} PV</strong></span>
                <span>Trung vị: <strong className="font-mono">{formatNumber(topGrowthChannel.medianVal)} PV</strong></span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-1">
              Chưa có nguồn nào vượt mốc trung vị trong tuần hiện tại.
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
                Biểu đồ Xu hướng qua {allWeeks.length} Tuần quan sát
              </h3>
              <span className="text-[11px] text-slate-500">
                (Đường nét đứt đánh dấu tuần: <strong>{currentWeek.shortLabel}</strong>)
              </span>
            </div>

            {/* Mode switch: Chi tiết từng nguồn vs Nhóm Macro */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                onClick={() => setChartMode('detail')}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                  chartMode === 'detail'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chi tiết từng nguồn
              </button>
              <button
                onClick={() => setChartMode('macro')}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                  chartMode === 'macro'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Nhóm Macro (Ext / Int)
              </button>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
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
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `${Math.round(val / 1000)}k`;
                    return `${val}`;
                  }}
                  width={45}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [`${formatNumber(Number(val) || 0)} PV`, name]}
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
                {visibleTrendLines.map((line) => (
                  <Line
                    key={line.key}
                    type="monotone"
                    dataKey={line.key}
                    name={line.name}
                    stroke={line.color}
                    strokeWidth={line.strokeWidth || 2}
                    strokeDasharray={line.strokeDasharray}
                    dot={{ r: selectedChannelKey === line.key ? 4 : 2, fill: line.color }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. The Clean Factual 5-Column Data Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <th className="py-2.5 px-4 min-w-[150px]">Kênh Nguồn (Channel)</th>
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
                  onClick={() => setSelectedChannelKey(row.key)}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border-l-4 border-l-blue-600 font-medium'
                      : isDrop
                      ? 'bg-rose-50/20 hover:bg-rose-50/40'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Channel Name */}
                  <td className="py-2.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: row.color }}
                      ></span>
                      <span className="font-mono text-[13px] font-bold text-slate-900">
                        {row.name}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          row.type === 'internal'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {row.type === 'internal' ? 'Internal' : 'External'}
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
                TỔNG TOÀN BỘ NGUỒN (INTERNAL + EXTERNAL)
              </td>
              <td className="py-3 px-3 text-right font-bold text-slate-700 text-xs">
                100%
              </td>
              <td className="py-3 px-4 text-right font-mono text-sm text-slate-950">
                <div>{formatNumber(currentWeekTotalPV)}</div>
                {totalWoWPct !== undefined && (
                  <div className={`text-[10px] font-medium ${totalWoWPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    WoW: {totalWoWPct >= 0 ? '+' : ''}{totalWoWPct}%
                  </div>
                )}
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

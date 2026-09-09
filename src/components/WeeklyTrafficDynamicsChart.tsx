import React, { useState, useMemo } from 'react';
import {
  Share2,
  TrendingDown,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Sparkles,
  Target,
  ArrowUpDown,
  Layers,
  Info,
  ChevronRight,
} from 'lucide-react';
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
  insight: string;
  severity: 'severe_drop' | 'mild_drop' | 'stable' | 'growth';
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

/**
 * Generate actionable diagnosis insight per channel based on data
 */
const generateChannelInsight = (
  channelKey: string,
  delta: number,
  pctChange: number,
  dropContribution: number
): { insight: string; severity: 'severe_drop' | 'mild_drop' | 'stable' | 'growth' } => {
  const isDrop = delta < 0;
  const absDeltaFormatted = formatNumber(Math.abs(delta));

  let severity: 'severe_drop' | 'mild_drop' | 'stable' | 'growth' = 'stable';
  if (pctChange <= -15) severity = 'severe_drop';
  else if (pctChange < -3) severity = 'mild_drop';
  else if (pctChange > 5) severity = 'growth';
  else severity = 'stable';

  switch (channelKey) {
    case 'I_Home':
      if (isDrop) {
        return {
          insight: `Thiếu hụt ${absDeltaFormatted} PV (${pctChange}% vs Trung vị). Luồng click từ Trang chủ sụt giảm mạnh${
            dropContribution >= 30 ? `, đóng góp tới ${dropContribution}% tổng lượng sụt giảm` : ''
          }. Cần kiểm tra vị trí hiển thị box chuyên mục trên Trang chủ và tần suất đổi bài đinh.`,
          severity,
        };
      }
      return {
        insight: `Lưu lượng từ Trang chủ vận hành tốt (+${absDeltaFormatted} PV, +${pctChange}% so với mốc Trung vị chuẩn).`,
        severity,
      };

    case 'I_Folder':
      if (isDrop) {
        return {
          insight: `Hụt ${absDeltaFormatted} PV (${pctChange}% vs Trung vị). Độc giả ít chủ động vào duyệt trực tiếp trang mục. Cần kiểm tra giao diện trang mục và tiêu đề bài ghim đầu mục.`,
          severity,
        };
      }
      return {
        insight: `Lưu lượng đọc tại trang mục duy trì ổn định (+${pctChange}% vs Trung vị), bạn đọc gắn kết với chuyên mục tốt.`,
        severity,
      };

    case 'I_Detail':
      if (isDrop) {
        return {
          insight: `Hụt ${absDeltaFormatted} PV (${pctChange}% vs Trung vị). Luồng đọc tiếp bài liên quan sụt giảm. Cần tối ưu lại box gợi ý bài liên quan cuối bài viết (chọn bài hấp dẫn hơn).`,
          severity,
        };
      }
      return {
        insight: `Tỷ lệ đọc tiếp và luân chuyển bài viết liên quan tốt (+${pctChange}% vs Trung vị), giữ chân độc giả hiệu quả.`,
        severity,
      };

    case 'E_Social':
      if (isDrop) {
        return {
          insight: `Hụt ${absDeltaFormatted} PV (${pctChange}% vs Trung vị). Kênh Mạng xã hội giảm sâu${
            dropContribution >= 25 ? ` (chiếm ${dropContribution}% lượng hụt PV)` : ''
          }. Thuật toán MXH siết reach hoặc thiếu bài thảo luận nóng, viral.`,
          severity,
        };
      }
      return {
        insight: `Lực kéo từ Mạng xã hội bùng nổ (+${pctChange}% vs Trung vị), các bài viết lan tỏa tốt trên các nền tảng ngoài.`,
        severity,
      };

    case 'E_Search':
      if (isDrop) {
        return {
          insight: `Hụt ${absDeltaFormatted} PV (${pctChange}% vs Trung vị). Lưu lượng tìm kiếm tự nhiên (Google Search) giảm. Cần rà soát bài viết chuẩn SEO và bắt kịp từ khóa theo xu hướng.`,
          severity,
        };
      }
      return {
        insight: `Lưu lượng tìm kiếm tự nhiên tăng trưởng tốt (+${pctChange}% vs Trung vị), tin tức đáp ứng chuẩn SEO và xu hướng tìm kiếm.`,
        severity,
      };

    case 'E_Direct':
      if (isDrop) {
        return {
          insight: `Hụt ${absDeltaFormatted} PV (${pctChange}% vs Trung vị). Lượng độc giả gõ trực tiếp URL/bookmark giảm nhẹ, cần gia tăng bài đinh độc quyền.`,
          severity,
        };
      }
      return {
        insight: `Lượng độc giả trung thành truy cập trực tiếp tăng (+${pctChange}% vs Trung vị), duy trì độ nhận diện thương hiệu cao.`,
        severity,
      };

    case 'E_Referrer':
      if (isDrop) {
        return {
          insight: `Hụt ${absDeltaFormatted} PV (${pctChange}% vs Trung vị). Giảm lượt dẫn nguồn từ báo chí đối tác và các trang ngoài liên kết.`,
          severity,
        };
      }
      return {
        insight: `Traffic từ liên kết ngoài và đối tác báo chí tích cực (+${pctChange}% vs Trung vị).`,
        severity,
      };

    case 'I_Other':
      if (isDrop) {
        return {
          insight: `Hụt ${absDeltaFormatted} PV (${pctChange}% vs Trung vị). Các luồng điều hướng khác (Tag, Topic chuyên đề, Dòng sự kiện 24h) giảm tương tác.`,
          severity,
        };
      }
      return {
        insight: `Các luồng chuyên đề, Topic và Tag hoạt động ổn định (+${pctChange}% vs Trung vị).`,
        severity,
      };

    default:
      return {
        insight: isDrop
          ? `Thấp hơn mốc trung vị ${absDeltaFormatted} PV (${pctChange}%).`
          : `Vượt mốc trung vị ${absDeltaFormatted} PV (+${pctChange}%).`,
        severity,
      };
  }
};

export const WeeklyTrafficDynamicsChart: React.FC<WeeklyTrafficDynamicsChartProps> = ({
  allWeeks,
  currentWeek,
}) => {
  const [filterScope, setFilterScope] = useState<FilterScope>('all');
  const [sortField, setSortField] = useState<SortField>('delta_asc'); // Default: Largest drop first
  const [selectedChannelKey, setSelectedChannelKey] = useState<string | null>(null);

  // Total current week traffic
  const currentWeekTotalPV = useMemo(() => {
    return currentWeek ? (currentWeek.total_external || 0) + (currentWeek.total_internal || 0) : 0;
  }, [currentWeek]);

  // Total median traffic across all weeks
  const medianTotalPV = useMemo(() => {
    const weeklyTotals = allWeeks.map((w) => (w.total_external || 0) + (w.total_internal || 0));
    return calculateMedian(weeklyTotals);
  }, [allWeeks]);

  // Compute raw channel rows with median and deltas
  const allChannelRows = useMemo<ChannelRowData[]>(() => {
    const rawRows = CHANNEL_DEFS.map((ch) => {
      const valuesOnly = allWeeks.map((w) => getChannelValue(w, ch.key));
      const medianVal = calculateMedian(valuesOnly);
      const currentVal = getChannelValue(currentWeek, ch.key);
      const delta = currentVal - medianVal;
      const pctChange = medianVal > 0 ? Number(((delta / medianVal) * 100).toFixed(1)) : 0;

      const currentShare = currentWeekTotalPV > 0 ? Number(((currentVal / currentWeekTotalPV) * 100).toFixed(1)) : 0;
      const medianShare = medianTotalPV > 0 ? Number(((medianVal / medianTotalPV) * 100).toFixed(1)) : 0;

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

      const { insight, severity } = generateChannelInsight(
        r.key,
        r.delta,
        r.pctChange,
        dropContributionPct
      );

      return {
        ...r,
        dropContributionPct,
        insight,
        severity,
      };
    });
  }, [allWeeks, currentWeek, currentWeekTotalPV, medianTotalPV]);

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

  // Executive summary metrics
  const topDroppingChannel = useMemo(() => {
    const drops = [...allChannelRows].filter((r) => r.delta < 0).sort((a, b) => a.delta - b.delta);
    return drops.length > 0 ? drops[0] : null;
  }, [allChannelRows]);

  const topGrowthChannel = useMemo(() => {
    const gains = [...allChannelRows].filter((r) => r.delta > 0).sort((a, b) => b.delta - a.delta);
    return gains.length > 0 ? gains[0] : null;
  }, [allChannelRows]);

  // Selected row for detail inspection
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
      primaryDriver:
        extDelta < 0 && intDelta < 0
          ? extDelta < intDelta
            ? 'External'
            : 'Internal'
          : extDelta < 0
          ? 'External'
          : intDelta < 0
          ? 'Internal'
          : 'Both Healthy',
    };
  }, [allWeeks, currentWeek]);

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
      {/* 1. Header & Quick Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Động thái &amp; Nguồn Sụt giảm Pageview theo Tuần
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
              Bảng Chẩn Đoán So Với Trung Vị
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Mốc {allWeeks.length} Tuần
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bóc tách từng nguồn lưu lượng so với mốc Trung vị chuẩn &bull; Xác định chính xác nguồn chịu trách nhiệm sụt giảm
          </p>
        </div>

        {/* Action / Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
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

      {/* 2. Top Executive Insight Diagnosis Cards */}
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
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed line-clamp-2">
                Tuần này: <strong>{formatNumber(topDroppingChannel.currentVal)} PV</strong> (Trung vị: <strong>{formatNumber(topDroppingChannel.medianVal)} PV</strong>). {topDroppingChannel.insight}
              </p>
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
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              macroStats.primaryDriver === 'External'
                ? 'bg-amber-100 text-amber-800'
                : macroStats.primaryDriver === 'Internal'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {macroStats.primaryDriver === 'External'
                ? 'Hụt nguồn Ngoài'
                : macroStats.primaryDriver === 'Internal'
                ? 'Hụt nguồn Nội bộ'
                : 'Đều ổn định'}
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

        {/* Card 3: Best Growth / Stabilizer Channel */}
        <div className="p-3.5 rounded-xl border bg-emerald-50/60 border-emerald-200">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-emerald-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Nguồn Giữ Nhịp Tốt Nhất</span>
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
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed line-clamp-2">
                Đạt <strong>{formatNumber(topGrowthChannel.currentVal)} PV</strong>, vượt mốc trung vị chuẩn ({formatNumber(topGrowthChannel.medianVal)} PV), giữ nhịp lưu lượng quan trọng cho tuần này.
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-1">
              Chưa có nguồn nào vượt mốc trung vị trong tuần hiện tại.
            </p>
          )}
        </div>
      </div>

      {/* 3. The Clean & Focused Data Table (Compact, No Overflow) */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <th className="py-2.5 px-4 min-w-[150px]">Nguồn Lưu Lượng</th>
              <th className="py-2.5 px-3 text-center min-w-[90px]">Phân Loại</th>
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
                  {/* Channel Name (Unchanged exact name) */}
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
                          &bull; Đang xem
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Type Badge */}
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        row.type === 'internal'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {row.type === 'internal' ? 'Internal' : 'External'}
                    </span>
                  </td>

                  {/* Current Week Value & Share */}
                  <td className="py-2.5 px-4 text-right">
                    <div className="font-mono font-bold text-slate-900">
                      {formatNumber(row.currentVal)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {row.currentShare}% tổng tuần
                    </div>
                  </td>

                  {/* Median Value & Share */}
                  <td className="py-2.5 px-4 text-right">
                    <div className="font-mono font-bold text-slate-700">
                      {formatNumber(row.medianVal)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {row.medianShare}% chuẩn
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

          {/* Table Footer: Subtotals & Grand Total */}
          <tfoot>
            {/* Subtotal External */}
            <tr className="bg-emerald-50/40 font-bold border-t-2 border-slate-200 text-slate-900">
              <td className="py-2.5 px-4 font-mono font-bold text-emerald-900">
                External (Tổng Ngoài)
              </td>
              <td className="py-2.5 px-3 text-center">
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                  External
                </span>
              </td>
              <td className="py-2.5 px-4 text-right font-mono">
                {formatNumber(macroStats.extCurrent)}
              </td>
              <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                {formatNumber(macroStats.extMedian)}
              </td>
              <td className="py-2.5 px-4 text-right font-mono">
                <span className={macroStats.extDelta < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  {macroStats.extDelta > 0 ? '+' : ''}{formatNumber(macroStats.extDelta)} ({macroStats.extPct > 0 ? '+' : ''}{macroStats.extPct}%)
                </span>
              </td>
            </tr>

            {/* Subtotal Internal */}
            <tr className="bg-indigo-50/40 font-bold text-slate-900">
              <td className="py-2.5 px-4 font-mono font-bold text-indigo-900">
                Internal (Tổng Nội bộ)
              </td>
              <td className="py-2.5 px-3 text-center">
                <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                  Internal
                </span>
              </td>
              <td className="py-2.5 px-4 text-right font-mono">
                {formatNumber(macroStats.intCurrent)}
              </td>
              <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                {formatNumber(macroStats.intMedian)}
              </td>
              <td className="py-2.5 px-4 text-right font-mono">
                <span className={macroStats.intDelta < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  {macroStats.intDelta > 0 ? '+' : ''}{formatNumber(macroStats.intDelta)} ({macroStats.intPct > 0 ? '+' : ''}{macroStats.intPct}%)
                </span>
              </td>
            </tr>

            {/* Grand Total */}
            <tr className="bg-slate-100 font-black text-slate-900 border-t border-slate-300">
              <td className="py-3 px-4 font-bold text-slate-900 text-[13px]">
                TỔNG PAGEVIEW TOÀN KÊNH
              </td>
              <td className="py-3 px-3 text-center text-slate-400">
                —
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

      {/* 4. Actionable Insight Detail Card for the Clicked / Selected Channel */}
      {activeSelectedRow && (
        <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: activeSelectedRow.color }}
              ></span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {activeSelectedRow.name}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeSelectedRow.type === 'internal'
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {activeSelectedRow.type === 'internal' ? 'Internal' : 'External'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeSelectedRow.isDecline
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {activeSelectedRow.isDecline
                  ? `Hụt ${formatNumber(Math.abs(activeSelectedRow.delta))} PV (${activeSelectedRow.pctChange}%)`
                  : `Vượt +${formatNumber(activeSelectedRow.delta)} PV (+${activeSelectedRow.pctChange}%)`}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Nhấp vào bất kỳ dòng nào trên bảng để xem chẩn đoán nguồn đó
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 font-semibold">Chẩn đoán &amp; Khuyến nghị: </strong>
              <span>{activeSelectedRow.insight}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
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
import { DailySummary, WeeklySummary } from '../types';
import { formatNumber, calculateMedian, getDayOfWeekVi } from '../utils/analytics';

interface EngagementQualityChartProps {
  data?: DailySummary[];
  weeklyData?: WeeklySummary[];
  selectedDate?: string;
  selectedWeekKey?: string;
  onSelectDate?: (date: string) => void;
  onSelectWeek?: (weekKey: string) => void;
  isWeekly?: boolean;
}

type FilterScope = 'all' | 'depth' | 'loyalty';
type SortField = 'default' | 'pct_asc' | 'pct_desc' | 'wow_desc';

interface QualityMetricRow {
  key: string;
  name: string;
  badge: string;
  group: 'depth' | 'loyalty';
  color: string;
  unit: string;
  isPercentage: boolean;
  description: string;
  currentVal: number;
  prevVal?: number;
  medianVal: number;
  delta: number;
  pctChange: number;
  wowPct?: number;
}

export const EngagementQualityChart: React.FC<EngagementQualityChartProps> = ({
  data = [],
  weeklyData = [],
  selectedDate,
  selectedWeekKey,
  onSelectDate,
  onSelectWeek,
  isWeekly = false,
}) => {
  const [showTrendChart, setShowTrendChart] = useState<boolean>(false);
  const [filterScope, setFilterScope] = useState<FilterScope>('all');
  const [sortField, setSortField] = useState<SortField>('default');
  const [selectedMetricKey, setSelectedMetricKey] = useState<string | null>(null);

  // Determine current, previous, and list items
  const items = isWeekly ? weeklyData : data;
  const totalCount = items.length;
  const unitLabel = isWeekly ? 'tuần' : 'ngày';

  const currIdx = useMemo(() => {
    if (isWeekly) {
      return weeklyData.findIndex((w) => w.weekKey === selectedWeekKey);
    }
    return data.findIndex((d) => d.date === selectedDate);
  }, [isWeekly, weeklyData, selectedWeekKey, data, selectedDate]);

  const currentItem = useMemo(() => {
    if (currIdx >= 0) return items[currIdx];
    return items[items.length - 1] || null;
  }, [items, currIdx]);

  const prevItem = useMemo(() => {
    if (currIdx > 0) return items[currIdx - 1];
    return null;
  }, [items, currIdx]);

  const periodLabel = useMemo(() => {
    if (!currentItem) return '';
    if (isWeekly) {
      return (currentItem as WeeklySummary).shortLabel;
    }
    return (currentItem as DailySummary).date;
  }, [currentItem, isWeekly]);

  // Calculate Median baselines across all observed periods
  const medianStickiness = useMemo(() => {
    if (items.length === 0) return 0;
    return Number(calculateMedian(items.map((i) => i.stickiness)).toFixed(2));
  }, [items]);

  const medianPvSession = useMemo(() => {
    if (items.length === 0) return 0;
    return Number(calculateMedian(items.map((i) => i.pv_per_session)).toFixed(2));
  }, [items]);

  const medianPvUser = useMemo(() => {
    if (items.length === 0) return 0;
    return Number(calculateMedian(items.map((i) => i.pv_per_user)).toFixed(2));
  }, [items]);

  const medianVneRatio = useMemo(() => {
    if (items.length === 0) return 0;
    return Number(calculateMedian(items.map((i) => i.vne_user_ratio)).toFixed(1));
  }, [items]);

  const medianVneUser = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.round(calculateMedian(items.map((i) => i.vne_user)));
  }, [items]);

  const medianSessionsPerUser = useMemo(() => {
    if (items.length === 0) return 0;
    const values = items.map((i) => (i.users > 0 ? Number((i.session / i.users).toFixed(2)) : 0));
    return Number(calculateMedian(values).toFixed(2));
  }, [items]);

  // Construct standard metric breakdown rows
  const allMetricRows: QualityMetricRow[] = useMemo(() => {
    if (!currentItem) return [];

    const currUsers = currentItem.users || 0;
    const currSessions = currentItem.session || 0;
    const currSessionsPerUser = currUsers > 0 ? Number((currSessions / currUsers).toFixed(2)) : 0;

    const prevUsers = prevItem ? prevItem.users || 0 : 0;
    const prevSessions = prevItem ? prevItem.session || 0 : 0;
    const prevSessionsPerUser = prevUsers > 0 ? Number((prevSessions / prevUsers).toFixed(2)) : undefined;

    const buildRow = (
      key: string,
      name: string,
      badge: string,
      group: 'depth' | 'loyalty',
      color: string,
      unit: string,
      isPercentage: boolean,
      description: string,
      currVal: number,
      prevVal: number | undefined,
      medVal: number
    ): QualityMetricRow => {
      const delta = isPercentage ? Number((currVal - medVal).toFixed(2)) : Number((currVal - medVal).toFixed(2));
      const pctChange = medVal > 0 ? Number(((delta / medVal) * 100).toFixed(1)) : 0;
      const wowPct =
        prevVal !== undefined && prevVal > 0
          ? Number((((currVal - prevVal) / prevVal) * 100).toFixed(1))
          : undefined;

      return {
        key,
        name,
        badge,
        group,
        color,
        unit,
        isPercentage,
        description,
        currentVal: currVal,
        prevVal,
        medianVal: medVal,
        delta,
        pctChange,
        wowPct,
      };
    };

    return [
      buildRow(
        'stickiness',
        'Độ gắn kết độc giả (Stickiness)',
        'Gắn kết',
        'loyalty',
        '#8b5cf6',
        '% DAU/MAU',
        true,
        'Tỷ lệ độc giả quay lại định kỳ hàng ngày trên tập bạn đọc tháng',
        currentItem.stickiness,
        prevItem ? prevItem.stickiness : undefined,
        medianStickiness
      ),
      buildRow(
        'pv_per_session',
        'Độ sâu đọc phiên (PV / Phiên)',
        'Độ sâu',
        'depth',
        '#2563eb',
        'PV/phiên',
        false,
        'Số trang đọc bình quân trong mỗi phiên - đo lường mức độ lướt tiếp và đọc chéo',
        currentItem.pv_per_session,
        prevItem ? prevItem.pv_per_session : undefined,
        medianPvSession
      ),
      buildRow(
        'pv_per_user',
        'Lượt xem trên mỗi độc giả (PV / User)',
        'Độ sâu',
        'depth',
        '#0284c7',
        'PV/user',
        false,
        'Tổng lượt xem trang tạo ra trên mỗi bạn đọc trong kỳ quan sát',
        currentItem.pv_per_user,
        prevItem ? prevItem.pv_per_user : undefined,
        medianPvUser
      ),
      buildRow(
        'vne_user_ratio',
        'Tỷ lệ bạn đọc VnE định danh (% VnE User)',
        'Định danh',
        'loyalty',
        '#d97706',
        '% Độc giả',
        true,
        'Tỷ trọng bạn đọc có tài khoản đăng nhập tương tác trong tổng số độc giả',
        currentItem.vne_user_ratio,
        prevItem ? prevItem.vne_user_ratio : undefined,
        medianVneRatio
      ),
      buildRow(
        'vne_user',
        'Khối lượng bạn đọc VnE (VnE Users)',
        'Định danh',
        'loyalty',
        '#b45309',
        'Người dùng',
        false,
        'Quy mô tuyệt đối bạn đọc định danh có tài khoản hoạt động trong kỳ',
        currentItem.vne_user,
        prevItem ? prevItem.vne_user : undefined,
        medianVneUser
      ),
      buildRow(
        'sessions_per_user',
        'Tần suất Phiên trên mỗi Độc giả (Sessions / User)',
        'Tần suất',
        'depth',
        '#475569',
        'Phiên/user',
        false,
        'Tần suất mở phiên đọc mới của mỗi bạn đọc trong kỳ quan sát',
        currSessionsPerUser,
        prevSessionsPerUser,
        medianSessionsPerUser
      ),
    ];
  }, [
    currentItem,
    prevItem,
    medianStickiness,
    medianPvSession,
    medianPvUser,
    medianVneRatio,
    medianVneUser,
    medianSessionsPerUser,
  ]);

  // Filter and Sort Rows
  const filteredRows = useMemo(() => {
    let list = [...allMetricRows];
    if (filterScope === 'depth') {
      list = list.filter((r) => r.group === 'depth');
    } else if (filterScope === 'loyalty') {
      list = list.filter((r) => r.group === 'loyalty');
    }

    if (sortField === 'pct_asc') {
      list.sort((a, b) => a.pctChange - b.pctChange);
    } else if (sortField === 'pct_desc') {
      list.sort((a, b) => b.pctChange - a.pctChange);
    } else if (sortField === 'wow_desc') {
      list.sort((a, b) => (b.wowPct ?? -999) - (a.wowPct ?? -999));
    }

    return list;
  }, [allMetricRows, filterScope, sortField]);

  // Max absolute pct change for proportional bar rendering
  const maxAbsPct = useMemo(() => {
    if (allMetricRows.length === 0) return 1;
    return Math.max(...allMetricRows.map((r) => Math.abs(r.pctChange)), 1);
  }, [allMetricRows]);

  // Chart data preparation for trend visualization
  const chartData = useMemo(() => {
    return isWeekly
      ? weeklyData.map((w) => ({
          key: w.weekKey,
          displayDate: w.shortLabel,
          label: w.label,
          pvPerSession: w.pv_per_session,
          pvPerUser: w.pv_per_user,
          vneUserRatio: w.vne_user_ratio,
          stickiness: w.stickiness,
          isSelected: w.weekKey === selectedWeekKey,
        }))
      : data.map((d) => ({
          key: d.date,
          displayDate: d.date.slice(5),
          label: `${getDayOfWeekVi(d.date)} • ${d.date}`,
          pvPerSession: d.pv_per_session,
          pvPerUser: d.pv_per_user,
          vneUserRatio: d.vne_user_ratio,
          stickiness: d.stickiness,
          isSelected: d.date === selectedDate,
        }));
  }, [isWeekly, weeklyData, selectedWeekKey, data, selectedDate]);

  // Individual highlighted cards
  const stickinessRow = allMetricRows.find((r) => r.key === 'stickiness');
  const pvSessionRow = allMetricRows.find((r) => r.key === 'pv_per_session');
  const vneRatioRow = allMetricRows.find((r) => r.key === 'vne_user_ratio');

  const countDepth = allMetricRows.filter((r) => r.group === 'depth').length;
  const countLoyalty = allMetricRows.filter((r) => r.group === 'loyalty').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5 mb-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Chất lượng Bạn đọc &amp; Độ gắn kết {isWeekly ? 'theo Tuần' : ''} (Engagement &amp; Loyalty Quality)
            </h2>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 font-mono">
              {totalCount} {unitLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bóc tách các chỉ số chất lượng phiên đọc, mức độ trung thành và gắn kết so với mốc Trung vị chuẩn chu kỳ
          </p>
        </div>

        {/* Action / Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Button Hiện / Ẩn Biểu Đồ Xu Hướng */}
          <button
            onClick={() => setShowTrendChart(!showTrendChart)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer border ${
              showTrendChart
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            {showTrendChart ? 'Ẩn Biểu đồ Xu hướng' : 'Hiện Biểu đồ Xu hướng'}
          </button>

          {/* Filter Scope Pills */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium border border-slate-200">
            <button
              onClick={() => setFilterScope('all')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                filterScope === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({allMetricRows.length})
            </button>
            <button
              onClick={() => setFilterScope('depth')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                filterScope === 'depth'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Độ sâu đọc ({countDepth})
            </button>
            <button
              onClick={() => setFilterScope('loyalty')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                filterScope === 'loyalty'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gắn kết &amp; Định danh ({countLoyalty})
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs">
            <span className="text-slate-400 text-[11px]">Xếp theo:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="default">Thứ tự chuẩn (Mặc định)</option>
              <option value="pct_asc">% Lệch âm nhiều nhất vs Trung vị</option>
              <option value="pct_desc">% Lệch dương nhiều nhất vs Trung vị</option>
              <option value="wow_desc">Tăng trưởng WoW cao nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Factual Summary Metric Highlights (3 Cards matching WeeklyTrafficDynamicsChart) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Card 1: Độ gắn kết Stickiness */}
        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-800">
              Độ Gắn Kết Stickiness (DAU/MAU)
            </span>
            {stickinessRow && (
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-medium border ${
                  stickinessRow.delta >= 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {stickinessRow.pctChange >= 0 ? '+' : ''}
                {stickinessRow.pctChange}% vs Trung vị
              </span>
            )}
          </div>
          {stickinessRow ? (
            <div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {stickinessRow.currentVal}%
                </span>
                <span
                  className={`text-xs font-bold font-mono ${
                    stickinessRow.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {stickinessRow.delta >= 0 ? '+' : ''}
                  {stickinessRow.delta}%
                </span>
                {stickinessRow.wowPct !== undefined && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    (WoW: {stickinessRow.wowPct >= 0 ? '+' : ''}
                    {stickinessRow.wowPct}%)
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                <span>
                  {isWeekly ? 'Tuần này' : 'Ngày này'}:{' '}
                  <strong className="font-mono text-slate-700">{stickinessRow.currentVal}%</strong>
                </span>
                <span>
                  Trung vị:{' '}
                  <strong className="font-mono text-slate-700">{stickinessRow.medianVal}%</strong>
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-1">Đang cập nhật chỉ số...</p>
          )}
        </div>

        {/* Card 2: Độ sâu đọc phiên */}
        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-800">
              Độ Sâu Phiên &amp; Tiêu Thụ Nội Dung
            </span>
            {pvSessionRow && (
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-medium border ${
                  pvSessionRow.delta >= 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {pvSessionRow.pctChange >= 0 ? '+' : ''}
                {pvSessionRow.pctChange}% PV/phiên
              </span>
            )}
          </div>
          {pvSessionRow ? (
            <div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {pvSessionRow.currentVal} PV/phiên
                </span>
                <span
                  className={`text-xs font-bold font-mono ${
                    pvSessionRow.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {pvSessionRow.delta >= 0 ? '+' : ''}
                  {pvSessionRow.delta}
                </span>
                {pvSessionRow.wowPct !== undefined && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    (WoW: {pvSessionRow.wowPct >= 0 ? '+' : ''}
                    {pvSessionRow.wowPct}%)
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                <span>
                  PV/User:{' '}
                  <strong className="font-mono text-slate-700">
                    {currentItem ? currentItem.pv_per_user : '—'}
                  </strong>
                </span>
                <span>
                  Trung vị chuẩn:{' '}
                  <strong className="font-mono text-slate-700">{pvSessionRow.medianVal}</strong>
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-1">Đang cập nhật chỉ số...</p>
          )}
        </div>

        {/* Card 3: Bạn đọc Định danh VnE */}
        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-800">
              Độc Giả Định Danh Có Tài Khoản
            </span>
            {vneRatioRow && (
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-medium border ${
                  vneRatioRow.delta >= 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {vneRatioRow.pctChange >= 0 ? '+' : ''}
                {vneRatioRow.pctChange}% tỷ lệ
              </span>
            )}
          </div>
          {vneRatioRow ? (
            <div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {vneRatioRow.currentVal}%
                </span>
                <span className="text-xs font-medium text-slate-600 font-mono">
                  ({formatNumber(currentItem ? currentItem.vne_user : 0)} User)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                <span>
                  Tỷ lệ chuẩn:{' '}
                  <strong className="font-mono text-slate-700">{vneRatioRow.medianVal}%</strong>
                </span>
                <span>
                  Quy mô chuẩn:{' '}
                  <strong className="font-mono text-slate-700">{formatNumber(medianVneUser)}</strong>
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-1">Đang cập nhật chỉ số...</p>
          )}
        </div>
      </div>

      {/* 3. Multi-Week Trend Chart (Triggered by Button) */}
      {showTrendChart && (
        <div className="mb-5 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800">
                Xu hướng Chất lượng &amp; Gắn kết qua {totalCount} {unitLabel} quan sát
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                (Đường nét đứt: <strong className="text-slate-600">{periodLabel}</strong>)
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span>Trung vị Stickiness: <strong className="text-slate-700">{medianStickiness}%</strong></span>
              <span>&bull;</span>
              <span>Trung vị PV/Phiên: <strong className="text-slate-700">{medianPvSession}</strong></span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                onClick={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    const clickedKey = state.activePayload[0].payload.key;
                    if (isWeekly && onSelectWeek) {
                      onSelectWeek(clickedKey);
                    } else if (!isWeekly && onSelectDate) {
                      onSelectDate(clickedKey);
                    }
                  }
                }}
                margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
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
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-lg border border-slate-800 space-y-1.5 min-w-[230px]">
                        <div className="font-bold text-slate-300 pb-1 border-b border-slate-800 flex items-center justify-between">
                          <span>{d.label}</span>
                          {d.isSelected && (
                            <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-white font-mono">
                              Đang chọn
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between gap-4 py-0.5 text-purple-300 font-mono">
                          <span>Độ gắn kết (Stickiness):</span>
                          <span className="font-bold text-white">{d.stickiness}%</span>
                        </div>
                        <div className="flex justify-between gap-4 py-0.5 text-blue-300 font-mono">
                          <span>Độ sâu (PV / Phiên):</span>
                          <span className="font-bold text-white">{d.pvPerSession}</span>
                        </div>
                        <div className="flex justify-between gap-4 py-0.5 text-slate-300 font-mono">
                          <span>Lượt xem / Độc giả:</span>
                          <span className="font-bold text-white">{d.pvPerUser}</span>
                        </div>
                        <div className="flex justify-between gap-4 py-0.5 text-amber-300 font-mono border-t border-slate-800 pt-1">
                          <span>Tỷ lệ Độc giả VnE:</span>
                          <span className="font-bold text-white">{d.vneUserRatio}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />

                {/* Vertical marker for selected period */}
                <ReferenceLine
                  yAxisId="left"
                  x={isWeekly ? periodLabel : periodLabel.slice(5)}
                  stroke="#0f172a"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  strokeOpacity={0.7}
                />

                {/* Reference line for baseline median */}
                <ReferenceLine
                  yAxisId="left"
                  y={medianPvSession}
                  stroke="#94a3b8"
                  strokeDasharray="3 3"
                  label={{
                    value: `Chuẩn PV/phiên: ${medianPvSession}`,
                    position: 'insideTopLeft',
                    fill: '#64748b',
                    fontSize: 10,
                  }}
                />

                <Bar
                  yAxisId="left"
                  dataKey="pvPerSession"
                  name="Độ sâu đọc (PV / Phiên)"
                  fill="#94a3b8"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={30}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="pvPerUser"
                  name="Lượt xem / Độc giả (PV / User)"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#2563eb' }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="stickiness"
                  name="Độ gắn kết Stickiness (%)"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#8b5cf6' }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="vneUserRatio"
                  name="Tỷ lệ bạn đọc VnE (%)"
                  stroke="#d97706"
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                  dot={{ r: 2.5, fill: '#d97706' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. The Clean Factual Data Table (Matching WeeklyTrafficDynamicsChart 5-Column Pattern) */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <th className="py-2.5 px-4 min-w-[220px]">Chỉ số Chất lượng &amp; Gắn kết (Quality Metric)</th>
              <th className="py-2.5 px-3 text-right min-w-[120px]">Đo lường &amp; Đơn vị</th>
              <th className="py-2.5 px-4 text-right min-w-[150px]">
                {isWeekly ? `Tuần Này (${periodLabel})` : `Ngày Này (${periodLabel})`}
              </th>
              <th className="py-2.5 px-4 text-right min-w-[140px]">
                Mốc Trung Vị ({totalCount} {unitLabel})
              </th>
              <th className="py-2.5 px-4 text-right min-w-[170px]">
                Lệch vs. Trung Vị
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.map((row) => {
              const isSelected = selectedMetricKey === row.key;
              const isDrop = row.delta < 0;
              const barWidth = Math.min(100, Math.round((Math.abs(row.pctChange) / maxAbsPct) * 100));

              return (
                <tr
                  key={row.key}
                  onClick={() => setSelectedMetricKey(row.key === selectedMetricKey ? null : row.key)}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100/70 border-l-4 border-l-slate-900 font-medium'
                      : isDrop
                      ? 'bg-rose-50/15 hover:bg-rose-50/30'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Metric Name & Description */}
                  <td className="py-2.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: row.color }}
                      ></span>
                      <span className="font-mono text-[13px] font-bold text-slate-900">
                        {row.name}
                      </span>
                      <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {row.badge}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] text-slate-900 font-bold font-mono">
                          &bull; Đang chọn
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-normal pl-4.5 mt-0.5">
                      {row.description}
                    </div>
                  </td>

                  {/* Measurement Unit & Scope */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="font-mono font-semibold text-slate-700">
                      {row.unit}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {row.group === 'depth' ? 'Hành vi đọc' : 'Độ trung thành'}
                    </div>
                  </td>

                  {/* Current Period Value & WoW / DoD */}
                  <td className="py-2.5 px-4 text-right">
                    <div className="font-mono font-bold text-slate-900">
                      {row.isPercentage ? `${row.currentVal}%` : formatNumber(row.currentVal)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {row.wowPct !== undefined ? (
                        <span className={row.wowPct >= 0 ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
                          {isWeekly ? 'WoW' : 'DoD'}: {row.wowPct >= 0 ? '+' : ''}{row.wowPct}%
                        </span>
                      ) : (
                        'Kỳ đầu'
                      )}
                    </div>
                  </td>

                  {/* Median Baseline Value */}
                  <td className="py-2.5 px-4 text-right">
                    <div className="font-mono font-medium text-slate-700">
                      {row.isPercentage ? `${row.medianVal}%` : formatNumber(row.medianVal)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Chuẩn {totalCount}{isWeekly ? 'T' : 'N'}
                    </div>
                  </td>

                  {/* Deviation vs Median & Relative Bar */}
                  <td className="py-2.5 px-4 text-right">
                    <div
                      className={`font-mono font-semibold flex items-center justify-end gap-1 ${
                        isDrop ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      <span>
                        {row.delta > 0 ? '+' : ''}
                        {row.isPercentage ? `${row.delta}%` : formatNumber(row.delta)}
                      </span>
                      <span className="text-[11px] font-normal">
                        ({row.pctChange > 0 ? '+' : ''}{row.pctChange}%)
                      </span>
                    </div>

                    {/* Mini relative deviation bar matching WeeklyTrafficDynamicsChart */}
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
        </table>
      </div>

      {/* Subtle Guidance Note */}
      <div className="mt-3 text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between">
        <span>
          <strong>Ghi chú đối chuẩn:</strong> Mốc Trung vị chuẩn chu kỳ giúp loại trừ biến động giật gân, phản ánh chính xác chất lượng gắn kết và hành vi độc giả thực tế.
        </span>
        <span className="font-mono text-slate-400 text-[10px]">
          {isWeekly ? 'Weekly Quality Diagnostic' : 'Daily Quality Diagnostic'}
        </span>
      </div>
    </div>
  );
};

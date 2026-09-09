import React, { useState } from 'react';
import { Table, Calendar, ArrowUpDown, Layers, TrendingUp, TrendingDown, Minus, CheckCircle, Download } from 'lucide-react';
import { WeeklySummary, WeeklyCategorySummary } from '../types';
import { formatNumber, getDayOfWeekVi } from '../utils/analytics';

interface WeeklyDiagnosticTableProps {
  allWeeks: WeeklySummary[];
  selectedWeek: WeeklySummary;
  prevWeek: WeeklySummary | null;
  categories: WeeklyCategorySummary[];
  onSelectWeek: (weekKey: string) => void;
}

export const WeeklyDiagnosticTable: React.FC<WeeklyDiagnosticTableProps> = ({
  allWeeks,
  selectedWeek,
  prevWeek,
  categories,
  onSelectWeek,
}) => {
  const [activeTab, setActiveTab] = useState<'weeks' | 'days' | 'categories'>('weeks');

  const handleExportCSV = () => {
    let csvContent = '';
    if (activeTab === 'weeks') {
      csvContent = 'Tuần,Khoảng_ngày,Số_ngày,Tổng_Pageview,Trung_vị_ngày_PV,vs_Tuần_trước_WoW_Pct,vs_Trung_vị_tuần_Pct,Tổng_Độc_giả,Tổng_Phiên,Bạn_đọc_VnE,Gắn_kết_DAU_MAU_Pct\n';
      allWeeks.forEach((w) => {
        csvContent += `"${w.label}","${w.startDate} - ${w.endDate}",${w.dayCount},${w.pageview},${w.median_daily_pageview},${w.wow_pageview_pct ?? 0}%,${w.vs_median_weeks_pageview_pct ?? 0}%,${w.users},${w.session},${w.vne_user},${w.stickiness}%\n`;
      });
    } else if (activeTab === 'days') {
      csvContent = 'Thứ,Ngày,Tuần_này_PV,Trung_vị_ngày_tuần,vs_Trung_vị_Pct,Tuần_trước_PV,vs_Cùng_thứ_tuần_trước_WoW_Pct,Độc_giả_tuần_này,Độc_giả_tuần_trước,Ngoại_vi,Nội_bộ\n';
      daysOfWeek.forEach((dayName) => {
        const currDay = selectedWeek.days.find((d) => getDayOfWeekVi(d.date) === dayName);
        const prevDay = prevWeek?.days.find((d) => getDayOfWeekVi(d.date) === dayName);
        const currPv = currDay?.pageview ?? 0;
        const prevPv = prevDay?.pageview ?? 0;
        const wowDayPct = prevPv > 0 && currPv > 0 ? Number((((currPv - prevPv) / prevPv) * 100).toFixed(1)) : 0;
        const vsMedPct = currPv > 0 && selectedWeek.median_daily_pageview > 0
          ? Number((((currPv - selectedWeek.median_daily_pageview) / selectedWeek.median_daily_pageview) * 100).toFixed(1))
          : 0;
        csvContent += `"${dayName}","${currDay?.date || ''}",${currPv},${selectedWeek.median_daily_pageview},${vsMedPct}%,${prevPv},${wowDayPct}%,${currDay?.users || 0},${prevDay?.users || 0},${currDay?.total_external || 0},${currDay?.total_internal || 0}\n`;
      });
    } else {
      csvContent = 'Chuyên_mục,Pageviews,PV_Tuần_trước,WoW_Pct,Thị_phần_Pct,Trung_vị_ngày_PV,Độc_giả,Phiên,Ngoại_vi,Nội_bộ\n';
      categories.forEach((cat) => {
        csvContent += `"${cat.category}",${cat.pageview},${cat.prev_pageview ?? 0},${cat.wow_pageview_pct ?? 0}%,${cat.share_pct}%,${cat.median_daily_pageview},${cat.users},${cat.session},${cat.total_external},${cat.total_internal}\n`;
      });
    }

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `VnE_Analytics_${selectedWeek.weekKey}_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTrend = (pct: number | undefined) => {
    if (pct === undefined) return <span className="text-slate-400 text-xs">—</span>;
    const isUp = pct > 0;
    const isZero = pct === 0;

    return (
      <span
        className={`inline-flex items-center font-bold text-xs ${
          isZero ? 'text-slate-600' : isUp ? 'text-emerald-600' : 'text-rose-600'
        }`}
      >
        {isUp ? (
          <TrendingUp className="w-3 h-3 mr-0.5" />
        ) : isZero ? (
          <Minus className="w-3 h-3 mr-0.5" />
        ) : (
          <TrendingDown className="w-3 h-3 mr-0.5" />
        )}
        {isUp ? `+${pct}%` : `${pct}%`}
      </span>
    );
  };

  const daysOfWeek = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật'];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {/* Table Header & Tab Switcher */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Bảng Tổng hợp & Phân tích Tuần
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              Chi tiết đối chuẩn
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu hiệu suất tuần, đối chuẩn ngày và phân bổ chuyên mục
          </p>
        </div>

        {/* Tab Buttons & Export */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('weeks')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'weeks'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tổng hợp các tuần ({allWeeks.length})
            </button>
            <button
              onClick={() => setActiveTab('days')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'days'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 ngày trong {selectedWeek.shortLabel}
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chuyên mục tuần ({categories.length})
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            title="Xuất bảng dữ liệu hiện tại ra tệp CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Tổng hợp các tuần */}
      {activeTab === 'weeks' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tuần theo dõi</th>
                <th className="py-3 px-4">Khoảng ngày</th>
                <th className="py-3 px-4 text-center">Số ngày</th>
                <th className="py-3 px-4 text-right">Tổng Pageview</th>
                <th className="py-3 px-4 text-right bg-blue-50/50 text-blue-900">
                  Trung vị ngày
                </th>
                <th className="py-3 px-4 text-center">vs Tuần trước (WoW)</th>
                <th className="py-3 px-4 text-center">vs Trung vị các tuần</th>
                <th className="py-3 px-4 text-right">Tổng Độc giả</th>
                <th className="py-3 px-4 text-right">Tổng Phiên</th>
                <th className="py-3 px-4 text-right">Bạn đọc VnE</th>
                <th className="py-3 px-4 text-center">Gắn kết</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allWeeks.map((week) => {
                const isSelected = week.weekKey === selectedWeek.weekKey;

                return (
                  <tr
                    key={week.weekKey}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-blue-50/40 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        {week.shortLabel}
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-600 text-white">
                            Đang xem
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {week.startDate} &mdash; {week.endDate}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px]">
                        {week.dayCount} ngày
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatNumber(week.pageview)} PV
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-blue-900 bg-blue-50/30">
                      {formatNumber(week.median_daily_pageview)} PV
                    </td>
                    <td className="py-3 px-4 text-center">
                      {renderTrend(week.wow_pageview_pct)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {renderTrend(week.vs_median_weeks_pageview_pct)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-800">
                      {formatNumber(week.users)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-800">
                      {formatNumber(week.session)}
                    </td>
                    <td className="py-3 px-4 text-right text-purple-700 font-semibold">
                      {formatNumber(week.vne_user)} ({week.vne_user_ratio}%)
                    </td>
                    <td className="py-3 px-4 text-center text-amber-700 font-semibold">
                      {week.stickiness}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      {!isSelected ? (
                        <button
                          onClick={() => onSelectWeek(week.weekKey)}
                          className="px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                        >
                          Chọn tuần
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Hiện tại</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Chi tiết 7 ngày trong tuần đang chọn */}
      {activeTab === 'days' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Thứ trong tuần</th>
                <th className="py-3 px-4">Ngày ({selectedWeek.shortLabel})</th>
                <th className="py-3 px-4 text-right">Pageview Tuần này</th>
                <th className="py-3 px-4">Ngày ({prevWeek?.shortLabel || 'Tuần trước'})</th>
                <th className="py-3 px-4 text-right">Pageview Tuần trước</th>
                <th className="py-3 px-4 text-center">Tăng trưởng WoW</th>
                <th className="py-3 px-4 text-center">So với Trung vị tuần</th>
                <th className="py-3 px-4 text-right">Độc giả</th>
                <th className="py-3 px-4 text-right">Phiên đọc</th>
                <th className="py-3 px-4 text-center">Gắn kết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {daysOfWeek.map((dayName) => {
                const currDay = selectedWeek.days.find((d) => getDayOfWeekVi(d.date) === dayName);
                const prevDay = prevWeek?.days.find((d) => getDayOfWeekVi(d.date) === dayName);
                const currPv = currDay?.pageview ?? 0;
                const prevPv = prevDay?.pageview ?? 0;

                let wowPct: number | undefined;
                if (prevPv > 0 && currPv > 0) {
                  wowPct = Number((((currPv - prevPv) / prevPv) * 100).toFixed(1));
                }

                let vsMedianPct: number | undefined;
                if (selectedWeek.median_daily_pageview > 0 && currPv > 0) {
                  vsMedianPct = Number(
                    (
                      ((currPv - selectedWeek.median_daily_pageview) /
                        selectedWeek.median_daily_pageview) *
                      100
                    ).toFixed(1)
                  );
                }

                const isWeekend = dayName === 'Thứ bảy' || dayName === 'Chủ nhật';

                return (
                  <tr key={dayName} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{dayName}</span>
                        {isWeekend && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            Cuối tuần
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {currDay ? currDay.date : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-blue-900">
                      {currDay ? `${formatNumber(currPv)} PV` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {prevDay ? prevDay.date : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {prevDay ? `${formatNumber(prevPv)} PV` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {renderTrend(wowPct)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {renderTrend(vsMedianPct)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-800">
                      {currDay ? formatNumber(currDay.users) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-800">
                      {currDay ? formatNumber(currDay.session) : '—'}
                    </td>
                    <td className="py-3 px-4 text-center text-amber-700 font-semibold">
                      {currDay ? `${currDay.stickiness}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Chuyên mục trong tuần */}
      {activeTab === 'categories' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Chuyên mục</th>
                <th className="py-3 px-4 text-right">Tổng Pageview Tuần</th>
                <th className="py-3 px-4 text-right">Pageview Tuần trước</th>
                <th className="py-3 px-4 text-center">Tăng trưởng WoW</th>
                <th className="py-3 px-4 text-center">Tỷ trọng (% Share)</th>
                <th className="py-3 px-4 text-right">Trung vị ngày</th>
                <th className="py-3 px-4 text-right">Độc giả tuần</th>
                <th className="py-3 px-4 text-right">Phiên đọc tuần</th>
                <th className="py-3 px-4 text-right">Ngoại vi (External)</th>
                <th className="py-3 px-4 text-right">Nội bộ (Internal)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <tr key={cat.category} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{cat.category}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatNumber(cat.pageview)} PV
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500">
                    {cat.prev_pageview !== undefined ? `${formatNumber(cat.prev_pageview)} PV` : '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {renderTrend(cat.wow_pageview_pct)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-full">
                      {cat.share_pct}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-blue-800 font-semibold">
                    {formatNumber(cat.median_daily_pageview)} PV/ngày
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700">
                    {formatNumber(cat.users)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700">
                    {formatNumber(cat.session)}
                  </td>
                  <td className="py-3 px-4 text-right text-sky-700">
                    {formatNumber(cat.total_external)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700">
                    {formatNumber(cat.total_internal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { DailySummary, CategorySummary } from '../types';
import { formatNumber, getDayOfWeekVi } from '../utils/analytics';
import { Table, ArrowUpDown, Download, Search, CheckCircle, AlertTriangle, BarChart2 } from 'lucide-react';

interface DailyDiagnosticTableProps {
  dailyData: DailySummary[];
  categoryData: CategorySummary[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const DailyDiagnosticTable: React.FC<DailyDiagnosticTableProps> = ({
  dailyData,
  categoryData,
  selectedDate,
  onSelectDate,
}) => {
  const [tab, setTab] = useState<'by_date' | 'by_category'>('by_date');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Sorting logic for daily view
  const sortedDailyData = useMemo(() => {
    let list = [...dailyData];
    if (search.trim()) {
      list = list.filter((d) => d.date.includes(search.trim()));
    }

    list.sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      valA = valA ?? 0;
      valB = valB ?? 0;
      return sortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [dailyData, search, sortField, sortAsc]);

  // Export to CSV
  const handleExportCSV = () => {
    let csvContent = '';
    if (tab === 'by_date') {
      csvContent = 'Ngày,Thứ,Pageviews,Vs_Median_PV_Pct,DoD_PV_Pct,Users,Sessions,VnE_Users,Stickiness_DAU_MAU_Pct,External_Traffic,Internal_Traffic\n';
      sortedDailyData.forEach((d) => {
        csvContent += `${d.date},${getDayOfWeekVi(d.date)},${d.pageview},${d.vs_median_pageview_pct ?? 0}%,${d.dod_pageview_pct ?? 0}%,${d.users},${d.session},${d.vne_user},${d.stickiness}%,${d.total_external},${d.total_internal}\n`;
      });
    } else {
      csvContent = 'Chuyên_mục,Pageviews,Trung_vị_PV,Vs_Median_Pct,DoD_PV_Pct,Thị_phần_Pct,Users,Stickiness_DAU_MAU_Pct,External_Traffic,Internal_Traffic\n';
      categoryData.forEach((c) => {
        csvContent += `"${c.category}",${c.pageview},${c.median_pageview ?? 0},${c.vs_median_pct ?? 0}%,${c.dod_pageview_pct ?? 0}%,${c.share_pct}%,${c.users},${c.stickiness}%,${c.total_external},${c.total_internal}\n`;
      });
    }

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `daily_performance_report_${tab}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Bảng Chẩn đoán &amp; Nhật ký Số liệu Hàng ngày (Diagnostic Log)
            </h2>
            <p className="text-xs text-slate-500">
              Đối chiếu chi tiết so với mốc Trung vị chuẩn chu kỳ và nhịp độ biến động từng ngày
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => {
                setTab('by_date');
                setSortField('date');
              }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                tab === 'by_date'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo dõi Theo Ngày
            </button>
            <button
              onClick={() => setTab('by_category')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                tab === 'by_category'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Subfolder (Ngày {selectedDate})
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {tab === 'by_date' ? (
        <>
          {/* Search bar */}
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm ngày (YYYY-MM-DD)..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs text-slate-500">
              Hiển thị {sortedDailyData.length} ngày theo dõi
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th
                    onClick={() => handleSort('date')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Ngày (Thứ)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('pageview')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Pageview</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('vs_median_pageview_pct')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1 text-amber-800">
                      <BarChart2 className="w-3 h-3 text-amber-600" />
                      <span>vs Trung vị kỳ</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('dod_pageview_pct')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>DoD (nhịp ngày)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('users')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Users</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('stickiness')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Stickiness (%)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('session')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Sessions</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('vne_user')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>VnE User</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">Nguồn Ngoài (E_*)</th>
                  <th className="py-3 px-3 text-right">Nội bộ (I_*)</th>
                  <th className="py-3 px-3 text-center">Đánh giá chuẩn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedDailyData.map((row) => {
                  const isSelected = row.date === selectedDate;
                  const vsMedPct = row.vs_median_pageview_pct ?? 0;
                  const isPosMed = vsMedPct >= 0;
                  const dodPct = row.dod_pageview_pct;
                  const isPosDoD = (dodPct ?? 0) >= 0;

                  return (
                    <tr
                      key={row.date}
                      onClick={() => onSelectDate(row.date)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 font-semibold'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                        <span className="text-slate-500 font-normal mr-1.5 inline-block min-w-[55px]">
                          {getDayOfWeekVi(row.date)}
                        </span>
                        <span className="font-mono">{row.date}</span>
                        {isSelected && <span className="ml-1.5 text-[10px] text-blue-600 font-bold bg-blue-100 px-1 py-0.2 rounded">(Đang chọn)</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {formatNumber(row.pageview)}
                      </td>
                      {/* vs Median Column */}
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`font-mono font-bold inline-flex items-center px-1.5 py-0.5 rounded text-[11px] ${
                            isPosMed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isPosMed ? `+${vsMedPct}%` : `${vsMedPct}%`}
                        </span>
                      </td>
                      {/* DoD Column */}
                      <td className="py-2.5 px-3 text-right">
                        {dodPct !== undefined ? (
                          <span
                            className={`font-mono inline-flex items-center px-1.5 py-0.5 rounded text-[11px] ${
                              isPosDoD ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isPosDoD ? `+${dodPct}%` : `${dodPct}%`}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatNumber(row.users)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700">
                        {row.stickiness}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatNumber(row.session)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-700">
                        {formatNumber(row.vne_user)} ({row.vne_user_ratio}%)
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                        {formatNumber(row.total_external)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-700">
                        {formatNumber(row.total_internal)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {vsMedPct >= 10 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Vượt trung vị
                          </span>
                        ) : vsMedPct <= -12 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Dưới trung vị
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            Bám sát trung vị
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Subfolder breakdown for selected date */
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-3 px-3">Subfolder / Chuyên mục</th>
                <th className="py-3 px-3 text-right">Pageview Ngày</th>
                <th className="py-3 px-3 text-right">Trung vị Ngày (Toàn kỳ)</th>
                <th className="py-3 px-3 text-right text-amber-800">vs Trung vị (%)</th>
                <th className="py-3 px-3 text-right">DoD (nhịp ngày)</th>
                <th className="py-3 px-3 text-right">Thị phần %</th>
                <th className="py-3 px-3 text-right">Users</th>
                <th className="py-3 px-3 text-right">Stickiness (%)</th>
                <th className="py-3 px-3 text-right">Sessions</th>
                <th className="py-3 px-3 text-right">Nguồn Ngoài (E_*)</th>
                <th className="py-3 px-3 text-right">Nội bộ (I_*)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryData.map((cat) => {
                const vsMed = cat.vs_median_pct ?? 0;
                const isPosMed = vsMed >= 0;
                const isPosDoD = (cat.dod_pageview_pct ?? 0) >= 0;
                return (
                  <tr key={cat.category} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {cat.category}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      {formatNumber(cat.pageview)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      {formatNumber(cat.median_pageview)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`font-mono font-bold inline-flex items-center px-1.5 py-0.5 rounded text-[11px] ${
                          isPosMed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isPosMed ? `+${vsMed}%` : `${vsMed}%`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {cat.dod_pageview_pct !== undefined ? (
                        <span
                          className={`font-mono inline-flex items-center px-1.5 py-0.5 rounded text-[11px] ${
                            isPosDoD ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isPosDoD ? `+${cat.dod_pageview_pct}%` : `${cat.dod_pageview_pct}%`}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {cat.share_pct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {formatNumber(cat.users)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700">
                      {cat.stickiness}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {formatNumber(cat.session)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                      {formatNumber(cat.total_external)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-indigo-700">
                      {formatNumber(cat.total_internal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

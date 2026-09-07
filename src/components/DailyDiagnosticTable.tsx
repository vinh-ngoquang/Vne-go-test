import React, { useState, useMemo } from 'react';
import { DailySummary, CategorySummary } from '../types';
import { formatNumber } from '../utils/analytics';
import { Table, ArrowUpDown, Download, Search, CheckCircle, AlertTriangle } from 'lucide-react';

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
      csvContent = 'Ngày,Pageviews,Users,Sessions,VnE_Users,DoD_PV_Pct,External_Traffic,Internal_Traffic,PV_Per_Session\n';
      sortedDailyData.forEach((d) => {
        csvContent += `${d.date},${d.pageview},${d.users},${d.session},${d.vne_user},${d.dod_pageview_pct ?? 0}%,${d.total_external},${d.total_internal},${d.pv_per_session}\n`;
      });
    } else {
      csvContent = 'Chuyên_mục,Pageviews,Users,Sessions,DoD_PV_Pct,Thị_phần_Pct,External_Traffic,Internal_Traffic\n';
      categoryData.forEach((c) => {
        csvContent += `"${c.category}",${c.pageview},${c.users},${c.session},${c.dod_pageview_pct ?? 0}%,${c.share_pct}%,${c.total_external},${c.total_internal}\n`;
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
              So sánh chi tiết tốc độ tăng trưởng, cấu trúc nguồn và các cảnh báo bất thường
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
                      <span>Ngày</span>
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
                    onClick={() => handleSort('dod_pageview_pct')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Tăng trưởng DoD</span>
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
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedDailyData.map((row) => {
                  const isSelected = row.date === selectedDate;
                  const isPos = (row.dod_pageview_pct ?? 0) >= 0;
                  const isAnomaly = Math.abs(row.dod_pageview_pct ?? 0) >= 25;

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
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                        {row.date} {isSelected && <span className="ml-1 text-[10px] text-blue-600 font-bold">(Đang chọn)</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {formatNumber(row.pageview)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {row.dod_pageview_pct !== undefined ? (
                          <span
                            className={`font-mono font-bold inline-flex items-center px-1.5 py-0.5 rounded text-[11px] ${
                              isPos ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {isPos ? `+${row.dod_pageview_pct}%` : `${row.dod_pageview_pct}%`}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatNumber(row.users)}
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
                        {isAnomaly ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3" /> Biến động mạnh
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Bình thường
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
                <th className="py-3 px-3 text-right">Pageview</th>
                <th className="py-3 px-3 text-right">Tăng trưởng DoD</th>
                <th className="py-3 px-3 text-right">Thị phần %</th>
                <th className="py-3 px-3 text-right">Users</th>
                <th className="py-3 px-3 text-right">Sessions</th>
                <th className="py-3 px-3 text-right">Nguồn Ngoài (E_*)</th>
                <th className="py-3 px-3 text-right">Nội bộ (I_*)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryData.map((cat) => {
                const isPos = (cat.dod_pageview_pct ?? 0) >= 0;
                return (
                  <tr key={cat.category} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {cat.category}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      {formatNumber(cat.pageview)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {cat.dod_pageview_pct !== undefined ? (
                        <span
                          className={`font-mono font-bold inline-flex items-center px-1.5 py-0.5 rounded text-[11px] ${
                            isPos ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isPos ? `+${cat.dod_pageview_pct}%` : `${cat.dod_pageview_pct}%`}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {cat.share_pct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {formatNumber(cat.users)}
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

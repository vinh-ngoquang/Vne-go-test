import React from 'react';
import {
  Calendar,
  CalendarRange,
  Upload,
  Layers,
  FolderTree,
  RefreshCw,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import { TimeView, WeeklySummary } from '../types';
import { getDayOfWeekVi } from '../utils/analytics';

interface HeaderProps {
  timeView: TimeView;
  onChangeTimeView: (view: TimeView) => void;
  weeks: WeeklySummary[];
  selectedWeekKey: string;
  onSelectWeek: (weekKey: string) => void;
  dates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  folderType: string;
  onChangeFolderType: (type: string) => void;
  selectedCategory: string;
  onChangeCategory: (cat: string) => void;
  categories: string[];
  onOpenSyncModal: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  lastRefreshedAt: string | null;
  googleSheetUrl: string;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  timeView,
  onChangeTimeView,
  weeks,
  selectedWeekKey,
  onSelectWeek,
  dates,
  selectedDate,
  onSelectDate,
  folderType,
  onChangeFolderType,
  selectedCategory,
  onChangeCategory,
  categories,
  onOpenSyncModal,
  onRefreshData,
  isRefreshing,
  lastRefreshedAt,
  googleSheetUrl,
  onResetData,
}) => {
  const currentDayName = getDayOfWeekVi(selectedDate);
  const isWeekend = currentDayName === 'Thứ bảy' || currentDayName === 'Chủ nhật';

  const selectedWeek = weeks.find((w) => w.weekKey === selectedWeekKey) || weeks[weeks.length - 1];
  const weekIdx = weeks.findIndex((w) => w.weekKey === selectedWeekKey);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        {/* Top bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Performance Tracking Dashboard
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Subfolder Analytics
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi hiệu quả theo Tuần &amp; Ngày &bull; So sánh tuần trước (WoW) &bull; Chuẩn hóa qua mốc Trung vị (Median)
              </p>
            </div>
          </div>

          {/* Timeview Toggle & Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* TIME VIEW SELECTOR: THEO TUẦN vs THEO NGÀY */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
              <button
                onClick={() => onChangeTimeView('WEEK')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  timeView === 'WEEK'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chế độ theo dõi vận hành theo Tuần (So sánh tuần trước & mốc trung vị)"
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Xem theo Tuần</span>
              </button>
              <button
                onClick={() => onChangeTimeView('DAY')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  timeView === 'DAY'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chế độ phân tích chi tiết theo Ngày"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Xem theo Ngày</span>
              </button>
            </div>

            {/* REFRESH BUTTON (LÀM MỚI DỮ LIỆU) */}
            <button
              onClick={onRefreshData}
              disabled={isRefreshing}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border shadow-2xs transition-all cursor-pointer ${
                isRefreshing
                  ? 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300 active:scale-95'
              }`}
              title={
                googleSheetUrl
                  ? `Nhấn để nạp dữ liệu mới nhất từ Google Sheet (Lần cuối: ${lastRefreshedAt || 'chưa ghi nhận'})`
                  : 'Nhấn để làm mới dữ liệu hoặc kết nối Google Sheet'
              }
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-emerald-700'}`} />
              <span>{isRefreshing ? 'Đang cập nhật...' : 'Làm mới dữ liệu'}</span>
              {lastRefreshedAt && !isRefreshing && (
                <span className="text-[10px] font-normal text-emerald-600 border-l border-emerald-300 pl-1.5 hidden md:inline">
                  {lastRefreshedAt.split(' ')[1] || lastRefreshedAt}
                </span>
              )}
            </button>

            {/* GOOGLE SHEET SYNC CONFIG BUTTON */}
            <button
              onClick={onOpenSyncModal}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border shadow-2xs transition-colors cursor-pointer ${
                googleSheetUrl
                  ? 'bg-white hover:bg-slate-50 text-slate-800 border-emerald-400'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
              title="Cấu hình link Google Sheet & Chu kỳ tự động cập nhật"
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${googleSheetUrl ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>{googleSheetUrl ? 'Google Sheet' : 'Liên kết Sheet'}</span>
              {googleSheetUrl ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ring-2 ring-emerald-200" title="Đã kết nối link Google Sheet" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
              )}
            </button>

            {/* NẠP CSV THỦ CÔNG */}
            <button
              onClick={onOpenSyncModal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Nạp thêm dữ liệu từ file CSV"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Nạp CSV</span>
            </button>

            {/* ĐẶT LẠI MẪU */}
            <button
              onClick={onResetData}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Khôi phục dữ liệu mẫu ban đầu từ Sheet"
            >
              <span className="hidden sm:inline">Mẫu gốc</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          {/* 1. SELECTION BOX: TUẦN HOẶC NGÀY */}
          {timeView === 'WEEK' ? (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 pl-1">
                <CalendarRange className="w-4 h-4 text-blue-600" />
                <span>Tuần theo dõi:</span>
              </div>
              <select
                value={selectedWeekKey}
                onChange={(e) => onSelectWeek(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                {weeks.map((w, idx) => (
                  <option key={w.weekKey} value={w.weekKey}>
                    {w.label} {idx === weeks.length - 1 ? '• (Mới nhất)' : ''}
                  </option>
                ))}
              </select>

              {selectedWeek && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                  {selectedWeek.shortLabel}
                  <span className="ml-1 text-[10px] text-blue-600 font-normal">
                    ({selectedWeek.dayCount} ngày)
                  </span>
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 pl-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Ngày theo dõi:</span>
              </div>
              <select
                value={selectedDate}
                onChange={(e) => onSelectDate(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                {dates.map((d) => (
                  <option key={d} value={d}>
                    {getDayOfWeekVi(d)} &mdash; {d} {d === dates[dates.length - 1] ? '(Mới nhất)' : ''}
                  </option>
                ))}
              </select>
              {selectedDate && (
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border shadow-2xs ${
                    isWeekend
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                  title={isWeekend ? 'Cuối tuần: Pageview thường có xu hướng giảm tự nhiên' : 'Ngày làm việc trong tuần'}
                >
                  {currentDayName}
                  {isWeekend && <span className="ml-1 text-[10px] text-amber-600 font-normal">(Cuối tuần)</span>}
                </span>
              )}
            </div>
          )}

          {/* Cấp Thư mục - Giữ lại Folder Cấp 1 và Cấp 2 */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 pl-1">
              <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cấp thư mục:</span>
            </div>
            <div className="flex gap-1">
              {['Folder Cấp 1', 'Folder Cấp 2'].map((type) => (
                <button
                  key={type}
                  onClick={() => onChangeFolderType(type)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                    folderType === type
                      ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 pl-1">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chuyên mục:</span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => onChangeCategory(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-md px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">Tất cả chuyên mục</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Stepper: Week or Day */}
          <div className="ml-auto flex items-center gap-1 text-xs text-slate-500">
            {timeView === 'WEEK' ? (
              <>
                <button
                  disabled={weekIdx <= 0}
                  onClick={() => {
                    if (weekIdx > 0) onSelectWeek(weeks[weekIdx - 1].weekKey);
                  }}
                  className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 rounded text-slate-700 font-medium cursor-pointer transition-colors"
                  title="Xem tuần trước đó"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Tuần trước</span>
                </button>
                <button
                  disabled={weekIdx >= weeks.length - 1}
                  onClick={() => {
                    if (weekIdx < weeks.length - 1) onSelectWeek(weeks[weekIdx + 1].weekKey);
                  }}
                  className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 rounded text-slate-700 font-medium cursor-pointer transition-colors"
                  title="Xem tuần tiếp theo"
                >
                  <span>Tuần sau</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  disabled={dates.indexOf(selectedDate) <= 0}
                  onClick={() => {
                    const idx = dates.indexOf(selectedDate);
                    if (idx > 0) onSelectDate(dates[idx - 1]);
                  }}
                  className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 rounded text-slate-700 font-medium cursor-pointer transition-colors"
                  title="Lùi 1 ngày"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Ngày trước</span>
                </button>
                <button
                  disabled={dates.indexOf(selectedDate) >= dates.length - 1}
                  onClick={() => {
                    const idx = dates.indexOf(selectedDate);
                    if (idx < dates.length - 1) onSelectDate(dates[idx + 1]);
                  }}
                  className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 rounded text-slate-700 font-medium cursor-pointer transition-colors"
                  title="Tiến 1 ngày"
                >
                  <span>Ngày sau</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

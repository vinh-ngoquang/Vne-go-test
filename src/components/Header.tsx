import React from 'react';
import { Calendar, Filter, Upload, Layers, FolderTree, RefreshCw, BarChart3 } from 'lucide-react';
import { getDayOfWeekVi } from '../utils/analytics';

interface HeaderProps {
  dates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  folderType: string;
  onChangeFolderType: (type: string) => void;
  selectedCategory: string;
  onChangeCategory: (cat: string) => void;
  categories: string[];
  onOpenImport: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dates,
  selectedDate,
  onSelectDate,
  folderType,
  onChangeFolderType,
  selectedCategory,
  onChangeCategory,
  categories,
  onOpenImport,
  onResetData,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {/* Top bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Daily Performance Tracking
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Subfolder Analytics
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi biến động hiệu quả hàng ngày, phân tích tăng trưởng &amp; nguồn lưu lượng
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={onOpenImport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Cập nhật thêm dữ liệu ngày mới"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Nạp thêm dữ liệu CSV</span>
            </button>

            <button
              onClick={onResetData}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Khôi phục dữ liệu mẫu ban đầu"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đặt lại mẫu</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          {/* Daily Focus Selector */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 pl-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Ngày theo dõi:</span>
            </div>
            <select
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-md px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              {dates.map((d) => (
                <option key={d} value={d}>
                  {getDayOfWeekVi(d)} • {d} {d === dates[dates.length - 1] ? '(Mới nhất)' : ''}
                </option>
              ))}
            </select>
            {selectedDate && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs">
                {getDayOfWeekVi(selectedDate)}
              </span>
            )}
          </div>

          {/* Folder Level Filter */}
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

          {/* Quick Date Stepper */}
          <div className="ml-auto flex items-center gap-1 text-xs text-slate-500">
            <span>Chuyển ngày:</span>
            <button
              disabled={dates.indexOf(selectedDate) <= 0}
              onClick={() => {
                const idx = dates.indexOf(selectedDate);
                if (idx > 0) onSelectDate(dates[idx - 1]);
              }}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 rounded text-slate-700 font-medium cursor-pointer"
            >
              ◀ Ngày trước
            </button>
            <button
              disabled={dates.indexOf(selectedDate) >= dates.length - 1}
              onClick={() => {
                const idx = dates.indexOf(selectedDate);
                if (idx < dates.length - 1) onSelectDate(dates[idx + 1]);
              }}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 rounded text-slate-700 font-medium cursor-pointer"
            >
              Ngày sau ▶
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

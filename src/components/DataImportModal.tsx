import React, { useState } from 'react';
import { X, UploadCloud, AlertCircle, FileText, Check } from 'lucide-react';
import { parseCSV } from '../data/initialData';
import { RawRecord } from '../types';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newRecords: RawRecord[]) => void;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [csvText, setCsvText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      setError(null);
    };
    reader.onerror = () => {
      setError('Không thể đọc file CSV. Vui lòng thử lại.');
    };
    reader.readAsText(file);
  };

  const handleProcess = () => {
    try {
      setError(null);
      if (!csvText.trim()) {
        setError('Vui lòng dán nội dung CSV hoặc chọn file.');
        return;
      }

      const parsed = parseCSV(csvText);
      if (parsed.length === 0) {
        setError('Không tìm thấy dòng dữ liệu hợp lệ. Vui lòng kiểm tra định dạng CSV.');
        return;
      }

      setSuccessCount(parsed.length);
      setTimeout(() => {
        onImport(parsed);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(`Lỗi xử lý CSV: ${err?.message || 'Định dạng không khớp'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Nạp / Cập nhật Dữ liệu CSV Ngày mới
              </h3>
              <p className="text-xs text-slate-500">
                Nhập tiếp dữ liệu các ngày tiếp theo từ Google Sheet để theo dõi liên tục
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* File input */}
          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center transition-colors bg-slate-50/50">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 mb-1">
              Kéo thả file .csv vào đây hoặc click để chọn file
            </p>
            <p className="text-[11px] text-slate-500 mb-3">
              Chấp nhận file xuất từ Google Sheet sheet &quot;theo subfolder&quot;
            </p>
            <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors">
              <span>Chọn file từ máy tính</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs text-slate-400 font-medium">HOẶC DÁN TRỰC TIẾP CSV</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dán nội dung CSV (có chứa header date_days,type_folder,users...):
            </label>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setError(null);
              }}
              placeholder="date_days,type_folder,users,vne_user,pageview,E_Direct,..."
              className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Đã phân tích thành công {successCount} dòng bản ghi! Đang áp dụng...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleProcess}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Áp dụng Dữ liệu
          </button>
        </div>
      </div>
    </div>
  );
};

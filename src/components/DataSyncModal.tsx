import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  HelpCircle,
  FileText,
  Check,
  Zap,
} from 'lucide-react';
import { RawRecord } from '../types';
import { fetchGoogleSheetData, convertGoogleSheetUrl } from '../utils/googleSheetSync';
import { parseCSV } from '../data/initialData';

interface DataSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleSheetUrl: string;
  onSaveGoogleSheetUrl: (url: string) => void;
  autoRefreshInterval: number; // in seconds (0 = off)
  onChangeAutoRefreshInterval: (seconds: number) => void;
  onImportRecords: (records: RawRecord[], sourceName?: string) => void;
  lastRefreshedAt: string | null;
}

export const DataSyncModal: React.FC<DataSyncModalProps> = ({
  isOpen,
  onClose,
  googleSheetUrl,
  onSaveGoogleSheetUrl,
  autoRefreshInterval,
  onChangeAutoRefreshInterval,
  onImportRecords,
  lastRefreshedAt,
}) => {
  const [activeTab, setActiveTab] = useState<'sheet' | 'csv'>('sheet');
  const [urlInput, setUrlInput] = useState(googleSheetUrl);
  const [selectedInterval, setSelectedInterval] = useState<number>(autoRefreshInterval);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Manual CSV tab states
  const [csvText, setCsvText] = useState('');
  const [csvFileError, setCsvFileError] = useState<string | null>(null);
  const [csvSuccessCount, setCsvSuccessCount] = useState<number | null>(null);

  useEffect(() => {
    setUrlInput(googleSheetUrl);
    setSelectedInterval(autoRefreshInterval);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [googleSheetUrl, autoRefreshInterval, isOpen]);

  if (!isOpen) return null;

  const handleTestAndSync = async () => {
    if (!urlInput.trim()) {
      setErrorMessage('Vui lòng nhập đường liên kết Google Sheet.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { records } = await fetchGoogleSheetData(urlInput);
      onSaveGoogleSheetUrl(urlInput.trim());
      onChangeAutoRefreshInterval(selectedInterval);
      onImportRecords(records, 'Google Sheet');
      setSuccessMessage(`Đã đồng bộ thành công ${records.length} dòng dữ liệu từ Google Sheet!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể kết nối tới Google Sheet. Vui lòng kiểm tra lại quyền truy cập hoặc định dạng.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettingsOnly = () => {
    onSaveGoogleSheetUrl(urlInput.trim());
    onChangeAutoRefreshInterval(selectedInterval);
    setSuccessMessage('Đã lưu cấu hình liên kết Google Sheet thành công!');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      setCsvFileError(null);
    };
    reader.onerror = () => {
      setCsvFileError('Không thể đọc file CSV. Vui lòng thử lại.');
    };
    reader.readAsText(file);
  };

  const handleProcessManualCsv = () => {
    try {
      setCsvFileError(null);
      if (!csvText.trim()) {
        setCsvFileError('Vui lòng dán nội dung CSV hoặc chọn file.');
        return;
      }

      const parsed = parseCSV(csvText);
      if (parsed.length === 0) {
        setCsvFileError('Không tìm thấy dòng dữ liệu hợp lệ. Vui lòng kiểm tra định dạng cột CSV.');
        return;
      }

      setCsvSuccessCount(parsed.length);
      setTimeout(() => {
        onImportRecords(parsed, 'File CSV');
        onClose();
      }, 800);
    } catch (err: any) {
      setCsvFileError(`Lỗi xử lý CSV: ${err?.message || 'Định dạng không khớp'}`);
    }
  };

  const convertedInfo = convertGoogleSheetUrl(urlInput);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Cập nhật &amp; Đồng bộ Dữ liệu
              </h3>
              <p className="text-xs text-slate-500">
                Tự động đồng bộ số liệu từ Google Sheet hoặc nạp file CSV thủ công
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-5 pt-2 bg-white gap-2">
          <button
            onClick={() => setActiveTab('sheet')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'sheet'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Liên kết Google Sheet (Tự động cập nhật)</span>
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'csv'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
            <span>Nạp CSV thủ công</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800 text-xs">
          {activeTab === 'sheet' ? (
            <>
              {/* Google Sheet URL input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Đường link Google Sheet của bạn:</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                      Hỗ trợ link Chia sẻ &amp; Xuất bản CSV
                    </span>
                  </label>
                  {lastRefreshedAt && (
                    <span className="text-[11px] text-slate-400">
                      Đồng bộ gần nhất: <strong>{lastRefreshedAt}</strong>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv hoặc link chia sẻ"
                    className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white pr-20"
                  />
                  {urlInput && (
                    <button
                      onClick={() => setUrlInput('')}
                      className="absolute right-2.5 top-2.5 text-[11px] text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded bg-slate-200/50 cursor-pointer"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {convertedInfo.isConverted && convertedInfo.note && (
                  <p className="text-[11px] text-blue-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{convertedInfo.note}</span>
                  </p>
                )}
              </div>

              {/* Auto-refresh interval config */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-bold text-slate-800 text-xs">
                        Tự động làm mới khi có dữ liệu mới trên Sheet (Auto-Refresh):
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Dashboard sẽ ngầm kiểm tra và tự cập nhật các biểu đồ theo chu kỳ đã chọn
                      </p>
                    </div>
                  </div>

                  <select
                    value={selectedInterval}
                    onChange={(e) => setSelectedInterval(Number(e.target.value))}
                    className="text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs self-start sm:self-auto"
                  >
                    <option value={60}>Mỗi 1 phút (Thời gian thực)</option>
                    <option value={300}>Mỗi 5 phút (Khuyên dùng)</option>
                    <option value={900}>Mỗi 15 phút</option>
                    <option value={1800}>Mỗi 30 phút</option>
                    <option value={0}>Tắt tự động (Chỉ làm mới thủ công)</option>
                  </select>
                </div>
              </div>

              {/* Step by step guide */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                  <HelpCircle className="w-4 h-4 text-emerald-700" />
                  <span>Cách lấy link để Dashboard tự cập nhật trực tiếp từ Google Sheet:</span>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-700 pl-1 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-900 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      1
                    </span>
                    <span>
                      Mở file Google Sheet dữ liệu của bạn (trang tính chứa sheet <strong>theo subfolder</strong>).
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-900 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      2
                    </span>
                    <span>
                      Bấm menu <strong>Tệp (File)</strong> &rarr; <strong>Chia sẻ (Share)</strong> &rarr; <strong>Xuất bản lên web (Publish to the web)</strong>.
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-900 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      3
                    </span>
                    <span>
                      Tại mục <strong>Liên kết (Link)</strong>, chọn trang tính <strong>theo subfolder</strong> &rarr; chọn định dạng <strong>Giá trị phân cách bằng dấu phẩy (.csv)</strong>.
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-900 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      4
                    </span>
                    <span>
                      Bấm <strong>Xuất bản (Publish)</strong>, sao chép liên kết URL đó và dán vào ô bên trên &rarr; Bấm <strong>&quot;Kiểm tra &amp; Đồng bộ ngay&quot;</strong>.
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-800 pt-1 border-t border-emerald-200 font-medium">
                  &bull; <em>Sau khi liên kết, bất cứ khi nào bạn nhập thêm ngày mới hoặc sửa số liệu trên Google Sheet, Dashboard sẽ tự động cập nhật số liệu mới nhất!</em>
                </p>
              </div>

              {/* Status alerts */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div className="space-y-1">
                    <p className="font-bold">Không thể kết nối:</p>
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{successMessage}</span>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Manual CSV Tab */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center transition-colors bg-slate-50/50">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 mb-1">
                  Kéo thả file .csv vào đây hoặc click để chọn file
                </p>
                <p className="text-[11px] text-slate-500 mb-3">
                  Chấp nhận file xuất từ Google Sheet sheet &quot;theo subfolder&quot;
                </p>
                <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors">
                  <span>Chọn file CSV từ máy tính</span>
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
                <span className="text-xs text-slate-400 font-medium">HOẶC DÁN TRỰC TIẾP DỮ LIỆU CSV</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dán chuỗi CSV (chứa header: date_days,type_folder,users...):
                </label>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => {
                    setCsvText(e.target.value);
                    setCsvFileError(null);
                  }}
                  placeholder="date_days,type_folder,users,vne_user,pageview,E_Direct,..."
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              {csvFileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{csvFileError}</span>
                </div>
              )}

              {csvSuccessCount !== null && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Đã phân tích thành công {csvSuccessCount} dòng bản ghi! Đang nạp vào dashboard...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2.5">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            {activeTab === 'sheet' && googleSheetUrl ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                Đã kết nối link Google Sheet
              </span>
            ) : (
              <span>Chưa có dữ liệu từ nguồn ngoài</span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Đóng
            </button>

            {activeTab === 'sheet' ? (
              <>
                <button
                  onClick={handleSaveSettingsOnly}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  Lưu cấu hình
                </button>
                <button
                  onClick={handleTestAndSync}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Đang kết nối & tải...' : 'Kiểm tra & Đồng bộ ngay'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleProcessManualCsv}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Nạp dữ liệu CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo, useEffect } from 'react';
import { initialRecords } from './data/initialData';
import { RawRecord, TimeView } from './types';
import {
  filterRecords,
  aggregateByDate,
  aggregateByCategory,
  aggregateByWeek,
  aggregateWeeklyCategory,
  generateFollowUpAlerts,
  calculateMedian,
} from './utils/analytics';
import { Header } from './components/Header';
import { WeeklyKpiCards } from './components/WeeklyKpiCards';
import { WeeklyTrendChart } from './components/WeeklyTrendChart';
import { WeeklyCategoryShareChart } from './components/WeeklyCategoryShareChart';
import { WeeklyTrafficDynamicsChart } from './components/WeeklyTrafficDynamicsChart';
import { WeeklyDiagnosticTable } from './components/WeeklyDiagnosticTable';
import { FollowUpSummaryBanner } from './components/FollowUpSummaryBanner';
import { DailyKpiCards } from './components/DailyKpiCards';
import { DailyTrendChart } from './components/DailyTrendChart';
import { CategoryDailyShareChart } from './components/CategoryDailyShareChart';
import { TrafficChannelDynamicsChart } from './components/TrafficChannelDynamicsChart';
import { EngagementQualityChart } from './components/EngagementQualityChart';
import { DailyDiagnosticTable } from './components/DailyDiagnosticTable';
import { DataSyncModal } from './components/DataSyncModal';
import { fetchGoogleSheetData } from './utils/googleSheetSync';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState<RawRecord[]>(() => {
    const saved = localStorage.getItem('vne_analytics_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if parsed records contain any date before 2026-08-25 (old fake data)
          const hasOldFakeData = parsed.some((r: any) => r.date_days && r.date_days < '2026-08-25');
          if (!hasOldFakeData) return parsed;
          localStorage.removeItem('vne_analytics_records');
        }
      } catch (e) {
        console.error('Failed to parse saved records', e);
      }
    }
    return initialRecords;
  });

  // Timeview state: Defaults to 'WEEK' as requested
  const [timeView, setTimeView] = useState<TimeView>('WEEK');

  const [folderType, setFolderType] = useState<string>('Folder Cấp 2');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeMetric, setActiveMetric] = useState<'pageview' | 'users' | 'session' | 'vne_user' | 'stickiness'>('pageview');
  
  // Google Sheet & Auto-Refresh state
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>(() => {
    return localStorage.getItem('vne_google_sheet_url') || '';
  });
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(() => {
    const saved = localStorage.getItem('vne_auto_refresh_interval');
    return saved !== null ? Number(saved) : 300; // default 5 minutes
  });
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(() => {
    return localStorage.getItem('vne_last_refreshed_at') || null;
  });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // All unique dates sorted ascending
  const allDates = useMemo(() => {
    const set = new Set(records.map((r) => r.date_days).filter(Boolean));
    return Array.from(set).sort();
  }, [records]);

  // Selected date state (for DAY view)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return allDates[allDates.length - 1] || '2026-09-06';
  });

  // Ensure selectedDate is valid when records change
  useEffect(() => {
    if (allDates.length > 0 && !allDates.includes(selectedDate)) {
      setSelectedDate(allDates[allDates.length - 1]);
    }
  }, [allDates, selectedDate]);

  // Ensure folderType is strictly 'Folder Cấp 1' or 'Folder Cấp 2'
  useEffect(() => {
    if (folderType !== 'Folder Cấp 1' && folderType !== 'Folder Cấp 2') {
      setFolderType('Folder Cấp 2');
    }
  }, [folderType]);

  // All unique categories in current folder scope
  const categories = useMemo(() => {
    const scoped = records.filter((r) => r.type_folder === folderType);
    const set = new Set(scoped.map((r) => r.Catename).filter(Boolean));
    return Array.from(set).sort();
  }, [records, folderType]);

  // Filtered records based on active folder type and category
  const filteredRecords = useMemo(() => {
    return filterRecords(records, folderType, selectedCategory);
  }, [records, folderType, selectedCategory]);

  // ==========================================
  // WEEKLY AGGREGATIONS & LOGIC
  // ==========================================
  const weeklySummaries = useMemo(() => {
    return aggregateByWeek(filteredRecords);
  }, [filteredRecords]);

  // Selected week key (defaults to latest week)
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(() => {
    if (weeklySummaries.length > 0) {
      return weeklySummaries[weeklySummaries.length - 1].weekKey;
    }
    return '2026-W36';
  });

  // Keep selectedWeekKey valid when data changes
  useEffect(() => {
    if (weeklySummaries.length > 0 && !weeklySummaries.some((w) => w.weekKey === selectedWeekKey)) {
      setSelectedWeekKey(weeklySummaries[weeklySummaries.length - 1].weekKey);
    }
  }, [weeklySummaries, selectedWeekKey]);

  // Find current and previous week
  const currWeekIdx = useMemo(() => {
    return weeklySummaries.findIndex((w) => w.weekKey === selectedWeekKey);
  }, [weeklySummaries, selectedWeekKey]);

  const currentWeekSummary = useMemo(() => {
    if (currWeekIdx >= 0) return weeklySummaries[currWeekIdx];
    return weeklySummaries[weeklySummaries.length - 1] || null;
  }, [weeklySummaries, currWeekIdx]);

  const prevWeekSummary = useMemo(() => {
    if (currWeekIdx > 0) return weeklySummaries[currWeekIdx - 1];
    return null;
  }, [weeklySummaries, currWeekIdx]);

  // Median across all weeks (Mốc Trung vị các tuần)
  const medianWeeksPv = useMemo(() => {
    if (weeklySummaries.length === 0) return 0;
    return Math.round(calculateMedian(weeklySummaries.map((w) => w.pageview)));
  }, [weeklySummaries]);

  const medianWeeksDailyPv = useMemo(() => {
    if (weeklySummaries.length === 0) return 0;
    return Math.round(calculateMedian(weeklySummaries.map((w) => w.median_daily_pageview)));
  }, [weeklySummaries]);

  const allWeeksMedian = useMemo(() => {
    if (weeklySummaries.length === 0) {
      return { pageview: 0, users: 0, session: 0, vne_user: 0, stickiness: 0 };
    }
    return {
      pageview: calculateMedian(weeklySummaries.map((w) => w.pageview)),
      users: calculateMedian(weeklySummaries.map((w) => w.users)),
      session: calculateMedian(weeklySummaries.map((w) => w.session)),
      vne_user: calculateMedian(weeklySummaries.map((w) => w.vne_user)),
      stickiness: calculateMedian(weeklySummaries.map((w) => w.stickiness)),
    };
  }, [weeklySummaries]);

  // Weekly category breakdown for the selected week vs prev week
  const weeklyCategorySummaries = useMemo(() => {
    const baseRecords = records.filter((r) => r.type_folder === folderType);
    return aggregateWeeklyCategory(baseRecords, selectedWeekKey, prevWeekSummary?.weekKey);
  }, [records, folderType, selectedWeekKey, prevWeekSummary]);

  // ==========================================
  // DAILY AGGREGATIONS & LOGIC
  // ==========================================
  const dailySummaries = useMemo(() => {
    return aggregateByDate(filteredRecords);
  }, [filteredRecords]);

  const currDayIdx = useMemo(() => {
    return dailySummaries.findIndex((d) => d.date === selectedDate);
  }, [dailySummaries, selectedDate]);

  const currentDaySummary = useMemo(() => {
    if (currDayIdx >= 0) return dailySummaries[currDayIdx];
    return dailySummaries[dailySummaries.length - 1] || {
      date: selectedDate,
      pageview: 0,
      users: 0,
      session: 0,
      vne_user: 0,
      total_external: 0,
      total_internal: 0,
      E_Direct: 0,
      E_Referrer: 0,
      E_Search: 0,
      E_Social: 0,
      I_Detail: 0,
      I_Folder: 0,
      I_Home: 0,
      I_Tag: 0,
      I_Topic: 0,
      I_24h: 0,
      I_Other: 0,
      pv_per_session: 0,
      pv_per_user: 0,
      vne_user_ratio: 0,
      mau: 0,
      stickiness: 0,
    };
  }, [dailySummaries, currDayIdx, selectedDate]);

  const prevDate = useMemo(() => {
    if (currDayIdx > 0) return dailySummaries[currDayIdx - 1].date;
    return undefined;
  }, [dailySummaries, currDayIdx]);

  const prevDaySummary = useMemo(() => {
    if (currDayIdx > 0) return dailySummaries[currDayIdx - 1];
    return null;
  }, [dailySummaries, currDayIdx]);

  const sameDayLastWeekSummary = useMemo(() => {
    if (!selectedDate) return null;
    const parts = selectedDate.split('-').map(Number);
    if (parts.length !== 3) return null;
    const [year, month, day] = parts;
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() - 7);
    const targetStr = d.toISOString().slice(0, 10);
    return dailySummaries.find((item) => item.date === targetStr) || null;
  }, [dailySummaries, selectedDate]);

  // Overall daily median across the entire period
  const allTimeMedian = useMemo(() => {
    if (dailySummaries.length === 0) {
      return { pageview: 0, users: 0, session: 0, vne_user: 0, stickiness: 0 };
    }
    return {
      pageview: Math.round(calculateMedian(dailySummaries.map((d) => d.pageview))),
      users: Math.round(calculateMedian(dailySummaries.map((d) => d.users))),
      session: Math.round(calculateMedian(dailySummaries.map((d) => d.session))),
      vne_user: Math.round(calculateMedian(dailySummaries.map((d) => d.vne_user))),
      stickiness: Number(calculateMedian(dailySummaries.map((d) => d.stickiness)).toFixed(2)),
    };
  }, [dailySummaries]);

  const categorySummaries = useMemo(() => {
    const baseRecords = records.filter((r) => r.type_folder === folderType);
    return aggregateByCategory(baseRecords, selectedDate, prevDate);
  }, [records, folderType, selectedDate, prevDate]);

  const dailyAlerts = useMemo(() => {
    return generateFollowUpAlerts(dailySummaries, categorySummaries, selectedDate);
  }, [dailySummaries, categorySummaries, selectedDate]);

  // Auto-hide notification toast
  useEffect(() => {
    if (!syncToast) return;
    const timer = setTimeout(() => {
      setSyncToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [syncToast]);

  const handleSaveGoogleSheetUrl = (url: string) => {
    setGoogleSheetUrl(url);
    localStorage.setItem('vne_google_sheet_url', url);
  };

  const handleChangeAutoRefreshInterval = (seconds: number) => {
    setAutoRefreshInterval(seconds);
    localStorage.setItem('vne_auto_refresh_interval', seconds.toString());
  };

  // Handle data import from modal (Google Sheet or CSV file)
  const handleImportRecords = (newRecords: RawRecord[], sourceName = 'File CSV') => {
    setRecords(newRecords);
    localStorage.setItem('vne_analytics_records', JSON.stringify(newRecords));
    const now = new Date();
    const timeStr = `${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    setLastRefreshedAt(timeStr);
    localStorage.setItem('vne_last_refreshed_at', timeStr);
    setSyncToast({
      type: 'success',
      message: `Đã cập nhật ${newRecords.length} dòng dữ liệu từ ${sourceName} (${timeStr}).`,
    });
  };

  // Explicit Refresh Handler (Triggered by Header "Làm mới dữ liệu" button)
  const handleRefreshData = async () => {
    if (!googleSheetUrl.trim()) {
      setIsSyncModalOpen(true);
      return;
    }

    setIsRefreshing(true);
    try {
      const { records: fetchedRecords } = await fetchGoogleSheetData(googleSheetUrl);
      setRecords(fetchedRecords);
      localStorage.setItem('vne_analytics_records', JSON.stringify(fetchedRecords));
      const now = new Date();
      const timeStr = `${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
      setLastRefreshedAt(timeStr);
      localStorage.setItem('vne_last_refreshed_at', timeStr);
      setSyncToast({
        type: 'success',
        message: `Đã làm mới dữ liệu thành công từ Google Sheet! (${fetchedRecords.length} dòng, lúc ${timeStr.split(' ')[1]}).`,
      });
    } catch (err: any) {
      setSyncToast({
        type: 'error',
        message: `Lỗi khi làm mới: ${err?.message || 'Không thể kết nối tới Google Sheet'}. Nhấn nút 'Google Sheet' để kiểm tra lại liên kết.`,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Background Auto-Refresh Polling
  useEffect(() => {
    if (!googleSheetUrl.trim() || autoRefreshInterval <= 0) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const { records: latestRecords } = await fetchGoogleSheetData(googleSheetUrl);
        if (latestRecords && latestRecords.length > 0) {
          setRecords(latestRecords);
          localStorage.setItem('vne_analytics_records', JSON.stringify(latestRecords));
          const now = new Date();
          const timeStr = `${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
          setLastRefreshedAt(timeStr);
          localStorage.setItem('vne_last_refreshed_at', timeStr);
        }
      } catch (e) {
        console.warn('Auto-refresh background sync failed:', e);
      }
    }, autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [googleSheetUrl, autoRefreshInterval]);

  // Reset to initial sample
  const handleResetData = () => {
    if (window.confirm('Khôi phục lại dữ liệu mẫu gốc từ Google Sheet?')) {
      localStorage.removeItem('vne_analytics_records');
      setRecords(initialRecords);
      setSelectedCategory('ALL');
      setFolderType('Folder Cấp 2');
      setSyncToast({
        type: 'info',
        message: 'Đã khôi phục về dữ liệu mẫu gốc.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Navigation & Filter Bar */}
      <Header
        timeView={timeView}
        onChangeTimeView={setTimeView}
        weeks={weeklySummaries}
        selectedWeekKey={selectedWeekKey}
        onSelectWeek={setSelectedWeekKey}
        dates={allDates}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        folderType={folderType}
        onChangeFolderType={setFolderType}
        selectedCategory={selectedCategory}
        onChangeCategory={setSelectedCategory}
        categories={categories}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onRefreshData={handleRefreshData}
        isRefreshing={isRefreshing}
        lastRefreshedAt={lastRefreshedAt}
        googleSheetUrl={googleSheetUrl}
        onResetData={handleResetData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {timeView === 'WEEK' && currentWeekSummary ? (
          <>
            {/* 1. Weekly 5 KPI Score Cards with WoW, Median, Depth & Interactive selection */}
            <WeeklyKpiCards
              currentWeek={currentWeekSummary}
              prevWeek={prevWeekSummary}
              medianWeeksPv={medianWeeksPv}
              medianWeeksDailyPv={medianWeeksDailyPv}
              activeMetric={activeMetric}
              onSelectMetric={setActiveMetric}
              allWeeksMedian={allWeeksMedian}
            />

            {/* 3. Weekly Trend Chart (Line chart with X-axis by Week, Median baseline & WoW) */}
            <WeeklyTrendChart
              currentWeek={currentWeekSummary}
              prevWeek={prevWeekSummary}
              allWeeks={weeklySummaries}
              medianWeeksPv={medianWeeksPv}
              activeMetric={activeMetric}
              onChangeMetric={setActiveMetric}
              onSelectWeek={setSelectedWeekKey}
            />

            {/* 4. Subfolder Contribution & Share Shift Chart (Line/Area with X-axis by Week) */}
            <WeeklyCategoryShareChart
              allWeeks={weeklySummaries}
              records={records.filter((r) => r.type_folder === folderType)}
              categories={categories}
              selectedWeekKey={selectedWeekKey}
              onSelectWeek={setSelectedWeekKey}
              categorySummaries={weeklyCategorySummaries}
              onSelectCategory={setSelectedCategory}
              selectedCategory={selectedCategory}
            />

            {/* 5. Channel Dynamics (External vs Internal shifts with X-axis by Week) */}
            <WeeklyTrafficDynamicsChart
              allWeeks={weeklySummaries}
              currentWeek={currentWeekSummary}
              prevWeek={prevWeekSummary}
              onSelectWeek={setSelectedWeekKey}
            />

            {/* 6. Engagement & Reader Loyalty with X-axis by Week (PV/Session, PV/User, % VnE User, Stickiness) */}
            <EngagementQualityChart
              weeklyData={weeklySummaries}
              selectedWeekKey={selectedWeekKey}
              onSelectWeek={setSelectedWeekKey}
              isWeekly={true}
            />

            {/* 7. Weekly Diagnostic & Multi-Week Comparison Matrix Table */}
            <WeeklyDiagnosticTable
              allWeeks={weeklySummaries}
              selectedWeek={currentWeekSummary}
              prevWeek={prevWeekSummary}
              categories={weeklyCategorySummaries}
              onSelectWeek={setSelectedWeekKey}
            />
          </>
        ) : (
          <>
            {/* Daily View Mode */}
            {/* 1. Daily Actionable Follow-up Priority Banner */}
            <FollowUpSummaryBanner
              alerts={dailyAlerts}
              selectedDate={selectedDate}
              dodPageviewPct={currentDaySummary.dod_pageview_pct}
              wowPageviewPct={
                sameDayLastWeekSummary && sameDayLastWeekSummary.pageview > 0
                  ? Number((((currentDaySummary.pageview - sameDayLastWeekSummary.pageview) / sameDayLastWeekSummary.pageview) * 100).toFixed(1))
                  : undefined
              }
              vsMedianPageviewPct={currentDaySummary.vs_median_pageview_pct}
              medianPv={allTimeMedian.pageview}
            />

            {/* 2. Daily KPI Cards with WoW, and all-time median comparisons */}
            <DailyKpiCards
              current={currentDaySummary}
              prev={prevDaySummary}
              sameDayLastWeek={sameDayLastWeekSummary}
              allTimeMedian={allTimeMedian}
              activeMetric={activeMetric}
              onSelectMetric={setActiveMetric}
            />

            {/* 3. Main Daily Trend Chart */}
            <DailyTrendChart
              data={dailySummaries}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              metric={activeMetric}
              onChangeMetric={setActiveMetric}
            />

            {/* 4. Subfolder Contribution & Share Shift Chart */}
            <CategoryDailyShareChart
              records={records.filter((r) => r.type_folder === folderType)}
              categories={categories}
              selectedDate={selectedDate}
              categorySummaries={categorySummaries}
              onSelectCategory={setSelectedCategory}
              selectedCategory={selectedCategory}
              onSelectDate={setSelectedDate}
            />

            {/* 5. Channel Dynamics (External vs Internal shifts) */}
            <TrafficChannelDynamicsChart
              data={dailySummaries}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            {/* 6. Engagement & Reader Loyalty (PV/Session, PV/User, % VnE User) */}
            <EngagementQualityChart
              data={dailySummaries}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            {/* 7. Diagnostic Matrix & Exportable Log Table */}
            <DailyDiagnosticTable
              dailyData={dailySummaries}
              categoryData={categorySummaries}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Hệ thống Theo dõi Hiệu quả Vận hành Subfolder (VnE Performance Follow-up Dashboard)
          </span>
          <span className="text-slate-400">
            Dữ liệu: {allDates[0] ? allDates[0].split('-').reverse().join('/') : '25/08/2026'} &mdash; {allDates[allDates.length - 1] ? allDates[allDates.length - 1].split('-').reverse().join('/') : '06/09/2026'} ({weeklySummaries.map((w) => w.shortLabel).join(', ')}) &bull; Sheet &quot;theo subfolder&quot;
          </span>
        </div>
      </footer>

      {/* Data Sync & Import Modal (Google Sheet + CSV) */}
      <DataSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        googleSheetUrl={googleSheetUrl}
        onSaveGoogleSheetUrl={handleSaveGoogleSheetUrl}
        autoRefreshInterval={autoRefreshInterval}
        onChangeAutoRefreshInterval={handleChangeAutoRefreshInterval}
        onImportRecords={handleImportRecords}
        lastRefreshedAt={lastRefreshedAt}
      />

      {/* Floating Refresh/Sync Notification Toast */}
      {syncToast && (
        <div
          className={`fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md p-3.5 rounded-xl shadow-xl border flex items-start gap-2.5 text-xs transition-all ${
            syncToast.type === 'success'
              ? 'bg-slate-900 text-white border-emerald-500'
              : syncToast.type === 'error'
              ? 'bg-slate-900 text-white border-rose-500'
              : 'bg-slate-900 text-white border-blue-500'
          }`}
        >
          {syncToast.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          {syncToast.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold block mb-0.5">
              {syncToast.type === 'success'
                ? 'Đồng bộ dữ liệu thành công'
                : syncToast.type === 'error'
                ? 'Thông báo đồng bộ'
                : 'Thông báo'}
            </span>
            <span className="text-slate-300 text-[11px]">{syncToast.message}</span>
          </div>
          <button
            onClick={() => setSyncToast(null)}
            className="text-slate-400 hover:text-white p-0.5 cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

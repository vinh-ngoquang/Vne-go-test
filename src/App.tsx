import React, { useState, useMemo, useEffect } from 'react';
import { initialRecords } from './data/initialData';
import { RawRecord } from './types';
import {
  filterRecords,
  aggregateByDate,
  aggregateByCategory,
  generateFollowUpAlerts,
} from './utils/analytics';
import { Header } from './components/Header';
import { FollowUpSummaryBanner } from './components/FollowUpSummaryBanner';
import { DailyKpiCards } from './components/DailyKpiCards';
import { DailyTrendChart } from './components/DailyTrendChart';
import { CategoryDailyShareChart } from './components/CategoryDailyShareChart';
import { TrafficChannelDynamicsChart } from './components/TrafficChannelDynamicsChart';
import { EngagementQualityChart } from './components/EngagementQualityChart';
import { DailyDiagnosticTable } from './components/DailyDiagnosticTable';
import { DataImportModal } from './components/DataImportModal';

export default function App() {
  const [records, setRecords] = useState<RawRecord[]>(() => {
    const saved = localStorage.getItem('vne_analytics_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved records', e);
      }
    }
    return initialRecords;
  });

  const [folderType, setFolderType] = useState<string>('Folder Cấp 2');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeMetric, setActiveMetric] = useState<'pageview' | 'users' | 'session' | 'vne_user' | 'stickiness'>('pageview');
  const [isImportOpen, setIsImportOpen] = useState(false);

  // All unique dates sorted ascending
  const allDates = useMemo(() => {
    const set = new Set(records.map((r) => r.date_days).filter(Boolean));
    return Array.from(set).sort();
  }, [records]);

  // Selected date state (defaults to latest date)
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

  // Daily aggregations across time
  const dailySummaries = useMemo(() => {
    return aggregateByDate(filteredRecords);
  }, [filteredRecords]);

  // Find current and previous day summary
  const currIdx = useMemo(() => {
    return dailySummaries.findIndex((d) => d.date === selectedDate);
  }, [dailySummaries, selectedDate]);

  const currentDaySummary = useMemo(() => {
    if (currIdx >= 0) return dailySummaries[currIdx];
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
  }, [dailySummaries, currIdx, selectedDate]);

  const prevDate = useMemo(() => {
    if (currIdx > 0) return dailySummaries[currIdx - 1].date;
    return undefined;
  }, [dailySummaries, currIdx]);

  const prevDaySummary = useMemo(() => {
    if (currIdx > 0) return dailySummaries[currIdx - 1];
    return null;
  }, [dailySummaries, currIdx]);

  // Find same day last week (7 days prior)
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

  // Overall average across the entire period
  const allTimeAvg = useMemo(() => {
    if (dailySummaries.length === 0) {
      return { pageview: 0, users: 0, session: 0, vne_user: 0, stickiness: 0 };
    }
    const count = dailySummaries.length;
    const avgUsers = dailySummaries.reduce((sum, d) => sum + d.users, 0) / count;
    const avgMau = dailySummaries.reduce((sum, d) => sum + d.mau, 0) / count;
    const avgStickiness = avgMau > 0 ? Number(((avgUsers / avgMau) * 100).toFixed(2)) : 0;
    return {
      pageview: Math.round(dailySummaries.reduce((sum, d) => sum + d.pageview, 0) / count),
      users: Math.round(avgUsers),
      session: Math.round(dailySummaries.reduce((sum, d) => sum + d.session, 0) / count),
      vne_user: Math.round(dailySummaries.reduce((sum, d) => sum + d.vne_user, 0) / count),
      stickiness: avgStickiness,
    };
  }, [dailySummaries]);

  // Category breakdown for selected date vs prev date
  const categorySummaries = useMemo(() => {
    const baseRecords = records.filter((r) => r.type_folder === folderType);
    return aggregateByCategory(baseRecords, selectedDate, prevDate);
  }, [records, folderType, selectedDate, prevDate]);

  // Daily follow-up alerts & actionable insights
  const alerts = useMemo(() => {
    return generateFollowUpAlerts(dailySummaries, categorySummaries, selectedDate);
  }, [dailySummaries, categorySummaries, selectedDate]);

  // Handle data import
  const handleImportRecords = (newRecords: RawRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('vne_analytics_records', JSON.stringify(newRecords));
  };

  // Reset to initial sample
  const handleResetData = () => {
    if (window.confirm('Khôi phục lại dữ liệu mẫu gốc từ Google Sheet?')) {
      localStorage.removeItem('vne_analytics_records');
      setRecords(initialRecords);
      setSelectedCategory('ALL');
      setFolderType('Folder Cấp 2');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Navigation & Sticky Filter Bar */}
      <Header
        dates={allDates}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        folderType={folderType}
        onChangeFolderType={setFolderType}
        selectedCategory={selectedCategory}
        onChangeCategory={setSelectedCategory}
        categories={categories}
        onOpenImport={() => setIsImportOpen(true)}
        onResetData={handleResetData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* 1. Daily Actionable Follow-up Priority Banner */}
        <FollowUpSummaryBanner
          alerts={alerts}
          selectedDate={selectedDate}
          dodPageviewPct={currentDaySummary.dod_pageview_pct}
        />

        {/* 2. Daily KPI Cards with DoD, WoW, and all-time avg comparisons */}
        <DailyKpiCards
          current={currentDaySummary}
          prev={prevDaySummary}
          sameDayLastWeek={sameDayLastWeekSummary}
          allTimeAvg={allTimeAvg}
          activeMetric={activeMetric}
          onSelectMetric={setActiveMetric}
        />

        {/* 3. Main Trend & Momentum Chart (Rolling Average + DoD Growth Bars) */}
        <DailyTrendChart
          data={dailySummaries}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          metric={activeMetric}
          onChangeMetric={setActiveMetric}
        />

        {/* 4. Subfolder Contribution & Share Shift Chart */}
        <CategoryDailyShareChart
          records={folderType === 'ALL' ? records : records.filter((r) => r.type_folder === folderType)}
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
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Hệ thống Theo dõi Hiệu quả Vận hành Subfolder Hàng ngày (VnE Analytics)
          </span>
          <span className="text-slate-400">
            Dữ liệu mẫu: 25/08/2026 &mdash; 06/09/2026 &bull; Sheet &quot;theo subfolder&quot;
          </span>
        </div>
      </footer>

      {/* CSV Import Modal */}
      <DataImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportRecords}
      />
    </div>
  );
}

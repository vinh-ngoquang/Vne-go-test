import { RawRecord, DailySummary, CategorySummary, DailyAlert, WeeklySummary, WeeklyCategorySummary } from '../types';

/**
 * Calculate the median value of a numerical array
 */
export function calculateMedian(numbers: number[]): number {
  if (!numbers || numbers.length === 0) return 0;
  const valid = numbers.filter((n) => typeof n === 'number' && !isNaN(n));
  if (valid.length === 0) return 0;
  const sorted = [...valid].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
}

/**
 * Filter raw records by folder type and category
 */
export function filterRecords(
  records: RawRecord[],
  folderType: string, // 'ALL' | 'Folder Cấp 1' | 'Folder Cấp 2'
  category: string,   // 'ALL' or specific Catename
  startDate?: string,
  endDate?: string
): RawRecord[] {
  return records.filter(r => {
    if (folderType !== 'ALL' && r.type_folder !== folderType) return false;
    if (category !== 'ALL' && r.Catename !== category) return false;
    if (startDate && r.date_days < startDate) return false;
    if (endDate && r.date_days > endDate) return false;
    return true;
  });
}

/**
 * Aggregate records by date
 */
export function aggregateByDate(records: RawRecord[]): DailySummary[] {
  const map = new Map<string, {
    pageview: number;
    users: number;
    session: number;
    vne_user: number;
    mau: number;
    E_Direct: number;
    E_Referrer: number;
    E_Search: number;
    E_Social: number;
    I_Detail: number;
    I_Folder: number;
    I_Home: number;
    I_Tag: number;
    I_Topic: number;
    I_24h: number;
    I_Other: number;
  }>();

  records.forEach(r => {
    const existing = map.get(r.date_days) || {
      pageview: 0,
      users: 0,
      session: 0,
      vne_user: 0,
      mau: 0,
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
    };

    existing.pageview += r.pageview;
    existing.users += r.users;
    existing.session += r.session;
    existing.vne_user += r.vne_user;
    existing.mau += r.MAU;
    existing.E_Direct += r.E_Direct;
    existing.E_Referrer += r.E_Referrer;
    existing.E_Search += r.E_Search;
    existing.E_Social += r.E_Social;
    existing.I_Detail += r.I_Detail;
    existing.I_Folder += r.I_Folder;
    existing.I_Home += r.I_Home;
    existing.I_Tag += r.I_Tag;
    existing.I_Topic += r.I_Topic;
    existing.I_24h += r.I_24h;
    existing.I_Other += r.I_Other;

    map.set(r.date_days, existing);
  });

  // Sort by date ascending
  const sortedDates = Array.from(map.keys()).sort();

  const summaries: DailySummary[] = sortedDates.map((date) => {
    const data = map.get(date)!;
    const total_external = data.E_Direct + data.E_Referrer + data.E_Search + data.E_Social;
    const total_internal = data.I_Detail + data.I_Folder + data.I_Home + data.I_Tag + data.I_Topic + data.I_24h + data.I_Other;
    const pv_per_session = data.session > 0 ? Number((data.pageview / data.session).toFixed(2)) : 0;
    const pv_per_user = data.users > 0 ? Number((data.pageview / data.users).toFixed(2)) : 0;
    const vne_user_ratio = data.users > 0 ? Number(((data.vne_user / data.users) * 100).toFixed(1)) : 0;
    const stickiness = data.mau > 0 ? Number(((data.users / data.mau) * 100).toFixed(2)) : 0;

    return {
      date,
      ...data,
      stickiness,
      total_external,
      total_internal,
      pv_per_session,
      pv_per_user,
      vne_user_ratio,
    };
  });

  // Calculate Medians across all dates in the period
  const allPvMedian = calculateMedian(summaries.map((s) => s.pageview));
  const allUsersMedian = calculateMedian(summaries.map((s) => s.users));
  const allSessionMedian = calculateMedian(summaries.map((s) => s.session));
  const allStickinessMedian = calculateMedian(summaries.map((s) => s.stickiness));

  // Calculate Day-over-Day (DoD) changes, comparisons vs Median, and Rolling Medians
  summaries.forEach((curr, idx) => {
    // Comparison vs overall cycle Median (Tránh ảnh hưởng nhịp giảm tự nhiên cuối tuần)
    curr.vs_median_pageview_pct = allPvMedian > 0
      ? Number((((curr.pageview - allPvMedian) / allPvMedian) * 100).toFixed(1))
      : 0;
    curr.vs_median_users_pct = allUsersMedian > 0
      ? Number((((curr.users - allUsersMedian) / allUsersMedian) * 100).toFixed(1))
      : 0;
    curr.vs_median_session_pct = allSessionMedian > 0
      ? Number((((curr.session - allSessionMedian) / allSessionMedian) * 100).toFixed(1))
      : 0;
    curr.vs_median_stickiness_pct = allStickinessMedian > 0
      ? Number((((curr.stickiness - allStickinessMedian) / allStickinessMedian) * 100).toFixed(1))
      : 0;

    if (idx > 0) {
      const prev = summaries[idx - 1];
      curr.dod_pageview_pct = prev.pageview > 0
        ? Number((((curr.pageview - prev.pageview) / prev.pageview) * 100).toFixed(1))
        : 0;
      curr.dod_users_pct = prev.users > 0
        ? Number((((curr.users - prev.users) / prev.users) * 100).toFixed(1))
        : 0;
      curr.dod_session_pct = prev.session > 0
        ? Number((((curr.session - prev.session) / prev.session) * 100).toFixed(1))
        : 0;
      curr.dod_stickiness_pct = prev.stickiness > 0
        ? Number((((curr.stickiness - prev.stickiness) / prev.stickiness) * 100).toFixed(1))
        : 0;
    } else {
      curr.dod_pageview_pct = 0;
      curr.dod_users_pct = 0;
      curr.dod_session_pct = 0;
      curr.dod_stickiness_pct = 0;
    }

    // 3-day rolling median (thay thế trung bình động bằng trung vị trượt để loại bỏ nhiễu ngoại lai)
    const windowStart = Math.max(0, idx - 2);
    const windowSlice = summaries.slice(windowStart, idx + 1);
    const rollingMedianPv = Math.round(calculateMedian(windowSlice.map((item) => item.pageview)));
    curr.moving_median_pv = rollingMedianPv;
    curr.moving_avg_pv = rollingMedianPv; // maintain compatibility
    const rollingMedianStickiness = Number(calculateMedian(windowSlice.map((item) => item.stickiness)).toFixed(2));
    curr.moving_median_stickiness = rollingMedianStickiness;
    curr.moving_avg_stickiness = rollingMedianStickiness;
  });

  return summaries;
}

/**
 * Aggregate records by category for a selected date or date range
 */
export function aggregateByCategory(
  records: RawRecord[],
  selectedDate?: string,
  previousDate?: string
): CategorySummary[] {
  // Precalculate median daily pageview per category across all dates in records
  const catDailyPvMap = new Map<string, Map<string, number>>();
  records.forEach((r) => {
    const cat = r.Catename || 'Khác';
    if (!catDailyPvMap.has(cat)) {
      catDailyPvMap.set(cat, new Map());
    }
    const dMap = catDailyPvMap.get(cat)!;
    dMap.set(r.date_days, (dMap.get(r.date_days) || 0) + r.pageview);
  });

  const catMedianPvMap = new Map<string, number>();
  catDailyPvMap.forEach((dMap, cat) => {
    const vals = Array.from(dMap.values());
    catMedianPvMap.set(cat, Math.round(calculateMedian(vals)));
  });

  const currentRecords = selectedDate
    ? records.filter((r) => r.date_days === selectedDate)
    : records;

  const prevRecords = previousDate
    ? records.filter((r) => r.date_days === previousDate)
    : [];

  const prevPvMap = new Map<string, number>();
  prevRecords.forEach((r) => {
    const cat = r.Catename || 'Khác';
    prevPvMap.set(cat, (prevPvMap.get(cat) || 0) + r.pageview);
  });

  const catMap = new Map<string, {
    pageview: number;
    users: number;
    session: number;
    vne_user: number;
    mau: number;
    total_external: number;
    total_internal: number;
  }>();

  let totalAllPv = 0;

  currentRecords.forEach((r) => {
    const cat = r.Catename || 'Khác';
    const existing = catMap.get(cat) || {
      pageview: 0,
      users: 0,
      session: 0,
      vne_user: 0,
      mau: 0,
      total_external: 0,
      total_internal: 0,
    };

    const ext = r.E_Direct + r.E_Referrer + r.E_Search + r.E_Social;
    const internal = r.I_Detail + r.I_Folder + r.I_Home + r.I_Tag + r.I_Topic + r.I_24h + r.I_Other;

    existing.pageview += r.pageview;
    existing.users += r.users;
    existing.session += r.session;
    existing.vne_user += r.vne_user;
    existing.mau += r.MAU;
    existing.total_external += ext;
    existing.total_internal += internal;

    totalAllPv += r.pageview;
    catMap.set(cat, existing);
  });

  const results: CategorySummary[] = [];

  catMap.forEach((val, cat) => {
    const share_pct = totalAllPv > 0 ? Number(((val.pageview / totalAllPv) * 100).toFixed(1)) : 0;
    const prevPv = prevPvMap.get(cat);
    let dod_pageview_pct: number | undefined;

    if (prevPv !== undefined && prevPv > 0) {
      dod_pageview_pct = Number((((val.pageview - prevPv) / prevPv) * 100).toFixed(1));
    }

    const stickiness = val.mau > 0 ? Number(((val.users / val.mau) * 100).toFixed(2)) : 0;
    const median_pageview = catMedianPvMap.get(cat) || val.pageview;
    const vs_median_pct = median_pageview > 0
      ? Number((((val.pageview - median_pageview) / median_pageview) * 100).toFixed(1))
      : 0;

    results.push({
      category: cat,
      ...val,
      stickiness,
      share_pct,
      dod_pageview_pct,
      median_pageview,
      vs_median_pct,
    });
  });

  // Sort descending by pageview
  return results.sort((a, b) => b.pageview - a.pageview);
}

/**
 * Generate Actionable Daily Follow-up Alerts & Anomalies
 * Evaluated primarily against the MEDIAN of the cycle rather than DoD,
 * preventing distorted conclusions caused by natural weekend traffic drops.
 */
export function generateFollowUpAlerts(
  dailySummaries: DailySummary[],
  categorySummaries: CategorySummary[],
  currentDate: string
): DailyAlert[] {
  const alerts: DailyAlert[] = [];
  const currIdx = dailySummaries.findIndex((d) => d.date === currentDate);
  if (currIdx < 0) return alerts;

  const current = dailySummaries[currIdx];

  // Calculate Medians across all days
  const medianPv = calculateMedian(dailySummaries.map((d) => d.pageview));
  const medianSocial = calculateMedian(dailySummaries.map((d) => d.E_Social));
  const medianHome = calculateMedian(dailySummaries.map((d) => d.I_Home));

  const vsMedianPvPct = current.vs_median_pageview_pct ?? (
    medianPv > 0 ? Number((((current.pageview - medianPv) / medianPv) * 100).toFixed(1)) : 0
  );

  // 1. Overall Pageview Alert based on comparison with MEDIAN (loại trừ sai lệch cuối tuần)
  if (vsMedianPvPct >= 10) {
    alerts.push({
      id: 'pv-above-median',
      type: 'positive',
      date: currentDate,
      title: `Pageview vượt mức Trung vị (+${vsMedianPvPct}%)`,
      detail: `Lượt xem trang (${formatNumber(current.pageview)} PV) cao hơn +${vsMedianPvPct}% so với mốc Trung vị chu kỳ (${formatNumber(medianPv)} PV). Hiệu suất nội dung đạt phong độ rất tốt, không bị tác động bởi chu kỳ cuối tuần.`,
      metric: 'Pageviews',
      changePct: vsMedianPvPct,
    });
  } else if (vsMedianPvPct <= -12) {
    alerts.push({
      id: 'pv-below-median',
      type: 'warning',
      date: currentDate,
      title: `Pageview dưới mức Trung vị (${vsMedianPvPct}%)`,
      detail: `Lượt xem trang (${formatNumber(current.pageview)} PV) thấp hơn ${Math.abs(vsMedianPvPct)}% so với mốc Trung vị chu kỳ (${formatNumber(medianPv)} PV). Cần kiểm tra chất lượng các tuyến bài đinh và kênh phân phối.`,
      metric: 'Pageviews',
      changePct: vsMedianPvPct,
    });
  }

  // 2. Channel Traffic Shifts (So sánh với Trung vị nguồn Pageview)
  const socialVsMedPct = medianSocial > 0 ? Number((((current.E_Social - medianSocial) / medianSocial) * 100).toFixed(1)) : 0;
  if (socialVsMedPct >= 25 && current.E_Social > 5000) {
    alerts.push({
      id: 'social-above-median',
      type: 'positive',
      date: currentDate,
      title: `Nguồn Mạng Xã Hội (E_Social) bứt phá (+${socialVsMedPct}% vs Trung vị)`,
      detail: `Social đạt ${formatNumber(current.E_Social)} lượt đọc (so với mốc trung vị ${formatNumber(medianSocial)}). Tiếp tục đẩy mạnh phân phối các tin viral trên fanpage.`,
      metric: 'E_Social',
      changePct: socialVsMedPct,
    });
  }

  const homeVsMedPct = medianHome > 0 ? Number((((current.I_Home - medianHome) / medianHome) * 100).toFixed(1)) : 0;
  if (homeVsMedPct <= -15 && medianHome > 50000) {
    alerts.push({
      id: 'home-below-median',
      type: 'warning',
      date: currentDate,
      title: `Pageview từ Trang Chủ (I_Home) dưới mức Trung vị (${homeVsMedPct}%)`,
      detail: `Click từ Trang chủ đạt ${formatNumber(current.I_Home)} (thấp hơn mốc trung vị ${formatNumber(medianHome)}). Cần kiểm tra vị trí hiển thị box chuyên mục trên Home.`,
      metric: 'I_Home',
      changePct: homeVsMedPct,
    });
  }

  // 3. Category specific alerts evaluated against Category MEDIAN
  categorySummaries.forEach((cat) => {
    const catVsMedPct = cat.vs_median_pct ?? 0;
    if (catVsMedPct >= 20 && cat.pageview > 10000) {
      alerts.push({
        id: `cat-up-${cat.category}`,
        type: 'positive',
        date: currentDate,
        category: cat.category,
        title: `Chuyên mục "${cat.category}" vượt trội vs Trung vị (+${catVsMedPct}%)`,
        detail: `Đạt ${formatNumber(cat.pageview)} PV (so với mức trung vị ${formatNumber(cat.median_pageview)} PV), chiếm ${cat.share_pct}% thị phần toàn trang.`,
        metric: cat.category,
        changePct: catVsMedPct,
      });
    } else if (catVsMedPct <= -20 && (cat.median_pageview ?? 0) > 5000) {
      alerts.push({
        id: `cat-down-${cat.category}`,
        type: 'warning',
        date: currentDate,
        category: cat.category,
        title: `Chuyên mục "${cat.category}" dưới mức Trung vị (${catVsMedPct}%)`,
        detail: `Đạt ${formatNumber(cat.pageview)} PV, thấp hơn ${Math.abs(catVsMedPct)}% so với trung vị chuyên mục (${formatNumber(cat.median_pageview)} PV).`,
        metric: cat.category,
        changePct: catVsMedPct,
      });
    }
  });

  // Default informational alert anchored on Median
  if (alerts.length === 0) {
    alerts.push({
      id: 'stable-median-day',
      type: 'info',
      date: currentDate,
      title: 'Chỉ số bám sát mốc Trung vị chuẩn',
      detail: `Lượt xem trang (${formatNumber(current.pageview)} PV) dao động quanh mốc Trung vị (${formatNumber(medianPv)} PV, chênh lệch ${vsMedianPvPct > 0 ? `+${vsMedianPvPct}%` : `${vsMedianPvPct}%`} vs Trung vị). Đánh giá qua Trung vị giúp duy trì cái nhìn khách quan, không bị đánh giá sai do nhịp giảm tự nhiên cuối tuần.`,
      metric: 'Nhịp độ chuẩn',
      changePct: vsMedianPvPct,
    });
  }

  return alerts;
}

export function formatNumber(num: number | undefined): string {
  if (num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('vi-VN').format(Math.round(num));
}

export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'k';
  }
  return num.toString();
}

/**
 * Convert YYYY-MM-DD to Vietnamese day of week (e.g. "Thứ hai", "Thứ ba", "Chủ nhật")
 */
export function getDayOfWeekVi(dateStr: string, short: boolean = false): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return '';
  const [year, month, day] = parts;
  const d = new Date(Date.UTC(year, month - 1, day));
  const dayIndex = d.getUTCDay();
  if (short) {
    const shortDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return shortDays[dayIndex];
  }
  const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return days[dayIndex];
}

/**
 * Convert YYYY-MM-DD to ISO Week info
 */
export function getISOWeekInfo(dateStr: string): {
  year: number;
  week: number;
  weekKey: string;
  monday: string;
  sunday: string;
  label: string;
  shortLabel: string;
} {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1, d));
  const dayNr = (target.getUTCDay() + 6) % 7; // 0 = Mon, 6 = Sun

  const monday = new Date(target);
  monday.setUTCDate(target.getUTCDate() - dayNr);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  const weekNumber = 1 + Math.round(((thursday.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  const isoYear = thursday.getUTCFullYear();

  const monStr = monday.toISOString().slice(0, 10);
  const sunStr = sunday.toISOString().slice(0, 10);

  const [, mM, mD] = monStr.split('-');
  const [sY, sM, sD] = sunStr.split('-');
  const label = `Tuần ${weekNumber} (${mD}/${mM} - ${sD}/${sM}/${sY})`;
  const shortLabel = `Tuần ${weekNumber}`;
  const weekKey = `${isoYear}-W${String(weekNumber).padStart(2, '0')}`;

  return {
    year: isoYear,
    week: weekNumber,
    weekKey,
    monday: monStr,
    sunday: sunStr,
    label,
    shortLabel,
  };
}

/**
 * Aggregate daily summaries into weekly summaries
 */
export function aggregateByWeek(records: RawRecord[]): WeeklySummary[] {
  const dailyList = aggregateByDate(records);
  if (dailyList.length === 0) return [];

  // Group daily summaries by weekKey
  const weekMap = new Map<string, DailySummary[]>();
  dailyList.forEach((d) => {
    const info = getISOWeekInfo(d.date);
    if (!weekMap.has(info.weekKey)) {
      weekMap.set(info.weekKey, []);
    }
    weekMap.get(info.weekKey)!.push(d);
  });

  // Sort week keys chronologically
  const weekKeys = Array.from(weekMap.keys()).sort();

  const weeklySummaries: WeeklySummary[] = weekKeys.map((wKey) => {
    const days = weekMap.get(wKey)!.sort((a, b) => a.date.localeCompare(b.date));
    const firstDay = days[0].date;
    const weekInfo = getISOWeekInfo(firstDay);

    const dayCount = days.length || 1;

    // Sum metrics (Total for the week)
    const pageview = days.reduce((sum, d) => sum + d.pageview, 0);
    const session = days.reduce((sum, d) => sum + d.session, 0);
    
    // Average weekly metrics as requested: users, vne_user, stickiness are weekly averages (TB tuần)
    const rawTotalUsers = days.reduce((sum, d) => sum + d.users, 0);
    const users = Math.round(rawTotalUsers / dayCount);

    const rawTotalVneUser = days.reduce((sum, d) => sum + d.vne_user, 0);
    const vne_user = Math.round(rawTotalVneUser / dayCount);

    const stickiness = Number((days.reduce((sum, d) => sum + d.stickiness, 0) / dayCount).toFixed(2));
    const vne_user_ratio = users > 0 ? Number(((vne_user / users) * 100).toFixed(2)) : 0;

    const latestMau = days[days.length - 1]?.mau || 0;

    const E_Direct = days.reduce((sum, d) => sum + d.E_Direct, 0);
    const E_Referrer = days.reduce((sum, d) => sum + d.E_Referrer, 0);
    const E_Search = days.reduce((sum, d) => sum + d.E_Search, 0);
    const E_Social = days.reduce((sum, d) => sum + d.E_Social, 0);
    const I_Detail = days.reduce((sum, d) => sum + d.I_Detail, 0);
    const I_Folder = days.reduce((sum, d) => sum + d.I_Folder, 0);
    const I_Home = days.reduce((sum, d) => sum + d.I_Home, 0);
    const I_Tag = days.reduce((sum, d) => sum + d.I_Tag, 0);
    const I_Topic = days.reduce((sum, d) => sum + d.I_Topic, 0);
    const I_24h = days.reduce((sum, d) => sum + d.I_24h, 0);
    const I_Other = days.reduce((sum, d) => sum + d.I_Other, 0);

    const total_external = E_Direct + E_Referrer + E_Search + E_Social;
    const total_internal = I_Detail + I_Folder + I_Home + I_Tag + I_Topic + I_24h + I_Other;

    const pv_per_session = session > 0 ? Number((pageview / session).toFixed(2)) : 0;
    const pv_per_user = rawTotalUsers > 0 ? Number((pageview / rawTotalUsers).toFixed(2)) : 0;

    // TRUNG VỊ TỪNG TUẦN (Weekly Daily Medians)
    const median_daily_pageview = Math.round(calculateMedian(days.map((d) => d.pageview)));
    const median_daily_users = Math.round(calculateMedian(days.map((d) => d.users)));
    const median_daily_session = Math.round(calculateMedian(days.map((d) => d.session)));
    const median_daily_vne_user = Math.round(calculateMedian(days.map((d) => d.vne_user)));
    const median_daily_stickiness = Number(calculateMedian(days.map((d) => d.stickiness)).toFixed(2));

    return {
      weekKey: wKey,
      weekNumber: weekInfo.week,
      year: weekInfo.year,
      label: weekInfo.label,
      shortLabel: weekInfo.shortLabel,
      startDate: weekInfo.monday,
      endDate: weekInfo.sunday,
      dayCount: days.length,
      days,

      pageview,
      users,
      session,
      vne_user,
      mau: latestMau,
      stickiness,
      total_external,
      total_internal,

      E_Direct,
      E_Referrer,
      E_Search,
      E_Social,
      I_Detail,
      I_Folder,
      I_Home,
      I_Tag,
      I_Topic,
      I_24h,
      I_Other,

      pv_per_session,
      pv_per_user,
      vne_user_ratio,

      median_daily_pageview,
      median_daily_users,
      median_daily_session,
      median_daily_vne_user,
      median_daily_stickiness,
    };
  });

  // Calculate WoW (% vs previous week)
  for (let i = 0; i < weeklySummaries.length; i++) {
    const current = weeklySummaries[i];
    const prev = i > 0 ? weeklySummaries[i - 1] : null;

    if (prev && prev.pageview > 0) {
      current.wow_pageview_pct = Number((((current.pageview - prev.pageview) / prev.pageview) * 100).toFixed(1));
    }
    if (prev && prev.median_daily_pageview > 0) {
      current.wow_median_pageview_pct = Number((((current.median_daily_pageview - prev.median_daily_pageview) / prev.median_daily_pageview) * 100).toFixed(1));
    }
    if (prev && prev.users > 0) {
      current.wow_users_pct = Number((((current.users - prev.users) / prev.users) * 100).toFixed(1));
    }
    if (prev && prev.session > 0) {
      current.wow_session_pct = Number((((current.session - prev.session) / prev.session) * 100).toFixed(1));
    }
    if (prev && prev.stickiness > 0) {
      current.wow_stickiness_pct = Number((((current.stickiness - prev.stickiness) / prev.stickiness) * 100).toFixed(1));
    }
    if (prev && prev.vne_user > 0) {
      current.wow_vne_user_pct = Number((((current.vne_user - prev.vne_user) / prev.vne_user) * 100).toFixed(1));
    }
  }

  // Calculate Median across all weeks
  const allWeeksPv = weeklySummaries.map((w) => w.pageview);
  const allWeeksDailyMedianPv = weeklySummaries.map((w) => w.median_daily_pageview);
  const medianTotalPvAcrossWeeks = calculateMedian(allWeeksPv);
  const medianDailyPvAcrossWeeks = calculateMedian(allWeeksDailyMedianPv);

  weeklySummaries.forEach((w) => {
    if (medianTotalPvAcrossWeeks > 0) {
      w.vs_median_weeks_pageview_pct = Number((((w.pageview - medianTotalPvAcrossWeeks) / medianTotalPvAcrossWeeks) * 100).toFixed(1));
    }
    if (medianDailyPvAcrossWeeks > 0) {
      w.vs_median_weeks_daily_pv_pct = Number((((w.median_daily_pageview - medianDailyPvAcrossWeeks) / medianDailyPvAcrossWeeks) * 100).toFixed(1));
    }
  });

  return weeklySummaries;
}

/**
 * Aggregate categories by week
 */
export function aggregateWeeklyCategory(
  records: RawRecord[],
  currentWeekKey: string,
  prevWeekKey?: string
): WeeklyCategorySummary[] {
  const currRecords = records.filter((r) => getISOWeekInfo(r.date_days).weekKey === currentWeekKey);
  const prevRecords = prevWeekKey
    ? records.filter((r) => getISOWeekInfo(r.date_days).weekKey === prevWeekKey)
    : [];

  const totalCurrPv = currRecords.reduce((sum, r) => sum + r.pageview, 0);

  const currCatMap = new Map<string, RawRecord[]>();
  currRecords.forEach((r) => {
    const cat = r.Catename || 'Khác / Trang chung';
    if (!currCatMap.has(cat)) currCatMap.set(cat, []);
    currCatMap.get(cat)!.push(r);
  });

  const prevCatMap = new Map<string, number>();
  prevRecords.forEach((r) => {
    const cat = r.Catename || 'Khác / Trang chung';
    prevCatMap.set(cat, (prevCatMap.get(cat) || 0) + r.pageview);
  });

  const summaries: WeeklyCategorySummary[] = [];

  currCatMap.forEach((catRecords, catName) => {
    const dayMap = new Map<string, number>();
    catRecords.forEach((r) => {
      dayMap.set(r.date_days, (dayMap.get(r.date_days) || 0) + r.pageview);
    });
    const catDayCount = dayMap.size || 1;
    const pageview = catRecords.reduce((sum, r) => sum + r.pageview, 0);
    const session = catRecords.reduce((sum, r) => sum + r.session, 0);
    const users = Math.round(catRecords.reduce((sum, r) => sum + r.users, 0) / catDayCount);
    const vne_user = Math.round(catRecords.reduce((sum, r) => sum + r.vne_user, 0) / catDayCount);
    const mau = catRecords[catRecords.length - 1]?.MAU || 0;
    const stickiness = Number((catRecords.reduce((sum, r) => sum + (r.MAU > 0 ? (r.users / r.MAU) * 100 : 0), 0) / catDayCount).toFixed(2));
    const share_pct = totalCurrPv > 0 ? Number(((pageview / totalCurrPv) * 100).toFixed(1)) : 0;

    const total_external = catRecords.reduce((sum, r) => sum + r.E_Direct + r.E_Referrer + r.E_Search + r.E_Social, 0);
    const total_internal = catRecords.reduce((sum, r) => sum + r.I_Detail + r.I_Folder + r.I_Home + r.I_Tag + r.I_Topic + r.I_24h + r.I_Other, 0);

    const dailyPvs = Array.from(dayMap.values());
    const median_daily_pageview = Math.round(calculateMedian(dailyPvs));

    const prev_pageview = prevCatMap.get(catName);
    let wow_pageview_pct: number | undefined;
    if (prev_pageview !== undefined && prev_pageview > 0) {
      wow_pageview_pct = Number((((pageview - prev_pageview) / prev_pageview) * 100).toFixed(1));
    }

    summaries.push({
      category: catName,
      pageview,
      prev_pageview,
      users,
      session,
      vne_user,
      mau,
      stickiness,
      share_pct,
      wow_pageview_pct,
      median_daily_pageview,
      total_external,
      total_internal,
    });
  });

  return summaries.sort((a, b) => b.pageview - a.pageview);
}

/**
 * Generate weekly actionable follow-up alerts
 */
export function generateWeeklyFollowUpAlerts(
  weeks: WeeklySummary[],
  categories: WeeklyCategorySummary[],
  currentWeekKey: string
): DailyAlert[] {
  const current = weeks.find((w) => w.weekKey === currentWeekKey);
  if (!current) return [];

  const currIdx = weeks.findIndex((w) => w.weekKey === currentWeekKey);
  const prev = currIdx > 0 ? weeks[currIdx - 1] : null;

  const alerts: DailyAlert[] = [];

  // 1. WoW Performance
  if (current.wow_pageview_pct !== undefined) {
    if (current.wow_pageview_pct >= 10) {
      alerts.push({
        id: 'wow-pv-up',
        type: 'positive',
        date: current.startDate,
        title: `Tăng trưởng tuần vượt trội (+${current.wow_pageview_pct}% WoW)`,
        detail: `Tổng Pageview tuần này đạt ${formatNumber(current.pageview)} PV, tăng +${current.wow_pageview_pct}% so với tuần trước (${formatNumber(prev?.pageview)} PV). Mốc Trung vị ngày của tuần đạt ${formatNumber(current.median_daily_pageview)} PV/ngày (tăng ${current.wow_median_pageview_pct && current.wow_median_pageview_pct >= 0 ? `+${current.wow_median_pageview_pct}%` : `${current.wow_median_pageview_pct}%`}).`,
        metric: 'Pageviews',
        changePct: current.wow_pageview_pct,
      });
    } else if (current.wow_pageview_pct <= -10) {
      alerts.push({
        id: 'wow-pv-down',
        type: 'warning',
        date: current.startDate,
        title: `Pageview tuần giảm so với tuần trước (${current.wow_pageview_pct}% WoW)`,
        detail: `Tổng Pageview tuần này đạt ${formatNumber(current.pageview)} PV, giảm ${Math.abs(current.wow_pageview_pct)}% so với tuần trước (${formatNumber(prev?.pageview)} PV). Mốc trung vị ngày của tuần giảm về ${formatNumber(current.median_daily_pageview)} PV/ngày.`,
        metric: 'Pageviews',
        changePct: current.wow_pageview_pct,
      });
    }
  }

  // 2. Weekly Daily Median Performance ("Trung vị từng tuần")
  if (current.wow_median_pageview_pct !== undefined && Math.abs(current.wow_median_pageview_pct) >= 15) {
    alerts.push({
      id: 'weekly-median-shift',
      type: current.wow_median_pageview_pct > 0 ? 'positive' : 'warning',
      date: current.startDate,
      title: `Phong độ ngày chuẩn (Trung vị tuần) biến động ${current.wow_median_pageview_pct > 0 ? `+${current.wow_median_pageview_pct}%` : `${current.wow_median_pageview_pct}%`}`,
      detail: `Mốc Trung vị ngày của tuần này đạt ${formatNumber(current.median_daily_pageview)} PV/ngày so với ${formatNumber(prev?.median_daily_pageview)} PV/ngày tuần trước. Phản ánh phong độ thực tế của từng ngày làm việc mà không bị chi phối bởi đột biến.`,
      metric: 'Trung vị ngày',
      changePct: current.wow_median_pageview_pct,
    });
  }

  // 3. Category Outliers
  categories.forEach((cat) => {
    if (cat.wow_pageview_pct !== undefined && cat.wow_pageview_pct >= 25 && cat.pageview > 10000) {
      alerts.push({
        id: `cat-wow-up-${cat.category}`,
        type: 'positive',
        date: current.startDate,
        category: cat.category,
        title: `Chuyên mục "${cat.category}" tăng trưởng tuần ấn tượng (+${cat.wow_pageview_pct}% WoW)`,
        detail: `Đạt ${formatNumber(cat.pageview)} PV trong tuần (chiếm ${cat.share_pct}% tỷ trọng), trung vị ngày đạt ${formatNumber(cat.median_daily_pageview)} PV/ngày.`,
        metric: cat.category,
        changePct: cat.wow_pageview_pct,
      });
    } else if (cat.wow_pageview_pct !== undefined && cat.wow_pageview_pct <= -20 && (cat.prev_pageview ?? 0) > 10000) {
      alerts.push({
        id: `cat-wow-down-${cat.category}`,
        type: 'warning',
        date: current.startDate,
        category: cat.category,
        title: `Chuyên mục "${cat.category}" giảm sâu so với tuần trước (${cat.wow_pageview_pct}% WoW)`,
        detail: `Đạt ${formatNumber(cat.pageview)} PV tuần này so với ${formatNumber(cat.prev_pageview)} PV tuần trước. Cần rà soát lại tuyến đề tài.`,
        metric: cat.category,
        changePct: cat.wow_pageview_pct,
      });
    }
  });

  // Default alert if none
  if (alerts.length === 0) {
    alerts.push({
      id: 'weekly-stable-alert',
      type: 'info',
      date: current.startDate,
      title: `Tổng quan ${current.label}`,
      detail: `Tuần ghi nhận ${formatNumber(current.pageview)} PV và ${formatNumber(current.users)} Users. Mốc Trung vị ngày của tuần đạt ${formatNumber(current.median_daily_pageview)} PV/ngày ${current.wow_pageview_pct !== undefined ? `(${current.wow_pageview_pct >= 0 ? `+${current.wow_pageview_pct}%` : `${current.wow_pageview_pct}%`} vs tuần trước)` : ''}.`,
      metric: 'Nhịp độ tuần',
      changePct: current.wow_pageview_pct || 0,
    });
  }

  return alerts;
}

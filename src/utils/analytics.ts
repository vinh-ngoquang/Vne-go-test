import { RawRecord, DailySummary, CategorySummary, DailyAlert } from '../types';

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

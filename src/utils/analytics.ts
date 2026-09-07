import { RawRecord, DailySummary, CategorySummary, DailyAlert } from '../types';

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

  // Calculate Day-over-Day (DoD) changes and Moving Averages
  summaries.forEach((curr, idx) => {
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

    // 3-day rolling average for Pageviews to identify momentum
    const windowStart = Math.max(0, idx - 2);
    const windowSlice = summaries.slice(windowStart, idx + 1);
    const avg = windowSlice.reduce((sum, item) => sum + item.pageview, 0) / windowSlice.length;
    curr.moving_avg_pv = Math.round(avg);
    const avgStickiness = windowSlice.reduce((sum, item) => sum + item.stickiness, 0) / windowSlice.length;
    curr.moving_avg_stickiness = Number(avgStickiness.toFixed(2));
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
  const currentRecords = selectedDate
    ? records.filter(r => r.date_days === selectedDate)
    : records;

  const prevRecords = previousDate
    ? records.filter(r => r.date_days === previousDate)
    : [];

  const prevPvMap = new Map<string, number>();
  prevRecords.forEach(r => {
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

  currentRecords.forEach(r => {
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

    results.push({
      category: cat,
      ...val,
      stickiness,
      share_pct,
      dod_pageview_pct,
    });
  });

  // Sort descending by pageview
  return results.sort((a, b) => b.pageview - a.pageview);
}

/**
 * Generate Actionable Daily Follow-up Alerts & Anomalies
 */
export function generateFollowUpAlerts(
  dailySummaries: DailySummary[],
  categorySummaries: CategorySummary[],
  currentDate: string
): DailyAlert[] {
  const alerts: DailyAlert[] = [];
  const currIdx = dailySummaries.findIndex(d => d.date === currentDate);
  if (currIdx < 0) return alerts;

  const current = dailySummaries[currIdx];
  const prev = currIdx > 0 ? dailySummaries[currIdx - 1] : null;

  // 1. Overall Pageview Alert
  if (prev && current.dod_pageview_pct !== undefined) {
    if (current.dod_pageview_pct >= 20) {
      alerts.push({
        id: 'pv-surge',
        type: 'positive',
        date: currentDate,
        title: 'Tăng trưởng Pageview đột biến',
        detail: `Lượt xem trang tăng mạnh +${current.dod_pageview_pct}% so với ngày hôm trước (${formatNumber(current.pageview)} vs ${formatNumber(prev.pageview)}). Cần kiểm tra nội dung viral.`,
        metric: 'Pageviews',
        changePct: current.dod_pageview_pct,
      });
    } else if (current.dod_pageview_pct <= -20) {
      alerts.push({
        id: 'pv-drop',
        type: 'negative',
        date: currentDate,
        title: 'Sụt giảm Pageview đáng chú ý',
        detail: `Lượt xem trang giảm ${current.dod_pageview_pct}% so với ngày trước. Kiểm tra luồng đẩy tin từ Trang chủ hoặc nguồn Social.`,
        metric: 'Pageviews',
        changePct: current.dod_pageview_pct,
      });
    }
  }

  // 2. Channel Traffic Shifts
  if (prev) {
    const extPct = current.pageview > 0 ? (current.total_external / current.pageview) * 100 : 0;
    const prevExtPct = prev.pageview > 0 ? (prev.total_external / prev.pageview) * 100 : 0;

    if (current.E_Social > prev.E_Social * 1.5 && current.E_Social > 5000) {
      alerts.push({
        id: 'social-surge',
        type: 'positive',
        date: currentDate,
        title: 'Bùng nổ lượng đọc từ Mạng Xã Hội (E_Social)',
        detail: `Nguồn Social đạt ${formatNumber(current.E_Social)} lượt (tăng ${(
          ((current.E_Social - prev.E_Social) / prev.E_Social) * 100
        ).toFixed(0)}%). Tiếp tục tối ưu caption và thumbnail trên fanpage.`,
        metric: 'E_Social',
        changePct: Number((((current.E_Social - prev.E_Social) / prev.E_Social) * 100).toFixed(1)),
      });
    }

    if (current.I_Home < prev.I_Home * 0.7 && prev.I_Home > 50000) {
      alerts.push({
        id: 'home-drop',
        type: 'warning',
        date: currentDate,
        title: 'Luồng điều hướng từ Trang Chủ (I_Home) giảm',
        detail: `Lượng click từ Home giảm xuống ${formatNumber(current.I_Home)}. Kiểm tra vị trí hiển thị box subfolder trên trang chủ.`,
        metric: 'I_Home',
        changePct: Number((((current.I_Home - prev.I_Home) / prev.I_Home) * 100).toFixed(1)),
      });
    }
  }

  // 3. Category specific alerts
  categorySummaries.forEach(cat => {
    if (cat.dod_pageview_pct && cat.dod_pageview_pct >= 30 && cat.pageview > 10000) {
      alerts.push({
        id: `cat-up-${cat.category}`,
        type: 'positive',
        date: currentDate,
        category: cat.category,
        title: `Chuyên mục "${cat.category}" tăng tốc mạnh`,
        detail: `Đạt ${formatNumber(cat.pageview)} PV, tăng +${cat.dod_pageview_pct}% DoD, chiếm ${cat.share_pct}% thị phần toàn trang.`,
        metric: cat.category,
        changePct: cat.dod_pageview_pct,
      });
    } else if (cat.dod_pageview_pct && cat.dod_pageview_pct <= -25 && cat.pageview > 5000) {
      alerts.push({
        id: `cat-down-${cat.category}`,
        type: 'warning',
        date: currentDate,
        category: cat.category,
        title: `Chuyên mục "${cat.category}" hạ nhiệt`,
        detail: `Giảm ${cat.dod_pageview_pct}% so với hôm qua. Cần theo dõi tiếp các tập/tin mới xuất bản trong ngày.`,
        metric: cat.category,
        changePct: cat.dod_pageview_pct,
      });
    }
  });

  // Default informational alert if no drastic anomalies
  if (alerts.length === 0) {
    alerts.push({
      id: 'stable-day',
      type: 'info',
      date: currentDate,
      title: 'Chỉ số duy trì ổn định',
      detail: `Các chỉ số lượt xem và người dùng dao động trong ngưỡng bình thường (DoD dưới 20%). Tỷ lệ bạn đọc VnE đạt ${current.vne_user_ratio}%.`,
      metric: 'Nhịp độ chung',
      changePct: current.dod_pageview_pct || 0,
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

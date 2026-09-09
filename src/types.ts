export interface RawRecord {
  date_days: string; // YYYY-MM-DD
  type_folder: string; // "Folder Cấp 1" | "Folder Cấp 2"
  users: number;
  vne_user: number;
  pageview: number;
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
  session: number;
  folder_ids: string;
  MAU: number;
  Catename: string;
  join: string;
}

export interface DailySummary {
  date: string;
  pageview: number;
  users: number;
  session: number;
  vne_user: number;
  mau: number;
  stickiness: number; // (users / mau) * 100
  total_external: number;
  total_internal: number;
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
  pv_per_session: number;
  pv_per_user: number;
  vne_user_ratio: number; // percentage
  dod_pageview_pct?: number; // % change vs previous day
  dod_users_pct?: number;
  dod_session_pct?: number;
  dod_stickiness_pct?: number;
  vs_median_pageview_pct?: number; // % comparison vs overall median
  vs_median_users_pct?: number;
  vs_median_session_pct?: number;
  vs_median_stickiness_pct?: number;
  moving_avg_pv?: number;
  moving_avg_stickiness?: number;
  moving_median_pv?: number;
  moving_median_stickiness?: number;
}

export interface WeeklySummary {
  weekKey: string; // e.g. "2026-W36"
  weekNumber: number; // 36
  year: number; // 2026
  label: string; // "Tuần 36 (31/08 - 06/09/2026)"
  shortLabel: string; // "Tuần 36"
  startDate: string; // "2026-08-31"
  endDate: string; // "2026-09-06"
  dayCount: number; // số ngày ghi nhận trong tuần
  days: DailySummary[]; // dữ liệu từng ngày trong tuần

  // Tổng tuần
  pageview: number;
  users: number;
  session: number;
  vne_user: number;
  mau: number;
  stickiness: number; // (users / mau) * 100
  total_external: number;
  total_internal: number;

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

  pv_per_session: number;
  pv_per_user: number;
  vne_user_ratio: number;

  // TRUNG VỊ TỪNG TUẦN (Mốc trung vị ngày trong tuần đó)
  median_daily_pageview: number;
  median_daily_users: number;
  median_daily_session: number;
  median_daily_vne_user: number;
  median_daily_stickiness: number;

  // So sánh với tuần trước (WoW: Week-over-Week)
  wow_pageview_pct?: number;
  wow_median_pageview_pct?: number;
  wow_users_pct?: number;
  wow_session_pct?: number;
  wow_stickiness_pct?: number;
  wow_vne_user_pct?: number;

  // So sánh với Trung vị các tuần
  vs_median_weeks_pageview_pct?: number;
  vs_median_weeks_daily_pv_pct?: number;
}

export interface WeeklyCategorySummary {
  category: string;
  pageview: number; // tổng PV trong tuần
  prev_pageview?: number; // tổng PV tuần trước
  users: number;
  session: number;
  vne_user: number;
  mau: number;
  stickiness: number;
  share_pct: number;
  wow_pageview_pct?: number; // % thay đổi vs tuần trước
  median_daily_pageview: number; // trung vị ngày của category trong tuần
  total_external: number;
  total_internal: number;
}

export interface CategorySummary {
  category: string;
  pageview: number;
  users: number;
  session: number;
  vne_user: number;
  mau: number;
  stickiness: number;
  share_pct: number;
  total_external: number;
  total_internal: number;
  dod_pageview_pct?: number;
  vs_median_pct?: number;
  median_pageview?: number;
}

export interface DailyAlert {
  id: string;
  type: 'positive' | 'negative' | 'warning' | 'info';
  date: string;
  category?: string;
  title: string;
  detail: string;
  metric: string;
  changePct: number;
}

export type TimeView = 'WEEK' | 'DAY';

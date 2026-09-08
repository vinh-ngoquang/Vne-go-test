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
  moving_avg_pv?: number; // 3-day rolling median for PV
  moving_avg_stickiness?: number;
  moving_median_pv?: number;
  moving_median_stickiness?: number;
}

export interface CategorySummary {
  category: string;
  pageview: number;
  users: number;
  session: number;
  vne_user: number;
  mau: number;
  stickiness: number; // (users / mau) * 100
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

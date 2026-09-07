import React, { useState } from 'react';
import { DailySummary } from '../types';
import { formatNumber } from '../utils/analytics';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { Share2, Globe, ArrowDownRight, Compass } from 'lucide-react';

interface TrafficChannelDynamicsChartProps {
  data: DailySummary[];
  selectedDate: string;
}

export const TrafficChannelDynamicsChart: React.FC<TrafficChannelDynamicsChartProps> = ({
  data,
  selectedDate,
}) => {
  const [channelMode, setChannelMode] = useState<'macro' | 'external_detail' | 'internal_detail'>('macro');

  const selectedDaySummary = data.find((d) => d.date === selectedDate) || data[data.length - 1];

  const chartData = data.map((d) => {
    const extTotal = d.total_external;
    const intTotal = d.total_internal;
    const grandTotal = extTotal + intTotal;

    return {
      date: d.date,
      displayDate: d.date.slice(5),
      // Macro
      External: extTotal,
      Internal: intTotal,
      extPercent: grandTotal > 0 ? Number(((extTotal / grandTotal) * 100).toFixed(1)) : 0,
      intPercent: grandTotal > 0 ? Number(((intTotal / grandTotal) * 100).toFixed(1)) : 0,
      // External detail
      E_Social: d.E_Social,
      E_Search: d.E_Search,
      E_Direct: d.E_Direct,
      E_Referrer: d.E_Referrer,
      // Internal detail
      I_Home: d.I_Home,
      I_Detail: d.I_Detail,
      I_Folder: d.I_Folder,
      I_Other: d.I_Other + d.I_24h + d.I_Topic + d.I_Tag,
    };
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Theo dõi Động thái Nguồn Lưu lượng (External vs. Internal Dynamics)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mục đích follow-up: Đánh giá độ phụ thuộc trang chủ (I_Home) so với năng lực thu hút độc giả mới từ Social &amp; Search
          </p>
        </div>

        {/* Mode switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold self-start md:self-auto">
          <button
            onClick={() => setChannelMode('macro')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              channelMode === 'macro'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bên ngoài vs Nội bộ
          </button>
          <button
            onClick={() => setChannelMode('external_detail')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              channelMode === 'external_detail'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nguồn Bên ngoài (E_*)
          </button>
          <button
            onClick={() => setChannelMode('internal_detail')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              channelMode === 'internal_detail'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Luồng Nội bộ (I_*)
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {channelMode === 'macro' ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${Math.round(v / 1000)}k`)}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-lg border border-slate-800 space-y-1">
                      <div className="font-bold text-slate-300 pb-1 border-b border-slate-800">
                        Ngày {label}
                      </div>
                      <div className="flex justify-between gap-4 py-0.5">
                        <span className="text-emerald-400">Nguồn Ngoài (E_*):</span>
                        <span className="font-mono font-bold text-white">
                          {formatNumber(item.External)} ({item.extPercent}%)
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 py-0.5">
                        <span className="text-indigo-400">Luồng Nội bộ (I_*):</span>
                        <span className="font-mono font-bold text-white">
                          {formatNumber(item.Internal)} ({item.intPercent}%)
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="External" name="Nguồn Bên ngoài (E_* Social, Search, Direct)" fill="#10b981" stackId="a" />
              <Bar dataKey="Internal" name="Điều hướng Nội bộ (I_* Home, Detail, Folder)" fill="#6366f1" stackId="a" />
            </BarChart>
          ) : channelMode === 'external_detail' ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${Math.round(v / 1000)}k`)}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip
                formatter={(val: any) => [formatNumber(Number(val)), '']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="E_Social" name="Social (Facebook, TikTok...)" fill="#3b82f6" stackId="e" />
              <Bar dataKey="E_Search" name="Search (Google Tìm kiếm)" fill="#f59e0b" stackId="e" />
              <Bar dataKey="E_Direct" name="Direct (Trực tiếp)" fill="#10b981" stackId="e" />
              <Bar dataKey="E_Referrer" name="Referrer (Báo khác/Web ngoài)" fill="#8b5cf6" stackId="e" />
            </BarChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${Math.round(v / 1000)}k`)}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip
                formatter={(val: any) => [formatNumber(Number(val)), '']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="I_Home" name="I_Home (Từ Trang chủ)" fill="#6366f1" stackId="i" />
              <Bar dataKey="I_Detail" name="I_Detail (Từ Bài chi tiết)" fill="#06b6d4" stackId="i" />
              <Bar dataKey="I_Folder" name="I_Folder (Từ Trang mục)" fill="#ec4899" stackId="i" />
              <Bar dataKey="I_Other" name="I_Other (24h, Tag, Topic...)" fill="#94a3b8" stackId="i" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Daily Follow-up Channel Snapshot for Selected Date */}
      {selectedDaySummary && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Phân bổ nguồn ngày {selectedDaySummary.date}:</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Social: <strong>{formatNumber(selectedDaySummary.E_Social)}</strong>
            </span>
            <span className="inline-flex items-center gap-1 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Search: <strong>{formatNumber(selectedDaySummary.E_Search)}</strong>
            </span>
            <span className="inline-flex items-center gap-1 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Từ Trang chủ (I_Home): <strong>{formatNumber(selectedDaySummary.I_Home)}</strong>
            </span>
            <span className="inline-flex items-center gap-1 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
              Từ Bài đọc (I_Detail): <strong>{formatNumber(selectedDaySummary.I_Detail)}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

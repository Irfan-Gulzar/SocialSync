import React from 'react';
import PlatformAvatar from './PlatformAvatar';

export default function DashboardView({ conversations = [], onReplyClick, stats }) {
  // Helper to format last active time
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // ── Derive all values from stats prop (with fallbacks) ──
  const totalMessages = stats?.totalMessages ?? 0;
  const responseRate = stats?.responseRate ?? 0;
  const messagesLast24h = stats?.messagesLast24h ?? 0;
  const perPlatform = stats?.perPlatform ?? {};

  // Latest queries: prefer DB stats.latestQueries, fallback to conversations prop
  const latestQueries = (stats?.latestQueries && stats.latestQueries.length > 0)
    ? stats.latestQueries.slice(0, 3).map((q) => ({
        id: q.conversation_id,
        customer_name: q.customer_name,
        platform: q.platform,
        last_message_at: q.last_message_at,
        preview: q.last_message,
      }))
    : conversations.slice(0, 3).map((c) => ({
        id: c.id,
        customer_name: c.customer_name || 'Customer',
        platform: c.platform,
        last_message_at: c.last_message_at,
        preview: 'Click to view messages',
      }));

  // ── Donut chart: compute from real per-platform data ──
  const platformOrder = ['whatsapp', 'facebook', 'instagram', 'tiktok'];
  const platformColors = { whatsapp: '#86c232', facebook: '#1877F2', instagram: '#E1306C', tiktok: '#00E5FF' };
  const platformLabels = { whatsapp: 'WhatsApp', facebook: 'FB', instagram: 'Insta', tiktok: 'TikTok' };

  const totalPlatformMessages = platformOrder.reduce((sum, p) => sum + (perPlatform[p] || 0), 0);
  const circumference = 2 * Math.PI * 38; // ~238.76

  const donutSegments = [];
  let cumulativeOffset = 0;
  platformOrder.forEach((p) => {
    const count = perPlatform[p] || 0;
    const pct = totalPlatformMessages > 0 ? (count / totalPlatformMessages) * 100 : 0;
    const dashLen = (pct / 100) * circumference;
    donutSegments.push({
      platform: p,
      color: platformColors[p],
      label: `${platformLabels[p]} (${Math.round(pct)}%)`,
      dasharray: `${dashLen.toFixed(1)} ${circumference.toFixed(1)}`,
      dashoffset: cumulativeOffset === 0 ? '0' : `-${cumulativeOffset.toFixed(1)}`,
      count,
      pct: Math.round(pct),
    });
    cumulativeOffset += dashLen;
  });

  // Format large numbers
  const formatNumber = (n) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  // ── Weekly Analytics Grouped Bar Chart: derive from stats.weeklyAnalytics ──
  const weeklyAnalytics = stats?.weeklyAnalytics ?? {};
  const weekDates = Object.keys(weeklyAnalytics).sort().slice(0, 7);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const barPlatforms = [
    { key: 'whatsapp', color: '#86c232', gradientId: 'grad-whatsapp', label: 'WhatsApp' },
    { key: 'instagram', color: '#E1306C', gradientId: 'grad-instagram', label: 'Insta' },
    { key: 'tiktok', color: '#00E5FF', gradientId: 'grad-tiktok', label: 'TikTok' },
    { key: 'facebook', color: '#1877F2', gradientId: 'grad-facebook', label: 'FB' },
  ];

  // Calculate total messages per platform for the week
  const weeklyTotals = {};
  barPlatforms.forEach((p) => {
    weeklyTotals[p.key] = weekDates.reduce((sum, day) => sum + (weeklyAnalytics[day]?.[p.key] || 0), 0);
  });

  // Find max value for Y-axis scaling
  const allValues = weekDates.flatMap((day) =>
    barPlatforms.map((p) => weeklyAnalytics[day]?.[p.key] || 0)
  );
  const rawMax = Math.max(...allValues, 1);
  const maxVal = rawMax <= 5 ? 5 : rawMax <= 10 ? 10 : rawMax <= 20 ? 20 : rawMax <= 50 ? 50 : Math.ceil(rawMax / 10) * 10;

  // SVG chart dimensions for grouped bar chart
  const W = 1100, H = 280;
  const PAD_L = 52, PAD_R = 28, PAD_T = 24, PAD_B = 42;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const numGroups = 7;
  const groupW = chartW / numGroups;
  const barW = 16;
  const barGap = 4;
  const totalGroupBarW = 4 * barW + 3 * barGap;
  const groupStartX = (groupW - totalGroupBarW) / 2;

  const yTickCount = 5;
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => Math.round((maxVal / yTickCount) * i));
  const toY = (v) => PAD_T + chartH - (v / maxVal) * chartH;

  return (
    // pt-[72px] = topbar(56px) + small gap.
    <main className="w-full md:w-[calc(100%-260px)] md:ml-[260px] h-screen overflow-y-auto overflow-x-hidden pt-[72px] px-4 md:px-6 pb-6 flex flex-col gap-6 relative z-10 custom-scrollbar">

      {/* ── Title Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4">
        <div>
          <h2 className="font-extrabold text-4xl md:text-5xl text-[#86c232] tracking-tight leading-none">
            Operational Pulse
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Real-time pulse of your digital presence.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="bg-[#1c2227] border border-white/10 text-white rounded-lg px-4 py-2 text-[13px] font-bold hover:bg-white/5 transition-colors whitespace-nowrap">
            Last 24 Hours
          </button>
          <button className="bg-[#1c2227] border border-white/10 text-gray-300 p-2 rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
          </button>
        </div>
      </div>

      {/* ── Top 3 Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Card 1: TOTAL QUERIES — from DB */}
        <div className="bg-[#1c2227] rounded-2xl p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between min-h-[150px] shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TOTAL QUERIES</p>
              <h3 className="text-4xl font-extrabold text-white mt-2 leading-none">
                {totalMessages.toLocaleString()}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#29351a] flex items-center justify-center text-[#86c232] flex-shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>forum</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs mt-3">
            <span className="material-symbols-outlined text-[#86c232]" style={{ fontSize: '15px' }}>trending_up</span>
            <span className="font-bold text-[#86c232]">Live</span>
            <span className="text-gray-500 ml-0.5">from database</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-8 opacity-20 pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
              <path d="M0,40 L0,30 Q25,10 50,25 T100,5 L100,40 Z" fill="#86c232" />
            </svg>
          </div>
        </div>

        {/* Card 2: RESPONSE RATE — from DB */}
        <div className="bg-[#9bd847] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[150px] shadow-lg shadow-[#9bd847]/20 text-[#0f1f00]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#1d3800]/70">RESPONSE RATE</p>
              <h3 className="text-4xl font-black text-[#0f1f00] mt-2 leading-none">
                {responseRate}%
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#76b025]/30 flex items-center justify-center text-[#0f1f00] flex-shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>autorenew</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f1f00] mt-3">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>verified</span>
            <span>Live</span>
            <span className="text-[#1d3800]/70 font-normal ml-0.5">from database</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-8 opacity-[0.12] pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
              <path d="M0,40 L0,20 Q40,35 70,15 T100,5 L100,40 Z" fill="#0f1f00" />
            </svg>
          </div>
        </div>

        {/* Card 3: LAST 24HR QUERIES — from DB */}
        <div className="bg-[#1c2227] rounded-2xl p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between min-h-[150px] shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">LAST 24HR QUERIES</p>
              <h3 className="text-4xl font-extrabold text-white mt-2 leading-none">
                {messagesLast24h.toLocaleString()}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#29351a] flex items-center justify-center text-[#86c232] flex-shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>history</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs mt-1">
            <span className="material-symbols-outlined text-[#86c232]" style={{ fontSize: '15px' }}>schedule</span>
            <span className="font-bold text-[#86c232]">Live</span>
            <span className="text-gray-500 ml-0.5">from database</span>
          </div>
          {/* Mini progress bars + donut ring */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 space-y-1.5">
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#86c232] rounded-full" style={{ width: `${totalMessages > 0 ? Math.min((messagesLast24h / totalMessages) * 100, 100) : 0}%` }}></div>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#86c232]/50 rounded-full" style={{ width: `${stats?.activeSessionsLast24h && stats?.totalConversations ? Math.min((stats.activeSessionsLast24h / stats.totalConversations) * 100, 100) : 0}%` }}></div>
              </div>
            </div>
            <div className="relative w-8 h-8 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path strokeWidth="4" stroke="rgba(255,255,255,0.1)" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path strokeWidth="4" strokeDasharray={`${totalMessages > 0 ? Math.round((messagesLast24h / totalMessages) * 100) : 0}, 100`} stroke="#86c232" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ── Platform Distribution + Latest Queries ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Platform Distribution (2 cols) — from DB */}
        <div className="lg:col-span-2 bg-[#1c2227] rounded-2xl p-6 border border-white/5 flex flex-col min-h-[360px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white text-lg">Platform Distribution</h3>
            <button className="text-gray-400 hover:text-white transition-colors">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>

          {/* Donut Chart — computed from DB data */}
          <div className="flex-1 flex flex-col items-center justify-center py-2">
            <div className="relative w-52 h-52">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#2a3138" strokeWidth="16" />
                {donutSegments.map((seg) => (
                  <circle
                    key={seg.platform}
                    cx="50" cy="50" r="38"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="16"
                    strokeDasharray={seg.dasharray}
                    strokeDashoffset={seg.dashoffset}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white leading-none">
                  {formatNumber(totalPlatformMessages)}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-wider">TOTAL</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-5">
              {donutSegments.map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }}></div>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Latest Queries (1 col) — from DB */}
        <div className="lg:col-span-1 bg-[#1c2227] rounded-2xl p-5 border border-white/5 flex flex-col min-h-[360px]">
          <h3 className="font-bold text-white text-lg mb-4">Latest Queries</h3>

          <div className="flex flex-col gap-3 flex-1">
            {latestQueries.length > 0 ? latestQueries.map((q) => {
              return (
                <div
                  key={q.id}
                  className="bg-[#232a30] p-3.5 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <PlatformAvatar platform={q.platform} size="sm" />
                      <span className="font-bold text-sm text-white leading-tight">{q.customer_name || 'Customer'}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap ml-2">
                      {getRelativeTime(q.last_message_at)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-1 italic mb-2 pl-0.5">
                    "{q.preview}"
                  </p>

                  <button
                    onClick={() => onReplyClick && onReplyClick(q.id, q.platform)}
                    className="w-full py-1.5 bg-[#86c232] text-[#102000] font-black text-[11px] uppercase tracking-wider rounded-lg hover:bg-[#97d838] transition-colors"
                  >
                    REPLY
                  </button>
                </div>
              );
            }) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                No queries yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Weekly Analytics Chart — from DB ── */}
      <div className="bg-[#1c2227] rounded-2xl p-6 border border-white/5 shadow-md relative overflow-hidden shrink-0 min-h-[430px]">
        {/* Chart Header + Stat Summary Badges */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              Weekly Analytics
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#86c232]/20 text-[#86c232] border border-[#86c232]/30 uppercase tracking-wider">
                Live Data
              </span>
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">
              Current week message volume, Monday through Sunday
            </p>
          </div>

          {/* Legend Badges with Weekly Totals */}
          <div className="flex flex-wrap items-center gap-3">
            {barPlatforms.map(({ key, color, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#232a30] border border-white/5 text-xs font-semibold text-gray-200"
              >
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: color }}></div>
                <span>{label}</span>
                <span className="text-white font-extrabold ml-0.5 opacity-90">
                  {weeklyTotals[key] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SVG Grouped Bar Chart — synced with DB backend */}
        <div className="w-full overflow-x-auto pb-2 mt-2">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full min-w-[760px] h-auto"
            role="img"
            aria-label="Message volume by platform from Monday through Sunday"
          >
            <defs>
              {/* SVG Gradients for each channel */}
              <linearGradient id="grad-whatsapp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a0df4c" />
                <stop offset="100%" stopColor="#6ca61e" />
              </linearGradient>
              <linearGradient id="grad-instagram" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4d8d" />
                <stop offset="100%" stopColor="#b81d52" />
              </linearGradient>
              <linearGradient id="grad-tiktok" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3df0ff" />
                <stop offset="100%" stopColor="#0099ab" />
              </linearGradient>
              <linearGradient id="grad-facebook" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b8efc" />
                <stop offset="100%" stopColor="#1254b8" />
              </linearGradient>
            </defs>

            {/* Y-axis dashed grid lines + labels */}
            {yTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD_L}
                  y1={toY(tick)}
                  x2={W - PAD_R}
                  y2={toY(tick)}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={PAD_L - 8}
                  y={toY(tick) + 4}
                  textAnchor="end"
                  fontSize="9"
                  fontWeight="600"
                  fill="rgba(255,255,255,0.45)"
                >
                  {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                </text>
              </g>
            ))}

            {/* Baseline grid line */}
            <line
              x1={PAD_L}
              y1={PAD_T + chartH}
              x2={W - PAD_R}
              y2={PAD_T + chartH}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
            />

            {/* Render 7 day groups of vertical bars */}
            {weekDates.map((dayStr, dayIdx) => {
              const dayData = weeklyAnalytics[dayStr] || {};
              const groupX = PAD_L + dayIdx * groupW + groupStartX;
              const dayName = days[dayIdx] || 'Day';

              return (
                <g key={dayStr} className="group cursor-pointer">
                  {/* Subtle column background highlight */}
                  <rect
                    x={PAD_L + dayIdx * groupW + 2}
                    y={PAD_T}
                    width={groupW - 4}
                    height={chartH}
                    fill="rgba(255,255,255,0.015)"
                    rx="6"
                  />

                  {/* Day X-axis label */}
                  <text
                    x={PAD_L + dayIdx * groupW + groupW / 2}
                    y={H - 12}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="rgba(255,255,255,0.6)"
                  >
                    {dayName}
                  </text>

                  {/* 4 Platform Vertical Bars */}
                  {barPlatforms.map(({ key, gradientId }, pIdx) => {
                    const val = dayData[key] || 0;
                    const barHeight = maxVal > 0 ? (val / maxVal) * chartH : 0;
                    const barX = groupX + pIdx * (barW + barGap);
                    const barY = PAD_T + chartH - barHeight;

                    return (
                      <g key={key}>
                        {/* Bar Body */}
                        <rect
                          x={barX}
                          y={barY}
                          width={barW}
                          height={Math.max(barHeight, 0)}
                          rx="3"
                          fill={`url(#${gradientId})`}
                        />
                        {/* Top cap highlight line for non-zero bars */}
                        {barHeight > 3 && (
                          <rect
                            x={barX}
                            y={barY}
                            width={barW}
                            height={2}
                            rx="1"
                            fill="#ffffff"
                            opacity="0.5"
                          />
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>

        {/* X-axis title label */}
        <p className="text-center text-[10px] text-gray-500 mt-2 tracking-wider font-semibold uppercase">
          Day of Week vs. Number of Messages
        </p>
      </div>

    </main>
  );
}

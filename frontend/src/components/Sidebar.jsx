import React from 'react';
import PlatformAvatar from './PlatformAvatar';

export default function Sidebar({
  activeTab,
  setActiveTab,
  unreadCounts = {},
}) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'grid_view', badge: null },
    { id: 'whatsapp', label: 'WhatsApp', badgeKey: 'whatsapp' },
    { id: 'instagram', label: 'Instagram', badgeKey: 'instagram' },
    { id: 'tiktok', label: 'TikTok', badgeKey: 'tiktok' },
    { id: 'facebook', label: 'Facebook', badgeKey: 'facebook' },
  ];

  return (
    <>
      <nav
        className="h-screen w-[260px] fixed left-0 top-0 bg-[#161a1d] border-r border-white/5 flex flex-col py-6 px-4 z-40 hidden md:flex transition-transform duration-300 transform -translate-x-full md:translate-x-0"
        id="mobile-sidebar"
      >
        {/* Header / Logo */}
        <div className="flex items-center gap-3 mb-8 px-2 mt-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary font-bold shadow-[0_0_15px_rgba(160,223,76,0.3)]">
            <span className="material-symbols-outlined text-2xl">hexagon</span>
          </div>
          <div>
            <h1 className="font-bold text-primary text-lg leading-tight tracking-tight">SocialSync Pro</h1>
            <p className="text-xs text-on-surface-variant font-medium">Premium Merchant</p>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const badgeValue = item.badgeKey
              ? unreadCounts[item.badgeKey] || null
              : null;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  const mobileSidebar = document.getElementById('mobile-sidebar');
                  if (mobileSidebar) mobileSidebar.classList.add('-translate-x-full');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group text-left ${
                  isActive
                    ? 'bg-[#243410] text-primary shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.id === 'overview' ? (
                  <span className={`material-symbols-outlined text-xl transition-transform group-hover:scale-110 ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    {item.icon}
                  </span>
                ) : (
                  <PlatformAvatar
                    platform={item.id}
                    size="xs"
                    className="border-0 shadow-none transition-transform group-hover:scale-110"
                  />
                )}
                <span className="flex-1">{item.label}</span>
                {badgeValue && (
                  <span className="px-2 py-0.5 rounded-full bg-primary text-[#102000] font-bold text-[10px] shadow-[0_0_8px_rgba(160,223,76,0.4)]">
                    {badgeValue}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Navigation */}
        <div className="space-y-1 border-t border-white/5 pt-4 mt-auto">
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
            href="#"
          >
            <span className="material-symbols-outlined text-xl text-gray-400 transition-transform group-hover:scale-110">
              settings
            </span>
            <span>Settings</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
            href="#"
          >
            <span className="material-symbols-outlined text-xl text-gray-400 transition-transform group-hover:scale-110">
              help_outline
            </span>
            <span>Support</span>
          </a>
        </div>
      </nav>
    </>
  );
}

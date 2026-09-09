import React from 'react';

export default function Topbar({ searchQuery, setSearchQuery, onMenuClick }) {
  return (
    <header className="fixed top-0 left-0 right-0 md:left-[260px] h-14 bg-[#101417]/95 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 md:px-6 z-30">
      {/* Left side: Mobile menu + Brand Logo + Search input */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          onClick={onMenuClick}
        >
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>

        {/* Brand Name */}
        <span className="font-extrabold text-[17px] text-white tracking-tight whitespace-nowrap">
          OmniQuery
        </span>

        {/* Search Bar — inline right after brand */}
        <div className="relative hidden sm:flex items-center w-52 md:w-72 group">
          <span className="material-symbols-outlined absolute left-3 text-gray-400 text-base group-focus-within:text-[#86c232] transition-colors select-none" style={{ fontSize: '17px' }}>
            search
          </span>
          <input
            className="w-full bg-[#1c2227] border border-white/8 rounded-full py-1.5 pl-9 pr-4 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-[#86c232]/60 focus:border-transparent transition-all placeholder:text-gray-500"
            placeholder="Search queries..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right side: Notifications + User Profile */}
      <div className="flex items-center gap-1.5">
        <button className="p-2 rounded-full text-gray-400 hover:text-[#86c232] hover:bg-white/5 transition-colors relative group" title="Notifications">
          <span className="material-symbols-outlined transition-transform group-hover:scale-110" style={{ fontSize: '20px' }}>
            notifications
          </span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#86c232] rounded-full shadow-[0_0_6px_rgba(134,194,50,0.9)]"></span>
        </button>
        <button className="p-2 rounded-full text-gray-400 hover:text-[#86c232] hover:bg-white/5 transition-colors group" title="Profile">
          <span className="material-symbols-outlined transition-transform group-hover:scale-110" style={{ fontSize: '20px' }}>
            account_circle
          </span>
        </button>
      </div>
    </header>
  );
}

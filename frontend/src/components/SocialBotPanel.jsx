import React, { useEffect } from 'react';

export default function SocialBotPanel({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <aside
      id="social-bot-panel"
      className={`fixed bottom-24 left-4 right-4 z-40 flex h-[480px] max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#171d21] shadow-[0_24px_80px_rgba(0,0,0,0.55)] transition-all duration-200 ease-out sm:bottom-6 sm:left-auto sm:right-24 sm:w-[360px] ${
        isOpen
          ? 'visible translate-y-0 scale-100 opacity-100'
          : 'invisible pointer-events-none translate-y-4 scale-[0.96] opacity-0'
      }`}
      role="dialog"
      aria-hidden={!isOpen}
      aria-labelledby="social-bot-title"
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#86c232]/15 text-[#86c232]">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>smart_toy</span>
          </div>
          <h2 id="social-bot-title" className="text-base font-bold text-white">Social Bot</h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          tabIndex={isOpen ? 0 : -1}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Close Social Bot"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '21px' }}>close</span>
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="text-lg font-bold text-gray-200">Social Bot will live soon!!</p>
      </div>
    </aside>
  );
}

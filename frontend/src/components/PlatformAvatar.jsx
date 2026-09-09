import React from 'react';

const platformStyles = {
  whatsapp: {
    label: 'WhatsApp',
    background: '#25D366',
  },
  instagram: {
    label: 'Instagram',
    background: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 55%, #FCAF45 100%)',
  },
  facebook: {
    label: 'Facebook Messenger',
    background: '#1877F2',
  },
  tiktok: {
    label: 'TikTok',
    background: '#050505',
  },
};

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

function PlatformIcon({ platform }) {
  if (platform === 'whatsapp') {
    return (
      <svg viewBox="0 0 24 24" className="w-[64%] h-[64%]" aria-hidden="true">
        <path
          d="M12 4.25a7.25 7.25 0 0 0-6.17 11.06L5 19l3.83-.8A7.25 7.25 0 1 0 12 4.25Z"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M9.1 8.2c.2-.35.42-.36.7-.36h.35c.12 0 .27.04.34.27l.72 1.75c.08.2.05.36-.07.52l-.53.65c-.11.13-.1.25-.03.37.49.84 1.18 1.53 2.02 2.02.13.07.25.08.38-.03l.67-.8c.15-.18.33-.2.52-.12l1.63.77c.22.1.29.25.27.43-.08.72-.45 1.37-1.02 1.8-.43.31-.98.47-1.5.35-1.2-.27-2.45-.92-3.48-1.95-1.03-1.04-1.7-2.29-1.96-3.49-.12-.55.05-1.13.38-1.58l.61-.61Z"
          fill="white"
        />
      </svg>
    );
  }

  if (platform === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" className="w-[62%] h-[62%]" aria-hidden="true">
        <rect x="4.5" y="4.5" width="15" height="15" rx="4.5" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="12" cy="12" r="3.5" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="17.2" cy="6.9" r="1.1" fill="white" />
      </svg>
    );
  }

  if (platform === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" className="w-[58%] h-[58%]" aria-hidden="true">
        <path d="M13.8 20v-7h2.5l.4-3h-2.9V8.1c0-.87.25-1.46 1.5-1.46H17V4.02A22 22 0 0 0 14.7 4C12.4 4 10.8 5.4 10.8 8v2H8.2v3h2.6v7h3Z" fill="white" />
      </svg>
    );
  }

  if (platform === 'tiktok') {
    return (
      <svg viewBox="0 0 24 24" className="w-[64%] h-[64%]" aria-hidden="true">
        <path d="M14 5v9.1a3.7 3.7 0 1 1-3.2-3.67v2.65a1.25 1.25 0 1 0 .7 1.12V5H14Z" fill="#25F4EE" transform="translate(-.55 .25)" />
        <path d="M14 4.5c.28 2.15 1.55 3.43 3.6 3.68v2.55A6.05 6.05 0 0 1 14 9.55v4.55a3.7 3.7 0 1 1-3.2-3.67v2.65a1.25 1.25 0 1 0 .7 1.12V4.5H14Z" fill="#FE2C55" transform="translate(.55 -.15)" />
        <path d="M14 4.75c.3 1.85 1.33 2.9 3.35 3.2v1.62A5.65 5.65 0 0 1 14 8.45v5.65a3.7 3.7 0 1 1-3.2-3.67v2.65a1.25 1.25 0 1 0 .7 1.12V4.75H14Z" fill="white" />
      </svg>
    );
  }

  return (
    <span className="material-symbols-outlined text-white" aria-hidden="true">
      person
    </span>
  );
}

export default function PlatformAvatar({
  platform,
  size = 'md',
  className = '',
}) {
  const config = platformStyles[platform] || {
    label: 'Customer',
    background: '#4B5563',
  };

  return (
    <div
      className={`${sizeClasses[size] || sizeClasses.md} rounded-full border border-white/20 shadow-md flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{ background: config.background }}
      role="img"
      aria-label={`${config.label} profile`}
      title={config.label}
    >
      <PlatformIcon platform={platform} />
    </div>
  );
}

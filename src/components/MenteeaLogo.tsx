import React from "react";

interface MenteeaIconProps {
  size?: number;
  className?: string;
}

export function MenteeaIcon({ size = 28, className = "" }: MenteeaIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        {/* Precise premium Cyan -> Indigo -> Purple gradient */}
        <linearGradient id="menteea-brand-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06b6d4" />    {/* Cyan */}
          <stop offset="50%" stopColor="#6366f1" />   {/* Indigo */}
          <stop offset="100%" stopColor="#a855f7" />  {/* Purple */}
        </linearGradient>
        
        {/* Soft shadow layer to give the book flaps dimensional separation */}
        <linearGradient id="menteea-depth-shade" x1="16" y1="6" x2="16" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
        </linearGradient>

        {/* Ambient neon back-glow (perfect for dark mode and high contrast) */}
        <filter id="menteea-glow-effect" x="-15%" y="-15%" width="130%" height="130%" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#menteea-glow-effect)">
        {/* Left Column (representing a standing book binder / Left "M" pillar) */}
        <path
          d="M6 26C4.9 26 4 25.1 4 24V8C4 6.9 4.9 6 6 6H12V22L6 26Z"
          fill="url(#menteea-brand-grad)"
        />
        {/* Right Column (representing a standing book binder / Right "M" pillar) */}
        <path
          d="M26 26C27.1 26 28 25.1 28 24V8C28 6.9 27.1 6 26 6H20V22L26 26Z"
          fill="url(#menteea-brand-grad)"
        />
        {/* Center Fold Ribbon (forming the middle valley of the "M" with overlapping folded leaves look) */}
        <path
          d="M10 6L16 17.5L22 6H17.5L16 10L14.5 6H10Z"
          fill="url(#menteea-brand-grad)"
        />
        
        {/* Sharp highlights representing precise light reflections on the book spines */}
        <path
          d="M12 6V22"
          stroke="#ffffff"
          strokeOpacity="0.3"
          strokeWidth="1.2"
        />
        <path
          d="M20 6V22"
          stroke="#ffffff"
          strokeOpacity="0.2"
          strokeWidth="1.2"
        />

        {/* Dimensional shadow fold in the center */}
        <path
          d="M12 22L16 17.5L20 22V26L16 20.5L12 26V22Z"
          fill="url(#menteea-depth-shade)"
          style={{ mixBlendMode: "multiply" }}
        />
      </g>
    </svg>
  );
}

interface MenteeaLogoProps {
  showVersion?: boolean;
  size?: number;
  className?: string;
  darkBg?: boolean;
}

export function MenteeaLogo({ showVersion = true, size = 26, className = "", darkBg = false }: MenteeaLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* 3D Geometric Folded-Book Icon */}
      <MenteeaIcon size={size} />

      {/* Modern Premium Wordmark */}
      <div className="flex items-center gap-1.5 leading-none">
        <span className={`font-sans font-bold text-lg tracking-tight ${darkBg ? "text-white dark:text-slate-100" : "text-text-primary dark:text-slate-100"}`}>
          Menteea
        </span>
        
        {/* Subtle, High-Quality Version Badge */}
        {showVersion && (
          <span className={`text-[9px] font-mono font-semibold tracking-wide border px-1.5 py-0.5 rounded ml-1 ${
            darkBg 
              ? "bg-slate-900/40 border-slate-800 text-slate-500" 
              : "bg-bg-secondary border-border-custom text-text-muted dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-500"
          }`}>
            v1.0
          </span>
        )}
      </div>
    </div>
  );
}

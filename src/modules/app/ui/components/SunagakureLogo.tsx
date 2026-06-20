import React from 'react'

interface SunagakureLogoProps {
  active?: boolean;
  className?: string;
  width?: string | number;
  height?: string | number;
}

export const SunagakureLogo = ({ active = true, className, width = 30, height = 30 }: SunagakureLogoProps) => (
  <svg 
    viewBox="0 0 680 680" 
    width={width} 
    height={height} 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <filter id="sl_glow_hard" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="3" result="b1"/>
        <feGaussianBlur stdDeviation="8" result="b2"/>
        <feGaussianBlur stdDeviation="16" result="b3"/>
        <feMerge>
          <feMergeNode in="b3"/>
          <feMergeNode in="b2"/>
          <feMergeNode in="b1"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="sl_glow_soft" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="22"/>
      </filter>
    </defs>

    <g filter="url(#sl_glow_soft)" opacity={active ? 0.75 : 0.4}>
      <rect x="210" y="115" width="260" height="95" rx="14" fill="none" stroke="#ff5500" strokeWidth="28"/>
      <line x1="232" y1="163" x2="448" y2="163" stroke="#ff5500" strokeWidth="28"/>
      <path fill="none" stroke="#ff5500" strokeWidth="28" strokeLinejoin="round"
        d="M210,228 C210,228 170,290 185,348 C200,406 165,456 185,532 Q185,546 200,546 L480,546 Q495,546 495,532 C515,456 480,406 495,348 C510,290 470,228 470,228 Z"/>
    </g>

    <g filter="url(#sl_glow_hard)" opacity={active ? 1 : 0.6}>
      <rect x="210" y="115" width="260" height="95" rx="14" fill="none" stroke="#ff6600" strokeWidth="18"/>
      <line x1="232" y1="163" x2="448" y2="163" stroke="#ff6600" strokeWidth="18"/>
      <path fill="none" stroke="#ff6600" strokeWidth="18" strokeLinejoin="round"
        d="M210,228 C210,228 170,290 185,348 C200,406 165,456 185,532 Q185,546 200,546 L480,546 Q495,546 495,532 C515,456 480,406 495,348 C510,290 470,228 470,228 Z"/>
    </g>

    <g filter="url(#sl_glow_hard)">
      <rect x="210" y="115" width="260" height="95" rx="14" fill="none" stroke="#ffdd66" strokeWidth="9"/>
      <line x1="232" y1="163" x2="448" y2="163" stroke="#ffdd66" strokeWidth="9"/>
      <path fill="none" stroke="#ffdd66" strokeWidth="9" strokeLinejoin="round"
        d="M210,228 C210,228 170,290 185,348 C200,406 165,456 185,532 Q185,546 200,546 L480,546 Q495,546 495,532 C515,456 480,406 495,348 C510,290 470,228 470,228 Z"/>
    </g>
  </svg>
)

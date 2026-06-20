import { useState, useEffect } from 'react'

export function SplashScreen() {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    // We increment pct gradually, when it hits 100 we close the splash
    const timer = setInterval(() => {
      setPct(p => {
        const next = p + Math.random() * 4 + 0.6
        if (next >= 100) {
          clearInterval(timer)
          if (window.ipcRenderer) {
            window.ipcRenderer.send('splash-finished')
          }
          return 100
        }
        return next
      })
    }, 90)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="h-screen w-screen bg-transparent text-slate-200 flex flex-col items-center justify-center font-sans overflow-hidden select-none" style={{ WebkitAppRegion: 'drag' } as any}>
      <style>{`
        @keyframes draw {
          from { stroke-dashoffset: 1; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes flicker {
          0%,100% { opacity: 1; }
          10% { opacity: 0.3; }
          14% { opacity: 1; }
          22% { opacity: 0.5; }
          26% { opacity: 1; }
          40% { opacity: 0.8; }
          44% { opacity: 1; }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.72; }
        }
        @keyframes dots {
          0%,20% { opacity: 0; }
          50%,100% { opacity: 1; }
        }
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }
      `}</style>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, background: 'transparent', fontFamily: "'Anthropic Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: 'hidden' }}>
        <svg width="440" height="440" viewBox="0 0 680 680" role="img" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 2px rgba(255,90,0,0.2))' }}>
          <defs>
            <filter id="ld_soft" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="22"></feGaussianBlur>
            </filter>
            <filter id="ld_hard" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="b1"></feGaussianBlur>
              <feGaussianBlur stdDeviation="8" result="b2"></feGaussianBlur>
              <feGaussianBlur stdDeviation="16" result="b3"></feGaussianBlur>
              <feMerge>
                <feMergeNode in="b3"></feMergeNode>
                <feMergeNode in="b2"></feMergeNode>
                <feMergeNode in="b1"></feMergeNode>
                <feMergeNode in="SourceGraphic"></feMergeNode>
              </feMerge>
            </filter>
          </defs>

          <g style={{ animation: 'flicker 0.7s ease-in-out 2.3s 1, pulse 2.6s ease-in-out 3s infinite' }}>
            <g filter="url(#ld_soft)" opacity="0.55">
              <rect x="210" y="115" width="260" height="95" rx={14} pathLength="1" fill="none" stroke="#ff5500" strokeWidth="28" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw 1s ease-out 0.1s forwards' }}></rect>
              <line x1="232" y1="163" x2="448" y2="163" pathLength="1" stroke="#ff5500" strokeWidth="28" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw 0.7s ease-out 0.7s forwards' }}></line>
              <path fill="none" stroke="#ff5500" strokeWidth="28" strokeLinejoin="round" pathLength="1" d="M210,228 C210,228 170,290 185,348 C200,406 165,456 185,532 Q185,546 200,546 L480,546 Q495,546 495,532 C515,456 480,406 495,348 C510,290 470,228 470,228 Z" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw 1.3s ease-out 1s forwards' }}></path>
            </g>
            <g filter="url(#ld_hard)" opacity="0.8">
              <rect x="210" y="115" width="260" height="95" rx={14} pathLength="1" fill="none" stroke="#ff6600" strokeWidth="18" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw 1s ease-out 0.1s forwards' }}></rect>
              <line x1="232" y1="163" x2="448" y2="163" pathLength="1" stroke="#ff6600" strokeWidth="18" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw 0.7s ease-out 0.7s forwards' }}></line>
              <path fill="none" stroke="#ff6600" strokeWidth="18" strokeLinejoin="round" pathLength="1" d="M210,228 C210,228 170,290 185,348 C200,406 165,456 185,532 Q185,546 200,546 L480,546 Q495,546 495,532 C515,456 480,406 495,348 C510,290 470,228 470,228 Z" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw 1.3s ease-out 1s forwards' }}></path>
            </g>
            <g filter="url(#ld_hard)">
              <rect x="210" y="115" width="260" height="95" rx={14} pathLength="1" fill="none" stroke="#ffdd66" strokeWidth="9" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw 1s ease-out 0.1s forwards' }}></rect>
              <line x1="232" y1="163" x2="448" y2="163" pathLength="1" stroke="#ffdd66" strokeWidth="9" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw 0.7s ease-out 0.7s forwards' }}></line>
              <path fill="none" stroke="#ffdd66" strokeWidth="9" strokeLinejoin="round" pathLength="1" d="M210,228 C210,228 170,290 185,348 C200,406 165,456 185,532 Q185,546 200,546 L480,546 Q495,546 495,532 C515,456 480,406 495,348 C510,290 470,228 470,228 Z" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw 1.3s ease-out 1s forwards' }}></path>
            </g>
          </g>
        </svg>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '-28px', letterSpacing: '0.42em', fontSize: '13px', fontWeight: 600, color: '#ffb066', textShadow: '0 0 12px rgba(255,90,0,0.55)' }}>
          <span>CARREGANDO</span>
          <span style={{ animation: 'dots 1.4s steps(1) 0s infinite' }}>.</span>
          <span style={{ animation: 'dots 1.4s steps(1) 0.2s infinite' }}>.</span>
          <span style={{ animation: 'dots 1.4s steps(1) 0.4s infinite' }}>.</span>
        </div>

        <div style={{ position: 'relative', width: '300px', height: '3px', marginTop: '26px', borderRadius: '3px', background: 'rgba(255,120,40,0.12)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, borderRadius: '3px', background: 'linear-gradient(90deg,#ff5500,#ffcf66)', boxShadow: '0 0 10px rgba(255,90,0,0.8),0 0 22px rgba(255,90,0,0.5)', transition: 'width 0.18s linear' }}></div>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '60px', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(255,240,200,0.85),transparent)', animation: 'scan 1.6s linear infinite' }}></div>
        </div>

        <div style={{ marginTop: '14px', fontVariantNumeric: 'tabular-nums', fontSize: '11px', letterSpacing: '0.2em', color: '#7a5a3a' }}>
          {Math.floor(pct)}%
        </div>
      </div>
    </div>
  )
}

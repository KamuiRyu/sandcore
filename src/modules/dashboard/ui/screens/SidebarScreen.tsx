import React from 'react'
import { Map, LogOut, Users, Settings, BarChart2, Hammer } from 'lucide-react'

type TabType = 'groups' | 'map' | 'stats' | 'details' | 'settings' | 'crafting'

interface SidebarScreenProps {
  activeTab: string | null
  onLogout: () => void
}

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

const SunagakureLogo = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 680 680" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
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

export const SidebarScreen = ({ activeTab, onLogout }: SidebarScreenProps) => {
  const handleTabClick = (tabId: TabType) => {
    const nextTab = activeTab === tabId ? null : tabId
    window.ipcRenderer?.send('toggle-panel-window', nextTab)
  }

  const handleLogout = () => {
    localStorage.removeItem('shinobi-map-notification-settings')
    localStorage.removeItem('shinobi-map-completed-pins')
    onLogout()
  }

  const menuItems = [
    { id: 'groups',   icon: Users,     label: 'Grupos'       },
    { id: 'map',      icon: Map,       label: 'Mapa'         },
    { id: 'stats',    icon: BarChart2, label: 'Estatísticas' },
    { id: 'crafting', icon: Hammer,    label: 'Crafting'     },
  ] as const

  return (
    <div
      className="w-full h-full select-none"
      style={{
        background: 'linear-gradient(180deg, #161008 0%, #0f0b04 100%)',
        border: '1px solid rgba(255,221,102,0.4)',
        borderRadius: 8,
        WebkitAppRegion: 'drag',
        overflow: 'hidden',
        position: 'relative',
      } as React.CSSProperties}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundImage: NOISE_SVG, pointerEvents: 'none', zIndex: 0 }} />

      <div className="relative flex flex-col items-center h-full" style={{ zIndex: 1 }}>

        {/* Logo */}
        <div className="w-full flex items-center justify-center" style={{ padding: '10px 0 8px', flexShrink: 0 }}>
          <div
            className="flex items-center justify-center cursor-pointer"
            style={{ width: 38, height: 38, WebkitAppRegion: 'no-drag' } as any}
            onClick={() => handleTabClick('details')}
            title="Detalhes"
          >
            <SunagakureLogo active={activeTab === 'details'} />
          </div>
        </div>

        {/* Divider logo → nav */}
        <div style={{ width: 28, height: 1, background: 'linear-gradient(90deg, transparent, #4a2f0a, transparent)', margin: '4px 0', flexShrink: 0 }} />

        {/* Main nav */}
        <div className="flex flex-col items-center w-full" style={{ padding: '10px 0', gap: 2, flexShrink: 0 }}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <NavItem key={item.id} isActive={isActive} label={item.label} onClick={() => handleTabClick(item.id)}>
                <Icon size={18} />
              </NavItem>
            )
          })}
        </div>

        {/* Bottom nav */}
        <div className="flex flex-col items-center w-full" style={{ marginTop: 'auto', padding: '10px 0', gap: 2 }}>
          <div style={{ width: 28, height: 1, background: 'linear-gradient(90deg, transparent, #4a2f0a, transparent)', margin: '0 0 6px', flexShrink: 0 }} />
          <NavItem isActive={activeTab === 'settings'} label="Configurações" onClick={() => handleTabClick('settings')}>
            <Settings size={18} />
          </NavItem>
          <NavItem isActive={false} label="Sair" isExit onClick={handleLogout}>
            <LogOut size={18} />
          </NavItem>
        </div>

      </div>
    </div>
  )
}

/* ── NavItem ──────────────────────────────────────────── */
interface NavItemProps {
  isActive: boolean
  isExit?: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}

const NavItem = ({ isActive, isExit = false, label, onClick, children }: NavItemProps) => {
  const baseColor   = isExit ? '#8b3a2a'            : '#4a3a1a'
  const hoverBg     = isExit ? 'rgba(139,58,42,0.2)' : 'rgba(74,47,10,0.4)'
  const hoverBorder = isExit ? 'rgba(139,58,42,0.4)' : 'rgba(200,134,10,0.2)'
  const hoverColor  = isExit ? '#e07060'             : '#d4a85a'

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        title={label}
        style={{
          width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 3, cursor: 'pointer', position: 'relative',
          border: isActive ? '1px solid #4a2f0a' : '1px solid transparent',
          background: isActive ? 'rgba(74,47,10,0.5)' : 'transparent',
          color: isActive ? '#ffdd66' : baseColor,
          transition: 'all .2s',
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}
        onMouseEnter={e => {
          if (!isActive) {
            const el = e.currentTarget
            el.style.background = hoverBg
            el.style.borderColor = hoverBorder
            el.style.color = hoverColor
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            const el = e.currentTarget
            el.style.background = 'transparent'
            el.style.borderColor = 'transparent'
            el.style.color = baseColor
          }
        }}
      >
        {isActive && (
          <div style={{
            position: 'absolute',
            left: -1, top: '20%', bottom: '20%', width: 2,
            background: 'linear-gradient(180deg, transparent, #ff6600, transparent)',
            borderRadius: '0 1px 1px 0',
          }} />
        )}
        {children}
      </button>
    </div>
  )
}

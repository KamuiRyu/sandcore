import React from 'react'
import { Map, LogOut, Users, Settings, BarChart2, Hammer } from 'lucide-react'

type TabType = 'groups' | 'map' | 'stats' | 'details' | 'settings' | 'crafting'

interface SidebarScreenProps {
  activeTab: string | null
  onLogout: () => void
}

const NOISE_SVG = `url("./images/noise.svg")`

import { SunagakureLogo } from '../../../app/ui/components/SunagakureLogo'

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
      <div style={{ position: 'absolute', inset: 0, backgroundImage: NOISE_SVG, pointerEvents: 'none', zIndex: 0, opacity: 0.04 }} />

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

import React from 'react'
import { Map, LogOut, Users, Settings, BarChart2, Hammer, Scroll, Shield, Award } from 'lucide-react'
import { pb } from '../../../../lib/pocketbase'

type TabType = 'groups' | 'map' | 'stats' | 'details' | 'settings' | 'crafting' | 'missions' | 'my-missions' | 'ninja-card' | 'admin'

interface SidebarScreenProps {
  activeTab: string | null
  onLogout: () => void
}

const NOISE_SVG = `url("./images/noise.svg")`

import { SunagakureLogo } from '../../../app/ui/components/SunagakureLogo'
import { appStorage } from '../../../../lib/storage';

export const SidebarScreen = ({ activeTab, onLogout }: SidebarScreenProps) => {
  const user = pb.authStore.model
  const role = user?.role || 'ninja'
  const isAdmin = role === 'admin'
  const isManager = role === 'manager' || role === 'admin'

  const handleTabClick = (tabId: TabType) => {
    const nextTab = activeTab === tabId ? null : tabId
    window.ipcRenderer?.send('toggle-panel-window', nextTab)
  }

  const handleLogout = () => {
    appStorage.removeItem('shinobi-map-notification-settings')
    appStorage.removeItem('shinobi-map-completed-pins')
    onLogout()
  }

  const mainMenuItems = [
    { id: 'map', icon: Map, label: 'Mapa' },
    { id: 'missions', icon: Scroll, label: 'Missões' },
    { id: 'my-missions', icon: Award, label: 'Minhas Missões' },
    { id: 'ninja-card', icon: Shield, label: 'Carteirinha' },
    { id: 'groups', icon: Users, label: 'Grupos' },
    { id: 'stats', icon: BarChart2, label: 'Estatísticas' },
    { id: 'crafting', icon: Hammer, label: 'Crafting' },
  ] as const

  const adminItems = [
    ...(isAdmin ? [{ id: 'admin' as const, icon: Settings, label: 'Admin' }] : []),
  ]

  return (
    <div
      className="w-full h-full select-none"
      style={{
        background: 'linear-gradient(180deg, #0e0b05 0%, #090704 100%)',
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

        {/* Divider */}
        <div style={{ width: 28, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,134,10,0.4), transparent)', margin: '4px 0', flexShrink: 0 }} />

        {/* Main nav */}
        <div className="flex flex-col items-center w-full overflow-y-auto flex-1 py-2" style={{ gap: 2 }}>
          {mainMenuItems.map((item) => {
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
        <div className="flex flex-col items-center w-full" style={{ padding: '10px 0', gap: 2 }}>
          <div style={{ width: 28, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,134,10,0.4), transparent)', margin: '0 0 6px', flexShrink: 0 }} />
          {adminItems.map(item => {
            const Icon = item.icon
            return (
              <NavItem key={item.id} isActive={activeTab === item.id} label={item.label} onClick={() => handleTabClick(item.id)}>
                <Icon size={18} />
              </NavItem>
            )
          })}
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
  const baseColor   = isExit ? '#7a3020'             : '#6a5028'
  const hoverBg     = isExit ? 'rgba(120,48,32,0.2)' : 'rgba(74,47,10,0.35)'
  const hoverBorder = isExit ? 'rgba(180,80,50,0.4)' : 'rgba(200,134,10,0.3)'
  const hoverColor  = isExit ? '#e07060'             : '#c8a040'

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        title={label}
        style={{
          width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 3, cursor: 'pointer', position: 'relative',
          border: isActive ? '1px solid rgba(200,134,10,0.35)' : '1px solid transparent',
          background: isActive ? 'rgba(74,47,10,0.4)' : 'transparent',
          color: isActive ? '#e8b840' : baseColor,
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

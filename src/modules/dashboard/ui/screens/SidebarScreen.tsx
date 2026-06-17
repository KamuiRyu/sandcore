import { Map, LogOut, Users, Settings } from 'lucide-react'

type TabType = 'groups' | 'map' | 'settings'

interface SidebarScreenProps {
  activeTab: string | null
  sidebarOpacity?: number
  onLogout: () => void
}

export const SidebarScreen = ({ activeTab, sidebarOpacity = 95, onLogout }: SidebarScreenProps) => {
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
    { id: 'groups', icon: Users, label: 'Grupos' },
    { id: 'map', icon: Map, label: 'Mapa' },
    { id: 'settings', icon: Settings, label: 'Configurações' },
  ] as const

  return (
    <div className="w-full h-full bg-transparent p-0.5 select-none font-sans overflow-hidden">
      
      {/* Floating vertical sidebar column */}
      <div 
        className="w-full h-full flex flex-col justify-between items-center py-2 bg-[#0B0E12]/95 border border-[#1E2732]/60 rounded-2xl relative z-10"
        style={{ 
          WebkitAppRegion: 'drag',
          opacity: sidebarOpacity / 100
        } as any}
      >
        {/* Top Controls: Logo & Navigation */}
        <div className="flex flex-col items-center w-full">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            
            return (
              <div key={item.id} className="flex flex-col items-center w-full">
                {index > 0 && <div className="h-[1px] w-6 bg-slate-800/50 my-0.5"></div>}
                
                <button
                  onClick={() => handleTabClick(item.id)}
                  style={{ WebkitAppRegion: 'no-drag' } as any}
                  className={`relative w-9.5 h-9.5 rounded-lg flex items-center justify-center transition-all duration-300 group cursor-pointer
                    ${isActive 
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-[0_0_10px_rgba(3,166,150,0.25)]' 
                      : 'text-slate-400 hover:text-teal-400 hover:bg-white/5 border border-transparent'
                    }
                  `}
                  title={item.label}
                >
                  {isActive && (
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-1 h-3.5 rounded-r-md bg-teal-400" />
                  )}
                  
                  <Icon 
                    size={20} 
                    className="transition-all duration-300 group-hover:scale-110" 
                  />
                </button>
              </div>
            )
          })}
        </div>

        {/* Bottom Controls: Logout */}
        <div className="flex flex-col items-center w-full">
          <div className="h-[1px] w-6 bg-slate-800/50 my-0.5"></div>

          <button
            onClick={handleLogout}
            style={{ WebkitAppRegion: 'no-drag' } as any}
            className="relative w-9.5 h-9.5 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer group"
            title="Fazer Logout"
          >
            <LogOut size={18} className="transition-transform group-hover:-translate-x-0.5" />
          </button>

          {/* Bottom Teal Indicator Line */}
          <div className="w-3 h-0.5 bg-teal-500/50 rounded-full mt-1"></div>
        </div>
      </div>
    </div>
  )
}


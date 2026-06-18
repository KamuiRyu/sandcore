import { useState, useEffect } from 'react'
import { Search, HelpCircle } from 'lucide-react'
import { GroupsScreen } from '../../../groups/ui/screens/GroupsScreen'
import { MapScreen } from '../../../map/ui/screens/MapScreen'
import { SettingsScreen } from '../../../settings/ui/screens/SettingsScreen'
import { StatsScreen } from './StatsScreen'
import { AppDetailsScreen } from './AppDetailsScreen'

interface ContentPanelScreenProps {
  activeTab: string | null
  lastActiveTab: string
}

export const ContentPanelScreen = ({ activeTab, lastActiveTab }: ContentPanelScreenProps) => {
  const [isClosing, setIsClosing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (activeTab) {
      setIsClosing(false)
      setIsMounted(true)
    } else {
      setIsClosing(true)
    }
  }, [activeTab])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      window.ipcRenderer?.send('close-panel-window')
    }, 300)
  }

  const isMapTab = lastActiveTab === 'map'

  return (
    <div 
      key={lastActiveTab} 
      className={`flex flex-col relative bg-[#080A0C] text-slate-200 font-sans overflow-hidden rounded-xl border border-[#1A222C] transition-[opacity,transform,filter] duration-300 ease-out 
        ${isMounted && !isClosing ? 'opacity-100 scale-100 blur-none' : 'opacity-0 scale-95 blur-sm'} 
        ${isMapTab ? 'w-[1200px] h-[800px]' : 'w-[450px] h-[550px]'}
      `}
    >
      {/* Dynamic Header */}
      {!isMapTab ? (
        <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-between pl-4 pr-0 select-none z-50 bg-[#0B0E12]" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="flex items-center gap-2">
            <img 
              src="./images/logo_mini.webp" 
              alt="Logo" 
              className="w-3.5 h-3.5 object-contain" 
              draggable={false}
            />
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              Shinobi Map • {
                activeTab === 'groups' ? 'Grupos' : 
                activeTab === 'stats' ? 'Estatísticas' :
                activeTab === 'details' ? 'Logo' : 'Configurações'
              }
            </span>
          </div>
          <div className="flex items-center h-full">
            <button 
              onClick={handleClose} 
              className="h-full w-11 hover:bg-white/5 transition flex items-center justify-center cursor-pointer text-slate-400 hover:text-white"
              style={{ WebkitAppRegion: 'no-drag' } as any}
              title="Minimizar"
            >
              <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <line x1="1" y1="5" x2="9" y2="5" />
              </svg>
            </button>
            <button 
              onClick={handleClose} 
              className="h-full w-11 hover:bg-red-600 hover:text-white transition flex items-center justify-center text-slate-400 cursor-pointer"
              style={{ WebkitAppRegion: 'no-drag' } as any}
              title="Fechar"
            >
              <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M1 1L9 9M9 1L1 9" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="h-14 bg-[#080c10] border-b border-[#131b24] px-4 flex items-center justify-between gap-4 select-none z-50 flex-none" style={{ WebkitAppRegion: 'drag' } as any}>
          {/* Logo */}
          <div className="flex items-center gap-2 flex-none">
            <img 
              src="./images/logo_mini.webp" 
              alt="Logo" 
              className="w-5 h-5 object-contain" 
              draggable={false}
            />
            <span className="font-bold text-sm tracking-widest text-slate-200">SHINOBI MAP</span>
          </div>

          {/* Search, Help */}
          <div className="flex-1 max-w-sm flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="flex-1 relative flex items-center">
              <span className="absolute left-3 flex items-center pointer-events-none text-slate-500">
                <Search size={14} />
              </span>
              <input 
                type="text" 
                placeholder="Buscar recursos no mapa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#11161D]/65 border border-[#222B37] rounded-lg py-1.5 pl-9 pr-9 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-colors backdrop-blur-sm"
              />
              <button 
                className="absolute right-2.5 text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center p-0.5 rounded-full hover:bg-white/5 cursor-pointer" 
                title="Ajuda"
              >
                <HelpCircle size={14} />
              </button>
            </div>
          </div>

          {/* Window controls */}
          <div className="flex items-center h-full gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-map-settings'))}
              className="w-8 h-8 rounded-lg hover:bg-white/5 transition flex items-center justify-center cursor-pointer text-slate-400 hover:text-white"
              title="Configurações do Mapa"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
            <button 
              onClick={handleClose} 
              className="w-8 h-8 rounded-lg hover:bg-white/5 transition flex items-center justify-center cursor-pointer text-slate-400 hover:text-white"
              title="Minimizar"
            >
              <svg className="w-3 h-3" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <line x1="1" y1="5" x2="9" y2="5" />
              </svg>
            </button>
            <button 
              onClick={handleClose} 
              className="w-8 h-8 rounded-lg hover:bg-red-600 hover:text-white transition flex items-center justify-center text-slate-400 cursor-pointer"
              title="Fechar"
            >
              <svg className="w-3 h-3" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M1 1L9 9M9 1L1 9" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 overflow-hidden h-full flex flex-col ${!isMapTab ? 'pt-8' : ''}`}>
        {lastActiveTab === 'map' && <MapScreen searchQuery={searchQuery} />}
        {!isMapTab && (
          <div className="flex-1 bg-[#0A0D10] p-5 flex flex-col justify-between overflow-hidden animate-in fade-in duration-300">
            {lastActiveTab === 'groups' && <GroupsScreen />}
            {lastActiveTab === 'settings' && <SettingsScreen />}
            {lastActiveTab === 'stats' && <StatsScreen />}
            {lastActiveTab === 'details' && <AppDetailsScreen />}
          </div>
        )}
      </div>
    </div>
  )
}
export default ContentPanelScreen

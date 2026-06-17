import { useState, useEffect } from 'react'
import { Search, HelpCircle, Filter } from 'lucide-react'
import { GroupsScreen } from '../../../groups/ui/screens/GroupsScreen'
import { MapScreen } from '../../../map/ui/screens/MapScreen'
import { SettingsScreen } from '../../../settings/ui/screens/SettingsScreen'

interface ContentPanelScreenProps {
  activeTab: string
}

export const ContentPanelScreen = ({ activeTab }: ContentPanelScreenProps) => {
  const [isClosing, setIsClosing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const animTimer = setTimeout(() => {
      setIsMounted(true)
    }, 150)

    return () => {
      clearTimeout(animTimer)
    }
  }, [])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      window.ipcRenderer?.send('close-panel-window')
    }, 300)
  }

  const isMapTab = activeTab === 'map'

  return (
    <div 
      key={activeTab} 
      className={`flex flex-col relative bg-[#080A0C] text-slate-200 font-sans overflow-hidden rounded-xl border border-[#1A222C] transition-[opacity,transform,filter] duration-300 ease-out 
        ${isMounted && !isClosing ? 'opacity-100 scale-100 blur-none' : 'opacity-0 scale-95 blur-sm'} 
        ${isMapTab ? 'w-[1200px] h-[800px]' : 'w-[400px] h-[360px]'}
      `}
    >
      {/* Dynamic Header */}
      {!isMapTab ? (
        <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-between pl-4 pr-0 select-none z-50 bg-[#0B0E12]" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-teal-500 animate-[pulse_2s_infinite]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" />
            </svg>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              Shinobi Map • {activeTab === 'groups' ? 'Grupos' : 'Configurações'}
            </span>
          </div>
          <div className="flex items-center h-full">
            <button 
              onClick={() => window.ipcRenderer?.send('minimize-panel-window')} 
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
        <div className="h-14 bg-[#0B0E12] border-b border-[#1E2732] px-4 flex items-center justify-between gap-4 select-none z-50 flex-none" style={{ WebkitAppRegion: 'drag' } as any}>
          {/* Logo */}
          <div className="flex items-center gap-2 flex-none">
            <svg className="w-5.5 h-5.5 text-teal-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2Q12 12 2 12Q12 12 12 22Q12 12 22 12Q12 12 12 2ZM12 9.5A2.5 2.5 0 1 1 12 14.5A2.5 2.5 0 0 1 12 9.5Z" />
            </svg>
            <span className="font-bold text-sm tracking-widest text-slate-200">SHINOBI MAP</span>
          </div>

          {/* Search, Help, Filters */}
          <div className="flex-1 max-w-md flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="flex-1 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search size={14} />
              </span>
              <input 
                type="text" 
                placeholder="Buscar local, recurso, NPC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#11161D] border border-[#222B37] rounded-lg py-1.5 pl-9 pr-8 text-xs text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:outline-none transition-colors"
              />
            </div>
            
            {/* Help Button */}
            <button className="bg-[#11161D] hover:bg-[#1C232E] border border-[#222B37] rounded-lg p-2 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer" title="Ajuda">
              <HelpCircle size={14} />
            </button>

            {/* Filters toggle */}
            <button className="bg-[#11161D] hover:bg-[#1C232E] border border-[#222B37] rounded-lg py-1.5 px-3 flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer">
              <Filter size={13} />
              <span>Filtros</span>
            </button>
          </div>

          {/* Window controls */}
          <div className="flex items-center h-full gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button 
              onClick={() => window.ipcRenderer?.send('minimize-panel-window')} 
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
        {activeTab === 'map' && <MapScreen searchQuery={searchQuery} />}
        {!isMapTab && (
          <div className="flex-1 bg-[#0A0D10] p-5 flex flex-col justify-between overflow-hidden animate-in fade-in duration-300">
            {activeTab === 'groups' && <GroupsScreen />}
            {activeTab === 'settings' && <SettingsScreen />}
          </div>
        )}
      </div>
    </div>
  )
}
export default ContentPanelScreen

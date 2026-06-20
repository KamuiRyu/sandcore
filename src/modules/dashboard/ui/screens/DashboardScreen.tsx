import { useState, useEffect } from 'react'
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MapPin, Star, Compass, BarChart2, Settings, LogOut, ShieldAlert, CheckCircle, Volume2, UserCheck } from 'lucide-react'
import { useAuthViewModel } from '../../../authentication/ui/viewModels/useAuth.viewModel'

type TabType = 'shuriken' | 'pin' | 'star' | 'compass' | 'stats' | 'settings'

export const DashboardScreen = () => {
  const viewModel = useAuthViewModel()
  const [activeTab, setActiveTab] = useState<TabType>('shuriken')
  const [isClosing, setIsClosing] = useState(false)
  const [alwaysOnTop, setAlwaysOnTop] = useState(true)
  const [inGameNotifs, setInGameNotifs] = useState(true)
  const [volume, setVolume] = useState(80)

  // Fetch initial configuration from Electron main process
  useEffect(() => {
    if (window.ipcRenderer) {
      window.ipcRenderer.getConfig().then((config) => {
        if (config) {
          if ('alwaysOnTop' in config) setAlwaysOnTop(config.alwaysOnTop)
          if ('inGameNotifs' in config) setInGameNotifs(config.inGameNotifs)
          if ('volume' in config) setVolume(config.volume)
        }
      })
    }
  }, [])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      window.ipcRenderer?.send('window-control', 'close')
    }, 200)
  }

  const handleLogout = () => {
    viewModel.logout()
    localStorage.removeItem('shinobi-map-notification-settings')
    localStorage.removeItem('shinobi-map-completed-pins')
  }

  const toggleAlwaysOnTop = () => {
    const nextVal = !alwaysOnTop
    setAlwaysOnTop(nextVal)
    window.ipcRenderer?.send('set-config', { alwaysOnTop: nextVal })
  }

  const toggleInGameNotifs = () => {
    const nextVal = !inGameNotifs
    setInGameNotifs(nextVal)
    window.ipcRenderer?.send('set-config', { inGameNotifs: nextVal })
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value)
    setVolume(val)
    window.ipcRenderer?.send('set-config', { volume: val })
  }

  // Sidebar Menu Items
  const menuItems = [
    { id: 'pin', icon: MapPin, label: 'Marcadores' },
    { id: 'star', icon: Star, label: 'Favoritos' },
    { id: 'compass', icon: Compass, label: 'Explorar' },
    { id: 'stats', icon: BarChart2, label: 'Estatísticas' },
    { id: 'settings', icon: Settings, label: 'Configurações' },
  ] as const

  return (
    <div className={`h-screen w-screen flex flex-col relative bg-[#080A0C] text-slate-200 font-sans overflow-hidden rounded-xl border border-[#1A222C] transition-all duration-200 ease-in-out ${isClosing ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100'}`}>
      
      {/* Titlebar Overlay */}
      <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-between pl-4 pr-0 select-none z-50" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex items-center gap-2">
          <img 
            src="./images/logo_mini.webp" 
            alt="Logo" 
            className="w-3.5 h-3.5 object-contain" 
            draggable={false}
          />
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">SandCore • Overlay</span>
        </div>
        <div className="flex items-center h-full">
          <button 
            onClick={() => window.ipcRenderer?.send('window-control', 'minimize')} 
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

      {/* Content Body */}
      <div className="flex-1 flex p-4 pt-10 gap-4 overflow-hidden h-full">
        
        {/* Floating Sidebar Pill matching mockup */}
        <div 
          className="w-[72px] flex-none bg-[#0B0E12] border border-[#1E2732] rounded-3xl py-5 flex flex-col justify-between items-center shadow-[0_0_24px_rgba(0,168,150,0.08)] relative"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          {/* Top Logo / Tab Selector */}
          <div className="flex flex-col items-center w-full gap-3">
            <button
              onClick={() => setActiveTab('shuriken')}
              className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group cursor-pointer
                ${activeTab === 'shuriken' 
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-[0_0_14px_rgba(3,166,150,0.25)]' 
                  : 'text-slate-500 hover:text-teal-400 hover:bg-white/5 border border-transparent'
                }
              `}
              title="Visão Geral"
            >
              {activeTab === 'shuriken' && (
                <div className="absolute left-[-11px] top-1/2 -translate-y-1/2 w-1 h-5 bg-teal-400 rounded-r-md" />
              )}
              <img 
                src="./images/logo_mini.webp" 
                alt="Logo" 
                className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500 ease-out object-contain" 
                draggable={false}
              />
            </button>

            {/* Divider */}
            <div className="h-[1px] w-8 bg-slate-800/80 my-1"></div>

            {/* Main Tabs */}
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group cursor-pointer
                    ${isActive 
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-[0_0_14px_rgba(3,166,150,0.25)]' 
                      : 'text-slate-500 hover:text-teal-400 hover:bg-white/5 border border-transparent'
                    }
                  `}
                  title={item.label}
                >
                  {isActive && (
                    <div className="absolute left-[-11px] top-1/2 -translate-y-1/2 w-1 h-5 bg-teal-400 rounded-r-md" />
                  )}
                  <Icon size={20} className="transition-transform group-hover:scale-110" />
                </button>
              )
            })}
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col items-center w-full gap-3">
            <div className="h-[1px] w-8 bg-slate-800/80 my-1"></div>
            
            <button
              onClick={handleLogout}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer group"
              title="Fazer Logout"
            >
              <LogOut size={19} className="transition-transform group-hover:-translate-x-0.5" />
            </button>

            {/* Little bottom line indicator */}
            <div className="w-4 h-1 bg-teal-500/60 rounded-full mt-1"></div>
          </div>
        </div>

        {/* Floating Content Card */}
        <div 
          className="flex-1 bg-[#0B0E12] border border-[#1E2732] rounded-3xl p-6 overflow-hidden flex flex-col justify-between shadow-[0_0_24px_rgba(0,0,0,0.5)]"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          {/* TAB 1: Overview */}
          {activeTab === 'shuriken' && (
            <div className="flex flex-col justify-between h-full animate-in fade-in duration-300">
              <div>
                <h2 className="text-xl font-bold tracking-wide text-slate-100 flex items-center gap-2 mb-1">
                  Painel Principal
                </h2>
                <div className="h-[1px] bg-slate-800/60 w-full mb-6"></div>

                <div className="bg-[#11161D] border border-slate-800 p-5 rounded-2xl flex items-start gap-4 shadow-inner mb-5">
                  <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center flex-none">
                    <UserCheck className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200">Bem-vindo de volta, Shinobi!</h3>
                    <p className="text-slate-400 text-xs mt-0.5 truncate">{viewModel.getCurrentUser()?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#11161D] border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Status do HUD</span>
                    <span className="text-sm font-semibold text-emerald-400 mt-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      Ativo & Monitorando
                    </span>
                  </div>
                  <div className="bg-[#11161D] border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Overlay Stay-On-Top</span>
                    <span className={`text-sm font-semibold mt-2 ${alwaysOnTop ? 'text-teal-400' : 'text-slate-500'}`}>
                      {alwaysOnTop ? 'Habilitado' : 'Desabilitado'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-slate-500 text-[11px] leading-relaxed border-t border-slate-800/80 pt-4 flex justify-between items-center">
                <span>SLP Map HUD • v1.0.0</span>
                <span className="text-teal-500/70 font-semibold">Overlay Rodando</span>
              </div>
            </div>
          )}

          {/* TAB 2: Pins (Marcadores) */}
          {activeTab === 'pin' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <h2 className="text-xl font-bold tracking-wide text-slate-100 mb-1">Marcadores do Mapa</h2>
              <div className="h-[1px] bg-slate-800/60 w-full mb-4"></div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div className="bg-[#11161D] border border-slate-800/60 p-3.5 rounded-xl flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-300">Vila da Folha (Konoha)</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Coordenadas: 40.52, -74.12</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Completo</span>
                </div>
                <div className="bg-[#11161D] border border-slate-800/60 p-3.5 rounded-xl flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-300">Vale do Fim</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Coordenadas: 12.84, 98.15</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Completo</span>
                </div>
                <div className="bg-[#11161D] border border-slate-800/60 p-3.5 rounded-xl flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-300">Esconderijo da Akatsuki</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Coordenadas: -5.10, 42.60</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Pendente</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Favorites */}
          {activeTab === 'star' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <h2 className="text-xl font-bold tracking-wide text-slate-100 mb-1">Locais Favoritos</h2>
              <div className="h-[1px] bg-slate-800/60 w-full mb-4"></div>
              
              <div className="flex-1 flex flex-col justify-center items-center text-center text-slate-500 px-6">
                <Star size={32} className="text-slate-600 mb-3 animate-[pulse_3s_infinite]" />
                <p className="text-xs font-medium">Nenhum favorito salvo</p>
                <p className="text-[10px] text-slate-600 mt-1">Marque locais de interesse com estrelas no mapa para exibi-los aqui.</p>
              </div>
            </div>
          )}

          {/* TAB 4: Explorer */}
          {activeTab === 'compass' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <h2 className="text-xl font-bold tracking-wide text-slate-100 mb-1">Radar e Coordenadas</h2>
              <div className="h-[1px] bg-slate-800/60 w-full mb-4"></div>
              
              <div className="flex-1 flex flex-col justify-center items-center text-center bg-[#11161D]/50 border border-slate-800/60 rounded-2xl p-6">
                <Compass size={40} className="text-teal-400 mb-3 animate-[spin_12s_linear_infinite]" />
                <span className="text-xs font-semibold text-slate-200">Buscando Sinal do GPS...</span>
                <span className="text-[10px] text-slate-500 mt-1">Abra o Shinobi Legends para sincronizar a posição do seu ninja no mapa em tempo real.</span>
              </div>
            </div>
          )}

          {/* TAB 5: Stats */}
          {activeTab === 'stats' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <h2 className="text-xl font-bold tracking-wide text-slate-100 mb-1">Estatísticas do Perfil</h2>
              <div className="h-[1px] bg-slate-800/60 w-full mb-6"></div>
              
              <div className="space-y-4 flex-1">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Marcadores Descobertos</span>
                    <span className="font-semibold text-teal-400">14 / 45</span>
                  </div>
                  <div className="w-full bg-[#161D26] h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-teal-500 h-full rounded-full" style={{ width: '31%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Sincronização do Mapa</span>
                    <span className="font-semibold text-teal-400">82%</span>
                  </div>
                  <div className="w-full bg-[#161D26] h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-teal-500 h-full rounded-full" style={{ width: '82%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Settings */}
          {activeTab === 'settings' && (
            <div className="flex flex-col justify-between h-full animate-in fade-in duration-300">
              <div>
                <h2 className="text-xl font-bold tracking-wide text-slate-100 mb-1">Configurações</h2>
                <div className="h-[1px] bg-slate-800/60 w-full mb-5"></div>
                
                <div className="space-y-4">
                  {/* Always on top toggle */}
                  <div className="flex items-center justify-between bg-[#11161D] border border-slate-800 p-3.5 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-200">Sempre no Topo</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Mantém o HUD acima de outras janelas</span>
                    </div>
                    <button 
                      onClick={toggleAlwaysOnTop}
                      className={`w-11 h-6 rounded-full transition-all duration-300 relative border cursor-pointer
                        ${alwaysOnTop 
                          ? 'bg-teal-500/20 border-teal-500' 
                          : 'bg-[#18212C] border-slate-800'
                        }
                      `}
                    >
                      <div 
                        className={`w-4.5 h-4.5 rounded-full absolute top-1/2 -translate-y-1/2 transition-all duration-300
                          ${alwaysOnTop 
                            ? 'left-5.5 bg-teal-400' 
                            : 'left-1 bg-slate-500'
                          }
                        `}
                      />
                    </button>
                  </div>

                  {/* In game notifications */}
                  <div className="flex items-center justify-between bg-[#11161D] border border-slate-800 p-3.5 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-200">Notificações In-game</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Popups ao aproximar de marcadores</span>
                    </div>
                    <button 
                      onClick={toggleInGameNotifs}
                      className={`w-11 h-6 rounded-full transition-all duration-300 relative border cursor-pointer
                        ${inGameNotifs 
                          ? 'bg-teal-500/20 border-teal-500' 
                          : 'bg-[#18212C] border-slate-800'
                        }
                      `}
                    >
                      <div 
                        className={`w-4.5 h-4.5 rounded-full absolute top-1/2 -translate-y-1/2 transition-all duration-300
                          ${inGameNotifs 
                            ? 'left-5.5 bg-teal-400' 
                            : 'left-1 bg-slate-500'
                          }
                        `}
                      />
                    </button>
                  </div>

                  {/* Volume Slider */}
                  <div className="bg-[#11161D] border border-slate-800 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                      <span className="flex items-center gap-1.5"><Volume2 size={14} className="text-slate-400" /> Volume dos Alertas</span>
                      <span className="text-teal-400">{volume}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-full accent-teal-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                    />
                  </div>
                </div>
              </div>

              <span className="text-[10px] text-slate-600 block text-right mt-4">
                Configurações gravadas localmente
              </span>
            </div>
          )}
        </div>
        
      </div>

    </div>
  )
}

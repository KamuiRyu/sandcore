import { useState, useEffect } from 'react'
import { Settings, Volume2, Keyboard, Trash2 } from 'lucide-react'

export const SettingsScreen = () => {
  const [alwaysOnTop, setAlwaysOnTop] = useState(true)
  const [inGameNotifs, setInGameNotifs] = useState(true)
  const [volume, setVolume] = useState(80)
  const [layoutSide, setLayoutSide] = useState<'left' | 'right'>('right')
  const [sidebarOpacity, setSidebarOpacity] = useState(95)
  const [uiScale, setUiScale] = useState(100)
  const [isScaleDropdownOpen, setIsScaleDropdownOpen] = useState(false)

  const [shortcutMap, setShortcutMap] = useState('CommandOrControl+Alt+M')
  const [shortcutSettings, setShortcutSettings] = useState('CommandOrControl+Alt+S')
  const [recordingType, setRecordingType] = useState<'map' | 'settings' | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'keybinds'>('general')

  useEffect(() => {
    if (window.ipcRenderer) {
      window.ipcRenderer.getConfig().then((config) => {
        if (config) {
          if ('alwaysOnTop' in config) setAlwaysOnTop(config.alwaysOnTop)
          if ('inGameNotifs' in config) setInGameNotifs(config.inGameNotifs)
          if ('volume' in config) setVolume(config.volume)
          if ('layoutSide' in config) setLayoutSide(config.layoutSide || 'right')
          if ('sidebarOpacity' in config) setSidebarOpacity(config.sidebarOpacity)
          if ('uiScale' in config) setUiScale(config.uiScale || 100)
          if ('shortcutMap' in config) setShortcutMap(config.shortcutMap || '')
          if ('shortcutSettings' in config) setShortcutSettings(config.shortcutSettings || '')
        }
      })
    }
  }, [])

  useEffect(() => {
    if (!recordingType) return

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const key = e.key
      const ctrl = e.ctrlKey || key === 'Control'
      const alt = e.altKey || key === 'Alt'
      const shift = e.shiftKey || key === 'Shift'
      const meta = e.metaKey || key === 'Meta'

      const isModifierOnly = ['Control', 'Alt', 'Shift', 'Meta'].includes(key)

      // If pressing Escape alone (without modifiers), cancel recording
      if (key === 'Escape' && !ctrl && !alt && !shift && !meta) {
        setRecordingType(null)
        setErrorMessage('')
        return
      }

      // If pressing Backspace alone (without modifiers), clear the shortcut
      if (key === 'Backspace' && !ctrl && !alt && !shift && !meta) {
        window.ipcRenderer?.invoke('register-shortcut', { type: recordingType, shortcut: '' }).then((res: any) => {
          if (res && res.success) {
            if (recordingType === 'map') {
              setShortcutMap('')
              window.ipcRenderer?.send('set-config', { shortcutMap: '' })
            } else {
              setShortcutSettings('')
              window.ipcRenderer?.send('set-config', { shortcutSettings: '' })
            }
            setRecordingType(null)
            setErrorMessage('')
          }
        })
        return
      }

      let mainKey = ''
      if (!isModifierOnly) {
        if (key === ' ') {
          mainKey = 'Space'
        } else if (key === 'ArrowUp') {
          mainKey = 'Up'
        } else if (key === 'ArrowDown') {
          mainKey = 'Down'
        } else if (key === 'ArrowLeft') {
          mainKey = 'Left'
        } else if (key === 'ArrowRight') {
          mainKey = 'Right'
        } else if (key.length === 1) {
          mainKey = key.toUpperCase()
        } else if (/^F[1-9][0-9]?$/.test(key)) {
          mainKey = key
        } else {
          mainKey = key.charAt(0).toUpperCase() + key.slice(1)
        }
      }

      const parts: string[] = []
      if (ctrl) parts.push('CommandOrControl')
      if (alt) parts.push('Alt')
      if (shift) parts.push('Shift')
      if (meta) parts.push('Super')

      if (mainKey) {
        parts.push(mainKey)
        const finalShortcut = parts.join('+')

        // Check for conflict between the two locally configured hotkeys
        if (recordingType === 'map' && finalShortcut === shortcutSettings) {
          setErrorMessage('Este atalho conflita com o atalho de Configurações.')
          return
        }
        if (recordingType === 'settings' && finalShortcut === shortcutMap) {
          setErrorMessage('Este atalho conflita com o atalho do Mapa.')
          return
        }

        window.ipcRenderer?.invoke('register-shortcut', { type: recordingType, shortcut: finalShortcut }).then((res: any) => {
          if (res && res.success) {
            if (recordingType === 'map') {
              setShortcutMap(finalShortcut)
              window.ipcRenderer?.send('set-config', { shortcutMap: finalShortcut })
            } else {
              setShortcutSettings(finalShortcut)
              window.ipcRenderer?.send('set-config', { shortcutSettings: finalShortcut })
            }
            setRecordingType(null)
            setErrorMessage('')
          } else {
            setErrorMessage('Este atalho já está em uso ou é inválido.')
          }
        })
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true)
    }
  }, [recordingType, shortcutMap, shortcutSettings])

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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Fixo */}
      <div className="space-y-3 mb-3 flex-none">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-teal-400" />
          Configurações
        </h2>
        <div className="h-[1px] bg-slate-800/60 w-full"></div>

        {/* Sub-tabs Navigation */}
        <div className="flex bg-[#11161D] border border-slate-800/60 rounded-xl p-1 relative z-10 w-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button
            onClick={() => setActiveSubTab('general')}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all text-center
              ${activeSubTab === 'general' 
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20 shadow-[0_0_8px_rgba(20,184,166,0.15)]' 
                : 'text-slate-500 hover:text-slate-350 border border-transparent'
              }`}
          >
            Geral
          </button>
          <button
            onClick={() => setActiveSubTab('keybinds')}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all text-center
              ${activeSubTab === 'keybinds' 
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20 shadow-[0_0_8px_rgba(20,184,166,0.15)]' 
                : 'text-slate-500 hover:text-slate-350 border border-transparent'
              }`}
          >
            Atalhos
          </button>
        </div>
      </div>

      {/* Conteúdo Rolável */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4 pb-1">
        {activeSubTab === 'general' ? (
          <div className="space-y-4">
            {/* Stay on top toggle */}
            <div className="flex items-center justify-between bg-[#11161D] border border-slate-800/60 p-3 rounded-xl">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200">Sempre no Topo</span>
                <span className="text-[9px] text-slate-500 mt-0.5">Exibe o HUD acima do jogo</span>
              </div>
              <button 
                onClick={toggleAlwaysOnTop}
                className={`w-10 h-5.5 rounded-full transition-all duration-300 relative border cursor-pointer
                  ${alwaysOnTop 
                    ? 'bg-teal-500/20 border-teal-500' 
                    : 'bg-[#18212C] border-slate-800'
                  }
                `}
              >
                <div 
                  className={`w-4 h-4 rounded-full absolute top-1/2 -translate-y-1/2 transition-all duration-300
                    ${alwaysOnTop 
                      ? 'left-5 bg-teal-400' 
                      : 'left-0.5 bg-slate-500'
                    }
                  `}
                />
              </button>
            </div>

            {/* Panel Side segmented control setting */}
            <div className="flex items-center justify-between bg-[#11161D] border border-slate-800/60 p-3 rounded-xl">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200">Lado do Painel</span>
                <span className="text-[9px] text-slate-500 mt-0.5">Define de qual lado o painel se abre</span>
              </div>
              <div className="flex bg-[#18212C] border border-slate-800 rounded-lg p-0.5 relative z-10" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button
                  onClick={() => {
                    if (layoutSide !== 'left') {
                      setLayoutSide('left')
                      window.ipcRenderer?.send('set-config', { layoutSide: 'left' })
                    }
                  }}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${layoutSide === 'left' ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20 shadow-[0_0_8px_rgba(20,184,166,0.15)]' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Esquerda
                </button>
                <button
                  onClick={() => {
                    if (layoutSide !== 'right') {
                      setLayoutSide('right')
                      window.ipcRenderer?.send('set-config', { layoutSide: 'right' })
                    }
                  }}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${layoutSide === 'right' ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20 shadow-[0_0_8px_rgba(20,184,166,0.15)]' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Direita
                </button>
              </div>
            </div>

            {/* Notifications toggle */}
            <div className="flex items-center justify-between bg-[#11161D] border border-slate-800/60 p-3 rounded-xl">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200">Aviso In-game</span>
                <span className="text-[9px] text-slate-500 mt-0.5">Alerta sonoro ao ver recurso</span>
              </div>
              <button 
                onClick={toggleInGameNotifs}
                className={`w-10 h-5.5 rounded-full transition-all duration-300 relative border cursor-pointer
                  ${inGameNotifs 
                    ? 'bg-teal-500/20 border-teal-500' 
                    : 'bg-[#18212C] border-slate-800'
                  }
                `}
              >
                <div 
                  className={`w-4 h-4 rounded-full absolute top-1/2 -translate-y-1/2 transition-all duration-300
                    ${inGameNotifs 
                      ? 'left-5 bg-teal-400' 
                      : 'left-0.5 bg-slate-500'
                    }
                  `}
                />
              </button>
            </div>

            {/* Volume Slider */}
            <div className="bg-[#11161D] border border-slate-800/60 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span className="flex items-center gap-1.5"><Volume2 size={13} className="text-slate-400" /> Volume de Avisos</span>
                <span className="text-teal-400 text-xs">{volume}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={volume}
                onChange={handleVolumeChange}
                className="w-full accent-teal-500 cursor-pointer h-0.5 bg-slate-800 rounded-lg appearance-none"
              />
            </div>

            {/* Sidebar Opacity Slider */}
            <div className="bg-[#11161D] border border-slate-800/60 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a10 10 0 0 1 0 20" fill="currentColor" opacity="0.3" />
                  </svg>
                  Opacidade da Sidebar
                </span>
                <span className="text-teal-400 text-xs">{sidebarOpacity}%</span>
              </div>
              <input 
                type="range" 
                min="20" 
                max="100" 
                value={sidebarOpacity}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  setSidebarOpacity(val)
                  window.ipcRenderer?.send('set-config', { sidebarOpacity: val })
                }}
                className="w-full accent-teal-500 cursor-pointer h-0.5 bg-slate-800 rounded-lg appearance-none"
              />
            </div>

            {/* HUD Scale Dropdown */}
            <div className="flex items-center justify-between bg-[#11161D] border border-slate-800/60 p-3 rounded-xl">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                  </svg>
                  Escala do HUD
                </span>
                <span className="text-[9px] text-slate-500 mt-0.5">Ajusta o tamanho da interface</span>
              </div>
              <div className="relative" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button
                  onClick={() => setIsScaleDropdownOpen(!isScaleDropdownOpen)}
                  className="bg-[#18212C] border border-slate-850 hover:border-teal-500/30 text-teal-400 text-xs font-bold rounded-lg p-1.5 px-3.5 outline-none cursor-pointer transition-all flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                >
                  <span>{uiScale === 50 ? '0.5x' : uiScale === 75 ? '0.75x' : uiScale === 100 ? '1x' : '1.3x'}</span>
                  <svg 
                    className={`w-2.5 h-2.5 text-teal-500/80 transition-transform duration-200 ${isScaleDropdownOpen ? 'rotate-180' : ''}`} 
                    viewBox="0 0 10 6" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.8"
                  >
                    <path d="M1 1L5 5L9 1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {isScaleDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setIsScaleDropdownOpen(false)} 
                    />
                    <div className="absolute right-0 bottom-full mb-1.5 w-24 bg-[#0F1318]/95 border border-[#1E2732] rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150">
                      {[50, 75, 100, 130].map((scale) => {
                        const isSelected = uiScale === scale
                        return (
                          <button
                            key={scale}
                            onClick={() => {
                              setUiScale(scale)
                              window.ipcRenderer?.send('set-config', { uiScale: scale })
                              setIsScaleDropdownOpen(false)
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold transition-all hover:bg-teal-500/10 hover:text-teal-400 cursor-pointer flex items-center justify-between border-b border-[#1E2732]/25 last:border-b-0
                              ${isSelected ? 'bg-teal-500/5 text-teal-400' : 'text-slate-350'}
                            `}
                          >
                            <span>{scale === 50 ? '0.5x' : scale === 75 ? '0.75x' : scale === 100 ? '1x' : '1.3x'}</span>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Shortcut Map Recorder */}
            <div className="bg-[#11161D] border border-slate-800/60 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Keyboard size={13} className="text-slate-400" /> Abrir Mapa
                  </span>
                  <span className="text-[9px] text-slate-500 mt-0.5">Exibe e foca a tela de Mapa</span>
                </div>
                
                <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
                  {shortcutMap && (
                    <button
                      onClick={() => {
                        window.ipcRenderer?.invoke('register-shortcut', { type: 'map', shortcut: '' }).then((res: any) => {
                          if (res && res.success) {
                            setShortcutMap('')
                            window.ipcRenderer?.send('set-config', { shortcutMap: '' })
                            setErrorMessage('')
                          }
                        })
                      }}
                      className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                      title="Remover atalho"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setRecordingType(recordingType === 'map' ? null : 'map')
                      setErrorMessage('')
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border
                      ${recordingType === 'map'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/35 shadow-[0_0_8px_rgba(245,158,11,0.1)]'
                        : 'bg-[#18212C] border-slate-800 text-teal-400 hover:border-teal-500/30'
                      }
                    `}
                  >
                    {recordingType === 'map' ? 'Pressione as teclas...' : 'Gravar novo'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  {shortcutMap ? (
                    shortcutMap.split('+').map((part, index) => (
                      <span 
                        key={index} 
                        className="px-1.5 py-0.5 bg-slate-800/80 border border-slate-700 text-slate-200 rounded font-mono text-[9.5px] uppercase shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                      >
                        {part === 'CommandOrControl' || part === 'CmdOrCtrl' ? 'Ctrl' : part}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">Nenhum atalho configurado</span>
                  )}
                </div>
                {recordingType === 'map' && (
                  <span className="text-[8.5px] text-slate-450 italic animate-pulse">
                    Pressione Esc para cancelar ou Backspace para limpar.
                  </span>
                )}
              </div>
            </div>

            {/* Shortcut Settings Recorder */}
            <div className="bg-[#11161D] border border-slate-800/60 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Keyboard size={13} className="text-slate-400" /> Abrir Configurações
                  </span>
                  <span className="text-[9px] text-slate-500 mt-0.5">Exibe e foca a tela de Configurações</span>
                </div>
                
                <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
                  {shortcutSettings && (
                    <button
                      onClick={() => {
                        window.ipcRenderer?.invoke('register-shortcut', { type: 'settings', shortcut: '' }).then((res: any) => {
                          if (res && res.success) {
                            setShortcutSettings('')
                            window.ipcRenderer?.send('set-config', { shortcutSettings: '' })
                            setErrorMessage('')
                          }
                        })
                      }}
                      className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                      title="Remover atalho"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setRecordingType(recordingType === 'settings' ? null : 'settings')
                      setErrorMessage('')
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border
                      ${recordingType === 'settings'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/35 shadow-[0_0_8px_rgba(245,158,11,0.1)]'
                        : 'bg-[#18212C] border-slate-800 text-teal-400 hover:border-teal-500/30'
                      }
                    `}
                  >
                    {recordingType === 'settings' ? 'Pressione as teclas...' : 'Gravar novo'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  {shortcutSettings ? (
                    shortcutSettings.split('+').map((part, index) => (
                      <span 
                        key={index} 
                        className="px-1.5 py-0.5 bg-slate-800/80 border border-slate-700 text-slate-200 rounded font-mono text-[9.5px] uppercase shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                      >
                        {part === 'CommandOrControl' || part === 'CmdOrCtrl' ? 'Ctrl' : part}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">Nenhum atalho configurado</span>
                  )}
                </div>
                {recordingType === 'settings' && (
                  <span className="text-[8.5px] text-slate-450 italic animate-pulse">
                    Pressione Esc para cancelar ou Backspace para limpar.
                  </span>
                )}
              </div>
            </div>

            {errorMessage && (
              <div className="text-[9.5px] text-red-400 font-semibold bg-red-950/20 border border-red-900/30 px-2.5 py-1 rounded-lg">
                {errorMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Fixo */}
      <span className="text-[9.5px] text-slate-600 block text-right mt-2 flex-none">
        Configurações salvas localmente.
      </span>
    </div>
  )
}
export default SettingsScreen

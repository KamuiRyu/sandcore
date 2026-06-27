import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Volume2, Keyboard, Trash2, Map, Scroll, Shield, Users, BarChart2, Hammer, Building2, Settings as SettingsIcon } from 'lucide-react'
import { appStorage } from '../../../../lib/storage'

const SIDEBAR_HIDDEN_KEY = 'shinobi-map-sidebar-hidden'

const SIDEBAR_ITEMS = [
  { id: 'map',        label: 'Mapa',          icon: Map },
  { id: 'missions',   label: 'Missões',        icon: Scroll },
  { id: 'ninja-card', label: 'Carteirinha',    icon: Shield },
  { id: 'groups',     label: 'Grupos',         icon: Users },
  { id: 'stats',      label: 'Estatísticas',   icon: BarChart2 },
  { id: 'crafting',   label: 'Crafting',       icon: Hammer },
  { id: 'manager',    label: 'Organização',    icon: Building2 },
  { id: 'admin',      label: 'Admin',          icon: SettingsIcon },
] as const

const SL = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-2">
    <span style={{ color: '#c8a030', fontSize: 10, fontFamily: "'Orbitron', sans-serif" }}>[</span>
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Orbitron', sans-serif", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c8a030', whiteSpace: 'nowrap' }}>
      {children}
    </span>
    <div className="flex-1" style={{ borderTop: '1px dashed rgba(200,160,48,0.25)' }} />
    <span style={{ color: '#c8a030', fontSize: 10, fontFamily: "'Orbitron', sans-serif" }}>]</span>
  </div>
)

const Toggle = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-10 h-5 rounded-full relative cursor-pointer transition-all duration-300 border"
    style={{
      background: active ? 'rgba(200,134,10,0.2)' : 'rgba(8,8,8,0.6)',
      borderColor: active ? '#c8860a' : '#282828',
    }}
  >
    <div
      className="w-3.5 h-3.5 rounded-full absolute top-1/2 -translate-y-1/2 transition-all duration-300"
      style={{
        left: active ? 'calc(100% - 18px)' : '2px',
        background: active ? '#c8860a' : '#282828',
      }}
    />
  </button>
)

const ListContainer = ({ children }: { children: React.ReactNode }) => (
  <div style={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #1e1e1e' }}>
    {children}
  </div>
)

const ListItem = ({ children, isLast = false, vertical = false }: { children: React.ReactNode, isLast?: boolean, vertical?: boolean }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: vertical ? 'column' : 'row',
      alignItems: vertical ? 'stretch' : 'center',
      justifyContent: vertical ? 'flex-start' : 'space-between',
      padding: '8px 12px',
      fontSize: 10,
      background: 'rgba(8,8,8,0.8)',
      borderBottom: isLast ? 'none' : '1px solid rgba(30,30,30,0.7)',
      gap: vertical ? 8 : 12
    }}
  >
    {children}
  </div>
)

const KbdKey = ({ k }: { k: string }) => (
  <span
    className="inline-flex items-center px-1.5 py-0.5 font-mono text-[9px] rounded-[2px]"
    style={{ background: '#1c1508', border: '1px solid #c8860a', borderBottomWidth: 2, color: '#e8b840', letterSpacing: '0.04em' }}
  >
    {k === 'CommandOrControl' || k === 'CmdOrCtrl' ? 'Ctrl' : k}
  </span>
)

const SecondaryButton = ({ children, onClick, disabled = false, padding = '4px 10px' }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, padding?: string }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding,
      borderRadius: 3, background: 'transparent', border: '1px solid #1e1e1e', color: '#c8a840',
      fontSize: 9, fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: '0.08em',
      cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
      whiteSpace: 'nowrap'
    }}
    onMouseEnter={e => { if(!disabled) { e.currentTarget.style.background = 'rgba(40,40,40,0.25)'; e.currentTarget.style.borderColor = '#6a4e18'; e.currentTarget.style.color = '#e8c860'; } }}
    onMouseLeave={e => { if(!disabled) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#c8a840'; } }}
  >
    {children}
  </button>
)

const PrimaryButton = ({ children, onClick, disabled = false }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 3,
      background: 'linear-gradient(135deg,#b87a08,#e8a820)', color: '#0a0800', border: 'none',
      fontWeight: 700, fontSize: 9, fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em',
      cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: disabled ? 0.5 : 1
    }}
  >
    {children}
  </button>
)

export const SettingsScreen = () => {
  const [alwaysOnTop, setAlwaysOnTop] = useState(true)
  const [inGameNotifs, setInGameNotifs] = useState(true)
  const [volume, setVolume] = useState(80)
  const [layoutSide, setLayoutSide] = useState<'left' | 'right'>('right')
  const [sidebarOpacity, setSidebarOpacity] = useState(95)
  const [uiScale, setUiScale] = useState(100)
  const [isScaleDropdownOpen, setIsScaleDropdownOpen] = useState(false);
  const scaleDropdownRef = useRef<HTMLDivElement>(null);
  const [scaleDropdownCoords, setScaleDropdownCoords] = useState<{ bottom: number, right: number } | null>(null);

  const toggleScaleDropdown = () => {
    if (isScaleDropdownOpen) {
      setIsScaleDropdownOpen(false);
    } else {
      if (scaleDropdownRef.current) {
        const rect = scaleDropdownRef.current.getBoundingClientRect();
        setScaleDropdownCoords({
          bottom: window.innerHeight - rect.top + 6,
          right: window.innerWidth - rect.right,
        });
      }
      setIsScaleDropdownOpen(true);
    }
  };

  const [shortcutMap, setShortcutMap] = useState('CommandOrControl+Alt+M')
  const [shortcutSettings, setShortcutSettings] = useState('CommandOrControl+Alt+S')
  const [recordingType, setRecordingType] = useState<'map' | 'settings' | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'keybinds' | 'sidebar'>('general')
  const [hiddenSidebarItems, setHiddenSidebarItems] = useState<Set<string>>(() => {
    try {
      const raw = appStorage.getItem(SIDEBAR_HIDDEN_KEY)
      return new Set(raw ? JSON.parse(raw) : [])
    } catch { return new Set() }
  })

  const toggleSidebarItem = (id: string) => {
    setHiddenSidebarItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      const list = [...next]
      appStorage.setItem(SIDEBAR_HIDDEN_KEY, JSON.stringify(list))
      window.ipcRenderer?.send('update-sidebar-hidden', { hiddenItems: list })
      return next
    })
  }

  useEffect(() => {
    if (window.ipcRenderer) {
      const handleConfig = (_event: any, config: any) => {
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
      }
      window.ipcRenderer.getConfig().then((config) => handleConfig(null, config))
      window.ipcRenderer.on('config-updated', handleConfig)
      return () => { window.ipcRenderer?.off('config-updated', handleConfig) }
    }
  }, [])

  useEffect(() => {
    if (!recordingType) return
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      e.preventDefault(); e.stopPropagation()
      const key = e.key
      const ctrl = e.ctrlKey || key === 'Control'
      const alt = e.altKey || key === 'Alt'
      const shift = e.shiftKey || key === 'Shift'
      const meta = e.metaKey || key === 'Meta'
      const isModifierOnly = ['Control', 'Alt', 'Shift', 'Meta'].includes(key)
      if (key === 'Escape' && !ctrl && !alt && !shift && !meta) { setRecordingType(null); setErrorMessage(''); return }
      if (key === 'Backspace' && !ctrl && !alt && !shift && !meta) {
        window.ipcRenderer?.invoke('register-shortcut', { type: recordingType, shortcut: '' }).then((res: any) => {
          if (res?.success) {
            if (recordingType === 'map') { setShortcutMap(''); window.ipcRenderer?.send('set-config', { shortcutMap: '' }) }
            else { setShortcutSettings(''); window.ipcRenderer?.send('set-config', { shortcutSettings: '' }) }
            setRecordingType(null); setErrorMessage('')
          }
        }); return
      }
      let mainKey = ''
      if (!isModifierOnly) {
        if (key === ' ') mainKey = 'Space'
        else if (key === 'ArrowUp') mainKey = 'Up'
        else if (key === 'ArrowDown') mainKey = 'Down'
        else if (key === 'ArrowLeft') mainKey = 'Left'
        else if (key === 'ArrowRight') mainKey = 'Right'
        else if (key.length === 1) mainKey = key.toUpperCase()
        else if (/^F[1-9][0-9]?$/.test(key)) mainKey = key
        else mainKey = key.charAt(0).toUpperCase() + key.slice(1)
      }
      const parts: string[] = []
      if (ctrl) parts.push('CommandOrControl')
      if (alt) parts.push('Alt')
      if (shift) parts.push('Shift')
      if (meta) parts.push('Super')
      if (mainKey) {
        parts.push(mainKey)
        const finalShortcut = parts.join('+')
        if (recordingType === 'map' && finalShortcut === shortcutSettings) { setErrorMessage('Este atalho conflita com o atalho de Configurações.'); return }
        if (recordingType === 'settings' && finalShortcut === shortcutMap) { setErrorMessage('Este atalho conflita com o atalho do Mapa.'); return }
        window.ipcRenderer?.invoke('register-shortcut', { type: recordingType, shortcut: finalShortcut }).then((res: any) => {
          if (res?.success) {
            if (recordingType === 'map') { setShortcutMap(finalShortcut); window.ipcRenderer?.send('set-config', { shortcutMap: finalShortcut }) }
            else { setShortcutSettings(finalShortcut); window.ipcRenderer?.send('set-config', { shortcutSettings: finalShortcut }) }
            setRecordingType(null); setErrorMessage('')
          } else { setErrorMessage('Este atalho já está em uso ou é inválido.') }
        })
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown, true)
    return () => { window.removeEventListener('keydown', handleGlobalKeyDown, true) }
  }, [recordingType, shortcutMap, shortcutSettings])

  const toggleAlwaysOnTop = () => { const v = !alwaysOnTop; setAlwaysOnTop(v); window.ipcRenderer?.send('set-config', { alwaysOnTop: v }) }
  const toggleInGameNotifs = () => { const v = !inGameNotifs; setInGameNotifs(v); window.ipcRenderer?.send('set-config', { inGameNotifs: v }) }
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => { const v = parseInt(e.target.value); setVolume(v); window.ipcRenderer?.send('set-config', { volume: v }) }


  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ color: '#e8d5a0' }}>
      {/* Sub-tab nav */}
      <div
        className="flex rounded-[2px] p-0.5 mb-4 flex-none"
        style={{ border: '1px solid #1e1e1e', WebkitAppRegion: 'no-drag' } as any}
      >
        {([
          { id: 'general', label: 'GERAL' },
          { id: 'sidebar', label: 'SIDEBAR' },
          { id: 'keybinds', label: 'ATALHOS' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className="flex-1 py-1.5 rounded-[2px] text-[10px] font-bold cursor-pointer transition-all text-center"
            style={activeSubTab === tab.id
              ? { background: 'linear-gradient(135deg,#b87a08,#e8a820)', color: '#0a0800', border: 'none', fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em' }
              : { background: 'transparent', color: '#c8a840', border: '1px solid transparent', fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar space-y-3 pb-1">
        {activeSubTab === 'general' ? (
          <div className="space-y-4">
            <div>
              <SL>Exibição</SL>
              <ListContainer>
                <ListItem>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold" style={{ color: '#e8d5a0' }}>Sempre no Topo</span>
                    <span className="text-[9px] mt-0.5" style={{ color: '#9a7a40' }}>Exibe o HUD acima do jogo</span>
                  </div>
                  <Toggle active={alwaysOnTop} onClick={toggleAlwaysOnTop} />
                </ListItem>
                <ListItem>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold" style={{ color: '#e8d5a0' }}>Lado do Painel</span>
                    <span className="text-[9px] mt-0.5" style={{ color: '#9a7a40' }}>Calculado automaticamente</span>
                  </div>
                  <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 3, background: '#0d0e0a', border: '1px solid #2e3020', color: '#f0e8c0' }}>
                    {layoutSide === 'left' ? 'AUTO (ESQ)' : 'AUTO (DIR)'}
                  </span>
                </ListItem>
                <ListItem isLast>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold" style={{ color: '#e8d5a0' }}>Aviso In-game</span>
                    <span className="text-[9px] mt-0.5" style={{ color: '#9a7a40' }}>Alerta sonoro ao ver recurso</span>
                  </div>
                  <Toggle active={inGameNotifs} onClick={toggleInGameNotifs} />
                </ListItem>
              </ListContainer>
            </div>

            <div>
              <SL>Áudio & Interface</SL>
              <ListContainer>
                <ListItem vertical>
                  <div className="flex items-center justify-between text-xs font-semibold w-full">
                    <span className="flex items-center gap-1.5" style={{ color: '#c8a060' }}>
                      <Volume2 size={13} style={{ color: '#9a7a40' }} /> Volume de Avisos
                    </span>
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, color: '#c8860a' }}>{volume}%</span>
                  </div>
                  <input
                    type="range" min="0" max="100" value={volume} onChange={handleVolumeChange}
                    className="w-full cursor-pointer h-1 rounded-full appearance-none"
                    style={{ accentColor: '#c8860a', background: '#1e1e1e' }}
                  />
                </ListItem>
                <ListItem vertical>
                  <div className="flex items-center justify-between text-xs font-semibold w-full">
                    <span style={{ color: '#c8a060' }}>Opacidade da Sidebar</span>
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, color: '#c8860a' }}>{sidebarOpacity}%</span>
                  </div>
                  <input
                    type="range" min="20" max="100" value={sidebarOpacity}
                    onChange={(e) => { const v = parseInt(e.target.value); setSidebarOpacity(v); window.ipcRenderer?.send('set-config', { sidebarOpacity: v }) }}
                    className="w-full cursor-pointer h-1 rounded-full appearance-none"
                    style={{ accentColor: '#c8860a', background: '#1e1e1e' }}
                  />
                </ListItem>
                <ListItem isLast>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold" style={{ color: '#e8d5a0' }}>Escala do HUD</span>
                    <span className="text-[9px] mt-0.5" style={{ color: '#9a7a40' }}>Ajusta o tamanho da interface</span>
                  </div>
                  <div className="relative" style={{ WebkitAppRegion: 'no-drag' } as any} ref={scaleDropdownRef}>
                    <SecondaryButton onClick={toggleScaleDropdown}>
                      <span>{uiScale === 75 ? '0.75x' : uiScale === 100 ? '1x' : '1.3x'}</span>
                      <svg className={`w-2 h-2 transition-transform duration-200 ${isScaleDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 1L5 5L9 1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </SecondaryButton>
                    {isScaleDropdownOpen && scaleDropdownCoords && createPortal(
                      <>
                        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsScaleDropdownOpen(false)} />
                          <div
                            className="fixed w-24 rounded-[3px] z-50 overflow-hidden"
                            style={{ 
                              background: '#0c0c0c', border: '1px solid #3a2508', boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
                              bottom: scaleDropdownCoords.bottom,
                              right: scaleDropdownCoords.right
                            }}
                          >
                          {[75, 100, 130].map((scale) => (
                            <button
                              key={scale}
                              onClick={() => { setUiScale(scale); window.ipcRenderer?.send('set-config', { uiScale: scale }); setIsScaleDropdownOpen(false) }}
                              className="w-full text-left px-3 py-2 text-[10px] font-bold transition-all cursor-pointer flex items-center justify-between"
                              style={{
                                fontFamily: "'Orbitron', sans-serif",
                                borderBottom: '1px solid rgba(30,30,30,0.7)',
                                color: uiScale === scale ? '#e8b840' : '#c8a030',
                                background: uiScale === scale ? 'rgba(40,40,40,0.4)' : 'transparent',
                              }}
                            >
                              <span>{scale === 75 ? '0.75x' : scale === 100 ? '1x' : '1.3x'}</span>
                              {uiScale === scale && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#c8860a' }} />}
                            </button>
                          ))}
                        </div>
                      </>, document.body
                    )}
                  </div>
                </ListItem>
              </ListContainer>
            </div>
          </div>
        ) : activeSubTab === 'sidebar' ? (
          <div className="space-y-4">
            <div>
              <SL>Ícones Visíveis</SL>
              <ListContainer>
                {SIDEBAR_ITEMS.map((item, i) => {
                  const Icon = item.icon
                  const hidden = hiddenSidebarItems.has(item.id)
                  return (
                    <ListItem key={item.id} isLast={i === SIDEBAR_ITEMS.length - 1}>
                      <div className="flex items-center gap-2.5">
                        <Icon size={14} style={{ color: hidden ? '#282828' : '#c8860a' }} />
                        <span className="text-xs font-semibold" style={{ color: hidden ? '#282828' : '#e8d5a0' }}>{item.label}</span>
                      </div>
                      <Toggle active={!hidden} onClick={() => toggleSidebarItem(item.id)} />
                    </ListItem>
                  )
                })}
              </ListContainer>
              <p className="text-[9px] mt-2" style={{ color: '#6a5028', fontFamily: "'Orbitron', sans-serif" }}>
                Alterações refletem na sidebar ao focar a janela.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <SL>Atalhos de Teclado</SL>

              <ListContainer>
                {/* Map shortcut */}
                <ListItem vertical>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#e8d5a0' }}>
                        <Keyboard size={13} style={{ color: '#9a7a40' }} /> Abrir Mapa
                      </span>
                      <span className="text-[9px] mt-0.5" style={{ color: '#9a7a40' }}>Exibe e foca a tela de Mapa</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
                      {shortcutMap && (
                        <button
                          onClick={() => { window.ipcRenderer?.invoke('register-shortcut', { type: 'map', shortcut: '' }).then((res: any) => { if (res?.success) { setShortcutMap(''); window.ipcRenderer?.send('set-config', { shortcutMap: '' }); setErrorMessage('') } }) }}
                          className="p-1.5 rounded-[3px] transition-all cursor-pointer border"
                          style={{ color: '#e07070', background: 'rgba(120,20,20,0.1)', borderColor: '#7a1414' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(120,20,20,0.3)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(120,20,20,0.1)' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      {recordingType === 'map' ? (
                        <PrimaryButton>PRESSIONE...</PrimaryButton>
                      ) : (
                        <SecondaryButton onClick={() => { setRecordingType('map'); setErrorMessage('') }}>GRAVAR NOVO</SecondaryButton>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 w-full">
                    <div className="flex items-center gap-1">
                      {shortcutMap
                        ? shortcutMap.split('+').map((p, i) => <KbdKey key={i} k={p} />)
                        : <span className="text-[10px] italic" style={{ color: '#9a7a40', fontFamily: "'Orbitron', sans-serif" }}>Nenhum atalho</span>
                      }
                    </div>
                    {recordingType === 'map' && (
                      <span className="text-[8.5px] italic animate-pulse" style={{ color: '#c8a030' }}>Esc cancelar · Backspace limpar</span>
                    )}
                  </div>
                </ListItem>

                {/* Settings shortcut */}
                <ListItem vertical isLast>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#e8d5a0' }}>
                        <Keyboard size={13} style={{ color: '#9a7a40' }} /> Abrir Configurações
                      </span>
                      <span className="text-[9px] mt-0.5" style={{ color: '#9a7a40' }}>Exibe e foca a tela de Configurações</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
                      {shortcutSettings && (
                        <button
                          onClick={() => { window.ipcRenderer?.invoke('register-shortcut', { type: 'settings', shortcut: '' }).then((res: any) => { if (res?.success) { setShortcutSettings(''); window.ipcRenderer?.send('set-config', { shortcutSettings: '' }); setErrorMessage('') } }) }}
                          className="p-1.5 rounded-[3px] transition-all cursor-pointer border"
                          style={{ color: '#e07070', background: 'rgba(120,20,20,0.1)', borderColor: '#7a1414' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(120,20,20,0.3)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(120,20,20,0.1)' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      {recordingType === 'settings' ? (
                        <PrimaryButton>PRESSIONE...</PrimaryButton>
                      ) : (
                        <SecondaryButton onClick={() => { setRecordingType('settings'); setErrorMessage('') }}>GRAVAR NOVO</SecondaryButton>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 w-full">
                    <div className="flex items-center gap-1">
                      {shortcutSettings
                        ? shortcutSettings.split('+').map((p, i) => <KbdKey key={i} k={p} />)
                        : <span className="text-[10px] italic" style={{ color: '#9a7a40', fontFamily: "'Orbitron', sans-serif" }}>Nenhum atalho</span>
                      }
                    </div>
                    {recordingType === 'settings' && (
                      <span className="text-[8.5px] italic animate-pulse" style={{ color: '#c8a030' }}>Esc cancelar · Backspace limpar</span>
                    )}
                  </div>
                </ListItem>
              </ListContainer>
            </div>

            {errorMessage && (
              <div
                className="text-[9.5px] font-semibold px-2.5 py-1.5 rounded-[3px] border"
                style={{ background: 'rgba(120,20,20,0.2)', border: '1px solid #7a1414', color: '#e07070', fontFamily: "'Orbitron', sans-serif" }}
              >
                {errorMessage}
              </div>
            )}
          </div>
        )}
      </div>

      <span className="text-[9.5px] block text-right mt-2 flex-none" style={{ color: '#282828', fontFamily: "'Orbitron', sans-serif" }}>
        Configurações salvas localmente.
      </span>
    </div>
  )
}
export default SettingsScreen

import { useState, useEffect } from 'react'
import { Volume2, Keyboard, Trash2 } from 'lucide-react'

const SL = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, #4a2f0a)' }} />
    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9a7a40' }}>
      {children}
    </span>
    <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #4a2f0a, transparent)' }} />
  </div>
)

const Toggle = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-10 h-5 rounded-full relative cursor-pointer transition-all duration-300 border"
    style={{
      background: active ? 'rgba(200,134,10,0.2)' : 'rgba(13,10,5,0.6)',
      borderColor: active ? '#c8860a' : '#4a2f0a',
    }}
  >
    <div
      className="w-3.5 h-3.5 rounded-full absolute top-1/2 -translate-y-1/2 transition-all duration-300"
      style={{
        left: active ? 'calc(100% - 18px)' : '2px',
        background: active ? '#c8860a' : '#4a2f0a',
      }}
    />
  </button>
)

const Card = ({ children }: { children: React.ReactNode }) => (
  <div
    className="flex items-center justify-between p-3 rounded-[2px]"
    style={{ background: 'rgba(13,10,5,0.5)', border: '1px solid #4a2f0a' }}
  >
    {children}
  </div>
)

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

  const KbdKey = ({ k }: { k: string }) => (
    <span
      className="inline-flex items-center px-1.5 py-0.5 font-mono text-[9px] rounded-[2px]"
      style={{ background: '#2e1f08', border: '1px solid #c8860a', borderBottomWidth: 2, color: '#d4a85a', letterSpacing: '0.04em' }}
    >
      {k === 'CommandOrControl' || k === 'CmdOrCtrl' ? 'Ctrl' : k}
    </span>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ color: '#e8d5a0' }}>
      {/* Sub-tab nav */}
      <div
        className="flex rounded-[2px] p-0.5 mb-4 flex-none"
        style={{ background: 'rgba(13,10,5,0.5)', border: '1px solid #4a2f0a', WebkitAppRegion: 'no-drag' } as any}
      >
        {(['general', 'keybinds'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className="flex-1 py-1.5 rounded-[2px] text-[10px] font-bold cursor-pointer transition-all text-center"
            style={activeSubTab === tab
              ? { background: 'rgba(200,134,10,0.15)', color: '#c8860a', border: '1px solid rgba(200,134,10,0.3)' }
              : { color: '#9a7a40', border: '1px solid transparent' }
            }
          >
            {tab === 'general' ? 'Geral' : 'Atalhos'}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar space-y-3 pb-1">
        {activeSubTab === 'general' ? (
          <div className="space-y-3">
            <SL>Exibição</SL>

            <Card>
              <div className="flex flex-col">
                <span className="text-xs font-semibold" style={{ color: '#e8d5a0' }}>Sempre no Topo</span>
                <span className="text-[9px] mt-0.5" style={{ color: '#9a7a40' }}>Exibe o HUD acima do jogo</span>
              </div>
              <Toggle active={alwaysOnTop} onClick={toggleAlwaysOnTop} />
            </Card>

            <Card>
              <div className="flex flex-col">
                <span className="text-xs font-semibold" style={{ color: '#e8d5a0' }}>Lado do Painel</span>
                <span className="text-[9px] mt-0.5" style={{ color: '#9a7a40' }}>Calculado automaticamente</span>
              </div>
              <div
                className="px-3 py-1 rounded-[2px] text-[10px] font-bold select-none"
                style={{ background: 'rgba(200,134,10,0.12)', border: '1px solid rgba(200,134,10,0.3)', color: '#c8860a' }}
              >
                {layoutSide === 'left' ? 'Auto (Esq.)' : 'Auto (Dir.)'}
              </div>
            </Card>

            <Card>
              <div className="flex flex-col">
                <span className="text-xs font-semibold" style={{ color: '#e8d5a0' }}>Aviso In-game</span>
                <span className="text-[9px] mt-0.5" style={{ color: '#9a7a40' }}>Alerta sonoro ao ver recurso</span>
              </div>
              <Toggle active={inGameNotifs} onClick={toggleInGameNotifs} />
            </Card>

            <SL>Áudio & Interface</SL>

            <div className="p-3 rounded-[2px] space-y-2" style={{ background: 'rgba(13,10,5,0.5)', border: '1px solid #4a2f0a' }}>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5" style={{ color: '#c8a060' }}>
                  <Volume2 size={13} style={{ color: '#9a7a40' }} /> Volume de Avisos
                </span>
                <span style={{ color: '#c8860a' }}>{volume}%</span>
              </div>
              <input
                type="range" min="0" max="100" value={volume} onChange={handleVolumeChange}
                className="w-full cursor-pointer h-0.5 rounded-full appearance-none"
                style={{ accentColor: '#c8860a', background: '#4a2f0a' }}
              />
            </div>

            <div className="p-3 rounded-[2px] space-y-2" style={{ background: 'rgba(13,10,5,0.5)', border: '1px solid #4a2f0a' }}>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span style={{ color: '#c8a060' }}>Opacidade da Sidebar</span>
                <span style={{ color: '#c8860a' }}>{sidebarOpacity}%</span>
              </div>
              <input
                type="range" min="20" max="100" value={sidebarOpacity}
                onChange={(e) => { const v = parseInt(e.target.value); setSidebarOpacity(v); window.ipcRenderer?.send('set-config', { sidebarOpacity: v }) }}
                className="w-full cursor-pointer h-0.5 rounded-full appearance-none"
                style={{ accentColor: '#c8860a', background: '#4a2f0a' }}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-[2px]" style={{ background: 'rgba(13,10,5,0.5)', border: '1px solid #4a2f0a' }}>
              <div className="flex flex-col">
                <span className="text-xs font-semibold" style={{ color: '#e8d5a0' }}>Escala do HUD</span>
                <span className="text-[9px] mt-0.5" style={{ color: '#9a7a40' }}>Ajusta o tamanho da interface</span>
              </div>
              <div className="relative" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button
                  onClick={() => setIsScaleDropdownOpen(!isScaleDropdownOpen)}
                  className="rounded-[2px] px-3 py-1.5 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all"
                  style={{ background: 'rgba(13,10,5,0.8)', border: '1px solid #4a2f0a', color: '#c8860a' }}
                >
                  <span>{uiScale === 50 ? '0.5x' : uiScale === 75 ? '0.75x' : uiScale === 100 ? '1x' : '1.3x'}</span>
                  <svg className={`w-2.5 h-2.5 transition-transform duration-200 ${isScaleDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 1L5 5L9 1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {isScaleDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsScaleDropdownOpen(false)} />
                    <div
                      className="absolute right-0 bottom-full mb-1.5 w-24 rounded-[2px] z-50 overflow-hidden"
                      style={{ background: '#0f0b04', border: '1px solid #4a2f0a', boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}
                    >
                      {[50, 75, 100, 130].map((scale) => (
                        <button
                          key={scale}
                          onClick={() => { setUiScale(scale); window.ipcRenderer?.send('set-config', { uiScale: scale }); setIsScaleDropdownOpen(false) }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold transition-all cursor-pointer flex items-center justify-between"
                          style={{
                            borderBottom: '1px solid rgba(74,47,10,0.4)',
                            color: uiScale === scale ? '#c8860a' : '#9a7a40',
                            background: uiScale === scale ? 'rgba(200,134,10,0.08)' : 'transparent',
                          }}
                        >
                          <span>{scale === 50 ? '0.5x' : scale === 75 ? '0.75x' : scale === 100 ? '1x' : '1.3x'}</span>
                          {uiScale === scale && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#c8860a' }} />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <SL>Atalhos de Teclado</SL>

            {/* Map shortcut */}
            <div className="p-3 rounded-[2px] space-y-2" style={{ background: 'rgba(13,10,5,0.5)', border: '1px solid #4a2f0a' }}>
              <div className="flex items-center justify-between">
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
                      className="p-1.5 rounded-[2px] transition-all cursor-pointer"
                      style={{ color: '#9a7a40' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#c0392b'; e.currentTarget.style.background = 'rgba(139,26,26,0.15)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#9a7a40'; e.currentTarget.style.background = 'transparent' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => { setRecordingType(recordingType === 'map' ? null : 'map'); setErrorMessage('') }}
                    className="px-3 py-1.5 rounded-[2px] text-[10px] font-bold transition-all cursor-pointer border"
                    style={recordingType === 'map'
                      ? { background: 'rgba(200,134,10,0.15)', color: '#e8a820', borderColor: 'rgba(200,134,10,0.4)' }
                      : { background: 'rgba(13,10,5,0.5)', color: '#c8860a', borderColor: '#4a2f0a' }
                    }
                  >
                    {recordingType === 'map' ? 'Pressione...' : 'Gravar novo'}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  {shortcutMap
                    ? shortcutMap.split('+').map((p, i) => <KbdKey key={i} k={p} />)
                    : <span className="text-[10px] italic" style={{ color: '#9a7a40' }}>Nenhum atalho configurado</span>
                  }
                </div>
                {recordingType === 'map' && (
                  <span className="text-[8.5px] italic animate-pulse" style={{ color: '#9a7a40' }}>Esc cancelar · Backspace limpar</span>
                )}
              </div>
            </div>

            {/* Settings shortcut */}
            <div className="p-3 rounded-[2px] space-y-2" style={{ background: 'rgba(13,10,5,0.5)', border: '1px solid #4a2f0a' }}>
              <div className="flex items-center justify-between">
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
                      className="p-1.5 rounded-[2px] transition-all cursor-pointer"
                      style={{ color: '#9a7a40' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#c0392b'; e.currentTarget.style.background = 'rgba(139,26,26,0.15)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#9a7a40'; e.currentTarget.style.background = 'transparent' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => { setRecordingType(recordingType === 'settings' ? null : 'settings'); setErrorMessage('') }}
                    className="px-3 py-1.5 rounded-[2px] text-[10px] font-bold transition-all cursor-pointer border"
                    style={recordingType === 'settings'
                      ? { background: 'rgba(200,134,10,0.15)', color: '#e8a820', borderColor: 'rgba(200,134,10,0.4)' }
                      : { background: 'rgba(13,10,5,0.5)', color: '#c8860a', borderColor: '#4a2f0a' }
                    }
                  >
                    {recordingType === 'settings' ? 'Pressione...' : 'Gravar novo'}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  {shortcutSettings
                    ? shortcutSettings.split('+').map((p, i) => <KbdKey key={i} k={p} />)
                    : <span className="text-[10px] italic" style={{ color: '#9a7a40' }}>Nenhum atalho configurado</span>
                  }
                </div>
                {recordingType === 'settings' && (
                  <span className="text-[8.5px] italic animate-pulse" style={{ color: '#9a7a40' }}>Esc cancelar · Backspace limpar</span>
                )}
              </div>
            </div>

            {errorMessage && (
              <div
                className="text-[9.5px] font-semibold px-2.5 py-1 rounded-[2px] border"
                style={{ background: 'rgba(139,26,26,0.15)', borderColor: '#8b1a1a', color: '#c0392b' }}
              >
                {errorMessage}
              </div>
            )}
          </div>
        )}
      </div>

      <span className="text-[9.5px] block text-right mt-2 flex-none" style={{ color: '#4a2f0a' }}>
        Configurações salvas localmente.
      </span>
    </div>
  )
}
export default SettingsScreen

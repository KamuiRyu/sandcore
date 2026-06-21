import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Volume2, Keyboard, Trash2 } from 'lucide-react'
import {
  ParchSection, ParchRowList, ParchRow,
  ParchPrimaryBtn, ParchSecondaryBtn, ParchToggle, ParchKbd, GoldenBox, P,
} from '../../../../components/ui/ParchmentUI'

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
        setScaleDropdownCoords({ bottom: window.innerHeight - rect.top + 6, right: window.innerWidth - rect.right });
      }
      setIsScaleDropdownOpen(true);
    }
  };

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

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ color: P.darkBrown }}>
      {/* Sub-tab nav */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 12, flexShrink: 0,
        padding: 4, borderRadius: 6,
        background: P.subtleBg, boxShadow: `inset 0 0 0 1px ${P.border}`,
      }}>
        {(['general', 'keybinds'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            style={{
              flex: 1, padding: '5px 4px', borderRadius: 4, border: 'none',
              fontFamily: P.fontLabel, fontWeight: 700, fontSize: 9, letterSpacing: '0.1em',
              cursor: 'pointer', transition: 'all .15s',
              background: activeSubTab === tab ? P.gold : 'transparent',
              boxShadow: activeSubTab === tab ? P.goldShadow : 'none',
              color: activeSubTab === tab ? P.teal : P.darkBrown,
            }}
          >
            {tab === 'general' ? 'GERAL' : 'ATALHOS'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3 pb-1">
        {activeSubTab === 'general' ? (
          <div className="space-y-4">
            <div>
              <ParchSection>Exibição</ParchSection>
              <ParchRowList>
                <ParchRow>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontFamily: P.fontValue, fontSize: 11, fontWeight: 600, color: P.darkBrown }}>Sempre no Topo</span>
                    <span style={{ fontFamily: P.fontValue, fontSize: 9, color: '#7a5030', marginTop: 2 }}>Exibe o HUD acima do jogo</span>
                  </div>
                  <ParchToggle active={alwaysOnTop} onClick={toggleAlwaysOnTop} />
                </ParchRow>
                <ParchRow>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontFamily: P.fontValue, fontSize: 11, fontWeight: 600, color: P.darkBrown }}>Lado do Painel</span>
                    <span style={{ fontFamily: P.fontValue, fontSize: 9, color: '#7a5030', marginTop: 2 }}>Calculado automaticamente</span>
                  </div>
                  <GoldenBox style={{ fontSize: 9, padding: '3px 8px' }}>
                    {layoutSide === 'left' ? 'AUTO (ESQ)' : 'AUTO (DIR)'}
                  </GoldenBox>
                </ParchRow>
                <ParchRow isLast>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontFamily: P.fontValue, fontSize: 11, fontWeight: 600, color: P.darkBrown }}>Aviso In-game</span>
                    <span style={{ fontFamily: P.fontValue, fontSize: 9, color: '#7a5030', marginTop: 2 }}>Alerta sonoro ao ver recurso</span>
                  </div>
                  <ParchToggle active={inGameNotifs} onClick={toggleInGameNotifs} />
                </ParchRow>
              </ParchRowList>
            </div>

            <div>
              <ParchSection>Áudio & Interface</ParchSection>
              <ParchRowList>
                <ParchRow vertical>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontFamily: P.fontValue, fontSize: 11, fontWeight: 600, color: P.darkBrown, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Volume2 size={13} style={{ color: '#7a5030' }} /> Volume de Avisos
                    </span>
                    <GoldenBox style={{ fontSize: 10, padding: '2px 8px' }}>{volume}%</GoldenBox>
                  </div>
                  <input
                    type="range" min="0" max="100" value={volume} onChange={handleVolumeChange}
                    className="w-full cursor-pointer h-1 rounded-full appearance-none"
                    style={{ accentColor: '#5a341a', background: P.border }}
                  />
                </ParchRow>
                <ParchRow vertical>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontFamily: P.fontValue, fontSize: 11, fontWeight: 600, color: P.darkBrown }}>Opacidade da Sidebar</span>
                    <GoldenBox style={{ fontSize: 10, padding: '2px 8px' }}>{sidebarOpacity}%</GoldenBox>
                  </div>
                  <input
                    type="range" min="20" max="100" value={sidebarOpacity}
                    onChange={(e) => { const v = parseInt(e.target.value); setSidebarOpacity(v); window.ipcRenderer?.send('set-config', { sidebarOpacity: v }) }}
                    className="w-full cursor-pointer h-1 rounded-full appearance-none"
                    style={{ accentColor: '#5a341a', background: P.border }}
                  />
                </ParchRow>
                <ParchRow isLast>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontFamily: P.fontValue, fontSize: 11, fontWeight: 600, color: P.darkBrown }}>Escala do HUD</span>
                    <span style={{ fontFamily: P.fontValue, fontSize: 9, color: '#7a5030', marginTop: 2 }}>Ajusta o tamanho da interface</span>
                  </div>
                  <div style={{ position: 'relative' }} ref={scaleDropdownRef}>
                    <ParchSecondaryBtn onClick={toggleScaleDropdown}>
                      <span>{uiScale === 75 ? '0.75x' : uiScale === 100 ? '1x' : '1.3x'}</span>
                      <svg className={`w-2 h-2 transition-transform duration-200 ${isScaleDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 1L5 5L9 1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </ParchSecondaryBtn>
                    {isScaleDropdownOpen && scaleDropdownCoords && createPortal(
                      <>
                        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsScaleDropdownOpen(false)} />
                        <div style={{
                          position: 'fixed', width: 96, borderRadius: 5, zIndex: 50, overflow: 'hidden',
                          background: '#e3cd9e', boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                          border: `1.5px solid ${P.border}`,
                          bottom: scaleDropdownCoords.bottom, right: scaleDropdownCoords.right,
                        }}>
                          {[75, 100, 130].map((scale) => (
                            <button
                              key={scale}
                              onClick={() => { setUiScale(scale); window.ipcRenderer?.send('set-config', { uiScale: scale }); setIsScaleDropdownOpen(false) }}
                              style={{
                                width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 10,
                                fontFamily: P.fontLabel, fontWeight: 700,
                                borderBottom: `1px dashed ${P.dashed}`,
                                color: uiScale === scale ? P.teal : P.darkBrown,
                                background: uiScale === scale ? P.gold : 'transparent',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              }}
                            >
                              <span>{scale === 75 ? '0.75x' : scale === 100 ? '1x' : '1.3x'}</span>
                              {uiScale === scale && <span style={{ width: 6, height: 6, borderRadius: '50%', background: P.teal, display: 'inline-block' }} />}
                            </button>
                          ))}
                        </div>
                      </>, document.body
                    )}
                  </div>
                </ParchRow>
              </ParchRowList>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <ParchSection>Atalhos de Teclado</ParchSection>
              <ParchRowList>
                {/* Map shortcut */}
                <ParchRow vertical>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontFamily: P.fontValue, fontSize: 11, fontWeight: 600, color: P.darkBrown, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Keyboard size={13} style={{ color: '#7a5030' }} /> Abrir Mapa
                      </span>
                      <span style={{ fontFamily: P.fontValue, fontSize: 9, color: '#7a5030', marginTop: 2 }}>Exibe e foca a tela de Mapa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {shortcutMap && (
                        <button
                          onClick={() => { window.ipcRenderer?.invoke('register-shortcut', { type: 'map', shortcut: '' }).then((res: any) => { if (res?.success) { setShortcutMap(''); window.ipcRenderer?.send('set-config', { shortcutMap: '' }); setErrorMessage('') } }) }}
                          style={{ padding: 6, borderRadius: 4, cursor: 'pointer', background: 'rgba(120,20,20,.08)', border: '1px solid rgba(160,40,40,.3)', color: '#c05050' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(120,20,20,.25)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(120,20,20,.08)' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      {recordingType === 'map' ? (
                        <ParchPrimaryBtn>PRESSIONE...</ParchPrimaryBtn>
                      ) : (
                        <ParchSecondaryBtn onClick={() => { setRecordingType('map'); setErrorMessage('') }}>GRAVAR NOVO</ParchSecondaryBtn>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {shortcutMap
                        ? shortcutMap.split('+').map((p, i) => <ParchKbd key={i} k={p} />)
                        : <span style={{ fontFamily: P.fontValue, fontSize: 10, fontStyle: 'italic', color: '#7a5030' }}>Nenhum atalho</span>
                      }
                    </div>
                    {recordingType === 'map' && (
                      <span style={{ fontFamily: P.fontValue, fontSize: 8.5, fontStyle: 'italic', color: '#7a5030' }} className="animate-pulse">Esc cancelar · Backspace limpar</span>
                    )}
                  </div>
                </ParchRow>

                {/* Settings shortcut */}
                <ParchRow vertical isLast>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontFamily: P.fontValue, fontSize: 11, fontWeight: 600, color: P.darkBrown, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Keyboard size={13} style={{ color: '#7a5030' }} /> Abrir Configurações
                      </span>
                      <span style={{ fontFamily: P.fontValue, fontSize: 9, color: '#7a5030', marginTop: 2 }}>Exibe e foca a tela de Configurações</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {shortcutSettings && (
                        <button
                          onClick={() => { window.ipcRenderer?.invoke('register-shortcut', { type: 'settings', shortcut: '' }).then((res: any) => { if (res?.success) { setShortcutSettings(''); window.ipcRenderer?.send('set-config', { shortcutSettings: '' }); setErrorMessage('') } }) }}
                          style={{ padding: 6, borderRadius: 4, cursor: 'pointer', background: 'rgba(120,20,20,.08)', border: '1px solid rgba(160,40,40,.3)', color: '#c05050' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(120,20,20,.25)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(120,20,20,.08)' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      {recordingType === 'settings' ? (
                        <ParchPrimaryBtn>PRESSIONE...</ParchPrimaryBtn>
                      ) : (
                        <ParchSecondaryBtn onClick={() => { setRecordingType('settings'); setErrorMessage('') }}>GRAVAR NOVO</ParchSecondaryBtn>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {shortcutSettings
                        ? shortcutSettings.split('+').map((p, i) => <ParchKbd key={i} k={p} />)
                        : <span style={{ fontFamily: P.fontValue, fontSize: 10, fontStyle: 'italic', color: '#7a5030' }}>Nenhum atalho</span>
                      }
                    </div>
                    {recordingType === 'settings' && (
                      <span style={{ fontFamily: P.fontValue, fontSize: 8.5, fontStyle: 'italic', color: '#7a5030' }} className="animate-pulse">Esc cancelar · Backspace limpar</span>
                    )}
                  </div>
                </ParchRow>
              </ParchRowList>
            </div>

            {errorMessage && (
              <div style={{
                fontSize: 9.5, fontFamily: P.fontValue, padding: '6px 10px', borderRadius: 4,
                background: 'rgba(120,20,20,.10)', border: '1px solid rgba(160,40,40,.3)', color: '#8a2020',
              }}>
                {errorMessage}
              </div>
            )}
          </div>
        )}
      </div>

      <span style={{ fontFamily: P.fontLabel, fontSize: 9, color: P.border, display: 'block', textAlign: 'right', marginTop: 8, flexShrink: 0 }}>
        Configurações salvas localmente.
      </span>
    </div>
  )
}
export default SettingsScreen

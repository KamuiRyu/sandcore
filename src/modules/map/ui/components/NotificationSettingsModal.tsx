import { useState } from 'react'
import { Bell, Play, Volume2, Monitor, MousePointer2, Eye, EyeOff, Layout, Shield } from 'lucide-react'
import { AppModal } from '../../../app/ui/components/AppModal'
import { Checkbox } from '../../../../components/ui/Checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/Select'
import {
  getMarkerTypeLabel,
  markerTypes,
  uncompletableTypes,
} from '../../core/entities/MapConfig.entity'
import type { NotificationSettings, NotificationSoundType } from '../../core/entities/NotificationSettings.entity'
import type { MapMarkerType } from '../../core/entities/MapCalibration.entity'
import { SoundSynthesizer } from '../../infrastructure/services/SoundSynthesizer.service'
import { cn } from '../../../../lib/utils'

type NotificationSettingsModalProps = {
  onClose: () => void
  settings: NotificationSettings
  onUpdate: (settings: Partial<NotificationSettings>) => void
  onRequestPushPermission: () => Promise<boolean>
}

const leadTimeOptions = [
  { value: 0, label: 'Exatamente no respawn' },
  { value: 10, label: '10 segundos antes' },
  { value: 30, label: '30 segundos antes' },
  { value: 60, label: '1 minuto antes' },
  { value: 120, label: '2 minutos antes' },
]

const soundTypeOptions = [
  { value: 'confrontation', label: 'Mensagem de Confronto' },
  { value: 'dattebayo', label: 'Dattebayo! (Naruto)' },
  { value: 'good_morning', label: 'Bom Dia! (Naruto)' },
  { value: 'jutsu', label: 'Selos de Jutsu' },
  { value: 'obito', label: 'Yoo! (Obito)' },
  { value: 'naruto_iyoo', label: 'Iyoo! (Naruto)' },
]

export function NotificationSettingsModal({
  onClose,
  settings,
  onUpdate,
  onRequestPushPermission,
}: NotificationSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'notifications' | 'visual'>('notifications')
  const isBrowserPushSupported = typeof window !== 'undefined' && 'Notification' in window

  const toggleAllTypes = (enable: boolean) => {
    const nextEnabledTypes = { ...settings.enabledTypes }
    markerTypes
      .filter((type) => !uncompletableTypes.includes(type))
      .forEach((type) => {
        nextEnabledTypes[type] = enable
      })
    nextEnabledTypes['custom'] = enable
    onUpdate({ enabledTypes: nextEnabledTypes })
  }

  const toggleType = (type: MapMarkerType | 'custom') => {
    const nextEnabledTypes = {
      ...settings.enabledTypes,
      [type]: !settings.enabledTypes[type],
    }
    onUpdate({ enabledTypes: nextEnabledTypes })
  }

  const testSound = () => {
    SoundSynthesizer.play(settings.soundType, settings.soundVolume)
  }

  return (
    <AppModal
      ariaLabel="Configurações do Mapa"
      bodyClassName="flex flex-col gap-0 p-0 overflow-hidden"
      closeLabel="Fechar configurações"
      eyebrow="CENTRAL DE COMANDO"
      footer={
        <div className="flex justify-end w-full">
          <button
            className={cn(
              'inline-flex h-10 items-center justify-center gap-2 rounded-[2px] border border-[#ffdd66]/50 bg-gradient-to-r from-[#c8860a] to-[#e0a020] px-6 font-mono text-[0.68rem] font-black uppercase tracking-[0.08em] text-black shadow-[0_0_15px_rgba(200,134,10,0.4)] transition hover:scale-105 active:scale-95 cursor-pointer'
            )}
            onClick={onClose}
            type="button"
          >
            Concluído
          </button>
        </div>
      }
      icon={Layout}
      onClose={onClose}
      title="Configurações do Sistema"
      widthClassName="w-[min(720px,100%)]"
    >
      <div className="flex flex-col sm:flex-row h-[500px]">
        {/* Sidebar de Abas */}
        <div className="w-full sm:w-[200px] border-b sm:border-b-0 sm:border-r border-white/10 bg-white/[0.02] p-3 flex sm:flex-col gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('notifications')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-[2px] transition-all duration-300 text-left cursor-pointer",
              activeTab === 'notifications' 
                ? "bg-gradient-to-r from-[#c8860a] to-[#e0a020] text-black shadow-[0_0_15px_rgba(200,134,10,0.4)] border border-[#ffdd66]/50" 
                : "text-[#9a7a40] hover:bg-white/5 hover:text-white"
            )}
          >
            <Bell size={16} strokeWidth={activeTab === 'notifications' ? 3 : 2} />
            <span className="text-[11px] uppercase tracking-wider">Alertas</span>
          </button>
          <button
            onClick={() => setActiveTab('visual')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-[2px] transition-all duration-300 text-left cursor-pointer",
              activeTab === 'visual' 
                ? "bg-gradient-to-r from-[#c8860a] to-[#e0a020] text-black shadow-[0_0_15px_rgba(200,134,10,0.4)] border border-[#ffdd66]/50" 
                : "text-[#9a7a40] hover:bg-white/5 hover:text-white"
            )}
          >
            <Monitor size={16} strokeWidth={activeTab === 'visual' ? 3 : 2} />
            <span className="text-[11px] uppercase tracking-wider">Visual & Mapa</span>
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-black/40">
          {activeTab === 'notifications' ? (
            <div className="grid gap-8 animate-[fade-in_150ms_ease-out]">
              {/* Alertas Sonoros */}
              <div className="grid gap-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="grid gap-1">
                    <h3 className="font-mono text-xs font-black uppercase tracking-wider text-white">Alertas Sonoros</h3>
                    <p className="text-[11px] text-[#9a7a40]">Tocar efeitos sonoros quando os timers expirarem.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdate({ soundEnabled: !settings.soundEnabled })}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                      settings.soundEnabled ? 'bg-[#c8860a]' : 'bg-[#1a1a1a]'
                    )}
                  >
                    <span className={cn('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out', settings.soundEnabled ? 'translate-x-5' : 'translate-x-0')} />
                  </button>
                </div>

                {settings.soundEnabled && (
                  <div className="grid gap-5 p-4 rounded-[2px] bg-white/[0.03] border border-white/5">
                    <div className="grid gap-2">
                      <label className="text-[10px] font-black uppercase text-[#9a7a40]">Efeito Sonoro</label>
                      <div className="flex items-center gap-3">
                        <Select value={settings.soundType} onValueChange={(v) => { onUpdate({ soundType: v as NotificationSoundType }); SoundSynthesizer.play(v as NotificationSoundType, settings.soundVolume) }}>
                          <SelectTrigger className="flex-1 border-white/10 bg-black/40 text-[#f0d9a0] h-10 px-4 rounded-[2px]"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#111111] border-white/10 text-[#f0d9a0]">
                            {soundTypeOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value} className="hover:bg-white/5 focus:bg-white/10">{opt.label}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <button onClick={testSound} className="grid h-10 w-10 place-items-center rounded-[2px] bg-white/5 border border-white/10 text-white hover:text-[#c8860a] transition-all cursor-pointer"><Play size={14} fill="currentColor" /></button>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-[10px] font-black uppercase text-[#9a7a40] flex items-center gap-2"><Volume2 size={12} /> Volume ({Math.round(settings.soundVolume * 100)}%)</label>
                      <input type="range" min="0" max="1" step="0.05" value={settings.soundVolume} onChange={(e) => onUpdate({ soundVolume: parseFloat(e.target.value) })} className="w-full h-1 bg-[#1a1a1a] rounded-[2px] appearance-none cursor-pointer accent-[#c8860a]" />
                    </div>
                  </div>
                )}
              </div>

              <div className="h-px bg-white/5" />

              {/* Push & Antecedência */}
              <div className="grid gap-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="grid gap-1">
                    <h3 className="font-mono text-xs font-black uppercase tracking-wider text-white">Browser Push</h3>
                    <p className="text-[11px] text-[#9a7a40]">Alertas mesmo se a aba estiver em segundo plano.</p>
                  </div>
                  {isBrowserPushSupported ? (
                    <button type="button" onClick={() => settings.pushEnabled ? onUpdate({ pushEnabled: false }) : onRequestPushPermission()} className={cn('relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors', settings.pushEnabled ? 'bg-[#c8860a]' : 'bg-[#1a1a1a]')}><span className={cn('inline-block h-5 w-5 transform rounded-full bg-white transition', settings.pushEnabled ? 'translate-x-5' : 'translate-x-0')} /></button>
                  ) : (<span className="text-[9px] font-mono text-red-400 bg-red-400/10 px-2 py-1 rounded">NÃO SUPORTADO</span>)}
                </div>

                <div className="grid gap-2">
                  <label className="text-[10px] font-black uppercase text-[#9a7a40]">Antecedência do Alerta</label>
                  <Select value={String(settings.leadTime)} onValueChange={(v) => onUpdate({ leadTime: parseInt(v, 10) })}>
                    <SelectTrigger className="w-full border-white/10 bg-black/40 text-[#f0d9a0] h-10 px-4 rounded-[2px]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#111111] border-white/10 text-[#f0d9a0]">{leadTimeOptions.map((opt) => (<SelectItem key={opt.value} value={String(opt.value)} className="hover:bg-white/5 focus:bg-white/10">{opt.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Categorias */}
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-xs font-black uppercase tracking-wider text-white">Filtrar Alertas</h3>
                  <div className="flex gap-2 font-mono text-[9px] font-black uppercase">
                    <button onClick={() => toggleAllTypes(true)} className="text-[#c8860a] hover:brightness-125 cursor-pointer bg-transparent border-0 outline-none">Todos</button>
                    <span className="opacity-20 text-white">|</span>
                    <button onClick={() => toggleAllTypes(false)} className="text-[#9a7a40] hover:text-[#f0d9a0] cursor-pointer bg-transparent border-0 outline-none">Nenhum</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-y-2.5 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="flex items-center gap-3"><Checkbox id="cat-custom" checked={settings.enabledTypes['custom'] !== false} onCheckedChange={() => toggleType('custom')} /><label htmlFor="cat-custom" className="text-xs font-medium text-[#f0d9a0] cursor-pointer select-none">Pinos Customizados</label></div>
                  {markerTypes.filter(t => !uncompletableTypes.includes(t)).map(type => (
                    <div key={type} className="flex items-center gap-3"><Checkbox id={`cat-${type}`} checked={settings.enabledTypes[type] !== false} onCheckedChange={() => toggleType(type)} /><label htmlFor={`cat-${type}`} className="text-xs font-medium text-[#9a7a40] cursor-pointer select-none">{getMarkerTypeLabel(type)}</label></div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 animate-[fade-in_150ms_ease-out]">
              <div className="grid gap-6">
                <h3 className="font-mono text-xs font-black uppercase tracking-wider text-white">Comportamento do Mapa</h3>
                
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 rounded-[2px] bg-white/[0.03] border border-white/5 group hover:border-white/10 transition-all">
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <MousePointer2 size={14} className="text-[#c8860a]" />
                        <span className="text-[11px] font-black uppercase text-white">Lembrar Escolha Rápida</span>
                      </div>
                      <p className="text-[10px] text-[#9a7a40] leading-relaxed">Sugere automaticamente o último recurso coletado naquele tipo de node.</p>
                    </div>
                    <button onClick={() => onUpdate({ rememberLastSubtype: !settings.rememberLastSubtype })} className={cn('relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all', settings.rememberLastSubtype ? 'bg-[#c8860a]' : 'bg-[#1a1a1a]')}><span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition', settings.rememberLastSubtype ? 'translate-x-5' : 'translate-x-0')} /></button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-[2px] bg-white/[0.03] border border-white/5 group hover:border-white/10 transition-all">
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <EyeOff size={14} className="text-orange-400" />
                        <span className="text-[11px] font-black uppercase text-white">Esconder Inativos</span>
                      </div>
                      <p className="text-[10px] text-[#9a7a40] leading-relaxed">Ocultar spots que não possuem marcação ou timer ativo (limpeza visual).</p>
                    </div>
                    <button onClick={() => onUpdate({ hideUnmarkedResources: !settings.hideUnmarkedResources })} className={cn('relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all', settings.hideUnmarkedResources ? 'bg-[#c8860a]' : 'bg-[#1a1a1a]')}><span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition', settings.hideUnmarkedResources ? 'translate-x-5' : 'translate-x-0')} /></button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-[2px] bg-white/[0.03] border border-white/5 group hover:border-white/10 transition-all">
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <Eye size={14} className="text-emerald-400" />
                        <span className="text-[11px] font-black uppercase text-white">Alertas de Pronto (!)</span>
                      </div>
                      <p className="text-[10px] text-[#9a7a40] leading-relaxed">Exibir selo ninja laranja e brilho em recursos que terminaram o tempo.</p>
                    </div>
                    <button onClick={() => onUpdate({ showReadyAlerts: !settings.showReadyAlerts })} className={cn('relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all', settings.showReadyAlerts ? 'bg-[#c8860a]' : 'bg-[#1a1a1a]')}><span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition', settings.showReadyAlerts ? 'translate-x-5' : 'translate-x-0')} /></button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-[2px] bg-white/[0.03] border border-white/5 group hover:border-white/10 transition-all">
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <Layout size={14} className="text-[#c8860a]" />
                        <span className="text-[11px] font-black uppercase text-white">Nomes das Sub-regiões</span>
                      </div>
                      <p className="text-[10px] text-[#9a7a40] leading-relaxed">Exibir nomes das sub-regiões (como Vale do Fim) flutuando no mapa.</p>
                    </div>
                    <button onClick={() => onUpdate({ showSubRegionNames: settings.showSubRegionNames !== false ? false : true })} className={cn('relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all', settings.showSubRegionNames !== false ? 'bg-[#c8860a]' : 'bg-[#1a1a1a]')}><span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition', settings.showSubRegionNames !== false ? 'translate-x-5' : 'translate-x-0')} /></button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-[2px] bg-white/[0.03] border border-white/5 group hover:border-white/10 transition-all">
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <Shield size={14} className="text-yellow-400" />
                        <span className="text-[11px] font-black uppercase text-white">Marcação Padrão (Grupo/Pessoal)</span>
                      </div>
                      <p className="text-[10px] text-[#9a7a40] leading-relaxed">Se ativado, novas marcações serão feitas para o Grupo por padrão.</p>
                    </div>
                    <button onClick={() => onUpdate({ defaultPinVisibility: settings.defaultPinVisibility === 'group' ? 'private' : 'group' })} className={cn('relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all', settings.defaultPinVisibility === 'group' ? 'bg-yellow-500' : 'bg-[#1a1a1a]')}><span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition', settings.defaultPinVisibility === 'group' ? 'translate-x-5' : 'translate-x-0')} /></button>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/5" />
              
              <div className="rounded-[2px] border border-yellow-500/10 bg-yellow-500/5 p-4 flex gap-4">
                 <Shield size={18} className="text-yellow-500 shrink-0 mt-1" />
                 <div className="grid gap-1">
                    <h4 className="text-[11px] font-black uppercase text-yellow-500">Configurações de Grupo</h4>
                    <p className="text-[10px] text-[#9a7a40] leading-relaxed">Alertas globais de outros membros do clã estão ativos por padrão na sua conta se você estiver em um grupo.</p>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppModal>
  )
}

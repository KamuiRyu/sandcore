import { useState, useEffect } from 'react'
import { Info, HelpCircle, HardDrive, Trash2, ShieldCheck, Zap, RefreshCw } from 'lucide-react'
import { pb } from '../../../../lib/pocketbase'

export const AppDetailsScreen = () => {
  const [pocketbaseConnected, setPocketbaseConnected] = useState(false)
  const [clearingCache, setClearingCache] = useState(false)
  const [clearingStats, setClearingStats] = useState(false)
  const [uiScale, setUiScale] = useState(100)
  const [alwaysOnTop, setAlwaysOnTop] = useState(true)

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  useEffect(() => {
    // Check connection to pocketbase
    pb.send('/api/health', { method: 'GET' })
      .then(() => setPocketbaseConnected(true))
      .catch(() => setPocketbaseConnected(false))

    // Fetch scaling config
    if (window.ipcRenderer) {
      window.ipcRenderer.getConfig().then((config) => {
        if (config) {
          if ('uiScale' in config) setUiScale(config.uiScale)
          if ('alwaysOnTop' in config) setAlwaysOnTop(config.alwaysOnTop)
        }
      })
    }
  }, [])

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm()
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleClearCache = () => {
    triggerConfirm(
      'Limpar Marcações',
      'Deseja limpar as marcações ativas do mapa salvas localmente? Esta ação não pode ser desfeita.',
      () => {
        setClearingCache(true)
        try {
          localStorage.removeItem('shinobi-map-completed-pins')
          window.ipcRenderer?.send('close-panel-window')
          setTimeout(() => {
            window.location.reload()
          }, 300)
        } catch (e) {
          console.error(e)
          setClearingCache(false)
        }
      }
    )
  }

  const handleClearStats = () => {
    triggerConfirm(
      'Limpar Estatísticas',
      'Deseja limpar todo o histórico de coletas (Estatísticas)? Esta ação não pode ser desfeita.',
      () => {
        setClearingStats(true)
        try {
          localStorage.removeItem('shinobi-map-stats-history')
          window.ipcRenderer?.send('close-panel-window')
          setTimeout(() => {
            window.location.reload()
          }, 300)
        } catch (e) {
          console.error(e)
          setClearingStats(false)
        }
      }
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden text-slate-200 relative">
      {/* Title */}
      <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-1">
        <Info className="w-5 h-5 text-teal-400" />
        Detalhes da Aplicação
      </h2>
      <div className="h-[1px] bg-slate-800/60 w-full mb-4"></div>

      {/* Main Content Info */}
      <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1 custom-scrollbar space-y-4">
        {/* App Logo and Info */}
        <div className="bg-[#11161D]/55 border border-slate-800/60 p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-none">
            <img 
              src="/images/logo_mini.webp" 
              alt="Logo" 
              className="w-7 h-7 object-contain"
              draggable={false}
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-slate-100 text-sm tracking-wide">SHINOBI MAP HUD</h3>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Versão 1.2.0 • Build Electron</p>
          </div>
        </div>

        {/* System Diagnostics */}
        <div className="space-y-2">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 ml-1">
            Diagnóstico do Sistema
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#11161D] border border-slate-800/80 p-3 rounded-lg flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Zap size={13} className="text-teal-400" />
                Servidor API
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                pocketbaseConnected 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {pocketbaseConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="bg-[#11161D] border border-slate-800/80 p-3 rounded-lg flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-teal-400" />
                IPC Electron
              </span>
              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                CONECTADO
              </span>
            </div>
          </div>
        </div>

        {/* App Config Summary */}
        <div className="space-y-2">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 ml-1">
            Configuração Ativa
          </span>
          <div className="bg-[#11161D] border border-slate-800/80 p-3.5 rounded-lg space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Escala de Interface</span>
              <span className="font-semibold text-slate-200">{uiScale}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sempre no Topo (Always-On-Top)</span>
              <span className="font-semibold text-slate-200">{alwaysOnTop ? 'Ativo' : 'Inativo'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Atalho - Abrir Mapa</span>
              <span className="font-mono text-teal-400 font-bold bg-[#0B0E12] px-1.5 py-0.5 rounded border border-slate-800">Ctrl + Alt + M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Atalho - Configurações</span>
              <span className="font-mono text-teal-400 font-bold bg-[#0B0E12] px-1.5 py-0.5 rounded border border-slate-800">Ctrl + Alt + S</span>
            </div>
          </div>
        </div>

        {/* Action / Troubleshooting utilities */}
        <div className="space-y-2">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 ml-1">
            Ferramentas de Suporte
          </span>
          <div className="space-y-2">
            <button
              onClick={handleClearCache}
              disabled={clearingCache}
              className="w-full flex items-center justify-between bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg text-xs text-rose-400 transition-colors disabled:opacity-50 cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <Trash2 size={14} />
                Limpar Marcações Ativas do Mapa
              </span>
              <HardDrive size={14} />
            </button>
            <button
              onClick={handleClearStats}
              disabled={clearingStats}
              className="w-full flex items-center justify-between bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg text-xs text-rose-400 transition-colors disabled:opacity-50 cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <Trash2 size={14} />
                Limpar Histórico de Estatísticas
              </span>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Beautiful Custom Confirm Modal Overlay */}
      {confirmModal.isOpen && (
        <div className="absolute inset-0 bg-[#080A0C]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0B0E12] border border-[#222B37] rounded-2xl p-5 w-full max-w-sm flex flex-col gap-4 shadow-[0_0_50px_rgba(0,0,0,0.85)] border-t border-t-rose-500/30 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center flex-none">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <h4 className="text-sm font-bold text-white tracking-wide">{confirmModal.title}</h4>
                <p className="text-[11px] text-slate-400 leading-normal">{confirmModal.message}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-1">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center transition-all cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.35)]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppDetailsScreen

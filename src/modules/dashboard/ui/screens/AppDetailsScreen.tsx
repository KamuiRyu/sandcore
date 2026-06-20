import { useState, useEffect } from "react";
import { HardDrive, Trash2, ShieldCheck, Zap, RefreshCw } from "lucide-react";
import { pb } from "../../../../lib/pocketbase";

const SL = ({ children }: { children: string }) => (
  <div className="flex items-center gap-2.5 mb-2">
    <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, #4a2f0a)' }} />
    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9a7a40' }}>
      {children}
    </span>
    <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #4a2f0a, transparent)' }} />
  </div>
)

export const AppDetailsScreen = () => {
  const [pocketbaseConnected, setPocketbaseConnected] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [clearingStats, setClearingStats] = useState(false);
  const [uiScale, setUiScale] = useState(100);
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);

  const [appVersion, setAppVersion] = useState("1.0.6-beta");
  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "checking" | "available" | "not-available" | "downloading" | "downloaded" | "error"
  >("idle");
  const [updateVersion, setUpdateVersion] = useState("");
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [updaterError, setUpdaterError] = useState("");

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  useEffect(() => {
    pb.send("/api/health", { method: "GET" })
      .then(() => setPocketbaseConnected(true))
      .catch(() => setPocketbaseConnected(false));

    if (window.ipcRenderer) {
      window.ipcRenderer.getConfig().then((config) => {
        if (config) {
          if ("uiScale" in config) setUiScale(config.uiScale);
          if ("alwaysOnTop" in config) setAlwaysOnTop(config.alwaysOnTop);
        }
      });
      window.ipcRenderer.invoke("get-app-version")
        .then((v) => { if (v) setAppVersion(v) })
        .catch((err) => console.error(err));

      const handleUpdateStatus = (_event: any, data: { status: any; version?: string; message?: string }) => {
        let status = data.status;
        const lowerMsg = (data.message || "").toLowerCase();
        if (status === "error" && (lowerMsg.includes("no published versions") || lowerMsg.includes("notfound") || lowerMsg.includes("not found") || lowerMsg.includes("404"))) {
          status = "not-available";
        }
        setUpdateStatus(status);
        if (data.version) setUpdateVersion(data.version);
        if (data.message) setUpdaterError(data.message);
        if (status === "not-available") setTimeout(() => setUpdateStatus("idle"), 3000);
      };
      const handleUpdateProgress = (_event: any, data: { percent: number }) => {
        setUpdateStatus("downloading"); setDownloadPercent(data.percent);
      };
      window.ipcRenderer.on("update-status", handleUpdateStatus);
      window.ipcRenderer.on("update-progress", handleUpdateProgress);
      return () => {
        window.ipcRenderer?.off("update-status", handleUpdateStatus);
        window.ipcRenderer?.off("update-progress", handleUpdateProgress);
      };
    }
  }, []);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm: () => { onConfirm(); setConfirmModal((p) => ({ ...p, isOpen: false })) } });
  };

  const handleClearCache = () => {
    triggerConfirm("Limpar Marcações", "Deseja limpar as marcações ativas do mapa salvas localmente? Esta ação não pode ser desfeita.", () => {
      setClearingCache(true);
      try { localStorage.removeItem("shinobi-map-completed-pins"); window.ipcRenderer?.send("close-panel-window"); setTimeout(() => window.location.reload(), 300); }
      catch (e) { console.error(e); setClearingCache(false); }
    });
  };

  const handleClearStats = () => {
    triggerConfirm("Limpar Estatísticas", "Deseja limpar todo o histórico de coletas? Esta ação não pode ser desfeita.", async () => {
      setClearingStats(true);
      try {
        localStorage.removeItem("shinobi-map-stats-history");
        let userId = pb.authStore.model?.id;
        if (!userId) { const pbAuth = localStorage.getItem("pocketbase_auth"); if (pbAuth) { try { const d = JSON.parse(pbAuth); userId = d.model?.id; if (d.token) pb.authStore.save(d.token, d.model); } catch {} } }
        if (userId) {
          try {
            const records = await pb.collection("user_map_stats").getFullList({ filter: `owner = "${userId}"` });
            for (const r of records) {
              try { await pb.collection("user_map_stats").delete(r.id); }
              catch { await pb.collection("user_map_stats").update(r.id, { ore_count: {}, mushroom_count: {}, plant_count: {}, stick_count: 0 }); }
            }
          } catch (err) { console.error(err); }
        }
        setClearingStats(false); window.ipcRenderer?.send("close-panel-window"); setTimeout(() => window.location.reload(), 300);
      } catch (e) { console.error(e); setClearingStats(false); }
    });
  };

  const handleCheckForUpdates = () => { if (window.ipcRenderer) { setUpdaterError(""); window.ipcRenderer.send("check-for-updates"); } };
  const handleInstallUpdate = () => { if (window.ipcRenderer) window.ipcRenderer.send("quit-and-install-update"); };

  return (
    <div className="flex flex-col h-full overflow-hidden relative" style={{ color: '#e8d5a0' }}>
      <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1 custom-scrollbar space-y-4">

        {/* App info */}
        <div className="p-3 rounded-[2px] flex items-center gap-3" style={{ background: 'rgba(74,47,10,0.15)', border: '1px solid #4a2f0a' }}>
          <div className="w-11 h-11 rounded-[2px] flex items-center justify-center flex-none" style={{ background: 'rgba(13,10,5,0.6)', border: '1px solid #c8860a', boxShadow: '0 0 12px rgba(200,134,10,0.25)' }}>
            <img src="./images/logo_mini.webp" alt="Logo" className="w-7 h-7 object-contain" draggable={false} />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-sm tracking-wide" style={{ fontFamily: "'Cinzel', serif", color: '#f0d9a0' }}>
              SHINOBI MAP HUD
            </h3>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: '#9a7a40' }}>
              v{appVersion} · Build Electron
            </p>
          </div>
        </div>

        {/* Diagnostics */}
        <div>
          <SL>Diagnóstico do Sistema</SL>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Servidor API', icon: Zap, ok: pocketbaseConnected },
              { label: 'IPC Electron', icon: ShieldCheck, ok: true },
            ].map(({ label, icon: Icon, ok }) => (
              <div key={label} className="p-2.5 rounded-[2px] flex items-center justify-between" style={{ background: 'rgba(13,10,5,0.5)', border: '1px solid #4a2f0a' }}>
                <span className="text-xs flex items-center gap-1.5" style={{ color: '#c8a060' }}>
                  <Icon size={12} style={{ color: '#9a7a40' }} /> {label}
                </span>
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-[2px]"
                  style={ok
                    ? { background: 'rgba(45,110,45,0.2)', border: '1px solid #2d6e2d', color: '#4caf50' }
                    : { background: 'rgba(139,26,26,0.2)', border: '1px solid #8b1a1a', color: '#e07070' }
                  }
                >
                  {ok ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Update */}
        <div>
          <SL>Atualização do Software</SL>
          <div className="p-3 rounded-[2px] space-y-3" style={{ background: 'rgba(13,10,5,0.5)', border: '1px solid #4a2f0a' }}>
            {updateStatus === "idle" && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold" style={{ color: '#e8d5a0' }}>Verificar atualizações</div>
                  <div className="text-[10px]" style={{ color: '#9a7a40' }}>Verifique se há novas versões</div>
                </div>
                <button
                  onClick={handleCheckForUpdates}
                  className="px-3 py-1.5 rounded-[2px] font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg,#4a2f0a,#c8860a)', color: '#0d0a05', boxShadow: '0 2px 8px rgba(200,134,10,0.3)' }}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Verificar
                </button>
              </div>
            )}
            {updateStatus === "checking" && (
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4 animate-spin" style={{ color: '#c8860a' }} />
                <div>
                  <div className="text-xs font-semibold" style={{ color: '#e8d5a0' }}>Buscando atualizações...</div>
                  <div className="text-[10px]" style={{ color: '#9a7a40' }}>Conectando ao servidor</div>
                </div>
              </div>
            )}
            {updateStatus === "available" && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: '#c8860a' }}>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Nova versão {updateVersion}!
                </div>
                <div className="text-[10px]" style={{ color: '#9a7a40' }}>Iniciando download automático...</div>
              </div>
            )}
            {updateStatus === "downloading" && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono" style={{ color: '#9a7a40' }}>
                  <span>Baixando ({updateVersion})...</span>
                  <span className="font-bold" style={{ color: '#c8860a' }}>{downloadPercent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#2e1f08' }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${downloadPercent}%`, background: 'linear-gradient(90deg,#4a2f0a,#c8860a)' }} />
                </div>
              </div>
            )}
            {updateStatus === "downloaded" && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold" style={{ color: '#4caf50' }}>Atualização {updateVersion} pronta!</div>
                  <div className="text-[10px]" style={{ color: '#9a7a40' }}>Reinicie para aplicar</div>
                </div>
                <button onClick={handleInstallUpdate} className="px-3 py-1.5 rounded-[2px] font-bold text-xs cursor-pointer transition-all" style={{ background: 'rgba(45,110,45,0.25)', border: '1px solid #2d6e2d', color: '#4caf50' }}>
                  Reiniciar
                </button>
              </div>
            )}
            {updateStatus === "not-available" && (
              <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#4caf50' }}>
                <ShieldCheck className="w-4 h-4" />
                <div>
                  <div>Você está atualizado</div>
                  <div className="text-[10px] font-mono" style={{ color: '#9a7a40' }}>v{appVersion} é a última versão</div>
                </div>
              </div>
            )}
            {updateStatus === "error" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: '#c0392b' }}>Falha ao atualizar</span>
                  <button onClick={handleCheckForUpdates} className="px-2.5 py-1 rounded-[2px] text-[10px] font-semibold cursor-pointer transition-all" style={{ background: 'rgba(139,26,26,0.2)', border: '1px solid #8b1a1a', color: '#e07070' }}>
                    Tentar Novamente
                  </button>
                </div>
                <p className="text-[10px] font-mono leading-tight" style={{ color: '#9a7a40' }}>{updaterError || "Erro ao conectar ao servidor."}</p>
              </div>
            )}
          </div>
        </div>

        {/* Config summary */}
        <div>
          <SL>Configuração Ativa</SL>
          <div className="rounded-[2px] overflow-hidden" style={{ border: '1px solid #4a2f0a' }}>
            {[
              { label: 'Escala de Interface', value: `${uiScale}%`, isKbd: false },
              { label: 'Sempre no Topo', value: alwaysOnTop ? '● Ativo' : '○ Inativo', isKbd: false, ok: alwaysOnTop },
              { label: 'Atalho – Abrir Mapa', value: 'Ctrl+Alt+M', isKbd: true },
              { label: 'Atalho – Configurações', value: 'Ctrl+Alt+S', isKbd: true },
            ].map(({ label, value, isKbd, ok }, i, arr) => (
              <div
                key={label}
                className="flex items-center justify-between px-3 py-2 text-[10px]"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(74,47,10,0.4)' : 'none', background: 'rgba(13,10,5,0.5)' }}
              >
                <span style={{ color: '#c8a060' }}>{label}</span>
                {isKbd ? (
                  <span className="flex items-center gap-1">
                    {value.split('+').map((k, ki) => (
                      <span key={ki} className="flex items-center gap-1">
                        {ki > 0 && <span style={{ color: '#9a7a40', fontSize: 9 }}>+</span>}
                        <span className="px-1.5 py-0.5 rounded-[2px] font-mono text-[9px]" style={{ background: '#2e1f08', border: '1px solid #c8860a', borderBottomWidth: 2, color: '#d4a85a' }}>{k}</span>
                      </span>
                    ))}
                  </span>
                ) : (
                  <span style={{ color: ok === undefined ? '#e8d5a0' : ok ? '#4caf50' : '#9a7a40' }}>{value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Support tools */}
        <div>
          <SL>Ferramentas de Suporte</SL>
          <div className="space-y-2">
            <button
              onClick={handleClearCache} disabled={clearingCache}
              className="w-full flex items-center justify-between p-2.5 rounded-[2px] text-xs transition-colors disabled:opacity-50 cursor-pointer text-left border"
              style={{ background: 'rgba(139,26,26,0.08)', borderColor: '#8b1a1a', color: '#c0392b' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,26,26,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(139,26,26,0.08)')}
            >
              <span className="flex items-center gap-2"><Trash2 size={14} /> Limpar Marcações Ativas do Mapa</span>
              <HardDrive size={14} />
            </button>
            <button
              onClick={handleClearStats} disabled={clearingStats}
              className="w-full flex items-center justify-between p-2.5 rounded-[2px] text-xs transition-colors disabled:opacity-50 cursor-pointer text-left border"
              style={{ background: 'rgba(139,26,26,0.08)', borderColor: '#8b1a1a', color: '#c0392b' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,26,26,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(139,26,26,0.08)')}
            >
              <span className="flex items-center gap-2"><Trash2 size={14} /> Limpar Histórico de Estatísticas</span>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmModal.isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,10,5,0.9)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm flex flex-col gap-4 rounded-[2px] p-5" style={{ background: '#1a1208', border: '1px solid #8b1a1a', boxShadow: '0 0 40px rgba(0,0,0,0.9)' }}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-[2px] flex items-center justify-center flex-none" style={{ background: 'rgba(139,26,26,0.2)', border: '1px solid #8b1a1a' }}>
                <Trash2 className="w-4 h-4" style={{ color: '#c0392b' }} />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <h4 className="text-sm font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#f0d9a0' }}>{confirmModal.title}</h4>
                <p className="text-[11px] leading-normal" style={{ color: '#9a7a40' }}>{confirmModal.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmModal((p) => ({ ...p, isOpen: false }))}
                className="px-4 py-2 rounded-[2px] font-bold text-xs cursor-pointer transition-all"
                style={{ background: 'rgba(74,47,10,0.4)', border: '1px solid #4a2f0a', color: '#9a7a40' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 rounded-[2px] font-bold text-xs cursor-pointer transition-all"
                style={{ background: 'rgba(139,26,26,0.3)', border: '1px solid #8b1a1a', color: '#e07070' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AppDetailsScreen;

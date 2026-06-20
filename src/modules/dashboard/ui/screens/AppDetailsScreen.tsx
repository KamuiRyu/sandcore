import { useState, useEffect } from "react";
import { ShieldCheck, Zap, RefreshCw, Trash2, RotateCcw, FileText } from "lucide-react";
import { pb } from "../../../../lib/pocketbase";

const SL = ({ children }: { children: string }) => (
  <div className="flex items-center gap-2 mb-2">
    <span style={{ color: '#c8a030', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>[</span>
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c8a030', whiteSpace: 'nowrap' }}>
      {children}
    </span>
    <div className="flex-1" style={{ borderTop: '1px dashed rgba(200,160,48,0.25)' }} />
    <span style={{ color: '#c8a030', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>]</span>
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
      try { localStorage.removeItem("shinobi-map-completed-pins"); setTimeout(() => window.location.reload(), 300); }
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
        setClearingStats(false); setTimeout(() => window.location.reload(), 300);
      } catch (e) { console.error(e); setClearingStats(false); }
    });
  };

  const handleCheckForUpdates = () => { if (window.ipcRenderer) { setUpdaterError(""); window.ipcRenderer.send("check-for-updates"); } };
  const handleInstallUpdate = () => { if (window.ipcRenderer) window.ipcRenderer.send("quit-and-install-update"); };

  const statusDot = (ok: boolean) => (
    <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: ok ? '#4caf50' : '#cc3333', boxShadow: ok ? '0 0 5px rgba(76,175,80,0.6)' : '0 0 5px rgba(204,51,51,0.6)', flexShrink: 0 }} />
  );

  const Kbd = ({ k }: { k: string }) => (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 3, background: '#1c1508', border: '1px solid #c8860a', borderBottomWidth: 2, color: '#e8b840', letterSpacing: '0.06em' }}>{k}</span>
  );

  return (
    <div className="relative" style={{ color: '#e8d5a0' }}>
      <div className="flex flex-col" style={{ gap: 12, paddingBottom: 8 }}>

        {/* App info */}
        <div style={{ background: 'rgba(13,10,4,0.7)', border: '1px solid #3a2508', borderRadius: 3, padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: 'linear-gradient(180deg,#c8860a,#7a4e08)' }} />
          {/* Corner brackets */}
          <div style={{ position: 'absolute', top: 6, left: 6, width: 10, height: 10, borderTop: '1px solid #c8860a', borderLeft: '1px solid #c8860a' }} />
          <div style={{ position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderTop: '1px solid #c8860a', borderRight: '1px solid #c8860a' }} />
          <div style={{ position: 'absolute', bottom: 6, left: 6, width: 10, height: 10, borderBottom: '1px solid #c8860a', borderLeft: '1px solid #c8860a' }} />
          <div style={{ position: 'absolute', bottom: 6, right: 6, width: 10, height: 10, borderBottom: '1px solid #c8860a', borderRight: '1px solid #c8860a' }} />
          <div style={{ width: 52, height: 52, borderRadius: 4, background: 'rgba(200,134,10,0.08)', border: '1px solid #c8860a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="./images/logo_mini.webp" alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} draggable={false} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 900, color: '#ffffff', letterSpacing: '0.12em', margin: 0 }}>
              SHINOBI MAP HUD
            </h3>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#c8a030', margin: '4px 0 0', letterSpacing: '0.08em' }}>
              v{appVersion} · BUILD ELECTRON
            </p>
          </div>
        </div>

        {/* Diagnostics */}
        <div>
          <SL>Diagnóstico do Sistema</SL>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: 'Servidor API', icon: Zap, ok: pocketbaseConnected },
              { label: 'IPC Electron', icon: ShieldCheck, ok: true },
            ].map(({ label, icon: Icon, ok }) => (
              <div key={label} style={{ padding: '8px 10px', borderRadius: 3, background: 'rgba(13,10,4,0.8)', border: '1px solid #2e1e06', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: '#c8c8b0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon size={12} style={{ color: '#9a7a40' }} /> {label}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: ok ? '#4caf50' : '#cc3333', letterSpacing: '0.06em' }}>
                  {statusDot(ok)} {ok ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Update */}
        <div>
          <SL>Atualização do Software</SL>
          <div style={{ padding: '10px 12px', borderRadius: 3, background: 'rgba(13,10,4,0.8)', border: '1px solid #2e1e06' }}>
            {updateStatus === "idle" && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f0e8c0' }}>Verificar atualizações</div>
                  <div style={{ fontSize: 10, color: '#7a8060', marginTop: 3 }}>Verifique se há novas versões</div>
                </div>
                <button
                  onClick={handleCheckForUpdates}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 4, background: 'linear-gradient(135deg,#b87a08,#e8a820)', color: '#0a0800', border: 'none', fontWeight: 700, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  <RefreshCw size={12} /> VERIFICAR
                </button>
              </div>
            )}
            {updateStatus === "checking" && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <RefreshCw size={16} style={{ color: '#c8860a', animation: 'spin 1s linear infinite' }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#f0e8c0' }}>Buscando atualizações...</div>
                  <div style={{ fontSize: 9, color: '#7a8060', marginTop: 2 }}>Conectando ao servidor</div>
                </div>
              </div>
            )}
            {updateStatus === "available" && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={14} style={{ color: '#c8860a', animation: 'spin 1s linear infinite' }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#c8860a' }}>Nova versão {updateVersion}!</div>
                  <div style={{ fontSize: 9, color: '#7a8060', marginTop: 2 }}>Iniciando download automático...</div>
                </div>
              </div>
            )}
            {updateStatus === "downloading" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#7a8060' }}>
                  <span>Baixando ({updateVersion})...</span>
                  <span style={{ color: '#c8860a', fontWeight: 700 }}>{downloadPercent}%</span>
                </div>
                <div style={{ width: '100%', height: 4, borderRadius: 2, background: '#1e1e0e', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${downloadPercent}%`, background: 'linear-gradient(90deg,#b87a08,#e8a820)', borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
              </div>
            )}
            {updateStatus === "downloaded" && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#4caf50' }}>Atualização {updateVersion} pronta!</div>
                  <div style={{ fontSize: 9, color: '#7a8060', marginTop: 2 }}>Reinicie para aplicar</div>
                </div>
                <button onClick={handleInstallUpdate} style={{ padding: '7px 14px', borderRadius: 4, background: 'linear-gradient(135deg,#b87a08,#e8a820)', color: '#0a0800', fontWeight: 700, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer', letterSpacing: '0.08em', border: 'none' }}>
                  REINICIAR
                </button>
              </div>
            )}
            {updateStatus === "not-available" && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} style={{ color: '#4caf50' }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#4caf50' }}>Você está atualizado</div>
                  <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#7a8060', marginTop: 2 }}>v{appVersion} é a última versão</div>
                </div>
              </div>
            )}
            {updateStatus === "error" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#cc3333' }}>Falha ao atualizar</span>
                  <button onClick={handleCheckForUpdates} style={{ padding: '5px 10px', borderRadius: 3, background: 'rgba(120,20,20,0.2)', border: '1px solid #7a1414', color: '#e07070', fontWeight: 700, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer', letterSpacing: '0.08em' }}>
                    TENTAR NOVAMENTE
                  </button>
                </div>
                <p style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#7a8060', margin: 0, lineHeight: 1.5 }}>{updaterError || "Erro ao conectar ao servidor."}</p>
              </div>
            )}
          </div>
        </div>

        {/* Config summary */}
        <div>
          <SL>Configuração Ativa</SL>
          <div style={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #2e1e06' }}>
            {[
              { label: 'Escala de Interface', render: () => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 3, background: '#0d0e0a', border: '1px solid #2e3020', color: '#f0e8c0' }}>{uiScale}%</span> },
              { label: 'Sempre no Topo', render: () => <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: alwaysOnTop ? '#4caf50' : '#7a8060', letterSpacing: '0.06em' }}>{statusDot(alwaysOnTop)} {alwaysOnTop ? 'ATIVO' : 'INATIVO'}</span> },
              { label: 'Atalho — Abrir Mapa', render: () => <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Kbd k="Ctrl" /><span style={{ color: '#5a6040', fontSize: 9 }}>+</span><Kbd k="Alt" /><span style={{ color: '#5a6040', fontSize: 9 }}>+</span><Kbd k="M" /></span> },
              { label: 'Atalho — Configurações', render: () => <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Kbd k="Ctrl" /><span style={{ color: '#5a6040', fontSize: 9 }}>+</span><Kbd k="Alt" /><span style={{ color: '#5a6040', fontSize: 9 }}>+</span><Kbd k="S" /></span> },
            ].map(({ label, render }, i, arr) => (
              <div
                key={label}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', fontSize: 10, background: 'rgba(13,10,4,0.8)', borderBottom: i < arr.length - 1 ? '1px solid rgba(46,30,6,0.7)' : 'none' }}
              >
                <span style={{ color: '#a0a880' }}>{label}</span>
                {render()}
              </div>
            ))}
          </div>
        </div>

        {/* Support tools */}
        <div>
          <SL>Ferramentas de Suporte</SL>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              onClick={handleClearCache} disabled={clearingCache}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px 8px', borderRadius: 3, background: 'transparent', border: '1px solid #2e1e06', color: '#c8a840', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.15s', opacity: clearingCache ? 0.5 : 1 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,47,10,0.25)'; e.currentTarget.style.borderColor = '#6a4e18'; e.currentTarget.style.color = '#e8c860'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#2e1e06'; e.currentTarget.style.color = '#c8a840'; }}
            >
              <Trash2 size={16} />
              LIMPAR MARCAÇÕES
            </button>
            <button
              onClick={handleClearStats} disabled={clearingStats}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px 8px', borderRadius: 3, background: 'transparent', border: '1px solid #2e1e06', color: '#c8a840', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.15s', opacity: clearingStats ? 0.5 : 1 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,47,10,0.25)'; e.currentTarget.style.borderColor = '#6a4e18'; e.currentTarget.style.color = '#e8c860'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#2e1e06'; e.currentTarget.style.color = '#c8a840'; }}
            >
              <RotateCcw size={16} />
              LIMPAR ESTATÍSTICAS
            </button>
          </div>
        </div>

      </div>

      {/* Confirm modal */}
      {confirmModal.isOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(9,7,4,0.92)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 16, borderRadius: 3, padding: 18, background: '#0e0b05', border: '1px solid #3a2508', boxShadow: '0 0 40px rgba(0,0,0,0.9)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 3, background: 'rgba(200,134,10,0.08)', border: '1px solid #c8860a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={16} style={{ color: '#c8860a' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h4 style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: '#f0e8c0', margin: '0 0 4px' }}>{confirmModal.title}</h4>
                <p style={{ fontSize: 10, color: '#9a7a40', margin: 0, lineHeight: 1.6 }}>{confirmModal.message}</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setConfirmModal((p) => ({ ...p, isOpen: false }))}
                style={{ padding: '6px 14px', borderRadius: 3, fontWeight: 700, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', cursor: 'pointer', background: 'transparent', border: '1px solid #2e1e06', color: '#9a7a40' }}
              >
                CANCELAR
              </button>
              <button
                onClick={confirmModal.onConfirm}
                style={{ padding: '6px 14px', borderRadius: 3, fontWeight: 700, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', cursor: 'pointer', background: 'linear-gradient(135deg,#b87a08,#e8a820)', border: 'none', color: '#0a0800' }}
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AppDetailsScreen;

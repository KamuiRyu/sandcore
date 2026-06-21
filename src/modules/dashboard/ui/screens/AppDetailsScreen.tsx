import { useState, useEffect } from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  ShieldCheck,
  Zap,
  RefreshCw,
  Trash2,
  RotateCcw,
  FileText,
} from "lucide-react";
import { pb } from "../../../../lib/pocketbase";
import { appStorage } from "../../../../lib/storage";
import {
  ParchSection, ParchRowList, ParchRow, ParchCard,
  ParchPrimaryBtn, ParchSecondaryBtn, ParchDangerBtn, GoldenBox, P,
} from "../../../../components/ui/ParchmentUI";

export const AppDetailsScreen = () => {
  const [pocketbaseConnected, setPocketbaseConnected] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [clearingStats, setClearingStats] = useState(false);
  const [uiScale, setUiScale] = useState(100);
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [appVersion, setAppVersion] = useState("1.0.6-beta");
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "available" | "not-available" | "downloading" | "downloaded" | "error">("idle");
  const [updateVersion, setUpdateVersion] = useState("");
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [updaterError, setUpdaterError] = useState("");
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  useEffect(() => {
    pb.send("/api/health", { method: "GET" }).then(() => setPocketbaseConnected(true)).catch(() => setPocketbaseConnected(false));
    if (window.ipcRenderer) {
      window.ipcRenderer.getConfig().then((config) => {
        if (config) {
          if ("uiScale" in config) setUiScale(config.uiScale);
          if ("alwaysOnTop" in config) setAlwaysOnTop(config.alwaysOnTop);
        }
      });
      window.ipcRenderer.invoke("get-app-version").then((v) => { if (v) setAppVersion(v); }).catch((err) => console.error(err));

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
      const handleUpdateProgress = (_event: any, data: { percent: number }) => { setUpdateStatus("downloading"); setDownloadPercent(data.percent) };
      window.ipcRenderer.on("update-status", handleUpdateStatus);
      window.ipcRenderer.on("update-progress", handleUpdateProgress);
      return () => { window.ipcRenderer?.off("update-status", handleUpdateStatus); window.ipcRenderer?.off("update-progress", handleUpdateProgress) };
    }
  }, []);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm: () => { onConfirm(); setConfirmModal((p) => ({ ...p, isOpen: false })) } });
  };

  const handleClearCache = () => {
    triggerConfirm("Limpar Marcações", "Deseja limpar as marcações ativas do mapa salvas localmente? Esta ação não pode ser desfeita.", () => {
      setClearingCache(true);
      try { appStorage.removeItem("shinobi-map-completed-pins"); setTimeout(() => window.location.reload(), 300) }
      catch (e) { console.error(e); setClearingCache(false) }
    });
  };

  const handleClearStats = () => {
    triggerConfirm("Limpar Estatísticas", "Deseja limpar todo o histórico de coletas? Esta ação não pode ser desfeita.", async () => {
      setClearingStats(true);
      try {
        appStorage.removeItem("shinobi-map-stats-history");
        let userId = pb.authStore.model?.id;
        if (!userId) {
          const pbAuth = localStorage.getItem("pocketbase_auth");
          if (pbAuth) {
            try { const d = JSON.parse(pbAuth); userId = d.model?.id; if (d.token) pb.authStore.save(d.token, d.model) } catch { /* empty */ }
          }
        }
        if (userId) {
          try {
            const records = await pb.collection("user_map_stats").getFullList({ filter: `owner = "${userId}"` });
            for (const r of records) {
              try { await pb.collection("user_map_stats").delete(r.id) }
              catch { await pb.collection("user_map_stats").update(r.id, { ore_count: {}, mushroom_count: {}, plant_count: {}, stick_count: 0 }) }
            }
          } catch (err) { console.error(err) }
        }
        setClearingStats(false);
        setTimeout(() => window.location.reload(), 300);
      } catch (e) { console.error(e); setClearingStats(false) }
    });
  };

  const statusDot = (ok: boolean) => (
    <span style={{
      display: "inline-block", width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
      background: ok ? "#285a38" : "#8a2020",
      boxShadow: ok ? "0 0 5px rgba(40,90,56,0.6)" : "0 0 5px rgba(138,32,32,0.6)",
    }} />
  );

  return (
    <div className="relative" style={{ color: P.darkBrown }}>
      <div className="flex flex-col" style={{ gap: 12, paddingBottom: 8 }}>
        {/* App info */}
        <ParchCard accent="linear-gradient(180deg,#5a341a,#3a2010)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 5, flexShrink: 0,
              background: P.subtleBg, boxShadow: `inset 0 0 0 1.5px ${P.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src="./images/sunagakure_logo.svg" alt="Sunagakure Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} draggable={false} />
            </div>
            <div>
              <h3 style={{ fontFamily: P.fontLabel, fontSize: 14, fontWeight: 900, color: P.darkBrown, letterSpacing: '0.12em', margin: 0 }}>SANDCORE</h3>
              <p style={{ fontFamily: P.fontLabel, fontSize: 9, color: '#7a5030', margin: '4px 0 0', letterSpacing: '0.08em' }}>v{appVersion} · BUILD ELECTRON</p>
            </div>
          </div>
        </ParchCard>

        {/* Diagnostics */}
        <div>
          <ParchSection>Diagnóstico do Sistema</ParchSection>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: "Servidor API", icon: Zap, ok: pocketbaseConnected },
              { label: "IPC Electron", icon: ShieldCheck, ok: true },
            ].map(({ label, icon: Icon, ok }) => (
              <div key={label} style={{
                padding: '8px 10px', borderRadius: 4,
                background: P.subtleBg, boxShadow: `inset 0 0 0 1.5px ${P.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 10, color: P.darkBrown, display: 'flex', alignItems: 'center', gap: 6, fontFamily: P.fontValue }}>
                  <Icon size={12} style={{ color: '#7a5030' }} /> {label}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, fontFamily: P.fontLabel, color: ok ? '#285a38' : '#8a2020', letterSpacing: '0.06em' }}>
                  {statusDot(ok)} {ok ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Update */}
        <div>
          <ParchSection>Atualização do Software</ParchSection>
          <ParchCard>
            {updateStatus === "idle" && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontFamily: P.fontValue, fontSize: 12, fontWeight: 700, color: P.darkBrown }}>Verificar atualizações</div>
                  <div style={{ fontFamily: P.fontValue, fontSize: 10, color: '#7a5030', marginTop: 3 }}>Verifique se há novas versões</div>
                </div>
                <ParchPrimaryBtn onClick={() => { setUpdaterError(""); window.ipcRenderer?.send("check-for-updates") }} padding="7px 14px">
                  <RefreshCw size={12} /> VERIFICAR
                </ParchPrimaryBtn>
              </div>
            )}
            {updateStatus === "checking" && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <RefreshCw size={16} style={{ color: P.darkBrown, animation: 'spin 1s linear infinite' }} />
                <div>
                  <div style={{ fontFamily: P.fontValue, fontSize: 11, fontWeight: 600, color: P.darkBrown }}>Buscando atualizações...</div>
                  <div style={{ fontFamily: P.fontValue, fontSize: 9, color: '#7a5030', marginTop: 2 }}>Conectando ao servidor</div>
                </div>
              </div>
            )}
            {updateStatus === "available" && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={14} style={{ color: P.darkBrown, animation: 'spin 1s linear infinite' }} />
                <div>
                  <div style={{ fontFamily: P.fontValue, fontSize: 11, fontWeight: 700, color: P.darkBrown }}>Nova versão {updateVersion}!</div>
                  <div style={{ fontFamily: P.fontValue, fontSize: 9, color: '#7a5030', marginTop: 2 }}>Iniciando download automático...</div>
                </div>
              </div>
            )}
            {updateStatus === "downloading" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: P.fontLabel, color: '#7a5030' }}>
                  <span>Baixando ({updateVersion})...</span>
                  <span style={{ color: P.teal, fontWeight: 700 }}>{downloadPercent}%</span>
                </div>
                <div style={{ width: '100%', height: 4, borderRadius: 2, background: P.border, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${downloadPercent}%`, background: P.gold, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
              </div>
            )}
            {updateStatus === "downloaded" && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontFamily: P.fontValue, fontSize: 11, fontWeight: 700, color: '#285a38' }}>Atualização {updateVersion} pronta!</div>
                  <div style={{ fontFamily: P.fontValue, fontSize: 9, color: '#7a5030', marginTop: 2 }}>Reinicie para aplicar</div>
                </div>
                <ParchPrimaryBtn onClick={() => window.ipcRenderer?.send("quit-and-install-update")} padding="7px 14px">REINICIAR</ParchPrimaryBtn>
              </div>
            )}
            {updateStatus === "not-available" && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} style={{ color: '#285a38' }} />
                <div>
                  <div style={{ fontFamily: P.fontValue, fontSize: 11, fontWeight: 700, color: '#285a38' }}>Você está atualizado</div>
                  <div style={{ fontFamily: P.fontLabel, fontSize: 9, color: '#7a5030', marginTop: 2 }}>v{appVersion} é a última versão</div>
                </div>
              </div>
            )}
            {updateStatus === "error" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: P.fontValue, fontSize: 11, fontWeight: 700, color: '#8a2020' }}>Falha ao atualizar</span>
                  <ParchDangerBtn onClick={() => { setUpdaterError(""); window.ipcRenderer?.send("check-for-updates") }}>TENTAR NOVAMENTE</ParchDangerBtn>
                </div>
                <p style={{ fontFamily: P.fontValue, fontSize: 9, color: '#7a5030', margin: 0, lineHeight: 1.5 }}>{updaterError || "Erro ao conectar ao servidor."}</p>
              </div>
            )}
          </ParchCard>
        </div>

        {/* Config summary */}
        <div>
          <ParchSection>Configuração Ativa</ParchSection>
          <ParchRowList>
            {[
              {
                label: "Escala de Interface",
                render: () => <GoldenBox style={{ fontSize: 10, padding: '3px 10px' }}>{uiScale}%</GoldenBox>,
              },
              {
                label: "Sempre no Topo",
                render: () => (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, fontFamily: P.fontLabel, color: alwaysOnTop ? '#285a38' : '#7a5030', letterSpacing: '0.06em' }}>
                    {statusDot(alwaysOnTop)} {alwaysOnTop ? "ATIVO" : "INATIVO"}
                  </span>
                ),
              },
              {
                label: "Atalho — Abrir Mapa",
                render: () => (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {['Ctrl', '+', 'Alt', '+', 'M'].map((k, i) =>
                      k === '+' ? <span key={i} style={{ color: P.border, fontSize: 9 }}>+</span>
                        : <span key={i} style={{ fontFamily: P.fontLabel, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: P.subtleBg, boxShadow: `inset 0 0 0 1px ${P.border}`, color: P.darkBrown }}>{k}</span>
                    )}
                  </span>
                ),
              },
              {
                label: "Atalho — Configurações",
                render: () => (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {['Ctrl', '+', 'Alt', '+', 'S'].map((k, i) =>
                      k === '+' ? <span key={i} style={{ color: P.border, fontSize: 9 }}>+</span>
                        : <span key={i} style={{ fontFamily: P.fontLabel, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: P.subtleBg, boxShadow: `inset 0 0 0 1px ${P.border}`, color: P.darkBrown }}>{k}</span>
                    )}
                  </span>
                ),
              },
            ].map(({ label, render }, i, arr) => (
              <ParchRow key={label} isLast={i === arr.length - 1}>
                <span style={{ fontFamily: P.fontValue, fontSize: 10, color: '#7a5030' }}>{label}</span>
                {render()}
              </ParchRow>
            ))}
          </ParchRowList>
        </div>

        {/* Support tools */}
        <div>
          <ParchSection>Ferramentas de Suporte</ParchSection>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <ParchDangerBtn onClick={handleClearCache} disabled={clearingCache}>
              <Trash2 size={14} /><span>LIMPAR MARCAÇÕES</span>
            </ParchDangerBtn>
            <ParchDangerBtn onClick={handleClearStats} disabled={clearingStats}>
              <RotateCcw size={14} /><span>LIMPAR ESTATÍSTICAS</span>
            </ParchDangerBtn>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmModal.isOpen && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          background: "rgba(200,180,140,0.88)", backdropFilter: "blur(4px)",
        }}>
          <div style={{
            width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 16,
            borderRadius: 8, padding: 18,
            background: "#e3cd9e",
            boxShadow: "0 0 0 2px rgba(90,55,20,.35), 0 20px 40px rgba(0,0,0,.4)",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 5, flexShrink: 0,
                background: P.subtleBg, boxShadow: `inset 0 0 0 1.5px ${P.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Trash2 size={16} style={{ color: P.darkBrown }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h4 style={{ fontFamily: P.fontLabel, fontSize: 12, fontWeight: 700, color: P.darkBrown, margin: "0 0 4px" }}>{confirmModal.title}</h4>
                <p style={{ fontFamily: P.fontValue, fontSize: 10, color: '#7a5030', margin: 0, lineHeight: 1.6 }}>{confirmModal.message}</p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <ParchSecondaryBtn onClick={() => setConfirmModal((p) => ({ ...p, isOpen: false }))}>CANCELAR</ParchSecondaryBtn>
              <ParchPrimaryBtn onClick={confirmModal.onConfirm}>CONFIRMAR</ParchPrimaryBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AppDetailsScreen;

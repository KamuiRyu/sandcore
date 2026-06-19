import { useState, useEffect } from "react";
import {
  Info,
  HelpCircle,
  HardDrive,
  Trash2,
  ShieldCheck,
  Zap,
  RefreshCw,
} from "lucide-react";
import { pb } from "../../../../lib/pocketbase";

export const AppDetailsScreen = () => {
  const [pocketbaseConnected, setPocketbaseConnected] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [clearingStats, setClearingStats] = useState(false);
  const [uiScale, setUiScale] = useState(100);
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);

  // Version & Update States
  const [appVersion, setAppVersion] = useState("1.0.4-beta");
  const [updateStatus, setUpdateStatus] = useState<
    | "idle"
    | "checking"
    | "available"
    | "not-available"
    | "downloading"
    | "downloaded"
    | "error"
  >("idle");
  const [updateVersion, setUpdateVersion] = useState("");
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [updaterError, setUpdaterError] = useState("");

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    // Check connection to pocketbase
    pb.send("/api/health", { method: "GET" })
      .then(() => setPocketbaseConnected(true))
      .catch(() => setPocketbaseConnected(false));

    // Fetch scaling config and app version
    if (window.ipcRenderer) {
      window.ipcRenderer.getConfig().then((config) => {
        if (config) {
          if ("uiScale" in config) setUiScale(config.uiScale);
          if ("alwaysOnTop" in config) setAlwaysOnTop(config.alwaysOnTop);
        }
      });

      window.ipcRenderer
        .invoke("get-app-version")
        .then((version) => {
          if (version) setAppVersion(version);
        })
        .catch((err) => console.error("Error fetching version:", err));

      // Listen for updates from main process
      const handleUpdateStatus = (
        _event: any,
        data: { status: any; version?: string; message?: string },
      ) => {
        let status = data.status;
        const msg = data.message || "";
        const lowerMsg = msg.toLowerCase();

        // If the error indicates no versions are published or not found on GitHub, treat it as "no updates available"
        if (
          status === "error" &&
          (lowerMsg.includes("no published versions on github") ||
            lowerMsg.includes("notfound") ||
            lowerMsg.includes("not found") ||
            lowerMsg.includes("404"))
        ) {
          status = "not-available";
        }

        setUpdateStatus(status);
        if (data.version) setUpdateVersion(data.version);
        if (data.message) setUpdaterError(data.message);

        if (status === "not-available") {
          setTimeout(() => {
            setUpdateStatus("idle");
          }, 3000);
        }
      };

      const handleUpdateProgress = (_event: any, data: { percent: number }) => {
        setUpdateStatus("downloading");
        setDownloadPercent(data.percent);
      };

      window.ipcRenderer.on("update-status", handleUpdateStatus);
      window.ipcRenderer.on("update-progress", handleUpdateProgress);

      return () => {
        window.ipcRenderer?.off("update-status", handleUpdateStatus);
        window.ipcRenderer?.off("update-progress", handleUpdateProgress);
      };
    }
  }, []);

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleClearCache = () => {
    triggerConfirm(
      "Limpar Marcações",
      "Deseja limpar as marcações ativas do mapa salvas localmente? Esta ação não pode ser desfeita.",
      () => {
        setClearingCache(true);
        try {
          localStorage.removeItem("shinobi-map-completed-pins");
          window.ipcRenderer?.send("close-panel-window");
          setTimeout(() => {
            window.location.reload();
          }, 300);
        } catch (e) {
          console.error(e);
          setClearingCache(false);
        }
      },
    );
  };

  const handleClearStats = () => {
    triggerConfirm(
      "Limpar Estatísticas",
      "Deseja limpar todo o histórico de coletas (Estatísticas)? Esta ação não pode ser desfeita.",
      async () => {
        setClearingStats(true);
        try {
          localStorage.removeItem("shinobi-map-stats-history");

          let userId = pb.authStore.model?.id;
          if (!userId) {
            const pbAuth = localStorage.getItem("pocketbase_auth");
            if (pbAuth) {
              try {
                const authData = JSON.parse(pbAuth);
                userId = authData.model?.id;
                if (authData.token)
                  pb.authStore.save(authData.token, authData.model);
              } catch (e) {}
            }
          }

          if (userId) {
            try {
              const records = await pb
                .collection("user_map_stats")
                .getFullList({ filter: `owner = "${userId}"` });
              for (const r of records) {
                try {
                  await pb.collection("user_map_stats").delete(r.id);
                } catch (delErr) {
                  await pb.collection("user_map_stats").update(r.id, {
                    ore_count: {},
                    mushroom_count: {},
                    plant_count: {},
                    stick_count: 0,
                  });
                }
              }
            } catch (err: any) {
              console.error("Failed to clear PocketBase", err);
            }
          }

          setClearingStats(false);
          window.ipcRenderer?.send("close-panel-window");
          setTimeout(() => {
            window.location.reload();
          }, 300);
        } catch (e) {
          console.error(e);
          setClearingStats(false);
        }
      },
    );
  };

  const handleCheckForUpdates = () => {
    if (window.ipcRenderer) {
      setUpdaterError("");
      window.ipcRenderer.send("check-for-updates");
    }
  };

  const handleInstallUpdate = () => {
    if (window.ipcRenderer) {
      window.ipcRenderer.send("quit-and-install-update");
    }
  };

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
              src="./images/logo_mini.webp"
              alt="Logo"
              className="w-7 h-7 object-contain"
              draggable={false}
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-slate-100 text-sm tracking-wide">
              SHINOBI MAP HUD
            </h3>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Versão {appVersion} • Build Electron
            </p>
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
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  pocketbaseConnected
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                {pocketbaseConnected ? "ONLINE" : "OFFLINE"}
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

        {/* Update Section */}
        <div className="space-y-2">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 ml-1">
            Atualização do Software
          </span>
          <div className="bg-[#11161D]/55 border border-slate-800/60 p-4 rounded-xl space-y-3">
            {updateStatus === "idle" && (
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200">
                    Verificar atualizações
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Verifique se há novas versões do mapa
                  </span>
                </div>
                <button
                  onClick={handleCheckForUpdates}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-slate-100 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-teal-900/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Verificar
                </button>
              </div>
            )}

            {updateStatus === "checking" && (
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200">
                    Buscando atualizações...
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Conectando ao servidor de distribuição
                  </span>
                </div>
              </div>
            )}

            {updateStatus === "available" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-teal-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-bold">
                    Nova versão {updateVersion} disponível!
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Iniciando o download automático da atualização...
                </div>
              </div>
            )}

            {updateStatus === "downloading" && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Baixando atualização ({updateVersion})...</span>
                  <span className="font-bold text-teal-400">
                    {downloadPercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${downloadPercent}%` }}
                  />
                </div>
              </div>
            )}

            {updateStatus === "downloaded" && (
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-emerald-400">
                    Atualização {updateVersion} baixada!
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Reinicie para aplicar as alterações
                  </span>
                </div>
                <button
                  onClick={handleInstallUpdate}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-100 text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-900/20"
                >
                  Reiniciar e Instalar
                </button>
              </div>
            )}

            {updateStatus === "not-available" && (
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-4.5 h-4.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">
                    Você está atualizado
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Aplicativo rodando na última versão ({appVersion})
                  </span>
                </div>
              </div>
            )}

            {updateStatus === "error" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-400">
                    Falha ao atualizar
                  </span>
                  <button
                    onClick={handleCheckForUpdates}
                    className="px-2.5 py-1.2 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 text-[10px] font-semibold hover:bg-rose-900 transition-all cursor-pointer"
                  >
                    Tentar Novamente
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-mono leading-tight">
                  {updaterError ||
                    "Erro ao conectar ao servidor de atualizações."}
                </p>
              </div>
            )}
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
              <span className="text-slate-400">
                Sempre no Topo (Always-On-Top)
              </span>
              <span className="font-semibold text-slate-200">
                {alwaysOnTop ? "Ativo" : "Inativo"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Atalho - Abrir Mapa</span>
              <span className="font-mono text-teal-400 font-bold bg-[#0B0E12] px-1.5 py-0.5 rounded border border-slate-800">
                Ctrl + Alt + M
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Atalho - Configurações</span>
              <span className="font-mono text-teal-400 font-bold bg-[#0B0E12] px-1.5 py-0.5 rounded border border-slate-800">
                Ctrl + Alt + S
              </span>
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
                <h4 className="text-sm font-bold text-white tracking-wide">
                  {confirmModal.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-1">
              <button
                onClick={() =>
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                }
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
  );
};

export default AppDetailsScreen;

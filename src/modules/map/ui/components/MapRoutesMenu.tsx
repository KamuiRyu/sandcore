import { memo } from "react";
import {
  Route,
  Plus,
  Trash2,
  Share2,
  Code2,
  Shield,
  Eye,
  EyeOff,
  Globe,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Compass,
  Search,
  Activity,
  Zap,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../../lib/utils";
import type {
  CustomRoute,
  RouteCheckpoint,
  SavedMapRoute,
} from "../../core/entities/MapRoute.entity";
import { HudPanel } from "../../../app/ui/components/HudPanel";

interface MapRoutesMenuProps {
  isOpen: boolean;
  onClose: () => void;
  routesView: "mine" | "public";
  setRoutesView: (view: "mine" | "public") => void;
  publicRoutesQuery: string;
  setPublicRoutesQuery: (query: string) => void;
  publicRoutesLoading: boolean;
  paginatedSavedRoutes: SavedMapRoute[];
  mineRoutesPage: number;
  totalSavedRoutesPages: number;
  setMineRoutesPage: (page: number) => void;
  paginatedPublicRoutes: SavedMapRoute[];
  publicRoutesPage: number;
  totalPublicRoutesPages: number;
  setPublicRoutesPage: (page: number) => void;
  loadSavedRoute: (id: string) => void;
  deleteSavedRoute: (id: string) => void;
  duplicateSavedRoute: (id: string) => void;
  publishSelectedRoute: (id: string) => void;
  unpublishSelectedRoute: (id: string) => void;
  toggleRouteVisibility: (id: string) => void;
  visibleRoutes: string[];
  selectedSavedRouteId: string | null;
  currentRoute: CustomRoute;
  updateRouteField: (
    field: keyof CustomRoute,
    value: string | string[],
  ) => void;
  clearRoute: () => void;
  saveCurrentRoute: () => void;
  shareCurrentRoute: () => void;
  copyRouteJson: () => void;
  removeCheckpoint: (id: string) => void;
  moveCheckpoint: (id: string, direction: number) => void;
  updateCheckpointLabel: (id: string, label: string) => void;
  mode: "explore" | "pin" | "route" | "feedback";
  setMode: (mode: "explore" | "pin" | "route" | "feedback") => void;
  isAuthenticated: boolean;
  openLoginModal: () => void;
}

const LockedHUD = ({ description, onLogin }: { description: string; onLogin: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <div className="mb-8 relative">
       <div className="absolute inset-0 bg-cyan-500/10 blur-[50px] rounded-full" />
       <div className="relative grid h-20 w-20 place-items-center bg-[#0D1216]/80 border border-white/10 rounded-3xl text-cyan-400">
         <Activity size={32} strokeWidth={1.5} />
       </div>
    </div>
    <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-3">
      Link Offline
    </h3>
    <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-[240px] mb-8">
      {description}
    </p>
    <button
      onClick={onLogin}
      className="group relative px-8 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all active:scale-95 cursor-pointer"
    >
      <span className="relative text-xs font-bold text-cyan-400 uppercase tracking-wider">
        Conectar Neural Link
      </span>
    </button>
  </div>
);

function HUDPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-white/5 px-2">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-slate-400 hover:border-cyan-500/30 hover:text-cyan-400 disabled:opacity-20 transition-all cursor-pointer"
      >
        <ChevronLeft size={16} />
      </button>
      <div className="flex flex-col items-center">
         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Página</span>
         <span className="text-xs font-bold text-slate-200">
           {currentPage} <span className="text-slate-600">/</span> {totalPages}
         </span>
      </div>
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-slate-400 hover:border-cyan-500/30 hover:text-cyan-400 disabled:opacity-20 transition-all cursor-pointer"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export const MapRoutesMenu = memo(function MapRoutesMenu({
  isOpen,
  onClose,
  routesView,
  setRoutesView,
  publicRoutesQuery,
  setPublicRoutesQuery,
  publicRoutesLoading,
  paginatedSavedRoutes,
  mineRoutesPage,
  totalSavedRoutesPages,
  setMineRoutesPage,
  paginatedPublicRoutes,
  publicRoutesPage,
  totalPublicRoutesPages,
  setPublicRoutesPage,
  loadSavedRoute,
  deleteSavedRoute,
  duplicateSavedRoute,
  publishSelectedRoute,
  unpublishSelectedRoute,
  toggleRouteVisibility,
  visibleRoutes,
  selectedSavedRouteId,
  currentRoute,
  updateRouteField,
  clearRoute,
  saveCurrentRoute,
  shareCurrentRoute,
  copyRouteJson,
  removeCheckpoint,
  moveCheckpoint,
  updateCheckpointLabel,
  mode,
  setMode,
  isAuthenticated,
  openLoginModal,
}: MapRoutesMenuProps) {
  return (
    <HudPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Rotas"
      subtitle="Planeje e salve rotas no mapa"
      icon={Route}
    >
      <div className="flex h-full flex-col relative overflow-hidden rounded-b-[24px]">
        {/* Subtle technical grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,214,163,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,214,163,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none rounded-b-[24px]" />

        {/* Content wrapped to be relative to the grid */}
        <div className="relative z-10 flex h-full flex-col rounded-b-[24px]">
          {mode === "route" ? (
          // Route Builder Modern Editor
          <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6 custom-scrollbar relative z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-2">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center bg-[#0D1216]/80 border border-white/10 rounded-xl text-cyan-400">
                  <Route size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">
                    {selectedSavedRouteId ? "Editar Esquema" : "Novo Planejamento"}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                     <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_var(--cyan)]" />
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                       Mapping Active
                     </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode("explore")}
                  className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveCurrentRoute}
                  disabled={!isAuthenticated || currentRoute.checkpoints.length === 0}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-[9px] font-black uppercase tracking-widest text-cyan-400 hover:bg-cyan-500/30 transition cursor-pointer disabled:opacity-30 disabled:grayscale"
                >
                  {selectedSavedRouteId ? "Registrar" : "Inicializar"}
                </button>
              </div>
            </div>

            <div className="space-y-6 px-1">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                  Tag do Trajeto
                </label>
                <input
                  type="text"
                  value={currentRoute.name}
                  onChange={(e) => updateRouteField("name", e.target.value)}
                  placeholder="Nome da rota..."
                  className="w-full bg-[#0D1216]/60 border border-white/5 rounded-xl px-4 py-3 text-[11px] font-bold text-slate-200 outline-none focus:border-cyan-500/30 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                    Cor Visual
                  </label>
                  <div className="flex items-center gap-3 p-2 bg-[#0D1216]/60 border border-white/5 rounded-xl">
                    <input
                      type="color"
                      value={currentRoute.color}
                      onChange={(e) => updateRouteField("color", e.target.value)}
                      className="h-9 w-9 border-0 bg-transparent p-0 cursor-pointer overflow-hidden shrink-0 rounded-lg"
                    />
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {["#00d6a3", "#ff9800", "#f44336", "#9c27b0"].map((c) => (
                        <button
                          key={c}
                          onClick={() => updateRouteField("color", c)}
                          className={cn(
                            "h-4 w-4 rounded-full transition-transform",
                            currentRoute.color === c ? "ring-2 ring-white scale-110" : "opacity-40 hover:opacity-100",
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                   <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={shareCurrentRoute}
                        className="aspect-square grid place-items-center rounded-xl bg-[#0D1216]/60 border border-white/5 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all cursor-pointer"
                        title="Transmitir"
                      >
                        <Share2 size={16} />
                      </button>
                      <button
                        onClick={copyRouteJson}
                        className="aspect-square grid place-items-center rounded-xl bg-[#0D1216]/60 border border-white/5 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all cursor-pointer"
                        title="Dump JSON"
                      >
                        <Code2 size={16} />
                      </button>
                      <button
                        onClick={clearRoute}
                        className="aspect-square grid place-items-center rounded-xl bg-[#0D1216]/60 border border-white/5 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
                        title="Purgar"
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                  Dados Operacionais
                </label>
                <textarea
                  value={currentRoute.description || ""}
                  onChange={(e) => updateRouteField("description", e.target.value)}
                  placeholder="Objetivos do trajeto..."
                  rows={2}
                  className="w-full bg-[#0D1216]/60 border border-white/5 rounded-xl px-4 py-3 text-[11px] font-bold text-slate-200 outline-none focus:border-cyan-500/30 transition-all resize-none custom-scrollbar"
                />
              </div>

              {currentRoute.checkpoints.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      Nodos de Rota ({currentRoute.checkpoints.length})
                    </label>
                  </div>
                  
                  <div className="grid gap-2 max-h-[16rem] overflow-y-auto custom-scrollbar pr-2">
                    <AnimatePresence>
                      {currentRoute.checkpoints.map((cp: RouteCheckpoint, idx: number) => (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={cp.id}
                          className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-3 rounded-xl group hover:border-cyan-500/30 transition-all"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <span className="shrink-0 grid h-8 w-8 place-items-center bg-[#0D1216] rounded-lg border border-white/5 text-[11px] font-bold text-cyan-400/80">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <input
                                type="text"
                                value={cp.label || ""}
                                onChange={(e) => updateCheckpointLabel(cp.id, e.target.value)}
                                placeholder={`Nodo ${idx + 1}`}
                                className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-slate-200 placeholder-slate-600 outline-none focus:ring-0"
                              />
                              <p className="text-[9px] font-medium text-slate-500 mt-0.5">
                                Setor: {cp.x.toFixed(0)} , {cp.y.toFixed(0)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                            <button
                              onClick={() => moveCheckpoint(cp.id, -1)}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-0"
                            >
                              <ChevronLeft className="rotate-90" size={14} />
                            </button>
                            <button
                              onClick={() => moveCheckpoint(cp.id, 1)}
                              disabled={idx === currentRoute.checkpoints.length - 1}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-0"
                            >
                              <ChevronRight className="rotate-90" size={14} />
                            </button>
                            <button
                              onClick={() => removeCheckpoint(cp.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Modern Tab Selection
          <div className="space-y-8 h-full flex flex-col pt-4">
            <div className="flex items-center p-1.5 mx-8 bg-[#0D1216]/80 border border-white/5 rounded-2xl relative z-10">
              <button
                onClick={() => setRoutesView("mine")}
                className={cn(
                  "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl relative z-10 cursor-pointer",
                  routesView === "mine"
                    ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 shadow-xl shadow-cyan-900/10"
                    : "text-slate-500 hover:text-slate-300",
                )}
              >
                Registros Locais
              </button>
              <button
                onClick={() => setRoutesView("public")}
                className={cn(
                  "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl relative z-10 cursor-pointer",
                  routesView === "public"
                    ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 shadow-xl shadow-cyan-900/10"
                    : "text-slate-500 hover:text-slate-300",
                )}
              >
                Rede Pública
              </button>
            </div>

            <div className="flex-1 min-h-0 px-8 pb-8 custom-scrollbar relative z-10">
              {routesView === "mine" ? (
                // Mine Routes Modern
                <div className="space-y-6 h-full flex flex-col">
                  {!isAuthenticated ? (
                    <LockedHUD
                      description="A criação de trajetos táticos requer sincronização neural ativa. Autentique-se para continuar."
                      onLogin={openLoginModal}
                    />
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-1 bg-cyan-500 rounded-full" />
                          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Gerenciar Trajetos
                          </h3>
                        </div>
                        <button
                          onClick={() => {
                            clearRoute();
                            setMode("route");
                          }}
                          className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 transition-all active:scale-95 cursor-pointer"
                        >
                          <Plus size={14} strokeWidth={3} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Nova Rota</span>
                        </button>
                      </div>

                      {paginatedSavedRoutes.length === 0 ? (
                        <div className="py-24 px-8 text-center bg-[#0D1216]/40 border border-dashed border-white/5 rounded-3xl">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Banco de Dados Vazio
                          </p>
                          <p className="text-[10px] font-medium text-slate-600">Nenhuma entrada detectada neste setor.</p>
                        </div>
                      ) : (
                        <div className="flex-1 min-h-0 flex flex-col">
                          <div className="grid gap-3 overflow-y-auto custom-scrollbar pr-2 pb-4">
                            {paginatedSavedRoutes.map((route, idx) => (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                key={route.id}
                                className={cn(
                                  "flex items-center justify-between p-4 rounded-2xl border transition-all group relative",
                                  selectedSavedRouteId === route.id
                                    ? "bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-900/10"
                                    : "bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.05]",
                                )}
                              >
                                <div
                                  className="flex-1 min-w-0 cursor-pointer"
                                  onClick={() => loadSavedRoute(route.id)}
                                >
                                  <p className="truncate text-xs font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                                    {route.name}
                                  </p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <div className="flex items-center gap-1.5 opacity-60">
                                       <Activity size={10} className="text-slate-400" />
                                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                         {route.route.checkpoints.length} nodos
                                       </span>
                                    </div>
                                    <div className="flex-1 h-1 bg-slate-900 rounded-full overflow-hidden">
                                       <div className="h-full bg-slate-700/50 w-full" />
                                    </div>
                                    <div className="h-2 w-2 rounded-full ring-2 ring-offset-2 ring-offset-slate-900 ring-white/10" style={{ backgroundColor: route.color }} />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 ml-4 shrink-0">
                                  <button
                                    onClick={() => toggleRouteVisibility(route.id)}
                                    className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all cursor-pointer"
                                  >
                                    {visibleRoutes.includes(route.id) ? <Eye size={16} /> : <EyeOff size={16} />}
                                  </button>
                                  <button
                                    onClick={() => deleteSavedRoute(route.id)}
                                    className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          <HUDPagination
                            currentPage={mineRoutesPage}
                            totalPages={totalSavedRoutesPages}
                            onPageChange={setMineRoutesPage}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                // Public Routes Modern
                <div className="space-y-6 h-full flex flex-col">
                  <div className="relative group">
                    <Search
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors"
                      size={14}
                    />
                    <input
                      type="text"
                      placeholder="Pesquisar na rede pública..."
                      value={publicRoutesQuery}
                      onChange={(e) => setPublicRoutesQuery(e.target.value)}
                      className="w-full bg-[#0D1216]/60 border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-[11px] font-bold text-slate-200 outline-none focus:border-cyan-500/30 transition-all"
                    />
                  </div>
                  
                  <div className="flex-1 min-h-0 flex flex-col">
                    {publicRoutesLoading ? (
                      <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                        <Compass
                          size={40}
                          className="animate-spin mb-4"
                        />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                          Sincronizando...
                        </p>
                      </div>
                    ) : paginatedPublicRoutes.length === 0 ? (
                      <div className="py-24 px-8 text-center bg-[#0D1216]/40 border border-dashed border-white/5 rounded-3xl">
                        <Globe size={32} className="mx-auto mb-3 text-slate-500" />
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                          Nenhuma rota encontrada
                        </p>
                        <p className="text-[10px] font-medium text-slate-600">Altere os termos da busca.</p>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-0 flex flex-col">
                        <div className="grid gap-3 overflow-y-auto custom-scrollbar pr-2 pb-8">
                          {paginatedPublicRoutes.map((route, idx) => (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.04 }}
                              key={route.id}
                              className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.05] transition-all group"
                            >
                              <div className="flex-1 min-w-0 pr-4">
                                <p className="truncate text-xs font-bold text-slate-100 group-hover:text-cyan-400 transition-colors mb-2">
                                  {route.name}
                                </p>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0D1216]/80 border border-white/5">
                                    <Zap size={10} className="text-cyan-500" />
                                    <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest truncate max-w-[80px]">
                                      {(typeof route.creator === 'object' ? route.creator?.name : route.creator) || "Desconhecido"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 opacity-60">
                                     <Activity size={10} className="text-slate-400" />
                                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                       {route.route.checkpoints.length} nodos
                                     </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => toggleRouteVisibility(route.id)}
                                  className="p-2.5 rounded-xl bg-[#0D1216] border border-white/5 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all cursor-pointer"
                                  title="Ver no Mapa"
                                >
                                  {visibleRoutes.includes(route.id) ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                                <button
                                  onClick={() => duplicateSavedRoute(route.id)}
                                  className="p-2.5 rounded-xl bg-[#0D1216] border border-white/5 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all cursor-pointer"
                                  title="Clonar Rota"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        <HUDPagination
                          currentPage={publicRoutesPage}
                          totalPages={totalPublicRoutesPages}
                          onPageChange={setPublicRoutesPage}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </HudPanel>
  );
});

export default MapRoutesMenu;

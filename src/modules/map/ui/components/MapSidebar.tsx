import { memo, useState, useEffect } from "react";
import {
  ChevronLeft,
  Compass,
  Layers,
  MapPin,
  Plus,
  Route,
  Search,
  Trash2,
  ChevronRight,
  CircleCheck,
  Globe,
  Edit2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Share2,
  Shield,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Settings,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Users,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  UserPlus,
  LogOut,
  Code2,
  X,
} from "lucide-react";
import { cn } from "../../../../lib/utils";
import {
  getMarkerTypeLabel,
  customPinIcons,
  getMarkerIconSrc,
} from "../../core/entities/MapConfig.entity";
import type { MapMarkerType } from "../../core/entities/MapCalibration.entity";
import type {
  MapGroup,
  MapGroupMember,
} from "../../../groups/core/entities/MapGroup.entity";
import type {
  CustomRoute,
  RouteCheckpoint,
  SavedCustomPin,
  SavedMapRoute,
} from "../../core/entities/MapRoute.entity";
import type { MapCollectionStats } from "../../core/entities/MapStats.entity";
import type { StatsPeriod } from "../viewModels/useMap.viewModel";
import { RouteCompletionModal } from "./RouteCompletionModal";

type SidebarSection = "officialPins" | "customPins" | "routes" | "search";
type RoutesView = "mine" | "public";

interface MapSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  sidebarSection: SidebarSection;
  setSidebarSection: (section: SidebarSection) => void;
  sidebarSearchQuery: string;
  setSidebarSearchQuery: (query: string) => void;
  searchResults: any[];
  paginatedSearchResults: any[];
  searchPage: number;
  setSearchPage: (page: number) => void;
  totalSearchPages: number;
  selectCustomPin: (id: string | null) => void;
  startEditingCustomPin: (id: string) => void;
  selectOfficialPoint: (id: string | null) => void;
  focusCoords: (coords: { x: number; y: number }) => void;
  officialPinCategories: {
    base: {
      count: string;
      iconId: string;
      type: string;
      label?: string;
      total: number;
      marked: number;
    }[];
    identified: {
      count: string;
      iconId: string;
      type: string;
      label?: string;
      total: number;
      marked: number;
    }[];
  };
  selectedTypes: string[];
  toggleSelectedType: (type: string) => void;
  selectedCustomPin: SavedCustomPin | null;
  editingCustomPinId: string | null;
  cancelCustomPin: () => void;
  confirmCustomPin: () => void;
  updateSelectedPinField: (
    field: keyof SavedCustomPin,
    value: string | string[],
  ) => void;
  customPins: SavedCustomPin[];
  removeCustomPin: (id: string) => void;
  toggleCustomPinVisibility: (id: string) => void;
  paginatedCustomPins: SavedCustomPin[];
  customPinsPage: number;
  totalCustomPinsPages: number;
  setCustomPinsPage: (page: number) => void;
  routesView: RoutesView;
  setRoutesView: (view: RoutesView) => void;
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
  updateRouteCollectedStats: (id: string, data: Record<string, number>) => void;
  markRoutePinsCompleted: (id: string) => void;
  addRouteResourcesToDailyStats: (data: Record<string, number>) => void;
  publishSelectedRoute: (id: string) => void;
  unpublishSelectedRoute: (id: string) => void;
  toggleRouteVisibility: (id: string) => void;
  visibleRoutes: string[];
  selectedSavedRouteId: string | null;
  openCustomPinsSection: () => void;
  currentRoute: CustomRoute;
  updateRouteField: (
    field: keyof CustomRoute,
    value: string | string[],
  ) => void;
  clearRoute: () => void;
  saveCurrentRoute: () => void;
  openAutoRouteModal: () => void;
  shareCurrentRoute: () => void;
  copyRouteJson: () => void;
  removeCheckpoint: (id: string) => void;
  moveCheckpoint: (id: string, direction: number) => void;
  updateCheckpointLabel: (id: string, label: string) => void;
  savedRoutes: SavedMapRoute[];
  publicRoutes: SavedMapRoute[];
  mode: "explore" | "pin" | "route" | "feedback";
  setMode: (mode: "explore" | "pin" | "route" | "feedback") => void;
  mapStats: MapCollectionStats;
  worldStats: {
    total_ores: number;
    marked_ores: number;
    total_mushrooms: number;
    marked_mushrooms: number;
    total_plants: number;
    marked_plants: number;
    total_sticks: number;
    marked_sticks: number;
  };
  statsPeriod: StatsPeriod;
  setStatsPeriod: (period: StatsPeriod) => void;
  resetAllActiveRespawns: () => void;
  group: MapGroup | null;
  members: MapGroupMember[];
  isGroupLoading: boolean;
  createGroup: (name: string) => void;
  joinGroup: (code: string) => void;
  leaveGroup: () => void;
  copyInviteCode: () => void;
  isAuthenticated: boolean;
  openLoginModal: () => void;
  setIsSettingsModalOpen: (open: boolean) => void;
}

const IconImage = memo(function IconImage({
  iconId,
  label,
  className,
}: {
  className?: string;
  iconId: string;
  label: string;
}) {
  const [hasError, setHasError] = useState(false);
  const src = getMarkerIconSrc(iconId);

  if (!src || hasError) {
    return (
      <span
        className={cn(
          "grid place-items-center rounded-full bg-[rgba(255,255,255,0.1)] font-mono text-[0.6rem] font-black uppercase tracking-[0.14em] text-[#f0d9a0]",
          className,
        )}
      >
        {label.slice(0, 2)}
      </span>
    );
  }

  return (
    <img
      alt=""
      className={className}
      draggable={false}
      onError={() => setHasError(true)}
      src={src}
    />
  );
});

const LockedFeature = ({
  title,
  description,
  onLogin,
}: {
  title: string;
  description: string;
  onLogin: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-[fade-in_200ms_ease-out]">
    <div className="mb-4 relative">
      <div className="absolute inset-0 bg-[#c8860a]/20 blur-2xl rounded-full" />
      <div className="relative grid h-16 w-16 place-items-center rounded-[2px] border border-white/10 bg-black/40 text-[#c8860a]">
        <Shield size={32} />
        <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-red-500 text-[#f0d9a0] shadow-lg ring-2 ring-slate-900">
          <LogOut size={12} strokeWidth={3} />
        </div>
      </div>
    </div>
    <h3 className="text-sm font-black text-[#f0d9a0] uppercase tracking-wider mb-2">
      {title}
    </h3>
    <p className="text-xs text-[#9a7a40] leading-relaxed max-w-[200px] mb-6">
      {description}
    </p>
    <button
      onClick={onLogin}
      className="flex items-center gap-2 rounded-[2px] bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-black transition hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer"
    >
      Entrar na conta
    </button>
  </div>
);

function PaginationControls({
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
    <div className="flex items-center justify-between gap-2 mt-4 px-1">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-[2px] border border-white/10 bg-white/5 text-[#9a7a40] hover:border-[#c8860a]/30 hover:bg-[#282828]/20 hover:text-[#ffdd66] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="text-[10px] font-mono text-[#9a7a40]">
        PÁGINA <span className="text-[#f0d9a0]">{currentPage}</span> DE{" "}
        {totalPages}
      </span>
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-[2px] border border-white/10 bg-white/5 text-[#9a7a40] hover:border-[#c8860a]/30 hover:bg-[#282828]/20 hover:text-[#ffdd66] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}


const TechSection = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <section className={cn('relative overflow-hidden p-5', className)} style={{ background: 'rgba(8,8,8,0.7)', border: '1px solid #3a2508', borderRadius: 3 }}>
    <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: 'linear-gradient(180deg,#c8860a,#7a4e08)' }} />
    <div style={{ position: 'absolute', top: 6, left: 6, width: 10, height: 10, borderTop: '1px solid #c8860a', borderLeft: '1px solid #c8860a' }} />
    <div style={{ position: 'absolute', bottom: 6, left: 6, width: 10, height: 10, borderBottom: '1px solid #c8860a', borderLeft: '1px solid #c8860a' }} />
    <div style={{ position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderTop: '1px solid #c8860a', borderRight: '1px solid #c8860a' }} />
    <div style={{ position: 'absolute', bottom: 6, right: 6, width: 10, height: 10, borderBottom: '1px solid #c8860a', borderRight: '1px solid #c8860a' }} />
    {children}
  </section>
);

export const MapSidebar = memo(function MapSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  sidebarSection,
  setSidebarSection,
  sidebarSearchQuery,
  setSidebarSearchQuery,
  searchResults,
  paginatedSearchResults,
  searchPage,
  setSearchPage,
  totalSearchPages,
  selectCustomPin,
  startEditingCustomPin,
  selectOfficialPoint,
  focusCoords,
  officialPinCategories,
  selectedTypes,
  toggleSelectedType,
  selectedCustomPin,
  editingCustomPinId,
  cancelCustomPin,
  confirmCustomPin,
  updateSelectedPinField,
  customPins,
  removeCustomPin,
  toggleCustomPinVisibility,
  paginatedCustomPins,
  customPinsPage,
  totalCustomPinsPages,
  setCustomPinsPage,
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
  updateRouteCollectedStats,
  addRouteResourcesToDailyStats,
  publishSelectedRoute,
  unpublishSelectedRoute,
  toggleRouteVisibility,
  visibleRoutes,
  selectedSavedRouteId,
  openCustomPinsSection,
  currentRoute,
  updateRouteField,
  clearRoute,
  saveCurrentRoute,
  openAutoRouteModal,
  shareCurrentRoute,
  copyRouteJson,
  removeCheckpoint,
  moveCheckpoint,
  updateCheckpointLabel,
  mode,
  setMode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mapStats,
  isAuthenticated,
  openLoginModal,
  savedRoutes,
  publicRoutes,
}: MapSidebarProps) {
  const [routeToComplete, setRouteToComplete] = useState<SavedMapRoute | null>(null);

  // Reabre o painel após o pin ser posicionado no mapa (isPlaced === true)
  useEffect(() => {
    if (mode === "pin" && selectedCustomPin?.isPlaced === true) {
      setSidebarSection("customPins");
      setIsSidebarOpen(true);
    }
  }, [mode, selectedCustomPin?.isPlaced, setSidebarSection, setIsSidebarOpen]);

  useEffect(() => {
    const handleOpenRouteCompletion = (e: CustomEvent<string>) => {
      const routeId = e.detail;
      const route = savedRoutes.find(r => r.id === routeId) || publicRoutes.find(r => r.id === routeId);
      if (route) {
        setRouteToComplete(route);
        // Force sidebar to routes section if it's not open?
        // Optional, but good for UX if they are looking at the map
        setIsSidebarOpen(true);
        setSidebarSection("routes");
      }
    };
    window.addEventListener('open-route-completion', handleOpenRouteCompletion as EventListener);
    return () => window.removeEventListener('open-route-completion', handleOpenRouteCompletion as EventListener);
  }, [savedRoutes, publicRoutes, setIsSidebarOpen, setSidebarSection]);


  const handleSectionClick = (section: SidebarSection) => {
    if (isSidebarOpen && sidebarSection === section) {
      setIsSidebarOpen(false);
    } else {
      setSidebarSection(section);
      setIsSidebarOpen(true);
    }
  };

  const sectionItems = [
    { id: "officialPins" as const, icon: Layers, label: "Pins Oficiais" },
    { id: "customPins" as const, icon: MapPin, label: "Meus Pinos" },
    { id: "routes" as const, icon: Route, label: "Rotas" },
    { id: "search" as const, icon: Search, label: "Busca" },
  ] as const;

  const panelBg = "linear-gradient(160deg,#0d0b08 0%,#080808 100%)";
  const panelBorder = "rgba(200,134,10,0.2)";

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-[60] flex items-start gap-1.5">

      {/* ── Vertical Icon Strip ── */}
      <div
        className="pointer-events-auto flex flex-col rounded-[3px] overflow-hidden shrink-0 shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
        style={{ background: panelBg, border: `1px solid ${panelBorder}`, maxHeight: "calc(100vh - 2rem)" }}
      >
        {sectionItems.map(({ id, icon: Icon, label }) => {
          const isActive = sidebarSection === id && isSidebarOpen;
          return (
            <button
              key={id}
              onClick={() => handleSectionClick(id)}
              className={cn(
                "relative flex h-11 w-11 items-center justify-center transition-all cursor-pointer",
                isActive
                  ? "text-[#e8c860] bg-[rgba(200,134,10,0.1)]"
                  : "text-[#9a7a40] hover:text-[#c8860a] hover:bg-white/5",
              )}
              title={label}
              type="button"
            >
              {isActive && (
                <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#c8860a] shadow-[0_0_8px_rgba(200,134,10,0.6)]" />
              )}
              <Icon size={15} />
            </button>
          );
        })}

      </div>

      {/* ── Content Panel ── */}
      <aside
        className={cn(
          "pointer-events-auto flex flex-col overflow-hidden rounded-[3px] relative transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_8px_40px_rgba(0,0,0,0.75)] w-[290px]",
          isSidebarOpen
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-2 pointer-events-none",
        )}
        style={{
          background: panelBg,
          border: `1px solid ${panelBorder}`,
          height: "calc(100vh - 6rem)",
          maxHeight: "calc(100vh - 6rem)",
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] z-10 pointer-events-none" style={{ background: "linear-gradient(90deg,transparent 0%,#c8860a 40%,#e8a820 50%,#c8860a 60%,transparent 100%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: 'url("./images/noise.svg")', pointerEvents: "none", zIndex: 0, opacity: 0.04 }} />

        {/* Panel header */}
        <header className="relative z-10 flex items-center justify-between px-3 py-2 shrink-0" style={{ borderBottom: "1px solid #1e1e1e" }}>
          <div className="flex items-center gap-2">
            <div className="flex h-4 w-4 items-center justify-center rounded-full border shrink-0" style={{ borderColor: "#c8860a", color: "#c8860a" }}>
              <Compass size={8} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: "#c8860a", fontFamily: "'Cinzel', serif" }}>
              MAPA INTERATIVO
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="flex h-5 w-5 items-center justify-center rounded-[1px] border border-[#282828] text-[#9a7a40] hover:border-[#c8860a] hover:text-[#c8860a] hover:bg-[#282828] transition-all cursor-pointer"
          >
            <X size={10} />
          </button>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar relative z-10 pb-4">

          {/* ── OFFICIAL PINS ── */}
          {sidebarSection === "officialPins" && (
            <div className="animate-[fade-in_150ms_ease-out]">
              <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid #1a1a1a" }}>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: "#c8a030", fontSize: 9, fontFamily: "'Orbitron',sans-serif" }}>CATEGORIAS /</span>
                  <span className="text-[10px] font-bold text-[#f0d9a0]">Pins no Mapa</span>
                </div>
                <span className="rounded-[2px] border border-[#3a2508] bg-black/40 px-2 py-0.5 font-mono text-[9px] font-bold text-[#9a7a40]">
                  {officialPinCategories.base.filter(c => c.total > 0).length} GRUPOS
                </span>
              </div>

              <div className="px-2 py-1.5" style={{ borderBottom: "1px solid #1a1a1a" }}>
                <div className="relative group">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9a7a40] group-focus-within:text-[#c8860a] transition-colors" size={11} />
                  <input
                    className="w-full rounded-[2px] border border-[#2a2a2a] bg-black/40 py-1.5 pl-7 pr-3 text-[10px] text-[#f0d9a0] placeholder-[#9a7a40]/60 outline-none transition-all focus:border-[#c8860a]/40 font-mono"
                    onChange={(e) => setSidebarSearchQuery(e.target.value)}
                    placeholder="Filtrar categorias..."
                    type="text"
                    value={sidebarSearchQuery}
                  />
                </div>
              </div>

              {officialPinCategories.base.filter(c => c.total > 0).map((category) => {
                const isActive = selectedTypes.includes(category.type);
                return (
                  <button
                    key={category.type}
                    onClick={() => toggleSelectedType(category.type as MapMarkerType)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-all cursor-pointer",
                      isActive ? "bg-[rgba(200,134,10,0.06)]" : "hover:bg-white/[0.03]",
                    )}
                    style={{ borderBottom: "1px solid #141414" }}
                    type="button"
                  >
                    <div className={cn("h-8 w-8 shrink-0 rounded-[2px] border flex items-center justify-center", isActive ? "border-[#c8860a]/40" : "border-[#282828]")}>
                      <IconImage iconId={category.iconId} label={category.label || getMarkerTypeLabel(category.type as MapMarkerType)} className="h-6 w-6 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("truncate text-xs font-bold transition-colors", isActive ? "text-[#f0d9a0]" : "text-[#c8860a]")}>
                        {category.label || getMarkerTypeLabel(category.type as MapMarkerType)}
                      </p>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-[#9a7a40]">
                        {isActive ? "ATIVO" : "OCULTO"}
                      </p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold font-mono border transition-all", isActive ? "bg-[#c8860a] text-black border-[#ffdd66]" : "bg-white/10 text-[#9a7a40] border-[#282828]")}>
                      {category.count}
                    </span>
                  </button>
                );
              })}

              {officialPinCategories.identified.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid #1a1a1a", borderTop: "1px solid #1a1a1a" }}>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#9a7a40]">Recursos Específicos</span>
                    <span className="ml-auto rounded-full border border-[#282828] bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-[#9a7a40]">{officialPinCategories.identified.length}</span>
                  </div>
                  {officialPinCategories.identified.map((category) => {
                    const isActive = selectedTypes.includes(category.type);
                    return (
                      <button
                        key={category.type}
                        onClick={() => toggleSelectedType(category.type)}
                        className={cn("flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-all cursor-pointer", isActive ? "bg-[rgba(16,185,129,0.05)]" : "hover:bg-white/[0.03]")}
                        style={{ borderBottom: "1px solid #141414" }}
                        type="button"
                      >
                        <div className={cn("h-8 w-8 shrink-0 rounded-[2px] border flex items-center justify-center", isActive ? "border-emerald-500/30" : "border-[#282828]")}>
                          <IconImage iconId={category.iconId} label={category.label || ""} className="h-6 w-6 object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("truncate text-xs font-bold transition-colors", isActive ? "text-[#f0d9a0]" : "text-[#c8860a]")}>{category.label}</p>
                          <p className="text-[9px] font-mono uppercase tracking-wider text-[#9a7a40]">{isActive ? "ATIVO" : "OCULTO"}</p>
                        </div>
                        <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold font-mono border transition-all", isActive ? "bg-emerald-500 text-black border-emerald-400" : "bg-white/10 text-[#9a7a40] border-[#282828]")}>
                          {category.count}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* ── CUSTOM PINS ── */}
          {sidebarSection === "customPins" && (
            <div className="animate-[fade-in_150ms_ease-out]">
              {!isAuthenticated ? (
                <LockedFeature title="Pinos Personalizados" description="Crie marcadores próprios com fotos e notas. Seus pinos são salvos na nuvem." onLogin={openLoginModal} />
              ) : mode === "pin" && selectedCustomPin ? (
                <div className="p-3 grid gap-3">
                  <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px solid #1e1e1e" }}>
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-[2px] border border-[#282828] bg-white/5 text-[#ffdd66]"><MapPin size={13} /></span>
                      <div>
                        <h3 className="text-xs font-bold text-[#f0d9a0]">{editingCustomPinId ? "Editar Pino" : "Novo Pino"}</h3>
                        {selectedCustomPin.isPlaced === false
                          ? <p className="text-[9px] font-mono text-amber-400 animate-pulse font-bold">Clique no mapa para posicionar</p>
                          : <p className="text-[9px] font-mono text-[#9a7a40]">LOC: {selectedCustomPin.x.toFixed(2)}, {selectedCustomPin.y.toFixed(2)}</p>
                        }
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={cancelCustomPin} className="rounded-[2px] border border-red-500/25 bg-red-950/10 px-2.5 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-500/20 transition cursor-pointer">Cancelar</button>
                      {selectedCustomPin.isPlaced && (
                        <button type="button" onClick={confirmCustomPin} className="rounded-[2px] border border-[#c8860a] bg-[#282828]/40 px-2.5 py-1 text-[10px] font-semibold text-[#ffdd66] hover:bg-[#c8860a] hover:text-black transition cursor-pointer">Concluir</button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-[#9a7a40] uppercase tracking-wider mb-1">Nome</label>
                    <input type="text" value={selectedCustomPin.name} onChange={(e) => updateSelectedPinField("name", e.target.value)} placeholder="ex: Entrada Secreta" className="w-full rounded-[2px] border border-[#282828] bg-black/40 px-3 py-1.5 text-xs text-[#f0d9a0] outline-none focus:border-[#c8860a]/50 transition" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-[#9a7a40] uppercase tracking-wider mb-1">Cor</label>
                      <div className="flex flex-wrap gap-1">
                        {["#00d6a3","#00bcd4","#ffeb3b","#ff9800","#f44336","#9c27b0"].map((color) => (
                          <button key={color} type="button" onClick={() => updateSelectedPinField("color", color)} className={cn("h-5 w-5 rounded-full border border-black/40 cursor-pointer transition-all", selectedCustomPin.color === color ? "scale-125 ring-2 ring-[#c8860a] ring-offset-1 ring-offset-slate-900" : "hover:scale-110")} style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-[#9a7a40] uppercase tracking-wider mb-1">Ícone</label>
                      <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                        {customPinIcons.map((icon) => (
                          <button key={icon.id} type="button" title={icon.label} onClick={() => updateSelectedPinField("iconId", icon.id)} className={cn("grid h-6 w-6 flex-shrink-0 place-items-center rounded-[2px] border border-[#282828] bg-white/5 cursor-pointer transition hover:bg-white/10", selectedCustomPin.iconId === icon.id && "border-[#c8860a]/50 bg-[#282828]/20")}>
                            <img src={icon.src} alt={icon.label} className="h-4 w-4 object-contain" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-[#9a7a40] uppercase tracking-wider mb-1">Imagem</label>
                    <div className={cn("relative group cursor-pointer border border-dashed border-white/10 rounded-[2px] p-3 transition hover:bg-white/5", selectedCustomPin.imageUrl ? "border-[#c8860a]/30 bg-[#c8860a]/5" : "")} onClick={() => document.getElementById("pin-image-upload")?.click()}>
                      <input type="file" id="pin-image-upload" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { updateSelectedPinField("imageUrl", reader.result as string); }; reader.readAsDataURL(file); } }} />
                      {selectedCustomPin.imageUrl
                        ? <div className="relative aspect-video rounded-[2px] overflow-hidden border border-white/10"><img src={selectedCustomPin.imageUrl} alt="Preview" className="w-full h-full object-cover" /></div>
                        : <div className="flex flex-col items-center justify-center py-2 text-[#9a7a40] gap-1"><ImageIcon size={24} className="opacity-20" /><span className="text-[10px]">Clique para selecionar</span></div>
                      }
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-[#9a7a40] uppercase tracking-wider mb-1">Tags</label>
                    <input type="text" value={selectedCustomPin.tags.join(", ")} onChange={(e) => updateSelectedPinField("tags", e.target.value)} placeholder="Vila, Recurso, etc..." className="w-full rounded-[2px] border border-[#282828] bg-black/40 px-3 py-1.5 text-xs text-[#f0d9a0] outline-none focus:border-[#c8860a]/50 transition" />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-[#9a7a40] uppercase tracking-wider mb-1">Observação</label>
                    <textarea value={selectedCustomPin.description || ""} onChange={(e) => updateSelectedPinField("description", e.target.value)} placeholder="Observações..." rows={2} className="w-full rounded-[2px] border border-[#282828] bg-black/40 px-3 py-1.5 text-xs text-[#f0d9a0] outline-none focus:border-[#c8860a]/50 transition resize-none custom-scrollbar" />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid #1a1a1a" }}>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-[#c8860a]" />
                      <span className="text-[10px] font-bold text-[#f0d9a0]">Meus Pinos</span>
                    </div>
                    <button onClick={() => { openCustomPinsSection(); setIsSidebarOpen(false); }} className="flex items-center gap-1 rounded-[2px] bg-gradient-to-r from-[#c8860a] to-[#e0a020] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-black hover:brightness-110 cursor-pointer">
                      <Plus size={10} strokeWidth={3} />Criar
                    </button>
                  </div>

                  {customPins.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-[#9a7a40] leading-relaxed">
                      Nenhum pino criado ainda.<br />
                      <span className="text-[10px] block mt-1">Clique em Criar para começar.</span>
                    </div>
                  ) : (
                    <div>
                      {paginatedCustomPins.map((pin) => (
                        <div key={pin.id} className={cn("flex items-center gap-2.5 px-3 py-2.5 group transition-all", editingCustomPinId === pin.id ? "bg-[rgba(200,134,10,0.08)]" : "hover:bg-white/[0.03]")} style={{ borderBottom: "1px solid #141414" }}>
                          <div className="h-8 w-8 shrink-0 rounded-[2px] border border-[#282828] flex items-center justify-center cursor-pointer" style={{ backgroundColor: pin.color }} onClick={() => selectCustomPin(pin.id)}>
                            <IconImage iconId={pin.iconId} label={pin.name} className="h-5 w-5 object-contain" />
                          </div>
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => selectCustomPin(pin.id)}>
                            <p className="truncate text-xs font-bold text-[#c8860a] group-hover:text-[#f0d9a0] transition-colors">{pin.name}</p>
                            <p className="text-[9px] font-mono text-[#9a7a40]">{pin.x.toFixed(1)}, {pin.y.toFixed(1)}</p>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => toggleCustomPinVisibility(pin.id)} className="p-1 text-[#9a7a40] hover:text-[#f0d9a0] transition cursor-pointer" title={pin.isHidden ? "Mostrar" : "Ocultar"}>{pin.isHidden ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                            <button onClick={() => { selectCustomPin(pin.id); startEditingCustomPin(pin.id); }} className="p-1 text-[#9a7a40] hover:text-[#ffdd66] transition cursor-pointer" title="Editar"><Edit2 size={12} /></button>
                            <button onClick={() => removeCustomPin(pin.id)} className="p-1 text-[#9a7a40] hover:text-red-400 transition cursor-pointer" title="Excluir"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      ))}
                      <div className="px-3 py-2">
                        <PaginationControls currentPage={customPinsPage} totalPages={totalCustomPinsPages} onPageChange={setCustomPinsPage} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── ROUTES ── */}
          {sidebarSection === "routes" && (
            <div className="animate-[fade-in_150ms_ease-out]">
              {mode === "route" ? (
                <div className="p-3 grid gap-3">
                  <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px solid #1e1e1e" }}>
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-[2px] border border-[#282828] bg-white/5 text-orange-400"><Route size={13} /></span>
                      <div>
                        <h3 className="text-xs font-bold text-[#f0d9a0]">{selectedSavedRouteId ? "Editar Rota" : "Nova Rota"}</h3>
                        <p className="text-[9px] font-mono text-[#9a7a40] animate-pulse font-bold">Clique no mapa para ligar pontos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => setMode("explore")} className="rounded-[2px] border border-red-500/25 bg-red-950/10 px-2.5 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-500/20 transition cursor-pointer">Sair</button>
                      <button type="button" onClick={saveCurrentRoute} disabled={!isAuthenticated || currentRoute.checkpoints.length === 0} className="rounded-[2px] border border-[#c8860a] bg-[#282828]/40 px-2.5 py-1 text-[10px] font-semibold text-[#ffdd66] hover:bg-[#c8860a] hover:text-black transition cursor-pointer disabled:opacity-30">
                        {selectedSavedRouteId ? "Salvar" : "Criar"}{!isAuthenticated && <Shield className="inline-block ml-1" size={9} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-[#9a7a40] uppercase tracking-wider mb-1">Nome da Rota</label>
                    <input type="text" value={currentRoute.name} onChange={(e) => updateRouteField("name", e.target.value)} placeholder="Ex: Rota de Farm Stick" className="w-full rounded-[2px] border border-[#282828] bg-black/40 px-3 py-1.5 text-xs text-[#f0d9a0] outline-none focus:border-[#c8860a]/50 transition" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-[#9a7a40] uppercase tracking-wider mb-1">Cor da Linha</label>
                      <div className="flex items-center gap-1.5">
                        <input type="color" value={currentRoute.color} onChange={(e) => updateRouteField("color", e.target.value)} className="h-6 w-6 rounded border-0 bg-transparent p-0 cursor-pointer" />
                        <div className="flex flex-wrap gap-1">
                          {["#00d6a3","#ff9800","#f44336","#9c27b0","#2196f3"].map((c) => (
                            <button key={c} onClick={() => updateRouteField("color", c)} className={cn("h-4 w-4 rounded-full border border-black/20", currentRoute.color === c && "ring-1 ring-white")} style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-end justify-end gap-1">
                      <button onClick={shareCurrentRoute} className="p-1.5 rounded-[2px] bg-white/5 text-[#9a7a40] hover:text-[#f0d9a0] transition cursor-pointer" title="Compartilhar"><Share2 size={13} /></button>
                      <button onClick={copyRouteJson} className="p-1.5 rounded-[2px] bg-white/5 text-[#9a7a40] hover:text-[#f0d9a0] transition cursor-pointer" title="Copiar JSON"><Code2 size={13} /></button>
                      <button onClick={clearRoute} className="p-1.5 rounded-[2px] bg-white/5 text-[#9a7a40] hover:text-red-400 transition cursor-pointer" title="Limpar"><Trash2 size={13} /></button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-[#9a7a40] uppercase tracking-wider mb-1">Descrição</label>
                    <textarea value={currentRoute.description || ""} onChange={(e) => updateRouteField("description", e.target.value)} placeholder="Descrição opcional..." rows={2} className="w-full rounded-[2px] border border-[#282828] bg-black/40 px-3 py-1.5 text-xs text-[#f0d9a0] outline-none focus:border-[#c8860a]/50 transition resize-none custom-scrollbar" />
                  </div>

                  {currentRoute.checkpoints.length > 0 && (
                    <div className="pt-2" style={{ borderTop: "1px solid #1e1e1e" }}>
                      <label className="text-[9px] font-mono font-bold text-[#9a7a40] uppercase tracking-wider mb-2 block">Pontos ({currentRoute.checkpoints.length})</label>
                      <div className="grid gap-1.5 max-h-[12rem] overflow-y-auto custom-scrollbar pr-1">
                        {currentRoute.checkpoints.map((cp: RouteCheckpoint, idx: number) => (
                          <div key={cp.id} className="flex items-center justify-between rounded-[2px] bg-white/[0.03] border border-[#282828] p-2 group hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="shrink-0 grid h-4 w-4 place-items-center rounded-[2px] bg-orange-500 text-[9px] font-black text-[#f0d9a0]">{idx + 1}</span>
                              <div className="min-w-0">
                                <input type="text" value={cp.label || ""} onChange={(e) => updateCheckpointLabel(cp.id, e.target.value)} placeholder={`Ponto ${idx + 1}`} className="bg-transparent border-0 p-0 text-[10px] font-bold text-[#c8860a] outline-none w-full truncate placeholder:text-slate-600" />
                                <p className="text-[8px] font-mono text-[#9a7a40]">POS: {cp.x.toFixed(1)}, {cp.y.toFixed(1)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => moveCheckpoint(cp.id, -1)} disabled={idx === 0} className="p-1 text-[#9a7a40] hover:text-[#f0d9a0] disabled:opacity-20 cursor-pointer"><ChevronUp size={12} /></button>
                              <button onClick={() => moveCheckpoint(cp.id, 1)} disabled={idx === currentRoute.checkpoints.length - 1} className="p-1 text-[#9a7a40] hover:text-[#f0d9a0] disabled:opacity-20 cursor-pointer"><ChevronDown size={12} /></button>
                              <button onClick={() => removeCheckpoint(cp.id)} className="p-1 text-[#9a7a40] hover:text-red-400 cursor-pointer"><X size={12} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-1 p-2" style={{ borderBottom: "1px solid #1a1a1a" }}>
                    <button onClick={() => setRoutesView("mine")} className={cn("flex-1 rounded-[2px] py-1.5 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer", routesView === "mine" ? "bg-[rgba(200,134,10,0.15)] border border-[#c8860a] text-[#ffdd66]" : "text-[#9a7a40] hover:text-[#f0d9a0] border border-transparent")}>Minhas</button>
                    <button onClick={() => setRoutesView("public")} className={cn("flex-1 rounded-[2px] py-1.5 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer", routesView === "public" ? "bg-[rgba(200,134,10,0.15)] border border-[#c8860a] text-[#ffdd66]" : "text-[#9a7a40] hover:text-[#f0d9a0] border border-transparent")}>Públicas</button>
                  </div>

                  {routesView === "mine" ? (
                    !isAuthenticated ? (
                      <LockedFeature title="Minhas Rotas" description="Faça login para criar e gerenciar suas rotas." onLogin={openLoginModal} />
                    ) : (
                      <div>
                        <div className="grid grid-cols-2 gap-1.5 p-2" style={{ borderBottom: "1px solid #1a1a1a" }}>
                          <button onClick={() => { clearRoute(); setMode("route"); }} className="flex items-center justify-center gap-1.5 rounded-[2px] bg-gradient-to-r from-[#c8860a] to-[#e0a020] py-2 text-[9px] font-black uppercase tracking-wider text-slate-950 hover:brightness-110 transition-all cursor-pointer">
                            <Plus size={12} strokeWidth={3} />Nova Rota
                          </button>
                          <button onClick={openAutoRouteModal} className="flex items-center justify-center gap-1 rounded-[2px] bg-amber-500 py-2 text-[9px] font-black uppercase tracking-wider text-slate-950 hover:brightness-110 transition-all cursor-pointer">
                            <Route size={12} strokeWidth={3} />Auto Rota
                          </button>
                        </div>

                        {paginatedSavedRoutes.length === 0 ? (
                          <div className="py-8 text-center text-xs text-[#9a7a40]">Nenhuma rota salva.</div>
                        ) : (
                          <div>
                            {paginatedSavedRoutes.map((route) => (
                              <div key={route.id} className={cn("flex items-center gap-2.5 px-3 py-2.5 group transition-all", selectedSavedRouteId === route.id ? "bg-[rgba(200,134,10,0.06)]" : "hover:bg-white/[0.03]")} style={{ borderBottom: "1px solid #141414" }}>
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadSavedRoute(route.id)}>
                                  <div className="flex items-center gap-1.5">
                                    <p className="truncate text-xs font-bold text-[#c8860a] group-hover:text-[#f0d9a0] transition-colors">{route.name}</p>
                                    {route.isDisposable && <span className="shrink-0 rounded bg-amber-500/20 px-1 py-0.5 text-[7px] font-bold text-amber-400 uppercase">Temp</span>}
                                  </div>
                                  <p className="text-[9px] text-[#9a7a40]">{route.route.checkpoints.length} pontos</p>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => toggleRouteVisibility(route.id)} className="p-1 text-[#9a7a40] hover:text-[#f0d9a0] transition cursor-pointer" title={visibleRoutes.includes(route.id) ? "Ocultar" : "Mostrar"}>
                                    {visibleRoutes.includes(route.id) ? <Eye size={12} /> : <EyeOff size={12} />}
                                  </button>
                                  {!route.isDisposable && (route.isPublic
                                    ? <button onClick={() => unpublishSelectedRoute(route.id)} className="p-1 text-[#ffdd66] hover:text-red-400 transition cursor-pointer" title="Tornar Privada"><Globe size={12} /></button>
                                    : <button onClick={() => publishSelectedRoute(route.id)} className="p-1 text-[#9a7a40] hover:text-[#ffdd66] transition cursor-pointer" title="Tornar Pública"><Globe size={12} /></button>
                                  )}
                                  <button onClick={() => setRouteToComplete(route)} className="p-1 text-[#9a7a40] hover:text-teal-400 transition cursor-pointer" title="Finalizar Rota"><CircleCheck size={12} /></button>
                                  <button onClick={() => deleteSavedRoute(route.id)} className="p-1 text-[#9a7a40] hover:text-red-400 transition cursor-pointer" title="Excluir"><Trash2 size={12} /></button>
                                </div>
                              </div>
                            ))}
                            <div className="px-3 py-2">
                              <PaginationControls currentPage={mineRoutesPage} totalPages={totalSavedRoutesPages} onPageChange={setMineRoutesPage} />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div>
                      <div className="px-2 py-1.5" style={{ borderBottom: "1px solid #1a1a1a" }}>
                        <div className="relative group">
                          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9a7a40] group-focus-within:text-[#ffdd66] transition-colors" size={11} />
                          <input type="text" placeholder="Buscar rotas públicas..." value={publicRoutesQuery} onChange={(e) => setPublicRoutesQuery(e.target.value)} className="w-full rounded-[2px] border border-[#282828] bg-black/40 py-1.5 pl-7 pr-3 text-[10px] text-[#f0d9a0] outline-none focus:border-[#c8860a]/30 transition-all" />
                        </div>
                      </div>
                      {publicRoutesLoading ? (
                        <div className="py-8 text-center">
                          <Compass size={20} className="mx-auto text-[#ffdd66] animate-tech-spin mb-2 opacity-50" />
                          <p className="text-[9px] font-mono text-[#9a7a40] uppercase tracking-widest">Sincronizando...</p>
                        </div>
                      ) : paginatedPublicRoutes.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[#9a7a40] italic">Nenhuma rota pública encontrada.</div>
                      ) : (
                        <div>
                          {paginatedPublicRoutes.map((route) => (
                            <div key={route.id} className={cn("flex items-center gap-2 px-3 py-2.5 group transition-all", selectedSavedRouteId === route.id ? "bg-[rgba(200,134,10,0.06)]" : "hover:bg-white/[0.03]")} style={{ borderBottom: "1px solid #141414" }}>
                              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadSavedRoute(route.id)}>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <div className="h-5 w-5 rounded-full border border-white/10 bg-black/40 overflow-hidden shrink-0">
                                    {route.creator?.avatarUrl ? <img src={route.creator.avatarUrl} alt={route.creator.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-[8px] font-black text-[#ffdd66] bg-[#282828]/30">{route.creator?.name?.slice(0,1) || "S"}</div>}
                                  </div>
                                  <p className="truncate text-xs font-bold text-[#c8860a] group-hover:text-[#f0d9a0] transition-colors">{route.name}</p>
                                </div>
                                <p className="text-[9px] text-[#9a7a40] pl-6">por {route.creator?.name || "Anônimo"} • {route.route.checkpoints.length} pts</p>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button onClick={() => toggleRouteVisibility(route.id)} className="p-1.5 text-[#9a7a40] hover:text-[#f0d9a0] transition cursor-pointer">{visibleRoutes.includes(route.id) ? <Eye size={12} /> : <EyeOff size={12} />}</button>
                                <button onClick={() => duplicateSavedRoute(route.id)} className="p-1.5 text-[#9a7a40] hover:text-[#ffdd66] transition cursor-pointer" title="Importar"><Plus size={12} /></button>
                              </div>
                            </div>
                          ))}
                          <div className="px-3 py-2">
                            <PaginationControls currentPage={publicRoutesPage} totalPages={totalPublicRoutesPages} onPageChange={setPublicRoutesPage} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── SEARCH ── */}
          {sidebarSection === "search" && (
            <div className="animate-[fade-in_150ms_ease-out]">
              <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid #1a1a1a" }}>
                <div className="flex items-center gap-1.5">
                  <Search size={11} className="text-[#c8860a]" />
                  <span className="text-[10px] font-bold text-[#f0d9a0]">Busca Global</span>
                </div>
                <span className="rounded-full border border-[#282828] bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-[#9a7a40]">{searchResults.length} itens</span>
              </div>
              {searchResults.length === 0 ? (
                <div className="py-12 text-center">
                  <Compass size={24} className="mx-auto text-slate-700 mb-2 opacity-20" />
                  <p className="text-xs text-[#9a7a40] italic">Nenhum resultado encontrado.</p>
                </div>
              ) : (
                <div>
                  {paginatedSearchResults.map((item: any) => (
                    <div key={item.id} onClick={() => { if (item.isRoute) { loadSavedRoute(item.id); } else { focusCoords({ x: item.x, y: item.y }); if (item.isCustom) { selectCustomPin(item.id); } else { selectOfficialPoint(item.id); } } }} className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-white/[0.03] group transition-all" style={{ borderBottom: "1px solid #141414" }}>
                      <div className="h-8 w-8 shrink-0 rounded-[2px] border border-white/10 flex items-center justify-center" style={{ backgroundColor: item.color || "transparent" }}>
                        {item.isRoute ? <Route size={14} className="text-orange-400" /> : <IconImage iconId={item.iconId} label={item.name} className="h-5 w-5 object-contain" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-bold text-[#c8860a] group-hover:text-[#f0d9a0]">{item.name}</p>
                        <p className="text-[9px] font-mono text-[#9a7a40]">{item.isRoute ? "Rota" : item.type || "Custom"}{!item.isRoute && ` • ${item.x.toFixed(1)}, ${item.y.toFixed(1)}`}</p>
                      </div>
                      <ChevronRight size={12} className="text-slate-600 group-hover:text-[#ffdd66] transition-colors shrink-0" />
                    </div>
                  ))}
                  <div className="px-3 py-2">
                    <PaginationControls currentPage={searchPage} totalPages={totalSearchPages} onPageChange={setSearchPage} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {routeToComplete && (
        <RouteCompletionModal
          isOpen={true}
          onClose={() => setRouteToComplete(null)}
          routeTitle={routeToComplete.name}
          expectedCounts={routeToComplete.route.routeStats?.resourceCounts || {}}
          onComplete={(data) => {
            updateRouteCollectedStats(routeToComplete.id, data);
            addRouteResourcesToDailyStats(data);
            setRouteToComplete(null);
          }}
        />
      )}
    </div>
  );
});

function ChevronUp({
  size = 24,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

function ChevronDown({
  size = 24,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

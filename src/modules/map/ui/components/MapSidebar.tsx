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
  Settings,
  Users,
  UserPlus,
  LogOut,
  Copy,
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
          "grid place-items-center rounded-full bg-[rgba(255,255,255,0.1)] font-mono text-[0.6rem] font-black uppercase tracking-[0.14em] text-white",
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
      <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full" />
      <div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-black/40 text-cyan-400">
        <Shield size={32} />
        <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-red-500 text-white shadow-lg ring-2 ring-slate-900">
          <LogOut size={12} strokeWidth={3} />
        </div>
      </div>
    </div>
    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
      {title}
    </h3>
    <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mb-6">
      {description}
    </p>
    <button
      onClick={onLogin}
      className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-black transition hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer"
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
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:border-cyan-500/30 hover:bg-cyan-950/20 hover:text-[var(--cyan)] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="text-[10px] font-mono text-slate-500">
        PÁGINA <span className="text-slate-300">{currentPage}</span> DE{" "}
        {totalPages}
      </span>
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:border-cyan-500/30 hover:bg-cyan-950/20 hover:text-[var(--cyan)] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

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
  markRoutePinsCompleted,
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
  mapStats,
  worldStats,
  statsPeriod,
  setStatsPeriod,
  resetAllActiveRespawns,
  group,
  members,
  isGroupLoading,
  createGroup,
  joinGroup,
  leaveGroup,
  copyInviteCode,
  isAuthenticated,
  openLoginModal,
  setIsSettingsModalOpen,
  savedRoutes,
  publicRoutes,
}: MapSidebarProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [routeToComplete, setRouteToComplete] = useState<SavedMapRoute | null>(null);

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
  }, [savedRoutes, publicRoutes]);

  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const safeMapStats = {
    ore_count: mapStats?.ore_count || {},
    mushroom_count: mapStats?.mushroom_count || {},
    plant_count: mapStats?.plant_count || {},
    stick_count: mapStats?.stick_count || 0,
  };
  const safeWorldStats = {
    total_ores: worldStats?.total_ores || 0,
    marked_ores: worldStats?.marked_ores || 0,
    total_mushrooms: worldStats?.total_mushrooms || 0,
    marked_mushrooms: worldStats?.marked_mushrooms || 0,
    total_plants: worldStats?.total_plants || 0,
    marked_plants: worldStats?.marked_plants || 0,
    total_sticks: worldStats?.total_sticks || 0,
    marked_sticks: worldStats?.marked_sticks || 0,
  };

  return (
    <div className="pointer-events-none absolute left-0 top-1/2 z-[60] -translate-y-1/2 h-[calc(100%-2rem)] sm:h-[calc(100%-3rem)] flex items-center pl-3 sm:pl-5">
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="pointer-events-auto group relative flex h-16 w-11 items-center justify-center rounded-r-2xl border border-l-0 border-white/10 bg-[#030a0d]/90 backdrop-blur-xl text-[var(--cyan)] transition-all duration-300 hover:w-13 hover:bg-[#030a0d] active:scale-95 shadow-[10px_0_40px_rgba(0,0,0,0.5)] cursor-pointer -ml-3 sm:-ml-5"
          title="Abrir Menu"
        >
          <ChevronRight
            size={22}
            strokeWidth={3}
            className="transition-transform group-hover:translate-x-0.5"
          />
          <div className="absolute inset-0 tech-corner-accent opacity-20 pointer-events-none" />
          {/* Neon Glow effect */}
          <div className="absolute -right-0.5 top-1/4 bottom-1/4 w-[2px] bg-[var(--cyan)] shadow-[0_0_10px_var(--cyan)] opacity-40 group-hover:opacity-100 transition-opacity" />
        </button>
      )}
      <aside
        className={cn(
          "pointer-events-auto flex h-full flex-col overflow-hidden rounded-[32px] border border-white/8 backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] relative group/sidebar bg-[#030a0d]/60 hover:bg-[#030a0d]/96",
          isSidebarOpen
            ? "w-[340px] sm:w-[380px] opacity-100 translate-x-0"
            : "w-0 opacity-0 -translate-x-12",
        )}
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,214,163,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,214,163,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="flex h-full flex-col relative z-10">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative group flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--cyan)] to-emerald-500 blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-xl" />
                <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-black/50 border border-white/10 text-[var(--cyan)] shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  <Compass
                    size={18}
                    className="transition-transform duration-700 ease-out group-hover:rotate-[360deg]"
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-cyan-400">
                  Mapa interativo
                </h2>
                <div className="flex items-start gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00d6a3] shadow-[0_0_8px_#00d6a3] animate-pulse mt-0.5 flex-shrink-0" />
                  <p className="text-[8.5px] font-mono font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    Explore pins, crie trajetos e marque recursos.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/5 bg-white/[0.02] text-slate-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 active:scale-90 cursor-pointer shadow-sm"
                title="Fechar Menu"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 bg-black/10">
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  className={cn(
                    "relative rounded-xl py-2 pl-1 pr-1 transition-all duration-300 active:scale-95 cursor-pointer overflow-hidden group flex flex-col items-center justify-center gap-1",
                    sidebarSection === "officialPins"
                      ? "border border-[#00d6a3]/30 bg-[#00d6a3]/10 text-[#00d6a3] shadow-[0_0_12px_rgba(0,214,163,0.18)]"
                      : "border border-transparent bg-transparent text-slate-400 hover:bg-white/[0.02] hover:text-slate-200",
                  )}
                  onClick={() => setSidebarSection("officialPins")}
                  type="button"
                >
                  <span className="relative z-10 shrink-0">
                    <Layers
                      size={13}
                      className={cn(
                        "transition-transform duration-300",
                        sidebarSection === "officialPins"
                          ? "scale-110 text-[var(--cyan)] drop-shadow-[0_0_4px_rgba(0,214,163,0.5)]"
                          : "text-slate-400 group-hover:text-slate-250",
                      )}
                    />
                  </span>
                  <div className="flex flex-col text-center leading-none relative z-10 min-w-0">
                    <span
                      className={cn(
                        "text-[8px] font-mono font-bold tracking-wider uppercase transition-colors duration-300",
                        sidebarSection === "officialPins"
                          ? "text-[var(--cyan)]"
                          : "text-slate-500 group-hover:text-slate-350",
                      )}
                    >
                      Oficiais
                    </span>
                  </div>
                </button>
                <button
                  className={cn(
                    "relative rounded-xl py-2 pl-1 pr-1 transition-all duration-300 active:scale-95 cursor-pointer overflow-hidden group flex flex-col items-center justify-center gap-1",
                    sidebarSection === "customPins"
                      ? "border border-[#00d6a3]/30 bg-[#00d6a3]/10 text-[#00d6a3] shadow-[0_0_12px_rgba(0,214,163,0.18)]"
                      : "border border-transparent bg-transparent text-slate-400 hover:bg-white/[0.02] hover:text-slate-200",
                  )}
                  onClick={() => setSidebarSection("customPins")}
                  type="button"
                >
                  <span className="relative z-10 shrink-0">
                    <MapPin
                      size={13}
                      className={cn(
                        "transition-transform duration-300",
                        sidebarSection === "customPins"
                          ? "scale-110 text-[var(--cyan)] drop-shadow-[0_0_4px_rgba(0,214,163,0.5)]"
                          : "text-slate-400 group-hover:text-slate-250",
                      )}
                    />
                  </span>
                  <div className="flex flex-col text-center leading-none relative z-10 min-w-0">
                    <span
                      className={cn(
                        "text-[8px] font-mono font-bold tracking-wider uppercase transition-colors duration-300",
                        sidebarSection === "customPins"
                          ? "text-[var(--cyan)]"
                          : "text-slate-500 group-hover:text-slate-350",
                      )}
                    >
                      Meus
                    </span>
                  </div>
                </button>
                <button
                  className={cn(
                    "relative rounded-xl py-2 pl-1 pr-1 transition-all duration-300 active:scale-95 cursor-pointer overflow-hidden group flex flex-col items-center justify-center gap-1",
                    sidebarSection === "routes"
                      ? "border border-[#00d6a3]/30 bg-[#00d6a3]/10 text-[#00d6a3] shadow-[0_0_12px_rgba(0,214,163,0.18)]"
                      : "border border-transparent bg-transparent text-slate-400 hover:bg-white/[0.02] hover:text-slate-200",
                  )}
                  onClick={() => setSidebarSection("routes")}
                  type="button"
                >
                  <span className="relative z-10 shrink-0">
                    <Route
                      size={13}
                      className={cn(
                        "transition-transform duration-300",
                        sidebarSection === "routes"
                          ? "scale-110 text-[var(--cyan)] drop-shadow-[0_0_4px_rgba(0,214,163,0.5)]"
                          : "text-slate-400 group-hover:text-slate-250",
                      )}
                    />
                  </span>
                  <div className="flex flex-col text-center leading-none relative z-10 min-w-0">
                    <span
                      className={cn(
                        "text-[8px] font-mono font-bold tracking-wider uppercase transition-colors duration-300",
                        sidebarSection === "routes"
                          ? "text-[var(--cyan)]"
                          : "text-slate-500 group-hover:text-slate-350",
                      )}
                    >
                      Rotas
                    </span>
                  </div>
                </button>
                <button
                  className={cn(
                    "relative rounded-xl py-2 pl-1 pr-1 transition-all duration-300 active:scale-95 cursor-pointer overflow-hidden group flex flex-col items-center justify-center gap-1",
                    sidebarSection === "search"
                      ? "border border-[#00d6a3]/30 bg-[#00d6a3]/10 text-[#00d6a3] shadow-[0_0_12px_rgba(0,214,163,0.18)]"
                      : "border border-transparent bg-transparent text-slate-400 hover:bg-white/[0.02] hover:text-slate-200",
                  )}
                  onClick={() => setSidebarSection("search")}
                  type="button"
                >
                  <span className="relative z-10 shrink-0">
                    <Search
                      size={13}
                      className={cn(
                        "transition-transform duration-300",
                        sidebarSection === "search"
                          ? "scale-110 text-[var(--cyan)] drop-shadow-[0_0_4px_rgba(0,214,163,0.5)]"
                          : "text-slate-400 group-hover:text-slate-250",
                      )}
                    />
                  </span>
                  <div className="flex flex-col text-center leading-none relative z-10 min-w-0">
                    <span
                      className={cn(
                        "text-[8px] font-mono font-bold tracking-wider uppercase transition-colors duration-300",
                        sidebarSection === "search"
                          ? "text-[var(--cyan)]"
                          : "text-slate-500 group-hover:text-slate-350",
                      )}
                    >
                      Busca
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-5 custom-scrollbar relative z-10">
              <div className="flex flex-col gap-5 w-full min-w-0">
                {sidebarSection === "officialPins" ? (
                  <section className="rounded-[26px] border border-white/5 bg-black/25 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),0_12px_36px_rgba(0,0,0,0.2)]">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/8 bg-white/5 text-cyan-200">
                          <Layers size={16} />
                        </span>
                        <div>
                          <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-slate-400">
                            Categorias
                          </p>
                          <h3 className="text-base font-bold tracking-tight text-white">
                            Pins no mapa
                          </h3>
                        </div>
                      </div>
                      <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-0.5 font-mono text-[0.58rem] font-bold text-slate-400 uppercase tracking-wider">
                        {
                          officialPinCategories.base.filter(
                            (category) => category.total > 0,
                          ).length
                        }{" "}
                        grupos
                      </span>
                    </div>

                    <div className="relative group mb-5">
                      <Search
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[var(--cyan)] transition-colors"
                        size={14}
                      />
                      <input
                        className="w-full rounded-xl border border-white/8 bg-black/40 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-600 outline-none transition-all duration-300 focus:border-[var(--cyan)]/40 focus:bg-black/60"
                        onChange={(e) => setSidebarSearchQuery(e.target.value)}
                        placeholder="Filtrar categorias..."
                        type="text"
                        value={sidebarSearchQuery}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {officialPinCategories.base
                        .filter((category) => category.total > 0)
                        .map((category) => (
                          <button
                            key={category.type}
                            className={cn(
                              "group relative min-h-[9.5rem] overflow-hidden p-3 text-left transition-all duration-300 hover:-translate-y-1.5 cursor-pointer rounded-2xl border",
                              selectedTypes.includes(category.type)
                                ? "border-cyan-500/40 bg-[linear-gradient(180deg,rgba(0,214,163,0.14),rgba(113,92,255,0.03))] shadow-[0_12px_28px_rgba(0,0,0,0.4),0_0_20px_rgba(0,214,163,0.1)]"
                                : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05]",
                            )}
                            onClick={() =>
                              toggleSelectedType(category.type as MapMarkerType)
                            }
                            type="button"
                          >
                            <div className="absolute inset-0 tech-corner-accent opacity-40 group-hover:opacity-100" />
                            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)]" />
                            {selectedTypes.includes(
                              category.type as MapMarkerType,
                            ) ? (
                              <span className="absolute left-2 top-2 text-[var(--cyan)] drop-shadow-[0_0_4px_rgba(0,214,163,0.4)] scale-110 transition-transform">
                                <CircleCheck size={13} />
                              </span>
                            ) : null}
                            <span
                              className={cn(
                                "absolute right-2.5 top-2 rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold font-mono transition-all duration-300 border",
                                selectedTypes.includes(
                                  category.type as MapMarkerType,
                                )
                                  ? "bg-[var(--cyan)] text-black border-cyan-400 shadow-[0_0_10px_rgba(0,214,163,0.45)]"
                                  : "bg-white/10 text-slate-350 border-white/5",
                              )}
                            >
                              {category.count}
                            </span>
                            <div className="grid gap-2.5 mt-2">
                              <div className="grid h-[4.75rem] place-items-center rounded-xl border border-white/6 bg-[radial-gradient(circle_at_top,rgba(0,214,163,0.12),transparent_50%),rgba(255,255,255,0.01)] shadow-inner transition-all duration-300 group-hover:border-cyan-500/20 group-hover:bg-cyan-500/5">
                                <IconImage
                                  className="h-14 w-14 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)] transition-all duration-300 group-hover:scale-115 group-hover:-translate-y-1"
                                  iconId={category.iconId}
                                  label={
                                    category.label ||
                                    getMarkerTypeLabel(
                                      category.type as MapMarkerType,
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <p className="line-clamp-2 text-[0.78rem] font-bold leading-[1.25] text-slate-200 group-hover:text-white transition-colors">
                                  {category.label ||
                                    getMarkerTypeLabel(
                                      category.type as MapMarkerType,
                                    )}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span
                                    className={cn(
                                      "h-1.5 w-1.5 rounded-full",
                                      selectedTypes.includes(
                                        category.type as MapMarkerType,
                                      )
                                        ? "bg-cyan-455 animate-tech-pulse"
                                        : "bg-slate-500",
                                    )}
                                  />
                                  <p className="text-[0.58rem] font-mono uppercase tracking-[0.1em] text-slate-400 group-hover:text-slate-300">
                                    {selectedTypes.includes(
                                      category.type as MapMarkerType,
                                    )
                                      ? "ATIVADO"
                                      : "OCULTO"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>

                    {officialPinCategories.identified.length > 0 && (
                      <div className="mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="mb-5 flex items-center justify-between px-1">
                          <div className="flex items-center gap-3">
                            <span className="grid h-8 w-8 place-items-center rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
                              <Search size={14} />
                            </span>
                            <div>
                              <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-slate-400">
                                Identificados
                              </p>
                              <h3 className="text-sm font-bold tracking-tight text-white">
                                Recursos Específicos
                              </h3>
                            </div>
                          </div>
                          <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-400">
                            {officialPinCategories.identified.length} tipos
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          {officialPinCategories.identified.map((category) => (
                            <button
                              key={category.type}
                              className={cn(
                                "group relative min-h-[9rem] overflow-hidden p-3 text-left transition-all duration-300 hover:-translate-y-1 cursor-pointer rounded-2xl border",
                                selectedTypes.includes(category.type)
                                  ? "border-emerald-500/40 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(113,92,255,0.02))] shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
                                  : "border-white/5 bg-white/[0.02] hover:border-white/12",
                              )}
                              onClick={() => toggleSelectedType(category.type)}
                              type="button"
                            >
                              <div className="absolute inset-0 tech-corner-accent opacity-30 group-hover:opacity-60" />

                              {selectedTypes.includes(category.type) && (
                                <span className="absolute left-2 top-2 text-emerald-400 scale-100 transition-transform">
                                  <CircleCheck size={12} />
                                </span>
                              )}

                              <span
                                className={cn(
                                  "absolute right-2 top-2 rounded-full px-1.2 py-0.5 text-[0.55rem] font-bold font-mono transition-all duration-300 border",
                                  selectedTypes.includes(category.type)
                                    ? "bg-emerald-500 text-black border-emerald-400"
                                    : "bg-white/10 text-slate-400 border-white/5",
                                )}
                              >
                                {category.count}
                              </span>

                              <div className="grid gap-2 mt-2">
                                <div className="grid h-16 place-items-center rounded-xl border border-white/6 bg-white/[0.01] transition-all duration-300 group-hover:bg-emerald-500/5">
                                  <IconImage
                                    className="h-11 w-11 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:scale-110"
                                    iconId={category.iconId}
                                    label={category.label || ""}
                                  />
                                </div>
                                <div>
                                  <p className="line-clamp-2 text-[0.72rem] font-bold leading-tight text-slate-200 group-hover:text-white transition-colors">
                                    {category.label}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span
                                      className={cn(
                                        "h-1 w-1 rounded-full",
                                        selectedTypes.includes(category.type)
                                          ? "bg-emerald-400"
                                          : "bg-slate-600",
                                      )}
                                    />
                                    <p className="text-[0.55rem] font-mono text-slate-500 group-hover:text-slate-400">
                                      {selectedTypes.includes(category.type)
                                        ? "ATIVADO"
                                        : "OCULTO"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                ) : null}

                {sidebarSection === "customPins" ? (
                  <section className="rounded-[26px] border border-white/5 bg-black/25 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),0_12px_36px_rgba(0,0,0,0.2)]">
                    {!isAuthenticated ? (
                      <LockedFeature
                        title="Pinos Personalizados"
                        description="Crie marcadores próprios com fotos e notas. Seus pinos são salvos na nuvem para acesso em qualquer dispositivo."
                        onLogin={openLoginModal}
                      />
                    ) : mode === "pin" && selectedCustomPin ? (
                      <div className="grid gap-4 animate-[fade-in_150ms_ease-out]">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/8 bg-white/5 text-[var(--cyan)]">
                              <MapPin size={15} />
                            </span>
                            <div>
                              <h3 className="text-sm font-bold text-white">
                                {editingCustomPinId
                                  ? "Editar Pino"
                                  : "Novo Pino"}
                              </h3>
                              {selectedCustomPin.isPlaced === false ? (
                                <p className="text-[10px] font-mono text-amber-400 animate-pulse font-bold">
                                  Clique no mapa para posicionar
                                </p>
                              ) : (
                                <p className="text-[10px] font-mono text-slate-400">
                                  LOC: {selectedCustomPin.x.toFixed(2)},{" "}
                                  {selectedCustomPin.y.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={cancelCustomPin}
                              className="rounded-full border border-red-500/25 bg-red-950/10 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 hover:text-white transition cursor-pointer"
                            >
                              Cancelar
                            </button>

                            {selectedCustomPin.isPlaced && (
                              <button
                                type="button"
                                onClick={confirmCustomPin}
                                className="rounded-full border border-cyan-500 bg-cyan-950/40 px-3.5 py-1 text-xs font-semibold text-cyan-200 hover:bg-cyan-500 hover:text-white transition cursor-pointer"
                                title="Concluir edição"
                              >
                                Concluir
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Nome do Pino
                          </label>
                          <input
                            type="text"
                            value={selectedCustomPin.name}
                            onChange={(e) =>
                              updateSelectedPinField("name", e.target.value)
                            }
                            placeholder="ex: Entrada Secreta"
                            className="w-full rounded-xl border border-white/8 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-cyan-500/50 transition"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                              Cor
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                "#00d6a3",
                                "#00bcd4",
                                "#ffeb3b",
                                "#ff9800",
                                "#f44336",
                                "#9c27b0",
                              ].map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() =>
                                    updateSelectedPinField("color", color)
                                  }
                                  className={cn(
                                    "h-5 w-5 rounded-full border border-black/40 cursor-pointer transition-all duration-300",
                                    selectedCustomPin.color === color
                                      ? "scale-125 ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900"
                                      : "hover:scale-110",
                                  )}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                              Ícone
                            </label>
                            <div className="flex gap-2 overflow-x-auto pb-1 max-w-[150px] custom-scrollbar">
                              {customPinIcons.map((icon) => (
                                <button
                                  key={icon.id}
                                  type="button"
                                  title={icon.label}
                                  onClick={() =>
                                    updateSelectedPinField("iconId", icon.id)
                                  }
                                  className={cn(
                                    "grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg border border-white/8 bg-white/5 cursor-pointer transition hover:bg-white/10",
                                    selectedCustomPin.iconId === icon.id &&
                                      "border-cyan-500/50 bg-cyan-950/20 shadow-[0_0_8px_rgba(0,214,163,0.2)]",
                                  )}
                                >
                                  <img
                                    src={icon.src}
                                    alt={icon.label}
                                    className="h-5 w-5 object-contain"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Imagem do Marcador
                          </label>
                          <div
                            className={cn(
                              "relative group cursor-pointer border-2 border-dashed border-white/10 rounded-2xl p-4 transition hover:bg-white/5",
                              selectedCustomPin.imageUrl
                                ? "border-cyan-500/30 bg-cyan-500/5"
                                : "",
                            )}
                            onClick={() =>
                              document
                                .getElementById("pin-image-upload")
                                ?.click()
                            }
                          >
                            <input
                              type="file"
                              id="pin-image-upload"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    updateSelectedPinField(
                                      "imageUrl",
                                      reader.result as string,
                                    );
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />

                            {selectedCustomPin.imageUrl ? (
                              <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10">
                                <img
                                  src={selectedCustomPin.imageUrl}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                  <ImageIcon className="text-white" size={32} />
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-4 text-slate-400 gap-2">
                                <ImageIcon size={32} className="opacity-20" />
                                <span className="text-xs font-medium">
                                  Clique para selecionar imagem
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Categorias
                          </label>
                          <input
                            type="text"
                            value={selectedCustomPin.tags.join(", ")}
                            onChange={(e) =>
                              updateSelectedPinField("tags", e.target.value)
                            }
                            placeholder="Vila, Recurso, etc..."
                            className="w-full rounded-xl border border-white/8 bg-black/40 px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500/50 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Observação
                          </label>
                          <textarea
                            value={selectedCustomPin.description || ""}
                            onChange={(e) =>
                              updateSelectedPinField(
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Observações..."
                            rows={2}
                            className="w-full rounded-xl border border-white/8 bg-black/40 px-3.5 py-2 text-sm text-white outline-none focus:border-cyan-500/50 transition resize-none custom-scrollbar"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-4 animate-[fade-in_150ms_ease-out]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/8 bg-white/5 text-[var(--cyan)]">
                              <MapPin size={16} />
                            </span>
                            <div>
                              <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-slate-400">
                                Personalizados
                              </p>
                              <h3 className="text-base font-bold tracking-tight text-white">
                                Meus Pinos
                              </h3>
                            </div>
                          </div>
                          <button
                            onClick={openCustomPinsSection}
                            className="flex items-center gap-1.5 rounded-full bg-[var(--cyan)] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-black transition hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,214,163,0.3)] cursor-pointer"
                          >
                            <Plus size={12} strokeWidth={3} />
                            Criar
                          </button>
                        </div>

                        {customPins.length === 0 ? (
                          <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.01] px-4 py-6 text-center text-sm text-slate-400 leading-relaxed">
                            Você ainda não criou pins customizados.
                            <br />
                            <span className="text-xs text-slate-500 mt-1 block">
                              Clique no botão Criar no topo da lista.
                            </span>
                          </div>
                        ) : (
                          <>
                            {paginatedCustomPins.map((pin) => (
                              <div
                                key={pin.id}
                                className={cn(
                                  "flex items-center justify-between rounded-xl border p-3 transition-all duration-300 hover:-translate-y-0.5 group relative",
                                  editingCustomPinId === pin.id
                                    ? "border-cyan-500/40 bg-[linear-gradient(180deg,rgba(0,214,163,0.08),rgba(9,15,28,0.75))] shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
                                    : "border-white/5 bg-white/[0.01] hover:border-white/12 hover:bg-white/[0.03]",
                                )}
                              >
                                <div
                                  className="flex flex-1 items-center gap-3.5 min-w-0 cursor-pointer relative z-10"
                                  onClick={() => selectCustomPin(pin.id)}
                                >
                                  <div
                                    className="grid h-9 w-9 place-items-center rounded-xl border border-white/8 shadow-md shrink-0"
                                    style={{ backgroundColor: pin.color }}
                                  >
                                    <IconImage
                                      className="h-6 w-6 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.45)]"
                                      iconId={pin.iconId}
                                      label={pin.name}
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-slate-200 group-hover:text-white">
                                      {pin.name}
                                    </p>
                                    <p className="mt-0.5 truncate text-[10.5px] font-mono text-slate-400">
                                      LOC: {pin.x.toFixed(2)},{" "}
                                      {pin.y.toFixed(2)}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 relative z-20 shrink-0 ml-2">
                                  <button
                                    onClick={() =>
                                      toggleCustomPinVisibility(pin.id)
                                    }
                                    className="p-1.5 text-slate-500 hover:text-white transition cursor-pointer"
                                    title={
                                      pin.isHidden
                                        ? "Mostrar no mapa"
                                        : "Ocultar do mapa"
                                    }
                                  >
                                    {pin.isHidden ? (
                                      <EyeOff size={14} />
                                    ) : (
                                      <Eye size={14} />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      selectCustomPin(pin.id);
                                      startEditingCustomPin(pin.id);
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-[var(--cyan)] transition cursor-pointer"
                                    title="Editar"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => removeCustomPin(pin.id)}
                                    className="p-1.5 text-slate-500 hover:text-red-400 transition cursor-pointer"
                                    title="Excluir"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                            <PaginationControls
                              currentPage={customPinsPage}
                              totalPages={totalCustomPinsPages}
                              onPageChange={setCustomPinsPage}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </section>
                ) : null}

                {sidebarSection === "routes" ? (
                  <div className="grid gap-4 animate-[fade-in_150ms_ease-out]">
                    {mode === "route" ? (
                      <section className="rounded-[26px] border border-white/5 bg-black/25 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),0_12px_36px_rgba(0,0,0,0.2)]">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/8 bg-white/5 text-orange-400">
                              <Route size={15} />
                            </span>
                            <div>
                              <h3 className="text-sm font-bold text-white">
                                {selectedSavedRouteId
                                  ? "Editar Rota"
                                  : "Nova Rota"}
                              </h3>
                              <p className="text-[10px] font-mono text-slate-400 animate-pulse font-bold">
                                Clique no mapa para ligar pontos
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setMode("explore")}
                              className="rounded-full border border-red-500/25 bg-red-950/10 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 hover:text-white transition cursor-pointer"
                            >
                              Sair
                            </button>
                            <button
                              type="button"
                              onClick={saveCurrentRoute}
                              disabled={
                                !isAuthenticated ||
                                currentRoute.checkpoints.length === 0
                              }
                              className="rounded-full border border-cyan-500 bg-cyan-950/40 px-3.5 py-1 text-xs font-semibold text-cyan-200 hover:bg-cyan-500 hover:text-white transition cursor-pointer disabled:opacity-30"
                            >
                              {selectedSavedRouteId ? "Salvar" : "Criar"}
                              {!isAuthenticated && (
                                <Shield
                                  className="inline-block ml-1"
                                  size={10}
                                />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-4">
                          <div>
                            <label className="block text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                              Nome da Rota
                            </label>
                            <input
                              type="text"
                              value={currentRoute.name}
                              onChange={(e) =>
                                updateRouteField("name", e.target.value)
                              }
                              placeholder="Ex: Rota de Farm Stick"
                              className="w-full rounded-xl border border-white/8 bg-black/40 px-3.5 py-2 text-sm text-white outline-none focus:border-cyan-500/50 transition"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Cor da Linha
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={currentRoute.color}
                                  onChange={(e) =>
                                    updateRouteField("color", e.target.value)
                                  }
                                  className="h-8 w-8 rounded border-0 bg-transparent p-0 cursor-pointer"
                                />
                                <div className="flex flex-wrap gap-1">
                                  {[
                                    "#00d6a3",
                                    "#ff9800",
                                    "#f44336",
                                    "#9c27b0",
                                    "#2196f3",
                                  ].map((c) => (
                                    <button
                                      key={c}
                                      onClick={() =>
                                        updateRouteField("color", c)
                                      }
                                      className={cn(
                                        "h-4 w-4 rounded-full border border-black/20",
                                        currentRoute.color === c &&
                                          "ring-1 ring-white",
                                      )}
                                      style={{ backgroundColor: c }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col justify-end">
                              <div className="flex items-center gap-1.5 justify-end">
                                <button
                                  onClick={shareCurrentRoute}
                                  className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
                                  title="Compartilhar"
                                >
                                  <Share2 size={14} />
                                </button>
                                <button
                                  onClick={copyRouteJson}
                                  className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
                                  title="Copiar JSON"
                                >
                                  <Code2 size={14} />
                                </button>
                                <button
                                  onClick={clearRoute}
                                  className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-red-400 transition cursor-pointer"
                                  title="Limpar Tudo"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                              Descrição
                            </label>
                            <textarea
                              value={currentRoute.description || ""}
                              onChange={(e) =>
                                updateRouteField("description", e.target.value)
                              }
                              placeholder="Descrição opcional..."
                              rows={2}
                              className="w-full rounded-xl border border-white/8 bg-black/40 px-3.5 py-2 text-sm text-white outline-none focus:border-cyan-500/50 transition resize-none custom-scrollbar"
                            />
                          </div>

                          {currentRoute.checkpoints.length > 0 && (
                            <div className="mt-2 border-t border-white/10 pt-4">
                              <div className="flex items-center justify-between mb-3">
                                <label className="text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                                  Pontos ({currentRoute.checkpoints.length})
                                </label>
                                <span className="text-[10px] text-slate-500 italic">
                                  Arraste para ordenar (em breve)
                                </span>
                              </div>
                              <div className="grid gap-2 max-h-[14rem] overflow-y-auto custom-scrollbar pr-1">
                                {currentRoute.checkpoints.map(
                                  (cp: RouteCheckpoint, idx: number) => (
                                    <div
                                      key={cp.id}
                                      className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/5 p-2.5 group hover:border-white/10 transition-colors"
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <span className="shrink-0 grid h-5 w-5 place-items-center rounded-lg bg-orange-500 text-[10px] font-black text-white shadow-lg">
                                          {idx + 1}
                                        </span>
                                        <div className="min-w-0">
                                          <input
                                            type="text"
                                            value={cp.label || ""}
                                            onChange={(e) =>
                                              updateCheckpointLabel(
                                                cp.id,
                                                e.target.value,
                                              )
                                            }
                                            placeholder={`Ponto ${idx + 1}`}
                                            className="bg-transparent border-0 p-0 text-xs font-bold text-slate-200 outline-none w-full truncate placeholder:text-slate-600"
                                          />
                                          <p className="text-[9px] font-mono text-slate-500">
                                            POS: {cp.x.toFixed(1)},{" "}
                                            {cp.y.toFixed(1)}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() =>
                                            moveCheckpoint(cp.id, -1)
                                          }
                                          disabled={idx === 0}
                                          className="p-1.5 text-slate-500 hover:text-white disabled:opacity-20 cursor-pointer"
                                        >
                                          <ChevronUp size={14} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            moveCheckpoint(cp.id, 1)
                                          }
                                          disabled={
                                            idx ===
                                            currentRoute.checkpoints.length - 1
                                          }
                                          className="p-1.5 text-slate-500 hover:text-white disabled:opacity-20 cursor-pointer"
                                        >
                                          <ChevronDown size={14} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            removeCheckpoint(cp.id)
                                          }
                                          className="p-1.5 text-slate-500 hover:text-red-400 cursor-pointer"
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </section>
                    ) : (
                      <>
                        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/5 shadow-inner">
                          <button
                            onClick={() => setRoutesView("mine")}
                            className={cn(
                              "flex-1 rounded-xl py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer",
                              routesView === "mine"
                                ? "bg-white/10 text-white shadow-lg"
                                : "text-slate-500 hover:text-slate-300",
                            )}
                          >
                            Minhas Rotas
                          </button>
                          <button
                            onClick={() => setRoutesView("public")}
                            className={cn(
                              "flex-1 rounded-xl py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer",
                              routesView === "public"
                                ? "bg-white/10 text-white shadow-lg"
                                : "text-slate-500 hover:text-slate-300",
                            )}
                          >
                            Públicas
                          </button>
                        </div>

                        {routesView === "mine" ? (
                          <section className="rounded-[26px] border border-white/5 bg-black/25 p-4 min-w-0">
                            {!isAuthenticated ? (
                              <LockedFeature
                                title="Minhas Rotas"
                                description="Faça login para criar, salvar e gerenciar suas rotas de farm personalizadas."
                                onLogin={openLoginModal}
                              />
                            ) : (
                              <>
                                  <div className="grid grid-cols-2 gap-2 mb-4">
                                    <button
                                      onClick={() => {
                                        clearRoute();
                                        setMode("route");
                                      }}
                                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--cyan)] py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(0,214,163,0.3)] cursor-pointer"
                                    >
                                      <Plus size={16} strokeWidth={3} />
                                      Nova Rota
                                    </button>
                                    <button
                                      onClick={openAutoRouteModal}
                                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
                                      title="Abre as opções de filtro para gerar rota automática (excluída no próximo reset)"
                                    >
                                      <Route size={16} strokeWidth={3} />
                                      Auto Rota
                                    </button>
                                  </div>

                                <div className="flex items-center justify-between mb-3 px-1">
                                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Suas Coleções
                                  </h4>
                                </div>

                                {paginatedSavedRoutes.length === 0 ? (
                                  <div className="py-8 text-center text-xs text-slate-500">
                                    Nenhuma rota salva.
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-2.5 min-w-0">
                                    {paginatedSavedRoutes.map((route) => (
                                      <div
                                        key={route.id}
                                        className={cn(
                                          "flex items-center justify-between rounded-xl border p-3 transition-all group min-w-0",
                                          selectedSavedRouteId === route.id
                                            ? "border-cyan-500/40 bg-cyan-500/5 shadow-[0_0_15px_rgba(0,214,163,0.1)]"
                                            : "border-white/5 bg-white/[0.01] hover:border-white/15",
                                        )}
                                      >
                                        <div
                                          className="flex-1 min-w-0 cursor-pointer"
                                          onClick={() =>
                                            loadSavedRoute(route.id)
                                          }
                                        >
                                          <div className="flex items-center gap-2">
                                            <p className="truncate text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                                              {route.name}
                                            </p>
                                            {route.isDisposable && (
                                              <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[8px] font-bold text-amber-400 uppercase" title="Será excluída no próximo reset global">
                                                Temp
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[10px] text-slate-500">
                                            {route.route.checkpoints.length}{" "}
                                            pontos • {route.color}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() =>
                                              toggleRouteVisibility(route.id)
                                            }
                                            className="p-1.5 text-slate-500 hover:text-white transition cursor-pointer"
                                            title={
                                              visibleRoutes.includes(route.id)
                                                ? "Ocultar no Mapa"
                                                : "Mostrar no Mapa"
                                            }
                                          >
                                            {visibleRoutes.includes(
                                              route.id,
                                            ) ? (
                                              <Eye size={14} />
                                            ) : (
                                              <EyeOff size={14} />
                                            )}
                                          </button>
                                          {!route.isDisposable && (
                                            route.isPublic ? (
                                              <button
                                                onClick={() =>
                                                  unpublishSelectedRoute(route.id)
                                                }
                                                className="p-1.5 text-[var(--cyan)] hover:text-red-400 transition cursor-pointer"
                                                title="Tornar Privada"
                                              >
                                                <Globe size={14} />
                                              </button>
                                            ) : (
                                              <button
                                                onClick={() =>
                                                  publishSelectedRoute(route.id)
                                                }
                                                className="p-1.5 text-slate-500 hover:text-[var(--cyan)] transition cursor-pointer"
                                                title="Tornar Pública"
                                              >
                                                <Globe size={14} />
                                              </button>
                                            )
                                          )}
                                          <button
                                            onClick={() => setRouteToComplete(route)}
                                            className="p-1.5 text-slate-500 hover:text-teal-400 transition cursor-pointer"
                                            title="Finalizar Rota"
                                          >
                                            <CircleCheck size={14} />
                                          </button>
                                          <button
                                            onClick={() =>
                                              deleteSavedRoute(route.id)
                                            }
                                            className="p-1.5 text-slate-500 hover:text-red-400 transition cursor-pointer"
                                            title="Excluir"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    <PaginationControls
                                      currentPage={mineRoutesPage}
                                      totalPages={totalSavedRoutesPages}
                                      onPageChange={setMineRoutesPage}
                                    />
                                  </div>
                                )}
                              </>
                            )}
                          </section>
                        ) : (
                          <section className="rounded-[26px] border border-white/5 bg-black/25 p-4 min-w-0">
                            <div className="relative block group mb-4">
                              <Search
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[var(--cyan)] transition-colors"
                                size={14}
                              />
                              <input
                                type="text"
                                placeholder="Buscar rotas públicas..."
                                value={publicRoutesQuery}
                                onChange={(e) =>
                                  setPublicRoutesQuery(e.target.value)
                                }
                                className="w-full rounded-xl border border-white/8 bg-black/40 py-2.5 pl-9 pr-4 text-xs text-white outline-none focus:border-cyan-500/30 transition-all"
                              />
                            </div>
                            {publicRoutesLoading ? (
                              <div className="py-8 text-center">
                                <Compass
                                  size={24}
                                  className="mx-auto text-[var(--cyan)] animate-tech-spin mb-2 opacity-50"
                                />
                                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                  Sincronizando...
                                </p>
                              </div>
                            ) : paginatedPublicRoutes.length === 0 ? (
                              <div className="py-8 text-center text-xs text-slate-500 italic">
                                Nenhuma rota pública encontrada.
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2.5 min-w-0">
                                {paginatedPublicRoutes.map((route) => (
                                  <div
                                    key={route.id}
                                    className={cn(
                                      "flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.01] p-3.5 hover:border-white/15 hover:bg-white/[0.03] transition-all group min-w-0",
                                      selectedSavedRouteId === route.id
                                        ? "border-cyan-500/40 bg-cyan-500/5 shadow-[0_0_15px_rgba(0,214,163,0.1)]"
                                        : "border-white/5 bg-white/[0.01] hover:border-white/15",
                                    )}
                                  >
                                    <div
                                      className="flex-1 min-w-0 cursor-pointer"
                                      onClick={() => loadSavedRoute(route.id)}
                                    >
                                      <div className="flex items-center gap-2.5 mb-1.5 min-w-0">
                                        <div className="h-6 w-6 rounded-full border border-white/10 bg-black/40 overflow-hidden shrink-0">
                                          {route.creator?.avatarUrl ? (
                                            <img
                                              src={route.creator.avatarUrl}
                                              alt={route.creator.name}
                                              className="h-full w-full object-cover"
                                            />
                                          ) : (
                                            <div className="h-full w-full flex items-center justify-center text-[10px] font-black text-[var(--cyan)] bg-cyan-950/30">
                                              {route.creator?.name?.slice(
                                                0,
                                                1,
                                              ) || "S"}
                                            </div>
                                          )}
                                        </div>
                                        <p className="truncate text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                                          {route.name}
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-2 pl-8 min-w-0">
                                        <p className="truncate text-[10px] font-medium text-slate-500 uppercase tracking-tight flex-1">
                                          por{" "}
                                          <span className="text-slate-400">
                                            {route.creator?.name || "Anônimo"}
                                          </span>
                                        </p>
                                        <span className="text-slate-700 text-[10px] shrink-0">
                                          •
                                        </span>
                                        <p className="text-[10px] font-mono text-slate-500 shrink-0">
                                          {route.route.checkpoints.length} pts
                                        </p>
                                      </div>
                                      {route.description && (
                                        <p className="mt-2 pl-8 line-clamp-2 text-[11px] text-slate-400 leading-relaxed italic border-l border-white/5 ml-1">
                                          "{route.description}"
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 ml-2 shrink-0">
                                      <button
                                        onClick={() =>
                                          toggleRouteVisibility(route.id)
                                        }
                                        className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition cursor-pointer"
                                        title={
                                          visibleRoutes.includes(route.id)
                                            ? "Ocultar no Mapa"
                                            : "Mostrar no Mapa"
                                        }
                                      >
                                        {visibleRoutes.includes(route.id) ? (
                                          <Eye size={16} />
                                        ) : (
                                          <EyeOff size={16} />
                                        )}
                                      </button>
                                      <button
                                        onClick={() =>
                                          duplicateSavedRoute(route.id)
                                        }
                                        className="p-2 text-slate-500 hover:text-[var(--cyan)] hover:bg-white/5 rounded-lg transition cursor-pointer"
                                        title="Importar para minhas rotas"
                                      >
                                        <Plus size={16} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <PaginationControls
                                  currentPage={publicRoutesPage}
                                  totalPages={totalPublicRoutesPages}
                                  onPageChange={setPublicRoutesPage}
                                />
                              </div>
                            )}
                          </section>
                        )}
                      </>
                    )}
                  </div>
                ) : null}

                {sidebarSection === "search" ? (
                  <div className="grid gap-4 animate-[fade-in_150ms_ease-out]">
                    <section className="rounded-[26px] border border-white/5 bg-black/25 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),0_12px_36px_rgba(0,0,0,0.2)]">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/8 bg-white/5 text-cyan-200">
                            <Search size={16} />
                          </span>
                          <div>
                            <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-slate-400">
                              Global
                            </p>
                            <h3 className="text-base font-bold tracking-tight text-white">
                              Resultados da Busca
                            </h3>
                          </div>
                        </div>
                        <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-0.5 font-mono text-[0.58rem] font-bold text-slate-400 uppercase tracking-wider">
                          {searchResults.length} itens
                        </span>
                      </div>

                      {searchResults.length === 0 ? (
                        <div className="py-12 text-center">
                          <Compass
                            size={32}
                            className="mx-auto text-slate-700 mb-3 opacity-20"
                          />
                          <p className="text-sm text-slate-500 italic">
                            Nenhum recurso encontrado.
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          {paginatedSearchResults.map((item: any) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (item.isRoute) {
                                  loadSavedRoute(item.id);
                                } else {
                                  focusCoords({ x: item.x, y: item.y });
                                  if (item.isCustom) {
                                    selectCustomPin(item.id);
                                  } else {
                                    selectOfficialPoint(item.id);
                                  }
                                }
                              }}
                              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] p-3 hover:border-white/15 hover:bg-white/[0.03] transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className="h-9 w-9 rounded-lg border border-white/10 flex items-center justify-center shrink-0"
                                  style={{
                                    backgroundColor:
                                      item.color || "transparent",
                                  }}
                                >
                                  {item.isRoute ? (
                                    <Route
                                      size={16}
                                      className="text-orange-400"
                                    />
                                  ) : (
                                    <IconImage
                                      iconId={item.iconId}
                                      label={item.name}
                                      className="h-6 w-6 object-contain"
                                    />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-200 group-hover:text-white truncate">
                                    {item.name}
                                  </p>
                                  <p className="text-[10px] font-mono text-slate-500">
                                    {item.isRoute
                                      ? "Rota"
                                      : item.type || "Custom"}
                                    {!item.isRoute &&
                                      ` • ${item.x.toFixed(1)}, ${item.y.toFixed(1)}`}
                                    {item.isRoute &&
                                      item.route?.checkpoints &&
                                      ` • ${item.route.checkpoints.length} pts`}
                                  </p>
                                </div>
                              </div>
                              <div className="p-1.5 text-slate-600 group-hover:text-[var(--cyan)] transition-colors">
                                <ChevronRight size={14} />
                              </div>
                            </div>
                          ))}
                          <PaginationControls
                            currentPage={searchPage}
                            totalPages={totalSearchPages}
                            onPageChange={setSearchPage}
                          />
                        </div>
                      )}
                    </section>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {routeToComplete && (
        <RouteCompletionModal
          isOpen={true}
          onClose={() => setRouteToComplete(null)}
          routeTitle={routeToComplete.name}
          expectedCounts={routeToComplete.route.routeStats?.resourceCounts || {}}
          onComplete={(data, markPins) => {
            updateRouteCollectedStats(routeToComplete.id, data);
            addRouteResourcesToDailyStats(data);
            if (markPins) {
              markRoutePinsCompleted(routeToComplete.id);
            }
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

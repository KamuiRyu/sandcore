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
  updateRouteField: (field: keyof CustomRoute, value: string | string[]) => void;
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
    total_ores: number; marked_ores: number;
    total_mushrooms: number; marked_mushrooms: number;
    total_plants: number; marked_plants: number;
    total_sticks: number; marked_sticks: number;
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

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  bg: "#e8d5a8",
  frame: "linear-gradient(150deg,#4a6350,#34463a 55%,#2c3b31)",
  text: "#2e1c0a",
  sub: "#5a3618",
  muted: "#8a6040",
  border: "rgba(90,55,20,.28)",
  dash: "rgba(95,60,22,.45)",
  input: "rgba(90,55,20,.07)",
  card: "rgba(200,160,80,.12)",
  goldBg: "linear-gradient(180deg,#d8b87f,#c19f63)",
  goldShadow: "inset 0 1px 3px rgba(80,50,15,.30), inset 0 0 0 1px rgba(90,60,25,.40)",
  teal: "#194651",
  serif: "'Cinzel','Georgia',serif",
};

// ── Small helpers ──────────────────────────────────────────────────────────
const Divider = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-2", className)}>
    <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg,transparent,${C.dash})` }} />
    <svg viewBox="0 0 12 12" width={8} height={8} fill={C.muted}><path d="M6 0l1.5 4.5L12 6l-4.5 1.5L6 12 4.5 7.5 0 6l4.5-1.5Z"/></svg>
    <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg,${C.dash},transparent)` }} />
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="h-px flex-1" style={{ background: C.border }} />
    <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ fontFamily: C.serif, color: C.muted }}>{children}</span>
    <div className="h-px flex-1" style={{ background: C.border }} />
  </div>
);

const GoldBtn = ({ children, onClick, disabled, small }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; small?: boolean }) => (
  <button onClick={onClick} disabled={disabled}
    className={cn("inline-flex items-center justify-center gap-1.5 font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 disabled:opacity-40 rounded-[3px]", small ? "px-2.5 py-1 text-[9px]" : "px-3 py-1.5 text-[10px]")}
    style={{ background: C.goldBg, color: C.teal, boxShadow: C.goldShadow, fontFamily: C.serif }}
    onMouseEnter={e => !disabled && (e.currentTarget.style.filter = 'brightness(1.06)')}
    onMouseLeave={e => (e.currentTarget.style.filter = '')}
  >
    {children}
  </button>
);

const GhostBtn = ({ children, onClick, danger }: { children: React.ReactNode; onClick?: () => void; danger?: boolean }) => (
  <button onClick={onClick}
    className="inline-flex items-center justify-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-all active:scale-95 rounded-[3px] border"
    style={{ border: `1px solid ${danger ? 'rgba(160,40,40,.35)' : C.border}`, background: danger ? 'rgba(120,20,20,.08)' : C.input, color: danger ? '#b04040' : C.sub }}
    onMouseEnter={e => e.currentTarget.style.background = danger ? 'rgba(120,20,20,.18)' : 'rgba(90,55,20,.16)'}
    onMouseLeave={e => e.currentTarget.style.background = danger ? 'rgba(120,20,20,.08)' : C.input}
  >
    {children}
  </button>
);

const Input = ({ value, onChange, placeholder, type = "text", rows }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; rows?: number }) => {
  const shared = { background: C.input, border: `1px solid ${C.border}`, color: C.text, borderRadius: 3, outline: 'none', fontSize: 11, padding: '5px 8px', width: '100%', transition: 'border-color .15s' };
  if (rows) return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="custom-scrollbar resize-none"
      style={shared as any}
      onFocus={e => e.currentTarget.style.borderColor = 'rgba(90,55,20,.55)'}
      onBlur={e => e.currentTarget.style.borderColor = C.border}
    />
  );
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={shared as any}
      onFocus={e => e.currentTarget.style.borderColor = 'rgba(90,55,20,.55)'}
      onBlur={e => e.currentTarget.style.borderColor = C.border}
    />
  );
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[9px] font-black uppercase tracking-[0.14em] mb-1.5" style={{ color: C.muted, fontFamily: C.serif }}>{children}</p>
);

const IconImage = memo(function IconImage({ iconId, label, className }: { className?: string; iconId: string; label: string }) {
  const [hasError, setHasError] = useState(false);
  const src = getMarkerIconSrc(iconId);
  if (!src || hasError) return (
    <span className={cn("grid place-items-center rounded-full font-mono text-[0.6rem] font-black uppercase", className)} style={{ background: C.card, color: C.muted }}>
      {label.slice(0, 2)}
    </span>
  );
  return <img alt="" className={className} draggable={false} onError={() => setHasError(true)} src={src} />;
});

const LockedFeature = ({ title, description, onLogin }: { title: string; description: string; onLogin: () => void }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
    <div className="relative grid h-12 w-12 place-items-center rounded-sm border mb-3" style={{ borderColor: C.border, background: C.card, color: C.sub }}>
      <Shield size={24} />
      <div className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-white ring-2" style={{ ringColor: C.bg }}>
        <LogOut size={10} strokeWidth={3} />
      </div>
    </div>
    <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ fontFamily: C.serif, color: C.text }}>{title}</p>
    <p className="text-[10px] leading-relaxed mb-4" style={{ color: C.muted }}>{description}</p>
    <GoldBtn onClick={onLogin}>Entrar na conta</GoldBtn>
  </div>
);

function PaginationControls({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-2 mt-3">
      <button type="button" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}
        className="flex h-7 w-7 items-center justify-center rounded-[2px] border transition-all cursor-pointer disabled:opacity-30"
        style={{ border: `1px solid ${C.border}`, background: C.input, color: C.muted }}>
        <ChevronLeft size={12} />
      </button>
      <span className="text-[9px] font-mono" style={{ color: C.muted }}>
        {currentPage} / {totalPages}
      </span>
      <button type="button" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}
        className="flex h-7 w-7 items-center justify-center rounded-[2px] border transition-all cursor-pointer disabled:opacity-30"
        style={{ border: `1px solid ${C.border}`, background: C.input, color: C.muted }}>
        <ChevronRight size={12} />
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
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

  useEffect(() => {
    const handleOpenRouteCompletion = (e: CustomEvent<string>) => {
      const routeId = e.detail;
      const route = savedRoutes.find(r => r.id === routeId) || publicRoutes.find(r => r.id === routeId);
      if (route) {
        setRouteToComplete(route);
        setIsSidebarOpen(true);
        setSidebarSection("routes");
      }
    };
    window.addEventListener('open-route-completion', handleOpenRouteCompletion as EventListener);
    return () => window.removeEventListener('open-route-completion', handleOpenRouteCompletion as EventListener);
  }, [savedRoutes, publicRoutes, setIsSidebarOpen, setSidebarSection]);

  const NAV = [
    { id: "officialPins" as SidebarSection, icon: Layers,  label: "Oficiais" },
    { id: "customPins"  as SidebarSection, icon: MapPin,   label: "Meus" },
    { id: "routes"      as SidebarSection, icon: Route,    label: "Rotas" },
    { id: "search"      as SidebarSection, icon: Search,   label: "Busca" },
  ];

  return (
    <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-[60] flex items-center">

      {/* Toggle button when closed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="pointer-events-auto group absolute left-0 flex h-20 w-7 items-center justify-center rounded-r-[4px] border-l-0 transition-all duration-300 hover:w-9 active:scale-95 shadow-[3px_0_12px_rgba(0,0,0,0.4)] cursor-pointer"
          style={{ border: `1px solid rgba(90,55,20,.3)`, background: C.frame }}
          title="Abrir Menu"
        >
          <ChevronRight size={16} strokeWidth={2.5} style={{ color: C.bg }} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "pointer-events-auto flex h-full flex-col overflow-hidden transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] absolute left-0 w-[340px] shadow-[8px_0_30px_rgba(0,0,0,0.45)]",
          isSidebarOpen ? "translate-x-0" : "-translate-x-[105%]",
        )}
        style={{ background: C.frame, padding: "3px 3px 3px 3px", borderRadius: "0 6px 6px 0" }}
      >
        {/* Parchment interior */}
        <div className="flex flex-col h-full overflow-hidden relative" style={{ borderRadius: "0 4px 4px 0", background: C.bg, backgroundImage: ["radial-gradient(ellipse at 20% 5%,rgba(255,250,220,.6) 0%,transparent 50%)","radial-gradient(ellipse at 80% 95%,rgba(160,100,40,.12) 0%,transparent 50%)"].join(",") }}>

          {/* Paper grain */}
          <div style={{ position:"absolute",inset:0,pointerEvents:"none",mixBlendMode:"multiply",opacity:.08,backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,backgroundSize:"200px 200px",zIndex:0 }} />

          {/* Watermark */}
          <div style={{ position:"absolute",right:-40,bottom:30,width:260,height:260,opacity:.04,pointerEvents:"none",transform:"rotate(-10deg)",zIndex:0 }}>
            <svg viewBox="0 0 100 100" width={260} height={260} fill="none">
              <g transform="matrix(0.974572,0,0,0.982521,1.2714,0.87391)" stroke="#5a3618" strokeWidth="5.83727" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <rect x="17.017309" y="2.0173106" width="65.96537" height="13.70934" />
                <path d="M 17.017313,22.58132 L 82.98269,22.58132 L 82.98269,29.43599 C 79.717571,43.14533 66.65626,43.14533 66.65626,56.85467 C 66.65626,70.56401 79.950794,70.56401 82.98269,84.27335 L 82.98269,97.98269 L 17.017313,97.98269 L 17.017313,84.27335 C 19.684969,70.56401 33.343747,70.56401 33.343747,56.85467 C 33.343747,43.14533 19.995933,43.14533 17.017313,29.43599 L 17.017313,22.58132 z" />
              </g>
            </svg>
          </div>

          <div className="flex flex-col h-full relative z-10">

            {/* ── Header ── */}
            <header className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0" style={{ borderBottom: `1px solid ${C.dash}` }}>
              <div className="flex items-center gap-2">
                {/* Shuriken */}
                <svg viewBox="0 0 100 100" width={14} height={14} style={{ flexShrink:0 }}>
                  <g fill={C.text} stroke={C.text} strokeWidth={2} strokeLinejoin="round">
                    {[0,90,180,270].map((a,i) => <path key={i} d="M50 50 L28 30 L52 6 L61 27 Z" transform={`rotate(${a} 50 50)`}/>)}
                  </g>
                  <circle cx={50} cy={50} r={6} fill={C.bg} stroke={C.text} strokeWidth={2}/>
                </svg>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] leading-none" style={{ fontFamily: C.serif, color: C.text }}>Mapa Interativo</p>
                  <p className="text-[9px] mt-0.5 leading-none" style={{ color: C.muted }}>SandCore · Shinobi Legends</p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center justify-center w-[18px] h-[18px] rounded-[2px] border cursor-pointer transition-all"
                style={{ border: `1px solid ${C.border}`, background: C.input, color: C.muted }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(90,55,20,.18)'; e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.input; e.currentTarget.style.color = C.muted; }}
              >
                <X size={10} />
              </button>
            </header>

            {/* ── Nav tabs ── */}
            <div className="flex shrink-0 px-2 pt-2 pb-0 gap-0.5">
              {NAV.map(({ id, icon: Icon, label }) => {
                const active = sidebarSection === id;
                return (
                  <button key={id} type="button" onClick={() => setSidebarSection(id)}
                    className="flex-1 flex flex-col items-center justify-center gap-1 py-2 cursor-pointer transition-all relative"
                    style={{
                      background: active ? C.goldBg : 'transparent',
                      color: active ? C.teal : C.muted,
                      borderRadius: active ? "4px 4px 0 0" : "4px 4px 0 0",
                      boxShadow: active ? C.goldShadow : 'none',
                      borderBottom: active ? `2px solid rgba(90,60,25,.5)` : `1px solid ${C.border}`,
                    }}>
                    <Icon size={11} />
                    <span className="text-[8px] font-black uppercase tracking-[0.12em]" style={{ fontFamily: C.serif }}>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* thin line under tabs */}
            <div style={{ height: 2, background: C.dash, flexShrink: 0 }} />

            {/* ── Content ── */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar" style={{ padding: "12px 12px" }}>

              {/* ───── OFICIAIS ───── */}
              {sidebarSection === "officialPins" && (
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" size={11} style={{ color: C.muted }} />
                    <input
                      className="w-full rounded-[3px] py-1.5 pl-7 pr-3 text-[10px] outline-none"
                      style={{ background: C.input, border: `1px solid ${C.border}`, color: C.text }}
                      onChange={e => setSidebarSearchQuery(e.target.value)}
                      placeholder="Filtrar categorias…"
                      value={sidebarSearchQuery}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(90,55,20,.55)'}
                      onBlur={e => e.currentTarget.style.borderColor = C.border}
                    />
                  </div>

                  <div>
                    <SectionTitle>
                      {officialPinCategories.base.filter(c => c.total > 0).length} categorias
                    </SectionTitle>
                    <div className="grid grid-cols-3 gap-2">
                      {officialPinCategories.base.filter(c => c.total > 0).map(category => {
                        const isActive = selectedTypes.includes(category.type);
                        return (
                          <button key={category.type} type="button"
                            onClick={() => toggleSelectedType(category.type as MapMarkerType)}
                            className="flex flex-col items-center p-2 rounded-[4px] border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 relative group"
                            style={{ border: `1px solid ${isActive ? 'rgba(90,55,20,.55)' : C.border}`, background: isActive ? 'rgba(200,160,80,.22)' : C.card }}
                          >
                            {isActive && <CircleCheck size={10} className="absolute left-1.5 top-1.5" style={{ color: C.sub }} />}
                            <span className="absolute right-1.5 top-1.5 rounded-full px-1 py-0.5 text-[8px] font-bold font-mono leading-none"
                              style={{ background: isActive ? C.goldBg : C.input, color: isActive ? C.teal : C.muted, boxShadow: isActive ? C.goldShadow : 'none' }}>
                              {category.count}
                            </span>
                            <div className="w-10 h-10 flex items-center justify-center mt-1 mb-1">
                              <IconImage className="h-9 w-9 object-contain drop-shadow" iconId={category.iconId} label={category.label || getMarkerTypeLabel(category.type as MapMarkerType)} />
                            </div>
                            <p className="text-[9px] font-bold text-center leading-tight line-clamp-2 mt-0.5" style={{ fontFamily: C.serif, color: isActive ? C.text : C.sub }}>
                              {category.label || getMarkerTypeLabel(category.type as MapMarkerType)}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {officialPinCategories.identified.length > 0 && (
                    <div>
                      <Divider className="my-1" />
                      <SectionTitle>Recursos identificados</SectionTitle>
                      <div className="grid grid-cols-3 gap-2">
                        {officialPinCategories.identified.map(category => {
                          const isActive = selectedTypes.includes(category.type);
                          return (
                            <button key={category.type} type="button"
                              onClick={() => toggleSelectedType(category.type)}
                              className="flex flex-col items-center p-2 rounded-[4px] border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 relative"
                              style={{ border: `1px solid ${isActive ? 'rgba(90,55,20,.55)' : C.border}`, background: isActive ? 'rgba(200,160,80,.22)' : C.card }}
                            >
                              {isActive && <CircleCheck size={10} className="absolute left-1.5 top-1.5" style={{ color: C.sub }} />}
                              <span className="absolute right-1.5 top-1.5 rounded-full px-1 py-0.5 text-[8px] font-bold font-mono leading-none"
                                style={{ background: isActive ? C.goldBg : C.input, color: isActive ? C.teal : C.muted, boxShadow: isActive ? C.goldShadow : 'none' }}>
                                {category.count}
                              </span>
                              <div className="w-10 h-10 flex items-center justify-center mt-1 mb-1">
                                <IconImage className="h-8 w-8 object-contain drop-shadow" iconId={category.iconId} label={category.label || ""} />
                              </div>
                              <p className="text-[9px] font-bold text-center leading-tight line-clamp-2" style={{ fontFamily: C.serif, color: isActive ? C.text : C.sub }}>
                                {category.label}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ───── MEUS PINOS ───── */}
              {sidebarSection === "customPins" && (
                <div className="flex flex-col gap-3">
                  {!isAuthenticated ? (
                    <LockedFeature title="Pinos Personalizados" description="Crie marcadores próprios com fotos e notas." onLogin={openLoginModal} />
                  ) : mode === "pin" && selectedCustomPin ? (
                    /* Edit form */
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between pb-2" style={{ borderBottom: `1px dashed ${C.dash}` }}>
                        <div>
                          <p className="text-[11px] font-black" style={{ fontFamily: C.serif, color: C.text }}>{editingCustomPinId ? "Editar Pino" : "Novo Pino"}</p>
                          {selectedCustomPin.isPlaced === false
                            ? <p className="text-[9px] font-bold text-amber-700 animate-pulse">Clique no mapa para posicionar</p>
                            : <p className="text-[9px] font-mono" style={{ color: C.muted }}>LOC: {selectedCustomPin.x.toFixed(2)}, {selectedCustomPin.y.toFixed(2)}</p>
                          }
                        </div>
                        <div className="flex gap-1.5">
                          <GhostBtn onClick={cancelCustomPin} danger>Cancelar</GhostBtn>
                          {selectedCustomPin.isPlaced && <GoldBtn onClick={confirmCustomPin}>Salvar</GoldBtn>}
                        </div>
                      </div>
                      <div><Label>Nome</Label><Input value={selectedCustomPin.name} onChange={v => updateSelectedPinField("name", v)} placeholder="ex: Entrada Secreta" /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Cor</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {["#00d6a3","#00bcd4","#ffeb3b","#ff9800","#f44336","#9c27b0"].map(color => (
                              <button key={color} type="button" onClick={() => updateSelectedPinField("color", color)}
                                className={cn("h-5 w-5 rounded-full border-2 border-black/20 cursor-pointer transition-all", selectedCustomPin.color === color ? "scale-125 ring-2 ring-offset-1" : "hover:scale-110")}
                                style={{ backgroundColor: color }} />
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label>Ícone</Label>
                          <div className="flex gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
                            {customPinIcons.map(icon => (
                              <button key={icon.id} type="button" title={icon.label} onClick={() => updateSelectedPinField("iconId", icon.id)}
                                className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-[2px] border cursor-pointer transition"
                                style={{ border: `1px solid ${selectedCustomPin.iconId === icon.id ? 'rgba(90,55,20,.55)' : C.border}`, background: selectedCustomPin.iconId === icon.id ? 'rgba(90,55,20,.14)' : C.input }}>
                                <img src={icon.src} alt={icon.label} className="h-4 w-4 object-contain" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label>Imagem</Label>
                        <div className="border-2 border-dashed rounded-[3px] p-3 cursor-pointer transition hover:opacity-80" style={{ borderColor: C.border }}
                          onClick={() => document.getElementById("pin-image-upload")?.click()}>
                          <input type="file" id="pin-image-upload" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => updateSelectedPinField("imageUrl", r.result as string); r.readAsDataURL(f); } }} />
                          {selectedCustomPin.imageUrl
                            ? <img src={selectedCustomPin.imageUrl} alt="Preview" className="w-full aspect-video object-cover rounded" />
                            : <div className="flex flex-col items-center py-3 gap-1" style={{ color: C.muted }}><ImageIcon size={24} className="opacity-30"/><span className="text-[10px]">Selecionar imagem</span></div>
                          }
                        </div>
                      </div>
                      <div><Label>Categorias</Label><Input value={selectedCustomPin.tags.join(", ")} onChange={v => updateSelectedPinField("tags", v)} placeholder="Vila, Recurso…" /></div>
                      <div><Label>Nota</Label><Input value={selectedCustomPin.description || ""} onChange={v => updateSelectedPinField("description", v)} placeholder="Observações…" rows={2} /></div>
                    </div>
                  ) : (
                    /* Pin list */
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-wider" style={{ fontFamily: C.serif, color: C.text }}>Meus Pinos</p>
                        <GoldBtn small onClick={openCustomPinsSection}><Plus size={10} strokeWidth={3}/>Criar</GoldBtn>
                      </div>
                      {customPins.length === 0 ? (
                        <div className="py-6 text-center text-[10px] rounded-[3px] border border-dashed" style={{ borderColor: C.border, color: C.muted }}>
                          Nenhum pino criado ainda.
                        </div>
                      ) : (
                        <>
                          {paginatedCustomPins.map(pin => (
                            <div key={pin.id} className="flex items-center gap-2 rounded-[3px] border p-2 group transition-all" style={{ border: `1px solid ${editingCustomPinId === pin.id ? 'rgba(90,55,20,.55)' : C.border}`, background: editingCustomPinId === pin.id ? 'rgba(200,160,80,.18)' : C.card }}>
                              <div className="grid h-8 w-8 place-items-center rounded-[2px] shrink-0 border" style={{ backgroundColor: pin.color, borderColor: C.border }}>
                                <IconImage className="h-6 w-6 object-contain" iconId={pin.iconId} label={pin.name} />
                              </div>
                              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => selectCustomPin(pin.id)}>
                                <p className="truncate text-[11px] font-bold" style={{ fontFamily: C.serif, color: C.sub }}>{pin.name}</p>
                                <p className="text-[9px] font-mono truncate" style={{ color: C.muted }}>{pin.x.toFixed(1)}, {pin.y.toFixed(1)}</p>
                              </div>
                              <div className="flex gap-0.5 shrink-0">
                                {[
                                  { action: () => toggleCustomPinVisibility(pin.id), icon: pin.isHidden ? <EyeOff size={12}/> : <Eye size={12}/> },
                                  { action: () => { selectCustomPin(pin.id); startEditingCustomPin(pin.id); }, icon: <Edit2 size={12}/> },
                                  { action: () => removeCustomPin(pin.id), icon: <Trash2 size={12}/>, danger: true },
                                ].map((b, i) => (
                                  <button key={i} onClick={b.action} className="p-1 rounded-[2px] transition cursor-pointer"
                                    style={{ color: C.muted }}
                                    onMouseEnter={e => e.currentTarget.style.color = b.danger ? '#b04040' : C.text}
                                    onMouseLeave={e => e.currentTarget.style.color = C.muted}>
                                    {b.icon}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          <PaginationControls currentPage={customPinsPage} totalPages={totalCustomPinsPages} onPageChange={setCustomPinsPage} />
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ───── ROTAS ───── */}
              {sidebarSection === "routes" && (
                <div className="flex flex-col gap-3">
                  {mode === "route" ? (
                    /* Route editor */
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between pb-2" style={{ borderBottom: `1px dashed ${C.dash}` }}>
                        <div>
                          <p className="text-[11px] font-black" style={{ fontFamily: C.serif, color: C.text }}>{selectedSavedRouteId ? "Editar Rota" : "Nova Rota"}</p>
                          <p className="text-[9px] font-bold animate-pulse" style={{ color: C.muted }}>Clique no mapa para ligar pontos</p>
                        </div>
                        <div className="flex gap-1.5">
                          <GhostBtn onClick={() => setMode("explore")} danger>Sair</GhostBtn>
                          <GoldBtn onClick={saveCurrentRoute} disabled={!isAuthenticated || currentRoute.checkpoints.length === 0}>
                            {selectedSavedRouteId ? "Salvar" : "Criar"}
                            {!isAuthenticated && <Shield size={9}/>}
                          </GoldBtn>
                        </div>
                      </div>
                      <div><Label>Nome da Rota</Label><Input value={currentRoute.name} onChange={v => updateRouteField("name", v)} placeholder="Ex: Farm de Stick" /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Cor</Label>
                          <div className="flex items-center gap-1.5">
                            <input type="color" value={currentRoute.color} onChange={e => updateRouteField("color", e.target.value)} className="h-7 w-7 rounded border-0 bg-transparent p-0 cursor-pointer" />
                            <div className="flex flex-wrap gap-1">
                              {["#00d6a3","#ff9800","#f44336","#9c27b0","#2196f3"].map(c => (
                                <button key={c} onClick={() => updateRouteField("color", c)} className={cn("h-3.5 w-3.5 rounded-full border border-black/20", currentRoute.color === c && "ring-1 ring-offset-1")} style={{ backgroundColor: c }} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label>Ações</Label>
                          <div className="flex gap-1">
                            {[
                              { fn: shareCurrentRoute, icon: <Share2 size={12}/>, title: "Compartilhar" },
                              { fn: copyRouteJson, icon: <Code2 size={12}/>, title: "JSON" },
                              { fn: clearRoute, icon: <Trash2 size={12}/>, title: "Limpar", danger: true },
                            ].map((b, i) => (
                              <button key={i} onClick={b.fn} title={b.title}
                                className="p-1.5 rounded-[2px] border cursor-pointer transition"
                                style={{ border: `1px solid ${C.border}`, background: C.input, color: b.danger ? '#b04040' : C.muted }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(90,55,20,.16)'; e.currentTarget.style.color = b.danger ? '#903030' : C.text; }}
                                onMouseLeave={e => { e.currentTarget.style.background = C.input; e.currentTarget.style.color = b.danger ? '#b04040' : C.muted; }}>
                                {b.icon}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div><Label>Descrição</Label><Input value={currentRoute.description || ""} onChange={v => updateRouteField("description", v)} placeholder="Opcional…" rows={2} /></div>
                      {currentRoute.checkpoints.length > 0 && (
                        <div>
                          <Divider className="mb-2" />
                          <Label>Pontos ({currentRoute.checkpoints.length})</Label>
                          <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto custom-scrollbar">
                            {currentRoute.checkpoints.map((cp: RouteCheckpoint, idx: number) => (
                              <div key={cp.id} className="flex items-center gap-2 p-2 rounded-[3px] border group" style={{ border: `1px solid ${C.border}`, background: C.card }}>
                                <span className="grid h-5 w-5 place-items-center shrink-0 rounded-[2px] text-[9px] font-black" style={{ background: C.goldBg, color: C.teal, boxShadow: C.goldShadow }}>{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <input type="text" value={cp.label || ""} onChange={e => updateCheckpointLabel(cp.id, e.target.value)} placeholder={`Ponto ${idx+1}`} className="bg-transparent border-0 p-0 text-[10px] font-bold outline-none w-full truncate" style={{ color: C.sub }} />
                                  <p className="text-[8px] font-mono" style={{ color: C.muted }}>{cp.x.toFixed(1)}, {cp.y.toFixed(1)}</p>
                                </div>
                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => moveCheckpoint(cp.id, -1)} disabled={idx === 0} className="p-1 disabled:opacity-20 cursor-pointer" style={{ color: C.muted }} onMouseEnter={e => e.currentTarget.style.color = C.text} onMouseLeave={e => e.currentTarget.style.color = C.muted}><ChevronUp size={12}/></button>
                                  <button onClick={() => moveCheckpoint(cp.id, 1)} disabled={idx === currentRoute.checkpoints.length-1} className="p-1 disabled:opacity-20 cursor-pointer" style={{ color: C.muted }} onMouseEnter={e => e.currentTarget.style.color = C.text} onMouseLeave={e => e.currentTarget.style.color = C.muted}><ChevronDown size={12}/></button>
                                  <button onClick={() => removeCheckpoint(cp.id)} className="p-1 cursor-pointer" style={{ color: C.muted }} onMouseEnter={e => e.currentTarget.style.color = '#b04040'} onMouseLeave={e => e.currentTarget.style.color = C.muted}><X size={12}/></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Route list */
                    <>
                      {/* Sub-tab toggle */}
                      <div className="flex gap-0.5 p-0.5 rounded-[4px]" style={{ background: C.input, border: `1px solid ${C.border}` }}>
                        {(['mine','public'] as const).map(view => {
                          const active = routesView === view;
                          return (
                            <button key={view} onClick={() => setRoutesView(view)}
                              className="flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all rounded-[3px]"
                              style={{ background: active ? C.goldBg : 'transparent', color: active ? C.teal : C.muted, boxShadow: active ? C.goldShadow : 'none', fontFamily: C.serif }}>
                              {view === 'mine' ? 'Minhas' : 'Públicas'}
                            </button>
                          );
                        })}
                      </div>

                      {routesView === "mine" ? (
                        !isAuthenticated ? (
                          <LockedFeature title="Minhas Rotas" description="Faça login para criar e gerenciar suas rotas." onLogin={openLoginModal} />
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-2">
                              <GoldBtn onClick={() => { clearRoute(); setMode("route"); }}><Plus size={12} strokeWidth={3}/>Nova Rota</GoldBtn>
                              <GhostBtn onClick={openAutoRouteModal}><Route size={11}/>Auto Rota</GhostBtn>
                            </div>
                            {paginatedSavedRoutes.length === 0 ? (
                              <div className="py-6 text-center text-[10px] italic" style={{ color: C.muted }}>Nenhuma rota salva.</div>
                            ) : (
                              <>
                                {paginatedSavedRoutes.map(route => (
                                  <div key={route.id} className="flex items-center gap-2 rounded-[3px] border p-2 group transition-all" style={{ border: `1px solid ${selectedSavedRouteId === route.id ? 'rgba(90,55,20,.55)' : C.border}`, background: selectedSavedRouteId === route.id ? 'rgba(200,160,80,.18)' : C.card }}>
                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadSavedRoute(route.id)}>
                                      <div className="flex items-center gap-1.5">
                                        <p className="truncate text-[11px] font-bold" style={{ fontFamily: C.serif, color: C.sub }}>{route.name}</p>
                                        {route.isDisposable && <span className="shrink-0 rounded px-1 py-0.5 text-[7px] font-bold uppercase" style={{ background: C.input, color: C.muted }}>Temp</span>}
                                      </div>
                                      <p className="text-[9px] font-mono" style={{ color: C.muted }}>{route.route.checkpoints.length} pontos</p>
                                    </div>
                                    <div className="flex gap-0.5 shrink-0">
                                      <button onClick={() => toggleRouteVisibility(route.id)} className="p-1 cursor-pointer" style={{ color: C.muted }} onMouseEnter={e => e.currentTarget.style.color = C.text} onMouseLeave={e => e.currentTarget.style.color = C.muted} title={visibleRoutes.includes(route.id) ? "Ocultar" : "Mostrar"}>
                                        {visibleRoutes.includes(route.id) ? <Eye size={12}/> : <EyeOff size={12}/>}
                                      </button>
                                      {!route.isDisposable && (
                                        <button onClick={() => route.isPublic ? unpublishSelectedRoute(route.id) : publishSelectedRoute(route.id)} className="p-1 cursor-pointer" style={{ color: route.isPublic ? C.sub : C.muted }} onMouseEnter={e => e.currentTarget.style.color = C.sub} onMouseLeave={e => e.currentTarget.style.color = route.isPublic ? C.sub : C.muted}>
                                          <Globe size={12}/>
                                        </button>
                                      )}
                                      <button onClick={() => setRouteToComplete(route)} className="p-1 cursor-pointer" style={{ color: C.muted }} onMouseEnter={e => e.currentTarget.style.color = '#2a7060'} onMouseLeave={e => e.currentTarget.style.color = C.muted}><CircleCheck size={12}/></button>
                                      <button onClick={() => deleteSavedRoute(route.id)} className="p-1 cursor-pointer" style={{ color: C.muted }} onMouseEnter={e => e.currentTarget.style.color = '#b04040'} onMouseLeave={e => e.currentTarget.style.color = C.muted}><Trash2 size={12}/></button>
                                    </div>
                                  </div>
                                ))}
                                <PaginationControls currentPage={mineRoutesPage} totalPages={totalSavedRoutesPages} onPageChange={setMineRoutesPage} />
                              </>
                            )}
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" size={11} style={{ color: C.muted }} />
                            <input type="text" placeholder="Buscar rotas públicas…" value={publicRoutesQuery} onChange={e => setPublicRoutesQuery(e.target.value)} className="w-full rounded-[3px] py-1.5 pl-7 pr-3 text-[10px] outline-none" style={{ background: C.input, border: `1px solid ${C.border}`, color: C.text }} onFocus={e => e.currentTarget.style.borderColor = 'rgba(90,55,20,.55)'} onBlur={e => e.currentTarget.style.borderColor = C.border} />
                          </div>
                          {publicRoutesLoading ? (
                            <div className="py-8 text-center"><Compass size={20} className="mx-auto mb-2 opacity-30" style={{ color: C.sub }}/><p className="text-[9px] font-mono" style={{ color: C.muted }}>Sincronizando…</p></div>
                          ) : paginatedPublicRoutes.length === 0 ? (
                            <div className="py-6 text-center text-[10px] italic" style={{ color: C.muted }}>Nenhuma rota encontrada.</div>
                          ) : (
                            <>
                              {paginatedPublicRoutes.map(route => (
                                <div key={route.id} className="flex items-center gap-2 rounded-[3px] border p-2 transition-all" style={{ border: `1px solid ${selectedSavedRouteId === route.id ? 'rgba(90,55,20,.55)' : C.border}`, background: C.card }}>
                                  <div className="h-6 w-6 rounded-full border overflow-hidden shrink-0" style={{ borderColor: C.border, background: C.input }}>
                                    {route.creator?.avatarUrl ? <img src={route.creator.avatarUrl} alt="" className="h-full w-full object-cover"/> : <div className="h-full w-full flex items-center justify-center text-[9px] font-black" style={{ color: C.sub }}>{route.creator?.name?.slice(0,1) || "S"}</div>}
                                  </div>
                                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadSavedRoute(route.id)}>
                                    <p className="truncate text-[11px] font-bold" style={{ fontFamily: C.serif, color: C.sub }}>{route.name}</p>
                                    <p className="text-[9px] font-mono" style={{ color: C.muted }}>por {route.creator?.name || "Anônimo"} · {route.route.checkpoints.length} pts</p>
                                  </div>
                                  <div className="flex gap-0.5 shrink-0">
                                    <button onClick={() => toggleRouteVisibility(route.id)} className="p-1 cursor-pointer" style={{ color: C.muted }} onMouseEnter={e => e.currentTarget.style.color = C.text} onMouseLeave={e => e.currentTarget.style.color = C.muted}>{visibleRoutes.includes(route.id) ? <Eye size={12}/> : <EyeOff size={12}/>}</button>
                                    <button onClick={() => duplicateSavedRoute(route.id)} className="p-1 cursor-pointer" style={{ color: C.muted }} onMouseEnter={e => e.currentTarget.style.color = C.sub} onMouseLeave={e => e.currentTarget.style.color = C.muted}><Plus size={12}/></button>
                                  </div>
                                </div>
                              ))}
                              <PaginationControls currentPage={publicRoutesPage} totalPages={totalPublicRoutesPages} onPageChange={setPublicRoutesPage} />
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ───── BUSCA ───── */}
              {sidebarSection === "search" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-wider" style={{ fontFamily: C.serif, color: C.text }}>Resultados</p>
                    <span className="rounded-full px-2 py-0.5 text-[8px] font-bold font-mono" style={{ background: C.input, border: `1px solid ${C.border}`, color: C.muted }}>{searchResults.length} itens</span>
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="py-10 text-center">
                      <Compass size={28} className="mx-auto mb-2 opacity-20" style={{ color: C.muted }}/>
                      <p className="text-[10px] italic" style={{ color: C.muted }}>Nenhum recurso encontrado.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {paginatedSearchResults.map((item: any) => (
                        <div key={item.id} onClick={() => { if (item.isRoute) { loadSavedRoute(item.id); } else { focusCoords({ x: item.x, y: item.y }); if (item.isCustom) { selectCustomPin(item.id); } else { selectOfficialPoint(item.id); } } }}
                          className="flex items-center gap-2 rounded-[3px] border p-2 cursor-pointer transition-all hover:-translate-y-0.5"
                          style={{ border: `1px solid ${C.border}`, background: C.card }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(200,160,80,.22)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(90,55,20,.45)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.card; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
                        >
                          <div className="h-8 w-8 rounded-[2px] border flex items-center justify-center shrink-0" style={{ borderColor: C.border, backgroundColor: item.color || 'transparent' }}>
                            {item.isRoute ? <Route size={14} style={{ color: '#c06030' }}/> : <IconImage iconId={item.iconId} label={item.name} className="h-6 w-6 object-contain"/>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold truncate" style={{ fontFamily: C.serif, color: C.sub }}>{item.name}</p>
                            <p className="text-[9px] font-mono" style={{ color: C.muted }}>
                              {item.isRoute ? "Rota" : item.type || "Custom"}
                              {!item.isRoute && ` · ${item.x.toFixed(1)}, ${item.y.toFixed(1)}`}
                            </p>
                          </div>
                          <ChevronRight size={12} style={{ color: C.muted }}/>
                        </div>
                      ))}
                      <PaginationControls currentPage={searchPage} totalPages={totalSearchPages} onPageChange={setSearchPage} />
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* ── Footer ornament ── */}
            <div className="flex items-center justify-center gap-3 py-2 shrink-0" style={{ borderTop: `1px dashed ${C.dash}` }}>
              {[10,14,10].map((s,i) => (
                <svg key={i} viewBox="0 0 100 100" width={s} height={s}>
                  <g fill={C.muted} stroke={C.muted} strokeWidth={2} strokeLinejoin="round">
                    {[0,90,180,270].map((a,j) => <path key={j} d="M50 50 L28 30 L52 6 L61 27 Z" transform={`rotate(${a} 50 50)`}/>)}
                  </g>
                  <circle cx={50} cy={50} r={5} fill={C.bg} stroke={C.muted} strokeWidth={2}/>
                </svg>
              ))}
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

function ChevronUp({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>;
}

function ChevronDown({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;
}

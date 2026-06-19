import { useState, useMemo, memo, useEffect, useCallback } from "react";
import {
  getMarkerIconSrc,
  getMarkerTypeLabel,
  markerIconsByType,
  getMarkerIconLabel,
  minMapZoom,
  uncompletableTypes,
  mapBaseTextureSrc,
} from "../../core/entities/MapConfig.entity";
import type {
  MapPointReference,
  RouteCheckpoint,
  SavedCustomPin,
} from "../../core/entities/MapRoute.entity";
import { useMapViewModel } from "../viewModels/useMap.viewModel";
import { getResourceData } from "../../core/entities/ResourceDefinitions.entity";
import { cn } from "../../../../lib/utils";
import { ViewportPortal } from "../../../app/ui/components/ViewportPortal";
import { NotificationSettingsModal } from "./NotificationSettingsModal";
import { MapSidebar } from "./MapSidebar";
import { MapCanvasLayer } from "./MapCanvasLayer";
import { SUB_REGION_BOUNDARIES } from "../../core/entities/SubRegionBoundaries.entity";
import {
  AlertCircle,
  CheckCircle2,
  CircleCheck,
  Clock,
  Edit2,
  Hourglass,
  Info,
  Layers,
  Lock,
  MapPin,
  MessageSquare,
  Minus,
  Plus,
  Route,
  RefreshCw,
  Shield,
  Trash2,
  Wand2,
  X,
} from "lucide-react";

import { MapFeedbackModal } from "./MapFeedbackModal";
import { AutoRouteFilterModal } from "./AutoRouteFilterModal";
import { AuthModal } from "../../../authentication/ui/components/AuthModal";

function formatRemainingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type HoveredPinInfo = {
  x: number;
  y: number;
  label: string;
  color?: string;
  typeLabel?: string;
  description?: string;
  tags?: string[];
  timer?: number | null;
  isCompleted?: boolean;
  completedTimerLeft?: number | null;
  type?: string;
};

type PinBadgeProps = {
  color?: string;
  iconId: string;
  isSelected?: boolean;
  label: string;
  onClick?: (id: string) => void;
  x: number;
  y: number;
  description?: string;
  tags?: string[];
  typeLabel?: string;
  timer?: number | null;
  isCompleted?: boolean;
  type?: string;
  onHoverChange?: (info: HoveredPinInfo | null) => void;
  isCluster?: boolean;
  clusterCount?: number;
  completedAt?: string;
  globalTick: number;
  isMoving: boolean;
  displayedCamera: { scale: number };
};

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

const PinTimer = memo(function PinTimer({
  duration,
  completedAt,
  globalTick,
}: {
  duration: number;
  completedAt: string;
  globalTick: number;
}) {
  const timeLeft = useMemo(() => {
    const elapsed = Math.floor(
      (globalTick - new Date(completedAt).getTime()) / 1000,
    );
    return Math.max(0, duration - elapsed);
  }, [globalTick, completedAt, duration]);

  if (timeLeft <= 0) return null;

  return (
    <span className="absolute z-10 rounded bg-slate-950/90 border border-green-500/40 px-1 py-0.5 font-mono text-[8px] font-bold text-green-400 shadow-md">
      {formatRemainingTime(timeLeft)}
    </span>
  );
});

const PinBadge = memo(function PinBadge({
  color,
  iconId,
  isSelected,
  label,
  onClick,
  id,
  screenX,
  screenY,
  x,
  y,
  description,
  tags,
  typeLabel,
  timer,
  isCompleted,
  completedAt,
  type,
  onHoverChange,
  isCluster,
  clusterCount,
  globalTick,
  isMoving,
  displayedCamera,
}: PinBadgeProps & {
  id: string;
  screenX: number;
  screenY: number;
}) {
  const accentColor = color ?? "rgba(255,220,167,0.92)";

  const handlePointerEnter = useCallback(() => {
    if (isCluster || isMoving) return;
    onHoverChange?.({
      x,
      y,
      label,
      color,
      typeLabel,
      description,
      tags,
      timer,
      isCompleted,
      completedTimerLeft: null,
      type,
    });
  }, [
    isCluster,
    isMoving,
    onHoverChange,
    x,
    y,
    label,
    color,
    typeLabel,
    description,
    tags,
    timer,
    isCompleted,
    type,
  ]);

  const handlePointerLeave = useCallback(() => {
    onHoverChange?.(null);
  }, [onHoverChange]);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onClick?.(id);
    },
    [onClick, id],
  );

  const pinScale = useMemo(() => {
    // Pins grow slightly as we zoom in
    return 0.8 * Math.pow(displayedCamera.scale, 0.12);
  }, [displayedCamera.scale]);

  return (
    <button
      aria-label={label}
      className={cn(
        "absolute grid h-10 w-10 place-items-center bg-transparent group",
        isSelected ? "z-30" : "z-20",
        isCluster ? "z-25" : "",
        isMoving ? "pointer-events-none" : "",
      )}
      onClick={handleClick}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
        transform: `translate(-50%, -50%) scale(${pinScale})`,
        willChange: "transform",
      }}
      type="button"
    >
      <span
        className={cn(
          "absolute inset-1 rounded-full",
          !isMoving && "transition-all duration-300",
          isSelected
            ? "ring-2 ring-white/85 ring-offset-2 ring-offset-[rgba(6,14,22,0.7)]"
            : "",
          isCluster ? "ring-1 ring-cyan-400/50 bg-cyan-950/40" : "",
        )}
        style={{
          boxShadow: isMoving
            ? undefined
            : isSelected
              ? `0 0 22px ${accentColor}`
              : isCluster
                ? "0 0 15px rgba(0,214,163,0.3)"
                : undefined,
        }}
      />
      <IconImage
        className={cn(
          "h-10 w-10 object-contain transition-opacity duration-300",
          isCompleted ? "opacity-35 grayscale" : "",
          isCluster ? "opacity-80" : "",
        )}
        iconId={iconId}
        label={label}
      />

      {isCluster && (
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 font-mono text-[10px] font-black text-black shadow-lg ring-1 ring-white/20">
          {clusterCount}
        </span>
      )}

      {isCompleted && !isCluster && completedAt && timer && (
        <PinTimer
          duration={timer}
          completedAt={completedAt}
          globalTick={globalTick}
        />
      )}
    </button>
  );
});

const FocusBeacon = memo(function FocusBeacon({
  screenX,
  screenY,
  color,
}: {
  screenX: number;
  screenY: number;
  color?: string;
}) {
  const accent = color ?? "rgba(0,214,163,1)";
  const accentFaded = "rgba(0,214,163,0.15)";
  return (
    <>
      <style>{`
        @keyframes beacon-ring {
          0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 0.9; }
          100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
        }
      `}</style>
      {/* Outer rings (pointer-events-none so map still receives input) */}
      <div
        className="pointer-events-none absolute z-[79]"
        style={{ left: screenX, top: screenY }}
      >
        {/* Ring 1 — fastest */}
        <span
          style={{
            position: "absolute",
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: `2px solid ${accent}`,
            boxShadow: `0 0 12px ${accentFaded}`,
            animation: "beacon-ring 1.6s ease-out infinite",
            animationDelay: "0s",
            animationFillMode: "backwards",
          }}
        />
        {/* Ring 2 — medium */}
        <span
          style={{
            position: "absolute",
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: `2px solid ${accent}`,
            boxShadow: `0 0 12px ${accentFaded}`,
            animation: "beacon-ring 1.6s ease-out infinite",
            animationDelay: "0.45s",
            animationFillMode: "backwards",
          }}
        />
        {/* Ring 3 — slowest */}
        <span
          style={{
            position: "absolute",
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: `2px solid ${accent}`,
            boxShadow: `0 0 12px ${accentFaded}`,
            animation: "beacon-ring 1.6s ease-out infinite",
            animationDelay: "0.9s",
            animationFillMode: "backwards",
          }}
        />
        {/* Solid center dot */}
        <span
          style={{
            position: "absolute",
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: accent,
            boxShadow: `0 0 10px ${accent}, 0 0 20px ${accent}`,
            transform: "translate(-50%, -50%)",
            top: 0,
            left: 0,
          }}
        />
      </div>
    </>
  );
});

const RouteCheckpointBadge = memo(function RouteCheckpointBadge({
  checkpoint,
  index,
  screenX,
  screenY,
  displayedCamera,
}: {
  checkpoint: RouteCheckpoint;
  index: number;
  screenX: number;
  screenY: number;
  displayedCamera: { scale: number };
}) {
  const isPin = !!(checkpoint.pointId || checkpoint.customPinId);

  const badgeScale = useMemo(() => {
    // Checkpoints grow slightly as we zoom in
    const baseScale = isPin ? 0.55 : 0.75;
    return baseScale * Math.pow(displayedCamera.scale, 0.12);
  }, [displayedCamera.scale, isPin]);

  return (
    <div
      className={cn(
        "absolute grid place-items-center rounded-full border border-white bg-orange-500 font-mono font-black text-white shadow-[0_4px_15px_rgba(0,0,0,0.4)] ring-2 ring-orange-950/50 pointer-events-none z-40",
        isPin ? "h-5 w-5 text-[0.6rem]" : "h-7 w-7 text-[0.7rem]",
      )}
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
        transform: isPin
          ? `translate(-50%, -50%) scale(${badgeScale}) translate(20px, -20px)`
          : `translate(-50%, -50%) scale(${badgeScale})`,
      }}
      title={checkpoint.label || `Checkpoint ${index + 1}`}
    >
      {index + 1}
    </div>
  );
});

const MapRouteLayer = memo(function MapRouteLayer({
  points,
  color,
  isMoving,
}: {
  points: string;
  color: string;
  isMoving: boolean;
}) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <filter
          id={`route-glow-${color.replace("#", "")}`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feGaussianBlur stdDeviation="0.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Sombra escura para contraste */}
      <polyline
        fill="none"
        points={points}
        stroke="rgba(0,0,0,0.8)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
        vectorEffect="non-scaling-stroke"
      />
      {/* Linha base com cor da rota */}
      <polyline
        fill="none"
        points={points}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="1"
        strokeWidth="3.5"
        vectorEffect="non-scaling-stroke"
      />
      {/* Linha de brilho/glow */}
      <polyline
        fill="none"
        filter={
          isMoving ? undefined : `url(#route-glow-${color.replace("#", "")})`
        }
        points={points}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.8"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
});

type ClusteredOfficialPoint = MapPointReference & {
  isCluster?: boolean;
  clusterCount?: number;
};
type ClusteredCustomPin = SavedCustomPin & {
  isCluster?: boolean;
  clusterCount?: number;
};

const getAllowedOresForSubRegion = (subRegionId: string | undefined): string[] => {
  if (!subRegionId) return ["ore_1", "ore_2", "ore_3", "ore_4", "ore_5", "ore_6", "ore_7", "ore_8", "ore_9"];
  
  const sub = subRegionId.trim().toLowerCase();
  
  // Cobre (ore_4)
  const allowedCobre = ["iwagakure"].includes(sub);
  // Alumínio (ore_2)
  const allowedAluminio = ["vale do fim"].includes(sub);
  // Ferro (ore_6)
  const allowedFerro = ["tetsugakure"].includes(sub);
  // Ouro (ore_7)
  const allowedOuro = ["iwagakure"].includes(sub);
  // Platina (ore_8)
  const allowedPlatina = ["tetsugakure"].includes(sub);
  // Ametista (ore_3), Ruby (ore_9), Diamante (ore_5)
  const allowedGems = ["ilha doton", "ilha dotou", "caverna tetsu", "caverna fuji"].includes(sub);
  
  const list: string[] = [];
  // A pedra (ore_1) sempre tem que aparecer junto com o minério da região
  list.push("ore_1");
  
  if (allowedAluminio) list.push("ore_2");
  if (allowedGems) list.push("ore_3"); // Ametista
  if (allowedCobre) list.push("ore_4");
  if (allowedGems) list.push("ore_5"); // Diamante
  if (allowedFerro) list.push("ore_6");
  if (allowedOuro) list.push("ore_7");
  if (allowedPlatina) list.push("ore_8");
  if (allowedGems) list.push("ore_9"); // Ruby
  
  return list;
};

export interface InteractiveMapProps {
  externalSearchQuery?: string;
}

export function InteractiveMap({
  externalSearchQuery = "",
}: InteractiveMapProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const {
    currentRoute,
    customPins,
    deleteSavedRoute,
    duplicateSavedRoute,
    toast,
    interactiveMap,
    loadSavedRoute,
    officialPoints,
    officialPinCategories,
    openCustomPinsSection,
    publicRoutes,
    publicRoutesLoading,
    publicRoutesQuery,
    routesView,
    searchQuery,
    selectCustomPin,
    startEditingCustomPin,
    selectOfficialPoint,
    selectedCustomPinId,
    selectedOfficialPointId,
    selectedSavedRouteId,
    selectedTypes,
    setPublicRoutesQuery,
    setSearchQuery,
    setRoutesView,
    setSidebarSearchQuery,
    setSidebarSection,
    sidebarSearchQuery,
    sidebarSection,
    toggleSelectedType,
    visibleCustomPins,
    visibleOfficialPoints,
    removeCustomPin,
    selectedCustomPin,
    updateSelectedPinField,
    mode,
    setMode,
    toggleCustomPinVisibility,
    toggleRouteVisibility,
    visibleRoutes,
    routePath,
    cancelCustomPin,
    confirmCustomPin,
    completedPins,
    togglePinCompleted,
    getPinTimerRemaining,
    globalTick,
    setSelectedOfficialPointId,
    selectedOfficialPoint,
    user,
    editingCustomPinId,
    setEditingCustomPinId,
    notificationSettings,
    updateNotificationSettings,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    requestPushPermission,
    isFeedbackModalOpen,
    setIsFeedbackModalOpen,
    feedbackTarget,
    setFeedbackTarget,
    submitFeedback,
    updateRouteField,
    clearRoute,
    saveCurrentRoute,
    generateOptimizedRoute,
    isAutoRouteModalOpen,
    setIsAutoRouteModalOpen,
    savedRoutes,
    shareCurrentRoute,
    copyRouteJson,
    removeCheckpoint,
    moveCheckpoint,
    updateCheckpointLabel,
    publishSelectedRoute,
    unpublishSelectedRoute,
    // Pagination
    paginatedSavedRoutes,
    mineRoutesPage,
    setMineRoutesPage,
    totalSavedRoutesPages,
    paginatedPublicRoutes,
    publicRoutesPage,
    setPublicRoutesPage,
    totalPublicRoutesPages,
    paginatedCustomPins,
    customPinsPage,
    setCustomPinsPage,
    totalCustomPinsPages,
    // Search
    paginatedSearchResults,
    searchPage,
    setSearchPage,
    totalSearchPages,
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    searchResults,
    mapStats,
    worldStats,
    statsPeriod,
    setStatsPeriod,
    resetAllActiveRespawns,
    group,
    groupMembers,
    isGroupLoading,
    createGroup,
    joinGroup,
    leaveGroup,
    copyInviteCode,
    pinVisibility,
    setPinVisibility,
    isAuthenticated,
    referencedOfficialPointIds,
    referencedCustomPinIds,
  } = useMapViewModel();

  useEffect(() => {
    setSearchQuery(externalSearchQuery);
    if (externalSearchQuery.trim()) {
      setSidebarSection("search");
      setIsSidebarOpen(true);
    }
  }, [
    externalSearchQuery,
    setSearchQuery,
    setSidebarSection,
    setIsSidebarOpen,
  ]);

  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsModalOpen(true);
    window.addEventListener("open-map-settings", handleOpenSettings);
    return () =>
      window.removeEventListener("open-map-settings", handleOpenSettings);
  }, [setIsSettingsModalOpen]);

  const {
    displayedCamera,
    displayedZoomScale,
    focusCoords,
    getCoordinateFromPointer,
    handlePointerCancel,
    handlePointerDown,
    handlePointerLeave,
    handlePointerMove,
    handlePointerUp,
    handleZoomPointerCancel,
    handleZoomPointerDown,
    handleZoomPointerMove,
    handleZoomPointerUp,
    isDragging,
    mapSurfaceRef,
    mapSurfaceSize,
    mapViewportRef,
    viewportSize,
    zoomIn,
    zoomOut,
    zoomThumbBottom,
  } = interactiveMap;

  const getScreenCoords = useCallback(
    (x: number, y: number) => {
      const { x: camX, y: camY, scale } = displayedCamera;
      const { width: sWidth, height: sHeight } = mapSurfaceSize;
      const { width: vWidth, height: vHeight } = viewportSize;

      if (!sWidth || !vWidth) return { x: 0, y: 0 };

      // Calculate position relative to viewport center
      const screenX = vWidth / 2 + camX + (x / 100 - 0.5) * (sWidth * scale);
      const screenY = vHeight / 2 + camY + (y / 100 - 0.5) * (sHeight * scale);

      return { x: Math.round(screenX), y: Math.round(screenY) };
    },
    [displayedCamera, mapSurfaceSize, viewportSize],
  );

  const activePopupPin = useMemo(() => {
    if (selectedOfficialPoint) {
      const pinState = completedPins[selectedOfficialPoint.id];
      const identifiedName = pinState?.subType
        ? getResourceData(pinState.subType)?.name
        : undefined;

      return {
        id: selectedOfficialPoint.id,
        name: identifiedName || selectedOfficialPoint.name,
        x: selectedOfficialPoint.x,
        y: selectedOfficialPoint.y,
        iconId: selectedOfficialPoint.iconId,
        typeLabel: getMarkerTypeLabel(selectedOfficialPoint.type),
        description: selectedOfficialPoint.description,
        timer: selectedOfficialPoint.timer,
        isCustom: false,
        isCompleted: !!pinState && pinState.status !== "ready",
        isReady: pinState?.status === "ready",
        subType: pinState?.subType,
        imageUrl: undefined,
        creator: undefined,
        updatedAt: undefined,
        type: selectedOfficialPoint.type,
        regionId: selectedOfficialPoint.regionId,
        subRegionId: selectedOfficialPoint.subRegionId,
        allowedOres: getAllowedOresForSubRegion(selectedOfficialPoint.subRegionId),
      };
    }
    if (
      selectedCustomPin &&
      selectedCustomPin.isPlaced !== false &&
      mode === "explore"
    ) {
      const savedPin = selectedCustomPin as SavedCustomPin;
      return {
        id: savedPin.id,
        name: savedPin.name,
        x: savedPin.x,
        y: savedPin.y,
        iconId: savedPin.iconId,
        typeLabel: "Pino Customizado",
        description: savedPin.description,
        timer: undefined,
        isCustom: true,
        isCompleted: !!completedPins[savedPin.id],
        imageUrl: savedPin.imageUrl,
        creator: savedPin.ownerName
          ? savedPin.owner === user?.id
            ? "Você"
            : savedPin.ownerName
          : "Você",
        updatedAt: savedPin.updatedAt,
        allowedOres: ["ore_1", "ore_2", "ore_3", "ore_4", "ore_5", "ore_6", "ore_7", "ore_8", "ore_9"],
      };
    }
    return null;
  }, [selectedOfficialPoint, selectedCustomPin, mode, completedPins, user?.id]);

  const [hoveredPin, setHoveredPin] = useState<HoveredPinInfo | null>(null);

  const popupCoords = useMemo(() => {
    if (!activePopupPin) return null;

    const coords = getScreenCoords(activePopupPin.x, activePopupPin.y);
    const vw = viewportSize.width || window.innerWidth;

    const isNearTop = coords.y < 450;
    const isNearRight = coords.x > vw - 170;
    const isNearLeft = coords.x < 170;

    return {
      screenX: coords.x,
      screenY: coords.y,
      isNearTop,
      isNearRight,
      isNearLeft,
    };
  }, [activePopupPin, getScreenCoords, viewportSize.width]);

  const hoveredPinCoords = useMemo(() => {
    if (!hoveredPin) return null;

    const coords = getScreenCoords(hoveredPin.x, hoveredPin.y);

    const isNearTop = coords.y < 180;
    const isNearRight =
      coords.x > (viewportSize.width || window.innerWidth) - 180;
    const isNearLeft = coords.x < 180;

    return {
      screenX: coords.x,
      screenY: coords.y,
      isNearTop,
      isNearRight,
      isNearLeft,
    };
  }, [hoveredPin, getScreenCoords, viewportSize.width]);

  const subRegionOffsets = useMemo(() => {
    if (notificationSettings.showSubRegionNames === false) {
      return new Map<string, { x: number; y: number }>();
    }
    // 1. Get active subregions with projected screen coordinates and estimated bounding boxes
    const activeLabels = SUB_REGION_BOUNDARIES.map((boundary) => {
      const coords = getScreenCoords(boundary.center.x, boundary.center.y);
      const fadeOut = Math.min(
        Math.max((6.0 - displayedZoomScale) * 0.5, 0),
        1,
      );
      const opacity = fadeOut * 0.85;

      const vw = (viewportSize.width || window.innerWidth) / 100;
      const fontSize = Math.min(Math.max(9, 1.2 * vw), 12);

      const text = boundary.subRegionId;
      // Calculate dynamic scale factor for the label based on zoom
      const labelScale = Math.max(
        0.75,
        Math.min(1.5, 0.8 * Math.pow(displayedZoomScale, 0.2)),
      );
      const textWidth = (text.length * fontSize * 0.7 + 16) * labelScale;
      const textHeight = (fontSize + 16) * labelScale;

      return {
        subRegionId: `${boundary.regionId}-${boundary.subRegionId}`,
        origX: coords.x,
        origY: coords.y,
        x: coords.x,
        y: coords.y,
        width: textWidth,
        height: textHeight,
        opacity,
      };
    }).filter((l) => l.opacity > 0);

    // 2. Resolve collisions iteratively (relaxation loop)
    const passes = 8;
    for (let p = 0; p < passes; p++) {
      let hasCollision = false;
      for (let i = 0; i < activeLabels.length; i++) {
        for (let j = i + 1; j < activeLabels.length; j++) {
          const a = activeLabels[i];
          const b = activeLabels[j];

          const xOverlap = Math.abs(a.x - b.x) < (a.width + b.width) / 2;
          const yOverlap = Math.abs(a.y - b.y) < (a.height + b.height) / 2;

          if (xOverlap && yOverlap) {
            hasCollision = true;
            const overlapY = (a.height + b.height) / 2 - Math.abs(a.y - b.y);
            const push = overlapY / 2 + 2;

            if (a.y <= b.y) {
              a.y -= push;
              b.y += push;
            } else {
              a.y += push;
              b.y -= push;
            }
          }
        }
      }
      if (!hasCollision) break;
    }

    // 3. Create a map of computed visual offsets (difference from original coordinate)
    const offsets = new Map<string, { x: number; y: number }>();
    activeLabels.forEach((label) => {
      offsets.set(label.subRegionId, {
        x: label.x - label.origX,
        y: label.y - label.origY,
      });
    });

    return offsets;
  }, [
    displayedZoomScale,
    getScreenCoords,
    viewportSize.width,
    notificationSettings.showSubRegionNames,
  ]);

  const [cullingCamera, setCullingCamera] = useState(displayedCamera);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCullingCamera(displayedCamera);
    }, 150);

    return () => clearTimeout(timeout);
  }, [displayedCamera]);

  const [loadHighRes, setLoadHighRes] = useState(false);
  const [highResLoaded, setHighResLoaded] = useState(false);

  useEffect(() => {
    if (displayedCamera.scale > 1.25) {
      const handle = requestAnimationFrame(() => {
        setLoadHighRes(true);
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [displayedCamera.scale]);

  const isMoving = useMemo(() => {
    return (
      Math.abs(displayedCamera.x - cullingCamera.x) > 0.1 ||
      Math.abs(displayedCamera.y - cullingCamera.y) > 0.1 ||
      Math.abs(displayedCamera.scale - cullingCamera.scale) > 0.01
    );
  }, [displayedCamera, cullingCamera]);

  const baseTextureSize = 512;
  const displayedTextureSize = `${Math.round(baseTextureSize * displayedZoomScale)}px ${Math.round(baseTextureSize * displayedZoomScale)}px`;

  const viewportBounds = useMemo(() => {
    if (!mapSurfaceSize.width || !mapSurfaceSize.height) return null;

    // Durante o arraste, usamos a câmera em tempo real para o culling (quais pins existem),
    // mas a cullingCamera (debounced) para o clustering. Isso evita que os pins sumam ao mover.
    const {
      x: camX,
      y: camY,
      scale,
    } = isDragging ? displayedCamera : cullingCamera;
    const { width: sWidth, height: sHeight } = mapSurfaceSize;

    const vWidth = window.innerWidth; // Fallback for culling
    const vHeight = window.innerHeight;

    // Aumentamos o padding durante o movimento para garantir que pins nas bordas não pisquem
    const padding = isMoving ? 15 : 5;

    const minX =
      ((-vWidth / 2 - camX) / (scale * sWidth) + 0.5) * 100 - padding;
    const maxX = ((vWidth / 2 - camX) / (scale * sWidth) + 0.5) * 100 + padding;
    const minY =
      ((-vHeight / 2 - camY) / (scale * sHeight) + 0.5) * 100 - padding;
    const maxY =
      ((vHeight / 2 - camY) / (scale * sHeight) + 0.5) * 100 + padding;

    return { minX, maxX, minY, maxY };
  }, [cullingCamera, displayedCamera, mapSurfaceSize, isDragging, isMoving]);

  const culledOfficialPoints = useMemo(() => {
    if (!viewportBounds) return visibleOfficialPoints;
    return visibleOfficialPoints.filter(
      (p: MapPointReference) =>
        p.x >= viewportBounds.minX &&
        p.x <= viewportBounds.maxX &&
        p.y >= viewportBounds.minY &&
        p.y <= viewportBounds.maxY,
    );
  }, [visibleOfficialPoints, viewportBounds]);

  const finalOfficialPoints = useMemo(() => {
    const scale = cullingCamera.scale;
    if (scale >= 3.2) {
      return [...culledOfficialPoints].sort((a, b) => {
        const aState = completedPins[a.id];
        const aIsCompleted = !!aState && aState.status !== "ready";
        const aSelected = a.id === selectedOfficialPointId ? 2 : 0;
        const aPriority =
          referencedOfficialPointIds.has(a.id) && !aIsCompleted ? 1 : 0;

        const bState = completedPins[b.id];
        const bIsCompleted = !!bState && bState.status !== "ready";
        const bSelected = b.id === selectedOfficialPointId ? 2 : 0;
        const bPriority =
          referencedOfficialPointIds.has(b.id) && !bIsCompleted ? 1 : 0;

        return aSelected + aPriority - (bSelected + bPriority);
      }) as ClusteredOfficialPoint[];
    }

    const grid = new Map<string, ClusteredOfficialPoint[]>();
    const gridSize = 3.5 / scale;
    const result: ClusteredOfficialPoint[] = [];

    for (const p of culledOfficialPoints) {
      const gx = Math.floor(p.x / gridSize);
      const gy = Math.floor(p.y / gridSize);
      const key = `${gx}-${gy}-${p.type}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key)!.push(p);
    }

    for (const [key, group] of grid) {
      if (group.length > 2) {
        const avgX =
          group.reduce((sum: number, p: MapPointReference) => sum + p.x, 0) /
          group.length;
        const avgY =
          group.reduce((sum: number, p: MapPointReference) => sum + p.y, 0) /
          group.length;
        result.push({
          ...group[0],
          id: `cluster-${key}`,
          name: `${group.length}x ${getMarkerTypeLabel(group[0].type)}`,
          x: avgX,
          y: avgY,
          isCluster: true,
          clusterCount: group.length,
        });
      } else {
        result.push(...group);
      }
    }

    // Sort: referenced or selected points last (drawn on top)
    return [...result].sort((a, b) => {
      const aState = completedPins[a.id];
      const aIsCompleted = !!aState && aState.status !== "ready";

      const aSelected = a.id === selectedOfficialPointId ? 2 : 0;
      const aPriority =
        referencedOfficialPointIds.has(a.id) && !aIsCompleted ? 1 : 0;

      const bState = completedPins[b.id];
      const bIsCompleted = !!bState && bState.status !== "ready";

      const bSelected = b.id === selectedOfficialPointId ? 2 : 0;
      const bPriority =
        referencedOfficialPointIds.has(b.id) && !bIsCompleted ? 1 : 0;

      return aSelected + aPriority - (bSelected + bPriority);
    });
  }, [
    culledOfficialPoints,
    cullingCamera.scale,
    referencedOfficialPointIds,
    selectedOfficialPointId,
    completedPins,
  ]);

  const culledCustomPins = useMemo(() => {
    if (!viewportBounds) return visibleCustomPins;
    return visibleCustomPins.filter(
      (p: SavedCustomPin) =>
        p.x >= viewportBounds.minX &&
        p.x <= viewportBounds.maxX &&
        p.y >= viewportBounds.minY &&
        p.y <= viewportBounds.maxY,
    );
  }, [visibleCustomPins, viewportBounds]);

  const finalCustomPins = useMemo(() => {
    const scale = cullingCamera.scale;
    if (scale >= 3.2) {
      return [...culledCustomPins].sort((a, b) => {
        const aState = completedPins[a.id];
        const aIsCompleted = !!aState && aState.status !== "ready";
        const aSelected = a.id === selectedCustomPinId ? 2 : 0;
        const aPriority =
          referencedCustomPinIds.has(a.id) && !aIsCompleted ? 1 : 0;

        const bState = completedPins[b.id];
        const bIsCompleted = !!bState && bState.status !== "ready";
        const bSelected = b.id === selectedCustomPinId ? 2 : 0;
        const bPriority =
          referencedCustomPinIds.has(b.id) && !bIsCompleted ? 1 : 0;

        return aSelected + aPriority - (bSelected + bPriority);
      }) as ClusteredCustomPin[];
    }

    const grid = new Map<string, ClusteredCustomPin[]>();
    const gridSize = 3.5 / scale;
    const result: ClusteredCustomPin[] = [];

    for (const p of culledCustomPins) {
      const gx = Math.floor(p.x / gridSize);
      const gy = Math.floor(p.y / gridSize);
      const key = `${gx}-${gy}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key)!.push(p as ClusteredCustomPin);
    }

    for (const [key, group] of grid) {
      if (group.length > 2) {
        const avgX =
          group.reduce((sum: number, p: SavedCustomPin) => sum + p.x, 0) /
          group.length;
        const avgY =
          group.reduce((sum: number, p: SavedCustomPin) => sum + p.y, 0) /
          group.length;
        result.push({
          ...group[0],
          id: `cluster-custom-${key}`,
          name: `${group.length}x Pinos Customizados`,
          x: avgX,
          y: avgY,
          isCluster: true,
          clusterCount: group.length,
        });
      } else {
        result.push(...group);
      }
    }

    // Sort: referenced or selected pins last (on top)
    return [...result].sort((a, b) => {
      const aState = completedPins[a.id];
      const aIsCompleted = !!aState && aState.status !== "ready";

      const aSelected = a.id === selectedCustomPinId ? 2 : 0;
      const aPriority =
        referencedCustomPinIds.has(a.id) && !aIsCompleted ? 1 : 0;

      const bState = completedPins[b.id];
      const bIsCompleted = !!bState && bState.status !== "ready";

      const bSelected = b.id === selectedCustomPinId ? 2 : 0;
      const bPriority =
        referencedCustomPinIds.has(b.id) && !bIsCompleted ? 1 : 0;

      return aSelected + aPriority - (bSelected + bPriority);
    });
  }, [
    culledCustomPins,
    cullingCamera.scale,
    referencedCustomPinIds,
    selectedCustomPinId,
    completedPins,
  ]);

  const [iconCache, setIconCache] = useState<Map<string, HTMLImageElement>>(
    new Map(),
  );

  // Preload de ícones para evitar flickering durante o movimento e preparar para o Canvas
  useEffect(() => {
    const iconsToLoad = new Set(
      officialPoints.map((p: MapPointReference) => p.iconId),
    );

    // Adicionar icones de subtipos ativos nos pinos concluidos
    Object.values(completedPins).forEach((rawState) => {
      const state = rawState as { subType?: string };
      if (state.subType) iconsToLoad.add(state.subType);
    });

    iconsToLoad.forEach((id) => {
      if (iconCache.has(id)) return;
      const img = new Image();
      img.src = getMarkerIconSrc(id);
      img.onload = () => {
        setIconCache((prev) => {
          const next = new Map(prev);
          next.set(id, img);
          return next;
        });
      };
    });
  }, [officialPoints, iconCache, completedPins]);

  const [isOverCanvasPin, setIsOverCanvasPin] = useState(false);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      handlePointerMove(event);

      if (isDragging || mode === "pin" || mode === "route") {
        if (isOverCanvasPin) setIsOverCanvasPin(false);
        return;
      }

      // Detect hover over canvas pins
      const coords = getCoordinateFromPointer(event, displayedCamera);
      if (coords) {
        const scale = displayedCamera.scale;
        const threshold = 1.5 / scale;
        const isOver = finalOfficialPoints.some(
          (p) =>
            Math.abs(p.x - coords.x) < threshold &&
            Math.abs(p.y - coords.y) < threshold,
        );
        if (isOver !== isOverCanvasPin) setIsOverCanvasPin(isOver);
      }
    },
    [
      handlePointerMove,
      isDragging,
      mode,
      isOverCanvasPin,
      getCoordinateFromPointer,
      displayedCamera,
      finalOfficialPoints,
    ],
  );

  const mapCursor = useMemo(() => {
    if (isDragging) return "cursor-grabbing";
    if (mode === "pin" || mode === "route") return "cursor-crosshair";
    if (isOverCanvasPin) return "cursor-pointer";
    return "cursor-grab";
  }, [isDragging, mode, isOverCanvasPin]);

  return (
    <>
      {/* Mode Banner */}
      {(mode === "pin" ||
        mode === "route" ||
        mode === "feedback" ||
        editingCustomPinId !== null) && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-[fade-in_200ms_ease-out]">
          <div
            className={cn(
              "flex items-center gap-4 px-6 py-3 rounded-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl",
              mode === "pin" || editingCustomPinId !== null
                ? "border-cyan-500/50 bg-cyan-950/90 shadow-cyan-500/10"
                : mode === "feedback"
                  ? "border-purple-500/50 bg-purple-950/90 shadow-purple-500/10"
                  : "border-orange-500/50 bg-orange-950/90 shadow-orange-500/10",
            )}
          >
            <div className="relative flex h-3.5 w-3.5">
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  mode === "pin" || editingCustomPinId !== null
                    ? "bg-cyan-400"
                    : mode === "feedback"
                      ? "bg-purple-400"
                      : "bg-orange-400",
                )}
              />
              <span
                className={cn(
                  "relative inline-flex rounded-full h-3.5 w-3.5",
                  mode === "pin" || editingCustomPinId !== null
                    ? "bg-cyan-500"
                    : mode === "feedback"
                      ? "bg-purple-500"
                      : "bg-orange-500",
                )}
              />
            </div>
            <div className="flex flex-col">
              <p className="text-[0.65rem] font-black text-white/50 uppercase tracking-[0.2em] leading-none mb-1">
                {mode === "feedback"
                  ? "Feedback"
                  : mode === "pin" || editingCustomPinId !== null
                    ? "Marcador"
                    : "Construtor de Rota"}
              </p>
              <p className="text-sm font-bold text-white leading-none">
                {mode === "feedback"
                  ? "Modo de Feedback"
                  : mode === "pin"
                    ? "Posicionando Pino"
                    : editingCustomPinId !== null
                      ? "Editando Pino"
                      : selectedSavedRouteId
                        ? "Editando Trajeto"
                        : "Criando Novo Trajeto"}
              </p>
            </div>
            <span className="h-8 w-px bg-white/10 mx-2" />
            <p className="text-xs font-medium text-slate-300 max-w-[200px] leading-tight">
              {mode === "feedback"
                ? "Clique em qualquer lugar do mapa para sugerir um novo ponto ou reportar algo."
                : mode === "pin"
                  ? "Clique no mapa para definir o local do seu novo pino."
                  : editingCustomPinId !== null
                    ? "Você pode clicar no mapa para mudar a posição deste pino."
                    : "Clique nos ícones ou no mapa para conectar os pontos da sua rota."}
            </p>
            <button
              onClick={() => {
                setMode("explore");
                if (editingCustomPinId) {
                  // Se for um novo pino não posicionado, cancelamos
                  const pin = customPins.find(
                    (p) => p.id === editingCustomPinId,
                  );
                  if (pin && !pin.isPlaced) {
                    cancelCustomPin();
                  } else {
                    setEditingCustomPinId(null);
                  }
                }
              }}
              className="ml-2 grid h-8 w-8 place-items-center rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95 border border-white/5"
              title="Cancelar"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <section
        className="relative h-full min-h-0 overflow-hidden bg-[#1f636f] selection:bg-cyan-500/30"
        style={{ contain: "layout size" }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={cn(
              "relative flex h-full min-h-0 items-center justify-center overflow-hidden p-0 md:px-5 md:py-20 xl:px-8",
            )}
            ref={mapViewportRef}
          >
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-[-50%] map-background-texture",
                isDragging ? "will-change-transform" : "",
              )}
              style={{
                backgroundImage: `url(${mapBaseTextureSrc})`,
                backgroundRepeat: "repeat",
                backgroundSize: displayedTextureSize,
                transform: `translate(${Math.round(displayedCamera.x)}px, ${Math.round(displayedCamera.y)}px) scale(${displayedCamera.scale})`,
                transformOrigin: "center center",
              }}
            />
            <div
              aria-label="Mapa interativo do Shinobi Legends"
              className={cn(
                "relative touch-none select-none overflow-hidden bg-[rgba(4,10,18,0.86)] map-surface-container",
                mapCursor,
                isDragging && "will-change-transform",
              )}
              ref={mapSurfaceRef}
              role="application"
              onPointerCancel={handlePointerCancel}
              onPointerDown={handlePointerDown}
              onPointerLeave={handlePointerLeave}
              onPointerMove={onPointerMove}
              onPointerUp={handlePointerUp}
              style={
                {
                  height: `${mapSurfaceSize.height}px`,
                  transform: `translate(${Math.round(displayedCamera.x)}px, ${Math.round(displayedCamera.y)}px) scale(${displayedCamera.scale})`,
                  transformOrigin: "center center",
                  width: `${mapSurfaceSize.width}px`,
                  ["--map-scale" as string]: displayedCamera.scale,
                } as React.CSSProperties
              }
            >
              <img
                alt="Mapa do Shinobi Legends"
                className="block h-full w-full object-contain"
                draggable={false}
                src="./images/map/map_base_low.webp"
                fetchPriority="high"
              />
              {loadHighRes && (
                <img
                  alt="Mapa do Shinobi Legends (Alta Resolução)"
                  className={cn(
                    "block h-full w-full object-contain absolute inset-0 transition-opacity duration-500",
                    highResLoaded ? "opacity-100" : "opacity-0",
                  )}
                  draggable={false}
                  src="./images/map/map_base.webp"
                  onLoad={() => setHighResLoaded(true)}
                />
              )}

              {/* Renderizar todas as rotas visíveis (salvas/públicas) */}
              {visibleRoutes.map((routeId: string) => {
                const route =
                  savedRoutes.find((r) => r.id === routeId) ||
                  publicRoutes.find((r) => r.id === routeId);
                if (!route) return null;
                return (
                  <MapRouteLayer
                    key={route.id}
                    color={route.color}
                    isMoving={isMoving}
                    points={route.route.checkpoints
                      .map((c: RouteCheckpoint) => `${c.x},${c.y}`)
                      .join(" ")}
                  />
                );
              })}

              {/* Rota Ativa (Modo de Criação/Edição) */}
              {mode === "route" && routePath ? (
                <MapRouteLayer
                  color={currentRoute.color}
                  isMoving={isMoving}
                  points={routePath}
                />
              ) : null}
            </div>

            <MapCanvasLayer
              completedPins={completedPins}
              customPins={[]}
              camera={displayedCamera}
              mapViewportRef={mapViewportRef}
              icons={iconCache}
              officialPoints={finalOfficialPoints}
              selectedCustomPinId={selectedCustomPinId}
              selectedOfficialPointId={selectedOfficialPointId}
              mapSurfaceSize={mapSurfaceSize}
              referencedOfficialPointIds={referencedOfficialPointIds}
              referencedCustomPinIds={referencedCustomPinIds}
              globalTick={globalTick}
              showReadyAlerts={notificationSettings.showReadyAlerts !== false}
            />

            {/* Labels de Sub-regiões (Ex: Oásis) */}
            {notificationSettings.showSubRegionNames !== false && (
              <div className="absolute inset-0 pointer-events-none z-[5] overflow-hidden">
                {SUB_REGION_BOUNDARIES.map((boundary) => {
                  const coords = getScreenCoords(
                    boundary.center.x,
                    boundary.center.y,
                  );
                  const fadeOut = Math.min(
                    Math.max((6.0 - displayedZoomScale) * 0.5, 0),
                    1,
                  );
                  const opacity = fadeOut * 0.85;

                  if (opacity <= 0) return null;

                  // Obter offset dinâmico calculado pelo resolvedor de colisões
                  const compositeKey = `${boundary.regionId}-${boundary.subRegionId}`;
                  const offset = subRegionOffsets.get(compositeKey) || {
                    x: 0,
                    y: 0,
                  };
                  const labelScale = Math.max(
                    0.75,
                    Math.min(1.5, 0.8 * Math.pow(displayedZoomScale, 0.2)),
                  );
                  const transformStyle = `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${labelScale})`;

                  return (
                    <div
                      key={`label-${compositeKey}`}
                      className="absolute flex flex-col items-center justify-center text-center select-none"
                      style={{
                        left: `${coords.x}px`,
                        top: `${coords.y}px`,
                        transform: transformStyle,
                        opacity,
                        transition:
                          "opacity 0.25s ease-out, transform 0.25s ease-out",
                      }}
                    >
                      <span className="font-black uppercase tracking-[0.3em] text-white/90 text-[clamp(9px,1.2vw,12px)] [text-shadow:0_2px_4px_rgba(0,0,0,0.9),0_0_10px_rgba(0,0,0,0.6)]">
                        {boundary.subRegionId}
                      </span>
                      <div className="h-[1px] w-10 bg-[linear-gradient(90deg,transparent,rgba(0,214,163,0.3),transparent)] mt-1 shadow-[0_0_10px_rgba(0,214,163,0.15)]" />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Renderizar todos os pinos customizados (fora do contêiner escalado) */}
            {finalCustomPins.map((pin) => {
              const coords = getScreenCoords(pin.x, pin.y);
              return (
                <PinBadge
                  color={pin.color}
                  iconId={pin.iconId}
                  isSelected={selectedCustomPinId === pin.id}
                  key={pin.id}
                  id={pin.id}
                  label={pin.name}
                  onClick={pin.isCluster ? undefined : selectCustomPin}
                  screenX={coords.x}
                  screenY={coords.y}
                  x={pin.x}
                  y={pin.y}
                  description={pin.description}
                  tags={pin.tags}
                  typeLabel="Pino Customizado"
                  isCompleted={!!completedPins[pin.id]}
                  completedAt={completedPins[pin.id]?.completedAt}
                  onHoverChange={setHoveredPin}
                  isCluster={pin.isCluster}
                  clusterCount={pin.clusterCount}
                  globalTick={globalTick}
                  isMoving={isMoving}
                  displayedCamera={displayedCamera}
                />
              );
            })}

            {/* Renderizar checkpoints de todas as rotas visíveis (fora do contêiner escalado) */}
            {visibleRoutes.map((routeId: string) => {
              const route =
                savedRoutes.find((r) => r.id === routeId) ||
                publicRoutes.find((r) => r.id === routeId);
              if (!route) return null;
              return route.route.checkpoints.map(
                (checkpoint: RouteCheckpoint, index: number) => {
                  const coords = getScreenCoords(checkpoint.x, checkpoint.y);
                  return (
                    <RouteCheckpointBadge
                      checkpoint={checkpoint}
                      index={index}
                      key={`${route.id}-${checkpoint.id}`}
                      screenX={coords.x}
                      screenY={coords.y}
                      displayedCamera={displayedCamera}
                    />
                  );
                },
              );
            })}

            {/* Checkpoints da Rota Ativa (fora do contêiner escalado) */}
            {mode === "route"
              ? currentRoute.checkpoints.map(
                  (checkpoint: RouteCheckpoint, index: number) => {
                    const coords = getScreenCoords(checkpoint.x, checkpoint.y);
                    return (
                      <RouteCheckpointBadge
                        checkpoint={checkpoint}
                        index={index}
                        key={`active-${checkpoint.id}`}
                        screenX={coords.x}
                        screenY={coords.y}
                        displayedCamera={displayedCamera}
                      />
                    );
                  },
                )
              : null}
            {/* Focus Beacon — inside the viewport container for correct absolute positioning */}
            {activePopupPin &&
              mode === "explore" &&
              !editingCustomPinId &&
              !isMoving &&
              (() => {
                const beaconCoords = getScreenCoords(
                  activePopupPin.x,
                  activePopupPin.y,
                );
                return (
                  <FocusBeacon
                    screenX={beaconCoords.x}
                    screenY={beaconCoords.y}
                    color={
                      activePopupPin.isCustom
                        ? (activePopupPin as any).color
                        : undefined
                    }
                  />
                );
              })()}
          </div>
        </div>

        {/* Painel Flutuante de Atalhos Rápidos (Canto Superior Direito) */}
        <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-[60] flex flex-col gap-2 rounded-full border border-[#00d6a3]/15 bg-[#041418]/28 p-2 shadow-none backdrop-blur-[20px]">
          {/* Adicionar Pin */}
          <button
            onClick={() => {
              if (mode === "pin") {
                setMode("explore");
              } else {
                openCustomPinsSection();
                setIsSidebarOpen(true);
              }
            }}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full border transition-all duration-200 cursor-pointer group relative",
              mode === "pin"
                ? "border-cyan-500 bg-cyan-500/20 text-white shadow-[0_0_15px_rgba(0,214,163,0.4)]"
                : "border-white/10 bg-black/30 text-slate-300 hover:text-white hover:bg-white/10 active:scale-95",
            )}
            title={
              mode === "pin" ? "Cancelar Adição" : "Adicionar Pin Customizado"
            }
            type="button"
          >
            <MapPin
              size={18}
              className="transition-transform group-hover:scale-110"
            />
            {mode !== "pin" && (
              <span className="absolute right-1 top-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <Plus
                  size={8}
                  strokeWidth={4}
                  className="relative inline-flex text-[var(--cyan)]"
                />
              </span>
            )}
          </button>

          {/* Enviar Feedback */}
          <button
            onClick={() => {
              if (mode === "feedback") {
                setMode("explore");
              } else {
                setMode("feedback");
              }
            }}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full border transition-all duration-200 cursor-pointer group relative",
              mode === "feedback"
                ? "border-purple-500 bg-purple-500/20 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                : "border-white/10 bg-black/30 text-slate-300 hover:text-white hover:bg-white/10 active:scale-95",
            )}
            title={
              mode === "feedback"
                ? "Sair do Modo Feedback"
                : "Enviar Feedback / Sugerir Ponto"
            }
            type="button"
          >
            <MessageSquare
              size={18}
              className="transition-transform group-hover:scale-110"
            />
            {mode !== "feedback" && (
              <span className="absolute right-1 top-1 flex h-2 w-2">
                <Plus
                  size={8}
                  strokeWidth={4}
                  className="relative inline-flex text-purple-400"
                />
              </span>
            )}
          </button>

          {/* Criar Rota */}
          <button
            onClick={() => {
              if (mode === "route") {
                setMode("explore");
              } else {
                setSidebarSection("routes");
                setMode("route");
                setIsSidebarOpen(true);
              }
            }}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full border transition-all duration-200 cursor-pointer group relative",
              mode === "route"
                ? "border-orange-500 bg-orange-500/20 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                : "border-white/10 bg-black/30 text-slate-300 hover:text-white hover:bg-white/10 active:scale-95",
            )}
            title={mode === "route" ? "Sair do Modo Rota" : "Criar Nova Rota"}
            type="button"
          >
            <Route
              size={18}
              className="transition-transform group-hover:scale-110"
            />
            {mode !== "route" && (
              <span className="absolute right-1 top-1 flex h-2 w-2">
                <Plus
                  size={8}
                  strokeWidth={4}
                  className="relative inline-flex text-orange-400"
                />
              </span>
            )}
          </button>

          {/* Auto Rota */}
          <button
            onClick={() => setIsAutoRouteModalOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/30 text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer group relative"
            title="Auto Rota Otimizada"
            type="button"
          >
            <Wand2
              size={18}
              className="transition-transform group-hover:scale-110"
            />
            <span className="absolute right-1 top-1 flex h-2 w-2">
              <Plus
                size={8}
                strokeWidth={4}
                className="relative inline-flex text-cyan-400"
              />
            </span>
          </button>

          {/* Biblioteca de Rotas */}
          <button
            onClick={() => {
              setSidebarSection("routes");
              setIsSidebarOpen(true);
            }}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/30 text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer group"
            title="Biblioteca de Rotas"
            type="button"
          >
            <Layers
              size={18}
              className="transition-transform group-hover:scale-110"
            />
          </button>

          {/* Meus Pinos */}
          <button
            onClick={() => {
              setSidebarSection("customPins");
              selectCustomPin(null);
              setIsSidebarOpen(true);
            }}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/30 text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer group"
            title="Meus Pinos Customizados"
            type="button"
          >
            <Hourglass
              size={18}
              className="transition-transform group-hover:scale-110"
            />
          </button>
        </div>

        <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 z-[60] rounded-full border border-[#00d6a3]/15 bg-[#041418]/28 px-2 py-3 shadow-none backdrop-blur-[20px]">
          <div className="grid justify-items-center gap-2">
            <button
              aria-label="Aproximar mapa"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/30 text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
              onClick={zoomIn}
              title="Aproximar"
              type="button"
            >
              <Plus size={16} strokeWidth={2} />
            </button>

            <button
              aria-label="Ajustar zoom do mapa"
              className="relative h-28 w-8 cursor-pointer bg-transparent"
              onPointerCancel={handleZoomPointerCancel}
              onPointerDown={handleZoomPointerDown}
              onPointerMove={handleZoomPointerMove}
              onPointerUp={handleZoomPointerUp}
              title={`${Math.round(displayedZoomScale * 100)}%`}
              type="button"
            >
              <span className="absolute left-1/2 top-1 h-[calc(100%-8px)] w-1 -translate-x-1/2 rounded-full bg-black/40 border border-white/5" />
              <span
                className="absolute left-1/2 grid h-4 w-4 -translate-x-1/2 place-items-center rounded-full border border-white/80 bg-slate-300 shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
                style={{ bottom: `${zoomThumbBottom}px` }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-slate-800" />
              </span>
            </button>

            <button
              aria-label="Afastar mapa"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/30 text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-45 active:scale-95 transition-all duration-200 cursor-pointer"
              disabled={displayedZoomScale <= minMapZoom}
              onClick={zoomOut}
              title="Afastar"
              type="button"
            >
              <Minus size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        <MapSidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          sidebarSection={sidebarSection}
          setSidebarSection={setSidebarSection}
          sidebarSearchQuery={sidebarSearchQuery}
          setSidebarSearchQuery={setSidebarSearchQuery}
          selectCustomPin={selectCustomPin}
          startEditingCustomPin={startEditingCustomPin}
          selectOfficialPoint={selectOfficialPoint}
          focusCoords={focusCoords}
          officialPinCategories={officialPinCategories}
          selectedTypes={selectedTypes}
          toggleSelectedType={toggleSelectedType}
          selectedCustomPin={selectedCustomPin}
          editingCustomPinId={editingCustomPinId}
          cancelCustomPin={cancelCustomPin}
          confirmCustomPin={confirmCustomPin}
          updateSelectedPinField={updateSelectedPinField}
          customPins={customPins}
          removeCustomPin={removeCustomPin}
          toggleCustomPinVisibility={toggleCustomPinVisibility}
          paginatedCustomPins={paginatedCustomPins}
          customPinsPage={customPinsPage}
          totalCustomPinsPages={totalCustomPinsPages}
          setCustomPinsPage={setCustomPinsPage}
          paginatedSearchResults={paginatedSearchResults}
          searchPage={searchPage}
          setSearchPage={setSearchPage}
          totalSearchPages={totalSearchPages}
          searchResults={searchResults}
          routesView={routesView}
          setRoutesView={setRoutesView}
          publicRoutesQuery={publicRoutesQuery}
          setPublicRoutesQuery={setPublicRoutesQuery}
          publicRoutesLoading={publicRoutesLoading}
          paginatedSavedRoutes={paginatedSavedRoutes}
          mineRoutesPage={mineRoutesPage}
          totalSavedRoutesPages={totalSavedRoutesPages}
          setMineRoutesPage={setMineRoutesPage}
          paginatedPublicRoutes={paginatedPublicRoutes}
          publicRoutesPage={publicRoutesPage}
          totalPublicRoutesPages={totalPublicRoutesPages}
          setPublicRoutesPage={setPublicRoutesPage}
          loadSavedRoute={loadSavedRoute}
          deleteSavedRoute={deleteSavedRoute}
          duplicateSavedRoute={duplicateSavedRoute}
          publishSelectedRoute={publishSelectedRoute}
          unpublishSelectedRoute={unpublishSelectedRoute}
          toggleRouteVisibility={toggleRouteVisibility}
          visibleRoutes={visibleRoutes}
          selectedSavedRouteId={selectedSavedRouteId}
          openCustomPinsSection={openCustomPinsSection}
          currentRoute={currentRoute}
          updateRouteField={updateRouteField}
          clearRoute={clearRoute}
          saveCurrentRoute={saveCurrentRoute}
          openAutoRouteModal={() => setIsAutoRouteModalOpen(true)}
          shareCurrentRoute={shareCurrentRoute}
          copyRouteJson={copyRouteJson}
          removeCheckpoint={removeCheckpoint}
          moveCheckpoint={moveCheckpoint}
          updateCheckpointLabel={updateCheckpointLabel}
          setIsSettingsModalOpen={setIsSettingsModalOpen}
          mode={mode}
          setMode={setMode}
          mapStats={mapStats}
          worldStats={worldStats}
          statsPeriod={statsPeriod}
          setStatsPeriod={setStatsPeriod}
          resetAllActiveRespawns={resetAllActiveRespawns}
          group={group}
          members={groupMembers}
          isGroupLoading={isGroupLoading}
          createGroup={createGroup}
          joinGroup={joinGroup}
          leaveGroup={leaveGroup}
          copyInviteCode={copyInviteCode}
          isAuthenticated={isAuthenticated}
          openLoginModal={() => setIsAuthModalOpen(true)}
        />
      </section>

      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}

      {activePopupPin &&
        popupCoords &&
        mode === "explore" &&
        !editingCustomPinId && (
          <ViewportPortal>
            <div
              className="fixed w-[260px] rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(3,10,13,0.95),rgba(1,5,7,0.92))] p-3 shadow-[0_20px_48px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-2xl text-left select-text animate-[fade-in_150ms_ease-out] before:pointer-events-none before:absolute before:inset-[1px] before:rounded-[17px] before:border before:border-white/[0.03] before:content-[''] flex flex-col"
              style={{
                zIndex: 80,
                position: "fixed",
                left: `${popupCoords.screenX}px`,
                top: `${popupCoords.screenY}px`,
                transform: `translate(${popupCoords.isNearRight ? "-100%" : popupCoords.isNearLeft ? "0%" : "-50%"}, ${popupCoords.isNearTop ? "0%" : "-100%"}) translateY(${popupCoords.isNearTop ? "52px" : "-52px"}) translateX(${popupCoords.isNearRight ? "-16px" : popupCoords.isNearLeft ? "16px" : "0px"})`,
                transformOrigin: "0 0",
                cursor: "default",
                height: "250px",
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
            >
              {/* Tech Corner Accent inside card */}
              <div className="absolute inset-0 tech-corner-accent opacity-20 pointer-events-none" />

              {/* Compact header: name + badge + actions all in one row */}
              <div className="flex items-start justify-between gap-2 mb-1.5 shrink-0">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[13px] font-black text-white truncate tracking-tight leading-none">
                    {activePopupPin.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider text-cyan-400/90 border border-cyan-500/10">
                      {activePopupPin.typeLabel}
                    </span>
                    {/* Contributor inline */}
                    <span className="text-[8px] font-mono text-slate-500 truncate">
                      {activePopupPin.isCustom
                        ? activePopupPin.creator
                        : "Shinobi Legends"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setFeedbackTarget({
                        x: activePopupPin.x,
                        y: activePopupPin.y,
                        pointId: activePopupPin.id,
                        pointName: activePopupPin.name,
                      });
                      setIsFeedbackModalOpen(true);
                    }}
                    className="grid h-6 w-6 place-items-center rounded-full border border-white/5 bg-white/5 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition cursor-pointer"
                    title="Reportar problema"
                  >
                    <MessageSquare size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (activePopupPin.isCustom) {
                        selectCustomPin(null);
                      } else {
                        setSelectedOfficialPointId(null);
                      }
                    }}
                    className="grid h-6 w-6 place-items-center rounded-full border border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    aria-label="Fechar popup"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Scrollable content area — scroll only for description-only pins */}
              {(() => {
                const hasActionButtons =
                  !activePopupPin.type ||
                  !uncompletableTypes.includes(activePopupPin.type as any) ||
                  activePopupPin.type === "merchant";
                return (
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Description & Image scroll container */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-0.5 min-h-0">
                      {/* Description — full text, no truncation */}
                      {activePopupPin.description && (
                        <p className="text-[9.5px] text-slate-400 leading-snug mb-1.5 whitespace-pre-line">
                          {activePopupPin.description.replace(/\\n/g, "\n")}
                        </p>
                      )}

                      {/* Image Section */}
                      {activePopupPin.imageUrl && (
                        <div className="w-full h-16 rounded-[8px] overflow-hidden border border-white/8 mb-1.5 bg-slate-950 shrink-0">
                          <img
                            src={activePopupPin.imageUrl}
                            alt={activePopupPin.name}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {hasActionButtons && (
                      <div className="grid gap-1.5 shrink-0 mt-1.5">
                        {(activePopupPin.type === "ore" ||
                          activePopupPin.type === "mushroom") &&
                          !activePopupPin.isCompleted && (
                            <div className="grid gap-1.5 p-2 rounded-xl border border-white/[0.06] bg-black/20 relative overflow-hidden">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-pulse shadow-[0_0_8px_var(--cyan)]" />
                                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[var(--cyan)]">
                                    Identificar{" "}
                                    {activePopupPin.type === "ore"
                                      ? "Minério"
                                      : "Cogumelo"}
                                  </span>
                                </div>
                                {!isAuthenticated && (
                                  <Shield
                                    className="text-red-400 opacity-50"
                                    size={10}
                                  />
                                )}
                              </div>

                              {!isAuthenticated ? (
                                <div className="py-2.5 px-1 text-center bg-black/20 rounded-xl border border-white/[0.02]">
                                  <p className="text-[10px] text-slate-500 italic leading-tight">
                                    Faça login para identificar recursos e
                                    sincronizar timers com seu grupo.
                                  </p>
                                </div>
                              ) : (
                                <>
                                  {["ore", "mushroom"].includes(
                                    activePopupPin.type || "",
                                  ) &&
                                    (() => {
                                      const lastSubtype =
                                        notificationSettings.rememberLastSubtype &&
                                        activePopupPin.type
                                          ? notificationSettings
                                              .lastSelectedSubTypes[
                                              activePopupPin.type
                                            ]
                                          : undefined;

                                      const subTypeToUse =
                                        activePopupPin.subType ||
                                        lastSubtype ||
                                        (activePopupPin.type === "ore"
                                          ? "ore_1"
                                          : "mushroom_1");

                                      const isDefault =
                                        subTypeToUse === "ore_1" ||
                                        subTypeToUse === "mushroom_1";

                                      const showMainButton =
                                        activePopupPin.type !== "ore" ||
                                        (activePopupPin as any).allowedOres?.includes("ore_1");

                                      if (!showMainButton) return null;

                                      return (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            togglePinCompleted(
                                              activePopupPin.id,
                                              subTypeToUse,
                                            );

                                            if (
                                              notificationSettings.rememberLastSubtype &&
                                              activePopupPin.type
                                            ) {
                                              updateNotificationSettings({
                                                ...notificationSettings,
                                                lastSelectedSubTypes: {
                                                  ...notificationSettings.lastSelectedSubTypes,
                                                  [activePopupPin.type]:
                                                    subTypeToUse,
                                                },
                                              });
                                            }
                                          }}
                                          className={cn(
                                            "group relative overflow-hidden flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[9px] font-black uppercase tracking-wide transition-all duration-300 cursor-pointer shadow-md active:scale-[0.97]",
                                            "bg-gradient-to-r from-[var(--cyan)] to-[#00b894] text-slate-950 hover:brightness-110 shadow-[0_3px_10px_rgba(0,214,163,0.25)] before:absolute before:inset-0 before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700",
                                          )}
                                        >
                                          {isDefault ? (
                                            <>
                                              <CircleCheck
                                                size={11}
                                                className="shrink-0 z-[1]"
                                              />
                                              <span className="z-[1]">
                                                Padrão / Já passei
                                              </span>
                                            </>
                                          ) : (
                                            <>
                                              <RefreshCw
                                                size={11}
                                                className="shrink-0 z-[1]"
                                              />
                                              <span className="z-[1]">
                                                (
                                                {getMarkerIconLabel(
                                                  subTypeToUse,
                                                )}
                                                )
                                              </span>
                                            </>
                                          )}
                                        </button>
                                      );
                                    })()}

                                  {/* Icons: horizontal scroll row to keep height compact */}
                                  <div
                                    className="flex gap-2 overflow-x-auto pb-0.5 pt-0.5 no-scrollbar cursor-grab active:cursor-grabbing select-none"
                                    onMouseDown={(e) => {
                                      const container = e.currentTarget;
                                      container.dataset.isDown = "true";
                                      container.dataset.startX = e.pageX.toString();
                                      container.dataset.scrollLeft = container.scrollLeft.toString();
                                      container.dataset.moved = "false";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.dataset.isDown = "false";
                                    }}
                                    onMouseUp={(e) => {
                                      e.currentTarget.dataset.isDown = "false";
                                    }}
                                    onMouseMove={(e) => {
                                      const container = e.currentTarget;
                                      if (container.dataset.isDown !== "true") return;
                                      const x = e.pageX;
                                      const startX = parseFloat(container.dataset.startX || "0");
                                      const scrollLeft = parseFloat(container.dataset.scrollLeft || "0");
                                      const diff = Math.abs(x - startX);
                                      if (diff > 5) {
                                        container.dataset.moved = "true";
                                      }
                                      const walk = (x - startX) * 1.5;
                                      container.scrollLeft = scrollLeft - walk;
                                    }}
                                  >
                                    {markerIconsByType[activePopupPin.type]
                                      .filter(
                                        (iconId) =>
                                          iconId !== "mushroom_1" &&
                                          (activePopupPin.type !== "ore" ||
                                            (activePopupPin as any).allowedOres?.includes(iconId)),
                                      )
                                      .map((iconId) => {
                                        const isLastUsed =
                                          notificationSettings
                                            .lastSelectedSubTypes[
                                            activePopupPin.type!
                                          ] === iconId;
                                        return (
                                          <button
                                            key={iconId}
                                            type="button"
                                            onClick={(e) => {
                                              const container = e.currentTarget.parentElement;
                                              if (container && container.dataset.moved === "true") {
                                                e.stopPropagation();
                                                return;
                                              }
                                              togglePinCompleted(
                                                activePopupPin.id,
                                                iconId,
                                              );
                                              if (
                                                notificationSettings.rememberLastSubtype
                                              ) {
                                                updateNotificationSettings({
                                                  ...notificationSettings,
                                                  lastSelectedSubTypes: {
                                                    ...notificationSettings.lastSelectedSubTypes,
                                                    [activePopupPin.type!]:
                                                      iconId,
                                                  },
                                                });
                                              }
                                            }}
                                            className={cn(
                                              "relative flex-shrink-0 group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-950/80 transition-all duration-200 hover:border-[var(--cyan)]/50 hover:bg-[var(--cyan)]/10 hover:scale-105 cursor-pointer",
                                              isLastUsed &&
                                                "border-[var(--cyan)] bg-gradient-to-b from-cyan-950/40 to-cyan-900/60 shadow-[0_0_15px_rgba(0,214,163,0.3)] scale-105",
                                            )}
                                            title={getMarkerIconLabel(iconId)}
                                          >
                                            <img
                                              src={getMarkerIconSrc(iconId)}
                                              alt=""
                                              className="h-6 w-6 object-contain transition-transform group-hover:scale-110"
                                            />
                                            {isLastUsed && (
                                              <div className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[var(--cyan)] border-2 border-[#0a0f18] flex items-center justify-center shadow-[0_0_8px_var(--cyan)]">
                                                <span className="w-1.5 h-1.5 bg-[#0a0f18] rounded-full" />
                                              </div>
                                            )}
                                          </button>
                                        );
                                      })}
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                        {isAuthenticated &&
                          group &&
                          !activePopupPin.isCompleted && (
                            <div className="flex rounded-lg bg-white/[0.03] p-0.5 border border-white/5">
                              <button
                                onClick={() => setPinVisibility("private")}
                                className={cn(
                                  "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1 text-[9px] font-black uppercase tracking-wider transition-all pointer-events-auto",
                                  pinVisibility === "private"
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-300",
                                )}
                              >
                                <Lock size={12} />
                                Pessoal
                              </button>
                              <button
                                onClick={() => setPinVisibility("group")}
                                className={cn(
                                  "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1 text-[9px] font-black uppercase tracking-wider transition-all pointer-events-auto",
                                  pinVisibility === "group"
                                    ? "bg-[var(--cyan)]/20 text-[var(--cyan)] shadow-sm"
                                    : "text-slate-500 hover:text-slate-300",
                                )}
                              >
                                <Shield size={12} />
                                Grupo
                              </button>
                            </div>
                          )}

                        {activePopupPin.isCustom ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSidebarSection("customPins");
                                setIsSidebarOpen(true);
                                startEditingCustomPin(activePopupPin.id);
                              }}
                              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-white transition hover:bg-white/10 active:scale-95 pointer-events-auto"
                            >
                              <Edit2 size={13} />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                togglePinCompleted(activePopupPin.id)
                              }
                              className={cn(
                                "flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white transition active:scale-95 pointer-events-auto",
                                activePopupPin.isCompleted
                                  ? "bg-slate-700/50 hover:bg-slate-700"
                                  : "bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/30 hover:bg-[var(--cyan)]/30",
                              )}
                            >
                              <CheckCircle2 size={13} />
                              {activePopupPin.isCompleted
                                ? "Desmarcar"
                                : "Concluir"}
                            </button>
                          </div>
                        ) : (
                          <div className="grid gap-2.5">
                            {activePopupPin.isCompleted ? (
                              <div className="grid gap-2">
                                {/* Timer status badge */}
                                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-white/5 bg-[#161c26]/60 shadow-inner">
                                  <span className="flex items-center gap-2 text-slate-400 font-mono text-[9.5px] font-bold uppercase tracking-widest">
                                    <Clock
                                      size={13}
                                      className="text-[var(--cyan)] animate-pulse"
                                    />
                                    {activePopupPin.type === "merchant"
                                      ? "Presente"
                                      : "Coletado"}
                                  </span>
                                  <span className="text-white font-mono font-black text-xs tracking-wide">
                                    {activePopupPin.timer
                                      ? (() => {
                                          const remaining =
                                            getPinTimerRemaining(
                                              activePopupPin.id,
                                              activePopupPin.timer,
                                            );
                                          if (
                                            remaining <= 0 &&
                                            activePopupPin.type !== "merchant"
                                          ) {
                                            return activePopupPin.subType ===
                                              "ore_1" ||
                                              activePopupPin.subType ===
                                                "mushroom_1"
                                              ? "Padrão / Marcado"
                                              : "Concluído";
                                          }
                                          return formatRemainingTime(remaining);
                                        })()
                                      : "Concluído"}
                                  </span>
                                </div>

                                {/* Action Buttons Row */}
                                <div className="flex gap-2">
                                  {activePopupPin.type &&
                                    [
                                      "ore",
                                      "mushroom",
                                      "stick",
                                      "perpetual",
                                      "hibiscus",
                                      "cotton",
                                      "borago",
                                    ].includes(activePopupPin.type) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!isAuthenticated) return;
                                          const state =
                                            completedPins[activePopupPin.id];
                                          togglePinCompleted(
                                            activePopupPin.id,
                                            state?.subType,
                                            true,
                                          );
                                        }}
                                        disabled={!isAuthenticated}
                                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#00d6a3]/20 bg-[#00d6a3]/10 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--cyan)] hover:bg-[#00d6a3]/20 active:scale-95 transition-all cursor-pointer pointer-events-auto disabled:opacity-30 disabled:grayscale"
                                        title={
                                          isAuthenticated
                                            ? "Reiniciar tempo agora (mesmo recurso)"
                                            : "Faça login para gerenciar timers"
                                        }
                                      >
                                        <RefreshCw size={12} />
                                        {isAuthenticated ? (
                                          "Reiniciar"
                                        ) : (
                                          <Shield size={12} />
                                        )}
                                      </button>
                                    )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      isAuthenticated &&
                                      togglePinCompleted(activePopupPin.id)
                                    }
                                    disabled={!isAuthenticated}
                                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer pointer-events-auto disabled:opacity-30"
                                    title={
                                      isAuthenticated
                                        ? "Limpar marcação"
                                        : "Login necessário"
                                    }
                                  >
                                    {isAuthenticated ? (
                                      <Trash2 size={12} />
                                    ) : (
                                      <Shield size={12} />
                                    )}
                                    {isAuthenticated ? "Desmarcar" : "Lock"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Not Completed State */
                              <button
                                type="button"
                                onClick={() =>
                                  isAuthenticated &&
                                  togglePinCompleted(activePopupPin.id)
                                }
                                disabled={!isAuthenticated}
                                className={cn(
                                  "relative overflow-hidden w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest transition active:scale-[0.98] cursor-pointer pointer-events-auto disabled:opacity-50 disabled:grayscale disabled:pointer-events-none",
                                  "bg-gradient-to-r from-[var(--cyan)] to-[#00b894] text-slate-950 hover:brightness-110 shadow-[0_4px_16px_rgba(0,214,163,0.25)] hover:shadow-[0_6px_20px_rgba(0,214,163,0.45)] before:absolute before:inset-0 before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700",
                                  // Escondemos o botão genérico apenas para Ore e Mushroom, pois estes exigem identificação
                                  (activePopupPin.type === "ore" ||
                                    activePopupPin.type === "mushroom") &&
                                    "hidden",
                                )}
                              >
                                <CheckCircle2 size={14} />
                                {isAuthenticated
                                  ? activePopupPin.type === "merchant"
                                    ? "Localizado / Está aqui"
                                    : "Concluir Coleta"
                                  : "Login para Coletar"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </ViewportPortal>
        )}
      <MapFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          setFeedbackTarget(null);
        }}
        target={feedbackTarget}
        onSubmit={submitFeedback}
      />
      
      <AutoRouteFilterModal
        isOpen={isAutoRouteModalOpen}
        onClose={() => setIsAutoRouteModalOpen(false)}
        onGenerate={generateOptimizedRoute}
        availableCategories={[...officialPinCategories.base, ...officialPinCategories.identified].map(c => ({
          type: c.type,
          label: c.label,
          iconId: c.iconId
        }))}
        initialCategories={selectedTypes}
      />

      {hoveredPin && hoveredPinCoords && (
        <ViewportPortal>
          <div
            className={cn(
              "pointer-events-none fixed z-[70] w-56 rounded-xl border border-white/8 bg-[linear-gradient(180deg,rgba(3,10,13,0.96),rgba(1,5,7,0.94))] p-3 shadow-[0_12px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-md text-left select-none transition-all duration-300 animate-[fade-in_150ms_ease-out]",
              hoveredPinCoords.isNearTop ? "mt-3" : "mb-3",
            )}
            style={{
              position: "fixed",
              left: `${hoveredPinCoords.screenX}px`,
              top: `${hoveredPinCoords.screenY}px`,
              transform: `translate(${hoveredPinCoords.isNearRight ? "-100%" : hoveredPinCoords.isNearLeft ? "0%" : "-50%"}, ${hoveredPinCoords.isNearTop ? "0%" : "-100%"}) translateY(${hoveredPinCoords.isNearTop ? "36px" : "-36px"}) translateX(${hoveredPinCoords.isNearRight ? "24px" : hoveredPinCoords.isNearLeft ? "-24px" : "0px"})`,
              transformOrigin: "0 0",
            }}
          >
            <div className="absolute inset-0 tech-corner-accent opacity-20 pointer-events-none" />
            <h4 className="text-xs font-bold text-white truncate leading-tight">
              {hoveredPin.label}
            </h4>
            <p
              className="mt-0.5 text-[9px] font-mono font-bold uppercase tracking-wider leading-none"
              style={{ color: hoveredPin.color || "#00d6a3" }}
            >
              {hoveredPin.typeLabel || "Pino Customizado"}
            </p>

            {hoveredPin.description && (
              <p className="mt-1.5 text-[11px] text-slate-300 line-clamp-3 leading-normal border-t border-white/5 pt-1.5 whitespace-pre-line">
                {hoveredPin.description.replace(/\\n/g, "\n")}
              </p>
            )}

            {hoveredPin.tags && hoveredPin.tags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1 border-t border-white/5 pt-1.5">
                {hoveredPin.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-white/5 border border-white/8 px-1 py-0.5 text-[8.5px] font-mono text-slate-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {hoveredPin.timer ? (
              <div className="mt-2 flex items-center justify-between border-t border-cyan-500/20 pt-2">
                <span className="text-[9px] font-mono text-cyan-400">
                  {hoveredPin.type === "merchant"
                    ? "Timer Despawn"
                    : "Timer Respawn"}
                </span>
                {hoveredPin.isCompleted ? (
                  <span className="text-[10px] font-bold font-mono text-green-400 animate-pulse">
                    {formatRemainingTime(hoveredPin.completedTimerLeft || 0)}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400">
                    Pronto
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </ViewportPortal>
      )}

      {toast && (
        <ViewportPortal>
          <div
            className={`library-toast toast-${toast.type || "success"}`}
            role="status"
          >
            {toast.type === "delete" ? (
              <Trash2 aria-hidden="true" />
            ) : toast.type === "error" ? (
              <AlertCircle aria-hidden="true" />
            ) : toast.type === "info" ? (
              <Info aria-hidden="true" />
            ) : (
              <CircleCheck aria-hidden="true" />
            )}
            <span>
              <strong>{toast.title}</strong>
              <small>{toast.description}</small>
            </span>
          </div>
        </ViewportPortal>
      )}

      {isSettingsModalOpen && (
        <NotificationSettingsModal
          onClose={() => setIsSettingsModalOpen(false)}
          settings={notificationSettings}
          onUpdate={updateNotificationSettings}
          onRequestPushPermission={requestPushPermission}
        />
      )}
    </>
  );
}

import { appStorage } from '../../../../lib/storage';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mapPoints } from "../../core/entities/MapPoints.entity";
import type { MapLayerId } from "../../core/entities/MapCalibration.entity";
import {
  defaultMapRegion,
  getMarkerTypeLabel,
  mapLayers,
  mapRegions,
  markerTypes,
  uncompletableTypes,
  getResourceTimer,
  getMarkerIconSrc,
} from "../../core/entities/MapConfig.entity";
import type {
  CustomRoute,
  MapPointReference,
  RouteCheckpoint,
  SavedCustomPin,
  SavedMapRoute,
} from "../../core/entities/MapRoute.entity";
import { normalizeMapRoute } from "../../core/usecases/NormalizeMapRoute.usecase";
import { mapDependencies } from "../../dependencies/map.dependencies";
import { useAuthViewModel } from "../../../authentication/ui/viewModels/useAuth.viewModel";
import { useInteractiveMap } from "../hooks/useInteractiveMap";
import { useTimedToast } from "../../../app/ui/hooks/useTimedToast";
import { type NotificationSettings } from "../../core/entities/NotificationSettings.entity";
import { SoundSynthesizer } from "../../infrastructure/services/SoundSynthesizer.service";
import { logger } from "../../../../lib/utils";
import { useDebounce } from "../hooks/useDebounce";
import { SubmitMapFeedbackUseCase } from "../../core/usecases/SubmitMapFeedback.usecase";
import type { MapFeedback } from "../../core/entities/MapFeedback.entity";
import type { AutoRouteFilters } from "../components/AutoRouteFilterModal";
import type {
  MapGroup,
  MapGroupMember,
} from "../../../groups/core/entities/MapGroup.entity";
import { getResourceData } from "../../core/entities/ResourceDefinitions.entity";
import {
  type MapCollectionStats,
  sumStats,
  createEmptyStats,
} from "../../core/entities/MapStats.entity";

import { pb } from "../../../../lib/pocketbase";
const requestNotificationToken = async () => null;

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toOfficialPointReference(): MapPointReference[] {
  return mapPoints.map((point) => ({
    iconId: point.iconId,
    id: String(point.id),
    layerIds: point.layerIds,
    markerId: point.markerId,
    name: point.name,
    regionId: point.regionId,
    subRegionId: point.subRegionId,
    type: point.type,
    x: point.x,
    y: point.y,
    timer: point.timer || 0,
    description: point.description,
  }));
}

function cleanRouteForPersist(
  route: CustomRoute,
  allCustomPins: SavedCustomPin[],
): CustomRoute {
  const referencedPinIds = new Set(
    route.checkpoints.map((c) => c.customPinId).filter(Boolean),
  );
  const routeCustomPins = allCustomPins
    .filter((pin) => referencedPinIds.has(pin.id))
    .map((pin) => ({
      color: pin.color,
      description: pin.description,
      iconId: pin.iconId,
      id: pin.id,
      name: pin.name,
      tags: pin.tags,
      x: pin.x,
      y: pin.y,
      imageUrl: pin.imageUrl,
      isPlaced: pin.isPlaced,
      checked: pin.checked,
    }));
  return {
    ...route,
    name: route.name.trim() || "Nova rota",
    description: route.description?.trim() || "",
    customPins: routeCustomPins,
    checkpoints: route.checkpoints.map((checkpoint) => ({
      ...checkpoint,
      label: checkpoint.label?.trim() || undefined,
    })),
  };
}

function matchesSearch(values: Array<string | undefined>, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return values.some((value) => value?.toLowerCase().includes(q));
}

interface CompletedPinState {
  completedAt: string;
  leadNotified?: boolean;
  subType?: string;
  status?: "cooldown" | "ready";
}

export type StatsPeriod = "today" | "weekly" | "monthly" | "total";

export function useMapViewModel() {
  const { showToast, toast } = useTimedToast();
  const officialPoints = useMemo(() => toOfficialPointReference(), []);
  const auth = useAuthViewModel();
  const isAuthenticated = auth.isLoggedIn;
  const user = auth.getCurrentUser();

  const [mode, _setMode] = useState<"explore" | "pin" | "route" | "feedback">(
    "explore",
  );
  const [sidebarSection, setSidebarSection] = useState<
    "officialPins" | "customPins" | "routes" | "search"
  >("officialPins");
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState<{
    x: number;
    y: number;
    pointId?: string;
    pointName?: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 350);

  const [searchPage, setSearchPage] = useState(1);

  const [sidebarSearchQuery, setSidebarSearchQuery] = useState("");
  const debouncedSidebarSearchQuery = useDebounce(sidebarSearchQuery, 350);

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | "all">("all");
  const [routesView, setRoutesView] = useState<"mine" | "public">("mine");

  const [publicRoutesQuery, setPublicRoutesQuery] = useState("");
  const debouncedPublicRoutesQuery = useDebounce(publicRoutesQuery, 400);
  const [publicRoutes, setPublicRoutes] = useState<SavedMapRoute[]>([]);
  const [publicRoutesLoading, setPublicRoutesLoading] = useState(false);

  const [selectedLayers, setSelectedLayers] = useState<MapLayerId[]>([
    "officialPins",
    "customPins",
    "routes",
  ]);
  const [currentRoute, setCurrentRoute] = useState<CustomRoute>(() => ({
    checkpoints: [],
    color: "#00d6a3",
    createdAt: new Date().toISOString(),
    customPins: [],
    description: "",
    id: createId("route"),
    name: "Nova rota",
    updatedAt: new Date().toISOString(),
  }));
  const [selectedOfficialPointId, setSelectedOfficialPointId] = useState<
    string | null
  >(null);
  const [selectedCustomPinId, setSelectedCustomPinId] = useState<string | null>(
    null,
  );
  const [savedRoutes, setSavedRoutes] = useState<SavedMapRoute[]>([]);
  const [customPins, setCustomPins] = useState<SavedCustomPin[]>(() =>
    mapDependencies.localCustomPinsStorage.read(),
  );
  const [selectedSavedRouteId, setSelectedSavedRouteId] = useState<
    string | null
  >(null);
  const [editingCustomPinId, _setEditingCustomPinId] = useState<string | null>(
    null,
  );
  const editingCustomPinIdRef = useRef<string | null>(null);
  const _setEditingCustomPinIdRef = useCallback((id: string | null) => {
    editingCustomPinIdRef.current = id;
    _setEditingCustomPinId(id);
  }, []);
  const [draftCustomPin, setDraftCustomPin] = useState<SavedCustomPin | null>(
    null,
  );

  const [mineRoutesPage, setMineRoutesPage] = useState(1);
  const [totalSavedRoutesPages, setTotalSavedRoutesPages] = useState(1);

  const [publicRoutesPage, setPublicRoutesPage] = useState(1);
  const [totalPublicRoutesPages, setTotalPublicRoutesPages] = useState(1);

  const [customPinsPage, setCustomPinsPage] = useState(1);
  const [notificationSettings, _setNotificationSettings] =
    useState<NotificationSettings>(() =>
      mapDependencies.localNotificationSettingsStorage.read(),
    );
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [importJsonValue, setImportJsonValue] = useState("");
  const [isAutoRouteModalOpen, setIsAutoRouteModalOpen] = useState(false);

  const [completedPins, setCompletedPins] = useState<
    Record<string, CompletedPinState>
  >(() => {
    try {
      const stored = appStorage.getItem("shinobi-map-completed-pins");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // --- ESTATISTICAS TEMPORAIS ---
  const [dailyStats, setDailyStats] = useState<MapCollectionStats[]>(() => {
    try {
      const stored = appStorage.getItem("shinobi-map-stats-history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>("today");

  const aggregatedStats = useMemo(() => {
    const nowRef = new Date();
    const todayStr = nowRef.toISOString().split("T")[0];
    const todayStats =
      dailyStats.find((s) => s.date === todayStr) || createEmptyStats(todayStr);
    const sevenDaysAgo = new Date(nowRef.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const weeklyList = dailyStats.filter((s) => s.date >= sevenDaysAgo);
    const thirtyDaysAgo = new Date(nowRef.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const monthlyList = dailyStats.filter((s) => s.date >= thirtyDaysAgo);
    return {
      today: todayStats,
      weekly: sumStats(weeklyList),
      monthly: sumStats(monthlyList),
      total: sumStats(dailyStats),
    };
  }, [dailyStats]);

  const currentStatsView = aggregatedStats[statsPeriod];

  const incrementResourceStat = useCallback(
    (type: string, subType?: string) => {
      setDailyStats((prev) => {
        const todayStr = new Date().toISOString().split("T")[0];
        const next = [...prev];
        let todayIdx = next.findIndex((s) => s.date === todayStr);
        if (todayIdx === -1) {
          next.push(createEmptyStats(todayStr));
          todayIdx = next.length - 1;
        }
        const today = { ...next[todayIdx] };
        if (type === "ore") {
          const key = subType || "unidentified";
          today.ore_count = {
            ...today.ore_count,
            [key]: (today.ore_count[key] || 0) + 1,
          };
        } else if (type === "mushroom") {
          const key = subType || "unidentified";
          today.mushroom_count = {
            ...today.mushroom_count,
            [key]: (today.mushroom_count[key] || 0) + 1,
          };
        } else if (type === "stick") {
          today.stick_count += 1;
        } else if (
          ["perpetual", "hibiscus", "cotton", "borago"].includes(type)
        ) {
          today.plant_count = {
            ...today.plant_count,
            [type]: (today.plant_count[type] || 0) + 1,
          };
        }
        next[todayIdx] = today;
        appStorage.setItem("shinobi-map-stats-history", JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const decrementResourceStat = useCallback(
    (type: string, subType?: string) => {
      setDailyStats((prev) => {
        const todayStr = new Date().toISOString().split("T")[0];
        const next = [...prev];
        const todayIdx = next.findIndex((s) => s.date === todayStr);
        if (todayIdx === -1) return next;
        const today = { ...next[todayIdx] };

        let decremented = false;
        if (type === "ore") {
          const key = subType || "unidentified";
          if (today.ore_count && today.ore_count[key] > 0) {
            today.ore_count = {
              ...today.ore_count,
              [key]: today.ore_count[key] - 1,
            };
            decremented = true;
          }
        } else if (type === "mushroom") {
          const key = subType || "unidentified";
          if (today.mushroom_count && today.mushroom_count[key] > 0) {
            today.mushroom_count = {
              ...today.mushroom_count,
              [key]: today.mushroom_count[key] - 1,
            };
            decremented = true;
          }
        } else if (type === "stick") {
          if (today.stick_count > 0) {
            today.stick_count -= 1;
            decremented = true;
          }
        } else if (
          ["perpetual", "hibiscus", "cotton", "borago"].includes(type)
        ) {
          if (today.plant_count && today.plant_count[type] > 0) {
            today.plant_count = {
              ...today.plant_count,
              [type]: today.plant_count[type] - 1,
            };
            decremented = true;
          }
        }

        if (decremented) {
          next[todayIdx] = today;
          appStorage.setItem(
            "shinobi-map-stats-history",
            JSON.stringify(next),
          );
          return next;
        }
        return prev;
      });
    },
    [],
  );

  const addRouteResourcesToDailyStats = useCallback((counts: Record<string, number>) => {
    setDailyStats((prev) => {
      const todayStr = new Date().toISOString().split("T")[0];
      const next = [...prev];
      let todayIdx = next.findIndex((s) => s.date === todayStr);
      if (todayIdx === -1) {
        next.push(createEmptyStats(todayStr));
        todayIdx = next.length - 1;
      }
      const today = { ...next[todayIdx] };

      let updated = false;

      Object.entries(counts).forEach(([type, count]) => {
        if (count <= 0) return;

        if (type.startsWith('ore_')) {
          today.ore_count = {
            ...today.ore_count,
            [type]: (today.ore_count[type] || 0) + count,
          };
          updated = true;
        } else if (type.startsWith('mushroom_')) {
          today.mushroom_count = {
            ...today.mushroom_count,
            [type]: (today.mushroom_count[type] || 0) + count,
          };
          updated = true;
        } else if (type === 'stick') {
          today.stick_count += count;
          updated = true;
        } else if (['perpetual', 'hibiscus', 'cotton', 'borago'].includes(type)) {
          today.plant_count = {
            ...today.plant_count,
            [type]: (today.plant_count[type] || 0) + count,
          };
          updated = true;
        }
      });

      if (updated) {
        next[todayIdx] = today;
        appStorage.setItem("shinobi-map-stats-history", JSON.stringify(next));
        return next;
      }
      return prev;
    });
  }, []);

  const dailyStatsRef = useRef(dailyStats);
  useEffect(() => {
    dailyStatsRef.current = dailyStats;
  }, [dailyStats]);

  const syncTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const todayStats = dailyStats.find((s) => s.date === todayStr);
      if (todayStats)
        await mapDependencies.mapStatsRepository.saveDailyStats(
          user.id,
          todayStats,
        );
    }, 10000);
    return () => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [dailyStats, isAuthenticated, user?.id]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isAuthenticated || !user?.id) return;
      const todayStr = new Date().toISOString().split("T")[0];
      const todayStats = dailyStatsRef.current.find((s) => s.date === todayStr);
      if (todayStats) {
        mapDependencies.mapStatsRepository
          .saveDailyStats(user.id, todayStats)
          .catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("blur", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("blur", handleBeforeUnload);
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      mapDependencies.mapStatsRepository
        .getStats(user.id)
        .then(async (serverStats) => {
          if (serverStats.length > 0) {
            // Pruning logic: 30 days retention
            const nowRef = new Date();
            const thirtyDaysAgo = new Date(
              nowRef.getTime() - 30 * 24 * 60 * 60 * 1000,
            )
              .toISOString()
              .split("T")[0];

            const oldStats = serverStats.filter(
              (s) => s.date !== "total" && s.date < thirtyDaysAgo,
            );
            const recentStats = serverStats.filter(
              (s) => s.date === "total" || s.date >= thirtyDaysAgo,
            );

            if (oldStats.length > 0) {
              const oldIds = oldStats.map((s) => s.id!).filter(Boolean);
              const currentTotal =
                serverStats.find((s) => s.date === "total") ||
                createEmptyStats("total");

              // Sum old stats into total
              const newTotal = sumStats([currentTotal, ...oldStats]);
              newTotal.date = "total";

              // Save to backend
              await mapDependencies.mapStatsRepository.pruneOldStats(
                user.id,
                oldIds,
                newTotal,
              );

              // Update recentStats with the new total
              const totalIdx = recentStats.findIndex((s) => s.date === "total");
              if (totalIdx >= 0) recentStats[totalIdx] = newTotal;
              else recentStats.push(newTotal);
            }

            setDailyStats((prev) => {
              const merged = [...recentStats];
              prev.forEach((p) => {
                if (p.date !== "total" && p.date >= thirtyDaysAgo) {
                  const serverEquivalent = merged.find(
                    (m) => m.date === p.date,
                  );
                  if (!serverEquivalent) {
                    merged.push(p);
                  } else {
                    const getSum = (s: MapCollectionStats) => {
                      let sum = s.stick_count || 0;
                      Object.values(s.ore_count || {}).forEach(
                        (v) => (sum += v),
                      );
                      Object.values(s.mushroom_count || {}).forEach(
                        (v) => (sum += v),
                      );
                      Object.values(s.plant_count || {}).forEach(
                        (v) => (sum += v),
                      );
                      return sum;
                    };
                    if (getSum(p) > getSum(serverEquivalent)) {
                      const idx = merged.findIndex((m) => m.date === p.date);
                      merged[idx] = { ...p, id: serverEquivalent.id };
                      setTimeout(() => {
                        if (user?.id)
                          mapDependencies.mapStatsRepository
                            .saveDailyStats(user.id, merged[idx])
                            .catch(() => {});
                      }, 1000);
                    }
                  }
                }
              });
              const final = merged.sort((a, b) => a.date.localeCompare(b.date));
              appStorage.setItem(
                "shinobi-map-stats-history",
                JSON.stringify(final),
              );
              return final;
            });
          }
        });
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    const handleStatsUpdated = (e: CustomEvent<MapCollectionStats[]>) => {
      setDailyStats(e.detail);
    };
    window.addEventListener(
      "map-stats-updated",
      handleStatsUpdated as EventListener,
    );
    return () =>
      window.removeEventListener(
        "map-stats-updated",
        handleStatsUpdated as EventListener,
      );
  }, []);

  useEffect(() => {
    if (window.ipcRenderer) {
      const handleClearAllStats = async () => {
        setDailyStats([]);
        appStorage.removeItem("shinobi-map-stats-history");
        if (isAuthenticated && user?.id) {
          try {
            const records = await pb
              .collection("user_map_stats")
              .getFullList({ filter: `owner = "${user.id}"` });
            for (const r of records) {
              try {
                await pb.collection("user_map_stats").delete(r.id);
              } catch {
                await pb.collection("user_map_stats").update(r.id, {
                  ore_count: {},
                  mushroom_count: {},
                  plant_count: {},
                  stick_count: 0,
                });
              }
            }
          } catch (e) {
            console.error(
              "Failed to clear PocketBase stats from IPC listener",
              e,
            );
          }
        }
      };

      window.ipcRenderer.on("clear-all-stats", handleClearAllStats);
      return () => {
        window.ipcRenderer?.off("clear-all-stats", handleClearAllStats);
      };
    }
  }, [isAuthenticated, user?.id]);
  // --- FIM ESTATISTICAS ---

  const [group, setGroup] = useState<MapGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<MapGroupMember[]>([]);
  const [isGroupLoading, setIsGroupLoading] = useState(false);
  const [pinVisibility, setPinVisibility] = useState<"private" | "group">(
    () =>
      mapDependencies.localNotificationSettingsStorage.read()
        .defaultPinVisibility || "private",
  );
  const [globalTick, setGlobalTick] = useState(() => Date.now());

  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const stored = appStorage.getItem("shinobi-map-search-history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [visibleRoutes, setVisibleRoutes] = useState<string[]>([]);

  const referencedOfficialPointIds = useMemo(() => {
    const ids = new Set<string>();
    const allVisible = [...savedRoutes, ...publicRoutes].filter((r) =>
      visibleRoutes.includes(r.id),
    );
    allVisible.forEach((r) =>
      r.route.checkpoints.forEach((cp) => {
        if (cp.pointId) ids.add(cp.pointId);
      }),
    );
    if (mode === "route")
      currentRoute.checkpoints.forEach((cp) => {
        if (cp.pointId) ids.add(cp.pointId);
      });
    return ids;
  }, [
    savedRoutes,
    publicRoutes,
    visibleRoutes,
    mode,
    currentRoute.checkpoints,
  ]);

  const referencedCustomPinIds = useMemo(() => {
    const ids = new Set<string>();
    const allVisible = [...savedRoutes, ...publicRoutes].filter((r) =>
      visibleRoutes.includes(r.id),
    );
    allVisible.forEach((r) =>
      r.route.checkpoints.forEach((cp) => {
        if (cp.customPinId) ids.add(cp.customPinId);
      }),
    );
    if (mode === "route")
      currentRoute.checkpoints.forEach((cp) => {
        if (cp.customPinId) ids.add(cp.customPinId);
      });
    return ids;
  }, [
    savedRoutes,
    publicRoutes,
    visibleRoutes,
    mode,
    currentRoute.checkpoints,
  ]);

  const visibleOfficialPoints = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
    const queryTerms = query.split(/\s+/).filter(Boolean);
    const hasActiveSearch = queryTerms.length > 0;

    const matchesTerms = (targetTexts: Array<string | undefined>) => {
      if (queryTerms.length === 0) return true;
      const standardTargets = targetTexts
        .filter(Boolean)
        .map((t) => t!.toLowerCase());
      return queryTerms.every((term) =>
        standardTargets.some((target) => target.includes(term)),
      );
    };

    const hasActiveRoutes = visibleRoutes.some(
      (vId) =>
        savedRoutes.some((r) => r.id === vId) ||
        publicRoutes.some((r) => r.id === vId),
    );

    return officialPoints
      .map((p) => {
        const state = completedPins[p.id];
        if (state?.subType) {
          const resData = getResourceData(state.subType);
          if (resData)
            return {
              ...p,
              name: resData.name,
              iconId: resData.iconId,
              isCompleted: state.status !== "ready",
            };
        }
        return { ...p, isCompleted: !!state && state.status !== "ready" };
      })
      .filter((p) => {
        const typeLabel = getMarkerTypeLabel(p.type);
        const matchesSearchQuery = matchesTerms([
          p.name,
          p.type,
          typeLabel,
          p.regionId,
          p.subRegionId,
        ]);
        const isSearched = hasActiveSearch && matchesSearchQuery;

        // Se for o ponto selecionado pelo usuário, ele deve sempre aparecer no mapa
        if (selectedOfficialPointId === p.id) return true;

        // Se estiver exibindo rota em modo exploração, só mostra os pontos da rota.
        // EXCEÇÃO: Se houver busca ativa e o ponto corresponder à busca, também mostra!
        if (hasActiveRoutes && mode === "explore") {
          if (referencedOfficialPointIds.has(p.id)) return true;
          if (!isSearched) return false;
        }

        // Esconder spots inativos se a opção estiver ativada
        // EXCEÇÃO: se o spot corresponder a uma busca ativa, ele NÃO deve ser escondido
        const isDynamicRes = [
          "ore",
          "mushroom",
          "stick",
          "perpetual",
          "hibiscus",
          "cotton",
          "borago",
        ].includes(p.type);
        if (notificationSettings.hideUnmarkedResources && isDynamicRes) {
          if (!completedPins[p.id] && !isSearched) return false;
        }

        const matchesLayer = selectedLayers.includes("officialPins");
        const matchesRegion =
          selectedRegion === "all" || p.regionId === selectedRegion;

        let matchesType = selectedTypes.includes(p.type as string);
        const selectedSubTypes = selectedTypes.filter((t) => t.includes("_"));
        if (selectedSubTypes.length > 0) {
          const state = completedPins[p.id];
          const isBaseTypeSelected = selectedTypes.includes(p.type as string);
          const isCurrentSubTypeSelected =
            state?.subType && selectedSubTypes.includes(state.subType);
          matchesType = !!(isBaseTypeSelected || isCurrentSubTypeSelected);
        }

        // Se houver busca ativa e o ponto corresponder, mostrá-lo mesmo que o tipo/categoria esteja oculto
        if (isSearched) return matchesLayer && matchesRegion;

        return (
          matchesLayer && matchesRegion && matchesSearchQuery && matchesType
        );
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    officialPoints,
    debouncedSearchQuery,
    selectedLayers,
    selectedRegion,
    selectedTypes,
    visibleRoutes.length,
    mode,
    referencedOfficialPointIds,
    completedPins,
    notificationSettings.hideUnmarkedResources,
    selectedOfficialPointId,
  ]);

  const visibleCustomPins = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
    const hasActiveSearch = query.length > 0;
    const hasActiveRoutes = visibleRoutes.some(
      (vId) =>
        savedRoutes.some((r) => r.id === vId) ||
        publicRoutes.some((r) => r.id === vId),
    );

    return customPins.filter((p) => {
      const matchesSearchQuery = matchesSearch(
        [p.name, ...p.tags],
        debouncedSearchQuery,
      );
      const isSearched = hasActiveSearch && matchesSearchQuery;

      // Se for o pin customizado selecionado pelo usuário, ele deve sempre aparecer no mapa
      if (selectedCustomPinId === p.id) return true;

      // Respeitar o toggle de visibilidade do pin
      if (p.isHidden) return false;

      if (hasActiveRoutes && mode === "explore") {
        const idsInRoutes = new Set<string>();
        savedRoutes
          .filter((r) => visibleRoutes.includes(r.id))
          .forEach((r) =>
            r.route.checkpoints.forEach((cp) => {
              if (cp.customPinId) idsInRoutes.add(cp.customPinId);
            }),
          );

        if (idsInRoutes.has(p.id)) return true;
        if (isSearched) {
          return selectedLayers.includes("customPins");
        }
        return false;
      }
      // Se houver busca ativa e o pin corresponder, mostrá-lo mesmo que a camada esteja oculta
      if (isSearched) return true;
      return selectedLayers.includes("customPins") && matchesSearchQuery;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    customPins,
    debouncedSearchQuery,
    selectedLayers,
    visibleRoutes,
    mode,
    savedRoutes,
    selectedCustomPinId,
  ]);

  const searchResults = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
    if (!query) return [];

    const queryTerms = query.split(/\s+/).filter(Boolean);

    const matchesTerms = (targetTexts: Array<string | undefined>) => {
      const standardTargets = targetTexts
        .filter(Boolean)
        .map((t) => t!.toLowerCase());
      return queryTerms.every((term) =>
        standardTargets.some((target) => target.includes(term)),
      );
    };

    const matchedO = officialPoints
      .map((p) => {
        const state = completedPins[p.id];
        if (state?.subType) {
          const resData = getResourceData(state.subType);
          if (resData)
            return { ...p, name: resData.name, iconId: resData.iconId };
        }
        return p;
      })
      .filter((p) => {
        const typeLabel = getMarkerTypeLabel(p.type);
        return matchesTerms([
          p.name,
          p.type,
          typeLabel,
          p.regionId,
          p.subRegionId,
        ]);
      });

    const matchedC = customPins.filter((p) => {
      return matchesTerms([p.name, p.description, ...p.tags]);
    });

    return [
      ...matchedO.map((p) => ({ ...p, isCustom: false, color: undefined })),
      ...matchedC.map((p) => ({ ...p, isCustom: true, type: undefined })),
      ...publicRoutes.map((r) => ({ ...r, isRoute: true })),
    ];
  }, [
    debouncedSearchQuery,
    officialPoints,
    customPins,
    completedPins,
    publicRoutes,
  ]);

  const totalSearchPages = Math.ceil(searchResults.length / 10);
  const paginatedSearchResults = useMemo(() => {
    return searchResults.slice((searchPage - 1) * 10, searchPage * 10);
  }, [searchResults, searchPage]);

  const copyText = useCallback(
    (text: string, message: string) => {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast("Copiado", message, "success"));
    },
    [showToast],
  );

  const getLastGlobalResetTime = useCallback(() => {
    const now = new Date();
    const t00 = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
    ).getTime();
    const t12 = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      12,
      0,
      0,
    ).getTime();
    if (now.getTime() >= t12) return t12;
    if (now.getTime() >= t00) return t00;
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
      12,
      0,
      0,
    ).getTime();
  }, []);

  const triggerAlert = useCallback(
    (p: MapPointReference, m: string) => {
      showToast(p.type === "merchant" ? "Despawn" : "Respawn", m, "info");
      if (notificationSettings.soundEnabled)
        SoundSynthesizer.play(
          notificationSettings.soundType,
          notificationSettings.soundVolume,
        );
    },
    [showToast, notificationSettings],
  );

  // Engine: Global Ticker + Timers
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setGlobalTick(now);
      setCompletedPins((prev) => {
        const lastReset = getLastGlobalResetTime();
        let hasChanges = false;
        const next = { ...prev };
        for (const [id, state] of Object.entries(next)) {
          const p = officialPoints.find((i) => i.id === id);
          if (!p) continue;
          const completedAtTime = new Date(state.completedAt).getTime();
          const isRes = [
            "ore",
            "mushroom",
            "stick",
            "perpetual",
            "hibiscus",
            "cotton",
            "borago",
          ].includes(p.type);
          const isUncomp = uncompletableTypes.includes(p.type as any);

          if ((isRes || isUncomp) && completedAtTime < lastReset) {
            delete next[id];
            hasChanges = true;
            continue;
          }
          if (p.timer || state.subType) {
            const timer =
              (state.subType ? getResourceTimer(state.subType) : undefined) ??
              p.timer ??
              0;

            // Se o timer for 0 (recursos padrão como ore_1/mushroom_1), pulamos a lógica de countdown
            // para que fiquem permanentemente marcados até o reset global.
            if (timer === 0) continue;
            const elap = Math.floor((now - completedAtTime) / 1000);
            const rem = timer - elap;
            if (elap >= timer) {
              if (isRes) {
                if (state.status !== "ready") {
                  next[id] = { ...state, status: "ready" };
                  hasChanges = true;
                  if (isAuthenticated && user) {
                    mapDependencies.respawnRepository
                      .record(
                        id,
                        state.completedAt,
                        p.name,
                        user.id,
                        timer,
                        getMarkerIconSrc(state.subType || p.iconId),
                        p.regionId,
                        p.subRegionId,
                        p.type,
                        state.subType,
                        "ready",
                        pinVisibility === "group" ? group?.id : undefined,
                      )
                      .catch(logger.error);
                  }
                }
              } else {
                delete next[id];
                hasChanges = true;
                if (isAuthenticated && user) {
                  mapDependencies.respawnRepository
                    .cancel(id)
                    .catch(logger.error);
                }
              }
            } else if (
              p.type !== "merchant" &&
              notificationSettings.enabledTypes?.[p.type] !== false
            ) {
              if (rem <= notificationSettings.leadTime && !state.leadNotified) {
                triggerAlert(p, `Faltam ${rem}s para ${p.name}!`);
                next[id] = { ...state, leadNotified: true };
                hasChanges = true;
              }
            }
          }
        }
        if (hasChanges) {
          appStorage.setItem(
            "shinobi-map-completed-pins",
            JSON.stringify(next),
          );
          return next;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [
    officialPoints,
    triggerAlert,
    notificationSettings,
    getLastGlobalResetTime,
    isAuthenticated,
    user,
    pinVisibility,
    group,
  ]);

  // Cleanup de Rotas Descartáveis
  useEffect(() => {
    const cleanupDisposableRoutes = async () => {
      const lastReset = getLastGlobalResetTime();
      const toDelete = savedRoutes.filter(
        (r) => r.isDisposable && new Date(r.createdAt).getTime() < lastReset,
      );
      if (toDelete.length > 0) {
        let localsChanged = false;
        const locals = mapDependencies.localMapRoutesStorage.read();
        let newLocals = [...locals];

        for (const r of toDelete) {
          try {
            const isLocal = newLocals.some(
              (localRoute) => localRoute.id === r.id,
            );
            if (isLocal) {
              newLocals = newLocals.filter(
                (localRoute) => localRoute.id !== r.id,
              );
              localsChanged = true;
            } else {
              await mapDependencies.mapRoutesRepository.delete(r.id);
            }
          } catch (e) {
            logger.error("Falha ao deletar rota descartavel", e);
          }
        }

        if (localsChanged) {
          mapDependencies.localMapRoutesStorage.write(newLocals);
        }

        setSavedRoutes((prev) => prev.filter((r) => !toDelete.includes(r)));
        setVisibleRoutes((prev) =>
          prev.filter((vId) => !toDelete.some((del) => del.id === vId)),
        );
      }
    };
    if (savedRoutes.length > 0) {
      cleanupDisposableRoutes();
    }
  }, [globalTick, savedRoutes, getLastGlobalResetTime]);

  const loadGroupData = useCallback(async () => {
    const userId = user?.id;
    if (!userId) return;
    setIsGroupLoading(true);
    try {
      const myGroup = await mapDependencies.groupRepository.getMyGroup(userId);
      setGroup(myGroup);
      if (myGroup) {
        const mems = await mapDependencies.groupRepository.getGroupMembers(
          myGroup.id,
        );
        setGroupMembers(mems);
      }
    } catch (error: unknown) {
      logger.error("Group load error:", error);
    } finally {
      setIsGroupLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      void (async () => {
        setGroup(null);
        setGroupMembers([]);
        setSavedRoutes([]);
      })();
      return;
    }

    const initData = async () => {
      await loadGroupData();
      try {
        const result = await mapDependencies.mapRoutesRepository.listMine(
          mineRoutesPage,
          15,
        );
        const locals = mapDependencies.localMapRoutesStorage.read();

        const allRoutes = [...locals];
        result.items.forEach((r) => {
          if (!allRoutes.find((l) => l.id === r.id)) {
            allRoutes.push(r);
          }
        });

        setSavedRoutes(allRoutes);
        setTotalSavedRoutesPages(result.totalPages);
      } catch (error: unknown) {
        logger.error(error);
      }
    };

    void initData();
  }, [isAuthenticated, loadGroupData, mineRoutesPage]);

  // Public Routes Fetch
  useEffect(() => {
    const fetchPublicRoutes = async () => {
      setPublicRoutesLoading(true);
      try {
        const result = await mapDependencies.mapRoutesRepository.searchPublic(
          debouncedPublicRoutesQuery,
          publicRoutesPage,
          15,
        );
        setPublicRoutes(result.items);
        setTotalPublicRoutesPages(result.totalPages);
      } catch (error: unknown) {
        logger.error(error);
      } finally {
        setPublicRoutesLoading(false);
      }
    };
    void fetchPublicRoutes();
  }, [debouncedPublicRoutesQuery, publicRoutesPage]);

  const userRef = useRef(user);
  const groupRef = useRef(group);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    groupRef.current = group;
  }, [group]);

  useEffect(() => {
    if (!isAuthenticated) return;
    mapDependencies.respawnRepository.listActive().then((records) => {
      setCompletedPins((prev) => {
        const next = { ...prev };
        records.forEach((r) => {
          const isMine = userRef.current && r.ownerId === userRef.current.id;
          const isMyGroup =
            groupRef.current && r.groupId === groupRef.current.id;
          if (isMine || isMyGroup) {
            next[r.pinId] = {
              completedAt: r.completedAt,
              subType: r.subType,
              status: r.status as "cooldown" | "ready",
            };
          }
        });
        return next;
      });
    });
    const unsubscribe = mapDependencies.respawnRepository.subscribe(
      (update) => {
        if ("deleted" in update) {
          setCompletedPins((prev) => {
            const next = { ...prev };
            delete next[update.pinId];
            return next;
          });
        } else {
          const isMine =
            userRef.current && update.ownerId === userRef.current.id;
          const isMyGroup =
            groupRef.current && update.groupId === groupRef.current.id;
          if (isMine || isMyGroup) {
            setCompletedPins((prev) => {
              const next = { ...prev };
              const existing = next[update.pinId];
              if (
                !existing ||
                new Date(update.completedAt) >=
                  new Date(existing.completedAt) ||
                update.status !== existing.status
              ) {
                next[update.pinId] = {
                  completedAt: update.completedAt,
                  subType: update.subType,
                  status: update.status as "cooldown" | "ready",
                };
              }
              return next;
            });
          }
        }
      },
    );
    return () => unsubscribe();
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      mapDependencies.notificationSettingsRepository.read(user.id).then((s) => {
        if (s) {
          _setNotificationSettings(s);
          if (s.defaultPinVisibility) setPinVisibility(s.defaultPinVisibility);
        }
      });
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      mapDependencies.notificationSettingsRepository
        .update(user.id, notificationSettings)
        .catch(logger.error);
    }
  }, [notificationSettings, isAuthenticated, user?.id]);

  const createGroup = useCallback(
    async (name: string) => {
      const userId = user?.id;
      if (!userId) return;
      setIsGroupLoading(true);
      try {
        const newGroup = await mapDependencies.groupRepository.createGroup(
          name,
          userId,
        );
        setGroup(newGroup);
        await loadGroupData();
        showToast("Sucesso", "Grupo criado!", "success");
      } catch {
        showToast("Erro", "Falha ao criar grupo.", "error");
      } finally {
        setIsGroupLoading(false);
      }
    },
    [user?.id, loadGroupData, showToast],
  );

  const joinGroup = useCallback(
    async (code: string) => {
      const userId = user?.id;
      if (!userId) return;
      setIsGroupLoading(true);
      try {
        const joinedGroup =
          await mapDependencies.groupRepository.joinGroupByCode(code, userId);
        setGroup(joinedGroup);
        await loadGroupData();
        showToast("Sucesso", "Entrou no grupo!", "success");
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Falha ao entrar.";
        showToast("Erro", message, "error");
      } finally {
        setIsGroupLoading(false);
      }
    },
    [user?.id, loadGroupData, showToast],
  );

  const leaveGroup = useCallback(async () => {
    const userId = user?.id;
    if (!userId || !group) return;
    if (!confirm("Sair do grupo?")) return;
    setIsGroupLoading(true);
    try {
      await mapDependencies.groupRepository.leaveGroup(group.id, userId);
      setGroup(null);
      setGroupMembers([]);
      showToast("Info", "Você saiu.", "info");
    } catch {
      showToast("Erro", "Falha ao sair.", "error");
    } finally {
      setIsGroupLoading(false);
    }
  }, [user?.id, group, showToast]);

  const copyInviteCode = useCallback(() => {
    if (group) {
      navigator.clipboard.writeText(group.inviteCode);
      showToast("Copiado", "Código copiado!", "success");
    }
  }, [group, showToast]);

  const updateNotificationSettings = useCallback(
    (s: Partial<NotificationSettings>) => {
      if (
        s.pushEnabled === false &&
        notificationSettings.pushEnabled === true &&
        isAuthenticated
      ) {
        pb.send("/api/remove-token", { method: "POST" }).catch(logger.error);
      }

      _setNotificationSettings((prev) => {
        const next = { ...prev, ...s };
        mapDependencies.localNotificationSettingsStorage.write(next);
        return next;
      });

      if (s.defaultPinVisibility) {
        setPinVisibility(s.defaultPinVisibility);
      }
    },
    [notificationSettings.pushEnabled, isAuthenticated],
  );

  const togglePinCompleted = useCallback(
    (id: string, subType?: string, isRestarting: boolean = false) => {
      const p = officialPoints.find((i) => i.id === id);
      const isUncompletable = p && uncompletableTypes.includes(p.type);
      const currentState = completedPins[id];
      const isUnmarking = !subType && !isRestarting && !!currentState;

      // Se for um tipo estático (Vila, Loja, etc), apenas toggle no estado local/banco sem timer
      if (isUncompletable) {
        setCompletedPins((prev) => {
          const next = { ...prev };
          if (isUnmarking) delete next[id];
          else
            next[id] = {
              completedAt: new Date().toISOString(),
              status: "cooldown",
            }; // Usamos cooldown apenas para indicar 'marcado'
          return next;
        });

        // Sincronizar com PocketBase se necessário (opcional para estáticos, mas bom para persistência)
        if (isAuthenticated && user) {
          if (isUnmarking)
            mapDependencies.respawnRepository.cancel(id).catch(logger.error);
          else
            mapDependencies.respawnRepository
              .record(
                id,
                new Date().toISOString(),
                p?.name || "Pin",
                user.id,
                0,
                getMarkerIconSrc(p!.iconId),
                p?.regionId,
                p?.subRegionId,
                p?.type,
                undefined,
                "cooldown",
                pinVisibility === "group" ? group?.id : undefined,
              )
              .catch(logger.error);
        }
        return;
      }

      const isRes =
        p &&
        [
          "ore",
          "mushroom",
          "stick",
          "perpetual",
          "hibiscus",
          "cotton",
          "borago",
        ].includes(p.type);
      const finalGroupId = pinVisibility === "group" ? group?.id : undefined;

      // Se for recurso padrão (Pedra/Cogumelo comum), não tem timer (fica marcado até o reset global)
      // Usamos ?? para garantir que se for 0, ele use o 0 e não o fallback do ||
      const timer =
        (subType ? getResourceTimer(subType) : undefined) ?? p?.timer ?? 0;

      const iconUrl = subType
        ? getMarkerIconSrc(subType)
        : p
          ? getMarkerIconSrc(p.iconId)
          : "";
      if (isAuthenticated && user) {
        const userId = user.id;
        if (isUnmarking) {
          if (isRes)
            mapDependencies.respawnRepository
              .record(
                id,
                currentState.completedAt,
                p?.name || "Pin",
                userId,
                timer,
                iconUrl,
                p?.regionId,
                p?.subRegionId,
                p?.type || "custom",
                currentState.subType,
                "ready",
                finalGroupId,
              )
              .catch(logger.error);
          else mapDependencies.respawnRepository.cancel(id).catch(logger.error);
        } else
          mapDependencies.respawnRepository
            .record(
              id,
              new Date().toISOString(),
              p?.name || "Pin",
              userId,
              timer,
              iconUrl,
              p?.regionId,
              p?.subRegionId,
              p?.type || "custom",
              subType,
              "cooldown",
              finalGroupId,
            )
            .catch(logger.error);
      }
      if (!isUnmarking) {
        const isNewCollection =
          !currentState ||
          currentState.subType !== subType ||
          currentState.status === "ready" ||
          isRestarting;
        if (isNewCollection) {
          if (p && (p.type === "ore" || p.type === "mushroom")) {
            incrementResourceStat(p.type, subType);
          } else if (
            p &&
            ["stick", "perpetual", "hibiscus", "cotton", "borago"].includes(
              p.type,
            )
          ) {
            incrementResourceStat(p.type);
          }
        }
      } else {
        if (currentState && currentState.status === "cooldown") {
          if (p && (p.type === "ore" || p.type === "mushroom")) {
            decrementResourceStat(p.type, currentState.subType);
          } else if (
            p &&
            ["stick", "perpetual", "hibiscus", "cotton", "borago"].includes(
              p.type,
            )
          ) {
            decrementResourceStat(p.type);
          }
        }
      }
      setCompletedPins((prev) => {
        const next = { ...prev };
        if (isUnmarking) {
          // Se for recurso padrão (sem timer), deletamos completamente para não mostrar alerta '!'
          const isStandard =
            subType === "ore_1" ||
            subType === "mushroom_1" ||
            currentState?.subType === "ore_1" ||
            currentState?.subType === "mushroom_1";
          if (isRes && isStandard) delete next[id];
          else if (isRes) next[id] = { ...currentState, status: "ready" };
          else delete next[id];
        } else {
          next[id] = {
            completedAt: new Date().toISOString(),
            subType,
            status: "cooldown",
          };
        }
        return next;
      });
    },
    [
      officialPoints,
      isAuthenticated,
      user,
      completedPins,
      pinVisibility,
      group,
      incrementResourceStat,
      decrementResourceStat,
    ],
  );

  const resetAllActiveRespawns = useCallback(async () => {
    if (
      !confirm(
        "Deseja resetar TODAS as marcações ativas (Pessoais e de Grupo)?",
      )
    )
      return;
    try {
      const active = await mapDependencies.respawnRepository.listActive();
      for (const record of active) {
        const isMine = userRef.current && record.ownerId === userRef.current.id;
        const isMyGroup =
          groupRef.current && record.groupId === groupRef.current.id;
        if (isMine || isMyGroup) {
          await mapDependencies.respawnRepository.cancel(record.pinId);
        }
      }
      setCompletedPins({});
      showToast("Sucesso", "Todas as marcações foram resetadas.", "success");
    } catch {
      showToast("Erro", "Falha ao resetar marcações.", "error");
    }
  }, [showToast]);

  const interactiveMap = useInteractiveMap({
    onMapTap: (coords) => {
      if (editingCustomPinIdRef.current) {
        setDraftCustomPin((prev) =>
          prev ? { ...prev, x: coords.x, y: coords.y, isPlaced: true } : prev,
        );
        return;
      }
      if (mode === "pin") {
        const id = createId("pin");
        const p: SavedCustomPin = {
          color: "#00d6a3",
          description: "",
          iconId: "pin",
          id,
          name: `Pin ${customPins.length + 1}`,
          tags: [],
          x: coords.x,
          y: coords.y,
          isPlaced: true,
          source: "local",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setDraftCustomPin(p);
        setSelectedCustomPinId(id);
        _setEditingCustomPinIdRef(id);
        return;
      }
      if (mode === "route") {
        const clickThreshold = 1.2 / interactiveMap.displayedCamera.scale;
        const getDist = (p: { x: number; y: number }) =>
          Math.sqrt(Math.pow(p.x - coords.x, 2) + Math.pow(p.y - coords.y, 2));

        let bestVisibleO: MapPointReference | null = null;
        let minVisibleO = Infinity;
        visibleOfficialPoints.forEach((p) => {
          const d = getDist(p);
          if (d < minVisibleO) {
            minVisibleO = d;
            bestVisibleO = p;
          }
        });

        let bestVisibleC: SavedCustomPin | null = null;
        let minVisibleC = Infinity;
        visibleCustomPins.forEach((p) => {
          const d = getDist(p);
          if (d < minVisibleC) {
            minVisibleC = d;
            bestVisibleC = p;
          }
        });

        let minFullO = Infinity;
        officialPoints.forEach((p) => {
          const d = getDist(p);
          if (d < minFullO) {
            minFullO = d;
          }
        });

        let minFullC = Infinity;
        customPins.forEach((p) => {
          const d = getDist(p);
          if (d < minFullC) {
            minFullC = d;
          }
        });

        const isClickingOnVisibleO = minVisibleO < clickThreshold;
        const isClickingOnVisibleC = minVisibleC < clickThreshold;
        const isClickingOnHiddenO =
          minFullO < clickThreshold && !isClickingOnVisibleO;
        const isClickingOnHiddenC =
          minFullC < clickThreshold && !isClickingOnVisibleC;

        if (isClickingOnHiddenO || isClickingOnHiddenC) return;

        if (
          isClickingOnVisibleO &&
          minVisibleO <= minVisibleC &&
          bestVisibleO
        ) {
          setCurrentRoute((prev) => ({
            ...prev,
            checkpoints: [
              ...prev.checkpoints,
              {
                id: createId("checkpoint"),
                x: bestVisibleO!.x,
                y: bestVisibleO!.y,
                pointId: bestVisibleO!.id,
                label: bestVisibleO!.name,
              },
            ],
          }));
        } else if (isClickingOnVisibleC && bestVisibleC) {
          setCurrentRoute((prev) => ({
            ...prev,
            checkpoints: [
              ...prev.checkpoints,
              {
                id: createId("checkpoint"),
                x: bestVisibleC!.x,
                y: bestVisibleC!.y,
                customPinId: bestVisibleC!.id,
                label: bestVisibleC!.name,
              },
            ],
          }));
        } else {
          setCurrentRoute((prev) => ({
            ...prev,
            checkpoints: [
              ...prev.checkpoints,
              {
                id: createId("checkpoint"),
                x: coords.x,
                y: coords.y,
                label: `Ponto ${prev.checkpoints.length + 1}`,
              },
            ],
          }));
        }
        return;
      }
      if (mode === "feedback") {
        setFeedbackTarget({ x: coords.x, y: coords.y });
        setIsFeedbackModalOpen(true);
        _setMode("explore");
        return;
      }
      if (mode === "explore") {
        const clickThreshold = 1.2 / interactiveMap.displayedCamera.scale;
        const getDist = (p: { x: number; y: number }) =>
          Math.sqrt(Math.pow(p.x - coords.x, 2) + Math.pow(p.y - coords.y, 2));
        let bestO: MapPointReference | null = null;
        let minO = Infinity;
        visibleOfficialPoints.forEach((p) => {
          const d = getDist(p);
          if (d < minO) {
            minO = d;
            bestO = p;
          }
        });
        let bestC: SavedCustomPin | null = null;
        let minC = Infinity;
        visibleCustomPins.forEach((p) => {
          const d = getDist(p);
          if (d < minC) {
            minC = d;
            bestC = p;
          }
        });
        if (minO < clickThreshold && minO <= minC) {
          setSelectedOfficialPointId(bestO!.id);
          setSelectedCustomPinId(null);
          _setEditingCustomPinIdRef(null);
          setDraftCustomPin(null);
        } else if (minC < clickThreshold) {
          setSelectedCustomPinId(bestC!.id);
          setSelectedOfficialPointId(null);
          _setEditingCustomPinIdRef(null);
          setDraftCustomPin(null);
        } else {
          setSelectedOfficialPointId(null);
          setSelectedCustomPinId(null);
          _setEditingCustomPinIdRef(null);
          setDraftCustomPin(null);
        }
      }
    },
  });

  const saveCurrentRoute = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    const userId = user.id;
    const isPub = publicRoutes.find((r) => r.id === selectedSavedRouteId);
    if (isPub && isPub.owner !== userId) {
      showToast(
        "Erro",
        "Você não pode editar uma rota pública de outro usuário.",
        "error",
      );
      return;
    }
    try {
      const rSave = cleanRouteForPersist(currentRoute, customPins);
      if (selectedSavedRouteId) {
        await mapDependencies.mapRoutesRepository.update(
          selectedSavedRouteId,
          rSave,
          userId,
        );
        if (!visibleRoutes.includes(selectedSavedRouteId))
          setVisibleRoutes((prev) => [...prev, selectedSavedRouteId]);
      } else {
        const saved = await mapDependencies.mapRoutesRepository.create(rSave, userId);
        setVisibleRoutes((prev) => [...prev, saved.id]);
      }
      mapDependencies.mapRoutesRepository.listMine().then((res) => {
        setSavedRoutes(res.items);
        setTotalSavedRoutesPages(res.totalPages);
      });
      showToast("Sucesso", "Salva.", "success");
      _setMode("explore");
      setSelectedSavedRouteId(null);
      setCurrentRoute({
        checkpoints: [],
        color: "#00d6a3",
        createdAt: new Date().toISOString(),
        customPins: [],
        description: "",
        id: createId("route"),
        name: "Nova rota",
        updatedAt: new Date().toISOString(),
      });
    } catch (error: unknown) {
      logger.error(error);
      showToast("Erro", "Falha.", "error");
    }
  }, [
    isAuthenticated,
    user,
    currentRoute,
    customPins,
    showToast,
    selectedSavedRouteId,
    publicRoutes,
    visibleRoutes,
  ]);

  const getPinTimerRemaining = useCallback(
    (id: string, timer: number | null) => {
      const state = completedPins[id];
      if (!state) return 0;

      // Priorizar o timer do subtipo identificado, caso contrário usar o do ponto
      const actualTimer =
        (state.subType ? getResourceTimer(state.subType) : undefined) ?? timer;

      if (actualTimer === null || actualTimer === undefined) return 0;
      const elapsed = Math.floor(
        (Date.now() - new Date(state.completedAt).getTime()) / 1000,
      );
      return Math.max(0, actualTimer - elapsed);
    },
    [completedPins],
  );
  const selectCustomPin = useCallback(
    (id: string | null) => {
      if (mode === "route" && id) {
        const pin = customPins.find((p) => p.id === id);
        if (pin)
          setCurrentRoute((prev) => ({
            ...prev,
            checkpoints: [
              ...prev.checkpoints,
              {
                id: createId("checkpoint"),
                x: pin.x,
                y: pin.y,
                customPinId: pin.id,
                label: pin.name,
              },
            ],
          }));
        return;
      }
      setSelectedCustomPinId(id);
      setSelectedOfficialPointId(null);
      if (id === null) {
        setDraftCustomPin(null);
        _setEditingCustomPinIdRef(null);
        _setMode("explore");
      }
    },
    [mode, customPins, _setEditingCustomPinIdRef],
  );

  const selectOfficialPoint = useCallback(
    (id: string | null) => {
      if (!id) {
        setSelectedOfficialPointId(null);
        return;
      }
      if (mode === "route") {
        const p = officialPoints.find((i) => i.id === id);
        if (p)
          setCurrentRoute((prev) => ({
            ...prev,
            checkpoints: [
              ...prev.checkpoints,
              {
                id: createId("checkpoint"),
                x: p.x,
                y: p.y,
                pointId: p.id,
                label: p.name,
              },
            ],
          }));
        return;
      }
      setSelectedOfficialPointId(id);
      setSelectedCustomPinId(null);
      _setEditingCustomPinIdRef(null);
      setDraftCustomPin(null);
    },
    [mode, officialPoints, _setEditingCustomPinIdRef],
  );

  const requestPushPermission = useCallback(async () => {
    if (!isAuthenticated) {
      showToast(
        "Aviso",
        "Você precisa estar logado para ativar notificações push.",
        "info",
      );
      return false;
    }

    try {
      const token = await requestNotificationToken();
      if (token) {
        await pb.send("/api/save-token", {
          method: "POST",
          body: { token },
        });
        updateNotificationSettings({ pushEnabled: true });
        showToast("Sucesso", "Notificações ativadas!", "success");
        return true;
      }
    } catch (error) {
      logger.error("Erro ao solicitar permissão de push:", error);
      showToast("Erro", "Falha ao ativar notificações.", "error");
    }
    return false;
  }, [isAuthenticated, showToast, updateNotificationSettings]);

  const confirmCustomPin = useCallback(() => {
    if (!draftCustomPin) return;
    setCustomPins((prev) => {
      const next = prev.find((p) => p.id === draftCustomPin.id)
        ? prev.map((p) => (p.id === draftCustomPin.id ? draftCustomPin : p))
        : [...prev, draftCustomPin];
      appStorage.setItem("shinobi-map-custom-pins", JSON.stringify(next));
      return next;
    });
    setDraftCustomPin(null);
    _setEditingCustomPinIdRef(null);
    _setMode("explore");
  }, [draftCustomPin, _setEditingCustomPinIdRef]);

  const cancelCustomPin = useCallback(() => {
    const id = editingCustomPinId;
    if (id && id.startsWith("pin-")) {
      setCustomPins((prev) => prev.filter((p) => p.id !== id));
    }
    setDraftCustomPin(null);
    _setEditingCustomPinIdRef(null);
    _setMode("explore");
  }, [editingCustomPinId, _setEditingCustomPinIdRef]);

  const generateOptimizedRoute = useCallback(
    async (filters: AutoRouteFilters) => {
      // Filtrar pontos oficiais
      let filteredOfficial = officialPoints.filter((p) => {
        const state = completedPins[p.id];

        let matchesType = filters.categories.includes(p.type);
        const selectedSubTypes = filters.categories.filter((t) =>
          t.includes("_"),
        );

        if (selectedSubTypes.length > 0) {
          const pointBaseTypeHasSubtypesSelected = selectedSubTypes.some((t) =>
            t.startsWith(p.type + "_"),
          );

          if (pointBaseTypeHasSubtypesSelected) {
            const effectiveSubType = state?.subType || (p.type === 'ore' ? 'ore_1' : undefined);
            const isCurrentSubTypeSelected =
              effectiveSubType && selectedSubTypes.includes(effectiveSubType);
            matchesType = !!isCurrentSubTypeSelected;
          } else {
            matchesType = filters.categories.includes(p.type);
          }
        }

        return matchesType;
      });

      if (filters.regionId !== "all") {
        filteredOfficial = filteredOfficial.filter(
          (p) => p.regionId === filters.regionId,
        );
      }
      if (filters.subRegionId !== "all") {
        filteredOfficial = filteredOfficial.filter(
          (p) => p.subRegionId === filters.subRegionId,
        );
      }

      const pointsToRoute: any[] = [
        ...filteredOfficial.map((p) => ({ ...p, pointId: p.id })),
      ];

      if (filters.includeCustomPins) {
        pointsToRoute.push(
          ...visibleCustomPins.map((p) => ({ ...p, customPinId: p.id })),
        );
      }

      if (pointsToRoute.length < 2) {
        showToast(
          "Aviso",
          "A combinação dos filtros não resultou em pontos suficientes (mín. 2).",
          "info",
        );
        return;
      }

      const { optimizeRoute } =
        await import("../../core/usecases/OptimizeRoute.usecase");
      const checkpoints: RouteCheckpoint[] = pointsToRoute.map((p) => ({
        id: createId("checkpoint"),
        pointId: p.pointId,
        customPinId: p.customPinId,
        x: p.x,
        y: p.y,
      }));

      const optimized = optimizeRoute(checkpoints);

      // Compute route stats
      const resourceCounts: Record<string, number> = {};
      optimized.forEach((c) => {
        if (c.pointId) {
          const point = officialPoints.find((p) => p.id === c.pointId);
          if (point) {
            const state = completedPins[point.id];
            let type = state?.subType || point.type;
            
            // Pedra sem identificação é considerada ore_1
            if (type === 'ore') {
              type = 'ore_1';
            }
            
            const resDef = getResourceData(type);
            const yieldAmount = resDef?.yields || 1;

            resourceCounts[type] = (resourceCounts[type] || 0) + yieldAmount;
          }
        }
      });

      const routeStats = {
        totalPoints: optimized.length,
        resourceCounts,
      };

      const newRoute: CustomRoute = {
        id: createId("route-opt"),
        name: "Rota Otimizada (Temporária)",
        description:
          "Rota gerada dinamicamente, será excluída no próximo reset global (00:00 ou 12:00).",
        color: "#ffaa00",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        checkpoints: optimized,
        customPins: visibleCustomPins.map((p) => ({ ...p })),
        isDisposable: true,
        routeStats,
      };

      try {
        const saved = mapDependencies.localMapRoutesStorage.create(newRoute);
        saved.isDisposable = true;
        saved.owner = user?.id || "local";

        const currentLocal = mapDependencies.localMapRoutesStorage.read();
        mapDependencies.localMapRoutesStorage.write([saved, ...currentLocal]);

        setSavedRoutes((prev) => [saved, ...prev]);
        setVisibleRoutes((prev) => [...prev, saved.id]);
        showToast("Sucesso", "Rota otimizada gerada!", "success");
        setSidebarSection("routes");
      } catch (error) {
        logger.error(error);
        showToast("Erro", "Falha ao criar rota otimizada.", "error");
      }
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleOfficialPoints, visibleCustomPins, showToast, user?.id, completedPins, officialPoints],
  );

  useEffect(() => {
     
    setSavedRoutes((prev) => {
      let hasChanges = false;
      const next = [...prev];
      
      for (let i = 0; i < next.length; i++) {
        const routeItem = next[i];
        if (!routeItem.route.isDisposable || !routeItem.route.routeStats) continue;
        
        const newResourceCounts: Record<string, number> = {};
        routeItem.route.checkpoints.forEach((c) => {
          if (c.pointId) {
            const point = officialPoints.find(p => p.id === c.pointId);
            if (point) {
              const state = completedPins[point.id];
              let type = state?.subType || point.type;
              
              // Pedra sem identificação é considerada ore_1
              if (type === 'ore') {
                type = 'ore_1';
              }
              
              const resDef = getResourceData(type);
              const yieldAmount = resDef?.yields || 1;
  
              newResourceCounts[type] = (newResourceCounts[type] || 0) + yieldAmount;
            }
          }
        });
        
        if (JSON.stringify(routeItem.route.routeStats.resourceCounts) !== JSON.stringify(newResourceCounts)) {
          const newRoute = JSON.parse(JSON.stringify(routeItem));
          newRoute.route.routeStats.resourceCounts = newResourceCounts;
          next[i] = newRoute;
          hasChanges = true;
        }
      }
      
      if (!hasChanges) return prev;
      
      mapDependencies.localMapRoutesStorage.write(next);
      return next;
    });
  }, [completedPins, officialPoints]);

  return {
    activeDetails:
      mode !== "explore"
        ? null
        : customPins.find((p) => p.id === selectedCustomPinId) ||
          visibleOfficialPoints.find((p) => p.id === selectedOfficialPointId) ||
          null,
    clearRoute: useCallback(() => {
      setCurrentRoute({
        checkpoints: [],
        color: "#00d6a3",
        createdAt: new Date().toISOString(),
        customPins: [],
        description: "",
        id: createId("route"),
        name: "Nova rota",
        updatedAt: new Date().toISOString(),
      });
      setSelectedSavedRouteId(null);
      _setMode("route");
    }, []),
    copyRouteJson: useCallback(
      () =>
        copyText(
          JSON.stringify(cleanRouteForPersist(currentRoute, customPins)),
          "JSON copiado.",
        ),
      [copyText, currentRoute, customPins],
    ),
    copyPublicRouteUrl: useCallback(
      (slug: string) =>
        copyText(`${window.location.origin}/m/${slug}`, "Link copiado."),
      [copyText],
    ),
    currentRoute,
    customPins,
    defaultMapRegion,
    deleteSavedRoute: useCallback(
      async (id: string) => {
        try {
          const locals = mapDependencies.localMapRoutesStorage.read();
          const isLocal = locals.some((r) => r.id === id);
          if (isLocal) {
            mapDependencies.localMapRoutesStorage.write(
              locals.filter((r) => r.id !== id),
            );
          } else {
            await mapDependencies.mapRoutesRepository.delete(id);
          }
          setSavedRoutes((prev) => prev.filter((r) => r.id !== id));
          setVisibleRoutes((prev) => prev.filter((vId) => vId !== id));
          showToast("Sucesso", "Rota excluída.", "success");
        } catch (e) {
          logger.error(e);
          showToast("Erro", "Falha ao excluir.", "error");
        }
      },
      [showToast],
    ),
    updateRouteCollectedStats: useCallback(
      (id: string, collectedData: Record<string, number>) => {
        setSavedRoutes((prev) => {
          const next = [...prev];
          const routeIdx = next.findIndex((r) => r.id === id);
          if (routeIdx === -1) return next;

          const route = { ...next[routeIdx] };
          if (!route.route.routeStats) return next;

          // Merge old and new stats (sum them)
          const currentCollected = route.route.routeStats.collectedCounts || {};
          
          Object.entries(collectedData).forEach(([type, count]) => {
            const current = currentCollected[type] || 0;
            // Add new count to current (no upper bound to allow multiple runs of the same route)
            currentCollected[type] = Math.max(0, current + count);
          });
          
          route.route.routeStats.collectedCounts = currentCollected;
          next[routeIdx] = route;
          
          // Persist to local storage
          const locals = mapDependencies.localMapRoutesStorage.read();
          const localIdx = locals.findIndex(r => r.id === id);
          if (localIdx !== -1) {
            locals[localIdx] = route;
            mapDependencies.localMapRoutesStorage.write(locals);
          }
          
          return next;
        });
        showToast("Sucesso", "Coleta finalizada e registrada!", "success");
      },
      [showToast]
    ),
    markRoutePinsCompleted: useCallback(
      (id: string) => {
        const route = savedRoutes.find((r) => r.id === id);
        if (!route) return;
        route.route.checkpoints.forEach((cp) => {
          if (!cp.pointId) return; // Only process official points, not custom pins for now
          
          const currentState = completedPins[cp.pointId];
          const isNewCollection =
            !currentState ||
            currentState.status === "ready";
            
          if (isNewCollection) {
            togglePinCompleted(cp.pointId, undefined, false);
          }
        });
      },
      [savedRoutes, completedPins, togglePinCompleted]
    ),
    duplicateSavedRoute: useCallback(
      (id: string) => {
        const route =
          savedRoutes.find((r) => r.id === id) ||
          publicRoutes.find((r) => r.id === id);
        if (route) {
          setCurrentRoute({
            ...route.route,
            id: createId("route"),
            name: `${route.route.name} (Copia)`,
          });
          setSelectedSavedRouteId(null);
          _setMode("route");
          showToast("Sucesso", "Rota importada!", "success");
        }
      },
      [savedRoutes, publicRoutes, showToast],
    ),
    toast,
    importJsonValue,
    setImportJsonValue,
    importRouteFromJson: useCallback(() => {
      try {
        setCurrentRoute(normalizeMapRoute(JSON.parse(importJsonValue)));
        showToast("Importado", "JSON importado.", "success");
      } catch {
        showToast("Erro", "JSON inválido.", "error");
      }
    }, [importJsonValue, showToast]),
    interactiveMap,
    isAuthenticated,
    loadSavedRoute: useCallback(
      async (id: string) => {
        try {
          let r = savedRoutes.find((it) => it.id === id);
          if (r) {
            setCurrentRoute(r.route);
            setSidebarSection("routes");
            _setMode("route");
            setSelectedSavedRouteId(id);
            if (!visibleRoutes.includes(id))
              setVisibleRoutes((prev) => [...prev, id]);
            return;
          }
          r = publicRoutes.find((it) => it.id === id);
          if (r) {
            setCurrentRoute(r.route);
            setSidebarSection("routes");
            _setMode("explore");
            setSelectedSavedRouteId(id);
            if (!visibleRoutes.includes(id))
              setVisibleRoutes((prev) => [...prev, id]);
            showToast(
              "Info",
              "Visualizando rota pública (Somente Leitura)",
              "info",
            );
          }
        } catch {
          showToast("Erro", "Falha ao carregar.", "error");
        }
      },
      [savedRoutes, publicRoutes, visibleRoutes, showToast],
    ),
    unloadCurrentRoute: useCallback(() => {
      setSelectedSavedRouteId(null);
      setCurrentRoute({
        checkpoints: [],
        color: "#00d6a3",
        createdAt: new Date().toISOString(),
        customPins: [],
        description: "",
        id: createId("route"),
        name: "Nova rota",
        updatedAt: new Date().toISOString(),
      });
    }, []),
    mapLayers,
    mapRegions,
    markerTypes,
    mode,
    setMode: useCallback(
      (m: "explore" | "pin" | "route" | "feedback") => _setMode(m),
      [],
    ),
    isFeedbackModalOpen,
    setIsFeedbackModalOpen,
    feedbackTarget,
    setFeedbackTarget,
    submitFeedback: useCallback(
      async (data: MapFeedback) => {
        const userId = user?.id;
        try {
          await new SubmitMapFeedbackUseCase(
            mapDependencies.mapFeedbackRepository,
          ).execute({ ...data, user_id: userId });
          showToast("Sucesso", "Obrigado!", "success");
          setIsFeedbackModalOpen(false);
          setFeedbackTarget(null);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Falha.";
          showToast("Erro", message, "error");
        }
      },
      [user?.id, showToast],
    ),
    officialPoints,
    officialPinCategories: useMemo(() => {
      const baseCats: Array<{
        count: string;
        iconId: string;
        type: string;
        label?: string;
        total: number;
        marked: number;
      }> = [];
      const identifiedCats: Array<{
        count: string;
        iconId: string;
        type: string;
        label?: string;
        total: number;
        marked: number;
      }> = [];

      const q = debouncedSidebarSearchQuery.trim().toLowerCase();

      markerTypes.forEach((type) => {
        const pinsOfType = officialPoints.filter((p) => p.type === type);
        if (pinsOfType.length === 0) return;

        const markedCount = pinsOfType.filter((p) => {
          const state = completedPins[p.id];
          return !!state && state.status !== "ready";
        }).length;

        const typeLabel = type === "ore" ? "Pedra" : getMarkerTypeLabel(type);
        const matchesQ =
          !q ||
          type.toLowerCase().includes(q) ||
          typeLabel.toLowerCase().includes(q);

        // 1. Categoria Base
        if (matchesQ) {
          const isStatic = uncompletableTypes.includes(type as any);
          baseCats.push({
            count: isStatic
              ? `${pinsOfType.length}`
              : `${markedCount}/${pinsOfType.length}`,
            total: pinsOfType.length,
            marked: markedCount,
            iconId: pinsOfType[0].iconId,
            type: type,
            label: typeLabel,
          });
        }

        // 2. Coletar Sub-tipos identificados para o bloco separado
        const isDyn = ["ore", "mushroom"].includes(type);
        if (isDyn) {
          const subTypeMap: Record<string, number> = {};
          pinsOfType.forEach((p) => {
            const state = completedPins[p.id];
            if (state?.subType)
              subTypeMap[state.subType] = (subTypeMap[state.subType] || 0) + 1;
          });

          Object.entries(subTypeMap).forEach(([subId, totalForSub]) => {
            // Pular se for o recurso base (Pedra ou Cogumelo Comum) para evitar duplicidade no menu
            if (subId === "ore_1" || subId === "mushroom_1") return;

            const resData = getResourceData(subId);
            if (resData) {
              const matchesSubQ = !q || resData.name.toLowerCase().includes(q);
              if (!matchesSubQ) return;

              const subMarked = pinsOfType.filter((p) => {
                const s = completedPins[p.id];
                return s?.subType === subId && s.status !== "ready";
              }).length;
              identifiedCats.push({
                count: `${subMarked}/${totalForSub}`,
                total: totalForSub,
                marked: subMarked,
                iconId: resData.iconId,
                type: subId,
                label: resData.name,
              });
            }
          });
        }
      });
      return { base: baseCats, identified: identifiedCats };
    }, [officialPoints, completedPins, debouncedSidebarSearchQuery]),
    openCustomPinsSection: useCallback(() => {
      setSidebarSection("customPins");
      _setMode("pin");
      const id = createId("pin");
      setDraftCustomPin({
        color: "#00d6a3",
        description: "",
        iconId: "pin",
        id,
        name: `Pin ${customPins.length + 1}`,
        tags: [],
        x: 0,
        y: 0,
        isPlaced: false,
        source: "local",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setSelectedCustomPinId(id);
      _setEditingCustomPinIdRef(id);
    }, [customPins.length, _setEditingCustomPinIdRef]),
    publicRoutes,
    publicRoutesLoading,
    publicRoutesQuery,
    publishSelectedRoute: useCallback(
      async (id: string) => {
        const route = savedRoutes.find((r) => r.id === id);
        if (!route || !user) return;
        try {
          await mapDependencies.mapRoutesRepository.publish(route, user.id);
          mapDependencies.mapRoutesRepository.listMine().then((res) => {
            setSavedRoutes(res.items);
            setTotalSavedRoutesPages(res.totalPages);
          });
          showToast("Sucesso", "Rota publicada!", "success");
        } catch {
          showToast("Erro", "Falha ao publicar.", "error");
        }
      },
      [savedRoutes, user, showToast],
    ),
    unpublishSelectedRoute: useCallback(
      async (id: string) => {
        try {
          await mapDependencies.mapRoutesRepository.unpublish(id);
          mapDependencies.mapRoutesRepository.listMine().then((res) => {
            setSavedRoutes(res.items);
            setTotalSavedRoutesPages(res.totalPages);
          });
          showToast("Sucesso", "Rota privada.", "info");
        } catch {
          showToast("Erro", "Falha.", "error");
        }
      },
      [showToast],
    ),
    removeCheckpoint: useCallback((id: string) => {
      setCurrentRoute((prev) => ({
        ...prev,
        checkpoints: prev.checkpoints.filter((c) => c.id !== id),
      }));
    }, []),
    moveCheckpoint: useCallback((id: string, dir: number) => {
      setCurrentRoute((prev) => {
        const idx = prev.checkpoints.findIndex((c) => c.id === id);
        if (idx === -1) return prev;
        const nIdx = idx + dir;
        if (nIdx < 0 || nIdx >= prev.checkpoints.length) return prev;
        const next = [...prev.checkpoints];
        const [m] = next.splice(idx, 1);
        next.splice(nIdx, 0, m);
        return { ...prev, checkpoints: next };
      });
    }, []),
    updateCheckpointLabel: useCallback((id: string, label: string) => {
      setCurrentRoute((prev) => ({
        ...prev,
        checkpoints: prev.checkpoints.map((c) =>
          c.id === id ? { ...c, label } : c,
        ),
      }));
    }, []),
    removeCustomPin: useCallback((id: string) => {
      setCustomPins((prev) => {
        const next = prev.filter((p) => p.id !== id);
        appStorage.setItem("shinobi-map-custom-pins", JSON.stringify(next));
        return next;
      });
    }, []),
    routesView,
    setRoutesView: useCallback((v: "mine" | "public") => setRoutesView(v), []),
    routePath: useMemo(
      () => currentRoute.checkpoints.map((c) => `${c.x},${c.y}`).join(" "),
      [currentRoute.checkpoints],
    ),
    saveCurrentRoute,
    savedRoutes,
    searchQuery,
    sidebarSearchQuery,
    setSidebarSearchQuery: useCallback(
      (q: string) => setSidebarSearchQuery(q),
      [],
    ),
    selectCustomPin,
    startEditingCustomPin: useCallback(
      (id: string) => {
        const pin = customPins.find((p) => p.id === id);
        if (pin) {
          setDraftCustomPin({ ...pin });
          _setEditingCustomPinIdRef(id);
        }
      },
      [customPins, _setEditingCustomPinIdRef],
    ),
    selectOfficialPoint,
    selectedCustomPin:
      draftCustomPin ||
      customPins.find((p) => p.id === selectedCustomPinId) ||
      null,
    selectedCustomPinId,
    selectedLayers,
    selectedOfficialPoint:
      officialPoints.find((p) => p.id === selectedOfficialPointId) || null,
    selectedOfficialPointId,
    setSelectedOfficialPointId,
    selectedRegion,
    selectedSavedRouteId,
    selectedTypes,
    setPublicRoutesQuery: useCallback(
      (q: string) => setPublicRoutesQuery(q),
      [],
    ),
    setSearchQuery: useCallback((q: string) => {
      setSearchQuery(q);
      setPublicRoutesQuery(q);
      setSearchPage(1);
      setCustomPinsPage(1);
      setMineRoutesPage(1);
    }, []),
    setSelectedRegion: useCallback(
      (r: string | "all") => setSelectedRegion(r),
      [],
    ),
    setSidebarSection: useCallback(
      (s: "officialPins" | "customPins" | "routes" | "search") =>
        setSidebarSection(s),
      [],
    ),
    shareCurrentRoute: useCallback(() => {
      showToast("Copiado", "Link copiado.", "success");
    }, [showToast]),
    sidebarSection,
    toggleLayer: useCallback(
      (l: MapLayerId) =>
        setSelectedLayers((prev) =>
          prev.includes(l) ? prev.filter((i) => i !== l) : [...prev, l],
        ),
      [],
    ),
    toggleSelectedType: useCallback(
      (t: string) => {
        setSelectedTypes((prev) => {
          const isBaseType = markerTypes.includes(t as any);
          if (isBaseType) {
            const isSelecting = !prev.includes(t);
            if (isSelecting) {
              // Ao selecionar a base, não forçamos os sub-tipos, mas a lógica de filtro do mapa já os inclui automaticamente
              return [...prev, t];
            } else {
              // Ao deselecionar a base, removemos ela e TODOS os seus sub-tipos identificados
              return prev.filter((i) => i !== t && !i.startsWith(t + "_"));
            }
          }
          return prev.includes(t) ? prev.filter((i) => i !== t) : [...prev, t];
        });
      },
      [],
    ),
    toggleCustomPinVisibility: useCallback((id: string) => {
      setCustomPins((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, isHidden: !p.isHidden } : p));
        appStorage.setItem("shinobi-map-custom-pins", JSON.stringify(next));
        return next;
      });
    }, []),
    toggleRouteVisibility: useCallback((id: string) => {
      setVisibleRoutes((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
      );
    }, []),
    visibleRoutes,
    updateRouteField: useCallback(
      (f: keyof CustomRoute, v: string | string[] | number) =>
        setCurrentRoute((prev) => ({ ...prev, [f]: v })),
      [],
    ),
    updateSelectedPinField: useCallback(
      (f: keyof SavedCustomPin, v: string | string[] | boolean | number) => {
        if (draftCustomPin) setDraftCustomPin({ ...draftCustomPin, [f]: v });
      },
      [draftCustomPin],
    ),
    user,
    visibleCustomPins,
    visibleOfficialPoints,
    setSelectedCustomPinId,
    completedPins,
    togglePinCompleted,
    getPinTimerRemaining,
    globalTick,
    notificationSettings,
    updateNotificationSettings,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    requestPushPermission,
    mineRoutesPage,
    setMineRoutesPage,
    mapStats: currentStatsView,
    worldStats: useMemo(() => {
      const stats = {
        total_ores: 0,
        marked_ores: 0,
        total_mushrooms: 0,
        marked_mushrooms: 0,
        total_plants: 0,
        marked_plants: 0,
        total_sticks: 0,
        marked_sticks: 0,
      };
      officialPoints.forEach((p) => {
        const isM =
          !!completedPins[p.id] && completedPins[p.id].status !== "ready";
        if (p.type === "ore") {
          stats.total_ores++;
          if (isM) stats.marked_ores++;
        } else if (p.type === "mushroom") {
          stats.total_mushrooms++;
          if (isM) stats.marked_mushrooms++;
        } else if (
          ["perpetual", "hibiscus", "cotton", "borago"].includes(p.type)
        ) {
          stats.total_plants++;
          if (isM) stats.marked_plants++;
        } else if (p.type === "stick") {
          stats.total_sticks++;
          if (isM) stats.marked_sticks++;
        }
      });
      return stats;
    }, [officialPoints, completedPins]),
    statsPeriod,
    setStatsPeriod: useCallback((p: StatsPeriod) => setStatsPeriod(p), []),
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
    totalSavedRoutesPages,
    paginatedSavedRoutes: savedRoutes,
    addRouteResourcesToDailyStats,
    publicRoutesPage,
    setPublicRoutesPage,
    totalPublicRoutesPages,
    paginatedPublicRoutes: publicRoutes,
    customPinsPage,
    setCustomPinsPage,
    totalCustomPinsPages: Math.ceil(customPins.length / 10),
    paginatedCustomPins: useMemo(
      () => customPins.slice((customPinsPage - 1) * 10, customPinsPage * 10),
      [customPins, customPinsPage],
    ),
    searchHistory,
    addToHistory: useCallback((item: string) => {
      setSearchHistory((prev) => {
        const next = [item, ...prev.filter((i) => i !== item)].slice(0, 10);
        appStorage.setItem(
          "shinobi-map-search-history",
          JSON.stringify(next),
        );
        return next;
      });
    }, []),
    removeFromHistory: useCallback((item: string) => {
      setSearchHistory((prev) => {
        const next = prev.filter((i) => i !== item);
        appStorage.setItem(
          "shinobi-map-search-history",
          JSON.stringify(next),
        );
        return next;
      });
    }, []),
    clearHistory: useCallback(() => {
      setSearchHistory([]);
      appStorage.removeItem("shinobi-map-search-history");
    }, []),
    searchResults,
    paginatedSearchResults,
    searchPage,
    setSearchPage: useCallback((p: number) => setSearchPage(p), []),
    totalSearchPages,
    editingCustomPinId,
    setEditingCustomPinId: _setEditingCustomPinIdRef,
    confirmCustomPin,
    cancelCustomPin,
    referencedOfficialPointIds,
    referencedCustomPinIds,
    generateOptimizedRoute,
    isAutoRouteModalOpen,
    setIsAutoRouteModalOpen,
    showToast,
  };
}

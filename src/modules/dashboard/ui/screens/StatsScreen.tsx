import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  CalendarRange,
  Trophy,
  Trees,
  Flame,
  Target,
  Route,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
} from "lucide-react";
import {
  type MapCollectionStats,
  sumStats,
  createEmptyStats,
} from "../../../map/core/entities/MapStats.entity";
import {
  ORE_DEFINITIONS,
  MUSHROOM_DEFINITIONS,
  PLANT_DEFINITIONS,
  STICK_DEFINITIONS,
} from "../../../map/core/entities/ResourceDefinitions.entity";
import {
  calculateRawProfit,
  calculateCraftingProfit,
  ECONOMY_PRICES,
} from "../../../map/core/entities/Economy.entity";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/Select";

import { readSavedMapRoutes, writeSavedMapRoutes } from "../../../map/shared/utils/localMapRoutes";
import type { SavedMapRoute } from "../../../map/core/entities/MapRoute.entity";

const SL = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, #4a2f0a)' }} />
    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9a7a40' }}>
      {children}
    </span>
    <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #4a2f0a, transparent)' }} />
  </div>
)

export const StatsScreen = () => {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [dailyStats, setDailyStats] = useState<MapCollectionStats[]>([]);
  const [period, setPeriod] = useState<"today" | "monthly" | "total" | "routes">("today");
  const [savedRoutes, setSavedRoutes] = useState<SavedMapRoute[]>([]);
  const [expandedRoutes, setExpandedRoutes] = useState<string[]>([]);
  const [profitMode, setProfitMode] = useState<"raw" | "craft">("raw");
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("shinobi-map-stats-history");
      if (stored) {
        setDailyStats(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load stats history", e);
    }

    // Load routes
    const routes = readSavedMapRoutes();
    setSavedRoutes(routes);
  }, []);

  const handleUpdateResource = (itemId: string, delta: number) => {
    if (period !== 'today') return;

    setDailyStats(prev => {
      const todayStr = new Date().toISOString().split('T')[0]
      const next = [...prev]
      let todayIdx = next.findIndex(s => s.date === todayStr)
      if (todayIdx === -1) {
        if (delta <= 0) return next;
        next.push(createEmptyStats(todayStr));
        todayIdx = next.length - 1;
      }

      const today = { ...next[todayIdx] }
      let targetObj: Record<string, number> | undefined;
      let targetKey: 'ore_count' | 'mushroom_count' | 'plant_count' | 'stick_count' | null = null;

      if (itemId.startsWith('ore_')) { targetKey = 'ore_count'; targetObj = today.ore_count; }
      else if (itemId.startsWith('mushroom_')) { targetKey = 'mushroom_count'; targetObj = today.mushroom_count; }
      else if (['perpetual', 'hibiscus', 'cotton', 'borago'].includes(itemId)) { targetKey = 'plant_count'; targetObj = today.plant_count; }
      else if (itemId === 'stick') { targetKey = 'stick_count'; }

      if (targetKey === 'stick_count') {
        today.stick_count = Math.max(0, today.stick_count + delta);
      } else if (targetKey && targetObj) {
        const current = targetObj[itemId] || 0;
        const newVal = Math.max(0, current + delta);
        today[targetKey] = { ...targetObj, [itemId]: newVal };
      }

      next[todayIdx] = today
      localStorage.setItem('shinobi-map-stats-history', JSON.stringify(next))
      window.dispatchEvent(new CustomEvent('map-stats-updated', { detail: next }))

      return next
    })
  }

  const handleSetResource = (itemId: string, value: number) => {
    if (period !== 'today') return;

    setDailyStats(prev => {
      const todayStr = new Date().toISOString().split('T')[0]
      const next = [...prev]
      let todayIdx = next.findIndex(s => s.date === todayStr)
      if (todayIdx === -1) {
        if (value <= 0) return next;
        next.push(createEmptyStats(todayStr));
        todayIdx = next.length - 1;
      }

      const today = { ...next[todayIdx] }
      let targetObj: Record<string, number> | undefined;
      let targetKey: 'ore_count' | 'mushroom_count' | 'plant_count' | 'stick_count' | null = null;

      if (itemId.startsWith('ore_')) { targetKey = 'ore_count'; targetObj = today.ore_count; }
      else if (itemId.startsWith('mushroom_')) { targetKey = 'mushroom_count'; targetObj = today.mushroom_count; }
      else if (['perpetual', 'hibiscus', 'cotton', 'borago'].includes(itemId)) { targetKey = 'plant_count'; targetObj = today.plant_count; }
      else if (itemId === 'stick') { targetKey = 'stick_count'; }

      if (targetKey === 'stick_count') {
        today.stick_count = Math.max(0, value);
      } else if (targetKey && targetObj) {
        const newVal = Math.max(0, value);
        today[targetKey] = { ...targetObj, [itemId]: newVal };
      }

      next[todayIdx] = today
      localStorage.setItem('shinobi-map-stats-history', JSON.stringify(next))
      window.dispatchEvent(new CustomEvent('map-stats-updated', { detail: next }))

      return next
    })
  }

  const getDailyProfitData = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayResources: Record<string, number> = {
      ...stats.today.ore_count,
      ...stats.today.mushroom_count,
      ...stats.today.plant_count,
      stick: stats.today.stick_count || 0,
    };

    const dailyRoutesWithStats = savedRoutes.filter(
      (r) => r.route.routeStats && r.createdAt.split('T')[0] === todayStr
    );

    dailyRoutesWithStats.forEach(route => {
      const collected = route.route.routeStats!.collectedCounts || {};
      Object.entries(collected).forEach(([type, count]) => {
        todayResources[type] = (todayResources[type] || 0) + count;
      });
    });

    return profitMode === "raw" ? calculateRawProfit(todayResources) : calculateCraftingProfit(todayResources);
  };

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayStats =
      dailyStats.find((s) => s.date === todayStr) || createEmptyStats(todayStr);

    const nowRef = new Date()
    const thirtyDaysAgo = new Date(nowRef.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const monthlyList = dailyStats.filter(s => s.date !== "total" && s.date >= thirtyDaysAgo)
    const monthlyStats = sumStats(monthlyList)

    const totalStats = sumStats(dailyStats);

    return {
      today: todayStats,
      monthly: monthlyStats,
      total: totalStats,
    };
  }, [dailyStats]);

  const currentStats = period === "today" ? stats.today : (period === "monthly" ? stats.monthly : stats.total);

  // Aggregate totals
  const totalSticks = currentStats.stick_count || 0;

  const totalOres = useMemo(() => {
    return Object.values(currentStats.ore_count || {}).reduce(
      (acc, curr) => acc + curr,
      0,
    );
  }, [currentStats]);

  const totalMushrooms = useMemo(() => {
    return Object.values(currentStats.mushroom_count || {}).reduce(
      (acc, curr) => acc + curr,
      0,
    );
  }, [currentStats]);

  const totalPlants = useMemo(() => {
    return Object.values(currentStats.plant_count || {}).reduce(
      (acc, curr) => acc + curr,
      0,
    );
  }, [currentStats]);

  const grandTotal = totalSticks + totalOres + totalMushrooms + totalPlants;

  // Check if we have any stats at all
  const hasStats =
    dailyStats.length > 0 &&
    dailyStats.some(
      (s) =>
        s.stick_count > 0 ||
        Object.values(s.ore_count || {}).some((v) => v > 0) ||
        Object.values(s.mushroom_count || {}).some((v) => v > 0) ||
        Object.values(s.plant_count || {}).some((v) => v > 0),
    );

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ color: '#e8d5a0' }}>
      {/* Period Selector Tabs */}
      <div
        ref={tabsContainerRef}
        className="overflow-hidden p-0.5 rounded-[2px] mb-4 w-full"
        style={{ background: 'rgba(13,10,5,0.6)', border: '1px solid #4a2f0a' }}
      >
        <motion.div
          drag="x"
          dragConstraints={tabsContainerRef}
          className="flex flex-nowrap cursor-grab active:cursor-grabbing w-max"
        >
          <button
            onClick={() => setPeriod("today")}
            className="shrink-0 whitespace-nowrap px-3 py-1.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            style={
              period === "today"
                ? { background: 'rgba(74,47,10,0.5)', color: '#c8860a', border: '1px solid #4a2f0a' }
                : { color: '#9a7a40', border: '1px solid transparent' }
            }
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            Hoje
          </button>
          <button
            onClick={() => setPeriod("routes")}
            className="shrink-0 whitespace-nowrap px-3 py-1.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            style={
              period === "routes"
                ? { background: 'rgba(74,47,10,0.5)', color: '#c8860a', border: '1px solid #4a2f0a' }
                : { color: '#9a7a40', border: '1px solid transparent' }
            }
          >
            <Route className="w-3.5 h-3.5 shrink-0" />
            Por Rota
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className="shrink-0 whitespace-nowrap px-3 py-1.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            style={
              period === "monthly"
                ? { background: 'rgba(74,47,10,0.5)', color: '#c8860a', border: '1px solid #4a2f0a' }
                : { color: '#9a7a40', border: '1px solid transparent' }
            }
          >
            <CalendarRange className="w-3.5 h-3.5 shrink-0" />
            Mensal
          </button>
          <button
            onClick={() => setPeriod("total")}
            className="shrink-0 whitespace-nowrap px-3 py-1.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            style={
              period === "total"
                ? { background: 'rgba(74,47,10,0.5)', color: '#c8860a', border: '1px solid #4a2f0a' }
                : { color: '#9a7a40', border: '1px solid transparent' }
            }
          >
            <Trophy className="w-3.5 h-3.5 shrink-0" />
            Geral
          </button>
        </motion.div>
      </div>

      {period === "routes" ? (
        <div className="flex-1 flex flex-col overflow-y-auto pr-1 custom-scrollbar space-y-3">
          {(() => {
            const routesWithStats = savedRoutes.filter(r => r.route.routeStats);
            if (routesWithStats.length === 0) {
              return (
                <div
                  className="flex-1 flex flex-col justify-center items-center text-center p-6 border border-dashed border-[#4a2f0a] rounded-[2px]"
                  style={{ background: 'rgba(13,10,5,0.2)' }}
                >
                  <Route className="w-10 h-10 mb-2 opacity-35" style={{ color: '#9a7a40' }} />
                  <p className="text-xs font-semibold" style={{ color: '#c8a060' }}>Nenhuma rota com recursos</p>
                  <p className="text-[10px] mt-1 leading-normal max-w-xs" style={{ color: '#9a7a40' }}>Gere rotas otimizadas para ver as estatísticas esperadas por rota aqui.</p>
                </div>
              );
            }

            const activeRouteId = routesWithStats.some(r => r.id === selectedRouteId)
              ? selectedRouteId
              : routesWithStats[0].id;

            const activeRoute = routesWithStats.find(r => r.id === activeRouteId)!;

            return (
              <>
                <div className="sticky top-0 z-50 pb-2 pt-1" style={{ background: 'linear-gradient(180deg,#0d0a05 60%,transparent)' }}>
                  <Select value={activeRouteId} onValueChange={setSelectedRouteId}>
                    <SelectTrigger
                      className="w-full font-bold hover:opacity-90 transition-colors"
                      style={{ background: 'rgba(13,10,5,0.6)', borderColor: '#4a2f0a', color: '#c8860a' }}
                    >
                      <SelectValue placeholder="Selecione uma rota" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {routesWithStats.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div
                  className="border p-4 rounded-[2px] flex flex-col gap-4 mt-2"
                  style={{ background: 'rgba(13,10,5,0.5)', borderColor: '#4a2f0a' }}
                >
                  <div>
                    <h3 className="text-sm font-bold mb-1" style={{ color: '#c8860a' }}>{activeRoute.name}</h3>
                    <p className="text-[10px]" style={{ color: '#c8a060' }}>{activeRoute.route.routeStats!.totalPoints} pts de rota</p>
                  </div>

                  {(() => {
                    const expectedCounts = activeRoute.route.routeStats!.resourceCounts;
                    const collectedCounts = activeRoute.route.routeStats!.collectedCounts || {};
                    const hasCollected = Object.keys(collectedCounts).length > 0;

                    const activeCounts = hasCollected ? collectedCounts : expectedCounts;
                    const rawProfit = calculateRawProfit(activeCounts);
                    const craftProfit = calculateCraftingProfit(activeCounts);

                    return (
                      <>
                        {/* Comparativo de Lucro */}
                        <div className="flex flex-col gap-2">
                          <SL>
                            <CircleDollarSign size={12} style={{ color: '#9a7a40', display: 'inline', marginRight: 4 }} />
                            {hasCollected ? "Lucro Total Acumulado (Todas as Idas)" : "Comparativo de Lucro Estimado (1 Ida)"}
                          </SL>

                          <div className="grid grid-cols-2 gap-2">
                            <div
                              className="p-2.5 rounded-[2px] flex flex-col relative overflow-hidden group"
                              style={{ background: 'rgba(26,18,8,0.5)', border: '1px solid #4a2f0a' }}
                            >
                              <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                <CircleDollarSign size={40} />
                              </div>
                              <span className="text-[10px] font-bold mb-1 relative z-10" style={{ color: '#c8a060' }}>Vender Bruto</span>
                              <span className="text-lg font-black relative z-10" style={{ color: '#c8860a' }}>¥ {rawProfit.netProfit}</span>
                            </div>
                            <div className="bg-amber-950/20 p-2.5 rounded-[2px] flex flex-col border border-amber-500/20 relative overflow-hidden group">
                              <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                <Flame size={40} />
                              </div>
                              <span className="text-[10px] text-amber-500/80 font-bold mb-1 relative z-10">Fazer Lingote</span>
                              <span className="text-lg font-black text-amber-400 relative z-10">¥ {craftProfit.netProfit}</span>
                              {craftProfit.totalCost > 0 && <span className="text-[9px] text-red-400 mt-0.5 relative z-10">Custos: ¥ {craftProfit.totalCost}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Materiais Obtidos */}
                        <div className="flex flex-col gap-2 mt-2">
                          <SL>
                            <Target size={12} style={{ color: '#9a7a40', display: 'inline', marginRight: 4 }} />
                            {hasCollected ? "Materiais Coletados (Total Acumulado)" : "Materiais Esperados (1 Ida)"}
                          </SL>
                          <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                            {Object.entries(activeCounts).map(([type, count]) => {
                              const def = ORE_DEFINITIONS[type] || MUSHROOM_DEFINITIONS[type] || PLANT_DEFINITIONS[type];
                              const exp = expectedCounts[type] || 0;
                              return (
                                <div
                                  key={type}
                                  className="flex justify-between items-center p-2 rounded-[2px] text-xs"
                                  style={{ background: 'rgba(26,18,8,0.5)', border: '1px solid #4a2f0a' }}
                                >
                                  <span className="font-medium flex flex-col" style={{ color: '#e8d5a0' }}>
                                    {def ? def.name : type}
                                    {hasCollected && exp > 0 && (
                                      <span className="text-[9px] mt-0.5" style={{ color: '#9a7a40' }}>
                                        Base esperada: {exp}x por ida
                                      </span>
                                    )}
                                  </span>
                                  <span
                                    className="px-2 py-0.5 rounded-[2px] font-bold text-[10px]"
                                    style={
                                      hasCollected
                                        ? { background: 'rgba(45,110,45,0.2)', color: '#4caf50', border: '1px solid #2d6e2d' }
                                        : { background: 'rgba(74,47,10,0.4)', color: '#e8d5a0' }
                                    }
                                  >
                                    {count}x {hasCollected ? "Total" : ""}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </>
                    )
                  })()}

                </div>
              </>
            );
          })()}
        </div>
      ) : !hasStats ? (
        <div
          className="flex-1 flex flex-col justify-center items-center text-center p-6 border border-dashed border-[#4a2f0a] rounded-[2px]"
          style={{ background: 'rgba(13,10,5,0.2)' }}
        >
          <Trophy className="w-10 h-10 mb-2 opacity-35" style={{ color: '#9a7a40' }} />
          <p className="text-xs font-semibold" style={{ color: '#c8a060' }}>
            Nenhum recurso coletado
          </p>
          <p className="text-[10px] mt-1 leading-normal max-w-xs" style={{ color: '#9a7a40' }}>
            As estatísticas mostram os recursos que você coletou. Comece
            marcando recursos comuns ou raros no mapa para computá-los!
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-y-auto pr-1 custom-scrollbar">
          <div
            className="border p-4 rounded-[2px] flex flex-col gap-4 mt-2"
            style={{ background: 'rgba(13,10,5,0.5)', borderColor: '#4a2f0a' }}
          >
            {(() => {
              const flatCounts: Record<string, number> = {
                ...currentStats.ore_count,
                ...currentStats.mushroom_count,
                ...currentStats.plant_count,
              };
              if (currentStats.stick_count > 0) flatCounts.stick = currentStats.stick_count;

              const rawProfit = calculateRawProfit(flatCounts);
              const craftProfit = calculateCraftingProfit(flatCounts);
              const periodLabel = period === "today" ? "Hoje" : period === "monthly" ? "Mensal" : "Geral";

              return (
                <>
                  {/* Comparativo de Lucro */}
                  <div className="flex flex-col gap-2">
                    <SL>
                      <CircleDollarSign size={12} style={{ color: '#9a7a40', display: 'inline', marginRight: 4 }} />
                      Lucro Total Acumulado ({periodLabel})
                    </SL>

                    <div className="grid grid-cols-2 gap-2">
                      <div
                        className="p-2.5 rounded-[2px] flex flex-col relative overflow-hidden group"
                        style={{ background: 'rgba(26,18,8,0.5)', border: '1px solid #4a2f0a' }}
                      >
                        <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] group-hover:opacity-10 transition-opacity">
                          <CircleDollarSign size={40} />
                        </div>
                        <span className="text-[10px] font-bold mb-1 relative z-10" style={{ color: '#c8a060' }}>Vender Bruto</span>
                        <span className="text-lg font-black relative z-10" style={{ color: '#c8860a' }}>¥ {rawProfit.netProfit}</span>
                      </div>
                      <div className="bg-amber-950/20 p-2.5 rounded-[2px] flex flex-col border border-amber-500/20 relative overflow-hidden group">
                        <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] group-hover:opacity-10 transition-opacity">
                          <Flame size={40} />
                        </div>
                        <span className="text-[10px] text-amber-500/80 font-bold mb-1 relative z-10">Fazer Lingote</span>
                        <span className="text-lg font-black text-amber-400 relative z-10">¥ {craftProfit.netProfit}</span>
                        {craftProfit.totalCost > 0 && <span className="text-[9px] text-red-400 mt-0.5 relative z-10">Custos: ¥ {craftProfit.totalCost}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Materiais Obtidos */}
                  <div className="flex flex-col gap-2 mt-2">
                    <SL>
                      <Target size={12} style={{ color: '#9a7a40', display: 'inline', marginRight: 4 }} />
                      Materiais Coletados ({periodLabel})
                    </SL>
                    <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                      {Object.entries(flatCounts).filter(([_, count]) => count > 0).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                        const def = ORE_DEFINITIONS[type] || MUSHROOM_DEFINITIONS[type] || PLANT_DEFINITIONS[type] || STICK_DEFINITIONS[type];
                        return (
                          <div
                            key={type}
                            className="flex justify-between items-center p-2 rounded-[2px] text-xs"
                            style={{ background: 'rgba(26,18,8,0.5)', border: '1px solid #4a2f0a' }}
                          >
                            <span className="font-medium" style={{ color: '#e8d5a0' }}>
                              {def ? def.name : type}
                            </span>
                            <div className="flex items-center gap-2">
                              {period === 'today' && (type.startsWith('ore_') || type.startsWith('mushroom_') || ['perpetual', 'hibiscus', 'cotton', 'borago', 'stick'].includes(type)) ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateResource(type, -1)}
                                    disabled={count === 0}
                                    className="w-5 h-5 flex items-center justify-center rounded-[2px] disabled:opacity-30 disabled:cursor-not-allowed font-bold transition-colors"
                                    style={{ background: 'rgba(74,47,10,0.4)', color: '#9a7a40' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,47,10,0.7)'; (e.currentTarget as HTMLButtonElement).style.color = '#c8860a'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,47,10,0.4)'; (e.currentTarget as HTMLButtonElement).style.color = '#9a7a40'; }}
                                  >
                                    -
                                  </button>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      value={count}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        handleSetResource(type, val);
                                      }}
                                      className="px-1 py-0.5 rounded-[2px] font-bold text-[10px] w-12 text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      style={{ background: 'rgba(13,10,5,0.6)', color: '#e8d5a0', border: '1px solid #4a2f0a' }}
                                      onFocus={e => { e.currentTarget.style.borderColor = '#c8860a'; }}
                                      onBlur={e => { e.currentTarget.style.borderColor = '#4a2f0a'; }}
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleUpdateResource(type, 1)}
                                    className="w-5 h-5 flex items-center justify-center rounded-[2px] font-bold transition-colors"
                                    style={{ background: 'rgba(74,47,10,0.4)', color: '#9a7a40' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,47,10,0.7)'; (e.currentTarget as HTMLButtonElement).style.color = '#c8860a'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,47,10,0.4)'; (e.currentTarget as HTMLButtonElement).style.color = '#9a7a40'; }}
                                  >
                                    +
                                  </button>
                                </>
                              ) : (
                                <span
                                  className="px-2 py-0.5 rounded-[2px] font-bold text-[10px]"
                                  style={{ background: 'rgba(74,47,10,0.4)', color: '#e8d5a0' }}
                                >
                                  {count}x Total
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsScreen;

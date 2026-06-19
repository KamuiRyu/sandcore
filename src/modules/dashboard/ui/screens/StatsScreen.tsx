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

  const handleUpdateOre = (oreId: string, delta: number) => {
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
      if (!today.ore_count) today.ore_count = {}
      const current = today.ore_count[oreId] || 0
      const newVal = Math.max(0, current + delta)
      
      today.ore_count = { ...today.ore_count, [oreId]: newVal }
      next[todayIdx] = today
      
      localStorage.setItem('shinobi-map-stats-history', JSON.stringify(next))
      window.dispatchEvent(new CustomEvent('map-stats-updated', { detail: next }))
      
      return next
    })
  }

  const handleSetOre = (oreId: string, value: number) => {
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
      if (!today.ore_count) today.ore_count = {}
      const newVal = Math.max(0, value)
      
      today.ore_count = { ...today.ore_count, [oreId]: newVal }
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
    <div className="flex flex-col h-full overflow-hidden text-slate-200">
      {/* Title */}
      <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-1">
        <BarChart3 className="w-5 h-5 text-teal-400" />
        Estatísticas de Coleta
      </h2>
      <div className="h-[1px] bg-slate-800/60 w-full mb-3"></div>

      {/* Period Selector Tabs */}
      <div 
        ref={tabsContainerRef} 
        className="overflow-hidden bg-[#0F1319] border border-slate-800/80 p-0.5 rounded-xl mb-4 w-full"
      >
        <motion.div 
          drag="x"
          dragConstraints={tabsContainerRef}
          className="flex flex-nowrap cursor-grab active:cursor-grabbing w-max"
        >
          <button
            onClick={() => setPeriod("today")}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5
              ${
                period === "today"
                  ? "bg-[#1C2430] text-teal-400 border border-slate-700/50 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }
            `}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            Hoje
          </button>
          <button
            onClick={() => setPeriod("routes")}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5
              ${
                period === "routes"
                  ? "bg-[#1C2430] text-teal-400 border border-slate-700/50 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }
            `}
          >
            <Route className="w-3.5 h-3.5 shrink-0" />
            Por Rota
          </button>

          <button
            onClick={() => setPeriod("monthly")}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5
              ${
                period === "monthly"
                  ? "bg-[#1C2430] text-teal-400 border border-slate-700/50 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }
            `}
          >
            <CalendarRange className="w-3.5 h-3.5 shrink-0" />
            Mensal
          </button>
          <button
            onClick={() => setPeriod("total")}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5
              ${
                period === "total"
                  ? "bg-[#1C2430] text-teal-400 border border-slate-700/50 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }
            `}
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
                <div className="flex-1 flex flex-col justify-center items-center text-center p-6 border border-dashed border-slate-800 rounded-2xl bg-[#11161D]/20">
                  <Route className="w-10 h-10 text-slate-600 mb-2 opacity-35" />
                  <p className="text-xs font-semibold text-slate-400">Nenhuma rota com recursos</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal max-w-xs">Gere rotas otimizadas para ver as estatísticas esperadas por rota aqui.</p>
                </div>
              );
            }

            const activeRouteId = routesWithStats.some(r => r.id === selectedRouteId) 
              ? selectedRouteId 
              : routesWithStats[0].id;
              
            const activeRoute = routesWithStats.find(r => r.id === activeRouteId)!;

            return (
              <>
                <div className="sticky top-0 z-50 bg-[linear-gradient(180deg,#030a0d_60%,transparent)] pb-2 pt-1">
                  <Select value={activeRouteId} onValueChange={setSelectedRouteId}>
                    <SelectTrigger className="w-full bg-slate-800/80 border-slate-700 font-bold text-teal-400 hover:bg-slate-800 transition-colors">
                      <SelectValue placeholder="Selecione uma rota" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {routesWithStats.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-[#11161D] border border-slate-800/80 p-4 rounded-xl flex flex-col gap-4 mt-2">
                  <div>
                    <h3 className="text-sm font-bold text-teal-400 mb-1">{activeRoute.name}</h3>
                    <p className="text-[10px] text-slate-400">{activeRoute.route.routeStats!.totalPoints} pts de rota</p>
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
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <CircleDollarSign size={12} className="text-slate-400" /> 
                            {hasCollected ? "Lucro Total Acumulado (Todas as Idas)" : "Comparativo de Lucro Estimado (1 Ida)"}
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-800/30 p-2.5 rounded flex flex-col border border-slate-700/50 relative overflow-hidden group">
                              <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                <CircleDollarSign size={40} />
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold mb-1 relative z-10">Vender Bruto</span>
                              <span className="text-lg font-black text-teal-400 relative z-10">¥ {rawProfit.netProfit}</span>
                            </div>
                            <div className="bg-amber-950/20 p-2.5 rounded flex flex-col border border-amber-500/20 relative overflow-hidden group">
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
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Target size={12} className="text-slate-400" /> 
                            {hasCollected ? "Materiais Coletados (Total Acumulado)" : "Materiais Esperados (1 Ida)"}
                          </h4>
                          <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                            {Object.entries(activeCounts).map(([type, count]) => {
                              const def = ORE_DEFINITIONS[type] || MUSHROOM_DEFINITIONS[type] || PLANT_DEFINITIONS[type];
                              const exp = expectedCounts[type] || 0;
                              return (
                                <div key={type} className="flex justify-between items-center bg-slate-800/20 border border-slate-800/50 p-2 rounded-lg text-xs">
                                  <span className="text-slate-300 font-medium flex flex-col">
                                    {def ? def.name : type}
                                    {hasCollected && exp > 0 && <span className="text-slate-500 text-[9px] mt-0.5">Base esperada: {exp}x por ida</span>}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${hasCollected ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-300"}`}>
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
        <div className="flex-1 flex flex-col justify-center items-center text-center p-6 border border-dashed border-slate-800 rounded-2xl bg-[#11161D]/20">
          <Trophy className="w-10 h-10 text-slate-600 mb-2 opacity-35" />
          <p className="text-xs font-semibold text-slate-400">
            Nenhum recurso coletado
          </p>
          <p className="text-[10px] text-slate-500 mt-1 leading-normal max-w-xs">
            As estatísticas mostram os recursos que você coletou. Comece
            marcando recursos comuns ou raros no mapa para computá-los!
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1 custom-scrollbar space-y-4">
          {period === "today" && (
            <>
              <div className="flex bg-[#11161D] rounded-xl p-1 border border-slate-800/80 shrink-0">
                <button
                  onClick={() => setProfitMode("raw")}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-colors ${
                    profitMode === "raw" ? "bg-teal-500/20 text-teal-400" : "text-slate-400 hover:bg-slate-800/50"
                  }`}
                >
                  Vender Bruto
                </button>
                <button
                  onClick={() => setProfitMode("craft")}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-colors ${
                    profitMode === "craft" ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:bg-slate-800/50"
                  }`}
                >
                  Fazer Lingotes
                </button>
              </div>

              {(() => {
                const profitData = getDailyProfitData();
                return (
                  <div className="bg-[#11161D] border border-slate-800/80 p-3 rounded-xl flex flex-col gap-2 shrink-0">
                    <h3 className="text-xs font-bold text-slate-300">Resumo Financeiro (Hoje)</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-800/50 p-2 rounded flex flex-col">
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest">Receita Bruta</span>
                        <span className="text-base font-black text-teal-400">¥ {profitData.grossRevenue}</span>
                      </div>
                      <div className="bg-slate-800/50 p-2 rounded flex flex-col">
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest">Custos</span>
                        <span className="text-base font-black text-red-400">¥ {profitData.totalCost}</span>
                      </div>
                      <div className="bg-slate-800/80 p-2 rounded flex flex-col col-span-2 border border-teal-500/20">
                        <span className="text-[9px] text-teal-500 uppercase tracking-widest font-bold">Lucro Líquido</span>
                        <span className="text-xl font-black text-teal-400">¥ {profitData.netProfit}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {/* Overview Stats Cards Grid */}
          <div className="grid grid-cols-3 gap-2 shrink-0">
            <div className="bg-[#11161D] border border-slate-800/80 p-2.5 rounded-xl flex flex-col justify-between relative overflow-hidden">
              <span className="text-[8px] uppercase font-mono tracking-widest text-slate-500">
                Total
              </span>
              <span className="text-xl font-black text-teal-400 mt-1">
                {grandTotal}
              </span>
              <div className="absolute right-[-8px] bottom-[-8px] opacity-5 text-teal-400">
                <Target size={36} />
              </div>
            </div>
            <div className="bg-[#11161D] border border-slate-800/80 p-2.5 rounded-xl flex flex-col justify-between relative overflow-hidden">
              <span className="text-[8px] uppercase font-mono tracking-widest text-slate-500">
                Minérios
              </span>
              <span className="text-xl font-black text-amber-500 mt-1">
                {totalOres}
              </span>
              <div className="absolute right-[-8px] bottom-[-8px] opacity-5 text-amber-500">
                <Flame size={36} />
              </div>
            </div>
            <div className="bg-[#11161D] border border-slate-800/80 p-2.5 rounded-xl flex flex-col justify-between relative overflow-hidden">
              <span className="text-[8px] uppercase font-mono tracking-widest text-slate-500">
                Cogumelos
              </span>
              <span className="text-xl font-black text-emerald-400 mt-1">
                {totalMushrooms}
              </span>
              <div className="absolute right-[-8px] bottom-[-8px] opacity-5 text-emerald-400">
                <Trees size={36} />
              </div>
            </div>
          </div>

          {/* Detailed Resource Sections */}
          <div className="space-y-3">
            {/* Ores (Minérios) */}
            {totalOres > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-bold ml-1 flex items-center gap-1.5">
                  <span className="w-1 h-2 rounded bg-amber-500"></span>
                  Minérios
                </h3>
                <div className="space-y-1">
                  {Object.entries(ORE_DEFINITIONS).map(([id, def]) => {
                    const count = currentStats.ore_count[id] || 0;
                    if (count === 0) return null;
                    return (
                      <div key={id} className="flex justify-between items-center bg-[#11161D]/75 border border-slate-800/50 p-2 rounded-lg text-xs group">
                        <span className="text-slate-300 font-medium">{def.name}</span>
                        
                        <div className="flex items-center gap-2">
                          {period === 'today' ? (
                            <>
                              <button 
                                onClick={() => handleUpdateOre(id, -1)}
                                disabled={count === 0}
                                className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                                    handleSetOre(id, val);
                                  }}
                                  className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded font-bold text-[10px] w-12 text-center outline-none focus:border-amber-400/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                              <button 
                                onClick={() => handleUpdateOre(id, 1)}
                                className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                              >
                                +
                              </button>
                            </>
                          ) : (
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold text-[10px] min-w-[32px] text-center">
                              {count}x
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mushrooms (Cogumelos) */}
            {totalMushrooms > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-bold ml-1 flex items-center gap-1.5">
                  <span className="w-1 h-2 rounded bg-emerald-500"></span>
                  Cogumelos
                </h3>
                <div className="space-y-1">
                  {Object.entries(MUSHROOM_DEFINITIONS).map(([id, def]) => {
                    const count = currentStats.mushroom_count[id] || 0;
                    if (count === 0) return null;
                    return (
                      <div
                        key={id}
                        className="flex justify-between items-center bg-[#11161D]/75 border border-slate-800/50 p-2 rounded-lg text-xs"
                      >
                        <span className="text-slate-300 font-medium">
                          {def.name}
                        </span>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold text-[10px]">
                          {count}x
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Plants (Plantas) */}
            {totalPlants > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-bold ml-1 flex items-center gap-1.5">
                  <span className="w-1 h-2 rounded bg-teal-500"></span>
                  Plantas
                </h3>
                <div className="space-y-1">
                  {Object.entries(PLANT_DEFINITIONS).map(([id, def]) => {
                    const count = currentStats.plant_count[id] || 0;
                    if (count === 0) return null;
                    return (
                      <div
                        key={id}
                        className="flex justify-between items-center bg-[#11161D]/75 border border-slate-800/50 p-2 rounded-lg text-xs"
                      >
                        <span className="text-slate-300 font-medium">
                          {def.name}
                        </span>
                        <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded font-bold text-[10px]">
                          {count}x
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sticks (Galhos) */}
            {totalSticks > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-bold ml-1 flex items-center gap-1.5">
                  <span className="w-1 h-2 rounded bg-slate-500"></span>
                  Outros
                </h3>
                <div className="flex justify-between items-center bg-[#11161D]/75 border border-slate-800/50 p-2 rounded-lg text-xs">
                  <span className="text-slate-300 font-medium">Gravetos</span>
                  <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded font-bold text-[10px]">
                    {totalSticks}x
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsScreen;

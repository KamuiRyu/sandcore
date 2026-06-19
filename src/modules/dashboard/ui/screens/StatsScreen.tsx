import { useState, useEffect, useMemo } from "react";
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

import { readSavedMapRoutes, writeSavedMapRoutes } from "../../../map/shared/utils/localMapRoutes";
import type { SavedMapRoute } from "../../../map/core/entities/MapRoute.entity";

export const StatsScreen = () => {
  const [dailyStats, setDailyStats] = useState<MapCollectionStats[]>([]);
  const [period, setPeriod] = useState<"today" | "monthly" | "total" | "routes">("today");
  const [savedRoutes, setSavedRoutes] = useState<SavedMapRoute[]>([]);
  const [expandedRoutes, setExpandedRoutes] = useState<string[]>([]);

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

  const handleUpdateRouteStat = (routeId: string, type: string, delta: number) => {
    setSavedRoutes(prev => {
      const next = [...prev];
      const routeIdx = next.findIndex(r => r.id === routeId);
      if (routeIdx === -1) return prev;
      
      const route = JSON.parse(JSON.stringify(next[routeIdx])); // deep copy
      if (!route.route.routeStats) return prev;
      if (!route.route.routeStats.collectedCounts) {
        route.route.routeStats.collectedCounts = {};
      }
      
      const currentVal = route.route.routeStats.collectedCounts[type] || 0;
      const expectedVal = route.route.routeStats.resourceCounts[type] || 0;
      const newVal = Math.max(0, Math.min(expectedVal, currentVal + delta)); // limit to 0-expectedVal
      
      route.route.routeStats.collectedCounts[type] = newVal;
      next[routeIdx] = route;
      
      writeSavedMapRoutes(next);
      return next;
    });
  };

  const handleSetRouteStat = (routeId: string, type: string, value: number) => {
    setSavedRoutes(prev => {
      const next = [...prev];
      const routeIdx = next.findIndex(r => r.id === routeId);
      if (routeIdx === -1) return prev;
      
      const route = JSON.parse(JSON.stringify(next[routeIdx])); // deep copy
      if (!route.route.routeStats) return prev;
      if (!route.route.routeStats.collectedCounts) {
        route.route.routeStats.collectedCounts = {};
      }
      
      const expectedVal = route.route.routeStats.resourceCounts[type] || 0;
      const newVal = Math.max(0, Math.min(expectedVal, value)); // limit to 0-expectedVal
      
      route.route.routeStats.collectedCounts[type] = newVal;
      next[routeIdx] = route;
      
      writeSavedMapRoutes(next);
      return next;
    });
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
      <div className="flex bg-[#0F1319] border border-slate-800/80 p-0.5 rounded-xl mb-4 self-start">
        <button
          onClick={() => setPeriod("today")}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5
            ${
              period === "today"
                ? "bg-[#1C2430] text-teal-400 border border-slate-700/50 shadow-sm"
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }
          `}
        >
          <Calendar className="w-3.5 h-3.5" />
          Hoje
        </button>
        <button
          onClick={() => setPeriod("routes")}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5
            ${
              period === "routes"
                ? "bg-[#1C2430] text-teal-400 border border-slate-700/50 shadow-sm"
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }
          `}
        >
          <Route className="w-3.5 h-3.5" />
          Por Rota
        </button>
        <button
          onClick={() => setPeriod("monthly")}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5
            ${
              period === "monthly"
                ? "bg-[#1C2430] text-teal-400 border border-slate-700/50 shadow-sm"
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }
          `}
        >
          <CalendarRange className="w-3.5 h-3.5" />
          Mensal
        </button>
        <button
          onClick={() => setPeriod("total")}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5
            ${
              period === "total"
                ? "bg-[#1C2430] text-teal-400 border border-slate-700/50 shadow-sm"
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }
          `}
        >
          <Trophy className="w-3.5 h-3.5" />
          Geral
        </button>
      </div>

      {period === "routes" ? (
        <div className="flex-1 flex flex-col overflow-y-auto pr-1 custom-scrollbar space-y-3">
          {(() => {
            const todayStr = new Date().toISOString().split('T')[0];
            const dailyRoutesWithStats = savedRoutes.filter(
              (r) => r.route.routeStats && r.createdAt.split('T')[0] === todayStr
            );

            if (dailyRoutesWithStats.length === 0) {
              return (
                <div className="flex-1 flex flex-col justify-center items-center text-center p-6 border border-dashed border-slate-800 rounded-2xl bg-[#11161D]/20">
                  <Route className="w-10 h-10 text-slate-600 mb-2 opacity-35" />
                  <p className="text-xs font-semibold text-slate-400">Nenhuma rota gerada hoje</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal max-w-xs">Gere rotas otimizadas hoje para ver as estatísticas esperadas por rota aqui.</p>
                </div>
              );
            }

            return dailyRoutesWithStats.map((route) => {
              const isExpanded = expandedRoutes.includes(route.id);
              
              return (
                <div key={route.id} className="bg-[#11161D] border border-slate-800/80 p-3 rounded-xl flex flex-col relative overflow-hidden">
                  <div 
                    className="flex justify-between items-start cursor-pointer group"
                    onClick={() => {
                      setExpandedRoutes(prev => 
                        prev.includes(route.id) ? prev.filter(id => id !== route.id) : [...prev, route.id]
                      );
                    }}
                  >
                    <div>
                      <h3 className="text-sm font-bold text-teal-400 mb-1 group-hover:text-teal-300 transition-colors">{route.name}</h3>
                      <p className="text-[10px] text-slate-400 mb-2">{route.description || "Sem descrição"}</p>
                    </div>
                    <button className="text-slate-500 group-hover:text-slate-300 transition-colors p-1">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                  
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-800/50">
                          <span className="bg-slate-800/80 text-slate-300 px-2 py-1 rounded text-[10px] font-bold self-start mb-1">Total: {route.route.routeStats!.totalPoints} pts</span>
                          <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                            {Object.entries(route.route.routeStats!.resourceCounts).map(([type, expectedCount]) => {
                               const def = ORE_DEFINITIONS[type] || MUSHROOM_DEFINITIONS[type] || PLANT_DEFINITIONS[type];
                               const collectedCount = route.route.routeStats!.collectedCounts?.[type] || 0;
                               return (
                                 <div key={type} className="flex justify-between items-center bg-[#11161D]/75 border border-slate-700/50 p-2 rounded-lg text-xs group">
                                   <span className="text-slate-300 font-medium">
                                     {def ? def.name : type} <span className="text-slate-500 ml-1">(de {expectedCount}x)</span>
                                   </span>
                                   
                                   <div className="flex items-center gap-2">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleUpdateRouteStat(route.id, type, -1); }}
                                        disabled={collectedCount === 0}
                                        className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      >
                                        -
                                      </button>
                                      <div className="relative">
                                        <input
                                          type="number"
                                          min="0"
                                          max={expectedCount}
                                          value={collectedCount}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            handleSetRouteStat(route.id, type, val);
                                          }}
                                          className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-1 py-0.5 rounded font-bold text-[10px] w-12 text-center outline-none focus:border-teal-400/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                      </div>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleUpdateRouteStat(route.id, type, 1); }}
                                        disabled={collectedCount >= expectedCount}
                                        className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      >
                                        +
                                      </button>
                                   </div>
                                 </div>
                               )
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            });
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
          {/* Overview Stats Cards Grid */}
          <div className="grid grid-cols-3 gap-2">
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

import { useState, useEffect, useMemo, useRef } from "react";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
import { motion } from "framer-motion";
import {
  Calendar,
  CalendarRange,
  Trophy,
  Flame,
  Target,
  Route,
  CircleDollarSign,
  Plus,
  Minus
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
} from "../../../map/core/entities/Economy.entity";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/Select";

import { readSavedMapRoutes } from "../../../map/shared/utils/localMapRoutes";
import type { SavedMapRoute } from "../../../map/core/entities/MapRoute.entity";
import { appStorage } from "../../../../lib/storage";

const SL = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-2">
    <span style={{ color: '#c8a030', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>[</span>
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c8a030', whiteSpace: 'nowrap' }}>
      {children}
    </span>
    <div className="flex-1" style={{ borderTop: '1px dashed rgba(200,160,48,0.25)' }} />
    <span style={{ color: '#c8a030', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>]</span>
  </div>
)

const TechCard = ({ children, style, subtle = false }: { children: React.ReactNode, style?: React.CSSProperties, subtle?: boolean }) => (
  <div style={{ background: subtle ? 'rgba(74,47,10,0.1)' : 'rgba(13,10,4,0.7)', border: '1px solid #3a2508', borderRadius: 3, padding: '12px', position: 'relative', overflow: 'hidden', ...style }}>
    {!subtle && <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: 'linear-gradient(180deg,#c8860a,#7a4e08)' }} />}
    <div style={{ position: 'absolute', top: 6, left: 6, width: 10, height: 10, borderTop: '1px solid #c8860a', borderLeft: '1px solid #c8860a' }} />
    <div style={{ position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderTop: '1px solid #c8860a', borderRight: '1px solid #c8860a' }} />
    <div style={{ position: 'absolute', bottom: 6, left: 6, width: 10, height: 10, borderBottom: '1px solid #c8860a', borderLeft: '1px solid #c8860a' }} />
    <div style={{ position: 'absolute', bottom: 6, right: 6, width: 10, height: 10, borderBottom: '1px solid #c8860a', borderRight: '1px solid #c8860a' }} />
    <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
  </div>
)

const ListContainer = ({ children }: { children: React.ReactNode }) => (
  <div style={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #2e1e06' }}>
    {children}
  </div>
)

const ListItem = ({ children, isLast = false, vertical = false }: { children: React.ReactNode, isLast?: boolean, vertical?: boolean }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: vertical ? 'column' : 'row',
      alignItems: vertical ? 'stretch' : 'center',
      justifyContent: vertical ? 'flex-start' : 'space-between',
      padding: '8px 12px',
      fontSize: 10,
      background: 'rgba(13,10,4,0.8)',
      borderBottom: isLast ? 'none' : '1px solid rgba(46,30,6,0.7)',
      gap: vertical ? 8 : 12
    }}
  >
    {children}
  </div>
)

const SecondaryButton = ({ children, onClick, disabled = false, padding = '4px 10px', active = false }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, padding?: string, active?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding,
      borderRadius: 3, background: active ? 'rgba(74,47,10,0.25)' : 'transparent', border: '1px solid #2e1e06', color: active ? '#e8c860' : '#c8a840',
      fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.08em',
      cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
      whiteSpace: 'nowrap', borderColor: active ? '#6a4e18' : '#2e1e06'
    }}
    onMouseEnter={e => { if(!disabled) { e.currentTarget.style.background = 'rgba(74,47,10,0.25)'; e.currentTarget.style.borderColor = '#6a4e18'; e.currentTarget.style.color = '#e8c860'; } }}
    onMouseLeave={e => { if(!disabled && !active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#2e1e06'; e.currentTarget.style.color = '#c8a840'; } }}
  >
    {children}
  </button>
)

export const StatsScreen = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [dailyStats, setDailyStats] = useState<MapCollectionStats[]>([]);
  const [period, setPeriod] = useState<"today" | "monthly" | "total" | "routes">("today");
  const [savedRoutes, setSavedRoutes] = useState<SavedMapRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");

  useEffect(() => {
    try {
      const stored = appStorage.getItem("shinobi-map-stats-history");
      if (stored) {
        setDailyStats(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load stats history", e);
    }
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
      appStorage.setItem('shinobi-map-stats-history', JSON.stringify(next))
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
      appStorage.setItem('shinobi-map-stats-history', JSON.stringify(next))
      window.dispatchEvent(new CustomEvent('map-stats-updated', { detail: next }))
      return next
    })
  }

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayStats = dailyStats.find((s) => s.date === todayStr) || createEmptyStats(todayStr);
    const nowRef = new Date()
    const thirtyDaysAgo = new Date(nowRef.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const monthlyList = dailyStats.filter(s => s.date !== "total" && s.date >= thirtyDaysAgo)
    const monthlyStats = sumStats(monthlyList)
    const totalStats = sumStats(dailyStats);
    return { today: todayStats, monthly: monthlyStats, total: totalStats };
  }, [dailyStats]);

  const currentStats = period === "today" ? stats.today : (period === "monthly" ? stats.monthly : stats.total);

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
      {/* Sub-tab nav */}
      <div
        className="flex rounded-[2px] p-0.5 mb-4 flex-none"
        style={{ border: '1px solid #2e1e06', WebkitAppRegion: 'no-drag' } as any}
      >
        <button
          onClick={() => setPeriod('today')}
          className="flex-1 py-1.5 rounded-[2px] text-[9px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
          style={period === 'today'
            ? { background: 'linear-gradient(135deg,#b87a08,#e8a820)', color: '#0a0800', border: 'none', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }
            : { background: 'transparent', color: '#c8a840', border: '1px solid transparent', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }
          }
        >
          <Calendar size={11} /> HOJE
        </button>
        <button
          onClick={() => setPeriod('routes')}
          className="flex-1 py-1.5 rounded-[2px] text-[9px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
          style={period === 'routes'
            ? { background: 'linear-gradient(135deg,#b87a08,#e8a820)', color: '#0a0800', border: 'none', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }
            : { background: 'transparent', color: '#c8a840', border: '1px solid transparent', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }
          }
        >
          <Route size={11} /> ROTAS
        </button>
        <button
          onClick={() => setPeriod('monthly')}
          className="flex-1 py-1.5 rounded-[2px] text-[9px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
          style={period === 'monthly'
            ? { background: 'linear-gradient(135deg,#b87a08,#e8a820)', color: '#0a0800', border: 'none', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }
            : { background: 'transparent', color: '#c8a840', border: '1px solid transparent', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }
          }
        >
          <CalendarRange size={11} /> MÊS
        </button>
        <button
          onClick={() => setPeriod('total')}
          className="flex-1 py-1.5 rounded-[2px] text-[9px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
          style={period === 'total'
            ? { background: 'linear-gradient(135deg,#b87a08,#e8a820)', color: '#0a0800', border: 'none', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }
            : { background: 'transparent', color: '#c8a840', border: '1px solid transparent', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }
          }
        >
          <Trophy size={11} /> TOTAL
        </button>
      </div>

      {period === "routes" ? (
        <div className="flex-1 flex flex-col overflow-y-auto pr-1 custom-scrollbar space-y-3">
          {(() => {
            const routesWithStats = savedRoutes.filter(r => r.route.routeStats);
            if (routesWithStats.length === 0) {
              return (
                <div
                  className="flex-1 flex flex-col justify-center items-center text-center p-6 border border-dashed rounded-[2px]"
                  style={{ borderColor: '#2e1e06', background: 'rgba(13,10,4,0.8)' }}
                >
                  <Route className="w-10 h-10 mb-2 opacity-35" style={{ color: '#c8a030' }} />
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
                      style={{ background: 'rgba(13,10,4,0.8)', border: '1px solid #2e1e06', color: '#c8860a' }}
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

                <div className="flex flex-col gap-4 mt-2">
                  <div className="px-2">
                    <h3 className="text-sm font-bold mb-1" style={{ color: '#c8860a', fontFamily: "'Cinzel', serif" }}>{activeRoute.name}</h3>
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
                        <div className="flex flex-col gap-2">
                          <SL>
                            <CircleDollarSign size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {hasCollected ? "Lucro Acumulado" : "Lucro Estimado (1 Ida)"}
                          </SL>

                          <div className="grid grid-cols-2 gap-2">
                            <TechCard subtle>
                              <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03]">
                                <CircleDollarSign size={40} />
                              </div>
                              <span className="text-[10px] font-bold mb-1 relative z-10" style={{ color: '#c8a060' }}>Vender Bruto</span>
                              <span className="text-lg font-black relative z-10 block mt-1" style={{ color: '#c8860a', fontFamily: "'JetBrains Mono', monospace" }}>¥ {rawProfit.netProfit.toLocaleString()}</span>
                            </TechCard>
                            <TechCard style={{ background: 'rgba(255,100,0,0.05)', borderColor: 'rgba(255,100,0,0.2)' }}>
                              <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03]">
                                <Flame size={40} color="#ff6600" />
                              </div>
                              <span className="text-[10px] font-bold mb-1 relative z-10 text-amber-500/80">Fazer Lingote</span>
                              <span className="text-lg font-black text-amber-400 relative z-10 block mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>¥ {craftProfit.netProfit.toLocaleString()}</span>
                              {craftProfit.totalCost > 0 && <span className="text-[9px] text-red-400 mt-0.5 relative z-10 block">Custos: ¥ {craftProfit.totalCost}</span>}
                            </TechCard>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-2">
                          <SL>
                            <Target size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {hasCollected ? "Materiais Coletados" : "Materiais Esperados"}
                          </SL>
                          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            <ListContainer>
                              {Object.entries(activeCounts).map(([type, count], idx, arr) => {
                                const def = ORE_DEFINITIONS[type] || MUSHROOM_DEFINITIONS[type] || PLANT_DEFINITIONS[type];
                                const exp = expectedCounts[type] || 0;
                                return (
                                  <ListItem key={type} isLast={idx === arr.length - 1}>
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
                                          ? { background: 'rgba(45,110,45,0.2)', color: '#4caf50', border: '1px solid #2d6e2d', fontFamily: "'JetBrains Mono', monospace" }
                                          : { background: 'rgba(74,47,10,0.4)', color: '#e8d5a0', fontFamily: "'JetBrains Mono', monospace" }
                                      }
                                    >
                                      {count}x {hasCollected ? "Total" : ""}
                                    </span>
                                  </ListItem>
                                )
                              })}
                            </ListContainer>
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
          className="flex-1 flex flex-col justify-center items-center text-center p-6 border border-dashed rounded-[2px]"
          style={{ borderColor: '#2e1e06', background: 'rgba(13,10,4,0.8)' }}
        >
          <Trophy className="w-10 h-10 mb-2 opacity-30" style={{ color: '#c8a030' }} />
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
          <div className="flex flex-col gap-4 mt-2">
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
                  <div className="flex flex-col gap-2">
                    <SL>
                      <CircleDollarSign size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Lucro Acumulado ({periodLabel})
                    </SL>

                    <div className="grid grid-cols-2 gap-2">
                      <TechCard subtle>
                        <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03]">
                          <CircleDollarSign size={40} />
                        </div>
                        <span className="text-[10px] font-bold mb-1 relative z-10" style={{ color: '#c8a060' }}>Vender Bruto</span>
                        <span className="text-lg font-black relative z-10 block mt-1" style={{ color: '#c8860a', fontFamily: "'JetBrains Mono', monospace" }}>¥ {rawProfit.netProfit.toLocaleString()}</span>
                      </TechCard>
                      <TechCard style={{ background: 'rgba(255,100,0,0.05)', borderColor: 'rgba(255,100,0,0.2)' }}>
                        <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03]">
                          <Flame size={40} color="#ff6600" />
                        </div>
                        <span className="text-[10px] text-amber-500/80 font-bold mb-1 relative z-10">Fazer Lingote</span>
                        <span className="text-lg font-black text-amber-400 relative z-10 block mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>¥ {craftProfit.netProfit.toLocaleString()}</span>
                        {craftProfit.totalCost > 0 && <span className="text-[9px] text-red-400 mt-0.5 relative z-10 block">Custos: ¥ {craftProfit.totalCost}</span>}
                      </TechCard>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <SL>
                      <Target size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Materiais Coletados ({periodLabel})
                    </SL>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      <ListContainer>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        {Object.entries(flatCounts).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]).map(([type, count], idx, arr) => {
                          const def = ORE_DEFINITIONS[type] || MUSHROOM_DEFINITIONS[type] || PLANT_DEFINITIONS[type] || STICK_DEFINITIONS[type];
                          return (
                            <ListItem key={type} isLast={idx === arr.length - 1}>
                              <span className="font-medium" style={{ color: '#e8d5a0' }}>
                                {def ? def.name : type}
                              </span>
                              <div className="flex items-center gap-2">
                                {period === 'today' && (type.startsWith('ore_') || type.startsWith('mushroom_') || ['perpetual', 'hibiscus', 'cotton', 'borago', 'stick'].includes(type)) ? (
                                  <>
                                    <SecondaryButton
                                      onClick={() => handleUpdateResource(type, -1)}
                                      disabled={count === 0}
                                      padding="4px"
                                    >
                                      <Minus size={12} />
                                    </SecondaryButton>
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
                                        style={{ background: 'rgba(13,10,4,0.8)', color: '#e8d5a0', border: '1px solid #2e1e06', fontFamily: "'JetBrains Mono', monospace" }}
                                        onFocus={e => { e.currentTarget.style.borderColor = '#c8860a'; }}
                                        onBlur={e => { e.currentTarget.style.borderColor = '#4a2f0a'; }}
                                      />
                                    </div>
                                    <SecondaryButton
                                      onClick={() => handleUpdateResource(type, 1)}
                                      padding="4px"
                                    >
                                      <Plus size={12} />
                                    </SecondaryButton>
                                  </>
                                ) : (
                                  <span
                                    className="px-2 py-0.5 rounded-[2px] font-bold text-[10px]"
                                    style={{ background: 'rgba(74,47,10,0.4)', color: '#e8d5a0', fontFamily: "'JetBrains Mono', monospace" }}
                                  >
                                    {count}x Total
                                  </span>
                                )}
                              </div>
                            </ListItem>
                          )
                        })}
                      </ListContainer>
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

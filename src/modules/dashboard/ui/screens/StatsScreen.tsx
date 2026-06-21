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
import {
  ParchSection, ParchCard, ParchRowList, ParchRow,
  ParchSecondaryBtn, GoldenBox, P,
} from "../../../../components/ui/ParchmentUI";

import { readSavedMapRoutes } from "../../../map/shared/utils/localMapRoutes";
import type { SavedMapRoute } from "../../../map/core/entities/MapRoute.entity";
import { appStorage } from "../../../../lib/storage";

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
    <div className="flex flex-col h-full overflow-hidden" style={{ color: P.darkBrown }}>
      {/* Sub-tab nav */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 12, flexShrink: 0,
        padding: 4, borderRadius: 6,
        background: P.subtleBg, boxShadow: `inset 0 0 0 1px ${P.border}`,
      }}>
        {([
          { key: 'today', icon: <Calendar size={10} />, label: 'HOJE' },
          { key: 'routes', icon: <Route size={10} />, label: 'ROTAS' },
          { key: 'monthly', icon: <CalendarRange size={10} />, label: 'MÊS' },
          { key: 'total', icon: <Trophy size={10} />, label: 'TOTAL' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setPeriod(tab.key)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 4, padding: '5px 2px', borderRadius: 4, border: 'none',
              fontFamily: P.fontLabel, fontWeight: 700, fontSize: 9, letterSpacing: '0.1em',
              cursor: 'pointer', transition: 'all .15s',
              background: period === tab.key ? P.gold : 'transparent',
              boxShadow: period === tab.key ? P.goldShadow : 'none',
              color: period === tab.key ? P.teal : P.darkBrown,
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {period === "routes" ? (
        <div className="flex-1 flex flex-col overflow-y-auto pr-1 custom-scrollbar space-y-3">
          {(() => {
            const routesWithStats = savedRoutes.filter(r => r.route.routeStats);
            if (routesWithStats.length === 0) {
              return (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  alignItems: 'center', textAlign: 'center', padding: '24px 16px',
                  border: `1.5px dashed ${P.dashed}`, borderRadius: 6, background: P.subtleBg,
                }}>
                  <Route style={{ color: P.darkBrown, opacity: 0.3, width: 32, height: 32 }} />
                  <p style={{ fontFamily: P.fontLabel, fontWeight: 700, fontSize: 11, color: P.darkBrown, marginTop: 10 }}>Nenhuma rota com recursos</p>
                  <p style={{ fontFamily: P.fontValue, fontSize: 10, color: '#7a5030', marginTop: 4 }}>Gere rotas otimizadas para ver as estatísticas esperadas por rota aqui.</p>
                </div>
              );
            }

            const activeRouteId = routesWithStats.some(r => r.id === selectedRouteId)
              ? selectedRouteId
              : routesWithStats[0].id;
            const activeRoute = routesWithStats.find(r => r.id === activeRouteId)!;

            return (
              <>
                <div className="sticky top-0 z-50 pb-2 pt-1" style={{ background: 'linear-gradient(180deg,#e3cd9e 60%,transparent)' }}>
                  <Select value={activeRouteId} onValueChange={setSelectedRouteId}>
                    <SelectTrigger
                      className="w-full font-bold hover:opacity-90 transition-colors"
                      style={{ background: P.subtleBg, border: `1px solid ${P.border}`, color: P.darkBrown, fontFamily: P.fontLabel }}
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
                  <div className="px-1">
                    <h3 style={{ fontFamily: P.fontLabel, fontWeight: 900, fontSize: 13, color: P.darkBrown, marginBottom: 2 }}>{activeRoute.name}</h3>
                    <p style={{ fontFamily: P.fontValue, fontSize: 10, color: '#7a5030' }}>{activeRoute.route.routeStats!.totalPoints} pts de rota</p>
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
                          <ParchSection>
                            <CircleDollarSign size={11} style={{ display: 'inline', marginRight: 4 }} />
                            {hasCollected ? "Lucro Acumulado" : "Lucro Estimado (1 Ida)"}
                          </ParchSection>
                          <div className="grid grid-cols-2 gap-2">
                            <ParchCard accent="linear-gradient(180deg,#5a341a,#3a2010)">
                              <p style={{ fontFamily: P.fontLabel, fontSize: 9, color: P.darkBrown, marginBottom: 6, letterSpacing: '0.08em' }}>VENDER BRUTO</p>
                              <GoldenBox style={{ textAlign: 'center', fontSize: 14, fontWeight: 900 }}>¥ {rawProfit.netProfit.toLocaleString()}</GoldenBox>
                            </ParchCard>
                            <ParchCard accent="linear-gradient(180deg,#7a4800,#4a2800)">
                              <p style={{ fontFamily: P.fontLabel, fontSize: 9, color: P.darkBrown, marginBottom: 6, letterSpacing: '0.08em' }}>
                                <Flame size={9} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />FAZER LINGOTE
                              </p>
                              <GoldenBox style={{ textAlign: 'center', fontSize: 14, fontWeight: 900 }}>¥ {craftProfit.netProfit.toLocaleString()}</GoldenBox>
                              {craftProfit.totalCost > 0 && <p style={{ fontFamily: P.fontValue, fontSize: 9, color: '#8a3030', marginTop: 4 }}>Custos: ¥ {craftProfit.totalCost}</p>}
                            </ParchCard>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                          <ParchSection>
                            <Target size={11} style={{ display: 'inline', marginRight: 4 }} />
                            {hasCollected ? "Materiais Coletados" : "Materiais Esperados"}
                          </ParchSection>
                          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            <ParchRowList>
                              {Object.entries(activeCounts).map(([type, count], idx, arr) => {
                                const def = ORE_DEFINITIONS[type] || MUSHROOM_DEFINITIONS[type] || PLANT_DEFINITIONS[type];
                                const exp = expectedCounts[type] || 0;
                                return (
                                  <ParchRow key={type} isLast={idx === arr.length - 1}>
                                    <span style={{ fontFamily: P.fontValue, fontSize: 11, color: P.darkBrown }}>
                                      {def ? def.name : type}
                                      {hasCollected && exp > 0 && (
                                        <span style={{ display: 'block', fontSize: 9, color: '#7a5030', marginTop: 2 }}>Base: {exp}x / ida</span>
                                      )}
                                    </span>
                                    <GoldenBox style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>
                                      {count}{hasCollected ? ' Total' : 'x'}
                                    </GoldenBox>
                                  </ParchRow>
                                )
                              })}
                            </ParchRowList>
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
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center', textAlign: 'center', padding: '24px 16px',
          border: `1.5px dashed ${P.dashed}`, borderRadius: 6, background: P.subtleBg,
        }}>
          <Trophy style={{ color: P.darkBrown, opacity: 0.3, width: 32, height: 32 }} />
          <p style={{ fontFamily: P.fontLabel, fontWeight: 700, fontSize: 11, color: P.darkBrown, marginTop: 10 }}>Nenhum recurso coletado</p>
          <p style={{ fontFamily: P.fontValue, fontSize: 10, color: '#7a5030', marginTop: 4, maxWidth: 220 }}>Marque recursos no mapa para computar suas estatísticas de coleta.</p>
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
                    <ParchSection>
                      <CircleDollarSign size={11} style={{ display: 'inline', marginRight: 4 }} />
                      Lucro Acumulado ({periodLabel})
                    </ParchSection>
                    <div className="grid grid-cols-2 gap-2">
                      <ParchCard accent="linear-gradient(180deg,#5a341a,#3a2010)">
                        <p style={{ fontFamily: P.fontLabel, fontSize: 9, color: P.darkBrown, marginBottom: 6, letterSpacing: '0.08em' }}>VENDER BRUTO</p>
                        <GoldenBox style={{ textAlign: 'center', fontSize: 14, fontWeight: 900 }}>¥ {rawProfit.netProfit.toLocaleString()}</GoldenBox>
                      </ParchCard>
                      <ParchCard accent="linear-gradient(180deg,#7a4800,#4a2800)">
                        <p style={{ fontFamily: P.fontLabel, fontSize: 9, color: P.darkBrown, marginBottom: 6, letterSpacing: '0.08em' }}>
                          <Flame size={9} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />FAZER LINGOTE
                        </p>
                        <GoldenBox style={{ textAlign: 'center', fontSize: 14, fontWeight: 900 }}>¥ {craftProfit.netProfit.toLocaleString()}</GoldenBox>
                        {craftProfit.totalCost > 0 && <p style={{ fontFamily: P.fontValue, fontSize: 9, color: '#8a3030', marginTop: 4 }}>Custos: ¥ {craftProfit.totalCost}</p>}
                      </ParchCard>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    <ParchSection>
                      <Target size={11} style={{ display: 'inline', marginRight: 4 }} />
                      Materiais Coletados ({periodLabel})
                    </ParchSection>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      <ParchRowList>
                        {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
                        {Object.entries(flatCounts).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]).map(([type, count], idx, arr) => {
                          const def = ORE_DEFINITIONS[type] || MUSHROOM_DEFINITIONS[type] || PLANT_DEFINITIONS[type] || STICK_DEFINITIONS[type];
                          return (
                            <ParchRow key={type} isLast={idx === arr.length - 1}>
                              <span style={{ fontFamily: P.fontValue, fontSize: 11, color: P.darkBrown }}>
                                {def ? def.name : type}
                              </span>
                              <div className="flex items-center gap-2">
                                {period === 'today' && (type.startsWith('ore_') || type.startsWith('mushroom_') || ['perpetual', 'hibiscus', 'cotton', 'borago', 'stick'].includes(type)) ? (
                                  <>
                                    <ParchSecondaryBtn onClick={() => handleUpdateResource(type, -1)} disabled={count === 0} padding="3px 6px">
                                      <Minus size={10} />
                                    </ParchSecondaryBtn>
                                    <input
                                      type="number" min="0" value={count}
                                      onChange={(e) => handleSetResource(type, parseInt(e.target.value) || 0)}
                                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      style={{
                                        width: 40, textAlign: 'center', borderRadius: 4,
                                        border: `1px solid ${P.border}`,
                                        background: P.gold, boxShadow: P.goldShadow,
                                        color: P.teal, fontFamily: P.fontValue, fontWeight: 700, fontSize: 11,
                                        padding: '3px 2px', outline: 'none',
                                      }}
                                    />
                                    <ParchSecondaryBtn onClick={() => handleUpdateResource(type, 1)} padding="3px 6px">
                                      <Plus size={10} />
                                    </ParchSecondaryBtn>
                                  </>
                                ) : (
                                  <GoldenBox style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>
                                    {count}x Total
                                  </GoldenBox>
                                )}
                              </div>
                            </ParchRow>
                          )
                        })}
                      </ParchRowList>
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

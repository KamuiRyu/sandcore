import { useState, useMemo } from "react";
import {
  Hammer,
  Plus,
  Minus,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Calculator,
  RefreshCw,
  ChevronRight,
  Layers,
  Coins,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  ECONOMY_PRICES,
  CRAFTING_RECIPES,
} from "../../../map/core/entities/Economy.entity";
import { RESOURCE_DEFINITIONS } from "../../../map/core/entities/ResourceDefinitions.entity";
import {
  Select,
  SelectContent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/Select";
import {
  ParchSection, ParchCard, ParchRowList, ParchRow,
  ParchPrimaryBtn, ParchSecondaryBtn, GoldenBox, P,
} from "../../../../components/ui/ParchmentUI";

type CraftingTarget = { itemId: string; quantity: number };

function calculateRequirements(targets: CraftingTarget[]) {
  const requirements: Record<string, number> = {};
  const craftedItems: Record<string, number> = {};
  const addRequirement = (id: string, qty: number) => { requirements[id] = (requirements[id] || 0) + qty };
  const resolveIngredients = (targetId: string, quantity: number) => {
    const recipe = CRAFTING_RECIPES.find((r) => r.resultId === targetId);
    if (recipe) {
      const timesToCraft = Math.ceil(quantity / recipe.quantityProduced);
      craftedItems[targetId] = (craftedItems[targetId] || 0) + timesToCraft * recipe.quantityProduced;
      for (const ingredient of recipe.ingredients) resolveIngredients(ingredient.itemId, ingredient.quantity * timesToCraft);
    } else { addRequirement(targetId, quantity) }
  };
  for (const target of targets) { if (target.quantity > 0) resolveIngredients(target.itemId, target.quantity) }
  return { requirements, craftedItems };
}

export function CraftingScreen() {
  const [targets, setTargets] = useState<CraftingTarget[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [useInventory, setUseInventory] = useState(false);
  const [inventory, setInventory] = useState<Record<string, number>>({});

  const craftableItems = useMemo(() => {
    const ids = new Set(CRAFTING_RECIPES.map((r) => r.resultId));
    return Object.values(ECONOMY_PRICES).filter((item) => ids.has(item.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const handleAddTarget = () => {
    if (!selectedItemId) return;
    setTargets((prev) => {
      const existing = prev.find((t) => t.itemId === selectedItemId);
      if (existing) return prev.map((t) => t.itemId === selectedItemId ? { ...t, quantity: t.quantity + 1 } : t);
      return [...prev, { itemId: selectedItemId, quantity: 1 }];
    });
  };

  const handleUpdateTarget = (itemId: string, delta: number) => {
    setTargets((prev) => prev.map((t) => t.itemId === itemId ? { ...t, quantity: Math.max(0, t.quantity + delta) } : t).filter((t) => t.quantity > 0));
  };

  const handleSetTarget = (itemId: string, quantity: number) => {
    setTargets((prev) => prev.map((t) => t.itemId === itemId ? { ...t, quantity: Math.max(0, quantity) } : t).filter((t) => t.quantity > 0));
  };

  const handleSetInventory = (itemId: string, quantity: number) => {
    setInventory((prev) => ({ ...prev, [itemId]: quantity }));
  };

  const { requirements, craftedItems } = useMemo(() => calculateRequirements(targets), [targets]);

  const totalCost = useMemo(() => {
    return Object.entries(requirements).reduce((sum, [id, qty]) => {
      const price = ECONOMY_PRICES[id]?.buyPrice || 0;
      const owned = useInventory ? inventory[id] || 0 : 0;
      return sum + Math.max(0, qty - owned) * price;
    }, 0);
  }, [requirements, useInventory, inventory]);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ color: P.darkBrown }}>
      {/* Input Bar */}
      <div className="flex flex-col mb-4 flex-none">
        <ParchCard style={{ padding: 8 }}>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger
                  className="w-full h-9 rounded font-medium hover:opacity-90 transition-colors text-xs"
                  style={{ background: P.subtleBg, border: `1px solid ${P.border}`, color: P.darkBrown, fontFamily: P.fontLabel }}
                >
                  <SelectValue placeholder="O que deseja fabricar?" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {craftableItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ParchPrimaryBtn onClick={handleAddTarget} disabled={!selectedItemId} padding="9px 14px">
              <Plus size={14} strokeWidth={3} /> ADICIONAR
            </ParchPrimaryBtn>
            <button
              onClick={() => setTargets([])}
              disabled={targets.length === 0}
              style={{
                flexShrink: 0, width: 36, height: 36, borderRadius: 4, cursor: 'pointer',
                background: 'rgba(120,20,20,.08)', border: '1px solid rgba(160,40,40,.3)', color: '#c05050',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
                opacity: targets.length === 0 ? 0.3 : 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(120,20,20,.25)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(120,20,20,.08)' }}
              title="Limpar Metas"
            >
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </ParchCard>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-4 pb-4">
        {/* Targets */}
        <div className="flex flex-col flex-none">
          <ParchSection>Metas Adicionadas</ParchSection>
          {targets.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 8px', gap: 8, opacity: 0.6 }}>
              <div style={{ width: 48, height: 48, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.subtleBg, boxShadow: `inset 0 0 0 1px ${P.border}` }}>
                <Hammer size={20} style={{ color: P.darkBrown }} />
              </div>
              <p style={{ fontFamily: P.fontValue, fontSize: 11, color: '#7a5030' }}>Nenhuma meta definida</p>
            </div>
          ) : (
            <ParchRowList>
              {targets.map((target, idx) => {
                const item = ECONOMY_PRICES[target.itemId];
                return (
                  <ParchRow key={target.itemId} isLast={idx === targets.length - 1}>
                    <span style={{ fontFamily: P.fontValue, fontWeight: 700, fontSize: 11, color: P.darkBrown }}>{item?.name || target.itemId}</span>
                    <div className="flex items-center gap-1">
                      <ParchSecondaryBtn onClick={() => handleUpdateTarget(target.itemId, -1)} padding="4px"><Minus size={12} strokeWidth={2.5} /></ParchSecondaryBtn>
                      <input
                        type="number" min="0" value={target.quantity}
                        onChange={(e) => handleSetTarget(target.itemId, parseInt(e.target.value) || 0)}
                        className="w-10 text-center font-bold text-sm tabular-nums bg-transparent border-none outline-none focus:ring-0 p-0 m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        style={{ color: P.teal, fontFamily: P.fontValue }}
                      />
                      <ParchSecondaryBtn onClick={() => handleUpdateTarget(target.itemId, 1)} padding="4px"><Plus size={12} strokeWidth={2.5} /></ParchSecondaryBtn>
                    </div>
                  </ParchRow>
                );
              })}
            </ParchRowList>
          )}
        </div>

        {targets.length > 0 && (
          <div className="flex flex-col gap-4 flex-none">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <ParchSection>Lista de Compras</ParchSection>
                <ParchSecondaryBtn active={useInventory} onClick={() => setUseInventory(!useInventory)}>
                  {useInventory ? <CheckSquare size={10} /> : <Square size={10} />}
                  ABATER ESTOQUE
                </ParchSecondaryBtn>
              </div>

              {Object.keys(requirements).length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 8px', gap: 8, opacity: 0.6 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.subtleBg, boxShadow: `inset 0 0 0 1px ${P.border}` }}>
                    <Layers size={20} style={{ color: P.darkBrown }} />
                  </div>
                  <p style={{ fontFamily: P.fontValue, fontSize: 11, color: '#7a5030' }}>Sem materiais pendentes</p>
                </div>
              ) : (
                <ParchRowList>
                  {Object.entries(requirements).map(([id, qty], idx, arr) => {
                    const item = ECONOMY_PRICES[id];
                    const icon = RESOURCE_DEFINITIONS[id]?.iconId;
                    const price = item?.buyPrice || 0;
                    const owned = inventory[id] || 0;
                    const needed = useInventory ? Math.max(0, qty - owned) : qty;
                    const totalLineCost = needed * price;
                    return (
                      <ParchRow key={id} isLast={idx === arr.length - 1} vertical>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 24, height: 24, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.subtleBg, boxShadow: `inset 0 0 0 1px ${P.border}` }}>
                              {icon ? (
                                <img src={`./images/markers/${icon}.webp`} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none' }} />
                              ) : (
                                <Layers size={12} style={{ color: P.darkBrown }} />
                              )}
                            </div>
                            <span style={{ fontFamily: P.fontValue, fontWeight: 700, fontSize: 11, color: P.darkBrown }}>{item?.name || id}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{
                              fontFamily: P.fontValue, fontWeight: 900, fontSize: 13, color: P.teal,
                              ...(useInventory && needed < qty ? { textDecoration: 'line-through', opacity: 0.4, fontSize: 11 } : {}),
                            }}>
                              {qty}x
                            </span>
                            {useInventory && needed < qty && (
                              <span style={{ fontFamily: P.fontValue, fontWeight: 900, fontSize: 13, color: P.teal }}>{needed}x</span>
                            )}
                            {price > 0 && (
                              <GoldenBox style={{ fontSize: 10, padding: '2px 8px', minWidth: 60, textAlign: 'right' }}>
                                {totalLineCost} ¥
                              </GoldenBox>
                            )}
                          </div>
                        </div>
                        {useInventory && (
                          <div style={{ marginTop: 6, paddingTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', borderTop: `1px dashed ${P.dashed}` }}>
                            <span style={{ fontFamily: P.fontLabel, fontSize: 9, color: '#7a5030', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Quantidade em Estoque:</span>
                            <input
                              type="number" min="0"
                              value={inventory[id] === undefined ? '' : inventory[id]}
                              onChange={(e) => handleSetInventory(id, parseInt(e.target.value) || 0)}
                              placeholder="0"
                              style={{
                                width: 64, height: 22, textAlign: 'center', fontFamily: P.fontValue,
                                fontWeight: 700, fontSize: 11, borderRadius: 4, outline: 'none',
                                background: P.subtleBg, border: `1px solid ${P.border}`, color: P.darkBrown,
                              }}
                              className="[&::-webkit-inner-spin-button]:appearance-none"
                              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(90,55,20,.55)' }}
                              onBlur={e => { e.currentTarget.style.borderColor = P.border }}
                            />
                          </div>
                        )}
                      </ParchRow>
                    );
                  })}
                </ParchRowList>
              )}

              {Object.keys(craftedItems).length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1.5px dashed ${P.dashed}` }}>
                  <h4 style={{ fontFamily: P.fontLabel, fontSize: 9, color: '#7a5030', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <ChevronRight size={10} /> Etapas Intermediárias (Sub-Crafts)
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(craftedItems).map(([id, qty]) => {
                      const item = ECONOMY_PRICES[id];
                      return (
                        <div key={id} style={{
                          fontSize: 10, padding: '3px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 5,
                          background: P.subtleBg, boxShadow: `inset 0 0 0 1px ${P.border}`, color: P.darkBrown,
                          fontFamily: P.fontValue,
                        }}>
                          <span style={{ fontWeight: 900, color: P.teal }}>{qty}x</span>
                          {item?.name || id}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <ParchCard accent="linear-gradient(180deg,#5a341a,#3a2010)">
              <div style={{ position: 'absolute', top: 0, right: 0, padding: 12, opacity: 0.05, pointerEvents: 'none' }}>
                <Coins size={48} style={{ color: P.darkBrown }} />
              </div>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                  <p style={{ fontFamily: P.fontLabel, fontSize: 9, color: '#7a5030', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <Coins size={12} /> Custo Total
                  </p>
                  <p style={{ fontFamily: P.fontValue, fontSize: 9, color: '#7a5030' }}>Comprando matérias-primas</p>
                </div>
                <GoldenBox style={{ fontSize: 22, fontWeight: 900, letterSpacing: '0.03em' }}>
                  {totalCost.toLocaleString()} <span style={{ fontSize: 10, fontWeight: 700 }}>¥</span>
                </GoldenBox>
              </div>
            </ParchCard>
          </div>
        )}
      </div>
    </div>
  );
}

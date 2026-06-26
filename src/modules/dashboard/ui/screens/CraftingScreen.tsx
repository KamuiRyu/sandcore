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

type CraftingTarget = {
  itemId: string;
  quantity: number;
};

// Calculate all required materials recursively
function calculateRequirements(targets: CraftingTarget[]) {
  const requirements: Record<string, number> = {};
  const craftedItems: Record<string, number> = {};

  const addRequirement = (id: string, qty: number) => {
    requirements[id] = (requirements[id] || 0) + qty;
  };

  const resolveIngredients = (targetId: string, quantity: number) => {
    const recipe = CRAFTING_RECIPES.find((r) => r.resultId === targetId);

    if (recipe) {
      const timesToCraft = Math.ceil(quantity / recipe.quantityProduced);
      craftedItems[targetId] =
        (craftedItems[targetId] || 0) + timesToCraft * recipe.quantityProduced;

      for (const ingredient of recipe.ingredients) {
        resolveIngredients(
          ingredient.itemId,
          ingredient.quantity * timesToCraft,
        );
      }
    } else {
      addRequirement(targetId, quantity);
    }
  };

  for (const target of targets) {
    if (target.quantity > 0) {
      resolveIngredients(target.itemId, target.quantity);
    }
  }

  return { requirements, craftedItems };
}

const SL = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-2">
    <span style={{ color: '#c8a030', fontSize: 10, fontFamily: "'Orbitron', sans-serif" }}>[</span>
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Orbitron', sans-serif", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c8a030', whiteSpace: 'nowrap' }}>
      {children}
    </span>
    <div className="flex-1" style={{ borderTop: '1px dashed rgba(200,160,48,0.25)' }} />
    <span style={{ color: '#c8a030', fontSize: 10, fontFamily: "'Orbitron', sans-serif" }}>]</span>
  </div>
);

const TechCard = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => (
  <div style={{ background: 'rgba(8,8,8,0.7)', border: '1px solid #3a2508', borderRadius: 3, padding: '14px', position: 'relative', overflow: 'hidden', ...style }}>
    <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: 'linear-gradient(180deg,#c8860a,#7a4e08)' }} />
    <div style={{ position: 'absolute', top: 6, left: 6, width: 10, height: 10, borderTop: '1px solid #c8860a', borderLeft: '1px solid #c8860a' }} />
    <div style={{ position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderTop: '1px solid #c8860a', borderRight: '1px solid #c8860a' }} />
    <div style={{ position: 'absolute', bottom: 6, left: 6, width: 10, height: 10, borderBottom: '1px solid #c8860a', borderLeft: '1px solid #c8860a' }} />
    <div style={{ position: 'absolute', bottom: 6, right: 6, width: 10, height: 10, borderBottom: '1px solid #c8860a', borderRight: '1px solid #c8860a' }} />
    <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
  </div>
);

const ListContainer = ({ children }: { children: React.ReactNode }) => (
  <div style={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #1e1e1e' }}>
    {children}
  </div>
);

const ListItem = ({ children, isLast = false, vertical = false }: { children: React.ReactNode, isLast?: boolean, vertical?: boolean }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: vertical ? 'column' : 'row',
      alignItems: vertical ? 'stretch' : 'center',
      justifyContent: vertical ? 'flex-start' : 'space-between',
      padding: '8px 12px',
      fontSize: 10,
      background: 'rgba(8,8,8,0.8)',
      borderBottom: isLast ? 'none' : '1px solid rgba(30,30,30,0.7)',
      gap: vertical ? 8 : 12
    }}
  >
    {children}
  </div>
);

const PrimaryButton = ({ children, onClick, disabled = false, padding = '5px 12px' }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, padding?: string }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', gap: 6, padding, borderRadius: 3,
      background: 'linear-gradient(135deg,#b87a08,#e8a820)', color: '#0a0800', border: 'none',
      fontWeight: 700, fontSize: 9, fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em',
      cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: disabled ? 0.5 : 1
    }}
  >
    {children}
  </button>
);

const SecondaryButton = ({ children, onClick, disabled = false, padding = '4px 10px', active = false }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, padding?: string, active?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding,
      borderRadius: 3, background: active ? 'rgba(40,40,40,0.25)' : 'transparent', border: '1px solid #1e1e1e', color: active ? '#e8c860' : '#c8a840',
      fontSize: 9, fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: '0.08em',
      cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
      whiteSpace: 'nowrap', borderColor: active ? '#6a4e18' : '#1e1e1e'
    }}
    onMouseEnter={e => { if(!disabled) { e.currentTarget.style.background = 'rgba(40,40,40,0.25)'; e.currentTarget.style.borderColor = '#6a4e18'; e.currentTarget.style.color = '#e8c860'; } }}
    onMouseLeave={e => { if(!disabled && !active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#c8a840'; } }}
  >
    {children}
  </button>
);

export function CraftingScreen() {
  const [targets, setTargets] = useState<CraftingTarget[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [useInventory, setUseInventory] = useState(false);
  const [inventory, setInventory] = useState<Record<string, number>>({});

  const craftableItems = useMemo(() => {
    const ids = new Set(CRAFTING_RECIPES.map((r) => r.resultId));
    return Object.values(ECONOMY_PRICES)
      .filter((item) => ids.has(item.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const handleAddTarget = () => {
    if (!selectedItemId) return;

    setTargets((prev) => {
      const existing = prev.find((t) => t.itemId === selectedItemId);
      if (existing) {
        return prev.map((t) =>
          t.itemId === selectedItemId ? { ...t, quantity: t.quantity + 1 } : t,
        );
      }
      return [...prev, { itemId: selectedItemId, quantity: 1 }];
    });
  };

  const handleUpdateTarget = (itemId: string, delta: number) => {
    setTargets((prev) => {
      return prev
        .map((t) => {
          if (t.itemId === itemId) {
            return { ...t, quantity: Math.max(0, t.quantity + delta) };
          }
          return t;
        })
        .filter((t) => t.quantity > 0);
    });
  };

  const handleSetTarget = (itemId: string, quantity: number) => {
    setTargets((prev) => {
      return prev
        .map((t) => {
          if (t.itemId === itemId) {
            return { ...t, quantity: Math.max(0, quantity) };
          }
          return t;
        })
        .filter((t) => t.quantity > 0);
    });
  };

  const handleClear = () => {
    setTargets([]);
  };

  const handleSetInventory = (itemId: string, quantity: number) => {
    setInventory((prev) => ({ ...prev, [itemId]: quantity }));
  };

  const { requirements, craftedItems } = useMemo(
    () => calculateRequirements(targets),
    [targets],
  );

  const totalCost = useMemo(() => {
    return Object.entries(requirements).reduce((sum, [id, qty]) => {
      const price = ECONOMY_PRICES[id]?.buyPrice || 0;
      const owned = useInventory ? inventory[id] || 0 : 0;
      const needed = Math.max(0, qty - owned);
      return sum + needed * price;
    }, 0);
  }, [requirements, useInventory, inventory]);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ color: "#e8d5a0" }}
    >
      {/* Header & Controls */}
      <div className="flex flex-col mb-4 flex-none">
        {/* Top Input Bar */}
        <TechCard style={{ padding: '8px' }}>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger
                  className="w-full h-9 rounded-[2px] font-medium hover:opacity-90 transition-colors text-xs"
                  style={{
                    background: "rgba(8,8,8,0.8)",
                    border: "1px solid #1e1e1e",
                    color: "#c8860a",
                  }}
                >
                  <SelectValue placeholder="O que deseja fabricar?" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {craftableItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <PrimaryButton onClick={handleAddTarget} disabled={!selectedItemId} padding="9px 14px">
              <Plus size={14} strokeWidth={3} /> ADICIONAR
            </PrimaryButton>
            <button
              onClick={handleClear}
              disabled={targets.length === 0}
              className="flex-none flex items-center justify-center w-9 h-9 rounded-[2px] transition-all disabled:opacity-30 disabled:cursor-not-allowed group shadow-sm"
              style={{
                background: "rgba(120,20,20,0.2)",
                border: "1px solid #7a1414",
                color: "#e07070",
              }}
              title="Limpar Metas"
            >
              <RefreshCw
                size={14}
                className="group-hover:rotate-180 transition-transform duration-500"
              />
            </button>
          </div>
        </TechCard>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 flex flex-col gap-4 pb-4">
        {/* Targets Section */}
        <div className="flex flex-col flex-none">
          <SL>Metas Adicionadas</SL>

          {targets.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-4 gap-3 opacity-60"
              style={{ color: "#9a7a40" }}
            >
              <div
                className="w-12 h-12 rounded-[2px] flex items-center justify-center"
                style={{
                  background: "rgba(8,8,8,0.8)",
                  border: "1px solid #1e1e1e",
                }}
              >
                <Hammer size={20} style={{ color: "#c8a060" }} />
              </div>
              <p className="text-xs font-medium tracking-wide">
                Nenhuma meta definida
              </p>
            </div>
          ) : (
            <ListContainer>
              {targets.map((target, idx) => {
                const item = ECONOMY_PRICES[target.itemId];
                return (
                  <ListItem key={target.itemId} isLast={idx === targets.length - 1}>
                    <span
                      className="font-bold text-xs tracking-wide"
                      style={{ color: "#e8d5a0" }}
                    >
                      {item?.name || target.itemId}
                    </span>
                    <div className="flex items-center gap-1">
                      <SecondaryButton onClick={() => handleUpdateTarget(target.itemId, -1)} padding="4px">
                        <Minus size={12} strokeWidth={2.5} />
                      </SecondaryButton>
                      <div className="w-10 flex justify-center">
                        <input
                          type="number"
                          min="0"
                          value={target.quantity}
                          onChange={(e) =>
                            handleSetTarget(
                              target.itemId,
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-full text-center font-bold text-sm tabular-nums bg-transparent border-none outline-none focus:ring-0 p-0 m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          style={{ color: "#c8860a", fontFamily: "'Orbitron', sans-serif" }}
                        />
                      </div>
                      <SecondaryButton onClick={() => handleUpdateTarget(target.itemId, 1)} padding="4px">
                        <Plus size={12} strokeWidth={2.5} />
                      </SecondaryButton>
                    </div>
                  </ListItem>
                );
              })}
            </ListContainer>
          )}
        </div>

        {/* Requirements Section */}
        {targets.length > 0 && (
          <div className="flex flex-col gap-4 flex-none">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <SL>Lista de Compras</SL>
                <SecondaryButton active={useInventory} onClick={() => setUseInventory(!useInventory)}>
                  {useInventory ? <CheckSquare size={10} /> : <Square size={10} />}
                  ABATER ESTOQUE
                </SecondaryButton>
              </div>

              {Object.keys(requirements).length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-4 gap-3 opacity-60"
                  style={{ color: "#9a7a40" }}
                >
                  <div
                    className="w-12 h-12 rounded-[2px] flex items-center justify-center"
                    style={{
                      background: "rgba(8,8,8,0.8)",
                      border: "1px solid #1e1e1e",
                    }}
                  >
                    <Layers size={20} style={{ color: "#c8a060" }} />
                  </div>
                  <p className="text-xs font-medium tracking-wide">
                    Sem materiais pendentes
                  </p>
                </div>
              ) : (
                <ListContainer>
                  {Object.entries(requirements).map(([id, qty], idx, arr) => {
                    const item = ECONOMY_PRICES[id];
                    const icon = RESOURCE_DEFINITIONS[id]?.iconId;
                    const price = item?.buyPrice || 0;
                    const owned = inventory[id] || 0;
                    const needed = useInventory
                      ? Math.max(0, qty - owned)
                      : qty;
                    const totalLineCost = needed * price;

                    return (
                      <ListItem key={id} isLast={idx === arr.length - 1} vertical>
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-[2px] flex items-center justify-center shadow-inner"
                              style={{
                                background: "rgba(8,8,8,0.8)",
                                border: "1px solid #1e1e1e",
                              }}
                            >
                              {icon ? (
                                <img
                                  src={`./images/markers/${icon}.webp`}
                                  alt=""
                                  className="w-4 h-4 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <Layers
                                  size={12}
                                  style={{ color: "#9a7a40" }}
                                />
                              )}
                            </div>
                            <span
                              className="text-xs font-bold tracking-wide"
                              style={{ color: "#e8d5a0" }}
                            >
                              {item?.name || id}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span
                                className={`font-black text-sm ${useInventory && needed < qty ? "line-through mr-1.5 text-xs opacity-30" : ""}`}
                                style={{ color: "#4caf50", fontFamily: "'Orbitron', sans-serif" }}
                              >
                                {qty}x
                              </span>
                              {useInventory && needed < qty && (
                                <span
                                  className="font-black text-sm"
                                  style={{ color: "#4caf50", fontFamily: "'Orbitron', sans-serif" }}
                                >
                                  {needed}x
                                </span>
                              )}
                            </div>
                            {price > 0 && (
                              <div
                                className="px-1.5 py-0.5 rounded-[2px] min-w-[60px] text-right"
                                style={{
                                  background: "rgba(45,110,45,0.2)",
                                  border: "1px solid #2d6e2d",
                                }}
                              >
                                <span
                                  className="text-[10px] font-bold tabular-nums"
                                  style={{ color: "#4caf50", fontFamily: "'Orbitron', sans-serif" }}
                                >
                                  {totalLineCost} ¥
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {useInventory && (
                          <div
                            className="mt-2 pt-2 flex items-center justify-between w-full"
                            style={{ borderTop: "1px solid rgba(30,30,30,0.7)" }}
                          >
                            <span
                              className="text-[9px] font-bold uppercase tracking-wider"
                              style={{ color: "#c8a060" }}
                            >
                              Quantidade em Estoque:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={
                                  inventory[id] === undefined
                                    ? ""
                                    : inventory[id]
                                }
                                onChange={(e) =>
                                  handleSetInventory(
                                    id,
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                placeholder="0"
                                className="w-16 h-5 text-center font-bold text-[11px] tabular-nums rounded-[2px] outline-none [&::-webkit-inner-spin-button]:appearance-none"
                                style={{
                                  background: "rgba(8,8,8,0.8)",
                                  border: "1px solid #1e1e1e",
                                  color: "#c8860a",
                                  fontFamily: "'Orbitron', sans-serif"
                                }}
                                onFocus={(e) => {
                                  e.currentTarget.style.borderColor = "#c8860a";
                                }}
                                onBlur={(e) => {
                                  e.currentTarget.style.borderColor = "#1e1e1e";
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </ListItem>
                    );
                  })}
                </ListContainer>
              )}

              {Object.keys(craftedItems).length > 0 && (
                <div
                  className="mt-3 pt-2.5"
                  style={{ borderTop: "1px dashed rgba(200,160,48,0.25)" }}
                >
                  <h4
                    className="text-[9px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"
                    style={{ color: "#c8860a" }}
                  >
                    <ChevronRight size={10} />
                    Etapas Intermediárias (Sub-Crafts)
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(craftedItems).map(([id, qty]) => {
                      const item = ECONOMY_PRICES[id];
                      return (
                        <div
                          key={id}
                          className="text-[10px] px-1.5 py-0.5 rounded-[2px] font-medium flex items-center gap-1"
                          style={{
                            background: "rgba(8,8,8,0.8)",
                            border: "1px solid #1e1e1e",
                            color: "#e8d5a0",
                          }}
                        >
                          <span
                            className="font-bold"
                            style={{ color: "#c8860a" }}
                          >
                            {qty}x
                          </span>
                          {item?.name || id}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Grand Total Box */}
            <TechCard>
              <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                <Coins size={48} />
              </div>
              <div className="relative z-10 flex justify-between items-center w-full">
                <div>
                  <p
                    className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-0.5"
                    style={{ color: "#c8860a" }}
                  >
                    <Coins size={12} />
                    Custo Total
                  </p>
                  <p
                    className="text-[10px] font-medium"
                    style={{ color: "#c8a060", fontFamily: "'Orbitron', sans-serif" }}
                  >
                    Comprando matérias-primas
                  </p>
                </div>
                <div className="text-right relative z-10 flex items-baseline gap-1.5">
                  <span
                    className="text-2xl font-black tabular-nums drop-shadow-md"
                    style={{ color: "#e8a820", fontFamily: "'Orbitron', sans-serif" }}
                  >
                    {totalCost.toLocaleString()}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "#c8860a" }}
                  >
                    Yens
                  </span>
                </div>
              </div>
            </TechCard>
          </div>
        )}
      </div>
    </div>
  );
}

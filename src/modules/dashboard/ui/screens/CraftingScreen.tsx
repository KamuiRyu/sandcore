import { useState, useMemo } from "react";
import {
  Hammer,
  Plus,
  Minus,
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
  <div className="flex items-center gap-2.5 mb-3">
    <div
      className="flex-1 h-px"
      style={{ background: "linear-gradient(90deg, transparent, #4a2f0a)" }}
    />
    <span
      style={{
        fontFamily: "'Cinzel', serif",
        fontSize: 9,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "#9a7a40",
      }}
    >
      {children}
    </span>
    <div
      className="flex-1 h-px"
      style={{ background: "linear-gradient(90deg, #4a2f0a, transparent)" }}
    />
  </div>
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
        <div
          className="flex items-center gap-2 border p-3 rounded-[2px]"
          style={{ background: "rgba(13,10,5,0.5)", borderColor: "#4a2f0a" }}
        >
          <div className="flex-1 min-w-0">
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger
                className="w-full h-9 rounded-[2px] font-medium hover:opacity-90 transition-colors text-xs"
                style={{
                  background: "rgba(13,10,5,0.6)",
                  borderColor: "#4a2f0a",
                  color: "#c8860a",
                }}
              >
                <SelectValue placeholder="O que você deseja fabricar?" />
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
          <button
            onClick={handleAddTarget}
            disabled={!selectedItemId}
            className="flex-none whitespace-nowrap h-9 px-4 rounded-[2px] font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
            style={{
              background: "linear-gradient(135deg,#4a2f0a,#c8860a)",
              color: "#0d0a05",
            }}
          >
            <Plus size={14} strokeWidth={3} /> Adicionar
          </button>
          <button
            onClick={handleClear}
            disabled={targets.length === 0}
            className="flex-none flex items-center justify-center w-9 h-9 rounded-[2px] transition-all disabled:opacity-30 disabled:cursor-not-allowed group shadow-sm"
            style={{
              background: "rgba(139,26,26,0.1)",
              border: "1px solid #8b1a1a",
              color: "#c0392b",
            }}
            title="Limpar Metas"
          >
            <RefreshCw
              size={14}
              className="group-hover:rotate-180 transition-transform duration-500"
            />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 flex flex-col gap-4 pb-4">
        {/* Targets Section */}
        <div
          className="flex flex-col border p-3 rounded-[2px] flex-none"
          style={{ background: "rgba(13,10,5,0.5)", borderColor: "#4a2f0a" }}
        >
          <SL>
            <span className="flex items-center gap-2">
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: 14,
                  background: "#c8860a",
                  borderRadius: 1,
                }}
              />
              Metas Adicionadas
            </span>
          </SL>

          <div className="flex flex-col gap-2">
            {targets.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-4 gap-3 opacity-60"
                style={{ color: "#9a7a40" }}
              >
                <div
                  className="w-12 h-12 rounded-[2px] flex items-center justify-center"
                  style={{
                    background: "rgba(26,18,8,0.5)",
                    border: "1px solid #4a2f0a",
                  }}
                >
                  <Hammer size={20} style={{ color: "#c8a060" }} />
                </div>
                <p className="text-xs font-medium tracking-wide">
                  Nenhuma meta definida
                </p>
              </div>
            ) : (
              targets.map((target) => {
                const item = ECONOMY_PRICES[target.itemId];
                return (
                  <div
                    key={target.itemId}
                    className="flex justify-between items-center p-2 rounded-[2px] group transition-colors"
                    style={{
                      background: "rgba(26,18,8,0.5)",
                      border: "1px solid #4a2f0a",
                    }}
                  >
                    <span
                      className="font-bold text-xs tracking-wide"
                      style={{ color: "#e8d5a0" }}
                    >
                      {item?.name || target.itemId}
                    </span>
                    <div
                      className="flex items-center gap-1 p-0.5 rounded-[2px]"
                      style={{
                        background: "rgba(13,10,5,0.6)",
                        border: "1px solid #4a2f0a",
                      }}
                    >
                      <button
                        onClick={() => handleUpdateTarget(target.itemId, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded-[2px] bg-transparent transition-colors"
                        style={{ color: "#9a7a40" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "#c8860a";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "#9a7a40";
                        }}
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
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
                          style={{ color: "#c8860a" }}
                        />
                      </div>
                      <button
                        onClick={() => handleUpdateTarget(target.itemId, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-[2px] bg-transparent transition-colors"
                        style={{ color: "#9a7a40" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "#c8860a";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "#9a7a40";
                        }}
                      >
                        <Plus size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Requirements Section */}
        {targets.length > 0 && (
          <div className="flex flex-col gap-4 flex-none">
            <div
              className="flex flex-col border p-3 rounded-[2px]"
              style={{
                background: "rgba(13,10,5,0.5)",
                borderColor: "#4a2f0a",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: 14,
                      background: "#4caf50",
                      borderRadius: 1,
                    }}
                  />
                  <h3
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "#e8d5a0" }}
                  >
                    Lista de Compras
                  </h3>
                </div>
                <button
                  onClick={() => setUseInventory(!useInventory)}
                  className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-[2px] transition-colors"
                  style={
                    useInventory
                      ? {
                          background: "rgba(200,134,10,0.15)",
                          color: "#c8860a",
                          border: "1px solid rgba(200,134,10,0.3)",
                        }
                      : {
                          background: "rgba(26,18,8,0.5)",
                          color: "#9a7a40",
                          border: "1px solid #4a2f0a",
                        }
                  }
                >
                  {useInventory ? (
                    <CheckSquare size={10} />
                  ) : (
                    <Square size={10} />
                  )}
                  Abater Estoque
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {Object.keys(requirements).length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-4 gap-3 opacity-60"
                    style={{ color: "#9a7a40" }}
                  >
                    <div
                      className="w-12 h-12 rounded-[2px] flex items-center justify-center"
                      style={{
                        background: "rgba(26,18,8,0.5)",
                        border: "1px solid #4a2f0a",
                      }}
                    >
                      <Layers size={20} style={{ color: "#c8a060" }} />
                    </div>
                    <p className="text-xs font-medium tracking-wide">
                      Sem materiais pendentes
                    </p>
                  </div>
                ) : (
                  Object.entries(requirements).map(([id, qty]) => {
                    const item = ECONOMY_PRICES[id];
                    const icon = RESOURCE_DEFINITIONS[id]?.iconId;
                    const price = item?.buyPrice || 0;
                    const owned = inventory[id] || 0;
                    const needed = useInventory
                      ? Math.max(0, qty - owned)
                      : qty;
                    const totalLineCost = needed * price;

                    return (
                      <div
                        key={id}
                        className="flex flex-col p-2 rounded-[2px] transition-colors"
                        style={{
                          background: "rgba(26,18,8,0.5)",
                          border: "1px solid #4a2f0a",
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-[2px] flex items-center justify-center shadow-inner"
                              style={{
                                background: "rgba(13,10,5,0.6)",
                                border: "1px solid #4a2f0a",
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
                                style={{ color: "#4caf50" }}
                              >
                                {qty}x
                              </span>
                              {useInventory && needed < qty && (
                                <span
                                  className="font-black text-sm"
                                  style={{ color: "#4caf50" }}
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
                                  style={{ color: "#4caf50" }}
                                >
                                  {totalLineCost} ¥
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {useInventory && (
                          <div
                            className="mt-2 pt-2 flex items-center justify-between"
                            style={{ borderTop: "1px solid #4a2f0a" }}
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
                                  background: "rgba(13,10,5,0.6)",
                                  border: "1px solid #4a2f0a",
                                  color: "#c8860a",
                                }}
                                onFocus={(e) => {
                                  e.currentTarget.style.borderColor = "#c8860a";
                                }}
                                onBlur={(e) => {
                                  e.currentTarget.style.borderColor = "#4a2f0a";
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {Object.keys(craftedItems).length > 0 && (
                <div
                  className="mt-3 pt-2.5"
                  style={{ borderTop: "1px solid #4a2f0a" }}
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
                            background: "rgba(26,18,8,0.5)",
                            border: "1px solid #4a2f0a",
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
            <div
              className="border rounded-[2px] p-3 flex justify-between items-center relative overflow-hidden"
              style={{
                background: "rgba(74,47,10,0.2)",
                border: "1px solid #4a2f0a",
              }}
            >
              <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                <Coins size={48} />
              </div>
              <div className="relative z-10">
                <p
                  className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-0.5"
                  style={{ color: "#c8860a" }}
                >
                  <Coins size={12} />
                  Custo Total
                </p>
                <p
                  className="text-[10px] font-medium"
                  style={{ color: "#c8a060" }}
                >
                  Comprando matérias-primas
                </p>
              </div>
              <div className="text-right relative z-10 flex items-baseline gap-1.5">
                <span
                  className="text-2xl font-black tabular-nums drop-shadow-md"
                  style={{ color: "#e8a820" }}
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
          </div>
        )}
      </div>
    </div>
  );
}

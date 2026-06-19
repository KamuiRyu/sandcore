import { useState, useMemo } from 'react'
import { Hammer, Plus, Minus, Calculator, RefreshCw, ChevronRight, Layers, Coins, CheckSquare, Square } from 'lucide-react'
import { ECONOMY_PRICES, CRAFTING_RECIPES } from '../../../map/core/entities/Economy.entity'
import { RESOURCE_DEFINITIONS } from '../../../map/core/entities/ResourceDefinitions.entity'
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../../components/ui/Select'

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
    const recipe = CRAFTING_RECIPES.find(r => r.resultId === targetId);
    
    if (recipe) {
      const timesToCraft = Math.ceil(quantity / recipe.quantityProduced);
      craftedItems[targetId] = (craftedItems[targetId] || 0) + (timesToCraft * recipe.quantityProduced);

      for (const ingredient of recipe.ingredients) {
        resolveIngredients(ingredient.itemId, ingredient.quantity * timesToCraft);
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

export function CraftingScreen() {
  const [targets, setTargets] = useState<CraftingTarget[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [useInventory, setUseInventory] = useState(false);
  const [inventory, setInventory] = useState<Record<string, number>>({});

  const craftableItems = useMemo(() => {
    const ids = new Set(CRAFTING_RECIPES.map(r => r.resultId));
    return Object.values(ECONOMY_PRICES)
      .filter(item => ids.has(item.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const handleAddTarget = () => {
    if (!selectedItemId) return;
    
    setTargets(prev => {
      const existing = prev.find(t => t.itemId === selectedItemId);
      if (existing) {
        return prev.map(t => t.itemId === selectedItemId ? { ...t, quantity: t.quantity + 1 } : t);
      }
      return [...prev, { itemId: selectedItemId, quantity: 1 }];
    });
  };

  const handleUpdateTarget = (itemId: string, delta: number) => {
    setTargets(prev => {
      return prev.map(t => {
        if (t.itemId === itemId) {
          return { ...t, quantity: Math.max(0, t.quantity + delta) };
        }
        return t;
      }).filter(t => t.quantity > 0);
    });
  };

  const handleSetTarget = (itemId: string, quantity: number) => {
    setTargets(prev => {
      return prev.map(t => {
        if (t.itemId === itemId) {
          return { ...t, quantity: Math.max(0, quantity) };
        }
        return t;
      }).filter(t => t.quantity > 0);
    });
  };

  const handleClear = () => {
    setTargets([]);
  };

  const handleSetInventory = (itemId: string, quantity: number) => {
    setInventory(prev => ({ ...prev, [itemId]: quantity }));
  };

  const { requirements, craftedItems } = useMemo(() => calculateRequirements(targets), [targets]);

  const totalCost = useMemo(() => {
    return Object.entries(requirements).reduce((sum, [id, qty]) => {
      const price = ECONOMY_PRICES[id]?.buyPrice || 0;
      const owned = useInventory ? (inventory[id] || 0) : 0;
      const needed = Math.max(0, qty - owned);
      return sum + (needed * price);
    }, 0);
  }, [requirements, useInventory, inventory]);

  return (
    <div className="flex flex-col h-full overflow-hidden text-slate-200">
      {/* Header & Controls */}
      <div className="flex flex-col mb-4 flex-none">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Hammer className="w-5 h-5 text-teal-400" />
            Calculadora de Crafting
          </h2>
          <button 
            onClick={handleClear}
            disabled={targets.length === 0}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-slate-800/40 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700/50 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed group shadow-sm"
          >
            <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
            Limpar
          </button>
        </div>
        <div className="h-[1px] bg-slate-800/60 w-full mb-3"></div>

        {/* Top Input Bar */}
        <div className="flex items-center gap-3 bg-[#11161D]/75 border border-slate-800 rounded-xl p-3">
          <div className="flex-1 min-w-0">
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger className="w-full h-9 bg-slate-900/80 border-slate-700/80 focus:border-teal-500/50 rounded-lg font-medium text-slate-300 hover:bg-slate-800/80 transition-colors text-xs">
                <SelectValue placeholder="O que você deseja fabricar ou calcular?" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {craftableItems.map(item => (
                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button 
            onClick={handleAddTarget}
            disabled={!selectedItemId}
            className="flex-none whitespace-nowrap bg-teal-500 hover:bg-teal-400 text-slate-900 h-9 px-4 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Plus size={14} strokeWidth={3} /> Adicionar
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pb-4">
        
        {/* Targets Section */}
        <div className="flex flex-col bg-[#11161D]/75 border border-slate-800 rounded-xl p-3 flex-none">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-3.5 bg-teal-500 rounded-full" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
              Metas Adicionadas
            </h3>
          </div>

          <div className="flex flex-col gap-2">
            {targets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-slate-500 gap-3 opacity-60">
                <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                  <Hammer size={20} className="text-slate-400" />
                </div>
                <p className="text-xs font-medium tracking-wide">Nenhuma meta definida</p>
              </div>
            ) : (
              targets.map(target => {
                const item = ECONOMY_PRICES[target.itemId];
                return (
                  <div key={target.itemId} className="flex justify-between items-center bg-slate-800/30 border border-slate-700/30 hover:border-teal-500/30 hover:bg-slate-800/50 transition-colors p-2 rounded-lg group">
                    <span className="text-slate-200 font-bold text-xs tracking-wide">
                      {item?.name || target.itemId}
                    </span>
                    <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded border border-slate-700/50">
                      <button 
                        onClick={() => handleUpdateTarget(target.itemId, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-transparent text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                      <div className="w-10 flex justify-center">
                        <input 
                          type="number"
                          min="0"
                          value={target.quantity}
                          onChange={(e) => handleSetTarget(target.itemId, parseInt(e.target.value) || 0)}
                          className="w-full text-center font-bold text-teal-400 text-sm tabular-nums bg-transparent border-none outline-none focus:ring-0 p-0 m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </div>
                      <button 
                        onClick={() => handleUpdateTarget(target.itemId, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-transparent text-slate-400 hover:bg-teal-500/20 hover:text-teal-400 transition-colors"
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
            
            <div className="flex flex-col bg-[#11161D]/75 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 bg-emerald-500 rounded-full" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                    Lista de Compras
                  </h3>
                </div>
                <button 
                  onClick={() => setUseInventory(!useInventory)}
                  className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded transition-colors border ${useInventory ? 'bg-teal-500/20 text-teal-400 border-teal-500/30' : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800'}`}
                >
                  {useInventory ? <CheckSquare size={10} /> : <Square size={10} />}
                  Abater Estoque
                </button>
              </div>
              
              <div className="flex flex-col gap-2">
                {Object.keys(requirements).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-4 text-slate-500 gap-3 opacity-60">
                    <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                      <Layers size={20} className="text-slate-400" />
                    </div>
                    <p className="text-xs font-medium tracking-wide">Sem materiais pendentes</p>
                  </div>
                ) : (
                  Object.entries(requirements).map(([id, qty]) => {
                    const item = ECONOMY_PRICES[id];
                    const icon = RESOURCE_DEFINITIONS[id]?.iconId;
                    const price = item?.buyPrice || 0;
                    const owned = inventory[id] || 0;
                    const needed = useInventory ? Math.max(0, qty - owned) : qty;
                    const totalLineCost = needed * price;
                    
                    return (
                      <div key={id} className="flex flex-col bg-slate-800/30 border border-slate-700/30 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-slate-900/80 border border-slate-700/50 flex items-center justify-center shadow-inner">
                              {icon ? (
                                <img 
                                  src={`./images/markers/${icon}.webp`} 
                                  alt="" 
                                  className="w-4 h-4 object-contain"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              ) : (
                                <Layers size={12} className="text-slate-500" />
                              )}
                            </div>
                            <span className="text-slate-300 text-xs font-bold tracking-wide">
                              {item?.name || id}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className={`font-black text-sm ${useInventory && needed < qty ? 'text-emerald-400/30 line-through mr-1.5 text-xs' : 'text-emerald-400'}`}>
                                {qty}x
                              </span>
                              {useInventory && needed < qty && (
                                <span className="font-black text-emerald-400 text-sm">
                                  {needed}x
                               </span>
                              )}
                            </div>
                            {price > 0 && (
                              <div className="bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded min-w-[60px] text-right">
                                <span className="text-[10px] font-bold text-emerald-400/80 tabular-nums">
                                  {totalLineCost} ¥
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {useInventory && (
                          <div className="mt-2 pt-2 border-t border-slate-700/30 flex items-center justify-between">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Quantidade em Estoque:</span>
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="number"
                                min="0"
                                value={inventory[id] === undefined ? '' : inventory[id]}
                                onChange={(e) => handleSetInventory(id, parseInt(e.target.value) || 0)}
                                placeholder="0"
                                className="w-16 h-5 text-center font-bold text-teal-400 text-[11px] tabular-nums bg-slate-900/80 border border-slate-700/50 rounded outline-none focus:border-teal-500/50 [&::-webkit-inner-spin-button]:appearance-none"
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
                <div className="mt-3 pt-2.5 border-t border-slate-800">
                  <h4 className="text-[9px] font-bold text-teal-500/70 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <ChevronRight size={10} />
                    Etapas Intermediárias (Sub-Crafts)
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(craftedItems).map(([id, qty]) => {
                      const item = ECONOMY_PRICES[id];
                      return (
                        <div key={id} className="bg-slate-800/60 border border-slate-700/50 text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                          <span className="text-teal-400 font-bold">{qty}x</span>
                          {item?.name || id}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Grand Total Box */}
            <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-teal-900/20 border border-teal-500/20 rounded-xl p-3 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                <Coins size={48} />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
                  <Coins size={12} />
                  Custo Total
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Comprando matérias-primas
                </p>
              </div>
              <div className="text-right relative z-10 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-teal-300 to-emerald-400 tabular-nums drop-shadow-md">
                  {totalCost.toLocaleString()}
                </span>
                <span className="text-teal-500/70 text-[10px] font-bold uppercase tracking-wider">
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

import { useState, useEffect } from 'react'
import { Route, CheckCircle, PackageSearch } from 'lucide-react'
import { AppModal } from '../../../app/ui/components/AppModal'
import { ORE_DEFINITIONS, MUSHROOM_DEFINITIONS, PLANT_DEFINITIONS } from '../../core/entities/ResourceDefinitions.entity'

export type RouteCompletionData = Record<string, number>;

type RouteCompletionModalProps = {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: RouteCompletionData, markPins: boolean) => void
  routeTitle: string
  expectedCounts: Record<string, number>
}

export function RouteCompletionModal({ 
  isOpen, 
  onClose, 
  onComplete, 
  routeTitle,
  expectedCounts
}: RouteCompletionModalProps) {
  const [collected, setCollected] = useState<RouteCompletionData>({})
  const [markPins, setMarkPins] = useState(true)

  useEffect(() => {
    if (isOpen) {
      // Start with 0 for all expected resources
      const initial: RouteCompletionData = {};
      Object.keys(expectedCounts).forEach(k => {
        initial[k] = 0;
      });
      
      // Any mineral node can yield "Pedra" (ore_1).
      // So if the route contains ANY ore, ensure 'ore_1' is present in the inputs.
      const hasAnyOre = Object.keys(expectedCounts).some(k => ORE_DEFINITIONS[k]);
      if (hasAnyOre && initial['ore_1'] === undefined) {
        initial['ore_1'] = 0;
      }
      
      setCollected(initial);
    }
  }, [isOpen, expectedCounts])

  if (!isOpen) return null

  const handleUpdate = (type: string, delta: number) => {
    setCollected(prev => {
      const current = prev[type] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [type]: next };
    });
  }

  const handleChange = (type: string, val: string) => {
    const num = parseInt(val) || 0;
    const next = Math.max(0, num);
    setCollected(prev => ({ ...prev, [type]: next }));
  }

  const handleComplete = () => {
    onComplete(collected, markPins);
  }

  return (
    <AppModal
      onClose={onClose}
      title="Finalizar Rota"
      ariaLabel="Finalizar Rota Modal"
      eyebrow="Rotas"
      icon={CheckCircle}
      widthClassName="max-w-md"
      footer={
        <button
          type="button"
          onClick={handleComplete}
          className="flex-1 rounded-xl bg-[var(--cyan)] py-3 px-4 text-xs font-black uppercase tracking-widest text-black hover:bg-[#00e6b0] hover:shadow-[0_0_20px_rgba(0,214,163,0.3)] transition-all cursor-pointer"
        >
          Confirmar Coleta
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="bg-slate-800/30 border border-slate-800/50 rounded-xl p-3 flex flex-col gap-1">
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Rota</p>
          <p className="text-sm font-bold text-teal-400">{routeTitle}</p>
        </div>

        <div>
          <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-2">
            <PackageSearch size={14} className="text-slate-400" />
            Recursos Obtidos
          </p>

          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1 pb-1">
            {Object.keys(collected).map((type) => {
              const expectedCount = expectedCounts[type] || 0;
              const def = ORE_DEFINITIONS[type] || MUSHROOM_DEFINITIONS[type] || PLANT_DEFINITIONS[type];
              const collectedCount = collected[type] || 0;
              
              return (
                <div key={type} className="flex justify-between items-center bg-[#11161D]/75 border border-slate-700/50 p-2 rounded-lg text-xs group">
                  <span className="text-slate-300 font-medium">
                    {def ? def.name : type} {expectedCount > 0 && <span className="text-slate-500 ml-1">(de {expectedCount}x)</span>}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleUpdate(type, -1)}
                      disabled={collectedCount === 0}
                      className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-sm"
                    >
                      -
                    </button>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={collectedCount}
                        onChange={(e) => handleChange(type, e.target.value)}
                        className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-1 rounded font-bold text-xs w-14 text-center outline-none focus:border-teal-400/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <button 
                      onClick={() => handleUpdate(type, 1)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <label className="flex items-center gap-2 cursor-pointer mt-2 group">
          <input 
            type="checkbox" 
            checked={markPins} 
            onChange={(e) => setMarkPins(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-[var(--cyan)] focus:ring-[var(--cyan)] focus:ring-offset-slate-900 cursor-pointer accent-[var(--cyan)]"
          />
          <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
            Marcar ida no mapa (Aplica o tempo de recarga aos pontos)
          </span>
        </label>
      </div>
    </AppModal>
  )
}

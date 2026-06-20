import { useState, useMemo } from 'react'
import { Route, Search, Map as MapIcon, Compass } from 'lucide-react'
import { AppModal } from '../../../app/ui/components/AppModal'
import { Label } from '../../../../components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/Select'
import { cn } from '../../../../lib/utils'
import { mapRegions, mapSubRegions, type MapRegionId } from '../../core/entities/Regions.entity'
import { getMarkerIconSrc, getMarkerTypeLabel } from '../../core/entities/MapConfig.entity'

export type AutoRouteFilters = {
  categories: string[];
  regionId: string | 'all';
  subRegionId: string | 'all';
  includeCustomPins: boolean;
}

type AutoRouteFilterModalProps = {
  isOpen: boolean
  onClose: () => void
  onGenerate: (filters: AutoRouteFilters) => void
  availableCategories: {
    type: string;
    label?: string;
    iconId: string;
  }[]
  initialCategories?: string[]
}

export function AutoRouteFilterModal({ 
  isOpen, 
  onClose, 
  onGenerate, 
  availableCategories,
  initialCategories = []
}: AutoRouteFilterModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories)
  const [regionId, setRegionId] = useState<string | 'all'>('all')
  const [subRegionId, setSubRegionId] = useState<string | 'all'>('all')
  const [includeCustomPins, setIncludeCustomPins] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const currentSubRegions = useMemo(() => {
    if (regionId === 'all') return []
    return mapSubRegions[regionId as MapRegionId] || []
  }, [regionId])

  if (!isOpen) return null

  const toggleCategory = (type: string) => {
    setSelectedCategories(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const selectAllCategories = () => {
    setSelectedCategories(availableCategories.map(c => c.type))
  }

  const clearCategories = () => {
    setSelectedCategories([])
  }

  const handleGenerate = () => {
    onGenerate({
      categories: selectedCategories,
      regionId,
      subRegionId: regionId === 'all' ? 'all' : subRegionId,
      includeCustomPins
    })
    onClose()
  }

  return (
    <AppModal
      ariaLabel="Filtro de Auto Rota"
      eyebrow="Gerador"
      icon={Route}
      onClose={onClose}
      title="Configurar Auto Rota"
      widthClassName="w-[min(600px,100%)]"
      footer={
        <div className="flex gap-3 justify-between w-full">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={includeCustomPins}
                onChange={(e) => setIncludeCustomPins(e.target.checked)}
                className="w-4 h-4 rounded bg-white/5 border-white/10 text-amber-500 focus:ring-[#c8860a] focus:ring-offset-slate-950"
              />
              <span className="text-xs font-medium text-[#f0d9a0] group-hover:text-white transition">
                Incluir Meus Pinos
              </span>
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/10 text-[#9a7a40] hover:bg-white/5 transition active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={selectedCategories.length === 0 && !includeCustomPins}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold hover:brightness-110 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              <Route size={18} strokeWidth={3} />
              Gerar Rota
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-[#f0d9a0]"><MapIcon size={14} className="text-[#c8860a]"/> Região</Label>
            <Select value={regionId} onValueChange={(v) => {
              setRegionId(v)
              setSubRegionId('all')
            }}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Todas as Regiões" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Regiões</SelectItem>
                {mapRegions.map((region) => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-[#f0d9a0]"><Compass size={14} className="text-[#c8860a]"/> Sub-Região</Label>
            <Select 
              value={subRegionId} 
              onValueChange={setSubRegionId}
              disabled={regionId === 'all' || currentSubRegions.length === 0}
            >
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder={regionId === 'all' ? "Selecione a Região..." : "Todas as Sub-Regiões"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Sub-Regiões</SelectItem>
                {currentSubRegions.map((sub) => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-bold text-[#f0d9a0]">Categorias a Incluir</Label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9a7a40]" />
                <input
                  type="text"
                  placeholder="Buscar categoria..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 h-8 pl-8 pr-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-[#9a7a40] focus:outline-none focus:border-[#c8860a]/50 transition-colors"
                />
              </div>
              <span className="text-slate-600 ml-1 mr-1">•</span>
              <button 
                type="button" 
                onClick={selectAllCategories}
                className="text-[10px] font-bold uppercase tracking-wider text-[#c8860a] hover:text-[#ffdd66] transition"
              >
                Todas
              </button>
              <span className="text-slate-600">•</span>
              <button 
                type="button" 
                onClick={clearCategories}
                className="text-[10px] font-bold uppercase tracking-wider text-[#9a7a40] hover:text-[#f0d9a0] transition"
              >
                Nenhuma
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2.5 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
            {availableCategories
              .filter(cat => {
                if (!searchQuery.trim()) return true
                const query = searchQuery.toLowerCase()
                const label = (cat.label || getMarkerTypeLabel(cat.type as any)).toLowerCase()
                return label.includes(query)
              })
              .map(cat => {
              const isSelected = selectedCategories.includes(cat.type)
              return (
                <button
                  key={cat.type}
                  onClick={() => toggleCategory(cat.type)}
                  className={cn(
                    "flex items-center gap-2.5 p-2.5 rounded-lg border transition-all duration-200 text-left",
                    isSelected 
                      ? "border-[#c8860a]/40 bg-[#c8860a]/10 shadow-[0_0_10px_rgba(200,134,10,0.1)]"
                      : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10"
                  )}
                >
                  <div className={cn(
                    "grid place-items-center w-8 h-8 rounded-lg shrink-0 transition-colors",
                    isSelected ? "bg-black/40" : "bg-black/20"
                  )}>
                    <img 
                      src={getMarkerIconSrc(cat.iconId)} 
                      alt=""
                      className={cn(
                        "w-6 h-6 object-contain transition-all",
                        isSelected ? "scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" : "opacity-70 grayscale"
                      )} 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-[10px] font-bold truncate transition-colors",
                      isSelected ? "text-white" : "text-[#9a7a40]"
                    )}>
                      {cat.label || getMarkerTypeLabel(cat.type as any)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </AppModal>
  )
}

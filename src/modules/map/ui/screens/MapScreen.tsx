import { useState, useEffect, useRef } from 'react'
import { MapPin, Star, Compass, Target, CheckCircle } from 'lucide-react'

interface Marker {
  id: string
  name: string
  x: number // percentage
  y: number // percentage
  type: 'village' | ' outpost' | 'hazard' | 'oasis' | 'mine' | 'port' | 'ruins' | 'camp'
  coords: string
  description: string
}

interface MapScreenProps {
  searchQuery: string
}

export const MapScreen = ({ searchQuery }: MapScreenProps) => {
  const [mapZoom, setMapZoom] = useState(1.0)
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [mapFilter, setMapFilter] = useState<'pins' | 'favorites' | 'routes'>('pins')
  const [completedMarkers, setCompletedMarkers] = useState<string[]>([])
  const [favoritesList, setFavoritesList] = useState<string[]>([])

  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.ipcRenderer) {
      window.ipcRenderer.getConfig().then((config) => {
        if (config) {
          if ('completedMarkers' in config) setCompletedMarkers(config.completedMarkers || [])
          if ('favoritesList' in config) setFavoritesList(config.favoritesList || [])
        }
      })
    }
  }, [])

  const handleZoomIn = () => setMapZoom(prev => Math.min(prev + 0.25, 2.5))
  const handleZoomOut = () => {
    setMapZoom(prev => {
      const next = Math.max(prev - 0.25, 1.0)
      if (next === 1.0) setMapPan({ x: 0, y: 0 }) // Reset pan when zoom is default
      return next
    })
  }
  const handleRecenter = () => {
    setMapZoom(1.0)
    setMapPan({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mapZoom <= 1.0) return // No panning needed if not zoomed
    setIsDragging(true)
    setDragStart({ x: e.clientX - mapPan.x, y: e.clientY - mapPan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    
    // Boundary checks (keep the map inside window edges when zoomed)
    const limit = (mapZoom - 1) * 350
    const boundedX = Math.max(Math.min(newX, limit), -limit)
    const boundedY = Math.max(Math.min(newY, limit), -limit)

    setMapPan({ x: boundedX, y: boundedY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const toggleMarkerCompleted = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCompletedMarkers(prev => {
      const next = prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
      window.ipcRenderer?.send('set-config', { completedMarkers: next })
      return next
    })
  }

  const toggleFavoriteMarker = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavoritesList(prev => {
      const next = prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
      window.ipcRenderer?.send('set-config', { favoritesList: next })
      return next
    })
  }

  // Static Map Markers Dataset
  const markers: Marker[] = [
    { id: '1', name: 'Vila de Suna (Centro)', x: 52, y: 49, type: 'village', coords: '40.05, 12.01', description: 'A Fortaleza Central do Deserto. Centro de Comércio e Treinamento.' },
    { id: '2', name: 'Vale dos Ventos', x: 30, y: 22, type: 'oasis', coords: '18.44, -12.52', description: 'Vale cercado por fortes rajadas de vento. Risco de tempestades de areia.' },
    { id: '3', name: 'Posto Avançado', x: 44, y: 26, type: ' outpost', coords: '32.12, 10.95', description: 'Guarnição militar de Suna monitorando a fronteira norte.' },
    { id: '4', name: 'Cânion do Eclipse', x: 74, y: 17, type: 'hazard', coords: '82.04, 98.42', description: 'Zona perigosa povoada por bandidos e fendas profundas.' },
    { id: '5', name: 'Oásis Oculto', x: 26, y: 44, type: 'oasis', coords: '12.82, -34.15', description: 'Ponto crucial de reabastecimento de água para viajantes.' },
    { id: '6', name: 'Porto da Areia', x: 86, y: 41, type: 'port', coords: '5.12, 112.50', description: 'Estação de ancoragem para os barcos voadores de areia.' },
    { id: '7', name: 'Mina de Ferro', x: 57, y: 69, type: 'mine', coords: '-20.10, 42.12', description: 'Depósito de minério de ferro guardado por golens de areia.' },
    { id: '8', name: 'Minério de Ouro', x: 39, y: 79, type: 'mine', coords: '-38.52, -5.92', description: 'Veio de ouro rico porém instável sob dunas móveis.' },
    { id: '9', name: 'Laboratório Seco Secreto', x: 72, y: 77, type: 'ruins', coords: '-30.40, 88.02', description: 'Ruínas de um laboratório abandonado de manipulação de marionetes.' },
    { id: '10', name: 'Templo Antigo', x: 84, y: 80, type: 'ruins', coords: '-42.95, 120.40', description: 'Templo sagrado dedicado ao espírito do vento.' },
    { id: '11', name: 'Acampamento Nômade', x: 76, y: 31, type: 'camp', coords: '52.18, 92.15', description: 'Mercadores nômades de passagem. Oferecem suprimentos raros.' }
  ]

  const filteredMarkers = markers.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (!matchesSearch) return false

    if (mapFilter === 'favorites') {
      return favoritesList.includes(m.id)
    }
    if (mapFilter === 'routes') {
      return ['1', '3', '5', '6'].includes(m.id)
    }
    return true
  })

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0D10] animate-in fade-in duration-300 relative">
      {/* Interactive Map Area with Zoom/Pan */}
      <div 
        ref={mapContainerRef}
        className={`flex-1 relative overflow-hidden bg-[#0A0D10] select-none ${mapZoom > 1.0 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Map Canvas wrapper */}
        <div 
          className="w-full h-full bg-cover bg-center absolute inset-0 transition-transform duration-100 ease-out flex items-center justify-center"
          style={{ 
            backgroundImage: "url('/images/background.webp')",
            transform: `scale(${mapZoom}) translate(${mapPan.x / mapZoom}px, ${mapPan.y / mapZoom}px)`,
            backgroundSize: '100% 100%'
          }}
        >
          {/* Background styling filters for grid map aesthetic */}
          <div className="absolute inset-0 bg-slate-950/45 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D10]/90 via-transparent to-[#0A0D10]/20"></div>

          {/* Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>

          {/* Suna Central Kanji Circle */}
          <div 
            className="absolute border-2 border-teal-500/10 bg-slate-950/70 w-36 h-36 rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,168,150,0.1)] transition-transform duration-300"
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <span className="text-teal-500/10 text-6xl font-bold font-mono select-none pointer-events-none">風</span>
            <span className="text-[10px] tracking-widest text-teal-400 font-bold font-mono absolute bottom-3">SUNA</span>
          </div>

          {/* Interactive Map Markers */}
          {filteredMarkers.map((marker) => {
            const isCompleted = completedMarkers.includes(marker.id)
            const isFavorited = favoritesList.includes(marker.id)
            
            return (
              <div 
                key={marker.id}
                className="absolute group z-20"
                style={{ left: `${marker.x}%`, top: `${marker.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                {/* Interactive Marker Pin */}
                <div 
                  onClick={(e) => toggleMarkerCompleted(marker.id, e)}
                  className={`w-7.5 h-7.5 rounded-full flex items-center justify-center border shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-110 active:scale-95
                    ${isCompleted 
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                      : marker.type === 'hazard'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                        : 'bg-teal-500/10 border-teal-500 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.3)]'
                    }
                  `}
                >
                  {isCompleted ? <CheckCircle size={14} /> : <MapPin size={14} />}
                </div>

                {/* Floating Marker Tooltip (opens on hover) */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#0F1318]/95 border border-[#1E2732] rounded-xl p-2.5 shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold text-slate-200 truncate">{marker.name}</span>
                    <button 
                      onClick={(e) => toggleFavoriteMarker(marker.id, e)}
                      className={`p-0.5 hover:text-amber-400 transition-colors cursor-pointer flex-none ${isFavorited ? 'text-amber-400' : 'text-slate-500'}`}
                    >
                      <Star size={11} fill={isFavorited ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <p className="text-[8.5px] text-slate-400 leading-normal whitespace-pre-wrap">{marker.description}</p>
                  <div className="h-[1px] bg-slate-800/80 my-1"></div>
                  <div className="flex justify-between text-[8px] font-mono text-slate-500">
                    <span>COORDENADAS</span>
                    <span className="text-teal-400 font-bold">{marker.coords}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Zoom Controls Overlay */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button 
            onClick={handleZoomIn}
            className="w-9 h-9 rounded-lg bg-[#0B0E12]/90 border border-[#1E2732] flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-lg cursor-pointer"
            title="Aproximar"
          >
            <span className="text-lg font-bold">+</span>
          </button>
          <button 
            onClick={handleZoomOut}
            className="w-9 h-9 rounded-lg bg-[#0B0E12]/90 border border-[#1E2732] flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-lg cursor-pointer"
            title="Afastar"
          >
            <span className="text-lg font-bold">-</span>
          </button>
          <button 
            onClick={handleRecenter}
            className="w-9 h-9 rounded-lg bg-[#0B0E12]/90 border border-[#1E2732] flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-lg cursor-pointer"
            title="Centralizar Mira"
          >
            <Target size={15} className="text-teal-400" />
          </button>
        </div>

        {/* Bottom Floating Stats Overlay */}
        <div className="absolute bottom-4 left-4 bg-[#0B0E12]/90 backdrop-blur-md border border-[#1E2732] rounded-xl px-4 py-2.5 flex items-center gap-3 z-30 shadow-2xl" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-none">
            <MapPin size={16} className="text-teal-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white">
              <span className="font-bold">{markers.length}</span> recursos encontrados
            </span>
            <span className="text-[10px] text-teal-400/80 mt-0.5">
              {favoritesList.length} favoritos • {completedMarkers.length} rotas salvas
            </span>
          </div>
        </div>

        {/* Bottom Floating Tabs Overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0B0E12]/90 backdrop-blur-md border border-[#1E2732] rounded-xl p-1 flex gap-1 z-30 shadow-2xl" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button 
            onClick={() => setMapFilter('pins')}
            className={`py-1.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5
              ${mapFilter === 'pins' 
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20 shadow-[0_0_10px_rgba(20,184,166,0.15)]' 
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }
            `}
          >
            <MapPin size={13} className={mapFilter === 'pins' ? 'text-teal-400' : 'text-slate-400'} />
            <span>Pins</span>
          </button>
          <button 
            onClick={() => setMapFilter('favorites')}
            className={`py-1.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5
              ${mapFilter === 'favorites' 
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20 shadow-[0_0_10px_rgba(20,184,166,0.15)]' 
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }
            `}
          >
            <Star size={13} className={mapFilter === 'favorites' ? 'text-teal-400' : 'text-slate-400'} fill={mapFilter === 'favorites' ? 'currentColor' : 'none'} />
            <span>Favoritos</span>
          </button>
          <button 
            onClick={() => setMapFilter('routes')}
            className={`py-1.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5
              ${mapFilter === 'routes' 
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20 shadow-[0_0_10px_rgba(20,184,166,0.15)]' 
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }
            `}
          >
            <Compass size={13} className={mapFilter === 'routes' ? 'text-teal-400' : 'text-slate-400'} />
            <span>Rotas</span>
          </button>
        </div>

        {/* Bottom Floating Centralizar Button */}
        <button 
          onClick={handleRecenter}
          className="absolute bottom-4 right-4 bg-[#0B0E12]/90 hover:bg-[#161C23]/90 border border-[#1E2732] text-slate-200 hover:text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all z-30 shadow-2xl cursor-pointer"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          <Target size={14} className="text-teal-400" />
          <span>Centralizar</span>
        </button>

      </div>
    </div>
  )
}
export default MapScreen

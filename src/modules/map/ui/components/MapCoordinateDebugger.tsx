import {
  useEffect,
  useState,
} from 'react'
import JSZip from 'jszip'
import {
  Clipboard,
  Crosshair,
  Hourglass,
  MapPinned,
  MousePointer2,
  PanelRightClose,
  PanelRightOpen,
  Minus,
  Plus,
  Redo2,
  Route,
  Settings,
  Trash2,
  Undo2,
} from 'lucide-react'
import {
  defaultMapRegion,
  defaultMarkerType,
  getMarkerIconLabel,
  getMarkerIconSrc,
  getMarkerIconOptionsByType,
  getMarkerIconsByType,
  getMarkerTypeLabel,
  getSubRegions,
  mapBaseTextureSrc,
  mapRegions,
  mapImageSrc,
  mapLayers,
  markerTypes,
  minMapZoom,
} from '../../core/entities/MapConfig.entity'
import type { MapRegionId } from '../../core/entities/MapConfig.entity'
import {
  formatCoord,
  formatPoint,
} from '../../core/usecases/SerializeMapCalibration.usecase'
import { useMapCalibrationViewModel } from '../viewModels/useMapCalibration.viewModel'
import { cn } from '../../../../lib/utils'
import type { CalibrationPoint, PointDefinition } from '../../core/entities/MapCalibration.entity'

const surfaceClassName =
  'border border-white/10 bg-[#0a0f18]/90 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-[24px]'

const fieldClassName =
  'h-10 w-full rounded-lg border border-white/5 bg-white/[0.03] px-3 font-mono text-[0.8rem] text-white/90 outline-none transition-all duration-200 placeholder:text-white/20 focus:border-[var(--cyan)]/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-[var(--cyan)]/10'

const labelClassName =
  'grid gap-1.5 font-mono text-[0.6rem] font-bold uppercase tracking-[0.15em] text-white/40'

const iconButtonClassName =
  'flex items-center justify-center rounded-lg border border-white/5 bg-white/[0.04] text-white/60 shadow-sm transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed'

const actionIconButtonClassName =
  'flex h-11 items-center justify-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] font-mono text-[0.7rem] font-black uppercase tracking-widest text-white/70 shadow-sm transition-all duration-200 hover:border-[var(--cyan)]/40 hover:bg-[var(--cyan)]/10 hover:text-[var(--cyan)] disabled:opacity-20'

const panelCardClassName =
  'rounded-xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent p-4 shadow-sm'

const baseTextureSize = 96

export function MapCoordinateDebugger() {
  const {
    camera,
    clearCurrentPoint,
    clearFence,
    copyFeedback,
    currentPoint,
    cursorPoint,
    displayedCamera,
    displayedZoomScale,
    fencePoints,
    fenceJson,
    handleCopy,
    handlePointerDown,
    handlePointerLeave,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleZoomPointerCancel,
    handleZoomPointerDown,
    handleZoomPointerMove,
    handleZoomPointerUp,
    isDragging,
    isSidebarOpen,
    mapSurfaceRef,
    mapSurfaceSize,
    mapViewportRef,
    removeLastSavedPoint,
    removeSavedPoint,
    saveCurrentPoint,
    savedPoints,
    savedPointsJson,
    selectSavedPoint,
    setIsSidebarOpen,
    setCopyFeedback,
    snippet,
    toggleSelectedLayer,
    updateSelectedPoint,
    zoomIn,
    zoomOut,
    zoomThumbBottom,
    isEditingSavedPoint,
    importPoints,
    loadSystemPoints,
    addPointAtCoords,
    creationDefaults,
    updateCreationDefaults,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useMapCalibrationViewModel()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault()
        undo()
      } else if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.shiftKey && event.key === 'z'))) {
        event.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  const [newPointCoords, setNewPointCoords] = useState({ x: 0, y: 0 })
  const [activeTab, setActiveTab] = useState<'editor' | 'defaults' | 'list'>('editor')
  const [pointSearchQuery, setPointSearchQuery] = useState('')

  const selectedMarkerType = currentPoint?.type ?? defaultMarkerType
  const availableMarkerIcons = getMarkerIconsByType(selectedMarkerType)
  const availableMarkerIconOptions = getMarkerIconOptionsByType(selectedMarkerType)
  const currentIconSrc = currentPoint ? getMarkerIconSrc(currentPoint.iconId) : null
  const confirmedTextureSize = `${Math.round(baseTextureSize * camera.scale)}px ${Math.round(baseTextureSize * camera.scale)}px`
  const displayedTextureSize = `${Math.round(baseTextureSize * displayedZoomScale)}px ${Math.round(baseTextureSize * displayedZoomScale)}px`

  return (
    <section
      className="relative h-full min-h-0 overflow-hidden map-background-texture"
      style={{
        backgroundImage: `url(${mapBaseTextureSrc})`,
        backgroundRepeat: 'repeat',
        backgroundSize: confirmedTextureSize,
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden">
          {!isSidebarOpen ? (
            <button
              aria-label="Mostrar painel"
              className={cn(iconButtonClassName, 'absolute left-4 top-4 z-30')}
              onClick={() => setIsSidebarOpen(true)}
              title="Mostrar painel"
              type="button"
            >
              <PanelRightOpen size={18} />
            </button>
          ) : null}

          <div className="absolute bottom-4 right-4 z-10 grid justify-items-center gap-2">
            <button
              aria-label="Aproximar mapa"
              className="grid h-6 w-6 place-items-center bg-transparent text-white transition hover:text-[var(--cyan)]"
              onClick={zoomIn}
              title="Aproximar"
              type="button"
            >
              <span className="grid h-4 w-4 rotate-45 place-items-center border-2 border-white bg-[rgba(19,32,40,0.72)] shadow-[0_2px_7px_rgba(0,0,0,0.34)]">
                <Plus size={11} className="-rotate-45" strokeWidth={3} />
              </span>
            </button>

            <button
              aria-label="Ajustar zoom do mapa"
              className="relative h-28 w-6 cursor-pointer bg-transparent"
              onPointerCancel={handleZoomPointerCancel}
              onPointerDown={handleZoomPointerDown}
              onPointerMove={handleZoomPointerMove}
              onPointerUp={handleZoomPointerUp}
              title={`${Math.round(displayedZoomScale * 100)}%`}
              type="button"
            >
              <span className="absolute left-1/2 top-1 h-[calc(100%-8px)] w-2 -translate-x-1/2 rounded-full border border-white/70 bg-[rgba(19,32,40,0.62)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.28)]" />
              <span
                className="absolute left-1/2 grid h-5 w-5 -translate-x-1/2 rotate-45 place-items-center border-2 border-white/80 bg-[rgba(132,136,137,0.96)] shadow-[0_2px_7px_rgba(0,0,0,0.34)]"
                style={{ bottom: `${zoomThumbBottom}px` }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            </button>

            <button
              aria-label="Afastar mapa"
              className="grid h-6 w-6 place-items-center bg-transparent text-white transition hover:text-[var(--cyan)] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={displayedZoomScale <= minMapZoom}
              onClick={zoomOut}
              title="Afastar"
              type="button"
            >
              <span className="grid h-4 w-4 rotate-45 place-items-center border-2 border-white bg-[rgba(19,32,40,0.72)] shadow-[0_2px_7px_rgba(0,0,0,0.34)]">
                <Minus size={11} className="-rotate-45" strokeWidth={3} />
              </span>
            </button>
          </div>

          <div
            className="relative flex h-full w-full items-center justify-center overflow-hidden"
            ref={mapViewportRef}
          >
            <div
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute inset-[-50%] map-background-texture',
                isDragging ? 'will-change-transform' : '',
              )}
              style={{
                backgroundImage: `url(${mapBaseTextureSrc})`,
                backgroundRepeat: 'repeat',
                backgroundSize: displayedTextureSize,
                transform: `translate(${Math.round(displayedCamera.x)}px, ${Math.round(displayedCamera.y)}px) scale(${displayedCamera.scale})`,
                transformOrigin: 'center center',
              }}
            />
            <div
              className={cn(
                'relative touch-none select-none overflow-hidden map-surface-container',
                isDragging ? 'cursor-grabbing will-change-transform' : 'cursor-crosshair active:cursor-grabbing',
              )}
              ref={mapSurfaceRef}
              onPointerDown={handlePointerDown}
              onPointerLeave={handlePointerLeave}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
              role="application"
              aria-label="Calibrador de coordenadas do mapa"
              style={{
                height: `${mapSurfaceSize.height}px`,
                transform: `translate(${Math.round(displayedCamera.x)}px, ${Math.round(displayedCamera.y)}px) scale(${displayedCamera.scale})`,
                transformOrigin: 'center center',
                width: `${mapSurfaceSize.width}px`,
              }}
            >
              <img
                alt="Mapa base do Shinobi Legends para calibracao"
                className="block h-full w-full object-contain"
                draggable={false}
                src={mapImageSrc}
              />

              <svg
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {fencePoints.length > 1 && (
                  <polyline
                    fill="rgba(0, 214, 163, 0.12)"
                    points={fencePoints.map((p) => `${p.x},${p.y}`).join(' ')}
                    stroke="var(--cyan)"
                    strokeWidth={0.1 / displayedCamera.scale}
                    strokeDasharray={`${0.4 / displayedCamera.scale} ${0.2 / displayedCamera.scale}`}
                  />
                )}
                {fencePoints.map((point, index) => (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    fill="var(--cyan)"
                    key={`fence-${index}`}
                    r={0.2 / displayedCamera.scale}
                  />
                ))}
              </svg>

              {savedPoints.map((point, index) => {
                const isEditing = point.id === currentPoint?.id
                const displayPoint = isEditing ? currentPoint : point

                return (
                  <button
                    aria-label={`Selecionar ${displayPoint!.name}`}
                    className={cn(
                      "absolute grid h-10 w-10 place-items-center bg-transparent transition hover:scale-105",
                      isEditing && "scale-110 ring-2 ring-white rounded-full"
                    )}
                    key={point.id}
                    onClick={(event) => {
                      event.stopPropagation()
                      selectSavedPoint(point.id)
                    }}
                    onPointerDown={(event) => {
                      event.stopPropagation()
                    }}
                    onPointerUp={(event) => {
                      event.stopPropagation()
                    }}
                    style={{
                      left: `${displayPoint!.x}%`,
                      top: `${displayPoint!.y}%`,
                      transform: `scale(${1 / displayedCamera.scale}) translate(-50%, -50%)`,
                      transformOrigin: '0 0',
                    }}
                    title={displayPoint!.name}
                    type="button"
                  >
                    <img
                      alt={`Ícone de ${displayPoint!.name}`}
                      className="h-10 w-10 object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.45)]"
                      draggable={false}
                      src={getMarkerIconSrc(displayPoint!.iconId)}
                    />
                    <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--cyan)] px-1 font-mono text-[0.58rem] font-black leading-none text-black">
                      {index + 1}
                    </span>
                  </button>
                )
              })}

              {!isEditingSavedPoint && currentPoint ? (
                <button
                  aria-label={`Ponto atual ${currentPoint.name}`}
                  className="absolute grid h-10 w-10 place-items-center bg-transparent transition hover:scale-105"
                  onClick={(event) => {
                    event.stopPropagation()
                    clearCurrentPoint()
                  }}
                  onPointerDown={(event) => {
                    event.stopPropagation()
                  }}
                  onPointerUp={(event) => {
                    event.stopPropagation()
                  }}
                  style={{
                    left: `${currentPoint.x}%`,
                    top: `${currentPoint.y}%`,
                    transform: `scale(${1 / displayedCamera.scale}) translate(-50%, -50%)`,
                    transformOrigin: '0 0',
                  }}
                  type="button"
                >
                  {currentIconSrc ? (
                    <img
                      alt={currentPoint.iconId}
                      className="h-10 w-10 object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.45)]"
                      draggable={false}
                      src={currentIconSrc}
                    />
                  ) : (
                    <span className="font-mono text-[0.68rem] font-black text-black">
                      {savedPoints.length + 1}
                    </span>
                  )}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <aside
        className={cn(
          surfaceClassName,
          'absolute bottom-5 left-5 top-5 z-20 grid w-[min(540px,calc(100vw_-_40px))] overflow-hidden rounded-2xl transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] max-[560px]:bottom-0 max-[560px]:left-0 max-[560px]:top-0 max-[560px]:w-full max-[560px]:rounded-none',
          isSidebarOpen ? 'translate-x-0' : 'pointer-events-none -translate-x-[calc(100%+40px)]',
        )}
        aria-hidden={!isSidebarOpen}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex-none p-6 pb-2 max-[420px]:p-4 max-[420px]:pb-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cyan)]/10 text-[var(--cyan)]">
                  <Settings size={20} className="animate-[spin_4s_linear_infinite]" />
                </div>
                <div>
                  <h1 className="m-0 font-mono text-[1.1rem] font-black uppercase leading-tight tracking-[0.1em] text-white">
                    Map <span className="text-[var(--cyan)]">Forge</span>
                  </h1>
                  <span className="font-mono text-[0.55rem] font-bold uppercase tracking-widest text-white/20">
                    Calibration Tool v2.0
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  aria-label="Desfazer"
                  className={cn(iconButtonClassName, "h-9 w-9")}
                  disabled={!canUndo}
                  onClick={undo}
                  title="Desfazer (Ctrl+Z)"
                  type="button"
                >
                  <Undo2 size={16} />
                </button>
                <button
                  aria-label="Refazer"
                  className={cn(iconButtonClassName, "h-9 w-9")}
                  disabled={!canRedo}
                  onClick={redo}
                  title="Refazer (Ctrl+Y)"
                  type="button"
                >
                  <Redo2 size={16} />
                </button>
                <div className="mx-1 h-4 w-px bg-white/10" />
                <button
                  aria-label="Esconder painel"
                  className={cn(
                    iconButtonClassName,
                    "h-9 w-9 border-red-500/10 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400",
                  )}
                  onClick={() => setIsSidebarOpen(false)}
                  title="Esconder painel"
                  type="button"
                >
                  <PanelRightClose size={17} />
                </button>
              </div>
            </div>

            <div className="mt-6 flex rounded-xl bg-white/[0.03] p-1">
              {[
                { id: 'editor', label: 'Editor', icon: <Plus size={14} /> },
                { id: 'defaults', label: 'Defaults', icon: <Settings size={14} /> },
                { id: 'list', label: 'Library', icon: <MapPinned size={14} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 font-mono text-[0.6rem] font-black uppercase tracking-widest transition-all duration-300",
                    activeTab === tab.id 
                      ? "bg-white/[0.06] text-[var(--cyan)] shadow-sm" 
                      : "text-white/30 hover:text-white/60"
                  )}
                  onClick={() => setActiveTab(tab.id as 'editor' | 'list' | 'defaults')}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid min-h-0 flex-1 content-start gap-5 overflow-y-auto p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 max-[420px]:p-4">
            {activeTab === 'editor' && (
              <>
                <div className="grid grid-cols-2 gap-2 max-[420px]:grid-cols-1">
                  <div className={`${panelCardClassName} p-3`}>
                    <span className="flex items-center gap-2 font-mono text-[0.62rem] font-black uppercase tracking-[0.12em] text-[rgba(198,202,211,0.62)]">
                      <MousePointer2 size={14} />
                      Cursor
                    </span>
                    <strong className="mt-2 block font-mono text-[0.78rem] text-white">
                      {cursorPoint
                        ? `x ${formatCoord(cursorPoint.x)} / y ${formatCoord(cursorPoint.y)}`
                        : 'fora do mapa'}
                    </strong>
                  </div>

                  <div className={`${panelCardClassName} p-3`}>
                    <span className="flex items-center gap-2 font-mono text-[0.62rem] font-black uppercase tracking-[0.12em] text-[rgba(198,202,211,0.62)]">
                      <MapPinned size={14} />
                      Ponto
                    </span>
                    <strong className="mt-2 block font-mono text-[0.78rem] text-white">
                      {currentPoint ? 'marcado' : 'pendente'}
                    </strong>
                  </div>
                </div>

                <div className={`${panelCardClassName} grid gap-3 p-3`}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="m-0 font-mono text-sm font-black uppercase tracking-[0.08em] text-white">
                      {currentPoint ? 'MapPoint (Atual)' : 'Adicionar Ponto Manual'}
                    </h2>
                    {!currentPoint && (
                      <span className="font-mono text-[0.68rem] font-black uppercase tracking-[0.12em] text-[rgba(198,202,211,0.62)]">
                        nenhum
                      </span>
                    )}
                  </div>

                  {!currentPoint ? (
                    <div className="grid gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <label className={labelClassName}>
                          X
                          <input
                            className={fieldClassName}
                            onChange={(e) => setNewPointCoords({ ...newPointCoords, x: parseFloat(e.target.value) || 0 })}
                            placeholder="50.0"
                            type="number"
                            value={newPointCoords.x}
                          />
                        </label>
                        <label className={labelClassName}>
                          Y
                          <input
                            className={fieldClassName}
                            onChange={(e) => setNewPointCoords({ ...newPointCoords, y: parseFloat(e.target.value) || 0 })}
                            placeholder="50.0"
                            type="number"
                            value={newPointCoords.y}
                          />
                        </label>
                      </div>
                      <button
                        className={actionIconButtonClassName}
                        onClick={() => addPointAtCoords(newPointCoords)}
                        type="button"
                      >
                        Adicionar Ponto
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <label className={labelClassName}>
                          X
                          <input
                            className={fieldClassName}
                            disabled={!currentPoint}
                            onChange={(event) => updateSelectedPoint('x', event.target.value)}
                            placeholder="50.0"
                            type="number"
                            value={currentPoint?.x ?? ''}
                          />
                        </label>
                        <label className={labelClassName}>
                          Y
                          <input
                            className={fieldClassName}
                            disabled={!currentPoint}
                            onChange={(event) => updateSelectedPoint('y', event.target.value)}
                            placeholder="50.0"
                            type="number"
                            value={currentPoint?.y ?? ''}
                          />
                        </label>
                      </div>

                      <label className={labelClassName}>
                        Nome
                        <input
                          className={fieldClassName}
                          disabled={!currentPoint}
                          onChange={(event) => updateSelectedPoint('name', event.target.value)}
                          placeholder="Vila da Folha"
                          value={currentPoint?.name ?? ''}
                        />
                      </label>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <label className={labelClassName}>
                      Tipo
                      <select
                        className={fieldClassName}
                        disabled={!currentPoint}
                        onChange={(event) => updateSelectedPoint('type', event.target.value)}
                        value={selectedMarkerType}
                      >
                        {markerTypes.map((type) => (
                          <option key={type} value={type}>
                            {getMarkerTypeLabel(type)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={labelClassName}>
                      Icone
                      <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-2">
                        <span className="grid h-10 w-[52px] place-items-center rounded-md border border-white/10 bg-black/25">
                          {currentIconSrc ? (
                            <img
                              alt={currentPoint?.iconId ?? ''}
                              className="h-8 w-8 object-contain"
                              draggable={false}
                              src={currentIconSrc}
                            />
                          ) : null}
                        </span>
                        <select
                          className={fieldClassName}
                          disabled={!currentPoint}
                          onChange={(event) => updateSelectedPoint('iconId', event.target.value)}
                          value={currentPoint?.iconId ?? availableMarkerIcons[0]}
                        >
                          {availableMarkerIconOptions.map((icon) => (
                            <option key={icon.id} value={icon.id}>
                              {getMarkerIconLabel(icon.id)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className={labelClassName}>
                      Regiao
                      <select
                        className={fieldClassName}
                        disabled={!currentPoint}
                        onChange={(event) => updateSelectedPoint('regionId', event.target.value)}
                        value={currentPoint?.regionId ?? defaultMapRegion}
                      >
                        {mapRegions.map((region) => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={labelClassName}>
                      SubRegiao
                      <select
                        className={fieldClassName}
                        disabled={!currentPoint}
                        onChange={(event) => updateSelectedPoint('subRegionId', event.target.value)}
                        value={currentPoint?.subRegionId ?? ''}
                      >
                        <option value="">Nenhuma</option>
                        {getSubRegions((currentPoint?.regionId ?? defaultMapRegion) as MapRegionId).map((subRegion) => (
                          <option key={subRegion} value={subRegion}>
                            {subRegion}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className={labelClassName}>
                    Timer (segundos)
                    <input
                      className={fieldClassName}
                      disabled={!currentPoint}
                      onChange={(event) => updateSelectedPoint('timer', event.target.value)}
                      min="0"
                      placeholder="300"
                      step="1"
                      type="number"
                      value={currentPoint?.timer ?? ''}
                    />
                  </label>

                  <label className={labelClassName}>
                    Descricao
                    <textarea
                      className={`${fieldClassName} min-h-20 resize-y py-2 normal-case tracking-normal`}
                      disabled={!currentPoint}
                      onChange={(event) =>
                        updateSelectedPoint('description', event.target.value)
                      }
                      placeholder="Observacao sobre o ponto"
                      value={currentPoint?.description ?? ''}
                    />
                  </label>

                  <div className="grid gap-2">
                    <span className="font-mono text-[0.64rem] font-black uppercase tracking-[0.12em] text-[rgba(198,202,211,0.68)]">
                      Camadas
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {mapLayers.map((layerId) => (
                        <label
                          className="flex min-h-9 items-center gap-2 rounded-md border border-white/10 bg-black/25 px-2 text-xs text-[rgba(198,202,211,0.86)] transition hover:border-[rgba(0,214,163,0.24)] hover:bg-[rgba(0,214,163,0.06)]"
                          key={layerId}
                        >
                          <input
                            checked={currentPoint?.layerIds.includes(layerId) ?? false}
                            disabled={!currentPoint}
                            onChange={() => toggleSelectedLayer(layerId)}
                            type="checkbox"
                          />
                          {layerId}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 max-[420px]:grid-cols-3">
                  <button
                    aria-label={isEditingSavedPoint ? 'Atualizar point' : 'Salvar point'}
                    className={actionIconButtonClassName}
                    disabled={!currentPoint}
                    onClick={saveCurrentPoint}
                    title={isEditingSavedPoint ? 'Atualizar point' : 'Salvar point'}
                    type="button"
                  >
                    <MapPinned size={17} />
                  </button>

                  <button
                    aria-label="Copiar coordenada"
                    className={actionIconButtonClassName}
                    disabled={!currentPoint}
                    onClick={() =>
                      currentPoint
                        ? void handleCopy(formatPoint(currentPoint), 'Coordenada copiada')
                        : undefined
                    }
                    title="Copiar coordenada"
                    type="button"
                  >
                    <Route size={17} />
                  </button>

                  <button
                    aria-label="Copiar MapPoint"
                    className={actionIconButtonClassName}
                    disabled={!currentPoint}
                    onClick={() => void handleCopy(snippet, 'MapPoint copiado')}
                    title="Copiar MapPoint"
                    type="button"
                  >
                    <Crosshair size={17} />
                  </button>

                  <button
                    aria-label={isEditingSavedPoint ? 'Remover ponto' : 'Limpar ponto'}
                    className={actionIconButtonClassName}
                    disabled={!currentPoint}
                    onClick={() =>
                      currentPoint && isEditingSavedPoint
                        ? removeSavedPoint(currentPoint.id)
                        : clearCurrentPoint()
                    }
                    title={isEditingSavedPoint ? 'Remover ponto' : 'Limpar ponto'}
                    type="button"
                  >
                    <Trash2 size={17} />
                  </button>

                  <button
                    aria-label="Excluir ultimo salvo"
                    className={actionIconButtonClassName}
                    disabled={savedPoints.length === 0}
                    onClick={removeLastSavedPoint}
                    title="Excluir ultimo salvo"
                    type="button"
                  >
                    <Hourglass size={17} />
                  </button>
                </div>

                <div className={`${panelCardClassName} grid gap-3 p-3`}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="m-0 font-mono text-sm font-black uppercase tracking-[0.08em] text-white">
                      Cerco (Shift + Click)
                    </h2>
                    <button
                      className="font-mono text-[0.68rem] font-black uppercase tracking-[0.12em] text-[rgba(198,202,211,0.62)] hover:text-white"
                      onClick={clearFence}
                      type="button"
                    >
                      Limpar
                    </button>
                  </div>

                  <label className={labelClassName}>
                    Fence JSON
                    <textarea
                      className={`${fieldClassName} min-h-36 resize-y py-2 font-mono text-[0.72rem] leading-6`}
                      readOnly
                      value={fenceJson}
                    />
                  </label>

                  <button
                    className={actionIconButtonClassName}
                    disabled={fencePoints.length === 0}
                    onClick={() => void handleCopy(fenceJson, 'JSON do cerco copiado')}
                    type="button"
                  >
                    <Clipboard size={17} className="mr-2" />
                    Copiar JSON do Cerco
                  </button>
                </div>
              </>
            )}

            {activeTab === 'defaults' && (
              <div className={`${panelCardClassName} grid gap-3 p-3 border-[rgba(0,214,163,0.3)] bg-[rgba(0,214,163,0.03)]`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="m-0 font-mono text-xs font-black uppercase tracking-[0.08em] text-[var(--cyan)]">
                    Configurações Globais (Defaults)
                  </h2>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="font-mono text-[0.6rem] font-black uppercase text-[rgba(198,202,211,0.62)]">Ativo</span>
                    <input 
                      type="checkbox" 
                      checked={creationDefaults.useDefaults} 
                      onChange={(e) => updateCreationDefaults('useDefaults', e.target.checked)}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className={labelClassName}>
                    Tipo Padrão
                    <select
                      className={fieldClassName}
                      onChange={(event) => updateCreationDefaults('type', event.target.value)}
                      value={creationDefaults.type}
                    >
                      {markerTypes.map((type) => (
                        <option key={type} value={type}>
                          {getMarkerTypeLabel(type)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={labelClassName}>
                    Icone Padrão
                    <select
                      className={fieldClassName}
                      onChange={(event) => updateCreationDefaults('iconId', event.target.value)}
                      value={creationDefaults.iconId}
                    >
                      {getMarkerIconOptionsByType(creationDefaults.type).map((icon) => (
                        <option key={icon.id} value={icon.id}>
                          {getMarkerIconLabel(icon.id)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className={labelClassName}>
                    Região Padrão
                    <select
                      className={fieldClassName}
                      onChange={(event) => updateCreationDefaults('regionId', event.target.value)}
                      value={creationDefaults.regionId}
                    >
                      {mapRegions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={labelClassName}>
                    SubRegião Padrão
                    <select
                      className={fieldClassName}
                      onChange={(event) => updateCreationDefaults('subRegionId', event.target.value)}
                      value={creationDefaults.subRegionId}
                    >
                      <option value="">Nenhuma</option>
                      {getSubRegions(creationDefaults.regionId as MapRegionId).map((subRegion) => (
                        <option key={subRegion} value={subRegion}>
                          {subRegion}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'list' && (
              <>
                <div className={`${panelCardClassName} grid gap-3 p-3`}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="m-0 font-mono text-sm font-black uppercase tracking-[0.08em] text-white">
                      Export / Import
                    </h2>
                    <span className="font-mono text-[0.68rem] font-black uppercase tracking-[0.12em] text-[rgba(198,202,211,0.62)]">
                      {copyFeedback}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      aria-label="Copiar JSON"
                      className={actionIconButtonClassName}
                      disabled={savedPoints.length === 0}
                      onClick={() => void handleCopy(savedPointsJson, 'JSON copiado')}
                      title="Copiar JSON"
                      type="button"
                    >
                      <Clipboard size={17} className="mr-2" />
                      Copiar JSON
                    </button>
                    <button
                      className={actionIconButtonClassName}
                      onClick={async () => {
                        const zip = new JSZip()
                        markerTypes.forEach(type => {
                          const points = savedPoints.filter(p => p.type === type)
                          if (points.length === 0) return
                          const data = JSON.stringify(points.map((p) => ({
                            id: p.id, markerId: p.markerId, name: p.name, type: p.type,
                            iconId: p.iconId, regionId: p.regionId, subRegionId: p.subRegionId,
                            timer: p.timer, x: Number(p.x.toFixed(2)), y: Number(p.y.toFixed(2)),
                            description: p.description, layerIds: p.layerIds,
                          })), null, 2)
                          zip.file(`${type}.json`, data)
                        })
                        const content = await zip.generateAsync({ type: 'blob' })
                        const url = URL.createObjectURL(content)
                        const a = document.createElement('a')
                        a.href = url; a.download = `pontos-mapa.zip`; a.click(); URL.revokeObjectURL(url)
                        setCopyFeedback(`Arquivo pontos-mapa.zip gerado`)
                      }}
                      type="button"
                    >
                      Exportar .zip
                    </button>
                  </div>

                  <div className="grid gap-2">
                    <input
                      type="file"
                      id="import-files"
                      className="hidden"
                      accept=".json"
                      multiple
                      onChange={async (event) => {
                        const files = event.target.files
                        if (!files) return
                        const allPoints: (CalibrationPoint | PointDefinition)[] = []
                        const readFiles = Array.from(files).map(file => {
                          return new Promise<void>((resolve) => {
                            const reader = new FileReader()
                            reader.onload = (e) => {
                              try {
                                const result = e.target?.result as string;
                                const json = JSON.parse(result) as unknown
                                if (Array.isArray(json)) {
                                  allPoints.push(...(json as (CalibrationPoint | PointDefinition)[]))
                                } else if (typeof json === 'object' && json !== null) {
                                  Object.values(json as Record<string, (CalibrationPoint | PointDefinition)[]>).forEach((val) => {
                                    if (Array.isArray(val)) allPoints.push(...val)
                                  })
                                }
                              } catch (err) { console.error(err) }
                              resolve()
                            }
                            reader.readAsText(file)
                          })
                        })
                        await Promise.all(readFiles)
                        if (allPoints.length > 0) importPoints(allPoints)
                        event.target.value = ''
                      }}
                    />
                    <label
                      htmlFor="import-files"
                      className={cn(actionIconButtonClassName, "cursor-pointer")}
                    >
                      Importar JSONs
                    </label>
                  </div>
                </div>

                <div className={`${panelCardClassName} grid gap-3 p-3`}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="m-0 font-mono text-sm font-black uppercase tracking-[0.08em] text-white">
                      Pontos Salvos
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-[0.6rem] uppercase font-black tracking-[0.1em] text-[var(--cyan)] hover:text-white"
                        onClick={loadSystemPoints}
                        type="button"
                      >
                        Carregar sistema
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      className={cn(fieldClassName, "pl-9")}
                      onChange={(e) => setPointSearchQuery(e.target.value)}
                      placeholder="Buscar ponto por nome..."
                      value={pointSearchQuery}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                      <MousePointer2 size={14} />
                    </div>
                  </div>

                  <div className="grid max-h-[400px] gap-4 overflow-y-auto pr-1 custom-scrollbar">
                    {markerTypes.map((type) => {
                      const points = savedPoints.filter((p) => 
                        p.type === type && 
                        (p.name.toLowerCase().includes(pointSearchQuery.toLowerCase()) || pointSearchQuery === '')
                      )
                      if (points.length === 0) return null
                      return (
                        <div key={type} className="grid gap-2 border-b border-white/5 pb-3 last:border-0">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[0.6rem] font-black uppercase text-[var(--cyan)]">
                              {getMarkerTypeLabel(type)}
                            </span>
                            <span className="font-mono text-[0.55rem] text-white/40">
                              {points.length} itens
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {points.map((p) => (
                              <button
                                key={p.id}
                                className={cn(
                                  "flex items-center gap-2 truncate rounded-md border border-white/5 bg-white/5 px-2 py-1.5 text-left text-[0.65rem] text-white transition hover:border-[var(--cyan)]/30 hover:bg-white/10",
                                  currentPoint?.id === p.id && "border-[var(--cyan)] bg-[var(--cyan)]/10"
                                )}
                                onClick={() => selectSavedPoint(p.id)}
                                title={p.name}
                                type="button"
                              >
                                <img src={getMarkerIconSrc(p.iconId)} alt="" className="h-4 w-4 object-contain" />
                                <span className="truncate">{p.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                    {savedPoints.length > 0 && savedPoints.filter(p => p.name.toLowerCase().includes(pointSearchQuery.toLowerCase())).length === 0 && (
                      <div className="py-8 text-center text-[0.65rem] text-white/40">
                        Nenhum ponto encontrado para "{pointSearchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </section>
  )
}

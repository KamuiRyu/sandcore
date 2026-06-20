import { memo, useEffect, useRef, useState } from 'react'
import { uncompletableTypes } from '../../core/entities/MapConfig.entity'
import type { MapPointReference, SavedCustomPin } from '../../core/entities/MapRoute.entity'

interface MapCanvasLayerProps {
  officialPoints: (MapPointReference & { isCluster?: boolean; clusterCount?: number })[]
  customPins: (SavedCustomPin & { isCluster?: boolean; clusterCount?: number })[]
  icons: Map<string, HTMLImageElement>
  camera: { x: number; y: number; scale: number }
  mapViewportRef: React.RefObject<HTMLDivElement | null>
  selectedOfficialPointId: string | null
  selectedCustomPinId: string | null
  completedPins: Record<string, { 
    completedAt: string;
    subType?: string;
    status?: 'cooldown' | 'ready';
  }>
  mapSurfaceSize: { width: number; height: number }
  referencedOfficialPointIds?: Set<string>
  referencedCustomPinIds?: Set<string>
  globalTick: number
  showReadyAlerts: boolean
}

export const MapCanvasLayer = memo(function MapCanvasLayer({
  officialPoints,
  customPins,
  icons,
  camera,
  mapViewportRef,
  selectedOfficialPointId,
  selectedCustomPinId,
  completedPins,
  mapSurfaceSize,
  referencedOfficialPointIds = new Set(),
  referencedCustomPinIds = new Set(),
  globalTick,
  showReadyAlerts
}: MapCanvasLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

  // Observe viewport size changes
  useEffect(() => {
    const viewport = mapViewportRef.current
    if (!viewport) return

    const updateSize = () => {
      setViewportSize({
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      })
    }

    updateSize()

    const observer = new ResizeObserver(() => {
      // Use requestAnimationFrame to prevent "ResizeObserver loop limit exceeded" warning
      requestAnimationFrame(updateSize)
    })
    observer.observe(viewport)

    return () => {
      observer.disconnect()
    }
  }, [mapViewportRef])

  useEffect(() => {
    const canvas = canvasRef.current
    if (
      !canvas ||
      viewportSize.width === 0 ||
      viewportSize.height === 0 ||
      mapSurfaceSize.width === 0 ||
      mapSurfaceSize.height === 0
    )
      return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

    ctx.save()
    // Clear canvas
    ctx.clearRect(0, 0, viewportSize.width, viewportSize.height)
    ctx.scale(dpr, dpr)

    // Calculate surface bounding box relative to viewport mathematically
    // Center-origin scaling matches our transformOrigin: "center center"
    const left = viewportSize.width / 2 - (mapSurfaceSize.width * camera.scale) / 2 + camera.x
    const top = viewportSize.height / 2 - (mapSurfaceSize.height * camera.scale) / 2 + camera.y
    const width = mapSurfaceSize.width * camera.scale
    const height = mapSurfaceSize.height * camera.scale

    const drawPin = (
      p: {
        x: number
        y: number
        iconId: string
        id: string
        type?: string
        color?: string
        isCluster?: boolean
        clusterCount?: number
      },
      isCustom: boolean
    ) => {
      const pinState = completedPins[p.id] as { completedAt: string; subType?: string; status?: 'cooldown' | 'ready' } | undefined
      // Use subtype icon if in cooldown, otherwise use base icon
      const iconToUse = (pinState?.subType && pinState.status !== 'ready') ? pinState.subType : p.iconId
      const img = icons.get(iconToUse)
      if (!img) return

      // Coordinate projection using mathematically calculated bounding box
      const x = left + (p.x / 100) * width
      const y = top + (p.y / 100) * height

      // Calculate size that grows slightly with zoom
      const pinSize = 32 * Math.pow(camera.scale, 0.12)
      const isSelected = isCustom ? p.id === selectedCustomPinId : p.id === selectedOfficialPointId
      const isCompleted = !!pinState && pinState.status !== 'ready'
      const isReady = pinState?.status === 'ready'
      const isInRoute = isCustom ? referencedCustomPinIds.has(p.id) : referencedOfficialPointIds.has(p.id)

      ctx.save()

      if (isCompleted) {
        if (p.type === 'merchant') {
          // Mercador marcado significa que ele está presente agora, mantemos a cor e adicionamos um brilho pulsante
          const pulse = Math.sin(globalTick / 200) * 5 + 20
          ctx.shadowBlur = pulse
          ctx.shadowColor = '#00d6a3'
          
          // Desenhar um anel giratório
          ctx.save()
          ctx.strokeStyle = '#00d6a3'
          ctx.lineWidth = 2.5 * Math.pow(camera.scale, 0.1)
          ctx.setLineDash([5, 10])
          ctx.lineDashOffset = -(globalTick / 40)
          ctx.beginPath()
          ctx.arc(x, y, pinSize / 1.5, 0, Math.PI * 2)
          ctx.stroke()
          ctx.restore()
        } else {
          ctx.globalAlpha = 0.4
          ctx.filter = 'grayscale(100%)'
        }
      }

      if (isSelected) {
        ctx.shadowBlur = 15
        ctx.shadowColor = p.color || '#00d6a3'
      }

      ctx.drawImage(img, x - pinSize / 2, y - pinSize / 2, pinSize, pinSize)

      // Se for recurso padrão (Pedra/Cogumelo comum) OU uma categoria estática (Vila, Arena, etc), desenhar um CHECK verde sobre o ícone
      // Nota: Mercador é estático mas quando marcado indica presença ativa, por isso não desenhamos o check nele
      const iconIdToCheck = pinState?.subType || p.iconId
      const isDefaultResource = iconIdToCheck === 'ore_1' || iconIdToCheck === 'mushroom_1'
      
      // Buscar o tipo real do ponto no officialPoints para verificar se é estático (uncompletable)
      // Nota: p.id pode ser cluster, mas drawPin é chamado para pontos individuais
      const isStaticCategory = p.type ? uncompletableTypes.includes(p.type as any) : false
      
      if ((isDefaultResource || (isStaticCategory && p.type !== 'merchant')) && isCompleted) {
          ctx.save()
          ctx.globalAlpha = 1
          ctx.filter = 'none'
          ctx.strokeStyle = '#00d6a3'
          ctx.lineWidth = 3.5 * Math.pow(camera.scale, 0.1)
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          
          const checkSize = pinSize / 2
          ctx.beginPath()
          ctx.moveTo(x - checkSize/2.2, y)
          ctx.lineTo(x - checkSize/8, y + checkSize/3)
          ctx.lineTo(x + checkSize/2, y - checkSize/3)
          ctx.stroke()
          ctx.restore()
      }

      // Badge 'PRESENTE' para mercadores ativos
      if (isCompleted && p.type === 'merchant') {
          ctx.save()
          ctx.globalAlpha = 1
          ctx.filter = 'none'
          
          const labelSize = 8 * Math.pow(camera.scale, 0.1)
          const labelY = y - pinSize / 1.7
          
          ctx.fillStyle = '#00d6a3'
          ctx.font = `black ${labelSize}px monospace`
          const text = "PRESENTE"
          const metrics = ctx.measureText(text)
          const paddingH = 6
          const paddingV = 3
          
          // Background do label (rounded rect simulado)
          ctx.shadowBlur = 10
          ctx.shadowColor = 'rgba(0,0,0,0.5)'
          ctx.beginPath()
          const rw = metrics.width + paddingH * 2
          const rh = labelSize + paddingV * 2
          const rx = x - rw / 2
          const ry = labelY - rh
          
          ctx.roundRect(rx, ry, rw, rh, 4)
          ctx.fill()
          
          // Texto
          ctx.shadowBlur = 0
          ctx.fillStyle = '#000'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(text, x, labelY - rh / 2)
          ctx.restore()
      }

      // Selo de Pronto (Ready Badge)
      // Only show if ready AND not already highlighted by a route AND NOT a standard resource/merchant AND settings allow it
      const isStandard = iconIdToCheck === 'ore_1' || iconIdToCheck === 'mushroom_1'
      const isMerchant = p.type === 'merchant'
      
      if (isReady && !isInRoute && !isStandard && !isMerchant && showReadyAlerts !== false) {
        ctx.globalAlpha = 1
        ctx.filter = 'none'
        
        const badgeSize = 9 * Math.pow(camera.scale, 0.1)
        const badgeX = x + pinSize / 3
        const badgeY = y - pinSize / 3
        
        // Glow effect for Ready status (more intense orange glow)
        ctx.shadowBlur = 15
        ctx.shadowColor = '#ff9f43'
        
        // White border for high contrast
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(badgeX, badgeY, badgeSize + 1.5, 0, Math.PI * 2)
        ctx.fill()

        // Main badge circle (Vibrant Orange)
        ctx.fillStyle = '#ff9f43'
        ctx.beginPath()
        ctx.arc(badgeX, badgeY, badgeSize, 0, Math.PI * 2)
        ctx.fill()

        ctx.shadowBlur = 0
        ctx.fillStyle = '#000'
        ctx.font = `black ${badgeSize * 1.3}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('!', badgeX, badgeY)
      }

      if (p.isCluster) {
        ctx.globalAlpha = 1
        ctx.filter = 'none'
        
        // Position cluster count badge slightly offset to bottom right
        const badgeSize = 10 * Math.pow(camera.scale, 0.1)
        const badgeX = x + pinSize / 3
        const badgeY = y + pinSize / 3
        const badgeRadius = badgeSize

        ctx.fillStyle = '#00d6a3'
        ctx.beginPath()
        ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#000'
        ctx.font = `bold ${badgeSize}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(p.clusterCount), badgeX, badgeY)
      }

      ctx.restore()
    }

    officialPoints.forEach((p) => drawPin(p, false))
    customPins.forEach((p) => drawPin(p, true))

    ctx.restore()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    officialPoints,
    customPins,
    icons,
    camera,
    viewportSize,
    mapSurfaceSize,
    selectedOfficialPointId,
    selectedCustomPinId,
    completedPins,
    referencedCustomPinIds,
    referencedOfficialPointIds
  ])

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  return (
    <canvas
      ref={canvasRef}
      width={viewportSize.width * dpr}
      height={viewportSize.height * dpr}
      className="pointer-events-none absolute inset-0"
      style={{ width: '100%', height: '100%', zIndex: 15 }}
    />
  )
})

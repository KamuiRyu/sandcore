import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import {
  mapAspectRatio,
  maxMapZoom,
  minMapZoom,
  zoomButtonFactor,
} from '../../core/entities/MapConfig.entity'
import type { DragState, MapCamera } from '../../core/entities/MapCalibration.entity'
import {
  clamp,
  clampMapCamera,
  type MapSurfaceSize,
} from '../../core/usecases/ClampMapCamera.usecase'
import type { MapCoords } from '../../core/entities/MapCalibration.entity'

type ZoomAnchor = {
  clientX: number
  clientY: number
}

type UseInteractiveMapOptions = {
  onMapTap?: (coords: MapCoords, scale?: number, mapSurfaceSize?: MapSurfaceSize) => void
}

export function useInteractiveMap(options: UseInteractiveMapOptions = {}) {
  const mapViewportRef = useRef<HTMLDivElement | null>(null)
  const mapSurfaceRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const lastPointerClientRef = useRef<ZoomAnchor | null>(null)
  const [camera, setCamera] = useState<MapCamera>(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    return { scale: isMobile ? 2.5 : 1, x: 0, y: 0 }
  })
  const [dragCamera, setDragCamera] = useState<MapCamera | null>(null)
  const [zoomDraftScale, setZoomDraftScale] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [mapSurfaceSize, setMapSurfaceSize] = useState<MapSurfaceSize>({
    height: 0,
    width: 0,
  })
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })
  const hasInitializedCameraRef = useRef(false)
  const cameraRef = useRef(camera)

  useEffect(() => {
    cameraRef.current = camera
  }, [camera])

  const displayedCamera = dragCamera ?? camera
  const displayedZoomScale = zoomDraftScale ?? camera.scale
  const zoomTrackProgress = clamp(
    (displayedZoomScale - minMapZoom) / (maxMapZoom - minMapZoom),
    0,
    1,
  )
  const zoomThumbBottom = 4 + zoomTrackProgress * 88

  const clampCamera = useCallback((nextCamera: MapCamera): MapCamera => {
    return clampMapCamera(nextCamera, mapSurfaceSize)
  }, [mapSurfaceSize])

  // Used by updateZoom to find the anchor point in map-viewport space
  const getViewportCenteredRect = useCallback(() => {
    const viewport = mapViewportRef.current

    if (!viewport || !mapSurfaceSize.width || !mapSurfaceSize.height) {
      return null
    }

    const viewportRect = viewport.getBoundingClientRect()

    return {
      height: mapSurfaceSize.height,
      left: viewportRect.left + (viewportRect.width - mapSurfaceSize.width) / 2,
      top: viewportRect.top + (viewportRect.height - mapSurfaceSize.height) / 2,
      width: mapSurfaceSize.width,
    }
  }, [mapSurfaceSize])

  function getCoordinateFromPointer(
    event: Pick<PointerEvent<HTMLDivElement>, 'clientX' | 'clientY'>,
    currentCamera: MapCamera,
  ): MapCoords | null {
    const surface = mapSurfaceRef.current

    if (!surface || !mapSurfaceSize.width || !mapSurfaceSize.height) {
      return null
    }

    // Read the actual on-screen rect of the map surface element.
    // getBoundingClientRect already includes the CSS transform (translate + scale),
    // so rect.left/top reflect where the surface really is on screen.
    const rect = surface.getBoundingClientRect()

    // The surface is rendered at `currentCamera.scale` via CSS transform.
    // rect.width = mapSurfaceSize.width * scale, etc.
    // To convert a screen pointer to a map-percentage coordinate we need
    // the unscaled surface dimensions — we already have those in mapSurfaceSize.
    const scale = currentCamera.scale

    // Position of the pointer relative to the surface's on-screen top-left corner.
    const screenX = event.clientX - rect.left
    const screenY = event.clientY - rect.top

    // Convert from scaled screen pixels to unscaled map pixels.
    const mapX = screenX / scale
    const mapY = screenY / scale

    // Convert to percentage of the unscaled map surface size.
    const x = clamp((mapX / mapSurfaceSize.width) * 100, 0, 100)
    const y = clamp((mapY / mapSurfaceSize.height) * 100, 0, 100)

    return { x, y }
  }

  useEffect(() => {
    const viewportElement = mapViewportRef.current

    if (!viewportElement) {
      return
    }

    const stableViewportElement = viewportElement

    function updateMapSurfaceSize() {
      const viewportWidth = stableViewportElement.clientWidth
      const viewportHeight = stableViewportElement.clientHeight

      if (!viewportWidth || !viewportHeight) {
        return
      }

      setViewportSize({ width: viewportWidth, height: viewportHeight })

      const viewportAspectRatio = viewportWidth / viewportHeight
      let newSize: MapSurfaceSize

      if (viewportAspectRatio > mapAspectRatio) {
        const height = viewportHeight
        const width = height * mapAspectRatio
        newSize = { height, width }
      } else {
        const width = viewportWidth
        const height = width / mapAspectRatio
        newSize = { height, width }
      }

      setMapSurfaceSize(newSize)

      if (!hasInitializedCameraRef.current) {
        hasInitializedCameraRef.current = true
        const isMobile = viewportWidth < 768
        if (isMobile) {
          const coverScale = Math.max(2.5, mapAspectRatio / viewportAspectRatio)
          setCamera({
            scale: coverScale,
            x: 0,
            y: 0,
          })
        }
      }
    }

    updateMapSurfaceSize()

    const resizeObserver = new ResizeObserver(() => {
      updateMapSurfaceSize()
    })

    resizeObserver.observe(stableViewportElement)

    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    function handleResize() {
      setDragCamera(null)
      setCamera((currentCamera) =>
        clampMapCamera(currentCamera, mapSurfaceSize),
      )
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [mapSurfaceSize])

  function getZoomAnchor(anchor?: ZoomAnchor) {
    if (anchor) {
      return anchor
    }

    if (lastPointerClientRef.current) {
      return lastPointerClientRef.current
    }

    const surface = mapSurfaceRef.current

    if (!surface) {
      return null
    }

    const rect = surface.getBoundingClientRect()

    return {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    }
  }

  const updateZoom = useCallback((nextScale: number, anchor?: ZoomAnchor) => {
    const resolvedAnchor = getZoomAnchor(anchor)
    const stableSurfaceRect = getViewportCenteredRect()

    setDragCamera(null)
    setZoomDraftScale(null)

    if (!resolvedAnchor || !stableSurfaceRect) {
      setCamera((currentCamera) =>
        clampCamera({
          ...currentCamera,
          scale: nextScale,
        }),
      )
      return
    }

    setCamera((currentCamera) => {
      const centerX = stableSurfaceRect.width / 2
      const centerY = stableSurfaceRect.height / 2
      const pointerX = resolvedAnchor.clientX - stableSurfaceRect.left
      const pointerY = resolvedAnchor.clientY - stableSurfaceRect.top
      const targetScale = clamp(nextScale, minMapZoom, maxMapZoom)
      const mapX =
        (pointerX - centerX - currentCamera.x) / currentCamera.scale + centerX
      const mapY =
        (pointerY - centerY - currentCamera.y) / currentCamera.scale + centerY

      return clampCamera({
        scale: targetScale,
        x: pointerX - centerX - (mapX - centerX) * targetScale,
        y: pointerY - centerY - (mapY - centerY) * targetScale,
      })
    })
  }, [clampCamera, getViewportCenteredRect]) // Depend on size since getViewportCenteredRect uses it

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return
    }

    lastPointerClientRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
    }

    mapSurfaceRef.current?.setPointerCapture(event.pointerId)
    dragStateRef.current = {
      hasMoved: false,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: camera.x,
      startY: camera.y,
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    lastPointerClientRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
    }

    const dragState = dragStateRef.current

    if (!dragState) {
      return
    }

    const dx = event.clientX - dragState.startClientX
    const dy = event.clientY - dragState.startClientY
    const didMove = Math.hypot(dx, dy) > 4

    if (!didMove) {
      return
    }

    dragState.hasMoved = true
    setIsDragging(true)
    setDragCamera(
      clampCamera({
        scale: camera.scale,
        x: dragState.startX + dx,
        y: dragState.startY + dy,
      }),
    )
  }

  function endPointerInteraction(pointerId: number, clientX: number, clientY: number) {
    const dragState = dragStateRef.current

    if (dragState?.pointerId !== pointerId) {
      return
    }

    mapSurfaceRef.current?.releasePointerCapture(pointerId)

    if (dragState.hasMoved) {
      const dx = clientX - dragState.startClientX
      const dy = clientY - dragState.startClientY

      setCamera(
        clampCamera({
          scale: camera.scale,
          x: dragState.startX + dx,
          y: dragState.startY + dy,
        }),
      )
    } else {
      const coords = getCoordinateFromPointer({ clientX, clientY }, camera)

      if (coords) {
        options.onMapTap?.(coords, camera.scale, mapSurfaceSize)
      }
    }

    dragStateRef.current = null
    setDragCamera(null)
    setIsDragging(false)
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    endPointerInteraction(event.pointerId, event.clientX, event.clientY)
  }

  function handlePointerCancel(event: PointerEvent<HTMLDivElement>) {
    endPointerInteraction(event.pointerId, event.clientX, event.clientY)
  }

  useEffect(() => {
    const surface = mapSurfaceRef.current
    if (!surface) return

    function onWheel(event: globalThis.WheelEvent) {
      event.preventDefault()
      lastPointerClientRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      }
      // Geometric zoom makes speed consistent across all zoom levels
      const zoomSensitivity = 0.002
      const nextScale = cameraRef.current.scale * Math.exp(-event.deltaY * zoomSensitivity)
      updateZoom(nextScale, {
        clientX: event.clientX,
        clientY: event.clientY,
      })
    }

    surface.addEventListener('wheel', onWheel, { passive: false })
    return () => surface.removeEventListener('wheel', onWheel)
    // We re-run when surface changes or size changes to ensure attachment
  }, [mapSurfaceSize, updateZoom])

  function handlePointerLeave() {
    lastPointerClientRef.current = null
  }

  function zoomIn() {
    updateZoom(displayedZoomScale * zoomButtonFactor)
  }

  function zoomOut() {
    updateZoom(displayedZoomScale / zoomButtonFactor)
  }

  function resetCamera() {
    setDragCamera(null)
    setZoomDraftScale(null)
    const viewport = mapViewportRef.current
    if (viewport) {
      const isMobile = viewport.clientWidth < 768
      if (isMobile) {
        const viewportAspectRatio = viewport.clientWidth / viewport.clientHeight
        const coverScale = Math.max(2.5, mapAspectRatio / viewportAspectRatio)
        setCamera({ scale: coverScale, x: 0, y: 0 })
        return
      }
    }
    setCamera({ scale: 1, x: 0, y: 0 })
  }

  function getZoomScaleFromPointer(event: PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const progress = clamp((rect.bottom - event.clientY) / rect.height, 0, 1)

    return minMapZoom + progress * (maxMapZoom - minMapZoom)
  }

  function handleZoomPointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    setZoomDraftScale(getZoomScaleFromPointer(event))
  }

  function handleZoomPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return
    }

    setZoomDraftScale(getZoomScaleFromPointer(event))
  }

  function handleZoomPointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return
    }

    const nextScale = getZoomScaleFromPointer(event)

    event.currentTarget.releasePointerCapture(event.pointerId)
    setZoomDraftScale(null)
    updateZoom(nextScale)
  }

  function handleZoomPointerCancel(event: PointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    setZoomDraftScale(null)
  }

  function focusCoords(coords: MapCoords) {
    const surfaceSize = mapSurfaceSize
    if (!surfaceSize || surfaceSize.width === 0) return

    const centerX = surfaceSize.width / 2
    const centerY = surfaceSize.height / 2
    const surfaceX = (coords.x / 100) * surfaceSize.width
    const surfaceY = (coords.y / 100) * surfaceSize.height

    const nextScale = Math.max(camera.scale, 2.5)
    const targetX = -(surfaceX - centerX) * nextScale
    const targetY = -(surfaceY - centerY) * nextScale

    setDragCamera(null)
    setZoomDraftScale(null)
    setCamera(
      clampCamera({
        scale: nextScale,
        x: targetX,
        y: targetY,
      }),
    )
  }

  return {
    camera,
    displayedCamera,
    displayedZoomScale,
    focusCoords,
    getCoordinateFromPointer,
    handlePointerCancel,
    handlePointerDown,
    handlePointerLeave,
    handlePointerMove,
    handlePointerUp,
    handleZoomPointerCancel,
    handleZoomPointerDown,
    handleZoomPointerMove,
    handleZoomPointerUp,
    isDragging,
    mapSurfaceRef,
    mapSurfaceSize,
    mapViewportRef,
    viewportSize,
    resetCamera,
    zoomIn,
    zoomOut,
    zoomThumbBottom,
  }
}

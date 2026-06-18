import { clamp } from './ClampMapCamera.usecase'
import type { MapCamera, MapCoords } from '../entities/MapCalibration.entity'

export type PointerViewportRect = {
  height: number
  left: number
  top: number
  width: number
}

export type PointerClientPosition = {
  x: number
  y: number
}

export function resolveMapPointerCoords(
  pointerPosition: PointerClientPosition,
  viewportRect: PointerViewportRect,
  camera: MapCamera,
): MapCoords {
  const centerX = viewportRect.width / 2
  const centerY = viewportRect.height / 2
  const pointerX = pointerPosition.x - viewportRect.left
  const pointerY = pointerPosition.y - viewportRect.top
  const mapX = (pointerX - centerX - camera.x) / camera.scale + centerX
  const mapY = (pointerY - centerY - camera.y) / camera.scale + centerY
  const x = (mapX / viewportRect.width) * 100
  const y = (mapY / viewportRect.height) * 100

  return {
    x: clamp(x, 0, 100),
    y: clamp(y, 0, 100),
  }
}

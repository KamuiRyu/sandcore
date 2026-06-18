import { maxMapZoom, minMapZoom } from '../entities/MapConfig.entity'
import type { MapCamera } from '../entities/MapCalibration.entity'

export type MapSurfaceSize = {
  height: number
  width: number
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function clampMapCamera(
  nextCamera: MapCamera,
  surfaceSize: MapSurfaceSize | null,
): MapCamera {
  const scale = clamp(nextCamera.scale, minMapZoom, maxMapZoom)

  if (!surfaceSize) {
    return { scale, x: 0, y: 0 }
  }

  const maxX = (surfaceSize.width * scale - surfaceSize.width) / 2
  const maxY = (surfaceSize.height * scale - surfaceSize.height) / 2

  return {
    scale,
    x: clamp(nextCamera.x, -maxX, maxX),
    y: clamp(nextCamera.y, -maxY, maxY),
  }
}

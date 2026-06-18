import type { CalibrationPoint } from '../entities/MapCalibration.entity'

export function formatCoord(value: number | string) {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return (isNaN(num) ? 0 : num).toFixed(2)
}

export function formatPoint(point: CalibrationPoint) {
  return `{ x: ${formatCoord(point.x)}, y: ${formatCoord(point.y)} }`
}

export function createMapPointSnippet(point: CalibrationPoint) {
  const timerValue = point.timer ?? 'null'
  const subRegionValue = point.subRegionId ? `\n  subRegionId: '${point.subRegionId}',` : ''

  return `{
  id: '${point.markerId}',
  name: '${point.name.replace(/'/g, "\\'")}',
  type: '${point.type}',
  iconId: '${point.iconId}',
  regionId: '${point.regionId}',${subRegionValue}
  timer: ${timerValue},
  x: ${formatCoord(point.x)},
  y: ${formatCoord(point.y)},
  description: '${point.description.replace(/'/g, "\\'")}',
  layerIds: ${formatStringArray(point.layerIds)},
},`
}

function formatStringArray(values: string[]) {
  return `[${values.map((value) => `'${value.replace(/'/g, "\\'")}'`).join(', ')}]`
}

function toMapPointJson(point: CalibrationPoint) {
  return {
    id: point.markerId,
    name: point.name,
    type: point.type,
    iconId: point.iconId,
    regionId: point.regionId,
    subRegionId: point.subRegionId,
    timer: point.timer,
    x: Number(formatCoord(point.x)),
    y: Number(formatCoord(point.y)),
    description: point.description,
    layerIds: point.layerIds,
  }
}

export function createMapPointsJson(points: CalibrationPoint[]) {
  return JSON.stringify(points.map(toMapPointJson), null, 2)
}

export function createCategorizedMapPointsJson(points: CalibrationPoint[]) {
  const categorized = points.reduce((acc, point) => {
    if (!acc[point.type]) {
      acc[point.type] = []
    }
    acc[point.type].push(toMapPointJson(point))
    return acc
  }, {} as Record<string, ReturnType<typeof toMapPointJson>[]>)
  return JSON.stringify(categorized, null, 2)
}

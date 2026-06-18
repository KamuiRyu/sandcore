import type {
  CalibrationPoint,
  EditablePointField,
  MapLayerId,
  MapMarkerIconId,
  MapMarkerType,
} from '../entities/MapCalibration.entity'
import { getDefaultMarkerIcon } from '../entities/MapConfig.entity'

export function slugifyMapPointName(value: string) {
  const normalizedValue = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  const slug = normalizedValue
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'ponto'
}

export function updateCalibrationPointField(
  point: CalibrationPoint,
  field: EditablePointField,
  value: string,
): CalibrationPoint {
  if (field === 'type') {
    const nextType = value as MapMarkerType

    return {
      ...point,
      iconId: getDefaultMarkerIcon(nextType),
      type: nextType,
    }
  }

  if (field === 'iconId') {
    return { ...point, iconId: value as MapMarkerIconId }
  }

  if (field === 'name') {
    return {
      ...point,
      markerId: slugifyMapPointName(value),
      name: value,
    }
  }

  if (field === 'timer') {
    const trimmedValue = value.trim()

    return {
      ...point,
      timer: trimmedValue ? Number.parseInt(trimmedValue, 10) || 0 : null,
    }
  }

  if (field === 'x' || field === 'y') {
    return {
      ...point,
      [field]: parseFloat(value) || 0,
    }
  }

  return {
    ...point,
    [field]: value,
  }
}

export function toggleCalibrationPointLayer(
  point: CalibrationPoint,
  layerId: MapLayerId,
): CalibrationPoint {
  const nextLayerIds = point.layerIds.includes(layerId)
    ? point.layerIds.filter((currentLayerId) => currentLayerId !== layerId)
    : [...point.layerIds, layerId]

  return {
    ...point,
    layerIds: nextLayerIds.length > 0 ? nextLayerIds : ['officialPins'],
  }
}

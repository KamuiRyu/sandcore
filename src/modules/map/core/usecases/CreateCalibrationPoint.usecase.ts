import type { CalibrationPoint, MapCoords } from '../entities/MapCalibration.entity'
import {
  defaultMapRegion,
  defaultMarkerType,
  getDefaultMarkerIcon,
} from '../entities/MapConfig.entity'
import { slugifyMapPointName } from './UpdateCalibrationPoint.usecase'

export function createCalibrationPoint(
  id: string,
  coords: MapCoords,
): CalibrationPoint {
  const name = `Ponto ${id}`

  return {
    description: '',
    iconId: getDefaultMarkerIcon(defaultMarkerType),
    id,
    layerIds: ['officialPins'],
    markerId: slugifyMapPointName(name),
    name,
    regionId: defaultMapRegion,
    timer: null,
    type: defaultMarkerType,
    ...coords,
  }
}

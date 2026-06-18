import type { CalibrationPoint, PointDefinition } from './MapCalibration.entity'
import { vilaPoints } from './points/vila.points'
import { arenaPoints } from './points/arena.points'
import { fishingPoints } from './points/fishing.points'
import { housePoints } from './points/house.points'
import { restaurantPoints } from './points/restaurant.points'
import { bankPoints } from './points/bank.points'
import { mushroomPoints } from './points/mushroom.points'
import { merchantPoints } from './points/merchant.points'
import { orePoints } from './points/ore.points'
import { stickPoints } from './points/stick.points'
import { hibiscusPoints } from './points/hibiscus.points'

const addId = (point: PointDefinition, index: number): CalibrationPoint => {
  // Use a combination of type, coordinates and global index for absolute uniqueness
  const baseId = `${point.type}-${Math.round(point.x * 100)}-${Math.round(point.y * 100)}`
  
  return {
    ...point,
    id: `${baseId}-${index}`,
  }
}

export const mapPoints: CalibrationPoint[] = [
  ...vilaPoints,
  ...arenaPoints,
  ...fishingPoints,
  ...housePoints,
  ...restaurantPoints,
  ...bankPoints,
  ...mushroomPoints,
  ...merchantPoints,
  ...orePoints,
  ...stickPoints,
  ...hibiscusPoints,
].map(addId)

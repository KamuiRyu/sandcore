import { z } from 'zod'
import type { CustomRoute } from '../entities/MapRoute.entity'

const customPinSchema = z.object({
  color: z.string().min(1).max(32),
  description: z.string().max(1000).optional(),
  iconId: z.string().min(1).max(80),
  id: z.string().min(1).max(120),
  name: z.string().max(80),
  tags: z.array(z.string().min(1).max(40)).max(24),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  imageUrl: z.string().max(2000000).optional(),
  isPlaced: z.boolean().optional(),
  checked: z.boolean().optional(),
})

const routeCheckpointSchema = z.object({
  customPinId: z.string().min(1).max(120).optional(),
  id: z.string().min(1).max(120),
  label: z.string().max(40).optional(),
  pointId: z.string().min(1).max(120).optional(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
})

export const mapRouteSchema = z.object({
  checkpoints: z.array(routeCheckpointSchema).max(200),
  color: z.string().min(1).max(32),
  createdAt: z.string().min(1),
  customPins: z.array(customPinSchema).max(200),
  description: z.string().max(1000).optional(),
  id: z.string().min(1).max(120),
  name: z.string().max(80),
  updatedAt: z.string().min(1),
})

export function validateMapRoute(route: CustomRoute): CustomRoute {
  return mapRouteSchema.parse(route)
}

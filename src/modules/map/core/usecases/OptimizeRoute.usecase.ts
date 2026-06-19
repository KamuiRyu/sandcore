import type { RouteCheckpoint } from '../entities/MapRoute.entity'

/**
 * Calculates Euclidean distance between two points
 */
function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

/**
 * Optimizes the route using Nearest Neighbor algorithm.
 * Starts from the first checkpoint or the center if not specified, 
 * and iteratively finds the closest unvisited checkpoint.
 */
export function optimizeRoute(checkpoints: RouteCheckpoint[]): RouteCheckpoint[] {
  if (!checkpoints || checkpoints.length <= 1) {
    return checkpoints
  }

  const unvisited = [...checkpoints]
  const optimized: RouteCheckpoint[] = []

  // Start with the first point (could be arbitrary or defined by user)
  let current = unvisited.shift()!
  optimized.push(current)

  while (unvisited.length > 0) {
    let nearestIndex = 0
    let minDistance = Infinity

    for (let i = 0; i < unvisited.length; i++) {
      const distance = getDistance(current, unvisited[i])
      if (distance < minDistance) {
        minDistance = distance
        nearestIndex = i
      }
    }

    current = unvisited[nearestIndex]
    optimized.push(current)
    unvisited.splice(nearestIndex, 1)
  }

  return optimized
}

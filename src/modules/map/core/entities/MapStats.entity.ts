export interface MapCollectionStats {
  id?: string
  ore_count: Record<string, number>
  mushroom_count: Record<string, number>
  plant_count: Record<string, number>
  stick_count: number
  date: string // Formato YYYY-MM-DD ou "total"
}

export interface AggregatedStats {
  today: MapCollectionStats
  weekly: MapCollectionStats
  monthly: MapCollectionStats
  total: MapCollectionStats
}

export const createEmptyStats = (date: string = ''): MapCollectionStats => ({
  ore_count: {},
  mushroom_count: {},
  plant_count: {},
  stick_count: 0,
  date: date || new Date().toISOString().split('T')[0],
})

export function sumStats(statsList: MapCollectionStats[]): MapCollectionStats {
  const result = createEmptyStats('total')
  
  statsList.forEach(s => {
    // Sum ores
    Object.entries(s.ore_count || {}).forEach(([id, count]) => {
      result.ore_count[id] = (result.ore_count[id] || 0) + (count || 0)
    })
    // Sum mushrooms
    Object.entries(s.mushroom_count || {}).forEach(([id, count]) => {
      result.mushroom_count[id] = (result.mushroom_count[id] || 0) + (count || 0)
    })
    // Sum plants
    Object.entries(s.plant_count || {}).forEach(([id, count]) => {
      result.plant_count[id] = (result.plant_count[id] || 0) + (count || 0)
    })
    // Sum sticks
    result.stick_count += (s.stick_count || 0)
  })

  return result
}

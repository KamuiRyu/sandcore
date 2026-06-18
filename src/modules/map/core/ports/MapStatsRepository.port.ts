import type { MapCollectionStats } from '../entities/MapStats.entity'

export interface MapStatsRepository {
  /**
   * Obtém todos os registros de estatísticas de um usuário.
   */
  getStats(userId: string): Promise<MapCollectionStats[]>

  /**
   * Salva ou atualiza as estatísticas de um dia específico para o usuário.
   * Geralmente chamado para "Lazy Sync".
   */
  saveDailyStats(userId: string, stats: MapCollectionStats): Promise<void>
}

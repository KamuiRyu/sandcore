import type { MapFeedback } from '../entities/MapFeedback.entity'
import type { MapFeedbackRepository } from '../ports/MapFeedbackRepository.port'

export class SubmitMapFeedbackUseCase {
  private repository: MapFeedbackRepository

  constructor(repository: MapFeedbackRepository) {
    this.repository = repository
  }

  async execute(data: MapFeedback): Promise<void> {
    if (data.type !== 'new_point' && !data.point_id) {
      throw new Error('ID do ponto é obrigatório para atualizações ou bugs.')
    }

    if (data.point_id && !data.reason) {
      throw new Error('Motivo é obrigatório para pontos existentes.')
    }

    if (data.type === 'new_point' && !data.marker_type) {
      throw new Error('Tipo do marcador é sugerido para novos pontos.')
    }

    return this.repository.submitFeedback(data)
  }
}

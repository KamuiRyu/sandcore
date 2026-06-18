import type { MapFeedback } from '../entities/MapFeedback.entity'

export interface MapFeedbackRepository {
  submitFeedback(data: MapFeedback): Promise<void>
}

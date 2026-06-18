import { pb } from '../../../../lib/pocketbase'
import type { MapFeedback } from '../../core/entities/MapFeedback.entity'
import type { MapFeedbackRepository } from '../../core/ports/MapFeedbackRepository.port'

export class PocketBaseMapFeedbackRepository implements MapFeedbackRepository {
  async submitFeedback(data: MapFeedback): Promise<void> {
    const formData = new FormData()
    
    formData.append('type', data.type)
    formData.append('x', data.x.toString())
    formData.append('y', data.y.toString())
    formData.append('status', 'pending')

    if (data.point_id) formData.append('point_id', data.point_id)
    if (data.marker_type) formData.append('marker_type', data.marker_type)
    if (data.observation) formData.append('observation', data.observation)
    if (data.reason) formData.append('reason', data.reason)
    if (data.user_id) formData.append('user_id', data.user_id)
    
    if (data.image) {
      formData.append('image', data.image)
    }

    await pb.collection('map_feedbacks').create(formData)
  }
}

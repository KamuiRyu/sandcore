export type MapFeedbackType = 'new_point' | 'update' | 'bug'
export type MapFeedbackStatus = 'pending' | 'approved' | 'rejected' | 'implemented'

export interface MapFeedback {
  id?: string
  type: MapFeedbackType
  x: number
  y: number
  point_id?: string
  marker_type?: string
  image?: File | null
  observation?: string
  reason?: string
  status?: MapFeedbackStatus
  user_id?: string
  createdAt?: string
  updatedAt?: string
}

import type { NotificationSoundType } from '../../core/entities/NotificationSettings.entity'
import { logger } from '../../../../lib/utils'

const audioMap: Record<NotificationSoundType, string> = {
  confrontation: '/sounds/notifications/confrontaion_message.mp3',
  dattebayo: '/sounds/notifications/dattebayo.mp3',
  good_morning: '/sounds/notifications/good_morning.mp3',
  jutsu: '/sounds/notifications/jutsu_sound.mp3',
  obito: '/sounds/notifications/obito_yoo.mp3',
  naruto_iyoo: '/sounds/notifications/shorter_naruto_iyoo.mp3',
}

export const SoundSynthesizer = {
  play(soundType: NotificationSoundType, volume: number = 0.5): void {
    if (typeof window === 'undefined') return

    const src = audioMap[soundType]
    if (!src) return

    try {
      const audio = new Audio(src)
      audio.volume = Math.max(0, Math.min(1, volume))
      void audio.play().catch((err) => {
        logger.warn('Failed to play notification audio file:', err)
      })
    } catch (e) {
      logger.warn('Audio playback failed or not supported in this browser:', e)
    }
  },
}

import { MissionRank } from '../../core/entities/VillageSettings.entity'

const RANK_COLORS: Record<MissionRank, { bg: string; border: string; text: string }> = {
  D: { bg: 'rgba(100,100,100,0.15)', border: '#555', text: '#aaa' },
  C: { bg: 'rgba(60,120,60,0.15)', border: '#3a7a3a', text: '#7dc47d' },
  B: { bg: 'rgba(40,80,160,0.15)', border: '#2a5ab0', text: '#7aabf0' },
  A: { bg: 'rgba(160,80,20,0.15)', border: '#b05a14', text: '#e8a060' },
  S: { bg: 'rgba(160,20,20,0.15)', border: '#a01414', text: '#e07070' },
}

interface MissionRankBadgeProps {
  rank: MissionRank
  size?: 'sm' | 'md'
}

export const MissionRankBadge = ({ rank, size = 'sm' }: MissionRankBadgeProps) => {
  const c = RANK_COLORS[rank]
  const px = size === 'md' ? '8px 14px' : '3px 8px'
  const fs = size === 'md' ? 11 : 9
  return (
    <span
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        fontSize: fs,
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        letterSpacing: '0.08em',
        padding: px,
        borderRadius: 2,
        whiteSpace: 'nowrap',
      }}
    >
      RANK {rank}
    </span>
  )
}

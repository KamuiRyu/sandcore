import { useState } from 'react'
import { Search, RefreshCw, CheckCircle2, Lock } from 'lucide-react'
import { useMissionsViewModel } from '../viewModels/useMissions.viewModel'
import { MissionRankBadge } from '../components/MissionRankBadge'
import { VillageSection, VillagePrimaryButton } from '../components/VillageSection'
import { MissionRank } from '../../core/entities/VillageSettings.entity'
import { P } from '../../../../components/ui/ParchmentUI'

const RANKS: MissionRank[] = ['D', 'C', 'B', 'A', 'S']

export const MissionBoardScreen = () => {
  const vm = useMissionsViewModel()
  const [search, setSearch] = useState('')
  const [filterRank, setFilterRank] = useState<MissionRank | 'all'>('all')

  const filtered = vm.templates.filter(t => {
    if (filterRank !== 'all' && t.rank !== filterRank) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const grouped = RANKS.reduce((acc, rank) => {
    const list = filtered.filter(t => t.rank === rank)
    if (list.length > 0) acc[rank] = list
    return acc
  }, {} as Record<MissionRank, typeof filtered>)

  if (vm.loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span style={{ color: '#7a5030', fontSize: 11, fontFamily: P.fontLabel }}>Carregando missões...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ color: P.darkBrown }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexShrink: 0 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#7a5030' }} />
          <input
            type="text"
            placeholder="Buscar missões..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 26, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
              background: P.subtleBg, border: `1px solid ${P.border}`, borderRadius: 4,
              fontSize: 10, color: P.darkBrown, fontFamily: P.fontValue, outline: 'none',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(90,55,20,.55)')}
            onBlur={e => (e.currentTarget.style.borderColor = P.border)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {(['all', ...RANKS] as const).map(r => (
            <button
              key={r}
              onClick={() => setFilterRank(r)}
              style={{
                padding: '4px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                fontFamily: P.fontLabel, cursor: 'pointer', transition: 'all .15s',
                background: filterRank === r ? P.gold : P.subtleBg,
                boxShadow: filterRank === r ? P.goldShadow : `inset 0 0 0 1px ${P.border}`,
                color: filterRank === r ? P.teal : P.darkBrown, border: 'none',
              }}
            >
              {r === 'all' ? 'TODOS' : r}
            </button>
          ))}
        </div>
        <button
          onClick={vm.reload} title="Atualizar"
          style={{ color: P.darkBrown, background: P.subtleBg, boxShadow: `inset 0 0 0 1px ${P.border}`, borderRadius: 4, padding: 5, cursor: 'pointer', display: 'flex', border: 'none' }}
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {vm.error && (
        <div style={{ background: 'rgba(120,20,20,.10)', border: '1px solid rgba(160,40,40,.3)', color: '#8a2020', fontSize: 10, padding: '6px 10px', borderRadius: 4, marginBottom: 10, fontFamily: P.fontValue }}>
          {vm.error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-5">
        {Object.entries(grouped).map(([rank, list]) => (
          <div key={rank}>
            <VillageSection label={`Rank ${rank}`} />
            <div className="grid grid-cols-3 gap-3">
              {list.map(t => {
                const isAssigned = vm.assignedTemplateIds.has(t.id)
                const eligibility = vm.checkEligibility(t.id)
                return (
                  <div
                    key={t.id}
                    style={{
                      background: isAssigned ? 'rgba(40,90,56,.08)' : P.subtleBg,
                      boxShadow: `inset 0 0 0 1.5px ${isAssigned ? 'rgba(40,90,56,.4)' : P.border}`,
                      borderRadius: 5, padding: '10px 12px',
                      display: 'flex', flexDirection: 'column', gap: 6, position: 'relative',
                    }}
                  >
                    {isAssigned && (
                      <div style={{ position: 'absolute', top: 8, right: 8 }}>
                        <CheckCircle2 size={14} style={{ color: '#285a38' }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, paddingRight: 16 }}>
                      <MissionRankBadge rank={t.rank as MissionRank} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: P.darkBrown, lineHeight: 1.3, fontFamily: P.fontValue }}>{t.title}</span>
                    </div>
                    {t.description && (
                      <p style={{ fontSize: 9, color: '#7a5030', lineHeight: 1.4, margin: 0, fontFamily: P.fontValue }}>{t.description}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 9, color: '#7a5030', fontFamily: P.fontValue }}>
                      {t.min_level > 0 && <span>Nv. mín: <span style={{ color: P.darkBrown, fontWeight: 700 }}>{t.min_level}</span></span>}
                      {t.min_ninja_rank && <span>Rank: <span style={{ color: P.darkBrown, fontWeight: 700 }}>{t.min_ninja_rank}</span></span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 9, color: '#5a3618', borderTop: `1px dashed ${P.dashed}`, paddingTop: 6, marginTop: 2, fontFamily: P.fontValue }}>
                      {t.reward_yens > 0 && <span>💰 {t.reward_yens} yens</span>}
                      {t.reward_points > 0 && <span>⭐ {t.reward_points} pts</span>}
                      {t.reward_items && <span>📦 {t.reward_items}</span>}
                    </div>
                    {!isAssigned && (
                      <div className="mt-1">
                        {eligibility.eligible ? (
                          <VillagePrimaryButton small onClick={() => vm.assignMission(t.id)}>Aceitar Missão</VillagePrimaryButton>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#7a5030', fontFamily: P.fontValue }}>
                            <Lock size={10} />
                            <span>{eligibility.reason}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {isAssigned && (
                      <span style={{ fontSize: 9, color: '#285a38', fontFamily: P.fontLabel }}>Atribuída hoje</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 16px', gap: 8 }}>
            <span style={{ color: P.border, fontSize: 11, fontFamily: P.fontLabel }}>Nenhuma missão encontrada</span>
          </div>
        )}
      </div>
    </div>
  )
}

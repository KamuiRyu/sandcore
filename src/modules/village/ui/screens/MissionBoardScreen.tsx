import { useState } from 'react'
import { Search, RefreshCw, CheckCircle2, Lock } from 'lucide-react'
import { useMissionsViewModel } from '../viewModels/useMissions.viewModel'
import { MissionRankBadge } from '../components/MissionRankBadge'
import { VillageSection, VillagePrimaryButton } from '../components/VillageSection'
import { MissionRank } from '../../core/entities/VillageSettings.entity'

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
        <span style={{ color: '#9a7a40', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>Carregando missões...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ color: '#e8d5a0' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-none">
        <div className="flex-1 relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#9a7a40' }} />
          <input
            type="text"
            placeholder="Buscar missões..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
              background: 'rgba(13,10,4,0.8)', border: '1px solid #2e1e06', borderRadius: 3,
              fontSize: 10, color: '#e8d5a0', fontFamily: "'JetBrains Mono', monospace", outline: 'none',
            }}
          />
        </div>
        <div className="flex items-center gap-1">
          {(['all', ...RANKS] as const).map(r => (
            <button
              key={r}
              onClick={() => setFilterRank(r)}
              style={{
                padding: '4px 8px', borderRadius: 2, fontSize: 9, fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
                background: filterRank === r ? 'rgba(200,134,10,0.2)' : 'transparent',
                border: `1px solid ${filterRank === r ? '#c8860a' : '#2e1e06'}`,
                color: filterRank === r ? '#c8860a' : '#9a7a40',
              }}
            >
              {r === 'all' ? 'TODOS' : r}
            </button>
          ))}
        </div>
        <button onClick={vm.reload} title="Atualizar" style={{ color: '#9a7a40', background: 'transparent', border: '1px solid #2e1e06', borderRadius: 3, padding: 5, cursor: 'pointer', display: 'flex' }}>
          <RefreshCw size={12} />
        </button>
      </div>

      {vm.error && (
        <div style={{ background: 'rgba(120,20,20,0.2)', border: '1px solid #7a1414', color: '#e07070', fontSize: 10, padding: '6px 10px', borderRadius: 3, marginBottom: 10 }}>
          {vm.error}
        </div>
      )}

      {/* Board */}
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
                      background: 'rgba(13,10,4,0.8)',
                      border: `1px solid ${isAssigned ? '#285a38' : '#2e1e06'}`,
                      borderRadius: 3,
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      position: 'relative',
                    }}
                  >
                    {isAssigned && (
                      <div style={{ position: 'absolute', top: 8, right: 8 }}>
                        <CheckCircle2 size={14} style={{ color: '#5ac87a' }} />
                      </div>
                    )}
                    <div className="flex items-start gap-2 pr-4">
                      <MissionRankBadge rank={t.rank as MissionRank} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#e8d5a0', lineHeight: 1.3 }}>{t.title}</span>
                    </div>
                    {t.description && (
                      <p style={{ fontSize: 9, color: '#9a7a40', lineHeight: 1.4, margin: 0 }}>{t.description}</p>
                    )}
                    <div className="flex items-center gap-3" style={{ fontSize: 9, color: '#9a7a40' }}>
                      {t.min_level > 0 && <span>Nv. mín: <span style={{ color: '#c8a030' }}>{t.min_level}</span></span>}
                      {t.min_ninja_rank && <span>Rank: <span style={{ color: '#c8a030' }}>{t.min_ninja_rank}</span></span>}
                    </div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 9, color: '#c8a030', borderTop: '1px solid #2e1e06', paddingTop: 6, marginTop: 2 }}>
                      {t.reward_yens > 0 && <span>💰 {t.reward_yens} yens</span>}
                      {t.reward_points > 0 && <span>⭐ {t.reward_points} pts</span>}
                      {t.reward_items && <span>📦 {t.reward_items}</span>}
                    </div>
                    {!isAssigned && (
                      <div className="mt-1">
                        {eligibility.eligible ? (
                          <VillagePrimaryButton small onClick={() => vm.assignMission(t.id)}>
                            Aceitar Missão
                          </VillagePrimaryButton>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#9a7a40' }}>
                            <Lock size={10} />
                            <span>{eligibility.reason}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {isAssigned && (
                      <span style={{ fontSize: 9, color: '#5ac87a', fontFamily: "'JetBrains Mono', monospace" }}>Atribuída hoje</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span style={{ color: '#4a2f0a', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>Nenhuma missão encontrada</span>
          </div>
        )}
      </div>
    </div>
  )
}

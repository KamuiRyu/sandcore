import { useState } from 'react'
import { Search, RefreshCw, CheckCircle2, Package, Star, Coins, Zap, Scroll, AlertTriangle } from 'lucide-react'
import { pb } from '../../../../lib/pocketbase'
import { useMissionsViewModel } from '../viewModels/useMissions.viewModel'
import { MissionRankBadge } from '../components/MissionRankBadge'
import { VillageSection, VillagePrimaryButton, VillageSecondaryButton } from '../components/VillageSection'
import { MissionRank } from '../../core/entities/VillageSettings.entity'
import { MissionTemplate } from '../../core/entities/MissionTemplate.entity'

const RANKS: MissionRank[] = ['D', 'C', 'B', 'A', 'S']

export const MissionBoardScreen = () => {
  const vm = useMissionsViewModel()
  const [search, setSearch] = useState('')
  const [filterRank, setFilterRank] = useState<MissionRank | 'all'>('all')
  const [expandedTplId, setExpandedTplId] = useState<string | null>(null)
  const maxPoints = vm.settings?.daily_points_per_ninja ?? 0
  const remainingPoints = Math.max(0, maxPoints - vm.usedPoints)
  const pointsPct = maxPoints > 0 ? Math.min(100, (vm.usedPoints / maxPoints) * 100) : 0
  const missionLimitReached = vm.maxDailyMissions > 0 && vm.dailyMissionsUsed >= vm.maxDailyMissions
  const missionPct = vm.maxDailyMissions > 0 ? Math.min(100, (vm.dailyMissionsUsed / vm.maxDailyMissions) * 100) : 0

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
        <span style={{ color: '#9a7a40', fontSize: 13, fontFamily: "'Orbitron', sans-serif" }}>Carregando missões...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ color: '#e8d5a0' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-none">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9a7a40' }} />
          <input
            type="text"
            placeholder="Buscar missões..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              background: 'rgba(8,8,8,0.8)', border: '1px solid #1e1e1e', borderRadius: 3,
              fontSize: 12, color: '#e8d5a0', fontFamily: "'Orbitron', sans-serif", outline: 'none',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#c8860a')}
            onBlur={e => (e.currentTarget.style.borderColor = '#1e1e1e')}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(['all', ...RANKS] as const).map(r => (
            <button
              key={r}
              onClick={() => setFilterRank(r)}
              style={{
                padding: '6px 10px', borderRadius: 2, fontSize: 11, fontWeight: 700,
                fontFamily: "'Orbitron', sans-serif", cursor: 'pointer',
                background: filterRank === r ? 'rgba(200,134,10,0.2)' : 'transparent',
                border: `1px solid ${filterRank === r ? '#c8860a' : '#1e1e1e'}`,
                color: filterRank === r ? '#c8860a' : '#9a7a40',
              }}
            >
              {r === 'all' ? 'TODOS' : r}
            </button>
          ))}
        </div>
        <button onClick={vm.reload} title="Atualizar" style={{ color: '#9a7a40', background: 'transparent', border: '1px solid #1e1e1e', borderRadius: 3, padding: 7, cursor: 'pointer', display: 'flex' }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {vm.error && (
        <div style={{ background: 'rgba(120,20,20,0.2)', border: '1px solid #7a1414', color: '#e07070', fontSize: 12, padding: '8px 12px', borderRadius: 3, marginBottom: 12 }}>
          {vm.error}
        </div>
      )}

      {/* Daily points bar */}
      {vm.settings && maxPoints > 0 && (
        <div className="flex-none mb-3" style={{ background: 'rgba(8,8,8,0.6)', border: '1px solid #1e1e1e', borderRadius: 3, padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#9a7a40', fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em' }}>
              <Zap size={12} />
              PONTOS DIÁRIOS
            </div>
            <span style={{ fontSize: 12, fontFamily: "'Orbitron', sans-serif", fontWeight: 700, color: remainingPoints === 0 ? '#e07070' : '#c8a030' }}>
              {remainingPoints} / {maxPoints} restantes
            </span>
          </div>
          <div style={{ height: 4, background: '#1e1e1e', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pointsPct}%`, background: pointsPct >= 100 ? '#e07070' : 'linear-gradient(90deg,#c8860a,#e8a820)', borderRadius: 2, transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {/* Daily missions bar */}
      {vm.maxDailyMissions > 0 && (
        <div className="flex-none mb-3" style={{ background: missionLimitReached ? 'rgba(120,20,20,0.12)' : 'rgba(8,8,8,0.6)', border: `1px solid ${missionLimitReached ? '#7a1414' : '#1e1e1e'}`, borderRadius: 3, padding: '10px 14px', transition: 'all 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: missionLimitReached ? '#e07070' : '#9a7a40', fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em' }}>
              <Scroll size={12} />
              MISSÕES DIÁRIAS
            </div>
            <span style={{ fontSize: 12, fontFamily: "'Orbitron', sans-serif", fontWeight: 700, color: missionLimitReached ? '#e07070' : '#c8a030' }}>
              {vm.dailyMissionsUsed} / {vm.maxDailyMissions} atribuídas hoje
            </span>
          </div>
          <div style={{ height: 4, background: '#1e1e1e', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${missionPct}%`, background: missionLimitReached ? '#e07070' : 'linear-gradient(90deg,#2a7a5a,#3ac880)', borderRadius: 2, transition: 'width 0.3s ease' }} />
          </div>
          {missionLimitReached && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, color: '#e07070', fontFamily: "'Orbitron', sans-serif" }}>
              <AlertTriangle size={11} />
              Limite diário atingido. Você não receberá novas missões hoje.
            </div>
          )}
        </div>
      )}

      {/* Board */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6">
        {Object.entries(grouped).map(([rank, list]) => (
          <div key={rank}>
            <VillageSection label={`Missões Rank ${rank}`} />
            <div className="space-y-2">
              {list.map(t => {
                const isAssigned = vm.assignedTemplateIds.has(t.id)
                const isExpanded = expandedTplId === t.id
                return (
                  <div
                    key={t.id}
                    onClick={() => setExpandedTplId(isExpanded ? null : t.id)}
                    style={{
                      background: isAssigned ? 'rgba(40,90,56,0.12)' : 'rgba(8,8,8,0.8)',
                      border: `1px solid ${isAssigned ? '#285a38' : (isExpanded ? '#c8860a' : '#1e1e1e')}`,
                      borderRadius: 3,
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: isExpanded ? 14 : 0,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { if (!isExpanded && !isAssigned) e.currentTarget.style.borderColor = '#c8860a' }}
                    onMouseLeave={e => { if (!isExpanded && !isAssigned) e.currentTarget.style.borderColor = '#1e1e1e' }}
                  >
                    {/* Compact row (always visible) */}
                    {(() => {
                      const eligibility = !isAssigned ? vm.checkEligibility(t.id) : { eligible: true }
                      return (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                              <MissionRankBadge rank={t.rank as MissionRank} />
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#e8d5a0', fontFamily: "'Cinzel', serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {t.title}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                              {vm.settings && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#9a7a40', fontFamily: "'Orbitron', sans-serif" }}>
                                  <Zap size={11} />
                                  {vm.settings.points_cost[t.rank as MissionRank] ?? 0} pts
                                </div>
                              )}
                              {isAssigned ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#5ac87a', fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>
                                  <CheckCircle2 size={13} /> Atribuída
                                </span>
                              ) : !eligibility.eligible ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#e07070', fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>
                                  <AlertTriangle size={11} /> Bloqueada
                                </span>
                              ) : (
                                <span style={{ fontSize: 10, color: '#c8a840', textDecoration: 'underline', fontFamily: "'Orbitron', sans-serif" }}>
                                  {isExpanded ? 'Recolher' : 'Detalhes'}
                                </span>
                              )}
                            </div>
                          </div>
                          {!isAssigned && !eligibility.eligible && !isExpanded && (
                            <div style={{ fontSize: 10, color: '#7a4040', fontFamily: "'Orbitron', sans-serif", marginTop: 4 }}>
                              ⚠ {eligibility.reason}
                            </div>
                          )}
                        </>
                      )
                    })()}

                    {/* Expanded details */}
                    {isExpanded && (
                      <div
                        onClick={(e) => e.stopPropagation()} // Prevent clicking inner elements from collapsing card
                        style={{ borderTop: '1px solid #1e1e1e', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}
                      >
                        {/* Description */}
                        {t.description && (
                          <div>
                            <div style={{ fontSize: 10, color: '#c8a030', fontFamily: "'Orbitron', sans-serif", marginBottom: 6, fontWeight: 700, letterSpacing: '0.05em' }}>
                              DESCRIÇÃO DA MISSÃO:
                            </div>
                            <div style={{ fontSize: 12, color: '#9a7a40', fontFamily: "'Orbitron', sans-serif", lineHeight: 1.6 }}>
                              {t.description}
                            </div>
                          </div>
                        )}

                        {/* Objective */}
                        {t.objective && (
                          <div style={{ background: 'rgba(120,160,80,0.06)', border: '1px solid rgba(120,160,80,0.2)', borderRadius: 3, padding: '10px 12px' }}>
                            <div style={{ fontSize: 10, color: '#7ab840', fontFamily: "'Orbitron', sans-serif", marginBottom: 6, fontWeight: 700, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
                              🎯 OBJETIVO:
                            </div>
                            <div style={{ fontSize: 12, color: '#a0c870', fontFamily: "'Orbitron', sans-serif", lineHeight: 1.6 }}>
                              {t.objective}
                            </div>
                          </div>
                        )}

                        {/* Location Images */}
                        {t.location_image && (
                          <div>
                            <div style={{ fontSize: 10, color: '#c8a030', fontFamily: "'Orbitron', sans-serif", marginBottom: 6, fontWeight: 700, letterSpacing: '0.05em' }}>
                              📍 IMAGEM(NS) DE LOCALIZAÇÃO / REFERÊNCIA:
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {(Array.isArray(t.location_image) ? t.location_image : [t.location_image]).map((imgName, i) => {
                                if (!imgName) return null;
                                const fileUrl = pb.files.getUrl(t, imgName);
                                return (
                                  <a
                                    key={i}
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: 'inline-block', border: '1px solid #c8860a', borderRadius: 3, overflow: 'hidden', background: '#000', cursor: 'zoom-in' }}
                                  >
                                    <img
                                      src={fileUrl}
                                      alt={`Localização ${i + 1}`}
                                      style={{ maxHeight: 120, maxWidth: 140, objectFit: 'contain', display: 'block' }}
                                    />
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Requirements & Energy cost */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px solid #1e1e1e', paddingTop: 12 }}>
                          <div>
                            <div style={{ fontSize: 10, color: '#c8a030', fontFamily: "'Orbitron', sans-serif", marginBottom: 4, fontWeight: 700 }}>REQUISITOS:</div>
                            <div style={{ fontSize: 11, color: '#9a7a40', fontFamily: "'Orbitron', sans-serif" }}>
                              {t.min_ninja_rank && <div>Posto: <span style={{ color: '#e8d5a0' }}>{t.min_ninja_rank}</span></div>}
                              {t.min_level > 0 ? <div>Nível: <span style={{ color: '#e8d5a0' }}>{t.min_level}</span></div> : null}
                              {!t.min_ninja_rank && t.min_level === 0 && <div style={{ color: '#666' }}>Sem requisitos</div>}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: 10, color: '#c8a030', fontFamily: "'Orbitron', sans-serif", marginBottom: 4, fontWeight: 700 }}>CUSTO DIÁRIO:</div>
                            <div style={{ fontSize: 11, color: '#9a7a40', fontFamily: "'Orbitron', sans-serif" }}>
                              {vm.settings ? `${vm.settings.points_cost[t.rank as MissionRank] ?? 0} pts de energia` : '–'}
                            </div>
                          </div>
                        </div>

                        {/* Rewards */}
                        <div style={{ borderTop: '1px solid #1e1e1e', paddingTop: 12 }}>
                          <div style={{ fontSize: 10, color: '#c8a030', fontFamily: "'Orbitron', sans-serif", marginBottom: 6, fontWeight: 700 }}>RECOMPENSAS:</div>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            {t.reward_yens > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#c8a030', fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>
                                <Coins size={14} /> {t.reward_yens.toLocaleString('pt-BR')} yens
                              </div>
                            )}
                            {t.reward_points > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#e8b840', fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>
                                <Star size={14} /> {t.reward_points} pts
                              </div>
                            )}
                            {t.reward_items && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9a7a40', fontFamily: "'Orbitron', sans-serif" }}>
                                <Package size={13} /> {t.reward_items}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span style={{ color: '#282828', fontSize: 13, fontFamily: "'Orbitron', sans-serif" }}>Nenhuma missão encontrada</span>
          </div>
        )}
      </div>
    </div>
  )
}

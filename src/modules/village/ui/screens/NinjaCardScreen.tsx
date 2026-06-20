import { useEffect, useState } from 'react'
import { pb } from '../../../../lib/pocketbase'
import { User } from '../../../authentication/core/entities/User.entity'
import { MissionAssignment } from '../../core/entities/MissionAssignment.entity'
import { Title } from '../../core/entities/Title.entity'
import { MissionRank } from '../../core/entities/VillageSettings.entity'
import { getMyAssignments, getTitles } from '../../infrastructure/adapters/PocketBaseVillage.adapter'
import { MissionRankBadge } from '../components/MissionRankBadge'
import { VillageSection } from '../components/VillageSection'
import { Award, Shield, Star, TrendingUp } from 'lucide-react'

const RANK_LABELS: Record<string, string> = {
  genin: 'Genin', chunin: 'Chunin', jonin: 'Jonin', anbu: 'ANBU', kage: 'Kage',
}

const RANKS: MissionRank[] = ['D', 'C', 'B', 'A', 'S']

export const NinjaCardScreen = () => {
  const user = pb.authStore.model as User | null
  const [completed, setCompleted] = useState<MissionAssignment[]>([])
  const [titles, setTitles] = useState<Title[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      getMyAssignments(user.id),
      getTitles(),
    ]).then(([a, t]) => {
      setCompleted(a.filter(x => x.status === 'completed'))
      setTitles(t)
    }).finally(() => setLoading(false))
  }, [user?.id])

  if (!user) return null
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span style={{ color: '#9a7a40', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>Carregando carteirinha...</span>
      </div>
    )
  }

  const countByRank = RANKS.reduce((acc, r) => {
    acc[r] = completed.filter(a => a.expand?.template?.rank === r).length
    return acc
  }, {} as Record<MissionRank, number>)

  const totalPoints = user.title_points || 0
  const currentTitle = titles.find(t => t.id === user.current_title)
  const nextTitle = titles.find(t => t.min_points > totalPoints)
  const progress = nextTitle
    ? Math.min(100, Math.round((totalPoints / nextTitle.min_points) * 100))
    : 100

  const totalYens = completed.reduce((s, a) => s + (a.expand?.template?.reward_yens || 0), 0)

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ color: '#e8d5a0' }}>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div className="grid grid-cols-3 gap-4">

          {/* Left: Profile card */}
          <div className="col-span-1 flex flex-col gap-3">
            <div style={{ background: 'rgba(13,10,4,0.8)', border: '1px solid #2e1e06', borderRadius: 3, padding: '16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid #c8860a', background: 'rgba(200,134,10,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={24} style={{ color: '#c8860a' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e8d5a0', fontFamily: "'Cinzel', serif" }}>{user.name}</div>
                <div style={{ fontSize: 9, color: '#9a7a40', marginTop: 3 }}>{user.email}</div>
              </div>
              {currentTitle && (
                <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#e8b840', background: 'rgba(200,160,48,0.1)', border: '1px solid #8a6000', borderRadius: 2, padding: '3px 8px' }}>
                  {currentTitle.name}
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#9a7a40' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#c8860a' }}>{user.level || 0}</div>
                  <div>Nível</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#c8860a' }}>{RANK_LABELS[user.ninja_rank] || '–'}</div>
                  <div>Posto</div>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div style={{ background: 'rgba(13,10,4,0.8)', border: '1px solid #2e1e06', borderRadius: 3, padding: '12px 14px' }}>
              <VillageSection label="Progresso de Título" />
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#9a7a40', marginBottom: 6 }}>
                  <span>{totalPoints} pts</span>
                  <span>{nextTitle ? `${nextTitle.min_points} pts` : 'Máximo'}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: '#2e1e06', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#b87a08,#e8a820)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ fontSize: 9, color: '#9a7a40', marginTop: 6, textAlign: 'center' }}>
                  {nextTitle ? `Próximo: ${nextTitle.name}` : 'Título máximo atingido!'}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ background: 'rgba(13,10,4,0.8)', border: '1px solid #2e1e06', borderRadius: 3, padding: '12px 14px' }}>
              <VillageSection label="Estatísticas" />
              <div className="space-y-2 mt-2">
                {[
                  { icon: Award, label: 'Missões Concluídas', value: completed.length },
                  { icon: Star, label: 'Pontos de Título', value: totalPoints },
                  { icon: TrendingUp, label: 'Total Ganho', value: `${totalYens} yens` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9a7a40' }}>
                      <Icon size={11} style={{ color: '#c8860a' }} />{label}
                    </div>
                    <span style={{ color: '#c8a030', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Mission history */}
          <div className="col-span-2 flex flex-col gap-3">
            <div style={{ background: 'rgba(13,10,4,0.8)', border: '1px solid #2e1e06', borderRadius: 3, padding: '12px 14px' }}>
              <VillageSection label="Missões por Rank" />
              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                {RANKS.map(r => (
                  <div key={r} style={{ flex: 1, textAlign: 'center', background: 'rgba(13,10,4,0.6)', border: '1px solid #2e1e06', borderRadius: 3, padding: '8px 6px' }}>
                    <MissionRankBadge rank={r} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#c8860a', marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
                      {countByRank[r] || 0}
                    </div>
                    <div style={{ fontSize: 8, color: '#9a7a40' }}>missões</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(13,10,4,0.8)', border: '1px solid #2e1e06', borderRadius: 3, padding: '12px 14px', flex: 1 }}>
              <VillageSection label="Histórico de Missões" />
              <div className="space-y-2 mt-2 overflow-y-auto custom-scrollbar" style={{ maxHeight: 360 }}>
                {completed.length === 0 ? (
                  <div style={{ color: '#4a2f0a', fontSize: 10, textAlign: 'center', padding: '20px 0', fontFamily: "'JetBrains Mono', monospace" }}>
                    Nenhuma missão concluída ainda
                  </div>
                ) : (
                  completed.map(a => {
                    const tpl = a.expand?.template
                    const reviewer = a.expand?.reviewed_by
                    return (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderRadius: 3, border: '1px solid #1e1204', background: 'rgba(13,10,4,0.5)', fontSize: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          {tpl && <MissionRankBadge rank={tpl.rank as MissionRank} />}
                          <span style={{ color: '#e8d5a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tpl?.title || 'Missão'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, color: '#9a7a40', fontSize: 9 }}>
                          {tpl?.reward_yens ? <span style={{ color: '#c8a030' }}>+{tpl.reward_yens}¥</span> : null}
                          {tpl?.reward_points ? <span style={{ color: '#e8b840' }}>+{tpl.reward_points}★</span> : null}
                          {reviewer && <span>por {reviewer.name}</span>}
                          <span>{a.completed_at ? new Date(a.completed_at).toLocaleDateString('pt-BR') : '–'}</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

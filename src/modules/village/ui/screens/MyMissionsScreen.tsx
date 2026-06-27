import { useState, useRef } from 'react'
import { Upload, RefreshCw, CheckCircle2, Clock, Star, Coins, Package } from 'lucide-react'
import { pb } from '../../../../lib/pocketbase'
import { useMissionsViewModel } from '../viewModels/useMissions.viewModel'
import { MissionRankBadge } from '../components/MissionRankBadge'
import { VillageSection, VillageSecondaryButton, VillagePrimaryButton, StatusBadge } from '../components/VillageSection'
import { usePagination, Pagination } from '../components/Pagination'
import { MissionAssignment } from '../../core/entities/MissionAssignment.entity'
import { MissionRank } from '../../core/entities/VillageSettings.entity'

const AssignmentCard = ({
  a,
  isExpanded,
  onToggle,
  onSubmit,
}: {
  a: MissionAssignment
  isExpanded: boolean
  onToggle: () => void
  onSubmit: (id: string, files?: File[]) => Promise<void>
}) => {
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const tpl = a.expand?.template

  const handleSubmit = async () => {
    setSubmitting(true)
    await onSubmit(a.id, files.length > 0 ? files : undefined)
    setSubmitting(false)
    setFiles([])
    setShowUploadForm(false)
  }

  return (
    <div
      onClick={onToggle}
      style={{
        background: 'rgba(8,8,8,0.8)',
        border: `1px solid ${isExpanded ? '#c8860a' : '#1e1e1e'}`,
        borderRadius: 3,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: isExpanded ? 14 : 0,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.borderColor = '#c8860a' }}
      onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.borderColor = '#1e1e1e' }}
    >
      {/* Compact row (always visible) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          {tpl && <MissionRankBadge rank={tpl.rank as MissionRank} />}
          <span style={{ fontSize: 13, fontWeight: 700, color: '#e8d5a0', fontFamily: "'Cinzel', serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tpl?.title || 'Missão'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          {!isExpanded && (
            <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#9a7a40', fontFamily: "'Orbitron', sans-serif" }}>
              {tpl && tpl.reward_yens > 0 && <span>💰 {tpl.reward_yens.toLocaleString('pt-BR')}¥</span>}
              {tpl && tpl.reward_points > 0 && <span>⭐ {tpl.reward_points}pts</span>}
            </div>
          )}
          <StatusBadge status={a.status} />
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div
          onClick={(e) => e.stopPropagation()} // Prevent card collapse on click inside
          style={{ borderTop: '1px solid #1e1e1e', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {/* Date info */}
          <div style={{ fontSize: 11, color: '#9a7a40', fontFamily: "'Orbitron', sans-serif" }}>
            Atribuída em: {new Date(a.assigned_at).toLocaleDateString('pt-BR')}
          </div>

          {/* Description */}
          {tpl?.description && (
            <div>
              <div style={{ fontSize: 10, color: '#c8a030', fontFamily: "'Orbitron', sans-serif", marginBottom: 6, fontWeight: 700 }}>
                DETALHES DA MISSÃO:
              </div>
              <div style={{ fontSize: 12, color: '#9a7a40', fontFamily: "'Orbitron', sans-serif", lineHeight: 1.6 }}>
                {tpl.description}
              </div>
            </div>
          )}

          {/* Location Images */}
          {tpl?.location_image && (
            <div>
              <div style={{ fontSize: 10, color: '#c8a030', fontFamily: "'Orbitron', sans-serif", marginBottom: 6, fontWeight: 700 }}>
                📍 REFERÊNCIA DE LOCALIZAÇÃO:
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(Array.isArray(tpl.location_image) ? tpl.location_image : [tpl.location_image]).map((imgName, i) => {
                  if (!imgName) return null;
                  const fileUrl = pb.files.getUrl(tpl, imgName);
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

          {/* Rewards */}
          {tpl && (
            <div style={{ borderTop: '1px solid #1e1e1e', paddingTop: 12 }}>
              <div style={{ fontSize: 10, color: '#c8a030', fontFamily: "'Orbitron', sans-serif", marginBottom: 6, fontWeight: 700 }}>RECOMPENSAS:</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {tpl.reward_yens > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#c8a030', fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>
                    <Coins size={13} /> {tpl.reward_yens.toLocaleString('pt-BR')} yens
                  </div>
                )}
                {tpl.reward_points > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#e8b840', fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>
                    <Star size={13} /> {tpl.reward_points} pts
                  </div>
                )}
                {tpl.reward_items && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9a7a40', fontFamily: "'Orbitron', sans-serif" }}>
                    <Package size={12} /> {tpl.reward_items}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback/Notes from admin */}
          {a.admin_notes && (
            <div style={{ background: 'rgba(120,60,0,0.1)', border: '1px solid #7a3a00', borderRadius: 3, padding: '10px 12px', fontSize: 12, color: '#e8a060', fontFamily: "'Orbitron', sans-serif" }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>FEEDBACK DO AVALIADOR:</div>
              {a.admin_notes}
            </div>
          )}

          {/* Submitted Evidence Links */}
          {a.evidence && (
            <div style={{ borderTop: '1px dashed #1e1e1e', paddingTop: 12 }}>
              <div style={{ fontSize: 10, color: '#9a7a40', fontFamily: "'Orbitron', sans-serif", marginBottom: 6 }}>
                EVIDÊNCIAS ENVIADAS:
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(Array.isArray(a.evidence) ? a.evidence : [a.evidence]).map((filename, i) => {
                  if (!filename) return null;
                  const fileUrl = pb.files.getUrl(a, filename);
                  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);
                  
                  return (
                    <a
                      key={i}
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        border: '1px solid #1e1e1e',
                        borderRadius: 3,
                        padding: 4,
                        background: 'rgba(0,0,0,0.4)',
                        cursor: 'zoom-in',
                        width: 70,
                      }}
                    >
                      {isImage ? (
                        <img
                          src={fileUrl}
                          alt={`Evidência ${i + 1}`}
                          style={{ width: '100%', height: 50, objectFit: 'cover', borderRadius: 2 }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                          📂
                        </div>
                      )}
                      <span style={{ fontSize: 8, color: '#9a7a40', marginTop: 4, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>
                        Doc {i + 1}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Evidence submission form */}
          {a.status === 'in_progress' && (
            <div style={{ borderTop: '1px solid #1e1e1e', paddingTop: 12 }}>
              {!showUploadForm ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <VillagePrimaryButton small onClick={() => setShowUploadForm(true)}>
                    <Upload size={12} /> Concluir Missão
                  </VillagePrimaryButton>
                </div>
              ) : (
                <div style={{ background: 'rgba(200,134,10,0.05)', border: '1px solid #282828', borderRadius: 3, padding: '14px 16px' }}>
                  <p style={{ fontSize: 12, color: '#e8d5a0', marginBottom: 8, fontFamily: "'Orbitron', sans-serif" }}>
                    Envie evidências (opcional) para confirmar a conclusão:
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={e => {
                      const selected = Array.from(e.target.files || [])
                      setFiles(prev => [...prev, ...selected])
                    }}
                  />

                  {files.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                      {files.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: 2, border: '1px solid #1e1e1e' }}>
                          <span style={{ fontSize: 11, color: '#e8d5a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                            {f.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                            style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12, padding: '2px 6px', display: 'flex', alignItems: 'center' }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <VillageSecondaryButton small onClick={() => fileRef.current?.click()}>
                      <Upload size={12} /> Selecionar imagens
                    </VillageSecondaryButton>
                    <VillagePrimaryButton small onClick={handleSubmit} disabled={submitting}>
                      {submitting ? 'Enviando...' : 'Confirmar'}
                    </VillagePrimaryButton>
                    <VillageSecondaryButton small onClick={() => { setShowUploadForm(false); setFiles([]) }}>
                      Cancelar
                    </VillageSecondaryButton>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const MyMissionsScreen = () => {
  const vm = useMissionsViewModel()
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null)
  const pgCompleted = usePagination(vm.completedAssignments, 5)

  if (vm.loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span style={{ color: '#9a7a40', fontSize: 13, fontFamily: "'Orbitron', sans-serif" }}>Carregando...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ color: '#e8d5a0' }}>
      <div className="flex items-center justify-between mb-4 flex-none">
        <span style={{ fontSize: 12, color: '#9a7a40', fontFamily: "'Orbitron', sans-serif" }}>
          {vm.activeAssignments.length} ativa(s) · {vm.pendingAssignments.length} em revisão · {vm.completedAssignments.length} concluída(s)
        </span>
        <button onClick={vm.reload} style={{ color: '#9a7a40', background: 'transparent', border: '1px solid #1e1e1e', borderRadius: 3, padding: 7, cursor: 'pointer', display: 'flex' }}>
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6">

        {vm.activeAssignments.length > 0 && (
          <div>
            <VillageSection label="Ativas" />
            <div className="space-y-2">
              {vm.activeAssignments.map(a => (
                <AssignmentCard
                  key={a.id}
                  a={a}
                  isExpanded={expandedAssignmentId === a.id}
                  onToggle={() => setExpandedAssignmentId(expandedAssignmentId === a.id ? null : a.id)}
                  onSubmit={vm.submitEvidence}
                />
              ))}
            </div>
          </div>
        )}

        {vm.pendingAssignments.length > 0 && (
          <div>
            <VillageSection label="Em Avaliação">
              <Clock size={12} style={{ color: '#c8a030' }} />
            </VillageSection>
            <div className="space-y-2">
              {vm.pendingAssignments.map(a => (
                <AssignmentCard
                  key={a.id}
                  a={a}
                  isExpanded={expandedAssignmentId === a.id}
                  onToggle={() => setExpandedAssignmentId(expandedAssignmentId === a.id ? null : a.id)}
                  onSubmit={vm.submitEvidence}
                />
              ))}
            </div>
          </div>
        )}

        {vm.completedAssignments.length > 0 && (
          <div>
            <VillageSection label="Concluídas">
              <CheckCircle2 size={12} style={{ color: '#5ac87a' }} />
            </VillageSection>
            <div className="space-y-2">
              {pgCompleted.paged.map(a => (
                <AssignmentCard
                  key={a.id}
                  a={a}
                  isExpanded={expandedAssignmentId === a.id}
                  onToggle={() => setExpandedAssignmentId(expandedAssignmentId === a.id ? null : a.id)}
                  onSubmit={vm.submitEvidence}
                />
              ))}
            </div>
            <Pagination page={pgCompleted.page} totalPages={pgCompleted.totalPages} total={pgCompleted.total} onPage={pgCompleted.setPage} />
          </div>
        )}

        {vm.myAssignments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Star size={32} style={{ color: '#1e1e1e' }} />
            <span style={{ color: '#282828', fontSize: 13, fontFamily: "'Orbitron', sans-serif" }}>Nenhuma missão atribuída</span>
            <span style={{ color: '#282828', fontSize: 11, fontFamily: "'Orbitron', sans-serif" }}>Aguarde o admin atribuir uma missão a você</span>
          </div>
        )}
      </div>
    </div>
  )
}

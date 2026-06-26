import { useState, useRef } from 'react'
import { Upload, RefreshCw, CheckCircle2, Clock, Star, Coins, Package } from 'lucide-react'
import { useMissionsViewModel } from '../viewModels/useMissions.viewModel'
import { MissionRankBadge } from '../components/MissionRankBadge'
import { VillageSection, VillageSecondaryButton, VillagePrimaryButton, StatusBadge } from '../components/VillageSection'
import { usePagination, Pagination } from '../components/Pagination'
import { MissionAssignment } from '../../core/entities/MissionAssignment.entity'
import { MissionRank } from '../../core/entities/VillageSettings.entity'

const AssignmentCard = ({ a, onSubmit }: { a: MissionAssignment; onSubmit: (id: string, file?: File) => Promise<void> }) => {
  const [showModal, setShowModal] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const tpl = a.expand?.template

  const handleSubmit = async () => {
    setSubmitting(true)
    await onSubmit(a.id, file || undefined)
    setSubmitting(false)
    setShowModal(false)
    setFile(null)
  }

  return (
    <div style={{ background: 'rgba(8,8,8,0.8)', border: '1px solid #1e1e1e', borderRadius: 3, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
          {tpl && <MissionRankBadge rank={tpl.rank as MissionRank} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e8d5a0', marginBottom: 3, fontFamily: "'Cinzel', serif" }}>{tpl?.title || 'Missão'}</div>
            {tpl?.description && <div style={{ fontSize: 11, color: '#9a7a40', fontFamily: "'Orbitron', sans-serif", lineHeight: 1.5 }}>{tpl.description}</div>}
          </div>
        </div>
        <StatusBadge status={a.status} />
      </div>

      {tpl && (
        <div style={{ display: 'flex', gap: 16, fontSize: 12, borderTop: '1px solid #1e1e1e', paddingTop: 10, marginBottom: a.admin_notes || a.status === 'in_progress' ? 10 : 0 }}>
          {tpl.reward_yens > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#c8a030', fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>
              <Coins size={13} /> {tpl.reward_yens.toLocaleString('pt-BR')} yens
            </span>
          )}
          {tpl.reward_points > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#e8b840', fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>
              <Star size={13} /> {tpl.reward_points} pts
            </span>
          )}
          {tpl.reward_items && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9a7a40', fontFamily: "'Orbitron', sans-serif" }}>
              <Package size={12} /> {tpl.reward_items}
            </span>
          )}
        </div>
      )}

      {a.admin_notes && (
        <div style={{ background: 'rgba(120,60,0,0.1)', border: '1px solid #7a3a00', borderRadius: 3, padding: '8px 12px', fontSize: 12, color: '#e8a060', fontFamily: "'Orbitron', sans-serif" }}>
          <span style={{ fontWeight: 700 }}>Feedback: </span>{a.admin_notes}
        </div>
      )}

      {a.status === 'in_progress' && !showModal && (
        <div>
          <VillagePrimaryButton small onClick={() => setShowModal(true)}>
            <Upload size={12} /> Concluir Missão
          </VillagePrimaryButton>
        </div>
      )}

      {showModal && (
        <div style={{ marginTop: 12, background: 'rgba(200,134,10,0.05)', border: '1px solid #282828', borderRadius: 3, padding: '14px 16px' }}>
          <p style={{ fontSize: 12, color: '#e8d5a0', marginBottom: 12, fontFamily: "'Orbitron', sans-serif" }}>Envie uma evidência (opcional) para confirmar a conclusão:</p>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <VillageSecondaryButton small onClick={() => fileRef.current?.click()}>
              <Upload size={12} /> {file ? file.name.slice(0, 24) + (file.name.length > 24 ? '...' : '') : 'Selecionar imagem'}
            </VillageSecondaryButton>
            <VillagePrimaryButton small onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Enviando...' : 'Confirmar'}
            </VillagePrimaryButton>
            <VillageSecondaryButton small onClick={() => { setShowModal(false); setFile(null) }}>Cancelar</VillageSecondaryButton>
          </div>
        </div>
      )}
    </div>
  )
}

export const MyMissionsScreen = () => {
  const vm = useMissionsViewModel()
  const pgCompleted = usePagination(vm.completedAssignments)

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
                <AssignmentCard key={a.id} a={a} onSubmit={vm.submitEvidence} />
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
                <AssignmentCard key={a.id} a={a} onSubmit={vm.submitEvidence} />
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
                <AssignmentCard key={a.id} a={a} onSubmit={vm.submitEvidence} />
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

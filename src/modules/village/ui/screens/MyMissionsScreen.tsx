import { useState, useRef } from 'react'
import { Upload, RefreshCw, CheckCircle2, Clock, Star } from 'lucide-react'
import { useMissionsViewModel } from '../viewModels/useMissions.viewModel'
import { MissionRankBadge } from '../components/MissionRankBadge'
import { VillageSection, VillageSecondaryButton, VillagePrimaryButton, StatusBadge } from '../components/VillageSection'
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
    <div style={{ background: 'rgba(13,10,4,0.8)', border: '1px solid #2e1e06', borderRadius: 3, padding: '10px 12px' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {tpl && <MissionRankBadge rank={tpl.rank as MissionRank} />}
          <div className="flex flex-col gap-1 min-w-0">
            <span style={{ fontSize: 11, fontWeight: 600, color: '#e8d5a0' }}>{tpl?.title || 'Missão'}</span>
            {tpl?.description && <span style={{ fontSize: 9, color: '#9a7a40' }}>{tpl.description}</span>}
          </div>
        </div>
        <StatusBadge status={a.status} />
      </div>

      {tpl && (
        <div style={{ display: 'flex', gap: 10, fontSize: 9, color: '#c8a030', borderTop: '1px solid #2e1e06', paddingTop: 6, marginTop: 8 }}>
          {tpl.reward_yens > 0 && <span>💰 {tpl.reward_yens} yens</span>}
          {tpl.reward_points > 0 && <span>⭐ {tpl.reward_points} pts</span>}
          {tpl.reward_items && <span>📦 {tpl.reward_items}</span>}
        </div>
      )}

      {a.admin_notes && (
        <div style={{ background: 'rgba(120,60,0,0.1)', border: '1px solid #7a3a00', borderRadius: 3, padding: '6px 8px', marginTop: 8, fontSize: 9, color: '#e8a060' }}>
          <span style={{ fontWeight: 700 }}>Feedback: </span>{a.admin_notes}
        </div>
      )}

      {a.status === 'in_progress' && (
        <div className="mt-3">
          <VillagePrimaryButton small onClick={() => setShowModal(true)}>
            <Upload size={10} /> Concluir Missão
          </VillagePrimaryButton>
        </div>
      )}

      {showModal && (
        <div style={{ marginTop: 10, background: 'rgba(200,134,10,0.05)', border: '1px solid #4a2f0a', borderRadius: 3, padding: '10px 12px' }}>
          <p style={{ fontSize: 10, color: '#e8d5a0', marginBottom: 8 }}>Envie uma evidência (opcional) para confirmar a conclusão:</p>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
          <div className="flex items-center gap-2 flex-wrap">
            <VillageSecondaryButton small onClick={() => fileRef.current?.click()}>
              <Upload size={10} /> {file ? file.name.slice(0, 20) + '...' : 'Selecionar imagem'}
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

  if (vm.loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span style={{ color: '#9a7a40', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>Carregando...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ color: '#e8d5a0' }}>
      <div className="flex items-center justify-between mb-4 flex-none">
        <span style={{ fontSize: 11, color: '#9a7a40', fontFamily: "'JetBrains Mono', monospace" }}>
          {vm.activeAssignments.length} ativa(s) · {vm.pendingAssignments.length} em revisão · {vm.completedAssignments.length} concluída(s)
        </span>
        <button onClick={vm.reload} style={{ color: '#9a7a40', background: 'transparent', border: '1px solid #2e1e06', borderRadius: 3, padding: 5, cursor: 'pointer', display: 'flex' }}>
          <RefreshCw size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-5">

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
              <Clock size={10} style={{ color: '#c8a030' }} />
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
              <CheckCircle2 size={10} style={{ color: '#5ac87a' }} />
            </VillageSection>
            <div className="space-y-2">
              {vm.completedAssignments.slice(0, 10).map(a => (
                <AssignmentCard key={a.id} a={a} onSubmit={vm.submitEvidence} />
              ))}
            </div>
          </div>
        )}

        {vm.myAssignments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Star size={24} style={{ color: '#2e1e06' }} />
            <span style={{ color: '#4a2f0a', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>Nenhuma missão atribuída</span>
            <span style={{ color: '#4a2f0a', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>Visite o Quadro de Missões para aceitar uma</span>
          </div>
        )}
      </div>
    </div>
  )
}

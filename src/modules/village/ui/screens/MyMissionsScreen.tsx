import { useState, useRef } from 'react'
import { Upload, RefreshCw, CheckCircle2, Clock, Star } from 'lucide-react'
import { useMissionsViewModel } from '../viewModels/useMissions.viewModel'
import { MissionRankBadge } from '../components/MissionRankBadge'
import { VillageSection, VillageSecondaryButton, VillagePrimaryButton, StatusBadge } from '../components/VillageSection'
import { MissionAssignment } from '../../core/entities/MissionAssignment.entity'
import { MissionRank } from '../../core/entities/VillageSettings.entity'
import { P } from '../../../../components/ui/ParchmentUI'

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
    <div style={{
      background: P.subtleBg, boxShadow: `inset 0 0 0 1.5px ${P.border}`,
      borderRadius: 5, padding: '10px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1, minWidth: 0 }}>
          {tpl && <MissionRankBadge rank={tpl.rank as MissionRank} />}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: P.darkBrown, fontFamily: P.fontValue }}>{tpl?.title || 'Missão'}</span>
            {tpl?.description && <span style={{ fontSize: 9, color: '#7a5030', fontFamily: P.fontValue }}>{tpl.description}</span>}
          </div>
        </div>
        <StatusBadge status={a.status} />
      </div>

      {tpl && (
        <div style={{ display: 'flex', gap: 8, fontSize: 9, color: '#5a3618', borderTop: `1px dashed ${P.dashed}`, paddingTop: 6, marginTop: 8, fontFamily: P.fontValue }}>
          {tpl.reward_yens > 0 && <span>💰 {tpl.reward_yens} yens</span>}
          {tpl.reward_points > 0 && <span>⭐ {tpl.reward_points} pts</span>}
          {tpl.reward_items && <span>📦 {tpl.reward_items}</span>}
        </div>
      )}

      {a.admin_notes && (
        <div style={{ background: 'rgba(90,55,20,.08)', boxShadow: `inset 0 0 0 1px rgba(90,55,20,.25)`, borderRadius: 4, padding: '6px 8px', marginTop: 8, fontSize: 9, color: '#5a3618', fontFamily: P.fontValue }}>
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
        <div style={{ marginTop: 10, background: P.subtleBg, boxShadow: `inset 0 0 0 1px ${P.border}`, borderRadius: 4, padding: '10px 12px' }}>
          <p style={{ fontSize: 10, color: P.darkBrown, marginBottom: 8, fontFamily: P.fontValue }}>Envie uma evidência (opcional) para confirmar a conclusão:</p>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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
        <span style={{ color: '#7a5030', fontSize: 11, fontFamily: P.fontLabel }}>Carregando...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ color: P.darkBrown }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: '#7a5030', fontFamily: P.fontLabel }}>
          {vm.activeAssignments.length} ativa(s) · {vm.pendingAssignments.length} em revisão · {vm.completedAssignments.length} concluída(s)
        </span>
        <button
          onClick={vm.reload}
          style={{ color: P.darkBrown, background: P.subtleBg, boxShadow: `inset 0 0 0 1px ${P.border}`, borderRadius: 4, padding: 5, cursor: 'pointer', display: 'flex', border: 'none' }}
        >
          <RefreshCw size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-5">
        {vm.activeAssignments.length > 0 && (
          <div>
            <VillageSection label="Ativas" />
            <div className="space-y-2">
              {vm.activeAssignments.map(a => <AssignmentCard key={a.id} a={a} onSubmit={vm.submitEvidence} />)}
            </div>
          </div>
        )}
        {vm.pendingAssignments.length > 0 && (
          <div>
            <VillageSection label="Em Avaliação"><Clock size={10} style={{ color: '#7a5030' }} /></VillageSection>
            <div className="space-y-2">
              {vm.pendingAssignments.map(a => <AssignmentCard key={a.id} a={a} onSubmit={vm.submitEvidence} />)}
            </div>
          </div>
        )}
        {vm.completedAssignments.length > 0 && (
          <div>
            <VillageSection label="Concluídas"><CheckCircle2 size={10} style={{ color: '#285a38' }} /></VillageSection>
            <div className="space-y-2">
              {vm.completedAssignments.slice(0, 10).map(a => <AssignmentCard key={a.id} a={a} onSubmit={vm.submitEvidence} />)}
            </div>
          </div>
        )}
        {vm.myAssignments.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 16px', gap: 10 }}>
            <Star size={24} style={{ color: P.border }} />
            <span style={{ color: P.border, fontSize: 11, fontFamily: P.fontLabel }}>Nenhuma missão atribuída</span>
            <span style={{ color: P.border, fontSize: 9, fontFamily: P.fontLabel }}>Visite o Quadro de Missões para aceitar uma</span>
          </div>
        )}
      </div>
    </div>
  )
}

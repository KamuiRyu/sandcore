import { useState } from 'react'
import { RefreshCw, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useManagerViewModel } from '../viewModels/useManager.viewModel'
import {
  VillageSection, VillageCard, VillagePrimaryButton, VillageSecondaryButton,
  VillageSelect, VillageIconButton
} from '../components/VillageSection'

export const ManagerScreen = () => {
  const vm = useManagerViewModel()
  const [addUserId, setAddUserId] = useState('')
  const [addRoleId, setAddRoleId] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  if (vm.loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span style={{ color: '#9a7a40', fontSize: 13, fontFamily: "'Orbitron', sans-serif" }}>Carregando...</span>
      </div>
    )
  }

  const handleAddMember = async () => {
    if (!addUserId || !addRoleId) return
    await vm.addMember(addUserId, addRoleId)
    setAddUserId('')
    setAddRoleId('')
  }

  const handleTax = async (userId: string) => {
    setSaving(`tax-${userId}`)
    try {
      await vm.registerTax(userId)
    } finally {
      setSaving(null)
    }
  }

  const periodLabel = vm.taxPeriod === 'weekly' ? 'semana' : 'mês'

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ color: '#e8d5a0' }}>
      <div className="flex items-center justify-between mb-4 flex-none">
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#c8860a', fontFamily: "'Cinzel', serif" }}>
            Gestão de Organização
          </div>
          <div style={{ fontSize: 11, color: '#9a7a40', fontFamily: "'Orbitron', sans-serif", marginTop: 2 }}>
            Semana: {vm.weekStart} · Taxa: {periodLabel}
          </div>
        </div>
        <button onClick={vm.reload} style={{ color: '#9a7a40', background: 'transparent', border: '1px solid #1e1e1e', borderRadius: 3, padding: 5, cursor: 'pointer', display: 'flex' }}>
          <RefreshCw size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-5">
        {vm.error && (
          <div className="p-3 bg-red-950/40 border border-red-900 rounded text-red-400 text-xs font-mono">
            {vm.error}
          </div>
        )}

        {/* Add member */}
        <div>
          <VillageSection label="Adicionar Membro" />
          <VillageCard>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div style={{ fontSize: 11, color: '#9a7a40', marginBottom: 5, fontFamily: "'Orbitron', sans-serif" }}>NINJA</div>
                <VillageSelect value={addUserId} onChange={setAddUserId}>
                  <option value="">Selecionar...</option>
                  {vm.availableUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </VillageSelect>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9a7a40', marginBottom: 5, fontFamily: "'Orbitron', sans-serif" }}>CARGO</div>
                <VillageSelect value={addRoleId} onChange={setAddRoleId}>
                  <option value="">Selecionar...</option>
                  {vm.orgRoles.map(r => (
                    <option key={r.id} value={r.id}>{r.role_name}</option>
                  ))}
                </VillageSelect>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <VillagePrimaryButton onClick={handleAddMember} disabled={!addUserId || !addRoleId}>
                  <Plus size={11} /> Adicionar
                </VillagePrimaryButton>
              </div>
            </div>
          </VillageCard>
        </div>

        {/* Members list */}
        <div>
          <VillageSection label={`Membros da Organização (${vm.members.length})`} />
          {vm.members.length === 0 ? (
            <div style={{ color: '#282828', fontSize: 12, textAlign: 'center', padding: '20px 0', fontFamily: "'Orbitron', sans-serif" }}>
              Nenhum membro nesta organização
            </div>
          ) : (
            <div className="space-y-2">
              {vm.members.map(member => {
                const u = vm.allUsers.find(u => u.id === member.user)
                const role = vm.orgRoles.find(r => r.id === member.role)
                const taxPaid = vm.isTaxPaid(member.user)
                const blockStatus = vm.isBlocked(member.user)
                const taxValue = (role?.yens_per_minute ?? 0) * 60

                return (
                  <VillageCard key={member.id ?? member.user}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <div className="flex-1">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          {blockStatus.blocked ? (
                            <AlertCircle size={12} style={{ color: '#e07070' }} />
                          ) : (
                            <CheckCircle2 size={12} style={{ color: '#5ac87a' }} />
                          )}
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#e8d5a0' }}>{u?.name || member.user}</span>
                          {role && <span style={{ fontSize: 11, color: '#9a7a40', fontFamily: "'Orbitron', sans-serif" }}>{role.role_name}</span>}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: '#9a7a40', fontFamily: "'Orbitron', sans-serif" }}>
                            IMPOSTO {taxValue > 0 ? `(${taxValue}¥)` : ''}
                          </span>
                          {taxPaid ? (
                            <span style={{ fontSize: 11, color: '#5ac87a', fontFamily: "'Orbitron', sans-serif" }}>
                              ✓ {member.tax_amount}¥ · {member.last_tax_paid?.slice(0, 10)}
                            </span>
                          ) : (
                            <>
                              <span style={{ fontSize: 11, color: '#e07070', fontFamily: "'Orbitron', sans-serif" }}>pendente</span>
                              <VillageSecondaryButton small onClick={() => handleTax(member.user)} disabled={saving === `tax-${member.user}`}>
                                {saving === `tax-${member.user}` ? '...' : 'Confirmar'}
                              </VillageSecondaryButton>
                            </>
                          )}
                        </div>
                      </div>

                      <VillageIconButton icon={Trash2} danger onClick={() => vm.removeMember(member.id || member.user)} title="Remover da organização" />
                    </div>
                  </VillageCard>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

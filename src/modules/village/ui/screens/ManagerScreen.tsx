import { useState } from 'react'
import { RefreshCw, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useManagerViewModel } from '../viewModels/useManager.viewModel'
import {
  VillageSection, VillageCard, VillagePrimaryButton, VillageSecondaryButton,
  VillageInput, VillageSelect, VillageIconButton
} from '../components/VillageSection'

export const ManagerScreen = () => {
  const vm = useManagerViewModel()
  const [addUserId, setAddUserId] = useState('')
  const [addRoleId, setAddRoleId] = useState('')
  const [taxAmounts, setTaxAmounts] = useState<Record<string, string>>({})
  const [donationAmounts, setDonationAmounts] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  if (vm.loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span style={{ color: '#9a7a40', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>Carregando...</span>
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
    const amount = parseFloat(taxAmounts[userId] || '0')
    if (!amount) return
    setSaving(`tax-${userId}`)
    await vm.registerTax(userId, amount)
    setTaxAmounts(m => ({ ...m, [userId]: '' }))
    setSaving(null)
  }

  const handleDonation = async (userId: string) => {
    const amount = parseFloat(donationAmounts[userId] || '0')
    if (!amount) return
    setSaving(`don-${userId}`)
    await vm.registerDonation(userId, amount)
    setDonationAmounts(m => ({ ...m, [userId]: '' }))
    setSaving(null)
  }

  const ORG_LABELS: Record<string, string> = { policia: 'Polícia', hospital: 'Hospital', assistente: 'Assistentes' }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ color: '#e8d5a0' }}>
      <div className="flex items-center justify-between mb-4 flex-none">
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#c8860a', fontFamily: "'Cinzel', serif" }}>
            Gestão de Organização
          </div>
          <div style={{ fontSize: 9, color: '#9a7a40', fontFamily: "'JetBrains Mono', monospace" }}>
            Semana: {vm.weekStart} · Período: {vm.period}
          </div>
        </div>
        <button onClick={vm.reload} style={{ color: '#9a7a40', background: 'transparent', border: '1px solid #2e1e06', borderRadius: 3, padding: 5, cursor: 'pointer', display: 'flex' }}>
          <RefreshCw size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-5">

        {/* Add member */}
        <div>
          <VillageSection label="Adicionar Membro" />
          <VillageCard>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div style={{ fontSize: 9, color: '#9a7a40', marginBottom: 3, fontFamily: "'JetBrains Mono', monospace" }}>NINJA</div>
                <VillageSelect value={addUserId} onChange={setAddUserId}>
                  <option value="">Selecionar...</option>
                  {vm.availableUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </VillageSelect>
              </div>
              <div>
                <div style={{ fontSize: 9, color: '#9a7a40', marginBottom: 3, fontFamily: "'JetBrains Mono', monospace" }}>CARGO</div>
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
          <VillageSection label={`Membros da Semana (${vm.members.length})`} />
          {vm.members.length === 0 ? (
            <div style={{ color: '#4a2f0a', fontSize: 10, textAlign: 'center', padding: '20px 0', fontFamily: "'JetBrains Mono', monospace" }}>
              Nenhum membro nesta semana
            </div>
          ) : (
            <div className="space-y-2">
              {vm.members.map(member => {
                const u = vm.allUsers.find(u => u.id === member.user)
                const role = vm.orgRoles.find(r => r.id === member.role)
                const tax = vm.taxMap[member.user]
                const donation = vm.donationMap[member.user]
                const blockStatus = vm.isBlocked(member.user)

                return (
                  <VillageCard key={member.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div className="flex-1">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          {blockStatus.blocked ? (
                            <AlertCircle size={12} style={{ color: '#e07070' }} />
                          ) : (
                            <CheckCircle2 size={12} style={{ color: '#5ac87a' }} />
                          )}
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#e8d5a0' }}>{u?.name || member.user}</span>
                          {role && <span style={{ fontSize: 9, color: '#9a7a40', fontFamily: "'JetBrains Mono', monospace" }}>{role.role_name}</span>}
                          {blockStatus.blocked && <span style={{ fontSize: 9, color: '#e07070', fontFamily: "'JetBrains Mono', monospace" }}>⚠ {blockStatus.reason}</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Tax */}
                          <div>
                            <div style={{ fontSize: 9, color: '#9a7a40', marginBottom: 3, fontFamily: "'JetBrains Mono', monospace" }}>
                              IMPOSTO {tax ? `(✓ ${tax.amount}¥)` : '(pendente)'}
                            </div>
                            {!tax && (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <VillageInput
                                  type="number"
                                  value={taxAmounts[member.user] || ''}
                                  onChange={v => setTaxAmounts(m => ({ ...m, [member.user]: v }))}
                                  placeholder="Valor"
                                />
                                <VillageSecondaryButton small onClick={() => handleTax(member.user)} disabled={saving === `tax-${member.user}`}>
                                  {saving === `tax-${member.user}` ? '...' : 'OK'}
                                </VillageSecondaryButton>
                              </div>
                            )}
                          </div>

                          {/* Donation */}
                          <div>
                            <div style={{ fontSize: 9, color: '#9a7a40', marginBottom: 3, fontFamily: "'JetBrains Mono', monospace" }}>
                              DOAÇÃO {donation ? `(✓ ${donation.amount}¥)` : '(pendente)'}
                            </div>
                            {!donation && (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <VillageInput
                                  type="number"
                                  value={donationAmounts[member.user] || ''}
                                  onChange={v => setDonationAmounts(m => ({ ...m, [member.user]: v }))}
                                  placeholder="Valor"
                                />
                                <VillageSecondaryButton small onClick={() => handleDonation(member.user)} disabled={saving === `don-${member.user}`}>
                                  {saving === `don-${member.user}` ? '...' : 'OK'}
                                </VillageSecondaryButton>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <VillageIconButton icon={Trash2} danger onClick={() => vm.removeMember(member.id)} title="Remover da semana" />
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

import React, { useState } from 'react'
import { Loader2, Users, UserPlus, Plus, Copy, LogOut, Shield } from 'lucide-react'
import { useGroupViewModel } from '../viewModels/useGroup.viewModel'
import {
  ParchSection, ParchCard, ParchRowList, ParchRow,
  ParchPrimaryBtn, ParchSecondaryBtn, ParchDangerBtn, P,
} from '../../../../components/ui/ParchmentUI'

export const GroupsScreen = () => {
  const {
    group, members,
    loading: groupLoading, error: groupError, setError: setGroupError,
    copySuccess, createGroup, joinGroup, leaveGroup, copyInviteCode,
  } = useGroupViewModel()

  const [joinCode, setJoinCode] = useState('')
  const [newGroupName, setNewGroupName] = useState('')

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ color: P.darkBrown }}>
      {groupLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin w-8 h-8 mb-2" style={{ color: P.darkBrown, opacity: 0.5 }} />
          <span style={{ fontFamily: P.fontValue, fontSize: 10, color: '#7a5030' }}>Carregando informações do clã...</span>
        </div>
      ) : !group ? (
        <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1 custom-scrollbar space-y-4">
          {/* Empty state */}
          <div style={{
            borderRadius: 5, border: `1.5px dashed ${P.dashed}`,
            padding: '16px', textAlign: 'center', background: P.subtleBg,
          }}>
            <Users size={28} style={{ margin: '0 auto 8px', color: P.darkBrown, opacity: 0.3 }} />
            <p style={{ fontFamily: P.fontValue, fontSize: 10, color: '#7a5030', lineHeight: 1.5 }}>
              Você não faz parte de nenhum grupo tático. Crie o seu clã ou entre em um existente para compartilhar pontos no mapa.
            </p>
          </div>

          {groupError && (
            <div style={{
              fontSize: 10, padding: '8px 10px', borderRadius: 4, fontFamily: P.fontValue,
              background: 'rgba(120,20,20,.10)', border: '1px solid rgba(160,40,40,.35)', color: '#8a2020',
            }}>
              {groupError}
            </div>
          )}

          {/* Entrar */}
          <div className="space-y-2">
            <ParchSection>Entrar no Grupo</ParchSection>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Código (ex: ABC123)"
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setGroupError(null) }}
                style={{
                  flex: 1, borderRadius: 4, padding: '6px 10px', fontSize: 10,
                  background: P.subtleBg, border: `1px solid ${P.border}`,
                  color: P.darkBrown, fontFamily: P.fontValue, outline: 'none',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(90,55,20,.55)')}
                onBlur={e => (e.currentTarget.style.borderColor = P.border)}
              />
              <ParchPrimaryBtn onClick={() => joinGroup(joinCode)} disabled={!joinCode.trim() || groupLoading} padding="8px 14px">
                <UserPlus size={13} /> ENTRAR
              </ParchPrimaryBtn>
            </div>
          </div>

          {/* Criar */}
          <div className="space-y-2">
            <ParchSection>Criar Novo Clã</ParchSection>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome do seu clã"
                value={newGroupName}
                onChange={(e) => { setNewGroupName(e.target.value); setGroupError(null) }}
                style={{
                  flex: 1, borderRadius: 4, padding: '6px 10px', fontSize: 10,
                  background: P.subtleBg, border: `1px solid ${P.border}`,
                  color: P.darkBrown, fontFamily: P.fontValue, outline: 'none',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(90,55,20,.55)')}
                onBlur={e => (e.currentTarget.style.borderColor = P.border)}
              />
              <ParchSecondaryBtn onClick={() => createGroup(newGroupName)} disabled={!newGroupName.trim() || groupLoading} padding="8px 14px">
                <Plus size={13} /> CRIAR
              </ParchSecondaryBtn>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden space-y-4">
            {/* Group Card */}
            <ParchCard accent="linear-gradient(180deg,#5a341a,#3a2010)">
              <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: 8, opacity: 0.05 }}>
                <Shield size={40} style={{ color: P.darkBrown }} />
              </div>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontFamily: P.fontLabel, fontSize: 9, letterSpacing: '0.1em', color: '#7a5030', textTransform: 'uppercase' }}>
                    Grupo Ativo
                  </span>
                  <h4 style={{ fontFamily: P.fontLabel, fontWeight: 900, fontSize: 13, color: P.darkBrown, letterSpacing: '0.08em', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                    {group.name}
                  </h4>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                  borderRadius: 4, background: P.subtleBg, boxShadow: `inset 0 0 0 1px ${P.border}`,
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontFamily: P.fontLabel, fontSize: 8, letterSpacing: '0.08em', color: '#7a5030', marginBottom: 2 }}>CONVITE</span>
                    <span style={{ fontFamily: P.fontLabel, fontSize: 12, fontWeight: 900, letterSpacing: '0.1em', color: P.darkBrown }}>{group.inviteCode}</span>
                  </div>
                  <ParchSecondaryBtn onClick={copyInviteCode} padding="4px 8px">
                    <Copy size={9} />{copySuccess ? 'COPIADO!' : 'COPIAR'}
                  </ParchSecondaryBtn>
                </div>
              </div>
            </ParchCard>

            {/* Members */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-[100px]">
              <ParchSection>Membros ({members.length})</ParchSection>
              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                <ParchRowList>
                  {members.map((member, idx) => (
                    <ParchRow key={member.id} isLast={idx === members.length - 1}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 4, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontFamily: P.fontLabel, fontWeight: 900, fontSize: 11,
                          background: P.subtleBg, boxShadow: `inset 0 0 0 1px ${P.border}`, color: P.darkBrown,
                        }}>
                          {member.userName.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontFamily: P.fontValue, fontSize: 11, fontWeight: 700, color: P.darkBrown }}>{member.userName}</span>
                          <span style={{ fontFamily: P.fontLabel, fontSize: 9, color: '#7a5030', marginTop: 1 }}>
                            {member.role === 'admin' ? 'Líder' : 'Membro'}
                          </span>
                        </div>
                      </div>
                      {member.role === 'admin' && <Shield size={12} style={{ color: P.darkBrown, opacity: 0.5 }} />}
                    </ParchRow>
                  ))}
                </ParchRowList>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <ParchDangerBtn onClick={leaveGroup} width="100%">
              <LogOut size={13} /> SAIR DO CLÃ
            </ParchDangerBtn>
          </div>
        </div>
      )}
    </div>
  )
}
export default GroupsScreen

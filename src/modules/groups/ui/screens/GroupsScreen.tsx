import React, { useState } from 'react'
import { Loader2, Users, UserPlus, Plus, Copy, LogOut, Shield } from 'lucide-react'
import { useGroupViewModel } from '../viewModels/useGroup.viewModel'

const SL = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-2">
    <span style={{ color: '#c8a030', fontSize: 10, fontFamily: "'Orbitron', sans-serif" }}>[</span>
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Orbitron', sans-serif", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c8a030', whiteSpace: 'nowrap' }}>
      {children}
    </span>
    <div className="flex-1" style={{ borderTop: '1px dashed rgba(200,160,48,0.25)' }} />
    <span style={{ color: '#c8a030', fontSize: 10, fontFamily: "'Orbitron', sans-serif" }}>]</span>
  </div>
)

const TechCard = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => (
  <div style={{ background: 'rgba(8,8,8,0.7)', border: '1px solid #3a2508', borderRadius: 3, padding: '14px 14px', position: 'relative', overflow: 'hidden', ...style }}>
    <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: 'linear-gradient(180deg,#c8860a,#7a4e08)' }} />
    <div style={{ position: 'absolute', top: 6, left: 6, width: 10, height: 10, borderTop: '1px solid #c8860a', borderLeft: '1px solid #c8860a' }} />
    <div style={{ position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderTop: '1px solid #c8860a', borderRight: '1px solid #c8860a' }} />
    <div style={{ position: 'absolute', bottom: 6, left: 6, width: 10, height: 10, borderBottom: '1px solid #c8860a', borderLeft: '1px solid #c8860a' }} />
    <div style={{ position: 'absolute', bottom: 6, right: 6, width: 10, height: 10, borderBottom: '1px solid #c8860a', borderRight: '1px solid #c8860a' }} />
    <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
  </div>
)

const ListContainer = ({ children }: { children: React.ReactNode }) => (
  <div style={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #1e1e1e' }}>
    {children}
  </div>
)

const ListItem = ({ children, isLast = false }: { children: React.ReactNode, isLast?: boolean }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      fontSize: 10,
      background: 'rgba(8,8,8,0.8)',
      borderBottom: isLast ? 'none' : '1px solid rgba(30,30,30,0.7)',
    }}
  >
    {children}
  </div>
)

const PrimaryButton = ({ children, onClick, disabled = false, padding = '5px 12px' }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, padding?: string }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', gap: 6, padding, borderRadius: 3,
      background: 'linear-gradient(135deg,#b87a08,#e8a820)', color: '#0a0800', border: 'none',
      fontWeight: 700, fontSize: 9, fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em',
      cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: disabled ? 0.5 : 1
    }}
  >
    {children}
  </button>
)

const SecondaryButton = ({ children, onClick, disabled = false, padding = '4px 10px' }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, padding?: string }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding,
      borderRadius: 3, background: 'transparent', border: '1px solid #1e1e1e', color: '#c8a840',
      fontSize: 9, fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: '0.08em',
      cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
      whiteSpace: 'nowrap'
    }}
    onMouseEnter={e => { if(!disabled) { e.currentTarget.style.background = 'rgba(40,40,40,0.25)'; e.currentTarget.style.borderColor = '#6a4e18'; e.currentTarget.style.color = '#e8c860'; } }}
    onMouseLeave={e => { if(!disabled) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#c8a840'; } }}
  >
    {children}
  </button>
)

const ErrorButton = ({ children, onClick, disabled = false }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 14px', borderRadius: 3,
      background: 'rgba(120,20,20,0.2)', border: '1px solid #7a1414', color: '#e07070',
      fontWeight: 700, fontSize: 9, fontFamily: "'Orbitron', sans-serif", cursor: disabled ? 'not-allowed' : 'pointer', letterSpacing: '0.08em',
      transition: 'all 0.15s', opacity: disabled ? 0.5 : 1, width: '100%'
    }}
    onMouseEnter={e => { if(!disabled) { e.currentTarget.style.background = 'rgba(120,20,20,0.4)'; } }}
    onMouseLeave={e => { if(!disabled) { e.currentTarget.style.background = 'rgba(120,20,20,0.2)'; } }}
  >
    {children}
  </button>
)

export const GroupsScreen = () => {
  const {
    group,
    members,
    loading: groupLoading,
    error: groupError,
    setError: setGroupError,
    copySuccess,
    createGroup,
    joinGroup,
    leaveGroup,
    copyInviteCode,
  } = useGroupViewModel()

  const [joinCode, setJoinCode] = useState('')
  const [newGroupName, setNewGroupName] = useState('')

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ color: '#e8d5a0' }}>
      {groupLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin w-8 h-8 mb-2" style={{ color: '#c8860a' }} />
          <span className="text-xs" style={{ color: '#9a7a40' }}>Carregando informações do clã...</span>
        </div>
      ) : !group ? (
        <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1 custom-scrollbar space-y-4">
          {/* Empty state */}
          <div
            className="rounded-[2px] border border-dashed p-4 text-center"
            style={{ borderColor: '#1e1e1e', background: 'rgba(8,8,8,0.8)' }}
          >
            <Users size={28} className="mx-auto mb-2 opacity-30" style={{ color: '#c8a030' }} />
            <p className="text-[11px] leading-normal" style={{ color: '#9a7a40' }}>
              Você não faz parte de nenhum grupo tático. Crie o seu clã ou entre em um existente para compartilhar pontos no mapa.
            </p>
          </div>

          {groupError && (
            <div
              className="text-[10px] p-2.5 rounded-[2px] font-medium border"
              style={{ background: 'rgba(139,26,26,0.15)', borderColor: '#8b1a1a', color: '#c0392b' }}
            >
              {groupError}
            </div>
          )}

          {/* Entrar */}
          <div className="space-y-2">
            <SL>Entrar no Grupo</SL>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Código (ex: ABC123)"
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setGroupError(null) }}
                className="flex-1 rounded-[2px] px-3 py-2 text-xs outline-none transition-colors"
                style={{
                  background: 'rgba(8,8,8,0.8)',
                  border: '1px solid #1e1e1e',
                  color: '#e8d5a0',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#c8860a')}
                onBlur={e => (e.currentTarget.style.borderColor = '#1e1e1e')}
              />
              <PrimaryButton onClick={() => joinGroup(joinCode)} disabled={!joinCode.trim() || groupLoading} padding="8px 14px">
                <UserPlus size={14} />
                ENTRAR
              </PrimaryButton>
            </div>
          </div>

          {/* Criar */}
          <div className="space-y-2">
            <SL>Criar Novo Clã</SL>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome do seu clã"
                value={newGroupName}
                onChange={(e) => { setNewGroupName(e.target.value); setGroupError(null) }}
                className="flex-1 rounded-[2px] px-3 py-2 text-xs outline-none transition-colors"
                style={{
                  background: 'rgba(8,8,8,0.8)',
                  border: '1px solid #1e1e1e',
                  color: '#e8d5a0',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#c8860a')}
                onBlur={e => (e.currentTarget.style.borderColor = '#1e1e1e')}
              />
              <SecondaryButton onClick={() => createGroup(newGroupName)} disabled={!newGroupName.trim() || groupLoading} padding="8px 14px">
                <Plus size={14} />
                CRIAR
              </SecondaryButton>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden space-y-4">
            {/* Group Card */}
            <TechCard>
              <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-[0.04] pointer-events-none z-0">
                <Shield size={40} style={{ color: '#c8860a' }} />
              </div>
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider"
                    style={{ fontFamily: "'Cinzel', serif", color: '#9a7a40' }}
                  >
                    Grupo Ativo
                  </span>
                  <h4
                    className="text-sm font-black mt-0.5 truncate max-w-[140px] leading-tight"
                    style={{ color: '#f0e8c0', fontFamily: "'Cinzel', serif", letterSpacing: '0.08em' }}
                  >
                    {group.name}
                  </h4>
                </div>
                <div
                  className="flex items-center gap-2 rounded-[2px] p-1.5 px-2"
                  style={{ background: 'rgba(8,8,8,0.8)', border: '1px solid #1e1e1e' }}
                >
                  <div className="flex flex-col">
                    <span className="text-[8px] font-mono font-bold uppercase leading-none mb-0.5" style={{ color: '#9a7a40' }}>
                      Convite
                    </span>
                    <span className="text-[11px] font-mono font-black tracking-wider leading-none" style={{ color: '#c8860a' }}>
                      {group.inviteCode}
                    </span>
                  </div>
                  <SecondaryButton onClick={copyInviteCode} padding="4px 8px">
                    <Copy size={9} />
                    {copySuccess ? 'COPIADO!' : 'COPIAR'}
                  </SecondaryButton>
                </div>
              </div>
            </TechCard>

            {/* Members */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-[100px]">
              <SL>Membros ({members.length})</SL>
              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                <ListContainer>
                  {members.map((member, idx) => (
                    <ListItem key={member.id} isLast={idx === members.length - 1}>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-7 w-7 rounded-[3px] flex items-center justify-center font-black text-[11px] uppercase"
                          style={{ background: 'rgba(200,134,10,0.08)', border: '1px solid #c8860a', color: '#c8860a' }}
                        >
                          {member.userName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold leading-tight" style={{ color: '#e8d5a0' }}>
                            {member.userName}
                          </span>
                          <span className="text-[9px] font-mono uppercase leading-none mt-1" style={{ color: '#9a7a40', letterSpacing: '0.04em' }}>
                            {member.role === 'admin' ? 'Líder' : 'Membro'}
                          </span>
                        </div>
                      </div>
                      {member.role === 'admin' && (
                        <Shield size={12} style={{ color: '#c8860a', opacity: 0.8 }} />
                      )}
                    </ListItem>
                  ))}
                </ListContainer>
              </div>
            </div>
          </div>

          {/* Leave */}
          <div className="mt-3">
            <ErrorButton onClick={leaveGroup}>
              <LogOut size={13} />
              SAIR DO CLÃ
            </ErrorButton>
          </div>
        </div>
      )}
    </div>
  )
}
export default GroupsScreen

import React, { useState } from 'react'
import { Loader2, Users, UserPlus, Plus, Copy, LogOut, Shield } from 'lucide-react'
import { useGroupViewModel } from '../viewModels/useGroup.viewModel'

const SL = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, #4a2f0a)' }} />
    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9a7a40' }}>
      {children}
    </span>
    <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #4a2f0a, transparent)' }} />
  </div>
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
            style={{ borderColor: '#4a2f0a', background: 'rgba(13,10,5,0.4)' }}
          >
            <Users size={28} className="mx-auto mb-2 opacity-30" style={{ color: '#9a7a40' }} />
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
                  background: 'rgba(13,10,5,0.6)',
                  border: '1px solid #4a2f0a',
                  color: '#e8d5a0',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#c8860a')}
                onBlur={e => (e.currentTarget.style.borderColor = '#4a2f0a')}
              />
              <button
                onClick={() => joinGroup(joinCode)}
                disabled={!joinCode.trim() || groupLoading}
                className="px-4 py-2 rounded-[2px] font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
                style={{ background: 'linear-gradient(135deg,#4a2f0a,#c8860a)', color: '#0d0a05' }}
              >
                <UserPlus size={14} />
                Entrar
              </button>
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
                  background: 'rgba(13,10,5,0.6)',
                  border: '1px solid #4a2f0a',
                  color: '#e8d5a0',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#c8860a')}
                onBlur={e => (e.currentTarget.style.borderColor = '#4a2f0a')}
              />
              <button
                onClick={() => createGroup(newGroupName)}
                disabled={!newGroupName.trim() || groupLoading}
                className="px-4 py-2 rounded-[2px] font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
                style={{ background: 'rgba(74,47,10,0.6)', border: '1px solid #4a2f0a', color: '#d4a85a' }}
              >
                <Plus size={14} />
                Criar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden space-y-3">
            {/* Group Card */}
            <div
              className="rounded-[2px] p-2.5 relative overflow-hidden"
              style={{ background: 'rgba(74,47,10,0.15)', border: '1px solid #4a2f0a' }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-[0.04] pointer-events-none">
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
                    style={{ color: '#f0d9a0' }}
                  >
                    {group.name}
                  </h4>
                </div>
                <div
                  className="flex items-center gap-2 rounded-[2px] p-1.5 px-2"
                  style={{ background: 'rgba(13,10,5,0.6)', border: '1px solid #4a2f0a' }}
                >
                  <div className="flex flex-col">
                    <span className="text-[8px] font-mono font-bold uppercase leading-none mb-0.5" style={{ color: '#9a7a40' }}>
                      Convite
                    </span>
                    <span className="text-[11px] font-mono font-black tracking-wider leading-none" style={{ color: '#c8860a' }}>
                      {group.inviteCode}
                    </span>
                  </div>
                  <button
                    onClick={copyInviteCode}
                    className="flex items-center gap-1 rounded-[2px] px-2 py-1 text-[8px] font-bold uppercase transition-all active:scale-95 cursor-pointer border"
                    style={copySuccess
                      ? { background: 'rgba(45,110,45,0.2)', borderColor: '#2d6e2d', color: '#4caf50' }
                      : { background: 'rgba(74,47,10,0.4)', borderColor: '#4a2f0a', color: '#d4a85a' }
                    }
                  >
                    <Copy size={9} />
                    {copySuccess ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>

            {/* Members */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-[100px]">
              <SL>Membros ({members.length})</SL>
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-[2px]"
                    style={{ background: 'rgba(13,10,5,0.5)', border: '1px solid #4a2f0a' }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded-[2px] flex items-center justify-center font-black text-[10px] uppercase"
                        style={{ background: 'rgba(200,134,10,0.12)', border: '1px solid rgba(200,134,10,0.3)', color: '#c8860a' }}
                      >
                        {member.userName.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold leading-tight" style={{ color: '#e8d5a0' }}>
                          {member.userName}
                        </span>
                        <span className="text-[8px] font-mono uppercase leading-none mt-0.5" style={{ color: '#9a7a40' }}>
                          {member.role === 'admin' ? 'Líder' : 'Membro'}
                        </span>
                      </div>
                    </div>
                    {member.role === 'admin' && (
                      <Shield size={11} style={{ color: '#c8860a', opacity: 0.7 }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leave */}
          <button
            onClick={leaveGroup}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[2px] py-2 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer border"
            style={{ background: 'rgba(139,26,26,0.15)', borderColor: '#8b1a1a', color: '#c0392b' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,26,26,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,26,26,0.15)' }}
          >
            <LogOut size={13} />
            Sair do Grupo
          </button>
        </div>
      )}
    </div>
  )
}
export default GroupsScreen

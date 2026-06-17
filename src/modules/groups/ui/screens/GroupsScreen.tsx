import { useState } from 'react'
import { Shield, Loader2, Users, UserPlus, Plus, Copy, LogOut } from 'lucide-react'
import { useGroupViewModel } from '../viewModels/useGroup.viewModel'

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
    <div className="flex flex-col h-full overflow-hidden">
      <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-1">
        <Shield className="w-5 h-5 text-teal-400" />
        Sistema de Clã
      </h2>
      <div className="h-[1px] bg-slate-800/60 w-full mb-3"></div>

      {groupLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-teal-500 w-8 h-8 mb-2" />
          <span className="text-xs text-slate-400">Carregando informações do clã...</span>
        </div>
      ) : !group ? (
        <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1 custom-scrollbar">
          <div className="space-y-4">
            <div className="rounded-xl border border-dashed border-[#1E2732] bg-[#11161D]/30 p-4 text-center">
              <Users size={28} className="mx-auto text-slate-600 mb-2 opacity-40" />
              <p className="text-[11px] text-slate-400 leading-normal">
                Você não faz parte de nenhum grupo tático. Crie o seu clã ou entre em um existente para compartilhar pontos no mapa.
              </p>
            </div>

            {groupError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] p-2.5 rounded-lg font-medium">
                {groupError}
              </div>
            )}

            {/* Entrar no Grupo */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 ml-1">
                Entrar no Grupo
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Código (ex: ABC123)"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase())
                    setGroupError(null)
                  }}
                  className="flex-1 rounded-xl border border-[#222B37] bg-[#11161D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500/50 transition-colors"
                />
                <button
                  onClick={() => joinGroup(joinCode)}
                  disabled={!joinCode.trim() || groupLoading}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                >
                  <UserPlus size={14} />
                  Entrar
                </button>
              </div>
            </div>

            {/* Criar Novo Clã */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 ml-1">
                Criar Novo Clã
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome do seu clã"
                  value={newGroupName}
                  onChange={(e) => {
                    setNewGroupName(e.target.value)
                    setGroupError(null)
                  }}
                  className="flex-1 rounded-xl border border-[#222B37] bg-[#11161D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500/50 transition-colors"
                />
                <button
                  onClick={() => createGroup(newGroupName)}
                  disabled={!newGroupName.trim() || groupLoading}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-white text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Plus size={14} />
                  Criar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden space-y-3">
            {/* Group Details Card */}
            <div className="rounded-xl border border-teal-500/15 bg-teal-950/5 p-2.5 relative overflow-hidden group">
              <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-5 pointer-events-none">
                <Shield size={36} className="text-teal-400" />
              </div>
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-teal-400/80">
                    Grupo Ativo
                  </span>
                  <h4 className="text-sm font-black text-white mt-0.5 truncate max-w-[140px] leading-tight">
                    {group.name}
                  </h4>
                </div>
                <div className="flex items-center gap-2 bg-[#0B0E12]/80 border border-[#1E2732] rounded-lg p-1.5 px-2">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-mono font-bold uppercase text-slate-500 leading-none mb-0.5">
                      Convite
                    </span>
                    <span className="text-[11px] font-mono font-black text-teal-400 tracking-wider leading-none">
                      {group.inviteCode}
                    </span>
                  </div>
                  <button
                    onClick={copyInviteCode}
                    className={`flex items-center gap-1 rounded px-2 py-1 text-[8px] font-bold uppercase transition-all active:scale-95 cursor-pointer border ${
                      copySuccess 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    <Copy size={9} />
                    {copySuccess ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>

            {/* Members List */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-[100px]">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 ml-1 mb-2 block">
                Membros ({members.length})
              </span>
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#11161D] border border-slate-800/60"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-teal-500/10 flex items-center justify-center text-teal-400 font-black text-[10px] border border-teal-500/20 uppercase">
                        {member.userName.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white leading-tight">
                          {member.userName}
                        </span>
                        <span className="text-[8px] font-mono text-slate-500 uppercase leading-none mt-0.5">
                          {member.role === 'admin' ? 'Líder' : 'Membro'}
                        </span>
                      </div>
                    </div>
                    {member.role === 'admin' && (
                      <Shield size={11} className="text-teal-400 opacity-60" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leave Group Button */}
          <button
            onClick={leaveGroup}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-950/10 py-2 text-xs font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 transition-all active:scale-95 cursor-pointer"
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

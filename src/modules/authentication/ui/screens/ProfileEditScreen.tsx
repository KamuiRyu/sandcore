import { useState, useEffect, useRef } from 'react'
import { Camera, Save, Link, Unlink, Loader2, Check, AlertCircle, User } from 'lucide-react'
import { pb } from '../../../../lib/pocketbase'
import { pbAuthRepository } from '../../infrastructure/adapters/PocketBaseAuth.adapter'

const DISCORD_COLOR = '#5865F2'
const GOOGLE_COLOR = '#4285F4'

function getAvatarUrl(model: any): string | null {
  if (!model?.avatar) return null
  return `${pb.baseURL}/api/files/users/${model.id}/${model.avatar}`
}

export const ProfileEditScreen = () => {
  const model = pb.authStore.model
  const [name, setName] = useState(model?.name || '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(getAvatarUrl(model))
  const [avatarFile, setAvatarFile] = useState<File | null | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)
  const [nameError, setNameError] = useState('')
  const [externalAuths, setExternalAuths] = useState<{ provider: string }[]>([])
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null)
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null)
  const [providerError, setProviderError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    pbAuthRepository.listExternalAuths().then(setExternalAuths)
  }, [])

  const isLinked = (provider: string) => externalAuths.some(a => a.provider === provider)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setNameError('')
    if (!name.trim()) { setNameError('Nome não pode ser vazio.'); return }
    setSaving(true)
    const result = await pbAuthRepository.updateCurrentUser({
      name: name.trim(),
      avatar: avatarFile,
    })
    setSaving(false)
    if (!result.success) { setNameError(result.error.message); return }
    setAvatarFile(undefined)
    setAvatarPreview(getAvatarUrl(pb.authStore.model))
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  const handleLink = async (provider: 'google' | 'discord') => {
    setProviderError('')
    setLinkingProvider(provider)
    const result = await pbAuthRepository.authWithOAuth2(provider)
    setLinkingProvider(null)
    if (!result.success) { setProviderError(result.error.message); return }
    const auths = await pbAuthRepository.listExternalAuths()
    setExternalAuths(auths)
  }

  const handleUnlink = async (provider: string) => {
    setProviderError('')
    setUnlinkingProvider(provider)
    const result = await pbAuthRepository.unlinkExternalAuth(provider)
    setUnlinkingProvider(null)
    if (!result.success) { setProviderError(result.error.message); return }
    setExternalAuths(prev => prev.filter(a => a.provider !== provider))
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto" style={{ fontFamily: "'Orbitron', sans-serif" }}>

      {/* Avatar */}
      <Section label="Foto de Perfil">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div
              className="flex items-center justify-center overflow-hidden"
              style={{
                width: 80, height: 80, borderRadius: '50%',
                border: '2px solid #c8860a',
                background: '#111',
              }}
            >
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                : <User size={32} color="#9a7a40" />
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              title="Alterar foto"
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 24, height: 24, borderRadius: '50%',
                background: '#c8860a', border: '2px solid #0a0a0a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Camera size={12} color="#0a0800" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div style={{ color: '#6a5028', fontSize: 10, lineHeight: 1.6 }}>
            <p>Clique no ícone para alterar</p>
            <p>JPG, PNG ou WEBP</p>
            <p>Máx. 2 MB</p>
          </div>
        </div>
      </Section>

      {/* Name */}
      <Section label="Nome de Exibição">
        <div className="flex gap-2 items-start">
          <div className="flex-1 flex flex-col gap-1">
            <input
              value={name}
              onChange={e => { setName(e.target.value); setNameError(''); setNameSaved(false) }}
              maxLength={60}
              placeholder="Seu nome na aldeia"
              style={{
                background: '#111', border: `1px solid ${nameError ? '#c84040' : '#282828'}`,
                borderRadius: 3, padding: '8px 12px', color: '#e8d5a0',
                fontSize: 12, fontFamily: "'Orbitron', sans-serif",
                outline: 'none', width: '100%',
              }}
            />
            {nameError && (
              <span style={{ fontSize: 10, color: '#c84040', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={10} /> {nameError}
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: nameSaved ? '#2a5a1a' : 'linear-gradient(135deg,#b87a08,#e8a820)',
              color: nameSaved ? '#60c040' : '#0a0800',
              border: nameSaved ? '1px solid #40801a' : 'none',
              borderRadius: 3, padding: '8px 14px',
              fontSize: 10, fontFamily: "'Orbitron', sans-serif",
              fontWeight: 700, letterSpacing: '0.08em',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              flexShrink: 0, opacity: saving ? 0.7 : 1,
              transition: 'all 0.3s',
            }}
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : nameSaved ? <Check size={12} /> : <Save size={12} />}
            {nameSaved ? 'Salvo!' : 'Salvar'}
          </button>
        </div>
      </Section>

      {/* External links */}
      <Section label="Vinculações">
        {providerError && (
          <div style={{
            background: 'rgba(150,40,30,0.12)', border: '1px solid rgba(180,60,40,0.3)',
            borderRadius: 3, padding: '6px 10px', fontSize: 10, color: '#e06050',
            marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <AlertCircle size={11} /> {providerError}
          </div>
        )}
        <div className="flex flex-col gap-3">
          {(['discord', 'google'] as const).map(provider => {
            const linked = isLinked(provider)
            const busy = linkingProvider === provider || unlinkingProvider === provider
            const color = provider === 'discord' ? DISCORD_COLOR : GOOGLE_COLOR
            const label = provider === 'discord' ? 'Discord' : 'Google'
            return (
              <div key={provider} style={{
                background: '#0d0d0d', border: `1px solid ${linked ? color + '44' : '#1e1e1e'}`,
                borderRadius: 3, padding: '10px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div className="flex items-center gap-3">
                  <ProviderIcon provider={provider} size={18} />
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: linked ? '#e8d5a0' : '#6a5028' }}>{label}</p>
                    <p style={{ fontSize: 9, color: linked ? '#60a040' : '#4a3820', marginTop: 1 }}>
                      {linked ? 'Vinculado' : 'Não vinculado'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => linked ? handleUnlink(provider) : handleLink(provider)}
                  disabled={busy || !!linkingProvider || !!unlinkingProvider}
                  style={{
                    background: linked ? 'rgba(150,40,30,0.15)' : `${color}22`,
                    border: `1px solid ${linked ? 'rgba(180,60,40,0.4)' : color + '55'}`,
                    borderRadius: 3, padding: '5px 10px',
                    fontSize: 9, fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 700, letterSpacing: '0.06em',
                    color: linked ? '#c06050' : color,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                    opacity: busy ? 0.6 : 1, transition: 'all 0.2s',
                  }}
                >
                  {busy
                    ? <Loader2 size={10} className="animate-spin" />
                    : linked ? <Unlink size={10} /> : <Link size={10} />}
                  {linked ? 'Desvincular' : 'Vincular'}
                </button>
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}

/* ── helpers ── */

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center gap-2">
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: '#c8860a', textTransform: 'uppercase' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(200,134,10,0.3), transparent)' }} />
    </div>
    {children}
  </div>
)

const ProviderIcon = ({ provider, size }: { provider: string; size: number }) => {
  if (provider === 'discord') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={DISCORD_COLOR}>
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.028.016.054.038.071a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

import { useState, type FormEvent } from 'react'
import { SiDiscord, SiGoogle } from '@icons-pack/react-simple-icons'
import { ArrowRight, KeyRound, Loader2, Mail, ShieldCheck, UserPlus } from 'lucide-react'
import type { AuthProvider } from '../../core/entities/AuthProvider.entity'
import { useAuthViewModel } from '../viewModels/useAuth.viewModel'
import { Input } from '../../../../components/ui/Input'
import { Label } from '../../../../components/ui/Label'
import { Checkbox } from '../../../../components/ui/Checkbox'
import { AppModal } from '../../../app/ui/components/AppModal'
import { cn } from '../../../../lib/utils'

type AuthMode = 'login' | 'register'

type AuthModalProps = {
  onClose: () => void
}

type OAuthButtonProps = {
  disabled: boolean
  Icon: typeof SiGoogle
  isLoading: boolean
  label: string
  onClick: () => void
  tone: 'discord' | 'google'
}

const baseButtonClassName =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--field)] px-4 font-mono text-[0.64rem] font-black uppercase tracking-[0.08em] text-slate-100 transition duration-200 hover:-translate-y-px hover:border-cyan-300/45 hover:bg-[var(--surface-2)] disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60 [&_svg]:h-3.5 [&_svg]:w-3.5'

const primaryButtonClassName =
  'border-violet-400/40 bg-[linear-gradient(135deg,var(--violet),#5145e8)] text-white shadow-[0_4px_12px_rgba(113,92,255,0.3)] hover:border-violet-400/60 hover:bg-[linear-gradient(135deg,#8172ff,var(--violet))] hover:shadow-[0_4px_16px_rgba(113,92,255,0.45),0_0_10px_rgba(113,92,255,0.2)]'

const subtleButtonClassName =
  'border-[var(--border-soft)] bg-black/20 text-[var(--text)] hover:text-white'

const oauthButtonToneClassNames: Record<OAuthButtonProps['tone'], string> = {
  discord:
    'border-[#5865f2]/35 bg-[#5865f2]/10 text-[#dfe3ff] hover:border-[#5865f2]/70 hover:bg-[#5865f2]/16 hover:shadow-[0_12px_24px_rgba(88,101,242,0.18)]',
  google:
    'border-white/[0.12] bg-white/[0.055] text-white hover:border-white/25 hover:bg-white/[0.085] hover:shadow-[0_12px_24px_rgba(255,255,255,0.08)]',
}

const oauthMarkToneClassNames: Record<OAuthButtonProps['tone'], string> = {
  discord:
    'border-[#5865f2]/45 bg-[#5865f2] text-white shadow-[0_0_16px_rgba(88,101,242,0.28)]',
  google:
    'border-white/20 bg-white text-[#4285f4] shadow-[0_0_16px_rgba(255,255,255,0.12)]',
}

function OAuthButton({
  disabled,
  Icon,
  isLoading,
  label,
  onClick,
  tone,
}: OAuthButtonProps) {
  return (
    <button
      className={cn(
        'group relative inline-flex min-h-14 w-full items-center justify-between overflow-hidden rounded-lg border p-2.5 pr-3 text-left transition duration-200 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300/70 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60',
        oauthButtonToneClassNames[tone],
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.1),transparent)] opacity-0 transition duration-200 group-hover:opacity-100" />
      <span className="relative z-[1] flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'inline-flex h-9 w-9 flex-none items-center justify-center rounded-md border',
            oauthMarkToneClassNames[tone],
          )}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={17} />
          ) : (
            <Icon
              aria-hidden="true"
              className="h-4.5 w-4.5"
              color="currentColor"
            />
          )}
        </span>
        <span className="grid min-w-0 gap-0.5">
          <span className="truncate font-mono text-[0.56rem] font-black uppercase tracking-[0.12em] text-[var(--muted)]">
            Continuar com
          </span>
          <span className="truncate font-mono text-[0.72rem] font-black uppercase tracking-[0.08em] text-white">
            {label}
          </span>
        </span>
      </span>
      <span className="relative z-[1] ml-2 inline-flex h-7 w-7 flex-none items-center justify-center rounded-md border border-white/[0.08] bg-black/20 text-white/70 transition duration-200 group-hover:translate-x-0.5 group-hover:border-white/20 group-hover:text-white">
        <ArrowRight aria-hidden="true" size={14} />
      </span>
    </button>
  )
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { login, loginWithOAuth, register, requestPasswordReset } =
    useAuthViewModel()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [rememberSession, setRememberSession] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const isRegistering = mode === 'register'
  const isPending = pendingAction !== null
  const formId = 'auth-modal-form'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setPendingAction('email')

    try {
      if (isRegistering) {
        await register(name, email, password)
      } else {
        await login(email, password)
      }

      onClose()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Nao foi possivel entrar agora.',
      )
    } finally {
      setPendingAction(null)
    }
  }

  async function handleOAuth(provider: AuthProvider) {
    setError(null)
    setNotice(null)
    setPendingAction(provider)

    try {
      await loginWithOAuth(provider)
      onClose()
    } catch (oauthError) {
      setError(
        oauthError instanceof Error
          ? oauthError.message
          : 'Nao foi possivel entrar agora.',
      )
    } finally {
      setPendingAction(null)
    }
  }

  async function handlePasswordReset() {
    setError(null)
    setNotice(null)

    if (!email.trim()) {
      setError('Informe seu email para recuperar a senha.')
      return
    }

    setPendingAction('reset')

    try {
      await requestPasswordReset(email)
      setNotice('Enviamos as instrucoes para o email informado.')
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : 'Nao foi possivel recuperar a senha agora.',
      )
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <AppModal
      ariaLabel="Entrar na conta"
      bodyClassName="grid gap-5"
      closeLabel="Fechar login"
      eyebrow="Conta SLP Forge"
      footer={
        <div className="mx-auto grid w-full max-w-[460px] gap-4">
          <button
            className={cn(baseButtonClassName, primaryButtonClassName, 'h-12 w-full')}
            disabled={isPending}
            form={formId}
            type="submit"
          >
            {pendingAction === 'email' && <Loader2 className="animate-spin" size={16} />}
            {pendingAction !== 'email' && <Mail aria-hidden="true" />}
            {isRegistering ? 'Criar conta' : 'Entrar com email'}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="font-mono text-[0.58rem] font-black uppercase tracking-[0.12em] text-[var(--muted)]">
              Ou entrar com
            </span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>

          <div className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
            <OAuthButton
              disabled={isPending}
              Icon={SiGoogle}
              isLoading={pendingAction === 'google'}
              label="Google"
              onClick={() => void handleOAuth('google')}
              tone="google"
            />
            <OAuthButton
              disabled={isPending}
              Icon={SiDiscord}
              isLoading={pendingAction === 'discord'}
              label="Discord"
              onClick={() => void handleOAuth('discord')}
              tone="discord"
            />
          </div>
        </div>
      }
      icon={ShieldCheck}
      isCloseDisabled={isPending}
      onClose={onClose}
      title={isRegistering ? 'Criar acesso' : 'Entrar'}
    >
          <div className="relative mx-auto mb-5 grid w-full max-w-[390px] grid-cols-2 gap-2 overflow-hidden rounded-full border border-[var(--border-soft)] bg-[var(--field)] p-1.5">
            <span
              className={cn(
                'pointer-events-none absolute bottom-1.5 left-1.5 top-1.5 w-[calc(50%-0.375rem)] rounded-full border border-violet-400/40 bg-[linear-gradient(135deg,var(--violet),#5145e8)] shadow-[0_4px_12px_rgba(113,92,255,0.3)] transition-transform duration-300 ease-out',
                isRegistering ? 'translate-x-[calc(100%+0.5rem)]' : 'translate-x-0',
              )}
              aria-hidden="true"
            />
            <button
              className={cn(
                baseButtonClassName,
                'relative z-[1] bg-transparent',
                mode === 'login'
                  ? 'border-transparent text-white shadow-none hover:border-transparent hover:bg-transparent hover:shadow-none'
                  : subtleButtonClassName,
              )}
              disabled={isPending}
              onClick={() => setMode('login')}
              type="button"
            >
              <KeyRound aria-hidden="true" />
              Entrar
            </button>
            <button
              className={cn(
                baseButtonClassName,
                'relative z-[1] bg-transparent',
                mode === 'register'
                  ? 'border-transparent text-white shadow-none hover:border-transparent hover:bg-transparent hover:shadow-none'
                  : subtleButtonClassName,
              )}
              disabled={isPending}
              onClick={() => setMode('register')}
              type="button"
            >
              <UserPlus aria-hidden="true" />
              Cadastro
            </button>
          </div>

          <form className="mx-auto grid w-full max-w-[460px] gap-3.5" id={formId} onSubmit={handleSubmit}>
            <div
              className="grid gap-3.5 animate-[row-in_180ms_ease-out_both]"
              key={mode}
            >
              {isRegistering && (
                <Label>
                  Nome
                  <Input
                    autoComplete="name"
                    className="rounded-full border-white/[0.08] bg-white/[0.055] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] focus:shadow-[inset_3px_0_0_var(--violet),0_0_12px_rgba(113,92,255,0.18)]"
                    disabled={isPending}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Seu nome shinobi"
                    value={name}
                  />
                </Label>
              )}

              <Label>
                Email
                <Input
                  autoComplete="email"
                  className="rounded-full border-white/[0.08] bg-white/[0.055] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] focus:shadow-[inset_3px_0_0_var(--violet),0_0_12px_rgba(113,92,255,0.18)]"
                  disabled={isPending}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@email.com"
                  required
                  type="email"
                  value={email}
                />
              </Label>

              <Label>
                Senha
                <Input
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  className="rounded-full border-white/[0.08] bg-white/[0.055] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] focus:shadow-[inset_3px_0_0_var(--violet),0_0_12px_rgba(113,92,255,0.18)]"
                  disabled={isPending}
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimo 8 caracteres"
                  required
                  type="password"
                  value={password}
                />
              </Label>
            </div>

            <div className="flex items-center justify-between gap-3 font-mono text-[0.64rem] font-black uppercase tracking-[0.06em] text-[var(--muted)]">
              <label className="inline-flex min-w-0 items-center gap-2">
                <Checkbox
                  checked={rememberSession}
                  disabled={isPending}
                  onCheckedChange={(checked: boolean | 'indeterminate') => setRememberSession(checked === true)}
                />
                <span>Lembrar</span>
              </label>

              {!isRegistering && (
                <button
                  className="bg-transparent p-0 text-[var(--text)] transition hover:text-cyan-200"
                  disabled={isPending}
                  onClick={() => void handlePasswordReset()}
                  type="button"
                >
                  {pendingAction === 'reset' ? 'Enviando...' : 'Esqueci a senha'}
                </button>
              )}
            </div>

            {notice && (
              <div
                className="border border-cyan-300/25 bg-cyan-400/10 px-3 py-2.5 font-mono text-[0.64rem] font-black uppercase tracking-[0.06em] text-cyan-100"
                role="status"
              >
                {notice}
              </div>
            )}

            {error && (
              <div
                className="border border-red-400/30 bg-red-500/10 px-3 py-2.5 font-mono text-[0.64rem] font-black uppercase tracking-[0.06em] text-red-100"
                role="alert"
              >
                {error}
              </div>
            )}

          </form>
    </AppModal>
  )
}

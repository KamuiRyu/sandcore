import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { InputField } from '../../../../ui/components/atoms/InputField'

const loginSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório.').email('Formato de e-mail inválido.'),
  password: z.string().min(1, 'Senha é obrigatória.'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  viewModel: {
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
    requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>
    authLoading: boolean
  }
  rememberMe: boolean
  setRememberMe: (val: boolean) => void
}

export const LoginForm = ({ viewModel, rememberMe, setRememberMe }: LoginFormProps) => {
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    const res = await viewModel.login(data.email, data.password)
    if (!res.success) {
      const errLower = res.error?.toLowerCase() || ''
      if (errLower.includes('email') || errLower.includes('senha') || errLower.includes('incorretos') || errLower.includes('invalid')) {
        setError('email', { type: 'server', message: 'E-mail ou senha incorretos.' })
        setError('password', { type: 'server', message: 'E-mail ou senha incorretos.' })
      } else {
        setError('email', { type: 'server', message: res.error || 'Falha ao entrar.' })
      }
    }
  }

  const handleForgotPassword = async () => {
    const email = getValues('email')?.trim()
    if (!email) {
      setError('email', { type: 'manual', message: 'Digite seu e-mail para recuperar.' })
      return
    }
    if (!email.includes('@')) {
      setError('email', { type: 'manual', message: 'Formato de e-mail inválido.' })
      return
    }
    const res = await viewModel.requestPasswordReset(email)
    if (!res.success) {
      setError('email', { type: 'server', message: res.error || 'Erro ao recuperar.' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3.5 w-full">
      <InputField
        icon={Mail}
        type="email"
        placeholder="E-mail"
        disabled={viewModel.authLoading}
        error={errors.email?.message}
        {...register('email')}
      />

      <InputField
        icon={Lock}
        type="password"
        placeholder="Senha"
        disabled={viewModel.authLoading}
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="flex items-center justify-between font-mono text-[0.55rem] font-black uppercase tracking-wider pt-0.5">
        <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300 transition-colors">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded-[2px] border-[#4a2f0a] bg-[#1a1105] text-[#c8860a] focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer accent-[#c8860a]"
          />
          <span>Lembrar de mim</span>
        </label>
        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-[#c8860a] font-mono font-black uppercase hover:text-[#f0d9a0] hover:underline transition-all cursor-pointer bg-transparent border-0 p-0"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          Esqueci minha senha
        </button>
      </div>

      <button
        type="submit"
        disabled={viewModel.authLoading}
        className="w-full bg-gradient-to-r from-[#b87a08] to-[#e8a820] text-[#0a0800] font-mono text-[0.65rem] font-black uppercase tracking-[0.1em] rounded-[2px] py-3 flex items-center justify-center relative transition-all hover:brightness-110 active:scale-[0.99] cursor-pointer disabled:opacity-50"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        {viewModel.authLoading ? (
          <Loader2 className="animate-spin w-4 h-4" />
        ) : (
          <>
            <span>ENTRAR</span>
            <span className="absolute right-4 flex items-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </>
        )}
      </button>
    </form>
  )
}

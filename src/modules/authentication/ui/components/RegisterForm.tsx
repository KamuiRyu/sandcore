import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, Loader2 } from 'lucide-react'
import { InputField } from '../../../../ui/components/atoms/InputField'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres.'),
  email: z.string().min(1, 'E-mail é obrigatório.').email('Formato de e-mail inválido.'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres.'),
})

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
  viewModel: {
    register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
    authLoading: boolean
  }
}

export const RegisterForm = ({ viewModel }: RegisterFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    const res = await viewModel.register(data.name, data.email, data.password)
    if (!res.success) {
      const errLower = res.error?.toLowerCase() || ''
      if (errLower.includes('email') || errLower.includes('already exists') || errLower.includes('use')) {
        setError('email', { type: 'server', message: 'E-mail já está em uso.' })
      } else {
        setError('email', { type: 'server', message: res.error || 'Falha ao criar conta.' })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3.5 w-full">
      <InputField
        icon={User}
        type="text"
        placeholder="Nome"
        disabled={viewModel.authLoading}
        error={errors.name?.message}
        {...register('name')}
      />

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

      <button
        type="submit"
        disabled={viewModel.authLoading}
        className="w-full bg-gradient-to-r from-[#c8860a] to-[#e0a020] text-black shadow-[0_0_15px_rgba(200,134,10,0.4)] hover:scale-105 active:scale-95 text-white font-mono text-[0.65rem] font-black uppercase tracking-[0.1em] rounded-[2px] py-3 flex items-center justify-center relative transition-all active:scale-[0.99] cursor-pointer"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        {viewModel.authLoading ? (
          <Loader2 className="animate-spin w-4 h-4" />
        ) : (
          <>
            <span>CRIAR CONTA</span>
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

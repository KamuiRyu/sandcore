import { useState, useEffect } from 'react'
import { useAuthViewModel } from '../viewModels/useAuth.viewModel'
import { LoginForm } from '../components/LoginForm'
import { RegisterForm } from '../components/RegisterForm'
import { SunagakureLogo } from '../../../app/ui/components/SunagakureLogo'
import { Clock, XCircle } from 'lucide-react'

export const LoginScreen = () => {
  const viewModel = useAuthViewModel()
  const [rememberMe, setRememberMe] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      window.ipcRenderer?.send('window-control', 'close')
    }, 200) // matches duration-200
  }

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (viewModel.resetSuccess) {
      const timer = setTimeout(() => {
        viewModel.setResetSuccess('')
      }, 6000)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewModel.resetSuccess])

  const handleOAuth = (provider: 'google' | 'discord') => {
    viewModel.loginWithOAuth(provider)
  }

  if (viewModel.authScreen === 'awaiting_approval') {
    return (
      <div className={`h-screen w-screen bg-[#0f0b04] flex flex-col items-center justify-center relative rounded-xl border border-[#4a2f0a] overflow-hidden text-slate-300 transition-all duration-300 ease-out font-sans select-none ${isMounted && !isClosing ? 'opacity-100 scale-100 blur-none' : 'opacity-0 scale-95 blur-sm'}`}>
        <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-end select-none z-50" style={{ WebkitAppRegion: 'drag' } as any}>
          <button onClick={handleClose} className="h-full w-11 hover:bg-red-600 hover:text-white transition flex items-center justify-center text-slate-400 cursor-pointer" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M1 1L9 9M9 1L1 9" /></svg>
          </button>
        </div>
        <div className="flex flex-col items-center gap-5 px-10 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full border border-[#c8860a]/40 flex items-center justify-center" style={{ background: 'rgba(200,134,10,0.08)' }}>
            <Clock size={28} style={{ color: '#c8860a' }} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: '#e8d5a0', fontFamily: "'Cinzel', serif" }}>Aguardando Aprovação</h2>
            <p className="text-[11px] leading-relaxed" style={{ color: '#9a7a40' }}>Sua conta foi criada com sucesso. Um administrador precisa aprovar seu acesso à vila. Você será notificado em breve.</p>
          </div>
          <button onClick={viewModel.logout} className="text-[10px] font-mono uppercase tracking-widest cursor-pointer transition-colors" style={{ color: '#6a5028' }} onMouseEnter={e => (e.currentTarget.style.color = '#c8860a')} onMouseLeave={e => (e.currentTarget.style.color = '#6a5028')}>
            Usar outra conta
          </button>
        </div>
      </div>
    )
  }

  if (viewModel.authScreen === 'rejected') {
    return (
      <div className={`h-screen w-screen bg-[#0f0b04] flex flex-col items-center justify-center relative rounded-xl border border-[#4a2f0a] overflow-hidden text-slate-300 transition-all duration-300 ease-out font-sans select-none ${isMounted && !isClosing ? 'opacity-100 scale-100 blur-none' : 'opacity-0 scale-95 blur-sm'}`}>
        <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-end select-none z-50" style={{ WebkitAppRegion: 'drag' } as any}>
          <button onClick={handleClose} className="h-full w-11 hover:bg-red-600 hover:text-white transition flex items-center justify-center text-slate-400 cursor-pointer" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M1 1L9 9M9 1L1 9" /></svg>
          </button>
        </div>
        <div className="flex flex-col items-center gap-5 px-10 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full border border-red-800/40 flex items-center justify-center" style={{ background: 'rgba(120,20,20,0.1)' }}>
            <XCircle size={28} style={{ color: '#e07070' }} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: '#e07070', fontFamily: "'Cinzel', serif" }}>Acesso Recusado</h2>
            <p className="text-[11px] leading-relaxed" style={{ color: '#9a7a40' }}>Seu acesso à vila foi recusado por um administrador. Entre em contato com a gestão para mais informações.</p>
          </div>
          <button onClick={viewModel.logout} className="text-[10px] font-mono uppercase tracking-widest cursor-pointer transition-colors" style={{ color: '#6a5028' }} onMouseEnter={e => (e.currentTarget.style.color = '#c8860a')} onMouseLeave={e => (e.currentTarget.style.color = '#6a5028')}>
            Usar outra conta
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen w-screen bg-[#0f0b04] flex relative rounded-xl border border-[#4a2f0a] overflow-hidden text-slate-300 transition-all duration-300 ease-out font-sans select-none ${isMounted && !isClosing ? 'opacity-100 scale-100 blur-none' : 'opacity-0 scale-95 blur-sm'}`}>
      
      {/* Absolute Titlebar Overlay */}
      <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-end select-none z-50" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex items-center h-full">
          <button 
            onClick={() => window.ipcRenderer?.send('window-control', 'minimize')} 
            className="h-full w-11 hover:bg-white/5 transition flex items-center justify-center cursor-pointer text-slate-400 hover:text-white"
            style={{ WebkitAppRegion: 'no-drag' } as any}
            title="Minimizar"
          >
            <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
              <line x1="1" y1="5" x2="9" y2="5" />
            </svg>
          </button>
          <button 
            onClick={handleClose} 
            className="h-full w-11 hover:bg-red-600 hover:text-white transition flex items-center justify-center text-slate-400 cursor-pointer"
            style={{ WebkitAppRegion: 'no-drag' } as any}
            title="Fechar"
          >
            <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M1 1L9 9M9 1L1 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Left Form Column */}
      <div className="w-[360px] flex-none bg-[#0f0b04] flex flex-col px-8 pt-7 pb-4 justify-between border-r border-[#2e1f08] h-full relative">
        
        {/* Main Content Area (Logo + Form) centered together */}
        <div className="flex-1 flex flex-col justify-center gap-7 my-auto w-full">
          {/* Logo and Subtitle Section matching Mockup */}
          <div className="flex flex-col items-center">
            <SunagakureLogo width={76} height={76} className="drop-shadow-[0_4px_16px_rgba(200,134,10,0.15)]" />

            <p className="text-[#9a7a40] text-[0.6rem] tracking-[0.2em] font-mono font-black uppercase mt-1">Explore. Descubra. Domine.</p>

            {/* Custom Horizontal Line with Mini Shuriken SVG */}
            <div className="flex items-center justify-center gap-3 w-full mt-3">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#c8860a]/30"></div>
              <div className="animate-[spin_20s_linear_infinite] flex-none">
                <SunagakureLogo width={16} height={16} />
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#c8860a]/30"></div>
            </div>
          </div>

          {/* Form */}
          <div className="w-full flex flex-col">
            {viewModel.isRegisterMode ? (
              <RegisterForm viewModel={viewModel} />
            ) : (
              <LoginForm viewModel={viewModel} rememberMe={rememberMe} setRememberMe={setRememberMe} />
            )}

            {/* Divider */}
            <div className="flex items-center gap-2.5 my-3.5">
              <div className="h-[1px] flex-1" style={{ background: 'linear-gradient(90deg, transparent, #2e1e06)' }}></div>
              <span className="text-[#6a5028] text-[0.55rem] font-black font-mono uppercase tracking-[0.15em]">ou continue com</span>
              <div className="h-[1px] flex-1" style={{ background: 'linear-gradient(90deg, #2e1e06, transparent)' }}></div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={() => handleOAuth('google')}
                disabled={viewModel.authLoading}
                className="bg-[#1a1105] hover:bg-[#2a1b08] border border-[#4a2f0a] rounded-[2px] py-2.5 px-4 flex items-center justify-center gap-2 text-[0.65rem] font-black font-mono uppercase tracking-widest text-[#c8860a] hover:text-[#f0d9a0] transition-all cursor-pointer"
                style={{ WebkitAppRegion: 'no-drag' } as any}
              >
                <svg className="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Google</span>
              </button>
              <button 
                type="button" 
                onClick={() => handleOAuth('discord')}
                disabled={viewModel.authLoading}
                className="bg-[#1a1105] hover:bg-[#2a1b08] border border-[#4a2f0a] rounded-[2px] py-2.5 px-4 flex items-center justify-center gap-2 text-[0.65rem] font-black font-mono uppercase tracking-widest text-[#c8860a] hover:text-[#f0d9a0] transition-all cursor-pointer"
                style={{ WebkitAppRegion: 'no-drag' } as any}
              >
                <svg className="w-4 h-4 text-[#5865F2] flex-none" viewBox="0 0 127.14 96.36" fill="currentColor">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.45-5c.89-.65,1.75-1.34,2.58-2a75.79,75.79,0,0,0,72.74,0c.83.71,1.69,1.4,2.58,2a68.43,68.43,0,0,1-10.45,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129,54.65,123.5,31.58,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/>
                </svg>
                <span>Discord</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-[0.6rem] font-mono font-black uppercase tracking-widest text-center text-[#9a7a40] mt-3">
          {viewModel.isRegisterMode ? (
            <p>
              Já tem uma conta?{' '}
              <span 
                onClick={() => viewModel.setIsRegisterMode(false)}
                className="text-[#c8860a] font-semibold hover:underline cursor-pointer transition-colors"
                style={{ WebkitAppRegion: 'no-drag' } as any}
              >
                Entrar
              </span>
            </p>
          ) : (
            <p>
              Não tem uma conta?{' '}
              <span 
                onClick={() => viewModel.setIsRegisterMode(true)}
                className="text-[#c8860a] font-semibold hover:underline cursor-pointer transition-colors"
                style={{ WebkitAppRegion: 'no-drag' } as any}
              >
                Criar conta
              </span>
            </p>
          )}
        </div>

        {/* Absolute Floating Error Alert */}
        {viewModel.generalError && (
          <div className="absolute bottom-16 left-8 right-8 bg-[#1C0F13] border border-[#3D1A22] text-red-400 text-xs py-2.5 px-3.5 rounded-[2px] text-center shadow-2xl z-50 flex items-center justify-between gap-2">
            <span className="flex-1 text-center font-medium leading-relaxed">{viewModel.generalError}</span>
            <button 
              type="button" 
              onClick={() => viewModel.setGeneralError('')} 
              className="text-red-400 hover:text-red-300 font-bold text-xs cursor-pointer flex-none px-1"
              style={{ WebkitAppRegion: 'no-drag' } as any}
            >
              ✕
            </button>
          </div>
        )}

        {/* Absolute Floating Success Alert */}
        {viewModel.resetSuccess && (
          <div className="absolute bottom-16 left-8 right-8 bg-[#0f0b04] border border-[#4a2f0a] text-[#c8860a] text-xs py-2.5 px-3.5 rounded-[2px] text-center shadow-2xl z-50 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-2">
            <span className="flex-1 text-center font-medium leading-relaxed">{viewModel.resetSuccess}</span>
            <button 
              type="button" 
              onClick={() => viewModel.setResetSuccess('')} 
              className="text-[#c8860a] hover:text-teal-300 font-bold text-xs cursor-pointer flex-none px-1"
              style={{ WebkitAppRegion: 'no-drag' } as any}
            >
              ✕
            </button>
          </div>
        )}

      </div>

      {/* Right Image/Banner Column */}
      <div className="flex-1 bg-cover bg-[85%_center] select-none relative max-[500px]:hidden h-full" style={{ backgroundImage: "url('./images/background.webp')" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0b04] via-transparent to-transparent w-24"></div>
      </div>

    </div>
  )
}

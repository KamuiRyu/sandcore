import { useState, useEffect } from 'react'
import { pbAuthRepository } from '../../infrastructure/adapters/PocketBaseAuth.adapter'
import { LoginUseCase } from '../../core/usecases/Login.usecase'
import { RegisterUseCase } from '../../core/usecases/Register.usecase'
import { RequestPasswordResetUseCase } from '../../core/usecases/RequestPasswordReset.usecase'
import { OAuthLoginUseCase } from '../../core/usecases/OAuthLogin.usecase'

export const useAuthViewModel = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(pbAuthRepository.isLoggedIn())
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')

  useEffect(() => {
    const handlePopupClosed = () => {
      setTimeout(() => {
        setAuthLoading((prev) => {
          if (prev) {
            return false
          }
          return prev
        })
      }, 500)
    }

    window.ipcRenderer?.on('oauth-popup-closed', handlePopupClosed)
    return () => {
      window.ipcRenderer?.off('oauth-popup-closed', handlePopupClosed)
    }
  }, [])

  const loginUseCase = new LoginUseCase(pbAuthRepository)
  const registerUseCase = new RegisterUseCase(pbAuthRepository)
  const resetUseCase = new RequestPasswordResetUseCase(pbAuthRepository)
  const oauthUseCase = new OAuthLoginUseCase(pbAuthRepository)

  const login = async (email: string, password: string) => {
    setAuthLoading(true)
    setGeneralError('')
    const result = await loginUseCase.execute(email, password)
    setAuthLoading(false)
    if (result.success) {
      setIsLoggedIn(true)
      window.ipcRenderer?.send('window-control', 'login-success')
      return { success: true }
    } else {
      return { success: false, error: (result as any).error.message }
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setAuthLoading(true)
    setGeneralError('')
    const result = await registerUseCase.execute(name, email, password)
    setAuthLoading(false)
    if (result.success) {
      setIsLoggedIn(true)
      window.ipcRenderer?.send('window-control', 'login-success')
      return { success: true }
    } else {
      return { success: false, error: (result as any).error.message }
    }
  }

  const requestPasswordReset = async (email: string) => {
    if (!email) {
      return { success: false, error: 'Digite seu e-mail para recuperar.' }
    }
    setAuthLoading(true)
    setGeneralError('')
    setResetSuccess('')
    const result = await resetUseCase.execute(email)
    setAuthLoading(false)
    if (result.success) {
      setResetSuccess('E-mail de recuperação enviado para: ' + email)
      return { success: true }
    } else {
      return { success: false, error: (result as any).error.message }
    }
  }

  const loginWithOAuth = async (provider: 'google' | 'discord') => {
    setAuthLoading(true)
    setGeneralError('')
    const result = await oauthUseCase.execute(provider)
    setAuthLoading(false)
    if (result.success) {
      setIsLoggedIn(true)
      window.ipcRenderer?.send('window-control', 'login-success')
      return { success: true }
    } else {
      setGeneralError((result as any).error.message)
      return { success: false, error: (result as any).error.message }
    }
  }

  const logout = async () => {
    await pbAuthRepository.logout()
    setIsLoggedIn(false)
    window.ipcRenderer?.send('window-control', 'logout')
  }

  const getCurrentUser = () => {
    return pbAuthRepository.getCurrentUser()
  }

  return {
    isLoggedIn,
    isRegisterMode,
    setIsRegisterMode,
    authLoading,
    generalError,
    setGeneralError,
    resetSuccess,
    setResetSuccess,
    login,
    register,
    requestPasswordReset,
    loginWithOAuth,
    logout,
    getCurrentUser,
  }
}

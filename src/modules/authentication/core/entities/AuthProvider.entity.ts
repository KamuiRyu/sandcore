export type AuthProvider = 'discord' | 'google'

export type LinkedAuthProvider = {
  id: string
  provider: AuthProvider
}

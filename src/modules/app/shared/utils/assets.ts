export function getPublicAssetUrl(path: string): string {
  if (/^(https?:|data:|blob:)/.test(path)) {
    return path
  }

  const baseUrl = import.meta.env.BASE_URL
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path

  return `${normalizedBaseUrl}${normalizedPath}`
}

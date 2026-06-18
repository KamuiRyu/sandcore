import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const logger = {
  log: (...args: unknown[]) => import.meta.env.DEV && console.log(...args),
  warn: (...args: unknown[]) => import.meta.env.DEV && console.warn(...args),
  error: (...args: unknown[]) => import.meta.env.DEV && console.error(...args),
  info: (...args: unknown[]) => import.meta.env.DEV && console.info(...args),
  debug: (...args: unknown[]) => import.meta.env.DEV && console.debug(...args),
}

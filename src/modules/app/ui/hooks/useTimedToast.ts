import { useCallback, useEffect, useRef, useState } from 'react'

export type ToastType = 'success' | 'info' | 'error' | 'delete'

export type TimedToast = {
  description: string
  title: string
  type?: ToastType
}

export function useTimedToast(timeoutMs = 2600) {
  const [toast, setToast] = useState<TimedToast | null>(null)
  const toastTimeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => {
      window.clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  const showToast = useCallback((
    title: string,
    description: string,
    type: ToastType = 'success',
  ) => {
    window.clearTimeout(toastTimeoutRef.current)
    setToast({ description, title, type })
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), timeoutMs)
  }, [timeoutMs])

  return {
    showToast,
    toast,
  }
}

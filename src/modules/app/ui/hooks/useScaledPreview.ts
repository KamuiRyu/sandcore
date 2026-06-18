import { useEffect, useState, type RefObject } from 'react'

type UseScaledPreviewParams = {
  active: boolean
  baseWidth: number
  stageRef: RefObject<HTMLDivElement | null>
}

export function useScaledPreview({
  active,
  baseWidth,
  stageRef,
}: UseScaledPreviewParams) {
  const [previewScale, setPreviewScale] = useState(1)

  useEffect(() => {
    if (!active) return

    const updateScale = () => {
      if (!stageRef.current) return

      const stageWidth = stageRef.current.clientWidth
      const computedStyle = window.getComputedStyle(stageRef.current)
      const paddingLeft = parseFloat(computedStyle.paddingLeft || '0')
      const paddingRight = parseFloat(computedStyle.paddingRight || '0')
      const contentWidth = stageWidth - paddingLeft - paddingRight

      setPreviewScale(Math.min(1, contentWidth / baseWidth))
    }

    const rafId = requestAnimationFrame(updateScale)
    const observer = new ResizeObserver(updateScale)

    if (stageRef.current) {
      observer.observe(stageRef.current)
    }

    window.addEventListener('resize', updateScale)

    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
      window.removeEventListener('resize', updateScale)
    }
  }, [active, baseWidth, stageRef])

  return previewScale
}

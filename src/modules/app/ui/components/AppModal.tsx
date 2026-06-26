import { X, type LucideIcon } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'
import { cn } from '../../../../lib/utils'
import { ViewportPortal } from './ViewportPortal'

type AppModalProps = {
  ariaLabel: string
  children: ReactNode
  bodyClassName?: string
  bodyRef?: RefObject<HTMLDivElement | null>
  className?: string
  closeLabel?: string
  eyebrow: string
  footer?: ReactNode
  icon: LucideIcon
  isCloseDisabled?: boolean
  onClose: () => void
  overlayClassName?: string
  placement?: 'center' | 'top'
  title: string
  widthClassName?: string
  zIndexClassName?: string
}

const overlayPlacementClassNames = {
  center: 'grid place-items-center px-[18px] py-8 max-[640px]:grid max-[640px]:place-items-center max-[640px]:p-4',
  top: 'grid place-items-start justify-items-center px-[18px] pb-8 pt-24 max-[640px]:block max-[640px]:p-0',
}

export function AppModal({
  ariaLabel,
  bodyClassName,
  bodyRef,
  children,
  className,
  closeLabel = 'Fechar modal',
  eyebrow,
  footer,
  icon: Icon,
  isCloseDisabled = false,
  onClose,
  overlayClassName,
  placement = 'center',
  title,
  widthClassName = 'w-[min(640px,100%)]',
  zIndexClassName = 'z-[95]',
}: AppModalProps) {
  return (
    <ViewportPortal>
      <div
        className={cn(
          'fixed inset-0 overflow-auto bg-black/65 backdrop-blur-sm animate-[fade-in_160ms_ease-out_both]',
          zIndexClassName,
          overlayPlacementClassNames[placement],
          overlayClassName,
        )}
        onClick={(event) => {
          if (event.target === event.currentTarget && !isCloseDisabled) {
            onClose()
          }
        }}
        role="presentation"
      >
        <section
          aria-label={ariaLabel}
          className={cn(
            'relative flex max-h-[calc(100vh_-_128px)] flex-col overflow-hidden rounded-[2px] border border-[#282828] bg-[#080808] text-[var(--text)] shadow-[0_32px_96px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-2xl animate-[modal-in_180ms_ease-out_both] max-[640px]:w-full',
            widthClassName,
            className,
          )}
          role="dialog"
        >
          {/* Futuristic Background Grids/Scanlines */}
          <div className="pointer-events-none absolute inset-0 grid-pattern opacity-20" />
          <div className="pointer-events-none absolute inset-0 tech-scanlines opacity-10" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,134,10,0.08),transparent_40%)]" />
          <div className="absolute inset-0 tech-corner-accent opacity-20 pointer-events-none" />

          {/* Header */}
          <div className="sticky top-0 z-[2] flex items-center justify-between gap-4 border-b border-white/10 bg-[#0a0602] px-7 py-5 backdrop-blur-md max-[640px]:px-5 max-[640px]:py-4 relative shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
            {/* Subtle glow on top of header */}
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#c8860a]/20 to-transparent" />
            
            <div className="flex min-w-0 items-center gap-4 relative z-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-[2px] border border-[#c8860a]/40 bg-gradient-to-br from-[#c8860a]/20 to-slate-900/60 text-[#ffdd66] shadow-[0_0_20px_rgba(200,134,10,0.15)] ring-1 ring-[#c8860a]/10">
                <Icon aria-hidden="true" size={22} />
              </div>
              <div className="grid min-w-0 gap-0.5">
                <span className="font-mono text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#c8860a]">
                  {eyebrow}
                </span>
                <h2 className="m-0 font-mono text-[1.1rem] font-extrabold uppercase leading-tight text-white tracking-tight">
                  {title}
                </h2>
              </div>
            </div>
            <button
              aria-label={closeLabel}
              className="inline-flex h-[36px] w-[36px] flex-none items-center justify-center rounded-[2px] border border-[#282828] bg-white/5 p-0 text-slate-300 transition hover:-translate-y-px hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] disabled:cursor-wait disabled:opacity-60 [&_svg]:h-[18px] [&_svg]:w-[18px] cursor-pointer"
              disabled={isCloseDisabled}
              onClick={onClose}
              type="button"
            >
              <X aria-hidden="true" />
            </button>
          </div>

          {/* Body */}
          <div
            className={cn(
              'min-h-0 flex-1 overflow-y-auto px-7 py-6 custom-scrollbar max-[640px]:px-5 max-[640px]:py-5 relative z-10 bg-white/[0.01]',
              bodyClassName,
            )}
            ref={bodyRef}
          >
            {children}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 z-[2] border-t border-[#282828] bg-[rgba(8,8,8,0.95)] backdrop-blur-xl px-7 py-5 max-[640px]:px-5 relative">
            {footer ?? <div className="h-0" aria-hidden="true" />}
          </div>
        </section>
      </div>
    </ViewportPortal>
  )
}

import { memo, type ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";
import { motion, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import { cn } from "../../../../lib/utils";

interface HudPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  width?: string;
  height?: string;
  hideHeader?: boolean;
  showGrid?: boolean;
}

export const HudPanel = memo(function HudPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  className,
  contentClassName,
  width = "w-[440px]",
  height = "h-[600px]",
  hideHeader = false,
  showGrid = true,
}: HudPanelProps) {
  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={cn(
              "pointer-events-auto absolute bottom-16 left-4 z-40 flex flex-col",
              width,
              height,
              className
            )}
          >
            {/* Container — Technical Glassmorphism */}
            <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#030a0d]/96 rounded-[12px] border border-white/[0.03] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              {/* Subtle technical grid background */}
              {showGrid && (
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,214,163,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,214,163,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none rounded-[12px]" />
              )}

              {/* Header */}
              {!hideHeader && (
                <header className="relative flex items-center justify-between px-6 py-5 border-b border-white/[0.03] bg-white/[0.01] shrink-0 z-20">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Icon Container */}
                    <div className="relative shrink-0">
                      <div className="relative grid h-10 w-10 place-items-center bg-black/50 border border-white/10 rounded-xl text-cyan-400">
                        <Icon size={18} strokeWidth={2} />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-400">
                        {title}
                      </h2>
                      {subtitle && (
                        <p className="text-[8.5px] font-mono font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.03] bg-white/[0.02] text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </header>
              )}

              {/* Content Area */}
              <div className={cn(
                "min-h-0 flex-1 overflow-y-auto custom-scrollbar relative z-10 rounded-b-[24px]",
                contentClassName
              )}>
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <footer className="px-6 py-4 border-t border-white/[0.03] bg-white/[0.01] relative shrink-0 z-10 rounded-b-[24px]">
                  {footer}
                </footer>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
});


export default HudPanel;

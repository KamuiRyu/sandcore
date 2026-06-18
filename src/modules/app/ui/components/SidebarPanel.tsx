import { memo, type ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";
import { cn } from "../../../../lib/utils";

interface SidebarPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  height?: string;
}

export const SidebarPanel = memo(function SidebarPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  className,
  contentClassName,
  height = "h-[560px]",
}: SidebarPanelProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute bottom-20 left-4 z-30 w-[420px] sm:w-[480px] max-h-[calc(100vh-220px)] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
        height,
        isOpen
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
          : "opacity-0 translate-y-4 scale-95 pointer-events-none",
        className
      )}
    >
      <aside className="flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#030a0d]/96 backdrop-blur-3xl shadow-[0_32px_80px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)] relative group/panel">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,214,163,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(0,214,163,0.012)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,214,163,0.05),transparent_40%)] pointer-events-none" />
        
        {/* Sci-Fi Corners */}
        <div className="absolute inset-0 tech-corner-accent opacity-20 pointer-events-none" />

        <div className="flex h-full flex-col relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5.5 border-b border-white/5 bg-white/[0.015]">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--cyan)] to-emerald-500 blur-md opacity-25 rounded-2xl group-hover/panel:opacity-40 transition-opacity" />
                <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-black/60 border border-white/15 text-[var(--cyan)] shadow-[0_8px_16px_rgba(0,0,0,0.4)] ring-1 ring-white/5">
                  <Icon size={20} strokeWidth={2.5} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-black uppercase tracking-[0.25em] bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-cyan-400 drop-shadow-sm">
                  {title}
                </h2>
                {subtitle && (
                  <div className="flex items-start gap-2 mt-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00d6a3] shadow-[0_0_8px_#00d6a3] animate-pulse mt-1 flex-shrink-0" />
                    <p className="text-[9px] font-mono font-bold text-slate-400/90 uppercase tracking-[0.05em] leading-relaxed line-clamp-2">
                      {subtitle}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/5 bg-white/[0.03] text-slate-400 hover:border-red-500/30 hover:bg-red-500/15 hover:text-red-400 transition-all duration-300 active:scale-90 cursor-pointer shadow-sm ml-4 group/close"
              title="Fechar Menu"
            >
              <X size={16} className="transition-transform group-hover/close:rotate-90" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className={cn(
            "min-h-0 flex-1 overflow-y-auto px-6 py-6 custom-scrollbar relative z-10",
            contentClassName
          )}>
            {children}
          </div>

          {/* Footer if provided */}
          {footer && (
            <div className="px-6 py-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
              {footer}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
});

export default SidebarPanel;

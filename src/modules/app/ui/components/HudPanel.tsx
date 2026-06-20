import { memo, type ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";
import {
  motion,
  AnimatePresence,
  LazyMotion,
  domAnimation,
} from "framer-motion";
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
  /** When true, fills its container instead of floating absolutely */
  standalone?: boolean;
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
  standalone = false,
}: HudPanelProps) {
  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              ...(standalone ? {} : { y: 12, scale: 0.98 }),
            }}
            animate={{ opacity: 1, ...(standalone ? {} : { y: 0, scale: 1 }) }}
            exit={{ opacity: 0, ...(standalone ? {} : { y: 8, scale: 0.98 }) }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={cn(
              "flex flex-col",
              standalone
                ? "pointer-events-auto w-full h-full"
                : cn(
                    "pointer-events-auto absolute bottom-16 left-4 z-40",
                    width,
                    height,
                  ),
              className,
            )}
          >
            {/* Container — Sunagakure */}
            <div
              className="relative flex h-full w-full flex-col overflow-hidden rounded-[2px] border border-[#4a2f0a]"
              style={{
                background: "linear-gradient(160deg,#161008 0%,#0f0b04 100%)",
                border: "1px solid rgba(255, 221, 102, 0.4)",
              }}
            >
              {/* Gold top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px] pointer-events-none z-10"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, #4a2f0a 15%, #c8860a 40%, #e8a820 50%, #c8860a 60%, #4a2f0a 85%, transparent 100%)",
                }}
              />

              {/* Sand grain overlay */}
              <div
                className="absolute inset-0 pointer-events-none z-0 opacity-[0.04]"
                style={{
                  backgroundImage: `url("./images/noise.svg")`,
                }}
              />

              {/* Header */}
              {!hideHeader && (
                <header
                  className="relative flex items-center justify-between px-4 py-[10px] border-b border-[#4a2f0a] shrink-0 z-20"
                  style={{
                    background:
                      "linear-gradient(90deg, #2e1f08 0%, #1a1007 100%)",
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Shrine icon */}
                    <div
                      className="text-[18px] leading-none"
                      style={{
                        color: "#c8860a",
                        filter: "drop-shadow(0 0 6px rgba(200,134,10,0.6))",
                      }}
                    >
                      <Icon size={16} />
                    </div>

                    {/* Breadcrumb */}
                    <div
                      className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em]"
                      style={{
                        fontFamily: "'Cinzel', serif",
                        color: "#9a7a40",
                      }}
                    >
                      <span style={{ color: "#c8860a" }}>Shinobi Map</span>
                      <span style={{ color: "#4a2f0a" }}>›</span>
                      <span>{title}</span>
                    </div>

                    {subtitle && (
                      <span
                        className="ml-2 text-[9px] tracking-wide"
                        style={{ color: "#9a7a40" }}
                      >
                        {subtitle}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={onClose}
                    className="flex items-center justify-center w-5 h-5 text-[11px] rounded-[1px] border border-[#4a2f0a] transition-all cursor-pointer"
                    style={{ background: "#2e1f08", color: "#9a7a40" }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      el.style.borderColor = "#c8860a";
                      el.style.color = "#c8860a";
                      el.style.background = "#4a2f0a";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      el.style.borderColor = "#4a2f0a";
                      el.style.color = "#9a7a40";
                      el.style.background = "#2e1f08";
                    }}
                  >
                    <X size={11} />
                  </button>
                </header>
              )}

              {/* Content Area */}
              <div
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto custom-scrollbar relative z-10",
                  contentClassName,
                )}
              >
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <footer
                  className="px-5 py-3 border-t border-[#4a2f0a] relative shrink-0 z-10"
                  style={{ background: "rgba(13,10,5,0.4)" }}
                >
                  {footer}
                </footer>
              )}

              {/* Scroll kanji decoration */}
              <div className="absolute bottom-0 right-0 w-20 h-20 overflow-hidden pointer-events-none opacity-[0.03] z-0">
                <svg
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-20 h-20"
                >
                  <text
                    x="10"
                    y="80"
                    fontSize="90"
                    fontFamily="serif"
                    fill="#f0d9a0"
                  >
                    砂
                  </text>
                </svg>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
});

export default HudPanel;

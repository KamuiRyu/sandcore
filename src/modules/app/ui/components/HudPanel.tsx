import { memo, type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
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

// ── Decorações ────────────────────────────────────────────────────────────
const Shuriken = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} style={{ flexShrink: 0 }}>
    <g fill="#241a10" stroke="#0f0a05" strokeWidth={2} strokeLinejoin="round">
      {[0, 90, 180, 270].map((a, i) => (
        <path key={i} d="M50 50 L28 30 L52 6 L61 27 Z" transform={`rotate(${a} 50 50)`} />
      ))}
    </g>
    <circle cx={50} cy={50} r={6} fill="#e3cd9e" stroke="#0f0a05" strokeWidth={2} />
  </svg>
);

const SunagakureSymbol = ({ size = 40, color = "#5a3618" }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} fill="none">
    <g
      transform="matrix(0.974572, 0, 0, 0.982521, 1.2714, 0.87391)"
      stroke={color}
      strokeWidth="5.83727"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <rect x="17.017309" y="2.0173106" width="65.96537" height="13.70934" />
      <path d="M 17.017313,22.58132 L 82.98269,22.58132 L 82.98269,29.43599 C 79.717571,43.14533 66.65626,43.14533 66.65626,56.85467 C 66.65626,70.56401 79.950794,70.56401 82.98269,84.27335 L 82.98269,97.98269 L 17.017313,97.98269 L 17.017313,84.27335 C 19.684969,70.56401 33.343747,70.56401 33.343747,56.85467 C 33.343747,43.14533 19.995933,43.14533 17.017313,29.43599 L 17.017313,22.58132 z" />
    </g>
  </svg>
);

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
            {/* Moldura verde externa */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                padding: 5,
                borderRadius: 10,
                background: "linear-gradient(150deg,#4a6350,#34463a 55%,#2c3b31)",
                boxShadow: "0 18px 40px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.06)",
                userSelect: "none",
              }}
            >
              {/* Pergaminho interno */}
              <div
                style={{
                  flex: 1,
                  position: "relative",
                  borderRadius: 7,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "#e3cd9e",
                  backgroundImage: [
                    "radial-gradient(circle at 18% 8%, rgba(120,80,30,.16), transparent 40%)",
                    "radial-gradient(circle at 82% 85%, rgba(110,70,25,.20), transparent 44%)",
                    "radial-gradient(circle at 65% 18%, rgba(150,110,50,.10), transparent 36%)",
                    "linear-gradient(135deg, rgba(255,245,215,.55), rgba(150,110,55,.18))",
                  ].join(", "),
                  boxShadow: "inset 0 0 60px rgba(90,55,15,.30), inset 0 0 0 2px rgba(90,55,20,.25)",
                }}
              >
                {/* Textura de grão */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    mixBlendMode: "multiply",
                    opacity: 0.1,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    backgroundSize: "180px 180px",
                    zIndex: 0,
                  }}
                />

                {/* Marca d'água Sunagakure */}
                <div
                  style={{
                    position: "absolute",
                    right: -50,
                    bottom: 60,
                    width: 300,
                    height: 300,
                    opacity: 0.06,
                    pointerEvents: "none",
                    transform: "rotate(-12deg)",
                    zIndex: 0,
                  }}
                >
                  <SunagakureSymbol size={300} color="#5a3618" />
                </div>

                {/* Header */}
                {!hideHeader && (
                  <header
                    style={{
                      position: "relative",
                      zIndex: 2,
                      flexShrink: 0,
                      display: "flex",
                      flexDirection: "column",
                      padding: "10px 14px 0",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Shuriken size={16} />
                        <div>
                          <div
                            style={{
                              fontFamily: "'Cinzel', 'Georgia', serif",
                              fontWeight: 900,
                              fontSize: 13,
                              letterSpacing: "0.12em",
                              color: "#3a2614",
                              textShadow: "0 1px 0 rgba(255,250,230,.5)",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Icon size={11} style={{ color: "#5a3618" }} />
                            <span style={{ fontSize: 10, color: "#5a3618", opacity: 0.7, letterSpacing: "0.06em" }}>
                              SANDCORE
                            </span>
                            <span style={{ color: "rgba(90,54,24,.4)" }}>·</span>
                            <span>{title.toUpperCase()}</span>
                          </div>
                          {subtitle && (
                            <p style={{
                              fontFamily: "'Trebuchet MS', sans-serif",
                              fontSize: 9,
                              color: "#7a5030",
                              marginTop: 2,
                              letterSpacing: "0.05em",
                            }}>
                              {subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Botão fechar */}
                      <button
                        onClick={onClose}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 4,
                          border: "1px solid rgba(90,55,20,.4)",
                          background: "rgba(90,55,20,.12)",
                          color: "#5a3618",
                          fontSize: 13,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all .15s",
                          flexShrink: 0,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = "rgba(90,55,20,.30)";
                          e.currentTarget.style.color = "#2a1408";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = "rgba(90,55,20,.12)";
                          e.currentTarget.style.color = "#5a3618";
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Linha divisória */}
                    <div style={{
                      height: 3,
                      borderRadius: 2,
                      background: "linear-gradient(180deg,#5a341a,#3a2010)",
                      boxShadow: "0 1px 0 rgba(255,240,210,.4)",
                      marginBottom: 0,
                    }} />
                  </header>
                )}

                {/* Área de conteúdo */}
                <div
                  className={cn("min-h-0 flex-1 overflow-y-auto custom-scrollbar", contentClassName)}
                  style={{ position: "relative", zIndex: 1, padding: "12px 14px" }}
                >
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <footer
                    style={{
                      position: "relative",
                      zIndex: 2,
                      flexShrink: 0,
                      padding: "8px 14px 10px",
                      borderTop: "2px dashed rgba(95,60,22,.55)",
                    }}
                  >
                    {footer}
                  </footer>
                )}

                {/* Rodapé de shurikens */}
                <div
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    padding: "6px 14px 8px",
                    borderTop: footer ? "none" : "2px dashed rgba(95,60,22,.55)",
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  {[12, 16, 12].map((s, i) => <Shuriken key={i} size={s} />)}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
});

export default HudPanel;

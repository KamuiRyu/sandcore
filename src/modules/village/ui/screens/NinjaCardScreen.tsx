import { useEffect, useState } from "react";
import { pb } from "../../../../lib/pocketbase";
import { User } from "../../../authentication/core/entities/User.entity";
import { MissionAssignment } from "../../core/entities/MissionAssignment.entity";
import { Title } from "../../core/entities/Title.entity";
import { MissionRank } from "../../core/entities/VillageSettings.entity";
import {
  getMyAssignments,
  getTitles,
} from "../../infrastructure/adapters/PocketBaseVillage.adapter";

const RANKS: MissionRank[] = ["D", "C", "B", "A", "S"];

// Símbolo oficial de Sunagakure (sunagakure_symbol.svg)
const SunagakureSymbol = ({
  size = 40,
  color = "#5a3618",
}: {
  size?: number;
  color?: string;
}) => (
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

const Shuriken = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <g fill="#241a10" stroke="#0f0a05" strokeWidth={2} strokeLinejoin="round">
      {[0, 90, 180, 270].map((a, i) => (
        <path
          key={i}
          d="M50 50 L28 30 L52 6 L61 27 Z"
          transform={`rotate(${a} 50 50)`}
        />
      ))}
    </g>
    <circle
      cx={50}
      cy={50}
      r={6}
      fill="#e3cd9e"
      stroke="#0f0a05"
      strokeWidth={2}
    />
  </svg>
);

interface NinjaCardScreenProps {
  onClose?: () => void;
}

export const NinjaCardScreen = ({
  onClose,
}: NinjaCardScreenProps) => {
  const [user, setUser] = useState<User | null>(pb.authStore.model as unknown as User | null);
  const [completed, setCompleted] = useState<MissionAssignment[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = (pb.authStore.model as any)?.id;
    if (!id) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      pb.collection('users').authRefresh().then(r => setUser(r.record as unknown as User)).catch(() => {}),
      getMyAssignments(id),
      getTitles(),
    ]).then(([, a, t]) => {
        setCompleted((a as MissionAssignment[]).filter((x) => x.status === "completed"));
        setTitles(t as Title[]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const countByRank = RANKS.reduce(
    (acc, r) => {
      acc[r] = completed.filter((a) => a.expand?.template?.rank === r).length;
      return acc;
    },
    {} as Record<MissionRank, number>,
  );

  const totalPoints = user.title_points || 0;
  const currentTitle = titles.find((t) => t.name === user.current_title);
  const nextTitle = titles
    .filter((t) => t.min_points > totalPoints)
    .sort((a, b) => a.min_points - b.min_points)[0];
  const progressPts = nextTitle?.min_points ?? (totalPoints || 1);
  const progress = Math.min(100, Math.round((totalPoints / progressPts) * 100));

  const avatarUrl = user.avatar
    ? `${pb.baseUrl}/api/files/users/${user.id}/${user.avatar}`
    : undefined;

  const fontLabel = "'Cinzel', 'Georgia', serif";
  const fontValue = "'Trebuchet MS', 'Verdana', sans-serif";
  const fontBold = "'Georgia', 'Times New Roman', serif";

  const tealText = "#194651";
  const darkBrown = "#3a2614";
  const goldenBox = "linear-gradient(180deg,#d8b87f,#c19f63)";
  const goldenBoxShadow =
    "inset 0 2px 4px rgba(80,50,15,.30), inset 0 0 0 1px rgba(90,60,25,.45)";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "stretch",
        background: "transparent",
      }}
    >
      {/* Outer dark green frame */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 5,
          borderRadius: 10,
          background: "linear-gradient(150deg,#4a6350,#34463a 55%,#2c3b31)",
          boxShadow:
            "0 18px 40px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.06)",
          userSelect: "none",
          fontFamily: fontLabel,
        }}
      >
        {/* Inner parchment card */}
        <div
          style={{
            flex: 1,
            position: "relative",
            borderRadius: 7,
            padding: "16px 18px 14px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#e3cd9e",
            backgroundImage: [
              "radial-gradient(circle at 18% 12%, rgba(120,80,30,.16), transparent 42%)",
              "radial-gradient(circle at 85% 78%, rgba(110,70,25,.20), transparent 46%)",
              "radial-gradient(circle at 70% 20%, rgba(150,110,50,.10), transparent 38%)",
              "linear-gradient(135deg, rgba(255,245,215,.55), rgba(150,110,55,.18))",
            ].join(", "),
            boxShadow:
              "inset 0 0 60px rgba(90,55,15,.30), inset 0 0 0 2px rgba(90,55,20,.25)",
          }}
        >
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 10,
                width: 22,
                height: 22,
                borderRadius: 3,
                border: "1px solid rgba(90,55,20,.4)",
                background: "rgba(90,55,20,.15)",
                color: "#5a3618",
                fontSize: 14,
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all .15s",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = "rgba(90,55,20,.35)"
                el.style.color = "#2a1408"
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = "rgba(90,55,20,.15)"
                el.style.color = "#5a3618"
              }}
              title="Fechar"
            >
              ✕
            </button>
          )}

          {/* Paper grain */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              mixBlendMode: "multiply",
              opacity: 0.1,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: "180px 180px",
            }}
          />

          {/* Watermark gourd */}
          <div
            style={{
              position: "absolute",
              right: -40,
              bottom: 50,
              width: 260,
              height: 260,
              opacity: 0.07,
              pointerEvents: "none",
              transform: "rotate(-12deg)",
            }}
          >
            <SunagakureSymbol size={260} color="#5a3618" />
          </div>

          {/* ── HEADER ── */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              paddingBottom: 7,
            }}
          >
            <div style={{ width: 22, height: 22, flexShrink: 0 }}>
              <Shuriken size={22} />
            </div>
            <div
              style={{
                fontFamily: fontBold,
                fontSize: 20,
                letterSpacing: 2,
                color: darkBrown,
                whiteSpace: "nowrap",
                textShadow: "0 1px 0 rgba(255,250,230,.5)",
                fontWeight: 900,
              }}
            >
              CARTEIRINHA NINJA
            </div>
            <div style={{ width: 22, height: 22, flexShrink: 0 }}>
              <Shuriken size={22} />
            </div>
          </div>
          <div
            style={{
              position: "relative",
              height: 3,
              marginBottom: 12,
              borderRadius: 2,
              background: "linear-gradient(180deg,#5a341a,#3a2010)",
              boxShadow: "0 1px 0 rgba(255,240,210,.4)",
            }}
          />

          {/* ── VILLAGE BANNER ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                position: "relative",
                flex: 1,
                display: "flex",
                alignItems: "center",
                padding: "9px 16px",
                borderRadius: 5,
                overflow: "hidden",
                background: "#e3cd9e",
                boxShadow: "inset 0 0 0 2px rgba(90,55,20,.25)",
              }}
            >
              <span
                style={{
                  position: "relative",
                  fontFamily: fontBold,
                  fontSize: 24,
                  letterSpacing: 1.5,
                  color: darkBrown,
                  textShadow: "0 1px 0 rgba(255,245,210,.5)",
                  fontWeight: 900,
                }}
              >
                SUNAGAKURE
              </span>
            </div>
            <div
              style={{
                width: 62,
                flexShrink: 0,
                padding: 3,
                borderRadius: 6,
                background: "linear-gradient(180deg,#6e4527,#46280f)",
                boxShadow: "0 2px 4px rgba(0,0,0,.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: 52,
                  borderRadius: 4,
                  overflow: "hidden",
                  boxShadow: "inset 0 0 0 1.5px rgba(90,55,20,.25)",
                  background: "#e3cd9e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src="./images/card-ninja-header.webp"
                  alt=""
                  style={{
                    width: "80%",
                    height: "80%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── PHOTO + IDENTITY ── */}
          <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
            {/* Photo */}
            <div
              style={{
                flexShrink: 0,
                padding: 4,
                borderRadius: 6,
                background: "linear-gradient(135deg,#caa66e,#a9824f)",
                boxShadow:
                  "0 2px 5px rgba(0,0,0,.25), inset 0 0 0 1px rgba(90,60,25,.4)",
              }}
            >
              <div
                style={{
                  width: 88,
                  height: 96,
                  borderRadius: 3,
                  overflow: "hidden",
                  background: "#2a1a08",
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                      fontWeight: 700,
                      color: "#c8860a",
                      fontFamily: fontBold,
                    }}
                  >
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Name + Title */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: fontLabel,
                    fontWeight: 600,
                    fontSize: 11,
                    color: darkBrown,
                    marginBottom: 4,
                    letterSpacing: "0.08em",
                  }}
                >
                  Nome:
                </div>
                <div
                  style={{
                    fontFamily: fontValue,
                    fontWeight: 600,
                    fontSize: 15,
                    textAlign: "center",
                    padding: "4px 8px",
                    borderRadius: 5,
                    color: tealText,
                    background: goldenBox,
                    boxShadow: goldenBoxShadow,
                    letterSpacing: "0.04em",
                  }}
                >
                  {user.name.toUpperCase()}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: fontLabel,
                    fontWeight: 600,
                    fontSize: 11,
                    color: darkBrown,
                    marginBottom: 4,
                    letterSpacing: "0.08em",
                  }}
                >
                  Título:
                </div>
                <div
                  style={{
                    fontFamily: fontValue,
                    fontWeight: 600,
                    fontSize: 14,
                    textAlign: "center",
                    padding: "4px 8px",
                    borderRadius: 5,
                    color: tealText,
                    background: goldenBox,
                    boxShadow: goldenBoxShadow,
                    minHeight: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {currentTitle ? (
                    currentTitle.name.toUpperCase()
                  ) : (
                    <span style={{ opacity: 0.6 }}>—</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div
            style={{
              height: 0,
              borderTop: "2px dashed rgba(95,60,22,.55)",
              margin: "2px 0 10px",
            }}
          />

          {/* ── MISSIONS ── */}
          <div style={{ display: "flex", gap: 12, flex: 1 }}>
            {/* Gourd symbol left */}
            <div
              style={{
                flexShrink: 0,
                width: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "center",
              }}
            >
              <SunagakureSymbol size={56} color="#6e4527" />
            </div>

            {/* Ranks right */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 7,
                justifyContent: "center",
              }}
            >
              {RANKS.map((r) => (
                <div
                  key={r}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <div
                    style={{ flex: 1, display: "flex", alignItems: "baseline" }}
                  >
                    <span
                      style={{
                        fontFamily: fontLabel,
                        fontWeight: 600,
                        fontSize: 11,
                        color: darkBrown,
                        whiteSpace: "nowrap",
                        letterSpacing: "0.05em",
                      }}
                    >
                      MISSÕES RANK {r}:
                    </span>
                    <span
                      style={{
                        flex: 1,
                        marginLeft: 6,
                        borderBottom: "1.5px dotted rgba(95,60,22,.5)",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      flexShrink: 0,
                      width: 40,
                      textAlign: "center",
                      fontFamily: fontValue,
                      fontWeight: 600,
                      fontSize: 16,
                      color: tealText,
                      padding: "1px 0",
                      borderRadius: 5,
                      background: goldenBox,
                      boxShadow: goldenBoxShadow,
                    }}
                  >
                    {loading ? "–" : countByRank[r] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── CREDITS + FOOTER (fixo no fundo) ── */}
          <div style={{ flexShrink: 0 }}>
            {/* Social credits label */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                margin: "6px 0 6px",
              }}
            >
              <span
                style={{ flex: 1, borderTop: "2px dashed rgba(95,60,22,.55)" }}
              />
              <span
                style={{
                  fontFamily: fontLabel,
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: 0.5,
                  color: darkBrown,
                  whiteSpace: "nowrap",
                }}
              >
                CRÉDITOS SOCIAIS
              </span>
              <span
                style={{ flex: 1, borderTop: "2px dashed rgba(95,60,22,.55)" }}
              />
            </div>

            {/* Credits bar */}
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 6,
                padding: "6px 8px",
                background: goldenBox,
                boxShadow: goldenBoxShadow,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${progress}%`,
                  background:
                    "linear-gradient(180deg,rgba(25,70,81,.22),rgba(25,70,81,.12))",
                  borderRight: "2px solid rgba(25,70,81,.35)",
                  transition: "width 0.5s ease",
                }}
              />
              <div
                style={{
                  position: "relative",
                  textAlign: "center",
                  fontFamily: fontValue,
                  fontWeight: 600,
                  fontSize: 14,
                  color: tealText,
                }}
              >
                {loading
                  ? "..."
                  : nextTitle
                    ? `${totalPoints} / ${nextTitle.min_points} PARA NOVO TÍTULO`
                    : "TÍTULO MÁXIMO ATINGIDO"}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 10,
                paddingBottom: 2,
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  lineHeight: 1,
                  color: "#2c1d10",
                  transform: "scaleX(-1)",
                }}
              >
                ☞
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 16, height: 16 }}>
                  <Shuriken size={16} />
                </div>
                <div style={{ width: 20, height: 20 }}>
                  <Shuriken size={20} />
                </div>
                <div style={{ width: 16, height: 16 }}>
                  <Shuriken size={16} />
                </div>
                <div style={{ width: 22, height: 22 }}>
                  <Shuriken size={22} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

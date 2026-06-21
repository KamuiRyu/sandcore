/**
 * ParchmentUI — componentes no estilo da carteirinha ninja (pergaminho).
 * Usado por todas as telas dentro da HudPanel.
 */
import React from 'react'

// ── Tokens ────────────────────────────────────────────────────────────────
export const P = {
  darkBrown:    '#3a2614',
  teal:         '#194651',
  gold:         'linear-gradient(180deg,#d8b87f,#c19f63)' as const,
  goldShadow:   'inset 0 2px 4px rgba(80,50,15,.30), inset 0 0 0 1px rgba(90,60,25,.45)' as const,
  border:       'rgba(90,55,20,.25)',
  dashed:       'rgba(95,60,22,.55)',
  subtleBg:     'rgba(90,55,20,.07)',
  cardBg:       'rgba(90,55,20,.10)',
  fontLabel:    "'Cinzel', 'Georgia', serif" as const,
  fontValue:    "'Trebuchet MS', 'Verdana', sans-serif" as const,
  fontMono:     "'Trebuchet MS', monospace" as const,
}

// ── Shuriken ──────────────────────────────────────────────────────────────
export const Shuriken = ({ size = 12 }: { size?: number }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} style={{ flexShrink: 0 }}>
    <g fill="#241a10" stroke="#0f0a05" strokeWidth={2} strokeLinejoin="round">
      {[0, 90, 180, 270].map((a, i) => (
        <path key={i} d="M50 50 L28 30 L52 6 L61 27 Z" transform={`rotate(${a} 50 50)`} />
      ))}
    </g>
    <circle cx={50} cy={50} r={6} fill="#e3cd9e" stroke="#0f0a05" strokeWidth={2} />
  </svg>
)

// ── ParchSection (substitui SL / VillageSection) ─────────────────────────
export const ParchSection = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 8px' }}>
    <Shuriken size={11} />
    <span style={{
      fontFamily: P.fontLabel, fontWeight: 700, fontSize: 9,
      letterSpacing: '0.12em', color: P.darkBrown, whiteSpace: 'nowrap',
      textTransform: 'uppercase',
    }}>
      {children}
    </span>
    <span style={{ flex: 1, borderTop: `1.5px dashed ${P.dashed}` }} />
  </div>
)

// ── ParchCard (substitui TechCard / VillageCard) ──────────────────────────
export const ParchCard = ({
  children, style, accent,
}: { children: React.ReactNode; style?: React.CSSProperties; accent?: string }) => (
  <div style={{
    position: 'relative', borderRadius: 5, padding: '12px 14px',
    background: P.cardBg,
    boxShadow: `inset 0 0 0 1.5px ${P.border}`,
    overflow: 'hidden', ...style,
  }}>
    {accent && (
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
        background: accent, borderRadius: '5px 0 0 5px',
      }} />
    )}
    <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
  </div>
)

// ── ParchRowList (substitui ListContainer) ────────────────────────────────
export const ParchRowList = ({ children }: { children: React.ReactNode }) => (
  <div style={{ borderRadius: 5, overflow: 'hidden', boxShadow: `inset 0 0 0 1.5px ${P.border}` }}>
    {children}
  </div>
)

// ── ParchRow (substitui ListItem) ─────────────────────────────────────────
export const ParchRow = ({
  children, isLast = false, vertical = false,
}: { children: React.ReactNode; isLast?: boolean; vertical?: boolean }) => (
  <div style={{
    display: 'flex',
    flexDirection: vertical ? 'column' : 'row',
    alignItems: vertical ? 'stretch' : 'center',
    justifyContent: vertical ? 'flex-start' : 'space-between',
    padding: '8px 12px', fontSize: 10,
    background: 'rgba(90,55,20,.03)',
    borderBottom: isLast ? 'none' : `1px dashed ${P.dashed}`,
    gap: vertical ? 8 : 12,
  }}>
    {children}
  </div>
)

// ── GoldenBox (para valores de destaque) ──────────────────────────────────
export const GoldenBox = ({
  children, style,
}: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    padding: '4px 10px', borderRadius: 5,
    background: P.gold, boxShadow: P.goldShadow,
    color: P.teal, fontFamily: P.fontValue, fontWeight: 700, fontSize: 12,
    ...style,
  }}>
    {children}
  </div>
)

// ── ParchPrimaryBtn ───────────────────────────────────────────────────────
export const ParchPrimaryBtn = ({
  children, onClick, disabled = false, padding = '6px 12px', small = false,
}: {
  children: React.ReactNode; onClick?: () => void;
  disabled?: boolean; padding?: string; small?: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: small ? '4px 10px' : padding,
      borderRadius: 4,
      background: disabled ? 'rgba(90,55,20,.20)' : P.gold,
      boxShadow: disabled ? 'none' : P.goldShadow,
      color: P.teal, border: 'none',
      fontFamily: P.fontLabel, fontWeight: 700, fontSize: small ? 9 : 10,
      letterSpacing: '0.08em', whiteSpace: 'nowrap',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1,
      transition: 'all .15s',
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.85' }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = '1' }}
  >
    {children}
  </button>
)

// ── ParchSecondaryBtn ─────────────────────────────────────────────────────
export const ParchSecondaryBtn = ({
  children, onClick, disabled = false, padding = '5px 10px',
  active = false, small = false,
}: {
  children: React.ReactNode; onClick?: () => void;
  disabled?: boolean; padding?: string; active?: boolean; small?: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
      padding: small ? '3px 8px' : padding, borderRadius: 4,
      border: `1px solid ${active ? 'rgba(90,55,20,.5)' : P.border}`,
      background: active ? P.gold : P.subtleBg,
      boxShadow: active ? P.goldShadow : 'none',
      color: active ? P.teal : P.darkBrown,
      fontFamily: P.fontLabel, fontWeight: 700,
      fontSize: small ? 9 : 10, letterSpacing: '0.08em',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1, whiteSpace: 'nowrap', transition: 'all .15s',
    }}
    onMouseEnter={e => { if (!disabled && !active) e.currentTarget.style.background = 'rgba(90,55,20,.18)' }}
    onMouseLeave={e => { if (!disabled && !active) e.currentTarget.style.background = P.subtleBg }}
  >
    {children}
  </button>
)

// ── ParchDangerBtn ────────────────────────────────────────────────────────
export const ParchDangerBtn = ({
  children, onClick, disabled = false, width = 'auto',
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; width?: string
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: '7px 14px', borderRadius: 4, width,
      background: 'rgba(120,20,20,.12)', border: '1px solid rgba(160,40,40,.4)',
      color: '#c05050',
      fontFamily: P.fontLabel, fontWeight: 700, fontSize: 10, letterSpacing: '0.08em',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all .15s',
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(120,20,20,.25)' }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = 'rgba(120,20,20,.12)' }}
  >
    {children}
  </button>
)

// ── ParchInput ────────────────────────────────────────────────────────────
export const ParchInput = ({
  value, onChange, placeholder, type = 'text', style,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; style?: React.CSSProperties
}) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      background: 'rgba(90,55,20,.08)', border: `1px solid ${P.border}`, borderRadius: 4,
      padding: '6px 10px', fontSize: 10, color: P.darkBrown,
      fontFamily: P.fontValue, outline: 'none', width: '100%',
      ...style,
    }}
    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(90,55,20,.55)')}
    onBlur={e => (e.currentTarget.style.borderColor = P.border)}
  />
)

// ── ParchToggle ───────────────────────────────────────────────────────────
export const ParchToggle = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      width: 40, height: 20, borderRadius: 10, position: 'relative',
      cursor: 'pointer', transition: 'all .3s', border: `1px solid ${active ? 'rgba(90,55,20,.6)' : P.border}`,
      background: active ? 'rgba(90,55,20,.25)' : 'rgba(90,55,20,.08)',
    }}
  >
    <div style={{
      width: 14, height: 14, borderRadius: '50%', position: 'absolute',
      top: '50%', transform: 'translateY(-50%)',
      left: active ? 'calc(100% - 18px)' : '2px',
      background: active ? P.gold : P.border,
      boxShadow: active ? P.goldShadow : 'none',
      transition: 'all .3s',
    }} />
  </button>
)

// ── ParchKbd ──────────────────────────────────────────────────────────────
export const ParchKbd = ({ k }: { k: string }) => (
  <span style={{
    fontFamily: P.fontLabel, fontSize: 9, fontWeight: 700,
    padding: '2px 7px', borderRadius: 3,
    background: 'rgba(90,55,20,.15)', border: `1px solid ${P.border}`,
    borderBottomWidth: 2, color: P.darkBrown, letterSpacing: '0.06em',
  }}>
    {k === 'CommandOrControl' || k === 'CmdOrCtrl' ? 'Ctrl' : k}
  </span>
)

// ── ParchSelect (para <select> nativo) ────────────────────────────────────
export const ParchNativeSelect = ({
  value, onChange, children, style,
}: {
  value: string; onChange: (v: string) => void;
  children: React.ReactNode; style?: React.CSSProperties
}) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{
      background: 'rgba(90,55,20,.08)', border: `1px solid ${P.border}`, borderRadius: 4,
      padding: '5px 8px', fontSize: 10, color: P.darkBrown,
      fontFamily: P.fontValue, outline: 'none', cursor: 'pointer', ...style,
    }}
    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(90,55,20,.55)')}
    onBlur={e => (e.currentTarget.style.borderColor = P.border)}
  >
    {children}
  </select>
)

// ── ParchIconBtn ──────────────────────────────────────────────────────────
import { type LucideIcon } from 'lucide-react'

export const ParchIconBtn = ({
  icon: Icon, onClick, danger = false, title = '', size = 12,
}: {
  icon: LucideIcon; onClick?: () => void; danger?: boolean; title?: string; size?: number
}) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 26, height: 26, borderRadius: 4, cursor: 'pointer',
      background: danger ? 'rgba(120,20,20,.08)' : P.subtleBg,
      border: `1px solid ${danger ? 'rgba(160,40,40,.35)' : P.border}`,
      color: danger ? '#c05050' : P.darkBrown,
      transition: 'all .15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(120,20,20,.25)' : 'rgba(90,55,20,.20)' }}
    onMouseLeave={e => { e.currentTarget.style.background = danger ? 'rgba(120,20,20,.08)' : P.subtleBg }}
  >
    <Icon size={size} />
  </button>
)

// ── StatusBadge (mantém cores semânticas, adapta ao parchment) ────────────
export const StatusBadge = ({ status }: {
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'pending_review' | 'completed'
}) => {
  const map = {
    pending:        { label: 'Pendente',      bg: 'rgba(180,120,0,.12)',  border: 'rgba(140,90,0,.4)',   color: '#7a5800' },
    approved:       { label: 'Aprovado',      bg: 'rgba(40,120,60,.12)',  border: 'rgba(40,100,50,.4)',  color: '#285a38' },
    rejected:       { label: 'Recusado',      bg: 'rgba(120,20,20,.12)',  border: 'rgba(140,40,40,.4)',  color: '#8a2020' },
    in_progress:    { label: 'Em Andamento',  bg: 'rgba(30,70,130,.10)',  border: 'rgba(40,80,160,.35)', color: '#1a4070' },
    pending_review: { label: 'Em Revisão',    bg: 'rgba(160,90,0,.12)',   border: 'rgba(140,80,0,.4)',   color: '#6a4000' },
    completed:      { label: 'Concluído',     bg: 'rgba(40,120,60,.12)',  border: 'rgba(40,100,50,.4)',  color: '#285a38' },
  }
  const s = map[status]
  return (
    <span style={{
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      fontSize: 9, fontFamily: P.fontLabel, fontWeight: 700, letterSpacing: '0.08em',
      padding: '2px 7px', borderRadius: 3,
    }}>
      {s.label}
    </span>
  )
}

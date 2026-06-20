import React from 'react'
import { type LucideIcon } from 'lucide-react'

export const VillageSection = ({ label, children }: { label: string; children?: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-2">
    <span style={{ color: '#c8a030', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>[</span>
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c8a030', whiteSpace: 'nowrap' }}>
      {label}
    </span>
    <div className="flex-1" style={{ borderTop: '1px dashed rgba(200,160,48,0.25)' }} />
    {children}
    <span style={{ color: '#c8a030', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>]</span>
  </div>
)

export const VillageCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={className}
    style={{
      background: 'rgba(13,10,4,0.8)',
      border: '1px solid #2e1e06',
      borderRadius: 3,
      padding: '10px 12px',
    }}
  >
    {children}
  </div>
)

export const VillagePrimaryButton = ({ children, onClick, disabled = false, small = false }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; small?: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: small ? '4px 10px' : '6px 14px',
      borderRadius: 3,
      background: disabled ? '#2e1e06' : 'linear-gradient(135deg,#b87a08,#e8a820)',
      color: disabled ? '#6a5028' : '#0a0800',
      border: 'none',
      fontWeight: 700, fontSize: small ? 9 : 10,
      fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em',
      cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
    }}
  >
    {children}
  </button>
)

export const VillageSecondaryButton = ({ children, onClick, disabled = false, danger = false, small = false }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; danger?: boolean; small?: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: small ? '3px 8px' : '5px 12px',
      borderRadius: 3,
      background: 'transparent',
      color: danger ? '#e07070' : '#c8a840',
      border: `1px solid ${danger ? '#7a1414' : '#2e1e06'}`,
      fontSize: small ? 9 : 10,
      fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.08em',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap',
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.8' }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = '1' }}
  >
    {children}
  </button>
)

export const VillageInput = ({ value, onChange, placeholder, type = 'text', className = '' }: {
  value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string
}) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className={className}
    style={{
      background: 'rgba(13,10,4,0.9)',
      border: '1px solid #2e1e06',
      borderRadius: 3,
      padding: '5px 8px',
      fontSize: 10,
      color: '#e8d5a0',
      fontFamily: "'JetBrains Mono', monospace",
      outline: 'none',
      width: '100%',
    }}
    onFocus={e => (e.currentTarget.style.borderColor = '#c8860a')}
    onBlur={e => (e.currentTarget.style.borderColor = '#2e1e06')}
  />
)

export const VillageSelect = ({ value, onChange, children, className = '' }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; className?: string
}) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className={className}
    style={{
      background: 'rgba(13,10,4,0.9)',
      border: '1px solid #2e1e06',
      borderRadius: 3,
      padding: '5px 8px',
      fontSize: 10,
      color: '#e8d5a0',
      fontFamily: "'JetBrains Mono', monospace",
      outline: 'none',
      cursor: 'pointer',
    }}
    onFocus={e => (e.currentTarget.style.borderColor = '#c8860a')}
    onBlur={e => (e.currentTarget.style.borderColor = '#2e1e06')}
  >
    {children}
  </select>
)

export const StatusBadge = ({ status }: { status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'pending_review' | 'completed' }) => {
  const map = {
    pending: { label: 'Pendente', bg: 'rgba(180,120,0,0.15)', border: '#8a6000', color: '#e8b840' },
    approved: { label: 'Aprovado', bg: 'rgba(40,120,60,0.15)', border: '#285a38', color: '#5ac87a' },
    rejected: { label: 'Recusado', bg: 'rgba(120,20,20,0.15)', border: '#7a1414', color: '#e07070' },
    in_progress: { label: 'Em Andamento', bg: 'rgba(40,80,160,0.15)', border: '#2a5ab0', color: '#7aabf0' },
    pending_review: { label: 'Em Revisão', bg: 'rgba(180,100,0,0.15)', border: '#9a6000', color: '#e8a840' },
    completed: { label: 'Concluído', bg: 'rgba(40,120,60,0.15)', border: '#285a38', color: '#5ac87a' },
  }
  const s = map[status]
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.08em', padding: '2px 7px', borderRadius: 2 }}>
      {s.label}
    </span>
  )
}

export const VillageIconButton = ({ icon: Icon, onClick, danger = false, title = '' }: {
  icon: LucideIcon; onClick?: () => void; danger?: boolean; title?: string
}) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 24, height: 24, borderRadius: 3, cursor: 'pointer',
      background: 'transparent',
      border: `1px solid ${danger ? '#7a1414' : '#2e1e06'}`,
      color: danger ? '#e07070' : '#9a7a40',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(120,20,20,0.25)' : 'rgba(74,47,10,0.3)' }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
  >
    <Icon size={12} />
  </button>
)

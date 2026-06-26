import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, type LucideIcon } from 'lucide-react'

export const VillageSection = ({ label, children }: { label: string; children?: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-3">
    <span style={{ color: '#c8a030', fontSize: 12, fontFamily: "'Orbitron', sans-serif" }}>[</span>
    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c8a030', whiteSpace: 'nowrap' }}>
      {label}
    </span>
    <div className="flex-1" style={{ borderTop: '1px dashed rgba(200,160,48,0.25)' }} />
    {children}
    <span style={{ color: '#c8a030', fontSize: 12, fontFamily: "'Orbitron', sans-serif" }}>]</span>
  </div>
)

export const VillageCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={className}
    style={{
      background: 'rgba(8,8,8,0.8)',
      border: '1px solid #1e1e1e',
      borderRadius: 3,
      padding: '14px 16px',
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
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: small ? '6px 12px' : '8px 18px',
      borderRadius: 3,
      background: disabled ? '#1e1e1e' : 'linear-gradient(135deg,#b87a08,#e8a820)',
      color: disabled ? '#6a5028' : '#0a0800',
      border: 'none',
      fontWeight: 700, fontSize: small ? 11 : 12,
      fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em',
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
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: small ? '5px 10px' : '7px 14px',
      borderRadius: 3,
      background: 'transparent',
      color: danger ? '#e07070' : '#c8a840',
      border: `1px solid ${danger ? '#7a1414' : '#1e1e1e'}`,
      fontSize: small ? 11 : 12,
      fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: '0.08em',
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
      background: 'rgba(8,8,8,0.9)',
      border: '1px solid #1e1e1e',
      borderRadius: 3,
      padding: '8px 10px',
      fontSize: 12,
      color: '#e8d5a0',
      fontFamily: "'Orbitron', sans-serif",
      outline: 'none',
      width: '100%',
    }}
    onFocus={e => (e.currentTarget.style.borderColor = '#c8860a')}
    onBlur={e => (e.currentTarget.style.borderColor = '#1e1e1e')}
  />
)

export const VillageSelect = ({ value, onChange, children, className = '' }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; className?: string
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const options = React.Children.toArray(children).filter(
    (c): c is React.ReactElement<{ value: string; children?: React.ReactNode }> =>
      React.isValidElement(c) && c.type === 'option'
  )

  const selected = options.find(o => String(o.props.value) === String(value))
  const label = selected ? selected.props.children : value

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className={className} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
          background: 'rgba(8,8,8,0.9)',
          border: `1px solid ${open ? '#c8860a' : '#1e1e1e'}`,
          borderRadius: 3,
          padding: '8px 10px',
          fontSize: 12,
          color: value ? '#e8d5a0' : '#6a5028',
          fontFamily: "'Orbitron', sans-serif",
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <ChevronDown size={12} style={{ flexShrink: 0, color: '#9a7a40', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 9999,
          background: '#080808',
          border: '1px solid #c8860a55',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 6px 18px rgba(0,0,0,0.7)',
        }}>
          {options.map((o, i) => {
            const isSelected = String(o.props.value) === String(value)
            return (
              <div
                key={i}
                onMouseDown={() => { onChange(String(o.props.value)); setOpen(false) }}
                style={{
                  padding: '8px 12px',
                  fontSize: 12,
                  fontFamily: "'Orbitron', sans-serif",
                  color: isSelected ? '#c8860a' : '#e8d5a0',
                  background: isSelected ? 'rgba(200,134,10,0.12)' : 'transparent',
                  cursor: 'pointer',
                  borderLeft: isSelected ? '2px solid #c8860a' : '2px solid transparent',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(40,40,40,0.4)' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                {o.props.children}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

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
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: 11, fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: '0.08em', padding: '3px 10px', borderRadius: 2, whiteSpace: 'nowrap' }}>
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
      width: 30, height: 30, borderRadius: 3, cursor: 'pointer',
      background: 'transparent',
      border: `1px solid ${danger ? '#7a1414' : '#1e1e1e'}`,
      color: danger ? '#e07070' : '#9a7a40',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(120,20,20,0.25)' : 'rgba(40,40,40,0.3)' }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
  >
    <Icon size={14} />
  </button>
)

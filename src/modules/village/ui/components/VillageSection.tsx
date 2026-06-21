import React from 'react'
import {
  ParchSection, ParchCard, ParchPrimaryBtn, ParchSecondaryBtn,
  ParchInput, ParchNativeSelect, ParchIconBtn, StatusBadge as ParchStatusBadge, P,
} from '../../../../components/ui/ParchmentUI'
import { type LucideIcon } from 'lucide-react'

export { StatusBadge } from '../../../../components/ui/ParchmentUI'

export const VillageSection = ({ label, children }: { label: string; children?: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0 8px' }}>
    <div style={{ flex: 1 }}>
      <ParchSection>{label}</ParchSection>
    </div>
    {children}
  </div>
)

export const VillageCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <ParchCard style={{ padding: '10px 12px' }}>
    <div className={className}>{children}</div>
  </ParchCard>
)

export const VillagePrimaryButton = ({ children, onClick, disabled = false, small = false }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; small?: boolean
}) => (
  <ParchPrimaryBtn onClick={onClick} disabled={disabled} small={small}>
    {children}
  </ParchPrimaryBtn>
)

export const VillageSecondaryButton = ({ children, onClick, disabled = false, danger = false, small = false }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; danger?: boolean; small?: boolean
}) => {
  if (danger) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: small ? '3px 8px' : '5px 12px', borderRadius: 4,
          background: 'rgba(120,20,20,.10)', border: '1px solid rgba(160,40,40,.35)',
          color: '#c05050', fontFamily: P.fontLabel, fontWeight: 700,
          fontSize: small ? 9 : 10, letterSpacing: '0.08em',
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(120,20,20,.25)' }}
        onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = 'rgba(120,20,20,.10)' }}
      >
        {children}
      </button>
    )
  }
  return (
    <ParchSecondaryBtn onClick={onClick} disabled={disabled} small={small}>
      {children}
    </ParchSecondaryBtn>
  )
}

export const VillageInput = ({ value, onChange, placeholder, type = 'text', className = '' }: {
  value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string
}) => (
  <ParchInput
    type={type}
    value={String(value)}
    onChange={onChange}
    placeholder={placeholder}
    style={className ? undefined : undefined}
  />
)

export const VillageSelect = ({ value, onChange, children, className = '' }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; className?: string
}) => (
  <ParchNativeSelect value={value} onChange={onChange}>
    {children}
  </ParchNativeSelect>
)

export const VillageIconButton = ({ icon: Icon, onClick, danger = false, title = '' }: {
  icon: LucideIcon; onClick?: () => void; danger?: boolean; title?: string
}) => (
  <ParchIconBtn icon={Icon} onClick={onClick} danger={danger} title={title} />
)

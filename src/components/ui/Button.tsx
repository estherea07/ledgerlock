import React from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
const STYLES: Record<Variant, React.CSSProperties> = {
  primary:   { background: '#1B4332', color: '#fff', border: '1px solid #1B4332' },
  secondary: { background: '#fff', color: '#1A1A18', border: '1px solid rgba(0,0,0,0.12)' },
  danger:    { background: '#C0392B', color: '#fff', border: '1px solid #C0392B' },
  ghost:     { background: 'transparent', color: '#1B4332', border: '1px solid #1B4332' },
}

export default function Button({ children, variant = 'secondary', onClick, disabled, size = 'md', style, type = 'button' }: {
  children: React.ReactNode; variant?: Variant; onClick?: () => void;
  disabled?: boolean; size?: 'sm' | 'md' | 'lg'; style?: React.CSSProperties; type?: 'button' | 'submit'
}) {
  const padding = size === 'sm' ? '5px 12px' : size === 'lg' ? '12px 28px' : '8px 18px'
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 15 : 13
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      ...STYLES[variant], padding, fontSize, fontWeight: 500,
      fontFamily: "'DM Sans', sans-serif", borderRadius: 8,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      transition: 'all 0.15s', whiteSpace: 'nowrap', ...style,
    }}>
      {children}
    </button>
  )
}

import React from 'react'

type BadgeVariant = 'green' | 'red' | 'amber' | 'gray' | 'blue'

const VARIANTS: Record<BadgeVariant, { bg: string; color: string }> = {
  green:  { bg: '#D8F3DC', color: '#1B4332' },
  red:    { bg: '#FDECEA', color: '#C0392B' },
  amber:  { bg: '#FFF7ED', color: '#C4520A' },
  gray:   { bg: '#F3F4F6', color: '#374151' },
  blue:   { bg: '#EFF6FF', color: '#1D4ED8' },
}

export default function Badge({ children, variant = 'gray' }: { children: React.ReactNode; variant?: BadgeVariant }) {
  const { bg, color } = VARIANTS[variant]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: bg, color, fontSize: 11, fontWeight: 500,
      padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

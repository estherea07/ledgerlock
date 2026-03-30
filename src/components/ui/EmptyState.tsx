import React from 'react'

export default function EmptyState({ icon, title, description, action }: {
  icon: string; title: string; description: string; action?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', gap: 12 }}>
      <div style={{ fontSize: 40 }}>{icon}</div>
      <div style={{ fontWeight: 500, fontSize: 15, color: '#1A1A18' }}>{title}</div>
      <div style={{ fontSize: 13, color: '#6B6B67', maxWidth: 320, lineHeight: 1.6 }}>{description}</div>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}

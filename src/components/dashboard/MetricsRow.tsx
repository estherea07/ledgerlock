import React from 'react'
import type { DashboardMetrics } from '@/types'

function MetricCard({ label, value, badge, badgeVariant }: {
  label: string; value: string; badge: string; badgeVariant: 'green' | 'red' | 'amber'
}) {
  const colors = { green: { bg: '#D8F3DC', color: '#1B4332' }, red: { bg: '#FDECEA', color: '#C0392B' }, amber: { bg: '#FFF7ED', color: '#C4520A' } }
  const c = colors[badgeVariant]
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 11, color: '#6B6B67', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 500, color: '#1A1A18', lineHeight: 1 }}>{value}</div>
      <span style={{ display: 'inline-block', marginTop: 6, background: c.bg, color: c.color, fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20 }}>{badge}</span>
    </div>
  )
}

export default function MetricsRow({ metrics }: { metrics?: DashboardMetrics }) {
  const m = metrics || { revenueProtected: 0, threatsBlocked: 0, linksIssued: 0, staffAtRisk: 0 }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      <MetricCard label="Revenue Protected" value={`\u20A6${(m.revenueProtected / 1000).toFixed(0)}K`} badge="This month" badgeVariant="green" />
      <MetricCard label="Threats Blocked" value={String(m.threatsBlocked)} badge={`${m.threatsBlocked} by Elf`} badgeVariant="red" />
      <MetricCard label="Payment Links" value={String(m.linksIssued)} badge="Elf-verified" badgeVariant="green" />
      <MetricCard label="Staff at Risk" value={String(m.staffAtRisk)} badge={m.staffAtRisk > 0 ? "Monitor" : "All clear"} badgeVariant={m.staffAtRisk > 0 ? "amber" : "green"} />
    </div>
  )
}

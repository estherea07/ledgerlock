'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import type { AuditLog } from '@/types'

const ACTION_MAP: Record<string, { icon: string; label: string; variant: 'green' | 'red' | 'amber' | 'gray' }> = {
  transaction_approved:    { icon: '✅', label: 'Approved',       variant: 'green' },
  transaction_blocked:     { icon: '🚫', label: 'Blocked',        variant: 'red'   },
  transaction_flagged:     { icon: '⚠️', label: 'Flagged',        variant: 'amber' },
  transaction_pending:     { icon: '⏳', label: 'Pending',        variant: 'gray'  },
  ciba_approve:            { icon: '✅', label: 'CIBA Approved',  variant: 'green' },
  ciba_deny:               { icon: '❌', label: 'CIBA Denied',    variant: 'red'   },
  payment_link_created:    { icon: '🔗', label: 'Link Created',   variant: 'gray'  },
  payment_received:        { icon: '💰', label: 'Payment In',     variant: 'green' },
  staff_suspended:         { icon: '🔒', label: 'Suspended',      variant: 'red'   },
  vault_token_added:       { icon: '🔑', label: 'Token Added',    variant: 'gray'  },
}

const FILTER_TABS = ['all', 'elf_actions', 'owner_actions', 'blocks', 'approvals']

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/audit')
      .then(r => r.json())
      .then(d => { setLogs(d.logs || []); setLoading(false) })
  }, [])

  const filtered = logs.filter(log => {
    if (filter === 'elf_actions') return log.performedBy === 'elf'
    if (filter === 'owner_actions') return log.performedBy !== 'elf'
    if (filter === 'blocks') return log.action.includes('block') || log.action.includes('suspend')
    if (filter === 'approvals') return log.action.includes('approve') || log.action.includes('received')
    return true
  })

  const exportCSV = () => {
    const rows = [
      ['Date', 'Action', 'Description', 'Performed By', 'Entity', 'Entity ID'].join(','),
      ...filtered.map(l => [
        new Date(l.createdAt).toISOString(),
        l.action, `"${l.description}"`,
        l.performedBy, l.entity, l.entityId || ''
      ].join(','))
    ]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ledgerlock-audit-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F5F0' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 500, margin: 0, color: '#1A1A18' }}>Audit Log</h1>
            <p style={{ color: '#6B6B67', fontSize: 14, margin: '4px 0 0' }}>
              Every action Elf takes is cryptographically logged via Auth0. Tamper-proof by design.
            </p>
          </div>
          <button onClick={exportCSV} style={{ padding: '8px 16px', background: '#fff', color: '#1A1A18', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Export CSV
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Total Events', value: logs.length, color: '#1A1A18' },
            { label: 'Elf Actions', value: logs.filter(l => l.performedBy === 'elf').length, color: '#1B4332' },
            { label: 'Owner Actions', value: logs.filter(l => l.performedBy !== 'elf').length, color: '#1D4ED8' },
            { label: 'Blocks / Flags', value: logs.filter(l => l.action.includes('block') || l.action.includes('flag')).length, color: '#C0392B' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 500, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <Card>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: 4, overflowX: 'auto' }}>
            {FILTER_TABS.map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{
                padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 12.5, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                background: filter === t ? '#1B4332' : 'transparent',
                color: filter === t ? '#fff' : '#6B6B67',
                transition: 'all 0.15s', textTransform: 'capitalize', whiteSpace: 'nowrap',
              }}>{t.replace('_', ' ')}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF', alignSelf: 'center' }}>
              {filtered.length} events
            </span>
          </div>

          {loading ? <LoadingSpinner message="loading audit log..." /> :
            filtered.length === 0 ? (
              <EmptyState icon="📋" title="No audit events" description="Elf will log every action here as it happens." />
            ) : (
              <div>
                {filtered.map((log, i) => {
                  const meta = ACTION_MAP[log.action] || { icon: '📋', label: log.action, variant: 'gray' as const }
                  let parsedMeta: any = {}
                  try { parsedMeta = JSON.parse(log.metadata || '{}') } catch {}

                  return (
                    <div key={log.id} style={{
                      display: 'flex', gap: 14, padding: '12px 18px',
                      borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                      alignItems: 'flex-start',
                    }}>
                      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{meta.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                          {parsedMeta.riskScore !== undefined && (
                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>Risk: {parsedMeta.riskScore}/100</span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: '#1A1A18', lineHeight: 1.5, marginBottom: 4 }}>{log.description}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <span>{log.performedBy === 'elf' ? '🤖 Elf Agent' : '👤 Owner'}</span>
                          <span>{log.entity}{log.entityId ? ` · ${log.entityId.slice(0, 12)}...` : ''}</span>
                          {log.auth0LogId && <span>Auth0: {log.auth0LogId}</span>}
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }
        </Card>
      </main>
    </div>
  )
}

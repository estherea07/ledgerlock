import React from 'react'
import type { AuditLog } from '@/types'
import Card, { CardHeader } from '@/components/ui/Card'

const ACTION_ICONS: Record<string, string> = {
  transaction_approved: '✅',
  transaction_blocked: '🚫',
  transaction_flagged: '⚠️',
  ciba_approve: '✅',
  ciba_deny: '❌',
  payment_link_created: '🔗',
  payment_received: '💰',
  staff_suspended: '🔒',
  vault_token_added: '🔑',
  default: '📋',
}

export default function ElfInsight({ logs }: { logs: AuditLog[] }) {
  return (
    <Card>
      <CardHeader title="Elf Audit Trail" action={<a href="/audit" style={{ color: '#1B4332', textDecoration: 'none', fontWeight: 500 }}>Full log →</a>} />
      {logs.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Elf hasn't logged anything yet.</div>
      ) : (
        <div>
          {logs.slice(0, 6).map((log, i) => (
            <div key={log.id} style={{ display: 'flex', gap: 10, padding: '10px 16px', borderBottom: i < 5 ? '1px solid rgba(0,0,0,0.04)' : 'none', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                {ACTION_ICONS[log.action] || ACTION_ICONS.default}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: '#1A1A18', lineHeight: 1.5 }}>{log.description}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                  {log.performedBy === 'elf' ? '🤖 Elf' : '👤 Owner'} · {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

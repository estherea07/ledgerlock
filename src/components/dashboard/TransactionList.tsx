import React from 'react'
import type { Transaction } from '@/types'
import Badge from '@/components/ui/Badge'
import Card, { CardHeader } from '@/components/ui/Card'

function txIcon(status: string) {
  if (status === 'approved') return { icon: '✓', bg: '#D8F3DC' }
  if (status === 'blocked') return { icon: '✗', bg: '#FDECEA' }
  if (status === 'flagged') return { icon: '!', bg: '#FFF7ED' }
  return { icon: '·', bg: '#F3F4F6' }
}

function txBadge(status: string): 'green' | 'red' | 'amber' | 'gray' {
  if (status === 'approved') return 'green'
  if (status === 'blocked') return 'red'
  if (status === 'flagged') return 'amber'
  return 'gray'
}

export default function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card>
      <CardHeader title="Recent Transactions" action={<a href="/payments" style={{ color: '#1B4332', textDecoration: 'none', fontWeight: 500 }}>View all →</a>} />
      {transactions.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No transactions yet. Elf is ready.</div>
      ) : (
        <div>
          {transactions.slice(0, 6).map(tx => {
            const { icon, bg } = txIcon(tx.status)
            return (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ width: 34, height: 34, background: bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.vendor || tx.description}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                    {tx.staff?.name || 'System'} · {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: tx.type === 'incoming' ? '#1B4332' : '#C0392B' }}>
                    {tx.type === 'incoming' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                  </div>
                  <Badge variant={txBadge(tx.status)}>{tx.status}</Badge>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

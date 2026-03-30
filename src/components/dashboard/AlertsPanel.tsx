'use client'
import React, { useState } from 'react'
import type { Transaction } from '@/types'
import Button from '@/components/ui/Button'

export default function AlertsPanel({ pendingItems, onAction }: {
  pendingItems: Transaction[]; onAction: () => void
}) {
  const [acting, setActing] = useState<string | null>(null)
  const [done, setDone] = useState<Record<string, string>>({})

  const act = async (id: string, action: 'approve' | 'deny') => {
    setActing(id)
    await fetch('/api/transactions/ciba', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: id, action }),
    })
    setDone(d => ({ ...d, [id]: action }))
    setActing(null)
    onAction()
  }

  if (pendingItems.length === 0) return null

  return (
    <div style={{ background: '#FDECEA', border: '1px solid rgba(192,57,43,0.18)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#C0392B' }}>
          Elf flagged {pendingItems.length} transaction{pendingItems.length > 1 ? 's' : ''} requiring your approval
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pendingItems.map(tx => (
          <div key={tx.id} style={{ background: '#fff', border: '1px solid rgba(192,57,43,0.12)', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 18, marginTop: 1 }}>💸</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#5C1A1A', lineHeight: 1.5 }}>
                <strong>{tx.staff?.name || 'Staff'}</strong> requested{' '}
                <strong>₦{tx.amount.toLocaleString()}</strong>
                {tx.vendor ? ` to "${tx.vendor}"` : ''}.
                {' '}<span style={{ color: '#C0392B' }}>Risk: {tx.riskLevel}</span>
              </div>
              {JSON.parse(tx.riskReasons || '[]').length > 0 && (
                <div style={{ fontSize: 11, color: '#9B1C1C', marginTop: 4 }}>
                  {JSON.parse(tx.riskReasons).slice(0, 2).join(' · ')}
                </div>
              )}
              {done[tx.id] ? (
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 500, color: done[tx.id] === 'approve' ? '#1B4332' : '#C0392B' }}>
                  {done[tx.id] === 'approve' ? '✓ Approved and logged' : '✗ Denied by you'}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <Button variant="primary" size="sm" onClick={() => act(tx.id, 'approve')} disabled={acting === tx.id}>
                    {acting === tx.id ? '...' : 'Approve'}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => act(tx.id, 'deny')} disabled={acting === tx.id}>
                    Deny
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

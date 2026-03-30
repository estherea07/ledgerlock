'use client'
import React, { useState } from 'react'
import type { Transaction } from '@/types'
import Button from '@/components/ui/Button'

export default function CIBACard({ transaction, onDone }: { transaction: Transaction; onDone: (action: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const act = async (action: 'approve' | 'deny') => {
    setLoading(true)
    try {
      const res = await fetch('/api/transactions/ciba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: transaction.id, action }),
      })
      const data = await res.json()
      setResult(action)
      onDone(action)
    } finally {
      setLoading(false)
    }
  }

  const risks = JSON.parse(transaction.riskReasons || '[]') as string[]

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
      borderRadius: 14, padding: 22, color: '#fff',
    }}>
      <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
        🤖 Elf · Step-up Authentication Required (Auth0 CIBA)
      </div>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 500, marginBottom: 16 }}>
        High-risk action needs your approval
      </div>

      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
        {[
          ['Requested by', transaction.staff?.name || 'Staff member'],
          ['Amount', `\u20A6${transaction.amount.toLocaleString()}`],
          ['Vendor / Description', transaction.vendor || transaction.description],
          ['Risk level', transaction.riskLevel.toUpperCase()],
          ['Risk score', `${risks.length} signal${risks.length !== 1 ? 's' : ''} detected`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ opacity: 0.65 }}>{k}</span>
            <span style={{ fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </div>

      {risks.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>Elf's risk signals:</div>
          {risks.map((r, i) => (
            <div key={i} style={{ fontSize: 11.5, background: 'rgba(255,107,53,0.2)', borderRadius: 6, padding: '4px 10px', marginBottom: 4, color: '#FFD0B5' }}>
              ⚠ {r}
            </div>
          ))}
        </div>
      )}

      {result ? (
        <div style={{ padding: '10px 14px', background: result === 'approve' ? 'rgba(46,204,113,0.2)' : 'rgba(192,57,43,0.3)', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#fff' }}>
          {result === 'approve' ? '✓ Approved and logged by Elf' : '✗ Denied. Elf has blocked this transaction.'}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => act('approve')} disabled={loading} style={{
            flex: 1, padding: 11, borderRadius: 8, border: 'none', background: '#fff',
            color: '#1B4332', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            {loading ? '...' : '✓ Approve'}
          </button>
          <button onClick={() => act('deny')} disabled={loading} style={{
            flex: 1, padding: 11, borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 500, fontSize: 14,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            ✗ Deny
          </button>
        </div>
      )}
    </div>
  )
}

'use client'
import { useState } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import CIBACard from '@/components/payments/CIBACard'
import NewTransactionModal from '@/components/payments/NewTransactionModal'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card, { CardHeader } from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useTransactions } from '@/hooks/useTransactions'
import { useStaff } from '@/hooks/useStaff'
import type { Transaction } from '@/types'

const STATUS_TABS = ['all', 'pending', 'flagged', 'approved', 'blocked', 'denied']

function statusBadge(s: string): 'green' | 'red' | 'amber' | 'gray' {
  if (s === 'approved') return 'green'
  if (s === 'blocked' || s === 'denied') return 'red'
  if (s === 'flagged' || s === 'pending') return 'amber'
  return 'gray'
}

function riskBadge(r: string): 'green' | 'amber' | 'red' {
  if (r === 'low') return 'green'
  if (r === 'medium') return 'amber'
  return 'red'
}

function TxRow({ tx, onAction }: { tx: Transaction; onAction: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const risks = JSON.parse(tx.riskReasons || '[]') as string[]

  return (
    <>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px',
          borderBottom: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer',
          background: expanded ? '#FAFAF8' : 'transparent',
          transition: 'background 0.12s',
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: tx.status === 'approved' ? '#D8F3DC' : tx.status === 'blocked' ? '#FDECEA' : '#FFF7ED',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        }}>
          {tx.status === 'approved' ? '✓' : tx.status === 'blocked' ? '✗' : '!'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: '#1A1A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tx.vendor || tx.description}
          </div>
          <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>
            {tx.staff?.name || 'System'} · {tx.type} · {new Date(tx.createdAt).toLocaleString()}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <Badge variant={riskBadge(tx.riskLevel)}>Risk: {tx.riskLevel}</Badge>
          <Badge variant={statusBadge(tx.status)}>{tx.status}</Badge>
          <div style={{ fontSize: 14, fontWeight: 600, color: tx.type === 'incoming' ? '#1B4332' : '#C0392B', minWidth: 90, textAlign: 'right' }}>
            {tx.type === 'incoming' ? '+' : '-'}₦{tx.amount.toLocaleString()}
          </div>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '14px 18px 16px 68px', background: '#FAFAF8', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          {tx.cibaRequired && tx.cibaStatus === 'pending' && (
            <div style={{ marginBottom: 14 }}>
              <CIBACard transaction={tx} onDone={onAction} />
            </div>
          )}
          {risks.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B6B67', marginBottom: 6 }}>Elf Risk Signals</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {risks.map((r: string, i: number) => (
                  <div key={i} style={{ fontSize: 12.5, background: '#FFF7ED', color: '#C4520A', borderRadius: 6, padding: '5px 10px' }}>⚠ {r}</div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              ['Transaction ID', tx.id.slice(0, 16) + '...'],
              ['CIBA Required', tx.cibaRequired ? 'Yes' : 'No'],
              ['CIBA Status', tx.cibaStatus || 'N/A'],
              ['Approved By', tx.approvedBy ? 'Owner' : 'N/A'],
              ['Created', new Date(tx.createdAt).toLocaleString()],
              ['Last Updated', new Date(tx.updatedAt).toLocaleString()],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 12.5, color: '#1A1A18', fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default function PaymentsPage() {
  const [tab, setTab] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const { transactions, loading, refetch, submitTransaction } = useTransactions(tab === 'all' ? undefined : tab)
  const { staff } = useStaff()

  const pendingCIBA = transactions.filter(t => t.cibaRequired && t.cibaStatus === 'pending')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F5F0' }}>
      <Sidebar pendingCount={pendingCIBA.length} />
      <main style={{ flex: 1, padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 500, margin: 0, color: '#1A1A18' }}>Payments</h1>
            <p style={{ color: '#6B6B67', fontSize: 14, margin: '4px 0 0' }}>Elf reviews every request. Nothing moves without analysis.</p>
          </div>
          <Button variant="primary" onClick={() => setModalOpen(true)}>+ New Payment Request</Button>
        </div>

        {/* CIBA alerts */}
        {pendingCIBA.length > 0 && (
          <div style={{ background: '#FDECEA', border: '1px solid rgba(192,57,43,0.18)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#C0392B', marginBottom: 10 }}>
              ⚠️ {pendingCIBA.length} transaction{pendingCIBA.length > 1 ? 's' : ''} awaiting your CIBA approval
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingCIBA.map(tx => <CIBACard key={tx.id} transaction={tx} onDone={refetch} />)}
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Total', count: transactions.length, color: '#1A1A18' },
            { label: 'Approved', count: transactions.filter(t => t.status === 'approved').length, color: '#1B4332' },
            { label: 'Flagged', count: transactions.filter(t => t.status === 'flagged').length, color: '#C4520A' },
            { label: 'Blocked', count: transactions.filter(t => t.status === 'blocked').length, color: '#C0392B' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 500, color: s.color }}>{s.count}</div>
            </div>
          ))}
        </div>

        {/* Tab filter */}
        <Card>
          <div style={{ display: 'flex', gap: 4, padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)', overflowX: 'auto' }}>
            {STATUS_TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                background: tab === t ? '#1B4332' : 'transparent',
                color: tab === t ? '#fff' : '#6B6B67',
                transition: 'all 0.15s', textTransform: 'capitalize',
              }}>{t}</button>
            ))}
          </div>
          {loading ? (
            <LoadingSpinner message="fetching transactions..." />
          ) : transactions.length === 0 ? (
            <EmptyState icon="📭" title="No transactions yet" description="Submit a payment request and Elf will analyse it instantly." />
          ) : (
            <div>{transactions.map(tx => <TxRow key={tx.id} tx={tx} onAction={refetch} />)}</div>
          )}
        </Card>

      </main>
      <NewTransactionModal open={modalOpen} onClose={() => setModalOpen(false)} staff={staff} onSubmit={async (d) => { const r = await submitTransaction(d); setModalOpen(false); return r }} />
    </div>
  )
}

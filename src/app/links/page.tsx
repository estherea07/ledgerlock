'use client'
import { useState } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import GenerateLinkModal from '@/components/links/GenerateLinkModal'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card, { CardHeader } from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { usePaymentLinks } from '@/hooks/usePaymentLinks'
import { useStaff } from '@/hooks/useStaff'
import type { PaymentLink } from '@/types'

function linkStatusBadge(s: string): 'green' | 'red' | 'amber' | 'gray' {
  if (s === 'paid') return 'green'
  if (s === 'flagged' || s === 'expired') return 'red'
  return 'amber'
}

function LinkRow({ link }: { link: PaymentLink }) {
  const copy = () => { navigator.clipboard.writeText(link.url); alert('Link copied!') }
  const expired = new Date(link.expiresAt) < new Date()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: link.depositFound ? '#D8F3DC' : link.status === 'flagged' ? '#FDECEA' : '#FFF7ED',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
      }}>
        {link.depositFound ? '✓' : link.status === 'flagged' ? '⚠' : '🔗'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: '#1A1A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {link.service} — {link.staff?.name || 'Unknown staff'}
        </div>
        <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>
          Ref: {link.reference} · Created {new Date(link.createdAt).toLocaleDateString()}
          {expired && !link.paidAt ? ' · Expired' : ''}
          {link.paidAt ? ` · Paid ${new Date(link.paidAt).toLocaleString()}` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {!link.depositFound && link.status === 'pending' && (
          <span style={{ fontSize: 11, color: '#C4520A', background: '#FFF7ED', padding: '2px 8px', borderRadius: 6 }}>
            🔍 Elf monitoring
          </span>
        )}
        <Badge variant={linkStatusBadge(link.status)}>{link.status}</Badge>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1B4332', minWidth: 80, textAlign: 'right' }}>
          ₦{link.amount.toLocaleString()}
        </div>
        <Button variant="secondary" size="sm" onClick={copy}>Copy</Button>
      </div>
    </div>
  )
}

export default function LinksPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const { links, loading, generateLink } = usePaymentLinks()
  const { staff } = useStaff()

  const verified = links.filter(l => l.depositFound).length
  const pending = links.filter(l => !l.depositFound && l.status === 'pending').length
  const flagged = links.filter(l => l.status === 'flagged').length
  const totalRevenue = links.filter(l => l.depositFound).reduce((sum, l) => sum + l.amount, 0)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F5F0' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 500, margin: 0, color: '#1A1A18' }}>Payment Links</h1>
            <p style={{ color: '#6B6B67', fontSize: 14, margin: '4px 0 0' }}>
              Every link is locked to your company account via Auth0 Token Vault. Staff cannot redirect payments.
            </p>
          </div>
          <Button variant="primary" onClick={() => setModalOpen(true)}>+ Generate Verified Link</Button>
        </div>

        {/* How it works banner */}
        <div style={{ background: '#1B4332', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 28 }}>🔒</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 2 }}>How Elf protects payment links</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
              Destination account stored in Auth0 Token Vault. Staff generate links but cannot see or modify where money goes. Elf polls your bank feed and alerts you if a paid link has no matching deposit within 48hrs.
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Total Links', value: links.length, color: '#1A1A18' },
            { label: 'Verified Paid', value: verified, color: '#1B4332' },
            { label: 'Awaiting Deposit', value: pending, color: '#C4520A' },
            { label: 'Flagged', value: flagged, color: '#C0392B' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 500, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Links table */}
        <Card>
          <CardHeader title="All Payment Links" action={
            <span style={{ fontSize: 12, color: '#1B4332', fontWeight: 500 }}>
              ₦{totalRevenue.toLocaleString()} verified revenue
            </span>
          } />
          {loading ? (
            <LoadingSpinner message="loading payment links..." />
          ) : links.length === 0 ? (
            <EmptyState
              icon="🔗"
              title="No payment links yet"
              description="Generate your first verified payment link. Customers pay directly to your business account — staff never touch the destination."
              action={<Button variant="primary" onClick={() => setModalOpen(true)}>Generate First Link</Button>}
            />
          ) : (
            <div>{links.map(link => <LinkRow key={link.id} link={link} />)}</div>
          )}
        </Card>

      </main>
      <GenerateLinkModal open={modalOpen} onClose={() => setModalOpen(false)} staff={staff} onGenerate={generateLink} />
    </div>
  )
}

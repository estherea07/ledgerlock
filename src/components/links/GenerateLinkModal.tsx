'use client'
import React, { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import type { StaffMember } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  staff: StaffMember[]
  onGenerate: (data: any) => Promise<any>
}

export default function GenerateLinkModal({ open, onClose, staff, onGenerate }: Props) {
  const [amount, setAmount] = useState('')
  const [service, setService] = useState('')
  const [staffId, setStaffId] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const submit = async () => {
    if (!amount || !service || !staffId) return
    setLoading(true)
    try {
      const res = await onGenerate({ amount: parseFloat(amount), service, staffId, customerEmail })
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setAmount(''); setService(''); setStaffId(''); setCustomerEmail(''); setResult(null); onClose() }
  const copy = () => { navigator.clipboard.writeText(result?.paymentUrl || ''); alert('Link copied!') }

  return (
    <Modal open={open} onClose={reset} title="Generate Verified Payment Link" width={500}>
      {result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#D8F3DC', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔗</div>
            <div style={{ fontWeight: 500, fontSize: 14, color: '#1B4332', marginBottom: 4 }}>Verified Payment Link Generated</div>
            <div style={{ fontSize: 12, color: '#2D6A4F' }}>Locked to company account via Auth0 Token Vault · Expires in 48hrs</div>
          </div>
          <div style={{ background: '#F7F5F0', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#6B6B67', marginBottom: 4 }}>Payment URL (staff cannot modify destination)</div>
            <div style={{ fontSize: 12.5, color: '#1B4332', fontWeight: 500, wordBreak: 'break-all' }}>
              {result.paymentUrl || result.link?.url}
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#6B6B67', background: '#FFF7ED', borderRadius: 8, padding: '10px 12px' }}>
            🤖 Elf has locked the destination to your verified business account. Customer will receive WhatsApp confirmation after payment.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" onClick={copy} style={{ flex: 1 }}>Copy Link</Button>
            <Button variant="secondary" onClick={reset} style={{ flex: 1 }}>Generate Another</Button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#F7F5F0', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#6B6B67' }}>
            🔒 The destination account is locked via Auth0 Token Vault. Staff can share the link but cannot redirect it.
          </div>
          <Select label="Staff Member" value={staffId} onChange={setStaffId} required
            options={[{ value: '', label: 'Select staff generating this link...' }, ...staff.map(s => ({ value: s.id, label: `${s.name} (${s.role})` }))]}
          />
          <Input label="Amount (₦)" value={amount} onChange={setAmount} type="number" placeholder="e.g. 15000" required />
          <Input label="Service Description" value={service} onChange={setService} placeholder="e.g. Laundry - Premium" required />
          <Input label="Customer Email (optional)" value={customerEmail} onChange={setCustomerEmail} type="email" placeholder="customer@email.com" hint="For payment confirmation" />
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Button variant="secondary" onClick={reset} style={{ flex: 1 }}>Cancel</Button>
            <Button variant="primary" onClick={submit} disabled={loading || !amount || !service || !staffId} style={{ flex: 1 }}>
              {loading ? 'Generating...' : 'Generate Verified Link →'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

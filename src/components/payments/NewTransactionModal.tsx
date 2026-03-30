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
  onSubmit: (data: any) => Promise<any>
}

export default function NewTransactionModal({ open, onClose, staff, onSubmit }: Props) {
  const [amount, setAmount] = useState('')
  const [vendor, setVendor] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('outgoing')
  const [staffId, setStaffId] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!amount || !description) return
    setLoading(true)
    setError('')
    setLoadingMsg('Sending to Elf...')

    // Update loading message every 3 seconds so user knows it's working
    const msgs = ['Elf is analysing risk...', 'Checking policies...', 'Running anomaly detection...', 'Making decision...']
    let i = 0
    const interval = setInterval(() => {
      i++
      if (i < msgs.length) setLoadingMsg(msgs[i])
    }, 3000)

    try {
      const res = await onSubmit({
        amount: parseFloat(amount),
        vendor,
        description,
        type,
        staffId: staffId || undefined,
      })
      clearInterval(interval)
      setResult(res)
    } catch (e: any) {
      clearInterval(interval)
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setAmount(''); setVendor(''); setDescription('')
    setType('outgoing'); setStaffId(''); setResult(null); setError('')
    onClose()
  }

  const decisionColor = (d: string) => {
    if (d === 'approved') return { bg: '#D8F3DC', color: '#1B4332', icon: '✅' }
    if (d === 'blocked') return { bg: '#FDECEA', color: '#C0392B', icon: '🚫' }
    return { bg: '#FFF7ED', color: '#C4520A', icon: '⚠️' }
  }

  return (
    <Modal open={open} onClose={reset} title="Submit Payment Request to Elf">
      {result ? (
        <div>
          <div style={{
            padding: '16px', borderRadius: 10, marginBottom: 16, textAlign: 'center',
            background: decisionColor(result.elfDecision).bg,
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{decisionColor(result.elfDecision).icon}</div>
            <div style={{ fontWeight: 600, fontSize: 16, color: decisionColor(result.elfDecision).color, marginBottom: 4 }}>
              Elf Decision: {result.elfDecision?.toUpperCase()}
            </div>
            <div style={{ fontSize: 13, color: '#6B6B67', marginBottom: 4 }}>
              Risk Score: <strong>{result.riskScore}/100</strong>
            </div>
            {result.cibaRequired && (
              <div style={{ fontSize: 12, background: '#fff', borderRadius: 6, padding: '6px 10px', marginTop: 8, color: '#C4520A' }}>
                📲 CIBA approval request sent to business owner
              </div>
            )}
            {result.riskReasons?.length > 0 && (
              <div style={{ marginTop: 10, textAlign: 'left' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6B6B67', marginBottom: 4 }}>Risk signals detected:</div>
                {result.riskReasons.map((r: string, i: number) => (
                  <div key={i} style={{ fontSize: 11.5, background: 'rgba(0,0,0,0.04)', borderRadius: 5, padding: '4px 8px', marginBottom: 3 }}>⚠ {r}</div>
                ))}
              </div>
            )}
          </div>
          <Button variant="secondary" onClick={reset} style={{ width: '100%' }}>Close</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Explainer */}
          <div style={{ background: '#F0FDF4', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1B4332', lineHeight: 1.6 }}>
            🤖 <strong>Elf reviews every payment</strong> against your policies before any money moves.
            High-risk transactions are flagged for your CIBA approval. Low-risk ones are auto-approved.
          </div>

          <Select
            label="Payment Type"
            value={type}
            onChange={setType}
            options={[
              { value: 'outgoing', label: '💸 Outgoing — paying a vendor or expense' },
              { value: 'incoming', label: '💰 Incoming — recording a received payment' },
            ]}
          />

          <Input label="Amount (₦)" value={amount} onChange={setAmount} type="number" placeholder="e.g. 45000" required />

          <Input
            label={type === 'outgoing' ? 'Vendor / Recipient' : 'Payment Source'}
            value={vendor}
            onChange={setVendor}
            placeholder={type === 'outgoing' ? 'e.g. EKEDC Utility, Dangote Cement' : 'e.g. Customer John Doe'}
          />

          <Input
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder={type === 'outgoing' ? 'e.g. Monthly electricity bill' : 'e.g. Service payment for laundry'}
            required
          />

          <Select
            label="Staff Member Initiating"
            value={staffId}
            onChange={setStaffId}
            options={[
              { value: '', label: 'Select staff member...' },
              ...staff.map(s => ({ value: s.id, label: `${s.name} (${s.role}) — Risk: ${s.riskScore}` })),
            ]}
          />

          {error && (
            <div style={{ background: '#FDECEA', color: '#C0392B', borderRadius: 8, padding: '8px 12px', fontSize: 12.5 }}>
              ❌ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Button variant="secondary" onClick={reset} style={{ flex: 1 }} disabled={loading}>Cancel</Button>
            <Button
              variant="primary"
              onClick={submit}
              disabled={loading || !amount || !description}
              style={{ flex: 1 }}
            >
              {loading ? loadingMsg : 'Submit to Elf →'}
            </Button>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF' }}>
              Elf is powered by Claude AI — analysis takes 5–15 seconds
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

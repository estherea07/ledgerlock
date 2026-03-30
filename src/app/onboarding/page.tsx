'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const STEPS = ['Welcome', 'Business Info', 'First Policy', 'Connect Bank', 'Done']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [bizName, setBizName] = useState('')
  const [phone, setPhone] = useState('')
  const [dailyLimit, setDailyLimit] = useState('100000')
  const [saving, setSaving] = useState(false)

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1))

  const saveAndFinish = async () => {
    setSaving(true)
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bizName, phone, dailyLimit: parseFloat(dailyLimit) }),
    })
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '40px 48px', maxWidth: 540, width: '100%', border: '1px solid rgba(0,0,0,0.07)' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, background: '#1B4332', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16 }}>🔒</div>
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 500, color: '#1A1A18' }}>LedgerLock</span>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? '#1B4332' : '#E5E7EB', transition: 'background 0.3s' }} />
          ))}
        </div>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 500, margin: '0 0 10px', color: '#1A1A18' }}>Welcome to LedgerLock</h2>
            <p style={{ fontSize: 14, color: '#6B6B67', lineHeight: 1.7, marginBottom: 24 }}>
              AI-powered guardrails for your business finances. Your money moves only when you say so.
              <br /><br />
              We'll introduce you to <strong>Elf</strong>, your AI agent — who will monitor every transaction, verify every payment link, and alert you before anything suspicious moves.
            </p>
            <Button variant="primary" size="lg" onClick={next} style={{ width: '100%' }}>Let's set up Elf →</Button>
          </div>
        )}

        {/* Step 1 — Business Info */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 500, margin: '0 0 6px', color: '#1A1A18' }}>About your business</h2>
              <p style={{ fontSize: 13, color: '#6B6B67', margin: 0 }}>Elf needs to know who to protect.</p>
            </div>
            <Input label="Business Name" value={bizName} onChange={setBizName} placeholder="e.g. Greenfield Laundry Ltd" required />
            <Input label="Your Phone Number" value={phone} onChange={setPhone} type="tel" placeholder="+234 801 234 5678" hint="For CIBA push notifications when Elf flags a transaction" required />
            <Button variant="primary" onClick={next} disabled={!bizName || !phone} style={{ width: '100%', marginTop: 8 }}>Continue →</Button>
          </div>
        )}

        {/* Step 2 — Policy */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 500, margin: '0 0 6px', color: '#1A1A18' }}>Set your first guardrail</h2>
              <p style={{ fontSize: 13, color: '#6B6B67', margin: 0 }}>Elf will flag any transaction that exceeds this limit for your approval.</p>
            </div>
            <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: '#1B4332', marginBottom: 8, fontWeight: 500 }}>Daily spending limit</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'Fraunces, serif', fontSize: 20, color: '#1B4332' }}>₦</span>
                <input
                  type="number"
                  value={dailyLimit}
                  onChange={e => setDailyLimit(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', border: '1px solid rgba(27,67,50,0.2)', borderRadius: 8, fontSize: 18, fontFamily: 'Fraunces, serif', fontWeight: 500, color: '#1B4332', outline: 'none' }}
                />
              </div>
              <div style={{ fontSize: 11.5, color: '#2D6A4F', marginTop: 6 }}>Any single payment above this amount requires your tap-to-approve via CIBA</div>
            </div>
            <div style={{ background: '#F7F5F0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#6B6B67' }}>
              You can add more policies (vendor whitelist, time restrictions, payroll rules) from the dashboard after setup.
            </div>
            <Button variant="primary" onClick={next} style={{ width: '100%', marginTop: 8 }}>Set This Guardrail →</Button>
          </div>
        )}

        {/* Step 3 — Connect Bank */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 500, margin: '0 0 6px', color: '#1A1A18' }}>Connect your bank</h2>
              <p style={{ fontSize: 13, color: '#6B6B67', margin: 0 }}>Elf uses Auth0 Token Vault to verify deposits. Your credentials never touch our database.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['GTBank', 'Access Bank', 'Zenith Bank', 'UBA', 'First Bank'].map(bank => (
                <button key={bank} onClick={() => router.push('/vault')} style={{
                  padding: '12px 16px', background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10,
                  fontSize: 13.5, fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', gap: 10, color: '#1A1A18',
                }}>
                  🏦 {bank}
                </button>
              ))}
            </div>
            <Button variant="ghost" onClick={next} style={{ width: '100%' }}>Skip for now (connect later)</Button>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 500, margin: '0 0 10px', color: '#1A1A18' }}>Elf is on duty</h2>
            <p style={{ fontSize: 14, color: '#6B6B67', lineHeight: 1.7, marginBottom: 24 }}>
              Your business finances are now protected. Elf will monitor every transaction, verify every payment link, and alert you before anything suspicious moves.
            </p>
            <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '16px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1B4332', marginBottom: 8 }}>What happens next:</div>
              {[
                'Add your staff members so Elf knows who to watch',
                'Generate your first verified payment link',
                'Set up vendor whitelist in Policies',
                'Connect Paystack or Flutterwave for full deposit verification',
              ].map((t, i) => (
                <div key={i} style={{ fontSize: 12.5, color: '#2D6A4F', marginBottom: 4 }}>→ {t}</div>
              ))}
            </div>
            <Button variant="primary" size="lg" onClick={saveAndFinish} disabled={saving} style={{ width: '100%' }}>
              {saving ? 'Setting up...' : 'Open Dashboard →'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

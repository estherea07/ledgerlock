'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import Button from '@/components/ui/Button'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { VaultToken } from '@/types'

const PROVIDERS = [
  { value: 'gtbank', label: 'GTBank', icon: '🏦', category: 'Bank' },
  { value: 'access', label: 'Access Bank', icon: '🏦', category: 'Bank' },
  { value: 'zenith', label: 'Zenith Bank', icon: '🏦', category: 'Bank' },
  { value: 'uba', label: 'UBA', icon: '🏦', category: 'Bank' },
  { value: 'paystack', label: 'Paystack', icon: '💳', category: 'Payment Gateway' },
  { value: 'flutterwave', label: 'Flutterwave', icon: '💳', category: 'Payment Gateway' },
  { value: 'quickbooks', label: 'QuickBooks', icon: '📊', category: 'Accounting' },
  { value: 'xero', label: 'Xero', icon: '📊', category: 'Accounting' },
  { value: 'twilio', label: 'Twilio (WhatsApp/SMS)', icon: '📱', category: 'Notifications' },
]

const SCOPE_PRESETS: Record<string, string[]> = {
  gtbank: ['read_transactions', 'verify_deposits'],
  access: ['read_transactions', 'verify_deposits'],
  zenith: ['read_transactions', 'verify_deposits'],
  uba: ['read_transactions', 'verify_deposits'],
  paystack: ['create_payment_link', 'read_charges', 'verify_payment'],
  flutterwave: ['create_payment_link', 'read_transactions'],
  quickbooks: ['read_accounts', 'read_transactions'],
  xero: ['read_accounts', 'read_transactions'],
  twilio: ['send_message'],
}

export default function VaultPage() {
  const [tokens, setTokens] = useState<VaultToken[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [provider, setProvider] = useState('gtbank')
  const [displayName, setDisplayName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = async () => {
    const res = await fetch('/api/vault')
    const json = await res.json()
    setTokens(json.tokens || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const addToken = async () => {
    if (!displayName || !apiKey) return
    setSaving(true)
    const scopes = SCOPE_PRESETS[provider] || ['read']
    await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, displayName, scopes, token: apiKey }),
    })
    setSaved(true)
    setTimeout(() => { setSaved(false); setModalOpen(false); setDisplayName(''); setApiKey(''); load() }, 1500)
    setSaving(false)
  }

  const selectedProvider = PROVIDERS.find(p => p.value === provider)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F5F0' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 500, margin: 0, color: '#1A1A18' }}>Token Vault</h1>
            <p style={{ color: '#6B6B67', fontSize: 14, margin: '4px 0 0' }}>
              Powered by Auth0 for AI Agents. Elf never sees raw credentials — only scoped, delegated access.
            </p>
          </div>
          <Button variant="primary" onClick={() => setModalOpen(true)}>+ Connect Service</Button>
        </div>

        {/* Auth0 explanation */}
        <div style={{ background: '#1B4332', borderRadius: 12, padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          {[
            { icon: '🔑', title: 'Token Vault', desc: 'All API keys and bank tokens stored encrypted in Auth0 Token Vault. Zero-knowledge for your staff.' },
            { icon: '🤖', title: 'Delegated Access', desc: 'Elf operates through scoped OAuth tokens. It can only do what you explicitly allow — nothing more.' },
            { icon: '📲', title: 'CIBA Step-up', desc: 'High-risk operations trigger Auth0 CIBA push to your phone. One tap to approve or deny.' },
          ].map(item => (
            <div key={item.title}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Tokens list */}
        {loading ? <LoadingSpinner message="loading vault..." /> : (
          <Card>
            <CardHeader title={`Connected Services (${tokens.length})`} />
            {tokens.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
                <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 6 }}>Vault is empty</div>
                <div style={{ fontSize: 13, color: '#6B6B67', marginBottom: 16 }}>Connect your bank and payment services. Elf will use these tokens to verify transactions and deposits.</div>
                <Button variant="primary" onClick={() => setModalOpen(true)}>Connect First Service</Button>
              </div>
            ) : (
              <div>
                {tokens.map((token, i) => {
                  const p = PROVIDERS.find(p => p.value === token.provider)
                  const scopes = JSON.parse(token.scopes || '[]') as string[]
                  return (
                    <div key={token.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < tokens.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                      <div style={{ width: 42, height: 42, background: '#F7F5F0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                        {p?.icon || '🔌'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: '#1A1A18', marginBottom: 2 }}>{token.displayName}</div>
                        <div style={{ fontSize: 11.5, color: '#9CA3AF', marginBottom: 4 }}>
                          {p?.category || 'Service'} · Token ref: {token.tokenRef.slice(0, 24)}...
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {scopes.map((s: string) => (
                            <span key={s} style={{ fontSize: 10, background: '#F0FDF4', color: '#1B4332', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <Badge variant={token.isActive ? 'green' : 'red'}>{token.isActive ? 'Active' : 'Inactive'}</Badge>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>Added {new Date(token.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )}

        {/* Security notice */}
        <div style={{ background: '#F0FDF4', border: '1px solid rgba(27,67,50,0.15)', borderRadius: 10, padding: '14px 18px', fontSize: 12.5, color: '#1B4332', lineHeight: 1.6 }}>
          🔒 <strong>Security note:</strong> Raw API keys and tokens are never stored in LedgerLock's database. They are sent directly to Auth0 Token Vault via the Management API and only a non-sensitive reference ID is stored. Elf uses this reference to make API calls on your behalf without ever seeing the key itself.
        </div>

      </main>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Connect Service to Token Vault" width={500}>
        {saved ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 500, fontSize: 15, color: '#1B4332' }}>Token stored in Auth0 Vault</div>
            <div style={{ fontSize: 12.5, color: '#6B6B67', marginTop: 4 }}>Elf can now use this service. Raw key discarded from memory.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#F0FDF4', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1B4332' }}>
              🔒 Your API key is sent directly to Auth0 Token Vault. LedgerLock never stores the raw key — only a reference ID.
            </div>
            <Select
              label="Service" value={provider} onChange={(v) => { setProvider(v); setDisplayName(PROVIDERS.find(p => p.value === v)?.label || '') }}
              options={PROVIDERS.map(p => ({ value: p.value, label: `${p.icon} ${p.label} (${p.category})` }))}
            />
            <Input label="Display Name" value={displayName} onChange={setDisplayName} placeholder="e.g. GTBank Business Account" required />
            <Input label="API Key / Secret Token" value={apiKey} onChange={setApiKey} type="password" placeholder="Paste your key here — never stored directly" required />
            <div style={{ background: '#F7F5F0', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: '#6B6B67', marginBottom: 4 }}>Scopes Elf will have for this service:</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(SCOPE_PRESETS[provider] || []).map(s => (
                  <span key={s} style={{ fontSize: 11, background: '#D8F3DC', color: '#1B4332', padding: '2px 8px', borderRadius: 20 }}>{s}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <Button variant="secondary" onClick={() => setModalOpen(false)} style={{ flex: 1 }}>Cancel</Button>
              <Button variant="primary" onClick={addToken} disabled={saving || !displayName || !apiKey} style={{ flex: 1 }}>
                {saving ? 'Storing in Vault...' : 'Store in Auth0 Vault →'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

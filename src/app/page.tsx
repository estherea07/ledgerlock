import Link from 'next/link'
import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await getSession()
  if (session?.user) redirect('/dashboard')

  return (
    <main style={{
      minHeight: '100vh',
      background: '#F7F5F0',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Navigation */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px', borderBottom: '1px solid rgba(0,0,0,0.06)',
        background: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: '#1B4332', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 16,
          }}>🔒</div>
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 500, color: '#1A1A18' }}>
            LedgerLock
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/api/auth/login" style={{
            padding: '8px 20px', background: '#1B4332', color: '#fff',
            borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500,
          }}>Get Started</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#D8F3DC', color: '#1B4332', borderRadius: 20,
          padding: '6px 16px', fontSize: 13, fontWeight: 500, marginBottom: 24,
        }}>
          🤖 Powered by Elf AI Agent + Auth0 Token Vault
        </div>

        <h1 style={{
          fontFamily: 'Fraunces, serif', fontSize: 52, fontWeight: 500,
          color: '#1A1A18', lineHeight: 1.15, margin: '0 0 20px',
        }}>
          AI-powered guardrails<br />for your business finances.
        </h1>

        <p style={{ fontSize: 20, color: '#6B6B67', lineHeight: 1.6, marginBottom: 8 }}>
          Your money moves only when you say so.
        </p>

        <p style={{ fontSize: 16, color: '#888', lineHeight: 1.7, maxWidth: 600, margin: '0 auto 40px' }}>
          Elf, your AI agent, monitors every transaction in and out of your business.
          Powered by Auth0 Token Vault so your credentials stay locked — not even your staff can see them.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/api/auth/login" style={{
            padding: '14px 32px', background: '#1B4332', color: '#fff',
            borderRadius: 10, textDecoration: 'none', fontSize: 15, fontWeight: 500,
          }}>
            Protect My Business →
          </a>
          <a href="#how" style={{
            padding: '14px 32px', background: '#fff', color: '#1A1A18',
            border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10,
            textDecoration: 'none', fontSize: 15,
          }}>
            See How It Works
          </a>
        </div>
      </section>

      {/* Social Proof */}
      <section style={{ background: '#fff', padding: '40px 48px', borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {[
            { value: '₦2.9B', label: 'Lost to staff fraud by Nigerian SMEs annually' },
            { value: '39M+', label: 'SMEs in Nigeria alone that need this protection' },
            { value: '14 sec', label: 'Time for Elf to analyze and decide on a transaction' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 500, color: '#1B4332' }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: '#6B6B67', marginTop: 4, lineHeight: 1.5 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="how" style={{ maxWidth: 960, margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 500, textAlign: 'center', marginBottom: 48 }}>
          How Elf protects your money
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {[
            {
              icon: '🔗',
              title: 'Verified Payment Links',
              desc: 'Every customer payment uses a link locked to your account via Token Vault. Staff can never redirect customers to their personal accounts.',
            },
            {
              icon: '⚡',
              title: 'Real-time Transaction Guardian',
              desc: 'Elf reviews every outgoing payment against your policies. Suspicious requests get blocked or sent to you for CIBA step-up approval.',
            },
            {
              icon: '📱',
              title: 'One-tap CIBA Approval',
              desc: 'High-risk transactions trigger a push to your phone via Auth0\'s async CIBA flow. Approve or deny with one tap — no login required.',
            },
            {
              icon: '📊',
              title: 'Staff Risk Scoring',
              desc: 'Elf tracks each employee\'s payment behaviour. Repeated flags raise their risk score so you know who to watch before it\'s too late.',
            },
          ].map((f) => (
            <div key={f.title} style={{
              background: '#fff', borderRadius: 12, padding: '24px',
              border: '1px solid rgba(0,0,0,0.07)',
            }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 500, fontSize: 16, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: '#6B6B67', lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: '#1B4332', margin: '0 48px 80px', borderRadius: 20,
        padding: '60px 48px', textAlign: 'center', maxWidth: 900, marginLeft: 'auto', marginRight: 'auto',
      }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 36, color: '#fff', fontWeight: 500, marginBottom: 16 }}>
          Ready to lock your ledger?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 32 }}>
          Free to start. Elf gets smarter every day.
        </p>
        <a href="/api/auth/login" style={{
          padding: '14px 36px', background: '#fff', color: '#1B4332',
          borderRadius: 10, textDecoration: 'none', fontSize: 15, fontWeight: 600,
        }}>
          Start Protecting Now →
        </a>
      </section>

      <footer style={{ textAlign: 'center', padding: '24px', color: '#999', fontSize: 13 }}>
        © 2026 LedgerLock · Built with Auth0 Token Vault + Elf AI Agent
      </footer>
    </main>
  )
}

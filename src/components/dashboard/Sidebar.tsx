'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈', key: 'dashboard' },
  { href: '/payments', label: 'Payments', icon: '⟳', key: 'payments', badge: true },
  { href: '/links', label: 'Payment Links', icon: '⊕', key: 'links' },
  { href: '/staff', label: 'Staff', icon: '◎', key: 'staff' },
  { href: '/vault', label: 'Token Vault', icon: '◆', key: 'vault' },
  { href: '/audit', label: 'Audit Log', icon: '≡', key: 'audit' },
]

export default function Sidebar({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 220, background: '#1B4332', padding: '24px 14px',
      display: 'flex', flexDirection: 'column', gap: 2,
      flexShrink: 0, minHeight: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 12 }}>
        <div style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔒</div>
        <span style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 500, color: '#fff' }}>LedgerLock</span>
      </div>

      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', padding: '0 8px', marginBottom: 4 }}>Main</div>

      {NAV.slice(0, 4).map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link key={item.key} href={item.href} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 8, textDecoration: 'none',
            fontSize: 13.5, color: active ? '#fff' : 'rgba(255,255,255,0.6)',
            background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
            fontWeight: active ? 500 : 400, transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
            {item.badge && pendingCount > 0 && (
              <span style={{ marginLeft: 'auto', background: '#FF6B35', color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 20 }}>
                {pendingCount}
              </span>
            )}
          </Link>
        )
      })}

      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', padding: '12px 8px 4px', marginTop: 4 }}>Security</div>

      {NAV.slice(4).map(item => {
        const active = pathname === item.href
        return (
          <Link key={item.key} href={item.href} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 8, textDecoration: 'none',
            fontSize: 13.5, color: active ? '#fff' : 'rgba(255,255,255,0.6)',
            background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
            fontWeight: active ? 500 : 400, transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
          </Link>
        )
      })}

      {/* Elf Status */}
      <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 28, height: 28, background: '#4A3728', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff' }}>E</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>Elf Agent</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, background: '#2ECC71', borderRadius: '50%', display: 'inline-block' }}></span>
              Monitoring
            </div>
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
          "Your money is safe. I'm watching."
        </p>
        <a href="/api/auth/logout" style={{ display: 'block', marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', textAlign: 'center' }}>
          Sign out
        </a>
      </div>
    </aside>
  )
}

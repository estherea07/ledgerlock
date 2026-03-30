import React from 'react'
import type { StaffMember } from '@/types'
import Card, { CardHeader } from '@/components/ui/Card'

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function riskColor(score: number) {
  if (score >= 70) return '#C0392B'
  if (score >= 40) return '#F59E0B'
  return '#2ECC71'
}

function avatarBg(score: number) {
  if (score >= 70) return '#C0392B'
  if (score >= 40) return '#B7791F'
  return '#1B4332'
}

export default function StaffRisk({ staff }: { staff: StaffMember[] }) {
  return (
    <Card>
      <CardHeader title="Staff Risk Overview" action={<a href="/staff" style={{ color: '#1B4332', textDecoration: 'none', fontWeight: 500 }}>View all →</a>} />
      {staff.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No staff added yet.</div>
      ) : (
        <div>
          {staff.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < staff.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
              <div style={{ width: 36, height: 36, background: avatarBg(s.riskScore), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                {initials(s.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A18' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{s.role} · {s.flagCount} flag{s.flagCount !== 1 ? 's' : ''}</div>
                <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.riskScore}%`, background: riskColor(s.riskScore), borderRadius: 2, transition: 'width 0.4s' }} />
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: riskColor(s.riskScore), flexShrink: 0 }}>{s.riskScore}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

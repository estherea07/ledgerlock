'use client'
import { useState } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import AddStaffModal from '@/components/staff/AddStaffModal'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card, { CardHeader } from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useStaff } from '@/hooks/useStaff'
import type { StaffMember } from '@/types'

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
function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}
function riskLabel(score: number): { label: string; variant: 'green' | 'amber' | 'red' } {
  if (score >= 70) return { label: 'High Risk', variant: 'red' }
  if (score >= 40) return { label: 'Watch', variant: 'amber' }
  return { label: 'Safe', variant: 'green' }
}

function StaffCard({ member, onSuspend }: { member: StaffMember; onSuspend: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const rl = riskLabel(member.riskScore)

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden' }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
      >
        <div style={{ width: 44, height: 44, background: avatarBg(member.riskScore), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
          {initials(member.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#1A1A18' }}>{member.name}</span>
            {!member.isActive && <Badge variant="red">Suspended</Badge>}
            <Badge variant={rl.variant}>{rl.label}</Badge>
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>{member.role} · {member.flagCount} flag{member.flagCount !== 1 ? 's' : ''} · {member._count?.transactions || 0} transactions</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>Risk Score</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: riskColor(member.riskScore), fontFamily: 'Fraunces, serif' }}>{member.riskScore}</div>
          </div>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Risk bar */}
      <div style={{ padding: '0 18px 14px' }}>
        <div style={{ height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${member.riskScore}%`, background: riskColor(member.riskScore), borderRadius: 3, transition: 'width 0.5s' }} />
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '16px 18px', background: '#FAFAF8' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
            {[
              ['Email', member.email],
              ['Role', member.role],
              ['Status', member.isActive ? 'Active' : 'Suspended'],
              ['Risk Score', `${member.riskScore}/100`],
              ['Total Flags', String(member.flagCount)],
              ['Joined', new Date(member.createdAt).toLocaleDateString()],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 13, color: '#1A1A18', fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
          {member.riskScore >= 60 && member.isActive && (
            <div style={{ background: '#FDECEA', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12.5, color: '#9B1C1C' }}>
              ⚠️ Elf has flagged this staff member multiple times. Consider reviewing their recent activity or suspending access.
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/audit" style={{ padding: '7px 14px', background: '#fff', color: '#1A1A18', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, fontSize: 12.5, textDecoration: 'none', fontWeight: 500 }}>
              View Activity
            </a>
            {member.isActive && member.riskScore >= 60 && (
              <Button variant="danger" size="sm" onClick={() => {
                if (confirm(`Suspend ${member.name}? They will lose all payment access.`)) onSuspend(member.id)
              }}>
                Suspend Access
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function StaffPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const { staff, loading, addStaff, suspendStaff } = useStaff()

  const atRisk = staff.filter(s => s.riskScore >= 60).length
  const suspended = staff.filter(s => !s.isActive).length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F5F0' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 500, margin: 0, color: '#1A1A18' }}>Staff</h1>
            <p style={{ color: '#6B6B67', fontSize: 14, margin: '4px 0 0' }}>Elf monitors every staff member's payment behaviour in real time.</p>
          </div>
          <Button variant="primary" onClick={() => setModalOpen(true)}>+ Add Staff Member</Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Total Staff', value: staff.length, color: '#1A1A18' },
            { label: 'Active', value: staff.filter(s => s.isActive).length, color: '#1B4332' },
            { label: 'At Risk', value: atRisk, color: '#C4520A' },
            { label: 'Suspended', value: suspended, color: '#C0392B' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 500, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {atRisk > 0 && (
          <div style={{ background: '#FFF7ED', border: '1px solid rgba(196,82,10,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C4520A' }}>
            ⚠️ Elf has flagged <strong>{atRisk} staff member{atRisk > 1 ? 's' : ''}</strong> with a risk score above 60. Review their activity below.
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="loading staff..." />
        ) : staff.length === 0 ? (
          <Card>
            <EmptyState
              icon="👥"
              title="No staff added yet"
              description="Add your first staff member and Elf will begin monitoring their payment activity automatically."
              action={<Button variant="primary" onClick={() => setModalOpen(true)}>Add First Staff Member</Button>}
            />
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {staff.map(s => <StaffCard key={s.id} member={s} onSuspend={suspendStaff} />)}
          </div>
        )}

      </main>
      <AddStaffModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={addStaff} />
    </div>
  )
}

'use client'
import React, { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

const ROLES = ['Manager', 'Cashier', 'Sales Rep', 'Accountant', 'Driver', 'Other'].map(r => ({ value: r, label: r }))

export default function AddStaffModal({ open, onClose, onAdd }: {
  open: boolean; onClose: () => void; onAdd: (d: any) => Promise<any>
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Cashier')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!name || !email) return
    setLoading(true)
    try { await onAdd({ name, email, role }); onClose(); setName(''); setEmail('') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Staff Member">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: '#F7F5F0', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#6B6B67' }}>
          🤖 Elf will begin monitoring this staff member's payment activity immediately after they're added.
        </div>
        <Input label="Full Name" value={name} onChange={setName} placeholder="e.g. Amaka Obi" required />
        <Input label="Email" value={email} onChange={setEmail} type="email" placeholder="amaka@business.com" required />
        <Select label="Role" value={role} onChange={setRole} options={ROLES} />
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={loading || !name || !email} style={{ flex: 1 }}>
            {loading ? 'Adding...' : 'Add Staff'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

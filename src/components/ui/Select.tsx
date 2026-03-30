import React from 'react'

export default function Select({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; required?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, color: '#6B6B67', fontWeight: 500 }}>
        {label}{required && <span style={{ color: '#C0392B' }}> *</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)} required={required}
        style={{ padding: '9px 12px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: '#1A1A18', background: '#fff', outline: 'none', cursor: 'pointer' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

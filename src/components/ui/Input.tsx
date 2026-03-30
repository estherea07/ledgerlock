import React from 'react'

interface InputProps {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; hint?: string
}

export default function Input({ label, value, onChange, type = 'text', placeholder, required, hint }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, color: '#6B6B67', fontWeight: 500 }}>
        {label}{required && <span style={{ color: '#C0392B' }}> *</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        style={{ padding: '9px 12px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: '#1A1A18', background: '#fff', outline: 'none', width: '100%' }}
      />
      {hint && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{hint}</span>}
    </div>
  )
}

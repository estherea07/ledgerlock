import React from 'react'

export default function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 16 }}>
      <div style={{ fontSize: 36 }}>🤖</div>
      <div style={{ color: '#6B6B67', fontSize: 14 }}>Elf is {message}</div>
    </div>
  )
}

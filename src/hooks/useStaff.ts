import { useState, useEffect, useCallback } from 'react'
import type { StaffMember } from '@/types'

export function useStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/staff')
    const json = await res.json()
    setStaff(json.staff || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const addStaff = async (data: { name: string; email: string; role: string }) => {
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    await fetch_()
    return json
  }

  const suspendStaff = async (staffId: string) => {
    const res = await fetch('/api/staff/suspend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId }),
    })
    await fetch_()
    return res.json()
  }

  return { staff, loading, refetch: fetch_, addStaff, suspendStaff }
}

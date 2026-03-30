import { useState, useEffect, useCallback } from 'react'
import type { PaymentLink } from '@/types'

export function usePaymentLinks() {
  const [links, setLinks] = useState<PaymentLink[]>([])
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/links')
    const json = await res.json()
    setLinks(json.links || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const generateLink = async (data: {
    amount: number
    service: string
    staffId: string
    customerEmail?: string
  }) => {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    await fetch_()
    return json
  }

  return { links, loading, refetch: fetch_, generateLink }
}

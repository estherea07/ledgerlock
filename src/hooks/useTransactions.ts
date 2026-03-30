import { useState, useEffect, useCallback } from 'react'
import type { Transaction } from '@/types'

export function useTransactions(status?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const url = status ? `/api/transactions?status=${status}` : '/api/transactions'
    const res = await fetch(url)
    const json = await res.json()
    setTransactions(json.transactions || [])
    setLoading(false)
  }, [status])

  useEffect(() => { fetch_() }, [fetch_])

  const submitTransaction = async (data: {
    amount: number
    vendor?: string
    description: string
    type: 'incoming' | 'outgoing'
    staffId?: string
  }) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    await fetch_()
    return json
  }

  const actOnCIBA = async (transactionId: string, action: 'approve' | 'deny') => {
    const res = await fetch('/api/transactions/ciba', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, action }),
    })
    const json = await res.json()
    await fetch_()
    return json
  }

  return { transactions, loading, refetch: fetch_, submitTransaction, actOnCIBA }
}

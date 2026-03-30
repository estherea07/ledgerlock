'use client'
import { useDashboard } from '@/hooks/useDashboard'
import Sidebar from '@/components/dashboard/Sidebar'
import MetricsRow from '@/components/dashboard/MetricsRow'
import AlertsPanel from '@/components/dashboard/AlertsPanel'
import TransactionList from '@/components/dashboard/TransactionList'
import StaffRisk from '@/components/dashboard/StaffRisk'
import ElfInsight from '@/components/dashboard/ElfInsight'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function DashboardPage() {
  const { data, loading, refetch } = useDashboard()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F5F0' }}>
      <Sidebar pendingCount={data?.pendingCIBA?.length || 0} />
      <main style={{ flex: 1, padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 500, margin: 0, color: '#1A1A18' }}>
              Good morning 👋
            </h1>
            <p style={{ color: '#6B6B67', fontSize: 14, margin: '4px 0 0' }}>
              {loading ? 'Loading your business data...' : `Elf has been watching ${data?.business?.name || 'your business'}. Here's today's summary.`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <a href="/payments" style={{ padding: '8px 16px', background: '#1B4332', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
              + New Payment
            </a>
          </div>
        </div>

        {loading ? <LoadingSpinner message="loading your dashboard..." /> : (
          <>
            <MetricsRow metrics={data?.metrics} />
            {(data?.pendingCIBA?.length || 0) > 0 && (
              <AlertsPanel pendingItems={data!.pendingCIBA} onAction={refetch} />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <TransactionList transactions={data?.recentTransactions || []} />
              <StaffRisk staff={data?.staffOverview || []} />
            </div>
            <ElfInsight logs={data?.recentAuditLogs || []} />
          </>
        )}
      </main>
    </div>
  )
}

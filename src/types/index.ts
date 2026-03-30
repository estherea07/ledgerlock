// ─── Core Domain Types ───────────────────────────────────────────────────────

export interface Business {
  id: string
  name: string
  ownerId: string
  ownerEmail: string
  ownerPhone?: string
  createdAt: string
  updatedAt: string
}

export interface StaffMember {
  id: string
  businessId: string
  name: string
  email: string
  role: string
  riskScore: number
  flagCount: number
  isActive: boolean
  auth0UserId?: string
  createdAt: string
  updatedAt: string
  _count?: { transactions: number; paymentLinks: number }
}

export interface Transaction {
  id: string
  businessId: string
  staffId?: string
  paymentLinkId?: string
  type: 'incoming' | 'outgoing'
  amount: number
  currency: string
  vendor?: string
  description: string
  status: 'pending' | 'approved' | 'denied' | 'blocked' | 'flagged'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskReasons: string
  cibaRequired: boolean
  cibaStatus?: 'pending' | 'approved' | 'denied'
  cibaRequestId?: string
  approvedBy?: string
  createdAt: string
  updatedAt: string
  staff?: StaffMember
  paymentLink?: PaymentLink
}

export interface PaymentLink {
  id: string
  businessId: string
  staffId: string
  amount: number
  currency: string
  service: string
  reference: string
  url: string
  status: 'pending' | 'paid' | 'expired' | 'flagged'
  expiresAt: string
  paidAt?: string
  depositFound: boolean
  createdAt: string
  staff?: StaffMember
}

export interface Policy {
  id: string
  businessId: string
  name: string
  type: 'spending_limit' | 'vendor_whitelist' | 'payroll' | 'time_restriction'
  value: string
  isActive: boolean
  createdAt: string
}

export interface VaultToken {
  id: string
  businessId: string
  provider: string
  displayName: string
  scopes: string
  tokenRef: string
  isActive: boolean
  createdAt: string
}

export interface AuditLog {
  id: string
  businessId: string
  staffId?: string
  action: string
  entity: string
  entityId?: string
  description: string
  metadata: string
  performedBy: string
  auth0LogId?: string
  createdAt: string
  staff?: StaffMember
}

export interface DashboardMetrics {
  revenueProtected: number
  threatsBlocked: number
  linksIssued: number
  staffAtRisk: number
}

export interface DashboardData {
  business: Business
  metrics: DashboardMetrics
  recentTransactions: Transaction[]
  pendingCIBA: Transaction[]
  staffOverview: StaffMember[]
  recentAuditLogs: AuditLog[]
}

// ─── UI Helper Types ─────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type NavPage = 'dashboard' | 'payments' | 'links' | 'staff' | 'vault' | 'audit'

export interface ElfMessage {
  type: 'info' | 'warning' | 'blocked' | 'approved'
  message: string
  timestamp: string
}

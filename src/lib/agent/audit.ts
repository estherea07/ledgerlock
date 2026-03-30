import { prisma } from '@/lib/db'

export async function createAuditLog(params: {
  businessId: string
  action: string
  description: string
  entityId?: string
  staffId?: string
  performedBy?: string
  metadata?: Record<string, unknown>
}) {
  return prisma.auditLog.create({
    data: {
      businessId: params.businessId,
      staffId: params.staffId || null,
      action: params.action,
      entity: 'Transaction',
      entityId: params.entityId,
      description: params.description,
      metadata: JSON.stringify(params.metadata || {}),
      performedBy: params.performedBy || 'elf',
    },
  })
}
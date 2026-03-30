import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding LedgerLock demo data...')

  // Create demo business
  const business = await prisma.business.upsert({
    where: { ownerId: 'demo-owner-001' },
    update: {},
    create: {
      ownerId: 'demo-owner-001',
      ownerEmail: 'owner@greenfield.ng',
      ownerPhone: '+2348012345678',
      name: 'Greenfield Laundry Ltd',
    },
  })

  console.log('✅ Business:', business.name)

  // Policies
  await prisma.policy.createMany({
    skipDuplicates: true,
    data: [
      { businessId: business.id, name: 'Daily Spending Limit', type: 'spending_limit', value: JSON.stringify({ daily: 100000, perTransaction: 50000 }) },
      { businessId: business.id, name: 'Vendor Whitelist', type: 'vendor_whitelist', value: JSON.stringify({ vendors: ['EKEDC', 'Lagos Water', 'Shoprite', 'Dangote'] }) },
      { businessId: business.id, name: 'Business Hours', type: 'time_restriction', value: JSON.stringify({ startHour: 7, endHour: 20 }) },
    ],
  })

  // Staff
  const [amaka, david, funmi] = await Promise.all([
    prisma.staffMember.upsert({
      where: { id: 'staff-amaka-001' },
      update: {},
      create: { id: 'staff-amaka-001', businessId: business.id, name: 'Amaka Obi', email: 'amaka@greenfield.ng', role: 'Cashier', riskScore: 72, flagCount: 2 },
    }),
    prisma.staffMember.upsert({
      where: { id: 'staff-david-001' },
      update: {},
      create: { id: 'staff-david-001', businessId: business.id, name: 'David Kalu', email: 'david@greenfield.ng', role: 'Sales Rep', riskScore: 88, flagCount: 3 },
    }),
    prisma.staffMember.upsert({
      where: { id: 'staff-funmi-001' },
      update: {},
      create: { id: 'staff-funmi-001', businessId: business.id, name: 'Funmi Ibrahim', email: 'funmi@greenfield.ng', role: 'Manager', riskScore: 12, flagCount: 0 },
    }),
  ])

  console.log('✅ Staff seeded:', amaka.name, david.name, funmi.name)

  // Vault tokens (refs only)
  await prisma.vaultToken.createMany({
    skipDuplicates: true,
    data: [
      { businessId: business.id, provider: 'gtbank', displayName: 'GTBank Business Account', scopes: JSON.stringify(['read_transactions', 'verify_deposits']), tokenRef: 'vault_gtbank_demo_001' },
      { businessId: business.id, provider: 'paystack', displayName: 'Paystack Gateway', scopes: JSON.stringify(['create_payment_link', 'read_charges']), tokenRef: 'vault_paystack_demo_001' },
      { businessId: business.id, provider: 'twilio', displayName: 'Twilio WhatsApp', scopes: JSON.stringify(['send_message']), tokenRef: 'vault_twilio_demo_001' },
    ],
  })

  // Demo transactions
  const txns = [
    { staffId: funmi.id, type: 'incoming', amount: 12500, description: 'Customer payment via Link #038', status: 'approved', riskLevel: 'low', riskReasons: '[]' },
    { staffId: amaka.id, type: 'outgoing', amount: 85000, vendor: 'Apex Supplies Ltd', description: 'Supplies purchase', status: 'flagged', riskLevel: 'high', riskReasons: JSON.stringify(['Amount exceeds daily limit ₦50,000', 'First-time vendor not on whitelist']), cibaRequired: true, cibaStatus: 'pending' },
    { staffId: david.id, type: 'outgoing', amount: 32000, description: 'Transfer to personal account', status: 'blocked', riskLevel: 'critical', riskReasons: JSON.stringify(['Destination is employee personal account', 'Staff has 2 previous flags']) },
    { staffId: funmi.id, type: 'outgoing', amount: 18500, vendor: 'EKEDC', description: 'Monthly electricity', status: 'approved', riskLevel: 'low', riskReasons: '[]' },
    { staffId: amaka.id, type: 'incoming', amount: 8000, description: 'Customer payment via Link #037', status: 'approved', riskLevel: 'low', riskReasons: '[]' },
    { staffId: david.id, type: 'outgoing', amount: 67000, vendor: 'Unknown Vendor', description: 'Equipment purchase', status: 'flagged', riskLevel: 'high', riskReasons: JSON.stringify(['Unknown vendor', 'Staff member risk score: 88']), cibaRequired: true, cibaStatus: 'pending' },
  ]

  for (const tx of txns) {
    await prisma.transaction.create({ data: { businessId: business.id, ...tx } })
  }

  // Demo payment links
  const links = [
    { staffId: funmi.id, amount: 12500, service: 'Laundry - Premium', reference: 'GL-0038', url: 'http://localhost:3000/pay/GL-0038', status: 'paid', depositFound: true, expiresAt: new Date(Date.now() + 48 * 3600000), paidAt: new Date() },
    { staffId: david.id, amount: 8000, service: 'Dry Clean', reference: 'GL-0035', url: 'http://localhost:3000/pay/GL-0035', status: 'flagged', depositFound: false, expiresAt: new Date(Date.now() - 1000) },
    { staffId: amaka.id, amount: 6000, service: 'Wash & Fold', reference: 'GL-0034', url: 'http://localhost:3000/pay/GL-0034', status: 'paid', depositFound: true, expiresAt: new Date(Date.now() + 24 * 3600000), paidAt: new Date() },
  ]

  for (const link of links) {
    await prisma.paymentLink.create({ data: { businessId: business.id, currency: 'NGN', ...link } })
  }

  // Audit logs
  const auditEntries = [
    { staffId: david.id, action: 'transaction_blocked', entity: 'Transaction', description: 'Elf blocked ₦32,000 transfer to personal account (David Kalu). Risk: critical.', metadata: JSON.stringify({ riskScore: 88 }) },
    { staffId: amaka.id, action: 'transaction_flagged', entity: 'Transaction', description: 'Elf flagged ₦85,000 to Apex Supplies Ltd. CIBA sent to owner.', metadata: JSON.stringify({ riskScore: 65 }) },
    { staffId: funmi.id, action: 'payment_received', entity: 'PaymentLink', description: '₦12,500 received and verified against bank feed for Laundry - Premium.', metadata: '{}' },
    { staffId: null,     action: 'vault_token_added', entity: 'VaultToken', description: 'GTBank Business Account connected to Auth0 Token Vault with read_transactions scope.', metadata: '{}', performedBy: 'owner@greenfield.ng' },
    { staffId: david.id, action: 'transaction_flagged', entity: 'Transaction', description: 'Elf flagged ₦67,000 to Unknown Vendor (David Kalu). Risk score: 88/100.', metadata: JSON.stringify({ riskScore: 72 }) },
  ]

  for (const entry of auditEntries) {
    await prisma.auditLog.create({
      data: {
        businessId: business.id,
        performedBy: entry.performedBy || 'elf',
        ...entry,
      },
    })
  }

  console.log('✅ Seed complete. Visit http://localhost:3000')
  console.log('💡 Tip: The demo uses a fake Auth0 ownerId. For real use, sign in with Auth0.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

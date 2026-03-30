import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function sendAlert({
  businessId,
  type,
  message,
  phone,
}: {
  businessId: string
  type: string
  message: string
  phone?: string
}) {
  if (!phone) return // Skip if no phone configured

  try {
    await client.messages.create({
      body: `🔒 LedgerLock Alert [${type.toUpperCase()}]: ${message}`,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: phone,
    })
  } catch (err) {
    console.error('SMS notification failed:', err)
  }
}

export async function sendWhatsApp({
  to,
  message,
}: {
  to: string
  message: string
}) {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_FROM!,
      to: `whatsapp:${to}`,
    })
  } catch (err) {
    console.error('WhatsApp notification failed:', err)
  }
}

export async function sendPaymentConfirmation({
  customerPhone,
  amount,
  businessName,
  reference,
}: {
  customerPhone: string
  amount: number
  businessName: string
  reference: string
}) {
  const message = `✅ Payment of ₦${amount.toLocaleString()} to ${businessName} received.\nRef: ${reference}\n\nDid NOT pay? Reply DISPUTE to report.`
  await sendWhatsApp({ to: customerPhone, message })
}

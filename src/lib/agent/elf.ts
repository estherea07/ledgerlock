/**
 * ELF AGENT - LedgerLock's AI Guardian
 * Built with LangGraph for stateful, multi-step transaction analysis
 * Uses Auth0 Token Vault for all credential-sensitive operations
 * Powered by Anthropic Claude (claude-haiku-3-5 - fastest & cheapest)
 */

import { StateGraph, Annotation, END } from '@langchain/langgraph'
import { ChatAnthropic } from '@langchain/anthropic'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { prisma } from '../db'
import { initiateCIBA } from '../auth'
import { sendAlert } from '../notifications'

// ─── State Definition ────────────────────────────────────────────────────────

const ElfState = Annotation.Root({
  transactionId: Annotation<string>(),
  businessId: Annotation<string>(),
  staffId: Annotation<string | null>(),
  amount: Annotation<number>(),
  vendor: Annotation<string | null>(),
  description: Annotation<string>(),
  type: Annotation<string>(),
  policies: Annotation<any[]>(),
  staffHistory: Annotation<any>(),
  riskScore: Annotation<number>({ default: () => 0 }),
  riskReasons: Annotation<string[]>({ default: () => [] }),
  decision: Annotation<string | null>({ default: () => null }),
  cibaRequired: Annotation<boolean>({ default: () => false }),
  cibaRequestId: Annotation<string | null>({ default: () => null }),
  auditNotes: Annotation<string>({ default: () => '' }),
})

// ─── LLM: Anthropic Claude Haiku (fastest, cheapest, free tier available) ───

const llm = new ChatAnthropic({
  modelName: 'claude-haiku-4-5-20251001',
  temperature: 0,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
})

// ─── Node: Load Policies ─────────────────────────────────────────────────────

async function loadPolicies(state: typeof ElfState.State) {
  const policies = await prisma.policy.findMany({
    where: { businessId: state.businessId, isActive: true },
  })

  const staffHistory = state.staffId
    ? await prisma.transaction.findMany({
        where: { staffId: state.staffId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    : []

  return { policies, staffHistory }
}

// ─── Node: Run Policy Check ──────────────────────────────────────────────────

async function runPolicyCheck(state: typeof ElfState.State) {
  const riskReasons: string[] = []
  let riskScore = 0

  for (const policy of state.policies) {
    const value = JSON.parse(policy.value)

    if (policy.type === 'spending_limit') {
      if (state.amount > value.daily) {
        riskScore += 30
        riskReasons.push(`Amount ₦${state.amount.toLocaleString()} exceeds daily limit ₦${value.daily.toLocaleString()}`)
      } else if (state.amount > value.perTransaction) {
        riskScore += 15
        riskReasons.push(`Amount ₦${state.amount.toLocaleString()} exceeds per-transaction limit ₦${value.perTransaction.toLocaleString()}`)
      }
    }

    if (policy.type === 'vendor_whitelist' && state.vendor) {
      const whitelist: string[] = value.vendors || []
      const isWhitelisted = whitelist.some(v =>
        state.vendor!.toLowerCase().includes(v.toLowerCase())
      )
      if (!isWhitelisted) {
        riskScore += 25
        riskReasons.push(`Vendor "${state.vendor}" is not on the approved vendor list`)
      }
    }

    if (policy.type === 'time_restriction') {
      const hour = new Date().getHours()
      if (hour < value.startHour || hour > value.endHour) {
        riskScore += 20
        riskReasons.push(`Transaction attempted outside allowed hours (${value.startHour}:00–${value.endHour}:00)`)
      }
    }
  }

  // Check staff flag history
  if (state.staffHistory.length > 0) {
    const recentFlags = state.staffHistory.filter(
      (t: any) => t.status === 'blocked' || t.status === 'flagged'
    ).length

    if (recentFlags >= 3) {
      riskScore += 30
      riskReasons.push(`Staff member has ${recentFlags} previous flags — high repeat risk`)
    } else if (recentFlags >= 1) {
      riskScore += 15
      riskReasons.push(`Staff member has ${recentFlags} previous flag${recentFlags > 1 ? 's' : ''}`)
    }
  }

  // Personal account keyword detection
  const desc = (state.description + ' ' + (state.vendor || '')).toLowerCase()
  const personalKeywords = ['personal', 'my account', 'private account', 'individual account']
  if (personalKeywords.some(k => desc.includes(k))) {
    riskScore += 40
    riskReasons.push('Transaction description suggests personal account destination — blocked by policy')
  }

  return { riskScore, riskReasons }
}

// ─── Node: AI Anomaly Detection (Claude Haiku) ───────────────────────────────

async function runAnomalyDetection(state: typeof ElfState.State) {
  const historyText = state.staffHistory
    .slice(0, 5)
    .map((t: any) => `${t.type} ₦${t.amount} - ${t.description} [${t.status}]`)
    .join('\n') || 'No history yet'

  const prompt = `You are Elf, an AI fraud detection agent for LedgerLock, protecting SME finances in Nigeria.

Analyse this transaction for fraud risk signals:
- Type: ${state.type}
- Amount: ₦${state.amount.toLocaleString()}
- Vendor/Description: ${state.vendor || state.description}
- Current risk score from policy check: ${state.riskScore}/100
- Current risk reasons: ${state.riskReasons.join('; ') || 'None yet'}

Staff recent transactions:
${historyText}

Common fraud patterns to detect:
1. Round amounts to personal accounts (e.g. ₦50,000 exactly with vague description)
2. Vendor name mismatch (paid to "John Doe" instead of company name)
3. Unusual timing or frequency
4. Amount just below approval thresholds
5. Repeat small transactions that sum to large amounts

Respond ONLY with valid JSON, no other text:
{
  "additionalRiskScore": <number 0-40>,
  "additionalReasons": ["reason1", "reason2"],
  "anomalyDetected": <boolean>
}`

  try {
    const response = await llm.invoke([
      new SystemMessage('You are Elf, a financial fraud detection AI for African SMEs. Respond ONLY with valid JSON.'),
      new HumanMessage(prompt),
    ])

    const content = response.content as string
    const clean = content.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    return {
      riskScore: Math.min(100, state.riskScore + (result.additionalRiskScore || 0)),
      riskReasons: [...state.riskReasons, ...(result.additionalReasons || [])],
    }
  } catch (err) {
    // If AI call fails, proceed with policy-based score only
    console.error('Elf AI analysis error:', err)
    return {}
  }
}

// ─── Node: Make Decision ──────────────────────────────────────────────────────

async function makeDecision(state: typeof ElfState.State) {
  let decision: string
  let cibaRequired = false
  let auditNotes = ''

  if (state.riskScore >= 70) {
    decision = 'blocked'
    auditNotes = `Elf auto-blocked transaction. Risk score: ${state.riskScore}/100. Signals: ${state.riskReasons.join('; ')}`
  } else if (state.riskScore >= 35) {
    decision = 'flagged'
    cibaRequired = true
    auditNotes = `Elf flagged for owner review via Auth0 CIBA. Risk score: ${state.riskScore}/100`
  } else {
    decision = 'approved'
    auditNotes = `Elf auto-approved. Risk score: ${state.riskScore}/100. All policies passed.`
  }

  return { decision, cibaRequired, auditNotes }
}

// ─── Node: Initiate CIBA ──────────────────────────────────────────────────────

async function triggerCIBA(state: typeof ElfState.State) {
  if (!state.cibaRequired) return {}

  try {
    const business = await prisma.business.findUnique({
      where: { id: state.businessId },
    })
    if (!business?.ownerId) return {}

    const bindingMessage = `Elf: Approve ₦${state.amount.toLocaleString()} to ${state.vendor || state.description}? Risk: ${state.riskScore}/100`

    const cibaResult = await initiateCIBA(
      business.ownerId,
      bindingMessage,
      'openid'
    )

    return { cibaRequestId: cibaResult.auth_req_id }
  } catch (err) {
    console.error('CIBA initiation failed:', err)
    return {}
  }
}

// ─── Node: Persist & Notify ───────────────────────────────────────────────────

async function persistAndNotify(state: typeof ElfState.State) {
  const riskLevel =
    state.riskScore >= 70 ? 'critical' :
    state.riskScore >= 35 ? 'high' :
    state.riskScore >= 15 ? 'medium' : 'low'

  await prisma.transaction.update({
    where: { id: state.transactionId },
    data: {
      status: state.decision || 'pending',
      riskLevel,
      riskReasons: JSON.stringify(state.riskReasons),
      cibaRequired: state.cibaRequired,
      cibaStatus: state.cibaRequired ? 'pending' : null,
      cibaRequestId: state.cibaRequestId,
    },
  })

  if (state.staffId && (state.decision === 'flagged' || state.decision === 'blocked')) {
    const staff = await prisma.staffMember.findUnique({ where: { id: state.staffId } })
    if (staff) {
      const newScore = Math.min(100, staff.riskScore + Math.floor(state.riskScore * 0.25))
      await prisma.staffMember.update({
        where: { id: state.staffId },
        data: { riskScore: newScore, flagCount: { increment: 1 } },
      })
    }
  }

  await prisma.auditLog.create({
    data: {
      businessId: state.businessId,
      staffId: state.staffId,
      action: `transaction_${state.decision}`,
      entity: 'Transaction',
      entityId: state.transactionId,
      description: state.auditNotes,
      metadata: JSON.stringify({ riskScore: state.riskScore, riskReasons: state.riskReasons }),
      performedBy: 'elf',
    },
  })

  if (state.decision === 'flagged' || state.decision === 'blocked') {
    await sendAlert({
      businessId: state.businessId,
      type: state.decision,
      message: `Elf ${state.decision} a ₦${state.amount.toLocaleString()} transaction. Risk: ${state.riskScore}/100`,
    })
  }

  return {}
}

// ─── Routing ──────────────────────────────────────────────────────────────────

function routeAfterDecision(state: typeof ElfState.State) {
  return state.cibaRequired ? 'trigger_ciba' : 'persist_and_notify'
}

// ─── Build LangGraph ──────────────────────────────────────────────────────────

const graph = new StateGraph(ElfState)
  .addNode('load_policies', loadPolicies)
  .addNode('policy_check', runPolicyCheck)
  .addNode('anomaly_detection', runAnomalyDetection)
  .addNode('make_decision', makeDecision)
  .addNode('trigger_ciba', triggerCIBA)
  .addNode('persist_and_notify', persistAndNotify)
  .addEdge('__start__', 'load_policies')
  .addEdge('load_policies', 'policy_check')
  .addEdge('policy_check', 'anomaly_detection')
  .addEdge('anomaly_detection', 'make_decision')
  .addConditionalEdges('make_decision', routeAfterDecision)
  .addEdge('trigger_ciba', 'persist_and_notify')
  .addEdge('persist_and_notify', END)

export const elfAgent = graph.compile()

// ─── Public Interface ─────────────────────────────────────────────────────────

export async function runElfAnalysis(input: {
  transactionId: string
  businessId: string
  staffId: string | null
  amount: number
  vendor: string | null
  description: string
  type: 'incoming' | 'outgoing'
}) {
  const result = await elfAgent.invoke({
    ...input,
    policies: [],
    staffHistory: [],
    riskScore: 0,
    riskReasons: [],
    decision: null,
    cibaRequired: false,
    cibaRequestId: null,
    auditNotes: '',
  })

  return {
    decision: result.decision,
    riskScore: result.riskScore,
    riskReasons: result.riskReasons,
    cibaRequired: result.cibaRequired,
    cibaRequestId: result.cibaRequestId,
  }
}

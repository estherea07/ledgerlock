/**
 * ELF AGENT - LedgerLock's AI Guardian
 * LangGraph stateful agent with Auth0 Token Vault + CIBA
 * Powered by Anthropic Claude Haiku
 */

import { StateGraph, Annotation, END } from '@langchain/langgraph'
import { ChatAnthropic } from '@langchain/anthropic'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { prisma } from '../db'
import { initiateCIBA } from '../auth'
import { sendAlert } from '../notifications'

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
  riskScore: Annotation<number>({
    reducer: (x: number, y: number) => y ?? x,
    default: () => 0,
  }),
  riskReasons: Annotation<string[]>({
    reducer: (x: string[], y: string[]) => x.concat(y),
    default: () => [],
  }),
  decision: Annotation<string | null>({
    reducer: (x: string | null, y: string | null) => y ?? x,
    default: () => null,
  }),
  cibaRequired: Annotation<boolean>({
    reducer: (x: boolean, y: boolean) => y ?? x,
    default: () => false,
  }),
  cibaRequestId: Annotation<string | null>({
    reducer: (x: string | null, y: string | null) => y ?? x,
    default: () => null,
  }),
  auditNotes: Annotation<string>({
    reducer: (x: string, y: string) => y ?? x,
    default: () => '',
  }),
})

const llm = new ChatAnthropic({
  modelName: 'claude-haiku-4-5-20251001',
  temperature: 0,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
})

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

async function runPolicyCheck(state: typeof ElfState.State) {
  const riskReasons: string[] = []
  let riskScore = 0

  for (const policy of state.policies) {
    const value = JSON.parse(policy.value)

    if (policy.type === 'spending_limit') {
      if (state.amount > value.daily) {
        riskScore += 30
        riskReasons.push(`Amount exceeds daily limit of ₦${value.daily.toLocaleString()}`)
      } else if (state.amount > value.perTransaction) {
        riskScore += 15
        riskReasons.push(`Amount exceeds per-transaction limit of ₦${value.perTransaction.toLocaleString()}`)
      }
    }

    if (policy.type === 'vendor_whitelist' && state.vendor) {
      const whitelist: string[] = value.vendors || []
      const isWhitelisted = whitelist.some((v: string) =>
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
        riskReasons.push(`Transaction outside allowed hours (${value.startHour}:00–${value.endHour}:00)`)
      }
    }
  }

  if (state.staffHistory.length > 0) {
    const recentFlags = state.staffHistory.filter(
      (t: any) => t.status === 'blocked' || t.status === 'flagged'
    ).length
    if (recentFlags >= 3) {
      riskScore += 30
      riskReasons.push(`Staff member has ${recentFlags} previous flags`)
    } else if (recentFlags >= 1) {
      riskScore += 15
      riskReasons.push(`Staff member has ${recentFlags} previous flag${recentFlags > 1 ? 's' : ''}`)
    }
  }

  const desc = (state.description + ' ' + (state.vendor || '')).toLowerCase()
  if (['personal', 'my account', 'private account'].some(k => desc.includes(k))) {
    riskScore += 40
    riskReasons.push('Transaction description suggests personal account destination')
  }

  return { riskScore, riskReasons }
}

async function runAnomalyDetection(state: typeof ElfState.State) {
  const historyText = state.staffHistory
    .slice(0, 5)
    .map((t: any) => `${t.type} ₦${t.amount} - ${t.description} [${t.status}]`)
    .join('\n') || 'No history'

  const prompt = `You are Elf, an AI fraud detection agent for LedgerLock protecting SME finances.

Transaction:
- Type: ${state.type}
- Amount: ₦${state.amount.toLocaleString()}
- Vendor/Description: ${state.vendor || state.description}
- Current risk score: ${state.riskScore}/100
- Current signals: ${state.riskReasons.join('; ') || 'None'}

Staff recent history:
${historyText}

Respond ONLY with valid JSON, no other text:
{"additionalRiskScore": <0-40>, "additionalReasons": ["reason"], "anomalyDetected": <boolean>}`

  try {
    const response = await llm.invoke([
      new SystemMessage('You are Elf, a financial fraud detection AI. Respond ONLY with valid JSON.'),
      new HumanMessage(prompt),
    ])
    const content = response.content as string
    const clean = content.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)
    return {
      riskScore: Math.min(100, state.riskScore + (result.additionalRiskScore || 0)),
      riskReasons: (result.additionalReasons || []) as string[],
    }
  } catch {
    return {}
  }
}

async function makeDecision(state: typeof ElfState.State) {
  let decision: string
  let cibaRequired = false
  let auditNotes = ''

  if (state.riskScore >= 70) {
    decision = 'blocked'
    auditNotes = `Elf blocked. Risk: ${state.riskScore}/100. Signals: ${state.riskReasons.join('; ')}`
  } else if (state.riskScore >= 35) {
    decision = 'flagged'
    cibaRequired = true
    auditNotes = `Elf flagged for CIBA. Risk: ${state.riskScore}/100`
  } else {
    decision = 'approved'
    auditNotes = `Elf approved. Risk: ${state.riskScore}/100`
  }

  return { decision, cibaRequired, auditNotes }
}

async function triggerCIBA(state: typeof ElfState.State) {
  if (!state.cibaRequired) return {}
  try {
    const business = await prisma.business.findUnique({ where: { id: state.businessId } })
    if (!business?.ownerId) return {}
    const bindingMessage = `Elf: Approve ₦${state.amount.toLocaleString()} to ${state.vendor || state.description}? Risk: ${state.riskScore}/100`
    const cibaResult = await initiateCIBA(business.ownerId, bindingMessage, 'openid')
    return { cibaRequestId: cibaResult.auth_req_id }
  } catch (err) {
    console.error('CIBA failed:', err)
    return {}
  }
}

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
      await prisma.staffMember.update({
        where: { id: state.staffId },
        data: {
          riskScore: Math.min(100, staff.riskScore + Math.floor(state.riskScore * 0.25)),
          flagCount: { increment: 1 },
        },
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
      message: `Elf ${state.decision} ₦${state.amount.toLocaleString()} transaction. Risk: ${state.riskScore}/100`,
    })
  }

  return {}
}

function routeAfterDecision(state: typeof ElfState.State) {
  return state.cibaRequired ? 'trigger_ciba' : 'persist_and_notify'
}

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

export async function runElfAnalysis(input: {
  transactionId: string
  businessId: string
  staffId: string | null
  amount: number
  vendor: string | null
  description: string
  type: string
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
    decision: result.decision as string,
    riskScore: result.riskScore as number,
    riskReasons: result.riskReasons as string[],
    cibaRequired: result.cibaRequired as boolean,
    cibaRequestId: result.cibaRequestId as string | null,
  }
}
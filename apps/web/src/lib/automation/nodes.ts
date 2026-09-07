// Node type definitions for the `graph` jsonb on automation_workflows.
//
// v1 deliberately models the graph as a linear step list — each workflow runs its
// nodes top to bottom, in order. Branching (condition nodes with multiple outgoing
// edges) is a later enhancement; the shape below stays forward-compatible with it
// because every node carries a stable `id` that a future edge table could reference.
//
// `config` holds the action's payload (the ActionPayload map in contract.ts). It is
// typed as a loose Record here because the graph is stored as raw jsonb and read
// back without a schema; the engine's dispatchAction casts it per action.

import type { AutomationActionName } from './contract'

export type AutomationNode = {
  id: string
  action: AutomationActionName
  label?: string
  config: Record<string, unknown>
  /** For condition nodes: target node id when the condition is true. */
  yesEdge?: string
  /** For condition nodes: target node id when the condition is false. */
  noEdge?: string
}

export type AutomationGraph = {
  nodes: AutomationNode[]
}

export function emptyGraph(): AutomationGraph {
  return { nodes: [] }
}

/** Defensive read of the stored graph — never trust jsonb to be well-formed. */
export function graphNodes(graph: unknown): AutomationNode[] {
  if (!graph || typeof graph !== 'object') return []
  const nodes = (graph as { nodes?: unknown }).nodes
  if (!Array.isArray(nodes)) return []
  return nodes.filter(
    (node) =>
      node &&
      typeof node === 'object' &&
      typeof (node as { id?: unknown }).id === 'string' &&
      typeof (node as { action?: unknown }).action === 'string',
  ) as AutomationNode[]
}

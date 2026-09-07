import type { Data } from '@puckeditor/core'
import type { Props } from './config'

export function createEmptyPuckData(): Data<Props> {
  return { content: [], root: {} }
}

export function normalizePuckData(raw: unknown): Data<Props> {
  if (!raw) return createEmptyPuckData()

  let parsed = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return createEmptyPuckData()
    }
  }

  if (Array.isArray(parsed)) {
    return { content: parsed, root: {} } as Data<Props>
  }

  if (typeof parsed === 'object' && parsed !== null) {
    const dataObj = parsed as Record<string, unknown>
    const content = Array.isArray(dataObj.content)
      ? dataObj.content
      : Array.isArray(dataObj.blocks)
        ? dataObj.blocks
        : []
    const root = typeof dataObj.root === 'object' && dataObj.root !== null ? (dataObj.root as Record<string, unknown>) : {}
    const zones = typeof dataObj.zones === 'object' && dataObj.zones !== null ? (dataObj.zones as Record<string, unknown>) : undefined
    return { content, root, ...(zones ? { zones } : {}) } as Data<Props>
  }

  return createEmptyPuckData()
}

export type PuckBlocksResult =
  | { status: 'ok'; data: Data<Props>; itemCount: number }
  | { status: 'empty'; data: Data<Props> }
  | { status: 'missing'; message: string }
  | { status: 'unreadable'; message: string }

export function readPuckBlocks(record: unknown, field = 'blocks'): PuckBlocksResult {
  if (typeof record !== 'object' || record === null || Array.isArray(record)) {
    return { status: 'unreadable', message: `The server returned ${record === null ? 'null' : typeof record} instead of a record.` }
  }

  const obj = record as Record<string, unknown>
  if (!Object.hasOwn(obj, field)) {
    return {
      status: 'missing',
      message:
        `This record came back without its "${field}" field, so the editor has nothing to show — but the content is still in Directus. ` +
        `Directus omits fields the signed-in user's role may not read instead of returning an error. ` +
        `Grant that role read access to "${field}" (directus/scripts/grant-editor-permissions.ts) and reload. Do not save from this screen.`,
    }
  }

  const raw = obj[field]
  if (raw === null || raw === undefined || raw === '') return { status: 'empty', data: createEmptyPuckData() }

  let parsed: unknown = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { status: 'unreadable', message: `The "${field}" field holds text that is not valid JSON, so the editor cannot open it safely. Do not save from this screen.` }
    }
    if (parsed === null) return { status: 'empty', data: createEmptyPuckData() }
  }

  if (Array.isArray(parsed)) {
    const data = normalizePuckData(parsed)
    return parsed.length > 0 ? { status: 'ok', data, itemCount: parsed.length } : { status: 'empty', data }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { status: 'unreadable', message: `The "${field}" field holds a ${typeof parsed}, not a Puck document. Do not save from this screen.` }
  }

  const docObj = parsed as Record<string, unknown>
  const looksLikeDocument =
    Array.isArray(docObj.content) || Array.isArray(docObj.blocks) || Object.hasOwn(docObj, 'root') || Object.keys(docObj).length === 0
  if (!looksLikeDocument) {
    return {
      status: 'unreadable',
      message: `The "${field}" field holds an object that is not a Puck document (keys: ${Object.keys(docObj).slice(0, 8).join(', ')}). Do not save from this screen.`,
    }
  }

  const data = normalizePuckData(docObj)
  const itemCount = data.content.length
  return itemCount > 0 ? { status: 'ok', data, itemCount } : { status: 'empty', data }
}

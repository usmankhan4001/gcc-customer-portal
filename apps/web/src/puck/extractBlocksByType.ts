import type { Data } from '@puckeditor/core'
import type { Props } from './config'

export function extractBlocksByType<K extends keyof Props>(data: Data<Props> | null | undefined, type: K): Props[K][] {
  if (!data?.content?.length) return []
  return data.content.filter((block) => block.type === type).map((block) => block.props as unknown as Props[K])
}

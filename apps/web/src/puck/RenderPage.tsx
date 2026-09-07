'use client'

import { Render, type Data } from '@puckeditor/core'
import { config, type Props } from './config'

export function RenderPage({ data }: { data: Data<Props> }) {
  return <Render config={config} data={data} />
}

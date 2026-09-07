import type { ComponentConfig } from '@puckeditor/core'
import { Building2, Landmark, ShieldCheck, Clock3, Globe2, Briefcase, type LucideIcon } from 'lucide-react'
import { StatBand } from '@/components/ui'
import type { StatBandItem } from '@/components/ui'

const ICONS: Record<string, LucideIcon> = {
  building: Building2,
  bank: Landmark,
  shield: ShieldCheck,
  clock: Clock3,
  globe: Globe2,
}

export type StatBandBlockProps = {
  stats: Array<{ icon: string; value: number; suffix: string; label: string }>
}

/** Puck-editable version of the v7 tonal stat band. `value` animates as a count-up;
 * for non-numeric figures (e.g. a "0-9%" tax range), set `value` to 0 and put the
 * full text in `suffix` — it still renders, just without the count animation. */
export const StatBandBlock: ComponentConfig<StatBandBlockProps> = {
  fields: {
    stats: {
      type: 'array',
      arrayFields: {
        icon: {
          type: 'select',
          options: [
            { label: 'Building', value: 'building' },
            { label: 'Bank', value: 'bank' },
            { label: 'Shield', value: 'shield' },
            { label: 'Clock', value: 'clock' },
            { label: 'Globe', value: 'globe' },
          ],
        },
        value: { type: 'number' },
        suffix: { type: 'text' },
        label: { type: 'text' },
      },
      getItemSummary: (item) => item.label || 'Stat',
    },
  },
  defaultProps: {
    stats: [
      { icon: 'globe', value: 15, suffix: '+', label: 'Jurisdictions covered' },
      { icon: 'building', value: 500, suffix: '+', label: 'Companies registered' },
      { icon: 'clock', value: 48, suffix: 'h', label: 'Fastest setup on record' },
    ],
  },
  render: ({ stats }) => {
    const items: StatBandItem[] = stats.map((s) => {
      const Icon = ICONS[s.icon] ?? Briefcase
      return { icon: <Icon size={26} strokeWidth={1.6} />, value: s.value, suffix: s.suffix, label: s.label }
    })
    return <StatBand items={items} />
  },
}

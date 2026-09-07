import type { ComponentConfig } from '@puckeditor/core'

export type TickerProps = { items: Array<{ text: string }> }

export const Ticker: ComponentConfig<TickerProps> = {
  fields: {
    items: { type: 'array', arrayFields: { text: { type: 'text' } } },
  },
  defaultProps: {
    items: [
      { text: 'Bahrain — 0% corporate tax' },
      { text: 'UAE — 0% on foreign-sourced income' },
      { text: 'Hong Kong — fully remote setup' },
    ],
  },
  render: ({ items }) => (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {[0, 1].flatMap((rep) =>
          items.map((item, i) => <span key={`${rep}-${i}`}>{item.text}</span>),
        )}
      </div>
    </div>
  ),
}

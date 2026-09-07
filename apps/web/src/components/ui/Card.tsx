import type { HTMLAttributes, ReactNode } from 'react'

export function Card({
  featured,
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { featured?: boolean; children: ReactNode }) {
  return (
    <div className={['card', featured ? 'card-featured' : '', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  )
}
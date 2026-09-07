import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'outline' | 'danger'

type StyleProps = {
  variant?: Variant
  /** Reserve for at most one high-intent CTA per page — DESIGN.md §8. */
  shimmer?: boolean
  className?: string
}

type CommonProps = StyleProps & { children: ReactNode }

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  danger: 'btn-danger',
}

function classes({ variant = 'primary', shimmer, className = '' }: StyleProps) {
  return ['btn', VARIANT_CLASS[variant], shimmer ? 'btn-shimmer' : '', className]
    .filter(Boolean)
    .join(' ')
}

export function Button({
  variant,
  shimmer,
  className,
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={classes({ variant, shimmer, className })} {...rest}>
      {children}
    </button>
  )
}

export function ButtonLink({
  variant,
  shimmer,
  className,
  children,
  ...rest
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={classes({ variant, shimmer, className })} {...rest}>
      {children}
    </a>
  )
}
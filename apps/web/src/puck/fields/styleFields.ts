import type { CSSProperties } from 'react'

export type SpacingValue = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type BackgroundPreset = 'default' | 'alt' | 'dark' | 'accent-lt'
export type ContainerMaxWidth = 'narrow' | 'medium' | 'full'

export type StyleProps = {
  paddingTop?: SpacingValue
  paddingBottom?: SpacingValue
  marginTop?: SpacingValue
  marginBottom?: SpacingValue
  bgPreset?: BackgroundPreset
  maxWidth?: ContainerMaxWidth
}

export const spacingOptions: Array<{ label: string; value: SpacingValue }> = [
  { label: 'None (0)', value: 'none' },
  { label: 'Extra Small (8px)', value: 'xs' },
  { label: 'Small (16px)', value: 'sm' },
  { label: 'Medium (32px)', value: 'md' },
  { label: 'Large (48px)', value: 'lg' },
  { label: 'Extra Large (64px)', value: 'xl' },
  { label: '2X Large (80px)', value: '2xl' },
]

export const bgPresetOptions: Array<{ label: string; value: BackgroundPreset }> = [
  { label: 'Default (Warm Neutral)', value: 'default' },
  { label: 'Alternate (Sand Tile)', value: 'alt' },
  { label: 'Dark Navy (Accent)', value: 'dark' },
  { label: 'Light Accent (Orange Tint)', value: 'accent-lt' },
]

export const maxWidthOptions: Array<{ label: string; value: ContainerMaxWidth }> = [
  { label: 'Narrow (780px)', value: 'narrow' },
  { label: 'Medium (1160px)', value: 'medium' },
  { label: 'Full Width (100%)', value: 'full' },
]

export const styleFields = {
  paddingTop: {
    type: 'select' as const,
    options: spacingOptions,
  },
  paddingBottom: {
    type: 'select' as const,
    options: spacingOptions,
  },
  marginTop: {
    type: 'select' as const,
    options: spacingOptions,
  },
  marginBottom: {
    type: 'select' as const,
    options: spacingOptions,
  },
  bgPreset: {
    type: 'select' as const,
    options: bgPresetOptions,
  },
  maxWidth: {
    type: 'select' as const,
    options: maxWidthOptions,
  },
}

export const defaultStyleProps: StyleProps = {
  paddingTop: 'xl',
  paddingBottom: 'xl',
  marginTop: 'none',
  marginBottom: 'none',
  bgPreset: 'default',
  maxWidth: 'medium',
}

export function getSpacingStyleValue(value?: SpacingValue): string | undefined {
  switch (value) {
    case 'none':
      return '0px'
    case 'xs':
      return 'var(--space-2)'
    case 'sm':
      return 'var(--space-4)'
    case 'md':
      return 'var(--space-8)'
    case 'lg':
      return 'var(--space-12)'
    case 'xl':
      return 'var(--space-16)'
    case '2xl':
      return 'var(--space-20)'
    default:
      return undefined
  }
}

export function getSectionStyle(props: StyleProps, baseStyle?: CSSProperties): CSSProperties {
  const styles: CSSProperties = { ...baseStyle }

  if (props.paddingTop) {
    const val = getSpacingStyleValue(props.paddingTop)
    if (val !== undefined) styles.paddingTop = val
  }
  if (props.paddingBottom) {
    const val = getSpacingStyleValue(props.paddingBottom)
    if (val !== undefined) styles.paddingBottom = val
  }
  if (props.marginTop) {
    const val = getSpacingStyleValue(props.marginTop)
    if (val !== undefined) styles.marginTop = val
  }
  if (props.marginBottom) {
    const val = getSpacingStyleValue(props.marginBottom)
    if (val !== undefined) styles.marginBottom = val
  }

  if (props.bgPreset === 'accent-lt') {
    styles.backgroundColor = 'var(--orange-lt)'
  }

  return styles
}

export function getSectionClassName(props: StyleProps, baseClassName = 'section'): string {
  const classes = [baseClassName]

  if (props.bgPreset === 'alt') {
    classes.push('section-alt')
  } else if (props.bgPreset === 'dark') {
    classes.push('section-dark')
  } else if (props.bgPreset === 'accent-lt') {
    classes.push('section-accent-lt')
  }

  return classes.filter(Boolean).join(' ')
}

export function getContainerClassName(maxWidth?: ContainerMaxWidth): string {
  if (maxWidth === 'narrow') return 'wrap-narrow'
  if (maxWidth === 'full') return 'wrap-full'
  return 'wrap'
}

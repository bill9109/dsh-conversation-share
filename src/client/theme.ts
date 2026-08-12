/** Resolve live theme colors from the document (tokens resolve per build). */

function readVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value === '' ? fallback : value
}

export interface ThemeColors {
  businessPrimary: string
  labelPrimary: string
  labelSecondary: string
  labelTertiary: string
  bgBase: string
  bgRaise: string
  borderL2: string
}

/** Snapshot of the design-token colors used by the share chrome. */
export function themeColors(): ThemeColors {
  return {
    businessPrimary: readVar('--dsw-alias-state-business-primary', '#3964fe'),
    labelPrimary: readVar('--dsw-alias-label-primary', '#1a1a1a'),
    labelSecondary: readVar('--dsw-alias-label-secondary', '#525252'),
    labelTertiary: readVar('--dsw-alias-label-tertiary', '#8a8a8a'),
    bgBase: readVar('--dsw-alias-bg-base', '#ffffff'),
    bgRaise: readVar('--dsw-alias-bg-layer-2', '#ffffff'),
    borderL2: readVar('--dsw-alias-border-l2', '#e5e5e5'),
  }
}

/**
 * Resolve the effective page background behind the conversation column, so
 * the capture's side padding matches the surrounding page color exactly.
 */
export function resolveThemeBackground(): string {
  const scoped = document.querySelector<HTMLElement>('[data-conversation-scroll]')
  const probe = (el: HTMLElement | null): string | null => {
    while (el !== null) {
      const bg = getComputedStyle(el).backgroundColor
      if (bg !== '' && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return bg
      el = el.parentElement
    }
    return null
  }
  const found = probe(scoped ?? document.body)
  if (found !== null) return found
  return getComputedStyle(document.body).backgroundColor !== 'rgba(0, 0, 0, 0)'
    ? getComputedStyle(document.body).backgroundColor
    : '#ffffff'
}

/** Scroll an element into view and apply a brief highlight ring. */
export function scrollAndHighlight(el: HTMLElement): void {
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.focus({ preventScroll: true })
  el.classList.add('lp-field-highlight')
  setTimeout(() => el.classList.remove('lp-field-highlight'), 1400)
}

let highlightStyleInjected = false

/** Inject the highlight CSS once per page. */
export function ensureHighlightStyle(): void {
  if (highlightStyleInjected || typeof document === 'undefined') return
  highlightStyleInjected = true
  const style = document.createElement('style')
  style.textContent = `
    .lp-field-highlight {
      outline: 2px solid var(--theme-success-500, #22c55e) !important;
      outline-offset: 2px;
      transition: outline 0.2s;
    }
  `
  document.head.appendChild(style)
}

/**
 * Focus the closest admin form field that corresponds to a given data path.
 * Tries direct selectors first, then block-row selectors, then suffix matching.
 */
export function focusAdminField(fieldPath: string): void {
  const directSelectors = [
    `[data-field-path="${fieldPath}"]`,
    `input[name="${fieldPath}"]`,
    `textarea[name="${fieldPath}"]`,
    `[id^="field-${fieldPath}"]`,
  ]

  for (const selector of directSelectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el) {
      scrollAndHighlight(el)
      return
    }
  }

  const blockRowMatch = fieldPath.match(/^blocks\.(\d+)$/)
  if (blockRowMatch) {
    const index = parseInt(blockRowMatch[1] ?? '0', 10)
    const rowSelectors = [
      `[data-field-path="blocks.${index}"]`,
      `[data-field-path="blocks"] [data-row-index="${index}"]`,
      `[data-field-path="blocks"] [data-row]:nth-child(${index + 1})`,
      `[data-array-row-index="${index}"]`,
    ]
    for (const selector of rowSelectors) {
      const el = document.querySelector<HTMLElement>(selector)
      if (el) {
        const toggle =
          el.querySelector<HTMLElement>('[data-collapsed]') ??
          el.querySelector<HTMLButtonElement>('button[aria-expanded="false"]')
        toggle?.click()
        scrollAndHighlight(el)
        return
      }
    }
    // Fallback: find any block row by iterating elements with data-field-path starting with "blocks."
    const row = Array.from(
      document.querySelectorAll<HTMLElement>('[data-field-path^="blocks."]'),
    ).find((el) => el.getAttribute('data-field-path') === `blocks.${index}`)
    if (row) {
      const toggle =
        row.querySelector<HTMLElement>('[data-collapsed]') ??
        row.querySelector<HTMLButtonElement>('button[aria-expanded="false"]')
      toggle?.click()
      scrollAndHighlight(row)
      return
    }
    const blocksField = document.querySelector<HTMLElement>('[data-field-path="blocks"]')
    if (blocksField) scrollAndHighlight(blocksField)
    return
  }

  const segments = fieldPath.split('.')
  if (segments.length > 1) {
    for (let i = 0; i < segments.length; i++) {
      const suffix = segments.slice(i).join('.')
      const candidates = [
        `[data-field-path="${suffix}"]`,
        `input[name="${suffix}"]`,
        `textarea[name="${suffix}"]`,
      ]
      for (const selector of candidates) {
        const el = document.querySelector<HTMLElement>(selector)
        if (el) {
          scrollAndHighlight(el)
          return
        }
      }
    }
  }
}

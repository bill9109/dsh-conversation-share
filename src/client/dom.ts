/** Locate the conversation chrome the share feature rides on. */

/** The 对话/轨迹 tab row (only present for a real session header). */
export function findTablist(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-phase] [role="tablist"]')
}

/** The conversation column's scrollport (host of the chat flow). */
export function findScrollport(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-conversation-scroll]')
}

/** The chat flow list (children are the semantic chat rows). */
export function findFlowList(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-chat-flow]')
}

/** The sticky composer seat inside the scrollport, when present. */
export function findComposerSeat(scrollport: HTMLElement): HTMLElement | null {
  return scrollport.querySelector<HTMLElement>('[data-composer-seat]')
}


/** The header's right-end utilities strip (home of the Session log button). */
export function findHeaderUtilities(): HTMLElement | null {
  const log = Array.from(document.querySelectorAll<HTMLElement>('header button')).find(
    b => /session\s*log/i.test((b.textContent ?? '').trim()) && (b.textContent ?? '').trim().length < 30,
  )
  return log?.parentElement ?? null
}
/** Ensure the 对话 tab is active (the share flow operates on the chat view). */
export function switchToChatTab(): void {
  const tablist = findTablist()
  if (tablist === null) return
  const tabs = Array.from(tablist.querySelectorAll<HTMLElement>('[role="tab"]'))
  if (tabs.length < 2) return
  const active = tabs.find(tab => tab.getAttribute('aria-selected') === 'true')
  if (active === undefined || active === tabs[0]) return
  tabs[0].click()
}

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
  // Stable slot (dsh alpha+): the header's right-end utilities strip. Prefer the
  // explicit data-slot so the locator survives Session-log-button label changes.
  const slot = document.querySelector<HTMLElement>('[data-slot="conversation.session.header.utilities"]')
  if (slot !== null) return slot
  // Fallback (older builds / label variants): the parent of the Session log button.
  // The label is localized (e.g. "Session 日志"), so accept the "log" stem or the CJK 日志.
  const log = Array.from(document.querySelectorAll<HTMLElement>('header button')).find(
    b => /session\s*(?:log|日志)/i.test((b.textContent ?? '').trim()) && (b.textContent ?? '').trim().length < 30,
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

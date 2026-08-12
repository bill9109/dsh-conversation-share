/**
 * Share-flow controller: owns the tab-row share button, the activate/cancel/
 * confirm button set, the marker overlay lifecycle, and the capture pipeline.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { findBrandSvg } from './brand.ts'
import { captureRange } from './capture.ts'
import { findFlowList, findScrollport, findTablist, switchToChatTab } from './dom.ts'
import {
  ghostButtonStyle, primaryButtonStyle, shareButtonStyle, shareIconSVG,
} from './icons.ts'
import { MarkerOverlay } from './markers.ts'
import { PreviewModal } from './modal.ts'
import { resolveThemeBackground } from './theme.ts'
import { dismissToast, showToast } from './toast.ts'

const ACTIONS_CLASS = 'dsh-share-tabs-actions'

export class ShareController {
  private readonly ctx: ClientContext
  private readonly modal = new PreviewModal()
  private observer: MutationObserver | null = null
  private tablist: HTMLElement | null = null
  private actionsRow: HTMLDivElement | null = null
  private shareButton: HTMLButtonElement | null = null
  private cancelButton: HTMLButtonElement | null = null
  private confirmButton: HTMLButtonElement | null = null
  private overlay: MarkerOverlay | null = null
  private active = false
  private disposed = false

  constructor(ctx: ClientContext) {
    this.ctx = ctx
  }

  attach(): void {
    this.observer = new MutationObserver(() => this.syncButton())
    this.observer.observe(document.body, { childList: true, subtree: true })
    this.syncButton()
  }

  dispose(): void {
    this.disposed = true
    this.observer?.disconnect()
    this.observer = null
    this.deactivate()
    this.teardownButton()
    this.modal.hide()
  }

  // ---- button mounting --------------------------------------------------

  private syncButton(): void {
    if (this.disposed) return
    const tablist = findTablist()
    if (tablist === null) {
      if (this.active) this.deactivate()
      this.teardownButton()
      return
    }
    if (this.tablist === tablist && this.shareButton !== null && tablist.contains(this.shareButton)) return
    // The header (and its tablist) was re-created — likely a session switch.
    if (this.active) this.deactivate()
    this.teardownButton()
    this.buildButton(tablist)
  }

  private buildButton(tablist: HTMLElement): void {
    const row = document.createElement('div')
    row.className = ACTIONS_CLASS
    // Top-align with the tab labels (tabs sit at the top of the row with an
    // 11px active-bar zone below); no top padding so the button content sits on
    // the same baseline as the tab text.
    row.style.cssText = 'display:flex;align-items:flex-start;gap:6px;margin-left:auto;flex:none;'
    const share = document.createElement('button')
    share.type = 'button'
    share.title = '分享对话截图'
    share.setAttribute('aria-label', '分享对话截图')
    share.style.cssText = shareButtonStyle()
    share.innerHTML = shareIconSVG()
    share.addEventListener('click', () => this.toggle())
    row.append(share)
    tablist.append(row)
    this.tablist = tablist
    this.actionsRow = row
    this.shareButton = share
  }

  private teardownButton(): void {
    this.actionsRow?.remove()
    this.actionsRow = null
    this.shareButton = null
    this.cancelButton = null
    this.confirmButton = null
    this.tablist = null
  }

  // ---- mode switching ---------------------------------------------------

  private toggle(): void {
    if (this.active) this.deactivate()
    else this.activate()
  }

  private activate(): void {
    if (this.active || this.disposed) return
    switchToChatTab()
    const scrollport = findScrollport()
    const flowList = findFlowList()
    if (scrollport === null || flowList === null) {
      showToast('当前会话还没有可分享的对话内容')
      return
    }
    this.showActionButtons()
    this.active = true
    this.setShareActive(true)
    this.overlay = new MarkerOverlay({ onDetach: () => this.deactivate(), isStreaming: () => this.sessionRunning() })
    this.overlay.activate(scrollport, flowList)
    if (this.sessionRunning()) showToast('对话仍在生成中，标记位置可能随新消息变化')
  }

  private deactivate(): void {
    if (this.disposed) return
    this.overlay?.dispose()
    this.overlay = null
    this.hideActionButtons()
    this.active = false
    this.setShareActive(false)
  }

  /** Highlight the share icon while share mode is active so it reads as a toggle. */
  private setShareActive(active: boolean): void {
    const share = this.shareButton
    if (share === null) return
    if (active) {
      share.style.color = 'var(--dsw-alias-state-business-primary, #3964fe)'
      share.setAttribute('aria-pressed', 'true')
    } else {
      share.style.color = ''
      share.removeAttribute('aria-pressed')
    }
  }

  private sessionRunning(): boolean {
    try {
      const list = this.ctx.sessions.list.getSnapshot()
      const id = list.current
      if (id === undefined) return false
      return list.byId[id]?.running ?? false
    } catch {
      return false
    }
  }

  /** Human-facing title of the current session, for the download filename. */
  private currentTitle(): string {
    try {
      const list = this.ctx.sessions.list.getSnapshot()
      const id = list.current
      if (id === undefined) return ''
      const summary = list.byId[id]
      return summary?.displayTitle ?? summary?.title ?? ''
    } catch {
      return ''
    }
  }

  // ---- action buttons ---------------------------------------------------

  private showActionButtons(): void {
    const row = this.actionsRow
    const share = this.shareButton
    if (row === null || share === null || this.cancelButton !== null) return
    const cancel = document.createElement('button')
    cancel.type = 'button'
    cancel.textContent = '取消'
    cancel.style.cssText = ghostButtonStyle()
    cancel.addEventListener('click', () => this.deactivate())
    const confirm = document.createElement('button')
    confirm.type = 'button'
    confirm.textContent = '确认'
    confirm.style.cssText = primaryButtonStyle()
    confirm.addEventListener('click', () => {
      const range = this.overlay?.currentRange()
      if (range !== null && range !== undefined) {
        void this.confirm(range.startEl, range.endEl, range.startEdge, range.endEdge)
      }
    })
    // Buttons appear to the RIGHT of the share icon, so the icon shifts left.
    row.append(cancel, confirm)
    this.cancelButton = cancel
    this.confirmButton = confirm
  }

  private hideActionButtons(): void {
    this.cancelButton?.remove()
    this.confirmButton?.remove()
    this.cancelButton = null
    this.confirmButton = null
  }

  // ---- capture ----------------------------------------------------------

  private async confirm(
    startEl: HTMLElement,
    endEl: HTMLElement,
    startEdge: number,
    endEdge: number,
  ): Promise<void> {
    const scrollport = findScrollport()
    const flowList = findFlowList()
    if (scrollport === null || flowList === null) {
      showToast('对话流已变化，请重新选择范围')
      this.deactivate()
      return
    }
    this.deactivate()
    // Pin a "generating" notice for the (potentially multi-second) render; it
    // is replaced by the error toast on failure or cleared on success.
    showToast('正在生成截图…', 0)
    try {
      const output = await captureRange({
        scrollport,
        flowList,
        startEl,
        endEl,
        startEdge,
        endEdge,
        brandSvg: findBrandSvg(),
        themeBg: resolveThemeBackground(),
      })
      dismissToast()
      this.modal.show(output, this.currentTitle())
    } catch (error) {
      showToast(`截图生成失败：${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

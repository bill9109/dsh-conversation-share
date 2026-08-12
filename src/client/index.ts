/**
 * dsh-conversation-share — browser half.
 *
 * Mounts the share-flow controller: a share icon at the right end of the
 * 对话/轨迹 tab row, a 取消/确认 button pair, draggable magnetic range markers
 * over the chat flow, and a PNG long-image capture with the Harness brand
 * footer.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { ShareController } from './controller.ts'
import { captureRange } from './capture.ts'

export const inject = ['sessions']

// Debug/testing handle: lets the page exercise the capture pipeline directly
// (used by automated verification).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).__dshShareDebug = { captureRange }

/** Mount the browser-side share feature. */
export function apply(ctx: ClientContext): void {
  const controller = new ShareController(ctx)
  controller.attach()
  ctx.effect(() => () => controller.dispose(), 'conversation-share: browser feature lifecycle')
}

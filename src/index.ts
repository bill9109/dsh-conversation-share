/**
 * dsh-conversation-share — host half.
 *
 * The conversation-share feature is entirely browser-side (see
 * src/client). This plugin node exists so the profile loader registers the
 * bundle and discovers its dsh.client declaration; it performs no host work.
 */
import type { Context } from '@deepseek-ai/cordis'

export const inject: readonly string[] = []

/** Mount the (no-op) host plugin node. */
export function apply(ctx: Context): void {
  void ctx
}

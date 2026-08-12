/**
 * dsh-conversation-share — browser half.
 *
 * Mounts the share-flow controller: a share icon at the right end of the
 * 对话/轨迹 tab row, a 取消/确认 button pair, draggable magnetic range markers
 * over the chat flow, and a PNG long-image capture with the Harness brand
 * footer.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
export declare const inject: string[];
/** Mount the browser-side share feature. */
export declare function apply(ctx: ClientContext): void;

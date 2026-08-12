/** Inline SVG icons and the chrome styles for the share controls. */
import { themeColors } from './theme.ts'
export { themeColors } from './theme.ts'

/** Share icon: box with an up arrow (the widely-used share/upload glyph). */
export function shareIconSVG(): string {
  return [
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"',
    ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
    '<path d="M12 3v12"/>',
    '<path d="m7 8 5-5 5 5"/>',
    '<path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>',
    '</svg>',
  ].join('')
}

/** Drag grip: six dots, used on the range marker pills. */
export function gripIconSVG(): string {
  return [
    '<svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" aria-hidden="true">',
    '<circle cx="2" cy="2" r="1.1"/><circle cx="6" cy="2" r="1.1"/>',
    '<circle cx="2" cy="6" r="1.1"/><circle cx="6" cy="6" r="1.1"/>',
    '<circle cx="2" cy="10" r="1.1"/><circle cx="6" cy="10" r="1.1"/>',
    '</svg>',
  ].join('')
}

const FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif"

/** The tab-row share icon button. */
export function shareButtonStyle(): string {
  const c = themeColors()
  return [
    'display:flex;align-items:center;justify-content:center;',
    'width:24px;height:20px;padding:0;border:none;border-radius:6px;',
    'background:transparent;color:var(--dsw-alias-label-tertiary, ' + c.labelTertiary + ');',
    'cursor:pointer;flex:none;',
  ].join('')
}

/** Ghost 取消 button. */
export function ghostButtonStyle(): string {
  const c = themeColors()
  return [
    'display:inline-flex;align-items:center;justify-content:center;',
    'height:20px;box-sizing:border-box;padding:0 12px;',
    'border:1px solid var(--dsw-alias-border-l2, ' + c.borderL2 + ');',
    'border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary, ' + c.labelSecondary + ');',
    'font:500 13px/16px ' + FONT_STACK + ';cursor:pointer;flex:none;',
  ].join('')
}

/** Primary 确认 button. */
export function primaryButtonStyle(): string {
  const c = themeColors()
  return [
    'display:inline-flex;align-items:center;justify-content:center;',
    'height:20px;box-sizing:border-box;padding:0 12px;',
    // A same-color border keeps it the same box height as the ghost button.
    'border:1px solid var(--dsw-alias-state-business-primary, ' + c.businessPrimary + ');',
    'border-radius:6px;background:var(--dsw-alias-state-business-primary, ' + c.businessPrimary + ');color:#ffffff;',
    'font:500 13px/16px ' + FONT_STACK + ';cursor:pointer;flex:none;',
  ].join('')
}

/** Shared pill/line font stack for the marker chrome. */
export const chromeFontStack = FONT_STACK

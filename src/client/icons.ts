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


/** Small share icon sized like the Session log button's trailing glyph. */
export function headerShareIconSVG(): string {
  return [
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"',
    ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
    '<path d="M12 3v12"/>',
    '<path d="m7 8 5-5 5 5"/>',
    '<path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>',
    '</svg>',
  ].join('')
}

/**
 * The header share pill, styled like the Session log button: 13px text on a
 * transparent pill with a hairline border.
 */
export function headerShareButtonStyle(): string {
  const c = themeColors()
  return [
    'display:inline-flex;align-items:center;gap:5px;',
    'height:32px;box-sizing:border-box;padding:0 12px;',
    'border:1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.1));',
    'border-radius:18px;background:transparent;',
    'color:var(--dsw-alias-label-primary, ' + c.labelPrimary + ');',
    'font:400 13px/20px ' + FONT_STACK + ';cursor:pointer;flex:none;',
  ].join('')
}

/** Active (share mode on) variant: primary border + tinted fill + primary ink. */
export function headerShareButtonActiveStyle(): string {
  const c = themeColors()
  return [
    'border-color:var(--dsw-alias-state-business-primary, ' + c.businessPrimary + ');',
    'background:color-mix(in srgb, var(--dsw-alias-state-business-primary, ' + c.businessPrimary + ') 8%, transparent);',
    'color:var(--dsw-alias-state-business-primary, ' + c.businessPrimary + ');',
  ].join('')
}
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

/** Ghost 取消 button — same pill shape as the share button. */
export function ghostButtonStyle(): string {
  const c = themeColors()
  return [
    'display:inline-flex;align-items:center;justify-content:center;',
    'height:32px;box-sizing:border-box;padding:0 12px;',
    'border:1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.1));',
    'border-radius:18px;background:transparent;color:var(--dsw-alias-label-secondary, ' + c.labelSecondary + ');',
    'font:400 13px/20px ' + FONT_STACK + ';cursor:pointer;flex:none;',
  ].join('')
}

/** Primary 确认 button — pill shape, same box as the share/ghost buttons. */
export function primaryButtonStyle(): string {
  const c = themeColors()
  return [
    'display:inline-flex;align-items:center;justify-content:center;',
    'height:32px;box-sizing:border-box;padding:0 12px;',
    // A same-color border keeps the box identical to the ghost button.
    'border:1px solid var(--dsw-alias-state-business-primary, ' + c.businessPrimary + ');',
    'border-radius:18px;background:var(--dsw-alias-state-business-primary, ' + c.businessPrimary + ');color:#ffffff;',
    'font:400 13px/20px ' + FONT_STACK + ';cursor:pointer;flex:none;',
  ].join('')
}

/** Shared pill/line font stack for the marker chrome. */
export const chromeFontStack = FONT_STACK

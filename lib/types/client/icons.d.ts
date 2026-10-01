export { themeColors } from './theme.ts';
/** Share icon: box with an up arrow (the widely-used share/upload glyph). */
export declare function shareIconSVG(): string;
/** Drag grip: six dots, used on the range marker pills. */
export declare function gripIconSVG(): string;
/** Small share icon sized like the Session log button's trailing glyph. */
export declare function headerShareIconSVG(): string;
/**
 * The header share pill, styled like the Session log button: 13px text on a
 * transparent pill with a hairline border.
 */
export declare function headerShareButtonStyle(): string;
/** Active (share mode on) variant: primary border + tinted fill + primary ink. */
export declare function headerShareButtonActiveStyle(): string;
/** The tab-row share icon button. */
export declare function shareButtonStyle(): string;
/** Ghost 取消 button — same pill shape as the share button. */
export declare function ghostButtonStyle(): string;
/** Primary 确认 button — pill shape, same box as the share/ghost buttons. */
export declare function primaryButtonStyle(): string;
/** Hover fill for the header share pill — matches the Session log button's :hover. */
export declare const headerShareHoverBackground = "var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06))";
/** Hover fill for the ghost (取消) button — the shared secondary hover. */
export declare function ghostButtonHoverBackground(): string;
/** Hover fill for the primary (确认) button: a touch darker business primary. */
export declare function primaryButtonHoverBackground(): string;
/** Restore the non-hover fill for the primary (确认) button. */
export declare function primaryButtonBackground(): string;
/** Shared pill/line font stack for the marker chrome. */
export declare const chromeFontStack = "-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif";

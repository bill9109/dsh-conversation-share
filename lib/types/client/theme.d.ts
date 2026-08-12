/** Resolve live theme colors from the document (tokens resolve per build). */
export interface ThemeColors {
    businessPrimary: string;
    labelPrimary: string;
    labelSecondary: string;
    labelTertiary: string;
    bgBase: string;
    bgRaise: string;
    borderL2: string;
}
/** Snapshot of the design-token colors used by the share chrome. */
export declare function themeColors(): ThemeColors;
/**
 * Resolve the effective page background behind the conversation column, so
 * the capture's side padding matches the surrounding page color exactly.
 */
export declare function resolveThemeBackground(): string;

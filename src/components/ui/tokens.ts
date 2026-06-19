/**
 * Design tokens do "Diário da Guilda" — fonte única de verdade em runtime.
 *
 * As mesmas cores estão registradas no Tailwind (tailwind.config.ts) como
 * utilitários (`text-guild-gold`, `bg-guild-bg2`, etc.). Estes valores em JS
 * existem para casos que precisam do hex em runtime (cores dinâmicas de tags /
 * fios soltos vindas de dados) e para a vitrine do design system.
 */

export const colors = {
  bg1: "#1a0a00",
  bg2: "#2d1200",
  gold: "#e8c46a",
  goldsoft: "#d4a04a",
  muted: "#a07a40",
  border: "#8b5e1a",
  red: "#e07050",
  purple: "#9a60d8",
  green: "#4a7d3e",
  danger: "#8b3a1a",
} as const;

export type ColorToken = keyof typeof colors;

/** Cores de acento usadas em dados (tags de sessão, fios soltos). */
export const accent = {
  purple: colors.purple,
  amber: colors.goldsoft,
  red: colors.red,
  gray: colors.muted,
} as const;

export const fonts = {
  heading: "Cinzel, Georgia, serif",
  body: "Crimson Pro, Georgia, serif",
} as const;

/**
 * Opacidades-padrão para "tingir" uma cor de acento (usadas como sufixo hex):
 * `${color}${tint.bg}` para fundo, `${color}${tint.border}` para borda.
 */
export const tint = {
  bg: "1a", // ~10%
  border: "66", // ~40%
} as const;

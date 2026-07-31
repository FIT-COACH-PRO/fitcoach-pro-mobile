import { MD3LightTheme, MD3DarkTheme, useTheme, type MD3Theme } from 'react-native-paper';
import {
  DefaultTheme as NavLightTheme,
  DarkTheme as NavDarkTheme,
  type Theme as NavTheme,
} from '@react-navigation/native';
import { colors, type ColorTokens } from './colors';

export { colors, spacing, radius, fontSize } from './colors';

/** Mesma forma que ColorTokens, mas com valores livres (o dark preenche os mesmos slots). */
export type ThemeTokens = {
  [Group in keyof ColorTokens]: { [Slot in keyof ColorTokens[Group]]: string };
};

export type AppTheme = MD3Theme & { tokens: ThemeTokens };

/**
 * Tokens do modo escuro — redesign dark UI (acento laranja vibrante).
 * Único tema do app; ver redesign-dark-ui.md Fase 1.
 */
const darkTokens: ThemeTokens = {
  surface: {
    page: '#14100C',
    card: '#221B14',
    sunken: '#2C241B',
    divider: '#3A2F24',
    frame: '#000000',
  },
  text: {
    primary: '#F4EFE8',
    secondary: '#A6988A',
    muted: '#6E6257',
    onDark: '#F4EFE8',
    onAccent: '#FFFFFF',
  },
  accent: {
    base: '#F0641E',
    hover: '#D5541A',
    pressed: '#B8460F',
    subtle: '#3A2415',
  },
  success: {
    base: '#5BBF6B',
    hover: '#4AA85A',
    subtle: '#1E3322',
  },
  warning: {
    base: '#E8A13D',
    subtle: '#382A14',
  },
  danger: {
    base: '#E05252',
    hover: '#C74444',
    subtle: '#381A1A',
  },
};

// Paleta bege/laranja-brasa do tema claro anterior — sem uso desde o redesign
// dark (redesign-dark-ui.md Fase 1). Mantida no código, não apagar.
const lightTokens: ThemeTokens = colors;

/** Mapeia os tokens semânticos nos slots de cor do MD3 (Paper). */
function buildColors(base: MD3Theme, t: ThemeTokens): MD3Theme['colors'] {
  return {
    ...base.colors,
    primary: t.accent.base,
    onPrimary: t.text.onAccent,
    primaryContainer: t.accent.subtle,
    onPrimaryContainer: t.accent.hover,
    secondary: t.success.base,
    onSecondary: t.text.onDark,
    secondaryContainer: t.success.subtle,
    onSecondaryContainer: t.success.hover,
    background: t.surface.page,
    onBackground: t.text.primary,
    surface: t.surface.card,
    onSurface: t.text.primary,
    surfaceVariant: t.surface.sunken,
    onSurfaceVariant: t.text.secondary,
    surfaceDisabled: t.surface.sunken,
    onSurfaceDisabled: t.text.muted,
    outline: t.surface.divider,
    outlineVariant: t.surface.divider,
    error: t.danger.base,
    onError: t.text.onDark,
    errorContainer: t.danger.subtle,
    onErrorContainer: t.danger.hover,
    elevation: {
      ...base.colors.elevation,
      level0: 'transparent',
      level1: t.surface.card,
      level2: t.surface.card,
      level3: t.surface.card,
      level4: t.surface.card,
      level5: t.surface.card,
    },
  };
}

export const lightTheme: AppTheme = {
  ...MD3LightTheme,
  colors: buildColors(MD3LightTheme, lightTokens),
  tokens: lightTokens,
};

export const darkTheme: AppTheme = {
  ...MD3DarkTheme,
  colors: buildColors(MD3DarkTheme, darkTokens),
  tokens: darkTokens,
};

/** Tema do react-navigation derivado do tema do app (barra de tabs, headers, fundo). */
export function navigationTheme(theme: AppTheme): NavTheme {
  const base = theme.dark ? NavDarkTheme : NavLightTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.tokens.accent.base,
      background: theme.tokens.surface.page,
      card: theme.tokens.surface.card,
      text: theme.tokens.text.primary,
      border: theme.tokens.surface.divider,
      notification: theme.tokens.accent.base,
    },
  };
}

export const useAppTheme = () => useTheme<AppTheme>();

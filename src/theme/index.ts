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
 * Tokens do modo escuro.
 *
 * ⚠️  Estes valores NÃO vêm da paleta oficial — ela é light-only (bege areia).
 * As superfícies/textos abaixo saem do MD3DarkTheme do Paper e as cores de marca
 * são versões clareadas das oficiais, só para manter contraste legível no escuro.
 * Quando a paleta escura oficial existir, é só trocar este bloco.
 */
const darkTokens: ThemeTokens = {
  surface: {
    page: MD3DarkTheme.colors.background,
    card: MD3DarkTheme.colors.surface,
    sunken: MD3DarkTheme.colors.surfaceVariant,
    divider: MD3DarkTheme.colors.outlineVariant,
    frame: colors.surface.frame,
  },
  text: {
    primary: MD3DarkTheme.colors.onSurface,
    secondary: MD3DarkTheme.colors.onSurfaceVariant,
    muted: MD3DarkTheme.colors.outline,
    onDark: MD3DarkTheme.colors.onSurface,
    onAccent: '#1F1B15',
  },
  accent: {
    base: '#F97316',
    hover: '#FB8A3C',
    pressed: '#EA6A0A',
    subtle: '#4A2A14',
  },
  success: {
    base: '#A3B565',
    hover: '#B6C77C',
    subtle: '#2E3520',
  },
  warning: {
    base: '#E0A64B',
    subtle: '#3D2E14',
  },
  danger: {
    base: '#EF6B6B',
    hover: '#F58686',
    subtle: '#3D1B1B',
  },
};

const lightTokens: ThemeTokens = colors;

export const lightTheme: AppTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.accent.base,
    onPrimary: colors.text.onAccent,
    primaryContainer: colors.accent.subtle,
    onPrimaryContainer: colors.accent.pressed,
    secondary: colors.success.base,
    onSecondary: colors.text.onDark,
    secondaryContainer: colors.success.subtle,
    onSecondaryContainer: colors.success.hover,
    background: colors.surface.page,
    onBackground: colors.text.primary,
    surface: colors.surface.card,
    onSurface: colors.text.primary,
    surfaceVariant: colors.surface.sunken,
    onSurfaceVariant: colors.text.secondary,
    surfaceDisabled: colors.surface.sunken,
    onSurfaceDisabled: colors.text.muted,
    outline: colors.surface.divider,
    outlineVariant: colors.surface.divider,
    error: colors.danger.base,
    onError: colors.text.onDark,
    errorContainer: colors.danger.subtle,
    onErrorContainer: colors.danger.hover,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: colors.surface.card,
      level2: colors.surface.card,
      level3: colors.surface.card,
      level4: colors.surface.card,
      level5: colors.surface.card,
    },
  },
  tokens: lightTokens,
};

export const darkTheme: AppTheme = {
  ...MD3DarkTheme,
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

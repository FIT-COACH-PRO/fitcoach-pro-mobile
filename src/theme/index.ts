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
 * Tokens do modo escuro — conforme o mockup dark (fundo quase preto, acento VERDE).
 *
 * ⚠️  Diferente do light, aqui o acento de ação é verde (não laranja). É intencional:
 * o mockup dark usa verde para botões, FAB e aba ativa; o light usa laranja-brasa.
 */
const darkTokens: ThemeTokens = {
  surface: {
    page: '#0E0E10', // fundo do app — quase preto
    card: '#1A1A1D', // cards e superfícies elevadas
    sunken: '#26262A', // círculos de ícone, chips
    divider: '#2C2C31', // linhas divisórias, borders sutis
    frame: '#000000',
  },
  text: {
    primary: '#F4F4F5', // títulos, números
    secondary: '#A1A1AA', // labels, datas, subtítulos
    muted: '#6B6B72', // placeholder, desabilitado
    onDark: '#F4F4F5',
    onAccent: '#052012', // texto sobre o verde vivo
  },
  accent: {
    base: '#22C55E', // verde vivo — ação, CTA, item ativo
    hover: '#16A34A',
    pressed: '#15803D',
    subtle: '#14331F', // background de badges/realces sutis
  },
  success: {
    base: '#4ADE80', // valores, dinheiro — verde claro
    hover: '#22C55E',
    subtle: '#14331F',
  },
  warning: {
    base: '#FBBF24', // pendências — âmbar
    subtle: '#3A2A0E',
  },
  danger: {
    base: '#F87171', // crítico/atrasado — vermelho
    hover: '#EF4444',
    subtle: '#3A1A1A',
  },
};

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

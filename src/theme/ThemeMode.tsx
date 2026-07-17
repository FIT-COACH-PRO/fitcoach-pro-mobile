import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'themeMode';

type ThemeModeContext = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const Ctx = createContext<ThemeModeContext>({ mode: 'light', setMode: () => {} });

/**
 * Preferência de tema do usuário. Padrão: 'light' (bege). 'system' segue o
 * esquema do aparelho. Persistida no AsyncStorage.
 */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      }
    });
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  return <Ctx.Provider value={{ mode, setMode }}>{children}</Ctx.Provider>;
}

export const useThemeMode = () => useContext(Ctx);

export const THEME_MODE_LABEL: Record<ThemeMode, string> = {
  light: 'Claro',
  dark: 'Escuro',
  system: 'Automático',
};

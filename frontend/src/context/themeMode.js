import { createContext, useContext } from 'react';

export const ThemeModeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);

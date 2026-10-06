import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'portfolio_color_mode';
const ColorModeContext = createContext({ mode: 'dark', toggle: () => {} });

const readSaved = () => {
  try { return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
};

/** Holds "light" or "dark", saves it, and puts the `dark` class on <html> (the CSS tokens key off that class). */
export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(readSaved);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* private mode: just don't remember it */ }
  }, [mode]);

  const toggle = useCallback(() => setMode((current) => (current === 'dark' ? 'light' : 'dark')), []);
  const value = useMemo(() => ({ mode, toggle }), [mode, toggle]);
  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>;
}

export const useColorMode = () => useContext(ColorModeContext);

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getStyles } from '../services/api';
import type { Style } from '../types';

interface StyleContextValue {
  styles: Style[];
  stylesLoading: boolean;
  stylesError: string | null;
  refreshStyles: () => void;
  selectedStyleId: string | null;
  selectedStyleName: string | undefined;
  selectStyle: (id: string) => void;
  clearSelection: () => void;
}

const StyleContext = createContext<StyleContextValue | null>(null);

export function StyleProvider({ children }: { children: React.ReactNode }) {
  const [styles, setStyles] = useState<Style[]>([]);
  const [stylesLoading, setStylesLoading] = useState(true);
  const [stylesError, setStylesError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);

  useEffect(() => {
    setStylesLoading(true);
    setStylesError(null);
    getStyles()
      .then(setStyles)
      .catch((err) => {
        console.error('Failed to load styles:', err);
        setStylesError('Unable to load styles. The service may be temporarily unavailable.');
      })
      .finally(() => setStylesLoading(false));
  }, [version]);

  const selectedStyleName = selectedStyleId
    ? styles.find(s => s.id === selectedStyleId)?.name
    : undefined;

  const refreshStyles = useCallback(() => setVersion(v => v + 1), []);
  const selectStyle = useCallback((id: string) => setSelectedStyleId(id), []);
  const clearSelection = useCallback(() => setSelectedStyleId(null), []);

  return (
    <StyleContext.Provider value={{
      styles, stylesLoading, stylesError, refreshStyles,
      selectedStyleId, selectedStyleName, selectStyle, clearSelection,
    }}>
      {children}
    </StyleContext.Provider>
  );
}

export function useStyleContext() {
  const ctx = useContext(StyleContext);
  if (!ctx) throw new Error('useStyleContext must be used within StyleProvider');
  return ctx;
}

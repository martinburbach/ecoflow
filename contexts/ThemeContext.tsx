import { useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useApp } from './AppContext';

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  card: string;
  shadow: string;
}

const lightTheme: ThemeColors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  primary: '#10B981',
  secondary: '#6B7280',
  accent: '#3B82F6',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  card: '#FFFFFF',
  shadow: '#000000',
};

const darkTheme: ThemeColors = {
  background: '#111827',
  surface: '#1F2937',
  primary: '#10B981',
  secondary: '#9CA3AF',
  accent: '#60A5FA',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  border: '#374151',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#60A5FA',
  card: '#1F2937',
  shadow: '#000000',
};

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const { theme } = useApp();
  
  return useMemo(() => {
    const colors = theme === 'dark' ? darkTheme : lightTheme;
    const isDark = theme === 'dark';
    
    return {
      colors,
      isDark,
      theme,
    };
  }, [theme]);
});

export { lightTheme, darkTheme };
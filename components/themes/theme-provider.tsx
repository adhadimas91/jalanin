'use client';

import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from 'next-themes';

  export default function ThemeProvider({ children, scriptProps, ...props }: ThemeProviderProps) {
    return (
      <NextThemesProvider
        scriptProps={{
          type: typeof window === 'undefined' ? undefined : 'application/json',
          ...scriptProps
        }}
        {...props}
      >
        {children}
      </NextThemesProvider>
    );
  }

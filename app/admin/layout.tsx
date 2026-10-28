import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import ThemeProvider from '@/components/themes/theme-provider';
import { ActiveThemeProvider } from '@/components/themes/active-theme';
import { DEFAULT_THEME, THEMES } from '@/components/themes/theme.config';
import { Toaster } from '@/components/ui/sonner';
import './styles/admin.css';

export const metadata: Metadata = {
  title: 'Admin Console — Jalanin',
  description: 'Backoffice dashboard untuk mengelola seluruh data Jalanin.',
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get('active_theme')?.value;
  const isValidTheme = THEMES.some((t) => t.value === activeThemeValue);
  const themeToApply = isValidTheme ? activeThemeValue! : DEFAULT_THEME;

  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='light'
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <ActiveThemeProvider initialTheme={themeToApply}>
          <div
            data-theme={themeToApply}
            className='bg-background text-foreground min-h-svh overflow-x-hidden overscroll-none font-sans antialiased'
          >
            <Toaster />
            {children}
          </div>
      </ActiveThemeProvider>
    </ThemeProvider>
  );
}


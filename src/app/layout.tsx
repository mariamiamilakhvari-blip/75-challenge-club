import { Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { type ReactNode } from 'react';

import { APP_DESCRIPTION, APP_NAME } from '@/shared/const/app.const';
import { ThemeProvider } from '@/shared/providers/theme-provider';

import type { Metadata } from 'next';

import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const jakartaHeading = Plus_Jakarta_Sans({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['700', '800'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${jakartaHeading.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'One82 — Portfolio Intelligence for ISOs',
  description: 'Real-time portfolio analytics, AI-powered statement analysis, and per-rep profitability for payment ISOs.'
};

const tailwindConfigScript = `
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          brand: {
            charcoal: '#1f2937',
            white: '#ffffff',
            lightgray: '#f3f4f6',
            gray: '#374151'
          },
          primary: {
            50: 'rgb(var(--color-primary-50) / <alpha-value>)',
            100: 'rgb(var(--color-primary-100) / <alpha-value>)',
            500: 'rgb(var(--color-primary-500) / <alpha-value>)',
            600: 'rgb(var(--color-primary-600) / <alpha-value>)',
            700: 'rgb(var(--color-primary-700) / <alpha-value>)',
            800: 'rgb(var(--color-primary-800) / <alpha-value>)',
            900: 'rgb(var(--color-primary-900) / <alpha-value>)'
          },
          profit: '#22c55e',
          loss: '#ef4444',
          warn: '#f59e0b',
          info: '#3b82f6'
        },
        fontFamily: {
          sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
          mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace']
        }
      }
    }
  };
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com" />
        <script dangerouslySetInnerHTML={{ __html: tailwindConfigScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-inter' });

export const metadata = {
  title: 'Portfolio & Labs',
  description: 'Trang web cá nhân và hệ thống mô phỏng thực hành.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning className="scroll-smooth">
      <head />
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900 dark:bg-[#1c1e29] dark:text-zinc-100 transition-colors duration-300 selection:bg-zinc-800 selection:text-white dark:selection:bg-zinc-200 dark:selection:text-zinc-900`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}

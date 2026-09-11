import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';

const inter = { variable: 'font-sans' };

export const metadata = {
  title: 'STEM HUB - Hệ sinh thái học tập số với phòng thí nghiệm ảo, thi đấu học thuật thời gian thực và game hóa trải nghiệm học tập',
  description: 'STEM HUB - Hệ sinh thái học tập số với phòng thí nghiệm ảo, thi đấu học thuật thời gian thực và game hóa trải nghiệm học tập',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning className="scroll-smooth" data-scroll-behavior="smooth">
      <head />
      <body suppressHydrationWarning className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900 dark:bg-[#1c1e29] dark:text-zinc-100 transition-colors duration-300 selection:bg-zinc-800 selection:text-white dark:selection:bg-zinc-200 dark:selection:text-zinc-900`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}

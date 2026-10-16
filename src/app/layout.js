import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';

const inter = { variable: 'font-sans' };

export const metadata = {
  metadataBase: new URL('https://ai.stem-hub.top'),
  title: 'STEM HUB - Kiến tạo hệ thống AI đa tầng hỗ trợ hệ sinh thái học tập số',
  description: 'Nền tảng thực hành khoa học tương tác cao: Mô phỏng vật lý, hóa học, sinh học, hình học không gian 3D, gia sư AI Socratic và đấu trường học thuật 1v1 thời gian thực.',
  keywords: ['STEM', 'Phòng thí nghiệm ảo', 'Hình học không gian 3D', 'AI gia sư', 'Toán Lý Hóa Sinh', 'STEM HUB', 'THPT Quốc Gia'],
  authors: [{ name: 'STEM HUB Team — THPT Quỳnh Lưu 4' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'STEM HUB - Kiến tạo hệ thống AI đa tầng hỗ trợ hệ sinh thái học tập số',
    description: 'Thực hành phòng thí nghiệm ảo 3D, trợ lý AI đa tầng và đấu trường học thuật đỉnh cao.',
    url: 'https://ai.stem-hub.top',
    siteName: 'STEM HUB',
    images: [
      {
        url: '/stem_hub_brand_banner.png',
        width: 1200,
        height: 630,
        alt: 'STEM HUB Platform Banner'
      }
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'STEM HUB - Kiến tạo hệ thống AI đa tầng hỗ trợ hệ sinh thái học tập số',
    description: 'Thực hành phòng thí nghiệm ảo 3D, trợ lý AI đa tầng và đấu trường học thuật đỉnh cao.',
    images: ['/stem_hub_brand_banner.png'],
  }
};


export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8F6FC' },
    { media: '(prefers-color-scheme: dark)', color: '#0F0B1A' }
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://generativelanguage.googleapis.com" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
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


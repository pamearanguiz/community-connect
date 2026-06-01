import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Community Connect',
  description: 'Plataforma de administración para comunidades residenciales',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html
        suppressHydrationWarning
        lang="es"
        className={`${geistSans.variable} ${geistMono.variable} scroll-smooth`}
      >
        <body suppressHydrationWarning className="bg-slate-50 text-slate-900">
          {children}
          <Toaster richColors position="top-right" expand={true} />
        </body>
      </html>
    </ClerkProvider>
  )
}

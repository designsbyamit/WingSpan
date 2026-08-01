// app/layout.tsx
import type { Metadata } from 'next'
import { Sora, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { WingspanProvider } from '@/context/WingspanContext'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Wingspan — Future Self Blueprint',
  description: 'Discover the patterns hidden in your career.',
  verification: {
    google: 'oLN6nHM8tsRnwQYdaYN9reXxItorFTB6FWE0in8dAtQ',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${plusJakarta.variable}`}>
      <body>
        <WingspanProvider>{children}</WingspanProvider>
      </body>
    </html>
  )
}

// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { WingspanProvider } from '@/context/WingspanContext'

export const metadata: Metadata = {
  title: 'Wingspan — Future Self Blueprint',
  description: 'Discover the patterns hidden in your career.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WingspanProvider>{children}</WingspanProvider>
      </body>
    </html>
  )
}

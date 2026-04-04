import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { WaterRipple } from '@/components/WaterRipple'

const font = Nunito({ subsets: ['latin'], weight: ['300', '400', '600', '700'] })

export const metadata: Metadata = {
  title: 'Bloomkin',
  description: 'Grow together through mentorship — skill-based mentor discovery',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={font.className}>
        <WaterRipple />
        {children}
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'

const font = Nunito({ subsets: ['latin'], weight: ['300', '400', '600', '700'] })

export const metadata: Metadata = {
  title: 'MentorMatch',
  description: 'Connect with mentors and mentees through skill-based discovery',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={font.className}>{children}</body>
    </html>
  )
}

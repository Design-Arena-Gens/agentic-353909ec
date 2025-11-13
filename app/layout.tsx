import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Excel Auto Filler',
  description: 'Automatically search and fill Excel data from the internet',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

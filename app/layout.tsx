import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import App from './App'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CopyFlow - AI Product Content Generator',
  description: 'Generate viral product content for any platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <App>
          {children}
        </App>
      </body>
    </html>
  )
}
import type { Metadata } from 'next'
import { UserProvider } from '@auth0/nextjs-auth0/client'
import './globals.css'

export const metadata: Metadata = {
  title: 'LedgerLock — AI-powered guardrails for your business finances',
  description: 'Your money moves only when you say so. AI-powered financial fraud prevention for SMEs.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  )
}

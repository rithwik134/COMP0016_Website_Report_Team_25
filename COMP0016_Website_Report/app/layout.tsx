import React from "react"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'
import { SiteNav } from '@/components/site-nav'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'COMP0016 Systems Engineering Project',
  description: 'Final Prototype Deliverables and Assessment - UCL Department of Computer Science',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SiteNav />
        <main className="lg:pl-64">{children}</main>
      </body>
    </html>
  )
}

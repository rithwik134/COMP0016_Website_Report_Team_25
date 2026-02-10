import { ReactNode } from 'react'

interface PageLayoutProps {
  title: string
  children: ReactNode
}

export function PageLayout({ title, children }: PageLayoutProps) {
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12 lg:px-8">
        <h1 className="text-4xl font-bold text-foreground mb-8 text-balance">{title}</h1>
        <div className="prose prose-slate max-w-none dark:prose-invert">
          {children}
        </div>
      </div>
    </div>
  )
}

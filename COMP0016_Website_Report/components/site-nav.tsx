'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  FileText, 
  Home, 
  ClipboardList, 
  Search, 
  Code, 
  Palette, 
  Layout, 
  Wrench, 
  TestTube, 
  BarChart, 
  BookOpen,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Requirements', href: '/requirements', icon: ClipboardList },
  { name: 'Research', href: '/research', icon: Search },
  { name: 'Algorithms', href: '/algorithms', icon: Code },
  { name: 'UI Design', href: '/ui-design', icon: Palette },
  { name: 'System Design', href: '/system-design', icon: Layout },
  { name: 'Implementation', href: '/implementation', icon: Wrench },
  { name: 'Testing', href: '/testing', icon: TestTube },
  { name: 'Evaluation', href: '/evaluation', icon: BarChart },
  { name: 'Appendices', href: '/appendices', icon: BookOpen },
]

export function SiteNav() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Desktop sidebar */}
      <nav className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r bg-card p-6 overflow-y-auto">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">COMP0016 Project</span>
          </Link>
        </div>
        
        <div className="flex flex-col gap-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <nav className="fixed left-0 top-0 h-screen w-64 flex-col border-r bg-card p-6 overflow-y-auto">
            <div className="mb-8 mt-12">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold text-foreground">COMP0016 Project</span>
              </Link>
            </div>
            
            <div className="flex flex-col gap-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  )
}

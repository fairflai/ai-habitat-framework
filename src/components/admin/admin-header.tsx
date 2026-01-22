'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const pathNames: Record<string, string> = {
  admin: 'Dashboard',
  users: 'Utenti',
  agents: 'Agenti',
  chats: 'Chat',
  audit: 'Audit Log',
  settings: 'Impostazioni',
}

export function AdminHeader() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/admin" className="flex items-center hover:text-foreground">
          <Home className="h-4 w-4" />
        </Link>

        {segments.map((segment, index) => {
          const href = '/' + segments.slice(0, index + 1).join('/')
          const isLast = index === segments.length - 1
          const displayName = pathNames[segment] || segment

          return (
            <div key={segment} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4" />
              {isLast ? (
                <span className="font-medium text-foreground">{displayName}</span>
              ) : (
                <Link href={href} className="hover:text-foreground">
                  {displayName}
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}

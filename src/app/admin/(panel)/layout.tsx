import { verifyAdminSession } from '@/lib/admin-auth'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await verifyAdminSession()

  return (
    <div className="flex h-screen">
      <AdminSidebar admin={session} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  )
}

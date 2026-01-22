import { ChatSidebar } from '@/components/chat/sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="h-full overflow-hidden">
      <ChatSidebar />
      <SidebarInset className="h-full flex flex-col overflow-hidden">{children}</SidebarInset>
    </SidebarProvider>
  )
}

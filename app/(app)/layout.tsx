import { requireAuth } from '@/lib/auth'
import { ToastProvider } from '@/components/ui/Toast'
import AppShell from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()

  return (
    <ToastProvider>
      <AppShell user={user}>
        {children}
      </AppShell>
    </ToastProvider>
  )
}

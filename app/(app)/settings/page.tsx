import { requireRole } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Settings, BookOpen, Users } from 'lucide-react'
import SubjectsManager from '@/components/ui/SubjectsManager'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const user     = await requireRole(['principal'])
  const supabase = createServerSupabaseClient()

  const { data: appUsers } = await supabase
    .from('app_users')
    .select('id, email, full_name, role')
    .order('full_name')

  const roleLabels: Record<string, string> = {
    principal:   'Principal',
    admin_clerk: 'Admin Clerk',
    teacher:     'Teacher',
  }

  const roleBadge: Record<string, string> = {
    principal:   'bg-violet-50 text-violet-700 ring-1 ring-violet-200/60',
    admin_clerk: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',
    teacher:     'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  }

  return (
    <div className="page-container max-w-4xl mx-auto animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            Settings
          </h1>
          <p className="page-subtitle">Manage subjects and system users.</p>
        </div>
      </div>

      {/* Subjects */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900">Subjects</h2>
        </div>
        <SubjectsManager />
      </section>

      {/* App Users */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900">System Users</h2>
        </div>

        <div className="card overflow-hidden">
          {!appUsers || appUsers.length === 0 ? (
            <div className="empty-state py-10">
              <p className="text-sm text-slate-400">No users found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {appUsers.map(u => (
                <div key={u.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300
                                  flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-slate-600">
                      {u.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{u.full_name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                  <span className={`badge text-xs ${roleBadge[u.role] || ''}`}>
                    {roleLabels[u.role] || u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          To add or remove users, contact your Supabase project administrator.
        </p>
      </section>
    </div>
  )
}

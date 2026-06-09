import { requireAuth, canEdit } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Teacher } from '@/types'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import TeachersTable from '@/components/teachers/TeachersTable'

export const metadata = { title: 'Teachers' }

export default async function TeachersPage() {
  const user     = await requireAuth()
  const supabase = createServerSupabaseClient()

  const [{ data: teachers }, { data: subjects }] = await Promise.all([
    supabase
      .from('teachers')
      .select('*')
      .order('full_name', { ascending: true }),
    supabase
      .from('subjects')
      .select('*')
  ])

  const list = (teachers || []) as Teacher[]

  return (
    <div className="page-container animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Teachers
          </h1>
          <p className="page-subtitle">
            {list.length} staff member{list.length !== 1 ? 's' : ''} in the directory
          </p>
        </div>
        {canEdit(user.role) && (
          <Link href="/teachers/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Teacher
          </Link>
        )}
      </div>

      <TeachersTable teachers={list} subjects={subjects || []} canView={true} />
    </div>
  )
}

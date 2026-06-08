import { requireRole } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Teacher } from '@/types'
import { notFound } from 'next/navigation'
import TeacherForm from '@/components/teachers/TeacherForm'
import Link from 'next/link'
import { ArrowLeft, Edit } from 'lucide-react'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase.from('teachers').select('name_with_initials').eq('id', params.id).single()
  return { title: data ? `Edit ${data.name_with_initials}` : 'Edit Teacher' }
}

export default async function EditTeacherPage({ params }: { params: { id: string } }) {
  await requireRole(['principal', 'admin_clerk'])
  const supabase = createServerSupabaseClient()

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!teacher) notFound()

  const t = teacher as Teacher

  return (
    <div className="page-container max-w-4xl mx-auto animate-fade-in-up">
      <Link
        href={`/teachers/${params.id}`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800
                   transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to profile
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Edit className="w-6 h-6 text-emerald-600" />
            Edit Teacher
          </h1>
          <p className="page-subtitle">Updating {t.name_with_initials}&apos;s information.</p>
        </div>
      </div>

      <TeacherForm mode="edit" teacher={t} />
    </div>
  )
}

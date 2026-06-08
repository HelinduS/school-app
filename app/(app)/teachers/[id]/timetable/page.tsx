import { requireAuth, canEdit } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Teacher, TimetableSlot } from '@/types'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import TimetableEditor from '@/components/timetable/TimetableEditor'
import TimetableGrid   from '@/components/timetable/TimetableGrid'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase.from('teachers').select('name_with_initials').eq('id', params.id).single()
  return { title: data ? `${data.name_with_initials}'s Timetable` : 'Timetable' }
}

export default async function TeacherTimetablePage({ params }: { params: { id: string } }) {
  const user     = await requireAuth()
  const supabase = createServerSupabaseClient()

  const [{ data: teacher }, { data: slots }, { data: subjects }] = await Promise.all([
    supabase.from('teachers').select('*').eq('id', params.id).single(),
    supabase.from('timetable').select('*, subject:subjects(*)').eq('teacher_id', params.id).order('day').order('period'),
    supabase.from('subjects').select('*').order('name'),
  ])

  if (!teacher) notFound()

  const t = teacher as Teacher
  const canModify = canEdit(user.role)

  return (
    <div className="page-container max-w-6xl mx-auto animate-fade-in-up">
      {/* Back link */}
      <Link
        href={`/teachers/${params.id}`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800
                   transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to profile
      </Link>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-emerald-600" />
            {t.name_with_initials}&apos;s Timetable
          </h1>
          <p className="page-subtitle">Weekly teaching schedule</p>
        </div>
      </div>

      {canModify ? (
        <TimetableEditor
          teacherId={t.id}
          initialSlots={(slots || []) as TimetableSlot[]}
          subjects={subjects || []}
        />
      ) : (
        <TimetableGrid slots={(slots || []) as TimetableSlot[]} teacherName={t.name_with_initials} />
      )}
    </div>
  )
}

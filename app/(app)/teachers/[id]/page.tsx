import { requireAuth, canEdit, canDelete } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Teacher, EmploymentHistory, TimetableSlot } from '@/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, Edit, Phone, Mail, MapPin, Calendar,
  GraduationCap, Briefcase, CalendarDays, CreditCard,
  Award, Clock, Building2, FileText, ExternalLink
} from 'lucide-react'
import DeleteTeacherButton from '@/components/teachers/DeleteTeacherButton'
import TeacherProfileTabs from '@/components/teachers/TeacherProfileTabs'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase.from('teachers').select('name_with_initials').eq('id', params.id).single()
  return { title: data?.name_with_initials ?? 'Teacher Profile' }
}

const AVATAR_COLORS = [
  { from: 'from-emerald-400', to: 'to-teal-500' },
  { from: 'from-violet-400',  to: 'to-purple-500' },
  { from: 'from-blue-400',    to: 'to-cyan-500' },
  { from: 'from-amber-400',   to: 'to-orange-500' },
  { from: 'from-rose-400',    to: 'to-pink-500' },
]

function avatarGradient(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const statusConfig = {
  active:      { label: 'Active',      cls: 'badge-active',       dot: 'bg-emerald-500' },
  on_leave:    { label: 'On Leave',    cls: 'badge-leave',        dot: 'bg-amber-500'   },
  transferred: { label: 'Transferred', cls: 'badge-transferred',  dot: 'bg-blue-500'    },
  retired:     { label: 'Retired',     cls: 'badge-retired',      dot: 'bg-slate-400'   },
}

const typeConfig = {
  permanent: 'badge-permanent',
  contract:  'badge-contract',
  temporary: 'badge-temporary',
}

function calculateAgeDetails(dobStr: string, targetDate: Date): { years: number; months: number; days: number } {
  if (!dobStr) return { years: 0, months: 0, days: 0 }
  const dob = new Date(dobStr)
  if (isNaN(dob.getTime())) return { years: 0, months: 0, days: 0 }

  let years = targetDate.getFullYear() - dob.getFullYear()
  let months = targetDate.getMonth() - dob.getMonth()
  let days = targetDate.getDate() - dob.getDate()

  if (days < 0) {
    const prevMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0)
    days += prevMonth.getDate()
    months -= 1
  }

  if (months < 0) {
    months += 12
    years -= 1
  }

  return { years, months, days }
}

function getRetirementDate(dobStr: string): string {
  if (!dobStr) return '—'
  const dob = new Date(dobStr)
  if (isNaN(dob.getTime())) return '—'
  const retirement = new Date(dob)
  retirement.setFullYear(dob.getFullYear() + 60)
  return retirement.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: '2-digit' })
}

export default async function TeacherProfilePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const [{ data: teacher }, { data: history }, { data: timetable }, { data: subjectsData }, user] = await Promise.all([
    supabase.from('teachers').select('*').eq('id', params.id).single(),
    supabase.from('employment_history').select('*').eq('teacher_id', params.id).order('date_from', { ascending: false }),
    supabase.from('timetable').select('*, subject:subjects(*)').eq('teacher_id', params.id).order('day').order('period'),
    supabase.from('subjects').select('*').order('name'),
    requireAuth(),
  ])

  if (!teacher) notFound()

  const t         = teacher as Teacher
  const canModify = canEdit(user.role)
  const canRemove = canDelete(user.role)
  const sc        = statusConfig[t.status] ?? statusConfig.active
  const tc        = typeConfig[t.employment_type] ?? 'badge-temporary'
  const av        = avatarGradient(t.full_name)

  const ageDetails = t.date_of_birth
    ? calculateAgeDetails(t.date_of_birth, new Date())
    : null

  const ageStr = ageDetails
    ? `${ageDetails.years}y ${ageDetails.months}m ${ageDetails.days}d`
    : null

  const retirementStr = t.date_of_birth
    ? getRetirementDate(t.date_of_birth)
    : null

  const serviceDetails = t.date_joined
    ? calculateAgeDetails(t.date_joined, new Date())
    : null

  const serviceStr = serviceDetails
    ? serviceDetails.years > 0
      ? `${serviceDetails.years} year${serviceDetails.years !== 1 ? 's' : ''}${serviceDetails.months > 0 ? `, ${serviceDetails.months} month${serviceDetails.months !== 1 ? 's' : ''}` : ''}`
      : serviceDetails.months > 0
        ? `${serviceDetails.months} month${serviceDetails.months !== 1 ? 's' : ''}`
        : `${serviceDetails.days} day${serviceDetails.days !== 1 ? 's' : ''}`
    : '0 days'

  return (
    <div className="page-container max-w-6xl mx-auto animate-fade-in-up">
      {/* ── Breadcrumb ──────────────────────────── */}
      <Link
        href="/teachers"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800
                   transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to teachers
      </Link>

      {/* ── Hero card ───────────────────────────── */}
      <div className="card overflow-hidden mb-6">
        {/* Banner */}
        <div className={`h-28 bg-gradient-to-r ${av.from} ${av.to} relative`}>
          <div className="absolute inset-0 opacity-20"
               style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 relative z-10">
            {/* Avatar */}
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${av.from} ${av.to}
                            flex items-center justify-center shadow-lg border-4 border-white flex-shrink-0`}>
              <span className="text-2xl font-bold text-white">{getInitials(t.full_name)}</span>
            </div>

            {/* Actions */}
            {canModify && (
              <div className="flex items-center gap-2">
                <Link href={`/teachers/${t.id}/edit`} className="btn-secondary">
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
                {canRemove && <DeleteTeacherButton teacherId={t.id} />}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-900">{t.name_with_initials}</h1>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                <span className={sc.cls}>{sc.label}</span>
              </div>
              <span className={tc}>{t.employment_type.charAt(0).toUpperCase() + t.employment_type.slice(1)}</span>
            </div>
            <p className="text-sm text-slate-500">{t.full_name}</p>
            <p className="text-sm font-medium text-slate-700 mt-1">{t.designation}</p>

            {/* Quick stats row */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Award className="w-4 h-4 text-emerald-500" />
                <span><span className="font-semibold text-slate-900">{serviceStr}</span> of service</span>
              </div>
              {ageStr && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>Age <span className="font-semibold text-slate-900">{ageStr}</span></span>
                </div>
              )}
              {retirementStr && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  <span>Retires <span className="font-semibold text-slate-900">{retirementStr}</span></span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Joined <span className="font-semibold text-slate-900">
                  {new Date(t.date_joined).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })}
                </span></span>
              </div>
              {t.status === 'transferred' && t.transferred_to && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Building2 className="w-4 h-4" />
                  <span>→ {t.transferred_to}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabbed content ──────────────────────── */}
      <TeacherProfileTabs
        teacher={t}
        history={(history || []) as EmploymentHistory[]}
        timetable={(timetable || []) as TimetableSlot[]}
        canModify={canModify}
        subjects={subjectsData || []}
      />
    </div>
  )
}

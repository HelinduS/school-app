import { requireAuth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { CalendarDays, ChevronRight, Users } from 'lucide-react'

export const metadata = { title: 'Timetable' }

const AVATAR_COLORS = [
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-violet-100',  text: 'text-violet-700'  },
  { bg: 'bg-blue-100',    text: 'text-blue-700'    },
  { bg: 'bg-amber-100',   text: 'text-amber-700'   },
  { bg: 'bg-rose-100',    text: 'text-rose-700'    },
]

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

const MAX_PERIODS = 40 // 5 days × 8 periods

export default async function TimetableOverviewPage() {
  await requireAuth()
  const supabase = createServerSupabaseClient()

  const [{ data: teachers }, { data: slots }] = await Promise.all([
    supabase
      .from('teachers')
      .select('id, full_name, name_with_initials, designation, status')
      .eq('status', 'active')
      .order('full_name'),
    supabase.from('timetable').select('teacher_id'),
  ])

  const slotCounts: Record<string, number> = {}
  for (const s of (slots || [])) {
    slotCounts[s.teacher_id] = (slotCounts[s.teacher_id] || 0) + 1
  }

  const teacherList = teachers || []

  return (
    <div className="page-container animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-emerald-600" />
            School Timetables
          </h1>
          <p className="page-subtitle">
            View and manage weekly teaching schedules for each staff member.
          </p>
        </div>
      </div>

      {/* Overall summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">Active Teachers</p>
          <p className="text-2xl font-bold text-slate-900">{teacherList.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">Total Assigned Periods</p>
          <p className="text-2xl font-bold text-slate-900">{slots?.length ?? 0}</p>
        </div>
        <div className="card p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-slate-500 mb-1">Avg Periods / Teacher</p>
          <p className="text-2xl font-bold text-slate-900">
            {teacherList.length > 0
              ? Math.round((slots?.length ?? 0) / teacherList.length)
              : 0}
          </p>
        </div>
      </div>

      {teacherList.length === 0 ? (
        <div className="card empty-state">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <Users className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="text-sm font-semibold text-slate-600 mb-1">No active teachers</h3>
          <p className="text-xs text-slate-400">Active staff will appear here once added.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {teacherList.map(t => {
            const count   = slotCounts[t.id] || 0
            const pct     = Math.round((count / MAX_PERIODS) * 100)
            const ac      = avatarColor(t.full_name)

            return (
              <Link
                key={t.id}
                href={`/teachers/${t.id}/timetable`}
                className="card-hover p-5 group"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-2xl ${ac.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-sm font-bold ${ac.text}`}>{getInitials(t.full_name)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{t.name_with_initials}</p>
                    <p className="text-xs text-slate-400 truncate">{t.designation}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500
                                           group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">Periods / week</span>
                    <span className="text-xs font-semibold text-slate-700">{count} / {MAX_PERIODS}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${
                        pct >= 75 ? 'bg-emerald-500' :
                        pct >= 40 ? 'bg-amber-400' : 'bg-slate-300'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className={`text-[10px] mt-1 font-medium ${
                    pct >= 75 ? 'text-emerald-600' :
                    pct >= 40 ? 'text-amber-600' : 'text-slate-400'
                  }`}>
                    {pct >= 75 ? 'Full schedule' : pct >= 40 ? 'Partial' : 'Sparse'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

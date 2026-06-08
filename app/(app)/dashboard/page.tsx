import { requireAuth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Users, UserCheck, Clock, BookOpen, CalendarDays, TrendingUp, ArrowRight, Award } from 'lucide-react'
import Link from 'next/link'
import { DashboardStats, Teacher } from '@/types'

async function getStats(): Promise<{ stats: DashboardStats; recent: Teacher[] }> {
  const supabase = createServerSupabaseClient()

  const [{ data: teachers }, { data: recent }] = await Promise.all([
    supabase.from('teachers').select('status, employment_type'),
    supabase
      .from('teachers')
      .select('id, full_name, name_with_initials, designation, status, date_joined')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const all = teachers || []
  return {
    stats: {
      total_teachers:   all.length,
      active_teachers:  all.filter(t => t.status === 'active').length,
      on_leave:         all.filter(t => t.status === 'on_leave').length,
      permanent:        all.filter(t => t.employment_type === 'permanent').length,
      contract:         all.filter(t => t.employment_type === 'contract').length,
    },
    recent: (recent || []) as Teacher[],
  }
}

function getInitials(name: string) {
  return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-violet-100',  text: 'text-violet-700'  },
  { bg: 'bg-blue-100',    text: 'text-blue-700'    },
  { bg: 'bg-amber-100',   text: 'text-amber-700'   },
  { bg: 'bg-rose-100',    text: 'text-rose-700'    },
]

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

const statusConfig = {
  active:      { label: 'Active',      cls: 'badge-active'      },
  on_leave:    { label: 'On Leave',    cls: 'badge-leave'       },
  transferred: { label: 'Transferred', cls: 'badge-transferred' },
  retired:     { label: 'Retired',     cls: 'badge-retired'     },
}

// Simple SVG donut chart
function DonutChart({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return (
    <div className="flex items-center justify-center w-32 h-32 rounded-full bg-slate-100">
      <span className="text-xs text-slate-400">No data</span>
    </div>
  )

  const r = 48
  const cx = 60
  const cy = 60
  const circumference = 2 * Math.PI * r
  let offset = 0

  const arcs = segments.map(seg => {
    const pct  = seg.value / total
    const dash = pct * circumference
    const arc  = { dash, offset, color: seg.color, label: seg.label, value: seg.value }
    offset    += dash
    return arc
  })

  return (
    <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="16" />
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth="16"
          strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
          strokeDashoffset={-arc.offset}
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

export default async function DashboardPage() {
  const [user, { stats, recent }] = await Promise.all([requireAuth(), getStats()])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user.full_name.split(' ')[0]

  const statCards = [
    {
      label:  'Total Staff',
      value:  stats.total_teachers,
      icon:   Users,
      from:   'from-blue-500',
      to:     'to-blue-600',
      shadow: 'shadow-blue-200',
      bg:     'bg-blue-50',
      text:   'text-blue-600',
    },
    {
      label:  'Active',
      value:  stats.active_teachers,
      icon:   UserCheck,
      from:   'from-emerald-500',
      to:     'to-teal-600',
      shadow: 'shadow-emerald-200',
      bg:     'bg-emerald-50',
      text:   'text-emerald-600',
    },
    {
      label:  'On Leave',
      value:  stats.on_leave,
      icon:   Clock,
      from:   'from-amber-400',
      to:     'to-orange-500',
      shadow: 'shadow-amber-200',
      bg:     'bg-amber-50',
      text:   'text-amber-600',
    },
    {
      label:  'Permanent',
      value:  stats.permanent,
      icon:   BookOpen,
      from:   'from-violet-500',
      to:     'to-purple-600',
      shadow: 'shadow-violet-200',
      bg:     'bg-violet-50',
      text:   'text-violet-600',
    },
  ]

  const donutSegments = [
    { value: stats.permanent, color: '#10b981', label: 'Permanent' },
    { value: stats.contract,  color: '#6366f1', label: 'Contract'  },
    { value: stats.on_leave,  color: '#f59e0b', label: 'On Leave'  },
  ]

  const breakdown = [
    { label: 'Permanent', value: stats.permanent, total: stats.total_teachers, color: 'bg-emerald-500' },
    { label: 'Contract',  value: stats.contract,  total: stats.total_teachers, color: 'bg-indigo-500'  },
    { label: 'On Leave',  value: stats.on_leave,  total: stats.total_teachers, color: 'bg-amber-400'   },
  ]

  const quickActions = [
    {
      href:  '/teachers/new',
      label: 'Add New Teacher',
      desc:  'Create a new staff profile',
      icon:  Users,
      from:  'from-emerald-400',
      to:    'to-teal-500',
      roles: ['principal', 'admin_clerk'],
    },
    {
      href:  '/teachers',
      label: 'View All Teachers',
      desc:  'Browse the staff directory',
      icon:  Users,
      from:  'from-blue-400',
      to:    'to-blue-500',
      roles: ['principal', 'admin_clerk', 'teacher'],
    },
    {
      href:  '/timetable',
      label: 'School Timetable',
      desc:  'View all teaching schedules',
      icon:  CalendarDays,
      from:  'from-violet-400',
      to:    'to-purple-500',
      roles: ['principal', 'admin_clerk', 'teacher'],
    },
  ].filter(a => a.roles.includes(user.role))

  return (
    <div className="page-container animate-fade-in-up">
      {/* ── Header ─────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">
              {greeting},{' '}
              <span className="gradient-text">{firstName}</span> 👋
            </h1>
            <p className="page-subtitle mt-1">
              Here's what's happening at your school today.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-700">System Online</span>
          </div>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, from, to, shadow, bg, text }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${from} ${to}
                              flex items-center justify-center shadow-md ${shadow}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className={`w-3 h-3 ${text}`} />
              <span className={`text-xs font-medium ${text}`}>
                {stats.total_teachers > 0
                  ? `${Math.round((value / stats.total_teachers) * 100)}% of total`
                  : 'No data yet'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main grid ──────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">

        {/* Quick Actions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-900">Quick Actions</h2>
            <Award className="w-4 h-4 text-slate-300" />
          </div>
          <div className="space-y-2">
            {quickActions.map(({ href, label, desc, icon: Icon, from, to }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50
                           transition-all duration-150 group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${from} ${to}
                                flex items-center justify-center flex-shrink-0 shadow-sm
                                group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500
                                       group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* Staff Breakdown */}
        <div className="card p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-900">Staff Breakdown</h2>
            <Link href="/teachers" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
              View all →
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            {/* Donut chart */}
            <div className="relative flex-shrink-0">
              <DonutChart segments={donutSegments} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">{stats.total_teachers}</span>
                <span className="text-[10px] text-slate-400 font-medium">TOTAL</span>
              </div>
            </div>

            {/* Legend + bars */}
            <div className="flex-1 w-full space-y-4">
              {breakdown.map(({ label, value, total, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-sm text-slate-600">{label}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{value}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${color}`}
                      style={{ width: total ? `${(value / total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Teachers ─────────────────── */}
      {recent.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recently Added</h2>
            <Link href="/teachers" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recent.map(t => {
              const ac = avatarColor(t.full_name)
              const sc = statusConfig[t.status] ?? statusConfig.active
              return (
                <Link
                  key={t.id}
                  href={`/teachers/${t.id}`}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/80 transition-colors group"
                >
                  <div className={`w-9 h-9 rounded-full ${ac.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-xs font-bold ${ac.text}`}>{getInitials(t.full_name)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{t.name_with_initials}</p>
                    <p className="text-xs text-slate-400 truncate">{t.designation}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={sc.cls}>{sc.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

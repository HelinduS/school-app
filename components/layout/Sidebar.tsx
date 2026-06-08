'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { AppUser } from '@/types'
import {
  GraduationCap, LayoutDashboard, Users, CalendarDays,
  LogOut, Settings, ChevronRight, Sparkles
} from 'lucide-react'
import clsx from 'clsx'

interface SidebarProps {
  user: AppUser
  onClose?: () => void
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/teachers',  icon: Users,           label: 'Teachers'  },
  { href: '/timetable', icon: CalendarDays,    label: 'Timetable' },
]

const adminItems = [
  { href: '/settings', icon: Settings, label: 'Settings' },
]

const roleConfig = {
  principal:   { label: 'Principal',   bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  admin_clerk: { label: 'Admin Clerk', bg: 'bg-blue-500/20',    text: 'text-blue-300'    },
  teacher:     { label: 'Teacher',     bg: 'bg-violet-500/20',  text: 'text-violet-300'  },
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

// Deterministic color based on user name
function getAvatarGradient(name: string) {
  const gradients = [
    'from-emerald-400 to-teal-500',
    'from-violet-400 to-purple-500',
    'from-blue-400 to-cyan-500',
    'from-amber-400 to-orange-500',
    'from-pink-400 to-rose-500',
  ]
  const idx = name.charCodeAt(0) % gradients.length
  return gradients[idx]
}

export default function Sidebar({ user, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const role   = roleConfig[user.role] ?? roleConfig.teacher
  const gradient = getAvatarGradient(user.full_name)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="flex flex-col h-full"
      style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)' }}
    >
      {/* ── Logo ─────────────────────── */}
      <div className="px-4 pt-5 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500
                          flex items-center justify-center shadow-lg shadow-emerald-900/40 flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">School Staff</p>
            <p className="text-[11px] text-slate-400 truncate">Management System</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ───────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Main Menu
        </p>

        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group',
                active
                  ? 'text-emerald-400'
                  : 'text-slate-400 hover:text-slate-100'
              )}
              style={active ? {
                background: 'rgba(16, 185, 129, 0.12)',
              } : undefined}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLElement).style.background = ''
              }}
            >
              {/* Active indicator */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-r-full" />
              )}
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          )
        })}

        {/* Admin section */}
        {user.role === 'principal' && (
          <>
            <div className="pt-4 pb-1.5">
              <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                Administration
              </p>
            </div>
            {adminItems.map(({ href, icon: Icon, label }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    active ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-100'
                  )}
                  style={active ? { background: 'rgba(16, 185, 129, 0.12)' } : undefined}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = ''
                  }}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-r-full" />
                  )}
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* ── Version badge ─────────────── */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 w-fit">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-medium">v2.0 — Upgraded</span>
        </div>
      </div>

      {/* ── User footer ──────────────── */}
      <div className="px-3 pb-4 border-t border-white/5 pt-3">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient}
                          flex items-center justify-center flex-shrink-0 shadow-md`}>
            <span className="text-[10px] font-bold text-white">{getInitials(user.full_name)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-200 truncate">{user.full_name}</p>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${role.bg} ${role.text}`}>
              {role.label}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-slate-500 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}

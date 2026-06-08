'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { AppUser } from '@/types'
import { Menu, X } from 'lucide-react'

export default function AppShell({
  user,
  children,
}: {
  user: AppUser
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ── Desktop sidebar ─────────── */}
      <div className="hidden md:flex w-64 min-h-screen flex-col flex-shrink-0 fixed left-0 top-0 bottom-0 z-30 shadow-xl shadow-slate-900/20">
        <Sidebar user={user} />
      </div>

      {/* ── Mobile overlay ──────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile sidebar ──────────── */}
      <div
        className={`
          fixed left-0 top-0 bottom-0 z-50 w-64 md:hidden shadow-2xl
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar user={user} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main content ────────────── */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-slate-200 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm">School Staff</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

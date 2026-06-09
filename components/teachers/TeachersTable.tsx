'use client'

import { useState, useMemo, useCallback } from 'react'
import { Teacher, Subject } from '@/types'
import Link from 'next/link'
import {
  Search, ChevronRight, ChevronUp, ChevronDown,
  LayoutGrid, List, Download, Users, ArrowUpDown, Filter, Calendar
} from 'lucide-react'

interface Props {
  teachers: Teacher[]
  subjects: Subject[]
  canView: boolean
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
  return retirement.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' })
}

type SortKey = 'full_name' | 'designation' | 'employment_type' | 'status' | 'date_joined'
type ViewMode = 'table' | 'grid'

const STATUS_CONFIG = {
  active:      { label: 'Active',      cls: 'badge-active'      },
  on_leave:    { label: 'On Leave',    cls: 'badge-leave'       },
  transferred: { label: 'Transferred', cls: 'badge-transferred' },
  retired:     { label: 'Retired',     cls: 'badge-retired'     },
}

const TYPE_CONFIG = {
  permanent: { label: 'Permanent', cls: 'badge-permanent' },
  contract:  { label: 'Contract',  cls: 'badge-contract'  },
  temporary: { label: 'Temporary', cls: 'badge-temporary' },
}

const AVATAR_COLORS = [
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-violet-100',  text: 'text-violet-700'  },
  { bg: 'bg-blue-100',    text: 'text-blue-700'    },
  { bg: 'bg-amber-100',   text: 'text-amber-700'   },
  { bg: 'bg-rose-100',    text: 'text-rose-700'    },
  { bg: 'bg-cyan-100',    text: 'text-cyan-700'    },
  { bg: 'bg-indigo-100',  text: 'text-indigo-700'  },
]

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

const PAGE_SIZE = 15

function exportCsv(teachers: Teacher[], subjects: Subject[], targetDate: Date) {
  const headers = [
    'Name with Initials',
    'Full Name',
    'NIC',
    'Designation',
    'Grade',
    'Subjects',
    'Date of Birth',
    `Age (Years) as of ${targetDate.toISOString().slice(0, 10)}`,
    `Age (Months) as of ${targetDate.toISOString().slice(0, 10)}`,
    `Age (Days) as of ${targetDate.toISOString().slice(0, 10)}`,
    'Retirement Date',
    'Employment Type',
    'Status',
    'Date Joined',
    'Phone',
    'Email',
    'Address'
  ]
  const rows = teachers.map(t => {
    const age = calculateAgeDetails(t.date_of_birth, targetDate)
    const mappedSubjects = (t.subject_ids || [])
      .map(id => subjects.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ')
    const retirementDate = getRetirementDate(t.date_of_birth)
    return [
      t.name_with_initials,
      t.full_name,
      t.nic,
      t.designation,
      t.grade || '—',
      mappedSubjects || '—',
      t.date_of_birth,
      age.years.toString(),
      age.months.toString(),
      age.days.toString(),
      retirementDate,
      t.employment_type,
      t.status,
      t.date_joined,
      t.phone,
      t.email ?? '',
      t.address,
    ]
  })
  const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `teachers-detailed-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function TeachersTable({ teachers, subjects, canView }: Props) {
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter,   setTypeFilter]   = useState('all')
  const [sortKey,      setSortKey]      = useState<SortKey>('full_name')
  const [sortAsc,      setSortAsc]      = useState(true)
  const [viewMode,     setViewMode]     = useState<ViewMode>('table')
  const [page,         setPage]         = useState(1)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [targetDateStr, setTargetDateStr] = useState<string>(new Date().toISOString().slice(0, 10))

  const targetDate = useMemo(() => {
    const d = new Date(targetDateStr)
    return isNaN(d.getTime()) ? new Date() : d
  }, [targetDateStr])

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortAsc(v => !v)
    else { setSortKey(key); setSortAsc(true) }
    setPage(1)
  }, [sortKey])

  const filtered = useMemo(() => {
    let result = teachers.filter(t => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        t.full_name.toLowerCase().includes(q) ||
        t.name_with_initials.toLowerCase().includes(q) ||
        t.designation.toLowerCase().includes(q) ||
        t.nic.toLowerCase().includes(q) ||
        (t.phone || '').includes(q)

      return matchSearch &&
        (statusFilter === 'all' || t.status === statusFilter) &&
        (typeFilter === 'all' || t.employment_type === typeFilter)
    })

    result = [...result].sort((a, b) => {
      const av = (a[sortKey] ?? '') as string
      const bv = (b[sortKey] ?? '') as string
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
    })

    return result
  }, [teachers, search, statusFilter, typeFilter, sortKey, sortAsc])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset page when filters change
  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleStatus = (v: string) => { setStatusFilter(v); setPage(1) }
  const handleType   = (v: string) => { setTypeFilter(v); setPage(1) }

  function SortIcon({ field }: { field: SortKey }) {
    if (sortKey !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />
    return sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  return (
    <div className="space-y-4">
      {/* ── Filters bar ─────────────────────── */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Bar & Mobile filter toggle */}
          <div className="flex gap-2 w-full md:flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search by name, NIC, designation…"
                className="input pl-10"
              />
            </div>

            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setFiltersExpanded(v => !v)}
              className={`md:hidden btn-secondary btn-sm px-3.5 flex items-center gap-1.5 rounded-xl border ${
                (statusFilter !== 'all' || typeFilter !== 'all')
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 text-slate-700 bg-white'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-xs">Filters</span>
              {(statusFilter !== 'all' || typeFilter !== 'all') && (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {(statusFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Desktop Filters (Hidden on Mobile) */}
          <div className="hidden md:flex flex-row gap-3 flex-shrink-0">
            <select
              value={statusFilter}
              onChange={e => handleStatus(e.target.value)}
              className="input md:w-40"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="transferred">Transferred</option>
              <option value="retired">Retired</option>
            </select>

            <select
              value={typeFilter}
              onChange={e => handleType(e.target.value)}
              className="input md:w-40"
            >
              <option value="all">All types</option>
              <option value="permanent">Permanent</option>
              <option value="contract">Contract</option>
              <option value="temporary">Temporary</option>
            </select>

            {/* View toggle & Export (desktop) */}
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-2.5 transition-colors ${viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Target Date Picker */}
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 bg-white h-[42px]">
              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-400 whitespace-nowrap">Age as of:</span>
              <input
                type="date"
                value={targetDateStr}
                onChange={e => setTargetDateStr(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer w-28"
              />
            </div>

            <button
              type="button"
              onClick={() => exportCsv(filtered, subjects, targetDate)}
              className="btn-secondary"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>

          {/* Mobile Filters Accordion (Expanded on Mobile) */}
          {filtersExpanded && (
            <div className="flex flex-col md:hidden gap-3 pt-3.5 border-t border-slate-100 animate-fade-in-up">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={e => handleStatus(e.target.value)}
                    className="input py-2 px-3 text-xs"
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="transferred">Transferred</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Type</label>
                  <select
                    value={typeFilter}
                    onChange={e => handleType(e.target.value)}
                    className="input py-2 px-3 text-xs"
                  >
                    <option value="all">All types</option>
                    <option value="permanent">Permanent</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </div>
              </div>
              <div className="mt-2.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Age as of date</label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 bg-white h-[38px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <input
                    type="date"
                    value={targetDateStr}
                    onChange={e => setTargetDateStr(e.target.value)}
                    className="text-xs font-semibold text-slate-700 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer flex-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-1 pt-2 border-t border-slate-100">
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => exportCsv(filtered, subjects, targetDate)}
                  className="btn-secondary flex-1 justify-center py-2 text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Result count */}
        <p className="text-xs text-slate-400 mt-3">
          Showing <span className="font-semibold text-slate-600">{filtered.length}</span> of{' '}
          <span className="font-semibold text-slate-600">{teachers.length}</span> staff members
        </p>
      </div>

      {/* ── Empty state ─────────────────────── */}
      {filtered.length === 0 && (
        <div className="card empty-state">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No teachers found</h3>
          <p className="text-sm text-slate-400 max-w-xs">
            {search || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'No staff members have been added yet.'}
          </p>
        </div>
      )}

      {/* ── Table view (Desktop and Tablet only) ──────────────────────── */}
      {filtered.length > 0 && viewMode === 'table' && (
        <div className="hidden md:block table-wrapper">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-head-cell" onClick={() => toggleSort('full_name')}>
                    <div className="flex items-center gap-1.5">Name <SortIcon field="full_name" /></div>
                  </th>
                  <th className="table-head-cell" onClick={() => toggleSort('designation')}>
                    <div className="flex items-center gap-1.5">Designation <SortIcon field="designation" /></div>
                  </th>
                  <th className="table-head-cell hidden sm:table-cell">
                    Grade
                  </th>
                  <th className="table-head-cell hidden md:table-cell">
                    Subjects
                  </th>
                  <th className="table-head-cell hidden lg:table-cell">
                    Age
                  </th>
                  <th className="table-head-cell hidden xl:table-cell">
                    Retirement
                  </th>
                  <th className="table-head-cell hidden xl:table-cell" onClick={() => toggleSort('employment_type')}>
                    <div className="flex items-center gap-1.5">Type <SortIcon field="employment_type" /></div>
                  </th>
                  <th className="table-head-cell" onClick={() => toggleSort('status')}>
                    <div className="flex items-center gap-1.5">Status <SortIcon field="status" /></div>
                  </th>
                  <th className="table-head-cell hidden lg:table-cell text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paged.map(t => {
                  const ac = avatarColor(t.full_name)
                  const sc = STATUS_CONFIG[t.status]
                  const tc = TYPE_CONFIG[t.employment_type]
                  const age = calculateAgeDetails(t.date_of_birth, targetDate)
                  const mappedSubs = (t.subject_ids || [])
                    .map(id => subjects.find(s => s.id === id)?.name)
                    .filter(Boolean)
                    .join(', ')

                  return (
                    <tr key={t.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${ac.bg} flex items-center justify-center flex-shrink-0`}>
                            <span className={`text-xs font-bold ${ac.text}`}>{getInitials(t.full_name)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{t.name_with_initials}</p>
                            <p className="text-xs text-slate-400 font-mono">{t.nic}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <p className="text-sm text-slate-700">{t.designation}</p>
                      </td>
                      <td className="table-cell hidden sm:table-cell">
                        <span className="text-sm font-medium text-slate-700">{t.grade || '—'}</span>
                      </td>
                      <td className="table-cell hidden md:table-cell max-w-[200px] truncate" title={mappedSubs}>
                        <span className="text-sm text-slate-600">{mappedSubs || '—'}</span>
                      </td>
                      <td className="table-cell hidden lg:table-cell text-sm text-slate-700 font-medium">
                        {t.date_of_birth ? `${age.years}y ${age.months}m ${age.days}d` : '—'}
                      </td>
                      <td className="table-cell hidden xl:table-cell text-sm text-slate-500">
                        {t.date_of_birth ? getRetirementDate(t.date_of_birth) : '—'}
                      </td>
                      <td className="table-cell hidden xl:table-cell">
                        <span className={tc.cls}>{tc.label}</span>
                      </td>
                      <td className="table-cell">
                        <div className="space-y-1">
                          <span className={sc.cls}>{sc.label}</span>
                          {t.status === 'transferred' && t.transferred_to && (
                            <p className="text-xs text-blue-500">→ {t.transferred_to}</p>
                          )}
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <Link
                          href={`/teachers/${t.id}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600
                                     hover:text-emerald-700 transition-colors group"
                        >
                          View
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Grid/Card view (Always visible on mobile, and on desktop/tablet if viewMode is 'grid') ── */}
      {filtered.length > 0 && (
        <div className={`${viewMode === 'grid' ? 'grid' : 'grid md:hidden'} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`}>
          {paged.map(t => {
            const ac = avatarColor(t.full_name)
            const sc = STATUS_CONFIG[t.status]
            const tc = TYPE_CONFIG[t.employment_type]
            const age = calculateAgeDetails(t.date_of_birth, targetDate)
            const mappedSubs = (t.subject_ids || [])
              .map(id => subjects.find(s => s.id === id)?.name)
              .filter(Boolean)
              .join(', ')

            return (
              <Link key={t.id} href={`/teachers/${t.id}`} className="card-hover p-5 group flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-2xl ${ac.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-sm font-bold ${ac.text}`}>{getInitials(t.full_name)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{t.name_with_initials}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{t.designation}</p>
                    </div>
                  </div>

                  {/* Enhanced Details */}
                  <div className="space-y-1.5 mb-4 text-xs text-slate-500">
                    {t.grade && (
                      <div className="flex justify-between gap-2">
                        <span>Grade:</span>
                        <span className="font-semibold text-slate-700 truncate">{t.grade}</span>
                      </div>
                    )}
                    {mappedSubs && (
                      <div className="flex justify-between gap-2">
                        <span>Subjects:</span>
                        <span className="font-semibold text-slate-700 truncate" title={mappedSubs}>{mappedSubs}</span>
                      </div>
                    )}
                    {t.date_of_birth && (
                      <>
                        <div className="flex justify-between gap-2">
                          <span>Age:</span>
                          <span className="font-semibold text-slate-700">{age.years}y {age.months}m {age.days}d</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span>Retires:</span>
                          <span className="font-semibold text-slate-700">{getRetirementDate(t.date_of_birth)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={sc.cls}>{sc.label}</span>
                    <span className={tc.cls}>{tc.label}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-400 font-mono">{t.nic}</p>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Pagination ──────────────────────── */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-sm text-slate-500 hidden sm:block">
            Showing page {page} of {totalPages}
          </p>
          
          {/* Desktop pagination (sm and up) */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary btn-sm disabled:opacity-40"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pg = page <= 3 ? i + 1 : page + i - 2
              if (pg < 1 || pg > totalPages) return null
              return (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setPage(pg)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    pg === page
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pg}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary btn-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>

          {/* Mobile pagination (compact, below sm) */}
          <div className="flex sm:hidden items-center justify-between w-full">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary btn-sm px-4 py-2 disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-xs font-semibold text-slate-600">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary btn-sm px-4 py-2 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

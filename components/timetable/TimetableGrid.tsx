'use client'

import { useState } from 'react'
import { TimetableSlot } from '@/types'
import { Download, Printer, Calendar } from 'lucide-react'

const DAYS    = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_LBL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const DAY_MAP = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday' }
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]

const PERIOD_TIMES: Record<number, string> = {
  1: '7:30', 2: '8:15', 3: '9:00', 4: '9:45',
  5: '10:40', 6: '11:25', 7: '12:10', 8: '13:00',
}

const SUBJECT_COLORS = [
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', sub: 'text-emerald-600', dot: 'bg-emerald-400' },
  { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-800',    sub: 'text-blue-600',    dot: 'bg-blue-400'    },
  { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-800',  sub: 'text-violet-600',  dot: 'bg-violet-400'  },
  { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   sub: 'text-amber-600',   dot: 'bg-amber-400'   },
  { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-800',    sub: 'text-rose-600',    dot: 'bg-rose-400'    },
  { bg: 'bg-cyan-50',    border: 'border-cyan-200',    text: 'text-cyan-800',    sub: 'text-cyan-600',    dot: 'bg-cyan-400'    },
]

export default function TimetableGrid({ slots, teacherName }: { slots: TimetableSlot[]; teacherName?: string }) {
  const [activeDay, setActiveDay] = useState<typeof DAYS[number]>('monday')

  function getSlot(day: string, period: number) {
    return slots.find(s => s.day === day && s.period === period)
  }

  // Assign color by subject ID for consistency
  const allSubjectIds = Array.from(new Set(slots.map(s => s.subject_id)))
  const subjectColorMap = Object.fromEntries(
    allSubjectIds.map((id, i) => [id, i % SUBJECT_COLORS.length])
  )

  function downloadCSV() {
    const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const headers = ['Period', 'Time', ...dayLabels]
    
    const rows = PERIODS.map(p => {
      const row = [`P${p}`, PERIOD_TIMES[p] || '']
      DAYS.forEach(d => {
        const slot = getSlot(d, p)
        if (slot) {
          const subjectName = slot.subject?.name ?? 'Subject'
          const gradeInfo = `Gr.${slot.grade}-${slot.class_name}`
          const roomInfo = slot.room ? ` (Room ${slot.room})` : ''
          row.push(`"${subjectName} - ${gradeInfo}${roomInfo}"`)
        } else {
          row.push('"—"')
        }
      })
      return row.join(',')
    })

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    const filename = `${teacherName ? teacherName.replace(/[^a-zA-Z0-9]/g, '_') : 'teacher'}_timetable.csv`
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function printTimetable() {
    const printStyle = document.createElement('style')
    printStyle.id = 'print-timetable-style'
    printStyle.innerHTML = `
      @media print {
        body * {
          visibility: hidden !important;
        }
        #timetable-to-print, #timetable-to-print * {
          visibility: visible !important;
        }
        #timetable-to-print {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          border: none !important;
          box-shadow: none !important;
          background: white !important;
          padding: 10px !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `
    document.head.appendChild(printStyle)
    window.print()
    setTimeout(() => {
      const el = document.getElementById('print-timetable-style')
      if (el) el.remove()
    }, 1000)
  }

  return (
    <div className="space-y-4">
      {/* Export/Print Controls (hidden during printing) */}
      <div className="flex justify-end gap-2 no-print">
        <button
          onClick={downloadCSV}
          className="btn-secondary btn-sm flex items-center gap-1.5"
          title="Download Timetable as CSV"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
        <button
          onClick={printTimetable}
          className="btn-secondary btn-sm flex items-center gap-1.5"
          title="Print / Save as PDF"
        >
          <Printer className="w-3.5 h-3.5" />
          Print / PDF
        </button>
      </div>

      {/* Main Grid Wrapper */}
      <div id="timetable-to-print" className="space-y-4">
        {/* Printable Header (visible ONLY during print) */}
        <div className="hidden print:block mb-6 border-b border-slate-200 pb-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {teacherName ? `${teacherName}'s ` : ''}Weekly Timetable
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Weekly Teaching Schedule Overview
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">School Staff Management</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* ── 1. Desktop view (md and up) ────────────────────────── */}
        <div className="hidden md:block card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-24">
                    Period
                  </th>
                  {DAYS.map((d, idx) => (
                    <th key={d} className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
                      {DAY_LBL[idx]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PERIODS.map(period => (
                  <tr key={period} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-semibold text-slate-700">P{period}</p>
                      <p className="text-[10px] text-slate-400">{PERIOD_TIMES[period]}</p>
                    </td>
                    {DAYS.map(day => {
                      const slot = getSlot(day, period)
                      const colorIdx = slot ? (subjectColorMap[slot.subject_id] ?? 0) : 0
                      const c = SUBJECT_COLORS[colorIdx]
                      return (
                        <td key={day} className="px-2 py-1.5 align-top">
                          {slot ? (
                            <div className={`rounded-xl border ${c.bg} ${c.border} p-2 min-h-[56px]`}>
                              <p className={`text-[11px] font-semibold ${c.text} truncate`}>
                                {slot.subject?.name ?? 'Subject'}
                              </p>
                              <p className={`text-[10px] ${c.sub} mt-0.5`}>
                                Gr.{slot.grade}–{slot.class_name}
                              </p>
                              {slot.room && (
                                <p className={`text-[10px] ${c.sub}`}>Rm {slot.room}</p>
                              )}
                            </div>
                          ) : (
                            <div className="min-h-[56px] flex items-center justify-center text-slate-200 text-xs">
                              —
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 2. Mobile view (below md, hidden when printing) ────── */}
        <div className="block md:hidden space-y-4 print:hidden">
          {/* Day selection tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto scrollbar-none flex-nowrap whitespace-nowrap">
            {DAYS.map((d, idx) => (
              <button
                key={d}
                type="button"
                onClick={() => setActiveDay(d)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeDay === d
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {DAY_MAP[d]}
              </button>
            ))}
          </div>

          {/* Vertical period card list for active day */}
          <div className="space-y-2.5">
            {PERIODS.map(period => {
              const slot = getSlot(activeDay, period)
              const colorIdx = slot ? (subjectColorMap[slot.subject_id] ?? 0) : 0
              const c = SUBJECT_COLORS[colorIdx]

              return (
                <div
                  key={period}
                  className={`flex items-center gap-3 p-3 bg-white rounded-2xl border transition-all ${
                    slot ? `${c.border} shadow-sm shadow-slate-100/50` : 'border-slate-100 bg-slate-50/40'
                  }`}
                >
                  {/* Period label */}
                  <div className="w-12 text-center flex-shrink-0 border-r border-slate-100 pr-3">
                    <p className="text-xs font-bold text-slate-700">P {period}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{PERIOD_TIMES[period]}</p>
                  </div>

                  {/* Slot details */}
                  <div className="min-w-0 flex-1">
                    {slot ? (
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                            <p className="text-xs font-semibold text-slate-800 truncate">
                              {slot.subject?.name ?? 'Subject'}
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 pl-3">
                            Grade {slot.grade}–{slot.class_name} · Room {slot.room || '—'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No class assigned</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 3. Mobile print fallback (visible ONLY when printing on mobile) ─ */}
        <div className="hidden print:block md:print:hidden space-y-6">
          {DAYS.map(day => {
            const daySlots = slots.filter(s => s.day === day).sort((a, b) => a.period - b.period)
            if (daySlots.length === 0) return null

            return (
              <div key={day} className="border border-slate-200 rounded-xl p-4 bg-white">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b pb-2 mb-3">
                  {DAY_MAP[day]}
                </h3>
                <div className="space-y-2">
                  {daySlots.map(slot => {
                    const colorIdx = subjectColorMap[slot.subject_id] ?? 0
                    const c = SUBJECT_COLORS[colorIdx]
                    return (
                      <div key={slot.id} className="flex justify-between items-center text-xs py-1.5 border-b last:border-b-0">
                        <span className="font-semibold text-slate-600 w-16">P{slot.period} ({PERIOD_TIMES[slot.period]})</span>
                        <span className="text-slate-800 font-medium flex-1">{slot.subject?.name ?? 'Subject'}</span>
                        <span className="text-slate-500">Gr.{slot.grade}–{slot.class_name} {slot.room ? `[Rm ${slot.room}]` : ''}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


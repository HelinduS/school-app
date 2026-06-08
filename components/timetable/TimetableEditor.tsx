'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { TimetableSlot, Subject } from '@/types'
import { Plus, X, Loader2, CalendarDays } from 'lucide-react'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'

interface Props {
  teacherId:    string
  initialSlots: TimetableSlot[]
  subjects:     Subject[]
}

const DAYS    = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_LBL = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' }
const DAY_FULL = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday' }
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]

const PERIOD_TIMES: Record<number, string> = {
  1: '7:30',  2: '8:15',  3: '9:00', 4: '9:45',
  5: '10:40', 6: '11:25', 7: '12:10', 8: '13:00',
}

const SUBJECT_COLORS = [
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', sub: 'text-emerald-600', dot: 'bg-emerald-400' },
  { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-800',    sub: 'text-blue-600',    dot: 'bg-blue-400'    },
  { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-800',  sub: 'text-violet-600',  dot: 'bg-violet-400'  },
  { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   sub: 'text-amber-600',   dot: 'bg-amber-400'   },
  { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-800',    sub: 'text-rose-600',    dot: 'bg-rose-400'    },
  { bg: 'bg-cyan-50',    border: 'border-cyan-200',    text: 'text-cyan-800',    sub: 'text-cyan-600',    dot: 'bg-cyan-400'    },
  { bg: 'bg-pink-50',    border: 'border-pink-200',    text: 'text-pink-800',    sub: 'text-pink-600',    dot: 'bg-pink-400'    },
  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-800',  sub: 'text-indigo-600',  dot: 'bg-indigo-400'  },
]

export default function TimetableEditor({ teacherId, initialSlots, subjects }: Props) {
  const router   = useRouter()
  const supabase = createClient()
  const toast    = useToast()

  const [slots,   setSlots]   = useState<TimetableSlot[]>(initialSlots)
  const [editing, setEditing] = useState<{ day: string; period: number } | null>(null)
  const [form,    setForm]    = useState({ subject_id: '', grade: '', class_name: '', room: '' })
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting,     setDeleting]     = useState(false)
  const [activeDay,    setActiveDay]    = useState<typeof DAYS[number]>('monday')

  // Build subject → color index map for consistent colors
  const subjectColorMap = subjects.reduce<Record<string, number>>((acc, s, i) => {
    acc[s.id] = i % SUBJECT_COLORS.length
    return acc
  }, {})

  function getSlot(day: string, period: number) {
    return slots.find(s => s.day === day && s.period === period)
  }

  function startEdit(day: string, period: number) {
    const existing = getSlot(day, period)
    setForm({
      subject_id: existing?.subject_id || subjects[0]?.id || '',
      grade:      existing?.grade      || '',
      class_name: existing?.class_name || '',
      room:       existing?.room       || '',
    })
    setEditing({ day, period })
  }

  async function saveSlot() {
    if (!editing) return
    if (!form.subject_id || !form.grade || !form.class_name) {
      toast.error('Missing fields', 'Please fill in subject, grade, and class.')
      return
    }

    setLoading(true)
    const existing = getSlot(editing.day, editing.period)
    const payload  = {
      teacher_id: teacherId,
      day:        editing.day,
      period:     editing.period,
      subject_id: form.subject_id,
      grade:      form.grade,
      class_name: form.class_name,
      room:       form.room || null,
    }

    if (existing) {
      const { data, error } = await supabase
        .from('timetable').update(payload).eq('id', existing.id)
        .select('*, subject:subjects(*)').single()
      if (error) { toast.error('Save failed', error.message); setLoading(false); return }
      setSlots(prev => prev.map(s => s.id === existing.id ? data : s))
    } else {
      const { data, error } = await supabase
        .from('timetable').insert(payload)
        .select('*, subject:subjects(*)').single()
      if (error) { toast.error('Save failed', error.message); setLoading(false); return }
      setSlots(prev => [...prev, data])
    }

    toast.success('Saved', `${DAY_FULL[editing.day as keyof typeof DAY_FULL]} Period ${editing.period} updated.`)
    setEditing(null)
    setLoading(false)
    router.refresh()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('timetable').delete().eq('id', deleteTarget)
    if (!error) {
      setSlots(prev => prev.filter(s => s.id !== deleteTarget))
      toast.success('Period cleared')
    } else {
      toast.error('Delete failed', error.message)
    }
    setDeleting(false)
    setDeleteTarget(null)
    router.refresh()
  }

  const filledCount = slots.length
  const totalSlots  = DAYS.length * PERIODS.length

  return (
    <>
      {/* Summary bar */}
      <div className="card p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {filledCount} <span className="text-slate-400 font-normal">of</span> {totalSlots} periods assigned
            </p>
            <p className="text-xs text-slate-400">Click any cell to assign or edit a period</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {subjects.slice(0, 5).map((s, i) => {
            const c = SUBJECT_COLORS[i % SUBJECT_COLORS.length]
            return (
              <div key={s.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${c.bg} ${c.text}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                {s.name}
              </div>
            )
          })}
          {subjects.length > 5 && (
            <span className="text-xs text-slate-400 font-medium">+{subjects.length - 5} more</span>
          )}
        </div>
      </div>

      {/* ── 1. Desktop timetable grid (md and up) ────────────────── */}
      <div className="hidden md:block card overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 w-28">
                  Period
                </th>
                {DAYS.map(d => (
                  <th key={d} className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3.5">
                    {DAY_LBL[d]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PERIODS.map(period => (
                <tr key={period} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-left">
                    <p className="text-sm font-semibold text-slate-800">Period {period}</p>
                    <p className="text-[10px] text-slate-400">{PERIOD_TIMES[period]}</p>
                  </td>
                  {DAYS.map(day => {
                    const slot = getSlot(day, period)
                    const colorIdx = slot ? (subjectColorMap[slot.subject_id] ?? 0) : 0
                    const c = SUBJECT_COLORS[colorIdx]
                    return (
                      <td key={day} className="px-2 py-2 align-top">
                        {slot ? (
                          <div
                            className={`group relative rounded-xl border ${c.bg} ${c.border} p-2.5
                                        cursor-pointer transition-all hover:shadow-sm min-h-[60px]`}
                            onClick={() => startEdit(day, period)}
                          >
                            <p className={`text-xs font-semibold ${c.text} truncate`}>
                              {slot.subject?.name ?? 'Subject'}
                            </p>
                            <p className={`text-[10px] ${c.sub} mt-0.5 truncate`}>
                              Gr.{slot.grade} – {slot.class_name}
                            </p>
                            {slot.room && (
                              <p className={`text-[10px] ${c.sub} truncate`}>Rm {slot.room}</p>
                            )}
                            {/* Delete button (desktop hover reveal) */}
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); setDeleteTarget(slot.id) }}
                              className="absolute top-1 right-1 p-0.5 rounded-full bg-white/80 shadow-sm
                                         opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                            >
                              <X className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(day, period)}
                            className="w-full min-h-[60px] rounded-xl border-2 border-dashed border-slate-200
                                       text-slate-300 hover:border-emerald-300 hover:text-emerald-400
                                       hover:bg-emerald-50/30 transition-all flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
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

      {/* ── 2. Mobile timetable editor (below md) ────────────────── */}
      <div className="block md:hidden space-y-4 mb-6">
        {/* Day select tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto scrollbar-none flex-nowrap whitespace-nowrap">
          {DAYS.map(d => (
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
              {DAY_LBL[d]}
            </button>
          ))}
        </div>

        {/* Vertical period slots list */}
        <div className="space-y-2.5">
          {PERIODS.map(period => {
            const slot = getSlot(activeDay, period)
            const colorIdx = slot ? (subjectColorMap[slot.subject_id] ?? 0) : 0
            const c = SUBJECT_COLORS[colorIdx]

            return (
              <div
                key={period}
                onClick={() => startEdit(activeDay, period)}
                className={`flex items-center gap-3 p-3 bg-white rounded-2xl border cursor-pointer transition-all hover:border-slate-350 ${
                  slot ? `${c.border} shadow-sm shadow-slate-100/55` : 'border-slate-200 border-dashed bg-slate-50/20'
                }`}
              >
                {/* Period identifier */}
                <div className="w-12 text-center flex-shrink-0 border-r border-slate-100 pr-3">
                  <p className="text-xs font-bold text-slate-700">P {period}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{PERIOD_TIMES[period]}</p>
                </div>

                {/* Slot info or Assign placeholder */}
                <div className="min-w-0 flex-1 relative pr-8">
                  {slot ? (
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
                      
                      {/* Delete slot button (permanently visible on mobile/touch interfaces) */}
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setDeleteTarget(slot.id) }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors"
                        title="Clear Time Slot"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 hover:text-emerald-500 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                      <p className="text-xs italic">Assign time slot</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="font-semibold text-slate-900 text-base">
                {DAY_FULL[editing.day as keyof typeof DAY_FULL]} — Period {editing.period}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {PERIOD_TIMES[editing.period]} · Assign a subject and class
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Subject</label>
                {subjects.length === 0 ? (
                  <p className="text-sm text-red-600">No subjects configured. Add subjects in Settings.</p>
                ) : (
                  <select className="input" value={form.subject_id}
                    onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))}>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Grade</label>
                  <input className="input" placeholder="10"
                    value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Class</label>
                  <input className="input" placeholder="A"
                    value={form.class_name} onChange={e => setForm(p => ({ ...p, class_name: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="label">Room <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
                <input className="input" placeholder="Room 12"
                  value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={saveSlot}
                disabled={loading || subjects.length === 0}
                className="btn-primary"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Period'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Clear this period?"
        message="This will remove the assignment from this time slot."
        confirmLabel="Clear Period"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Subject } from '@/types'
import { Plus, Trash2, Loader2, BookOpen, Save, X } from 'lucide-react'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'

const DEPARTMENTS = [
  'Science', 'Mathematics', 'Languages', 'Social Studies',
  'Arts', 'Technology', 'Physical Education', 'Religion', 'Other',
]

const DEPT_COLORS: Record<string, string> = {
  'Science':          'bg-blue-50 text-blue-700 border-blue-200',
  'Mathematics':      'bg-violet-50 text-violet-700 border-violet-200',
  'Languages':        'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Social Studies':   'bg-amber-50 text-amber-700 border-amber-200',
  'Arts':             'bg-pink-50 text-pink-700 border-pink-200',
  'Technology':       'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Physical Education': 'bg-orange-50 text-orange-700 border-orange-200',
  'Religion':         'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Other':            'bg-slate-100 text-slate-600 border-slate-200',
}

export default function SubjectsManager() {
  const supabase = createClient()
  const toast    = useToast()

  const [subjects,     setSubjects]     = useState<Subject[]>([])
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null)
  const [deleting,     setDeleting]     = useState(false)

  const [form, setForm] = useState({ name: '', department: 'Other' })
  const [editId, setEditId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('subjects').select('*').order('name')
    setSubjects(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Name required', 'Please enter a subject name.')
      return
    }
    setSaving(true)

    if (editId) {
      const { error } = await supabase
        .from('subjects').update({ name: form.name.trim(), department: form.department })
        .eq('id', editId)
      if (error) { toast.error('Save failed', error.message) }
      else { toast.success('Subject updated') }
    } else {
      const { error } = await supabase
        .from('subjects').insert({ name: form.name.trim(), department: form.department })
      if (error) { toast.error('Save failed', error.message) }
      else { toast.success('Subject added') }
    }

    setSaving(false)
    setForm({ name: '', department: 'Other' })
    setEditId(null)
    load()
  }

  function startEdit(s: Subject) {
    setForm({ name: s.name, department: s.department || 'Other' })
    setEditId(s.id)
  }

  function cancelEdit() {
    setForm({ name: '', department: 'Other' })
    setEditId(null)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('subjects').delete().eq('id', deleteTarget.id)
    if (error) toast.error('Delete failed', error.message)
    else toast.success('Subject removed')
    setDeleting(false)
    setDeleteTarget(null)
    load()
  }

  // Group subjects by department
  const grouped = subjects.reduce<Record<string, Subject[]>>((acc, s) => {
    const dept = s.department || 'Other'
    acc[dept]  = [...(acc[dept] || []), s]
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Add / Edit form */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          {editId ? 'Edit Subject' : 'Add New Subject'}
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Subject name (e.g. Mathematics)"
            className="input flex-1"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          <select
            className="input sm:w-44"
            value={form.department}
            onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
          >
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editId ? 'Update' : 'Add'}
            </button>
            {editId && (
              <button onClick={cancelEdit} className="btn-secondary">
                <X className="w-4 h-4" /> Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subjects list */}
      {loading ? (
        <div className="card p-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="card empty-state">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <BookOpen className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="text-sm font-semibold text-slate-600 mb-1">No subjects yet</h3>
          <p className="text-xs text-slate-400">Add subjects above to use them in timetables.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([dept, subs]) => (
            <div key={dept} className="card overflow-hidden">
              <div className={`px-5 py-2.5 border-b border-slate-100 flex items-center gap-2`}>
                <div className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${DEPT_COLORS[dept] || DEPT_COLORS['Other']}`}>
                  {dept}
                </div>
                <span className="text-xs text-slate-400">{subs.length} subject{subs.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-slate-50">
                {subs.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-800">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(s)}
                        className="text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(s)}
                        className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        message="This will remove the subject from all timetable assignments. This cannot be undone."
        confirmLabel="Delete Subject"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

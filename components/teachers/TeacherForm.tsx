'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Teacher, EmploymentHistory, Subject } from '@/types'
import { Loader2, Save, Plus, Trash2, Upload, FileText, ExternalLink, X, CheckCircle2, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

interface Props {
  teacher?: Teacher
  mode: 'create' | 'edit'
}

const STEPS = [
  { key: 'personal',    label: 'Personal'    },
  { key: 'contact',     label: 'Contact'     },
  { key: 'employment',  label: 'Employment'  },
  { key: 'education',   label: 'Education'   },
  { key: 'experience',  label: 'Experience'  },
]

export default function TeacherForm({ teacher, mode }: Props) {
  const router   = useRouter()
  const supabase = createClient()
  const toast    = useToast()

  const [step,      setStep]      = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])

  const [form, setForm] = useState({
    full_name:               teacher?.full_name               || '',
    name_with_initials:      teacher?.name_with_initials      || '',
    date_of_birth:           teacher?.date_of_birth           || '',
    gender:                  teacher?.gender                  || 'female',
    nic:                     teacher?.nic                     || '',
    phone:                   teacher?.phone                   || '',
    email:                   teacher?.email                   || '',
    address:                 teacher?.address                 || '',
    designation:             teacher?.designation             || '',
    grade:                   teacher?.grade                   || '',
    employment_type:         teacher?.employment_type         || 'permanent',
    status:                  teacher?.status                  || 'active',
    date_joined:             teacher?.date_joined             || new Date().toISOString().slice(0, 10),
    transferred_to:          teacher?.transferred_to          || '',
    highest_qualification:   teacher?.highest_qualification   || '',
    university_or_institute: teacher?.university_or_institute || '',
    graduation_year:         teacher?.graduation_year?.toString() || '',
    resume_url:              teacher?.resume_url              || '',
    notes:                   teacher?.notes                   || '',
    subject_ids:             teacher?.subject_ids             || [] as string[],
  })

  const [experiences, setExperiences] = useState<Array<{
    school_name: string; designation: string; date_from: string
    date_to: string; years_of_experience: string; reason_for_leaving: string
  }>>([])

  const [resumeFile,   setResumeFile]   = useState<File | null>(null)
  const [uploadDrag,   setUploadDrag]   = useState(false)

  useEffect(() => {
    if (mode === 'edit' && teacher?.id) {
      supabase
        .from('employment_history')
        .select('*')
        .eq('teacher_id', teacher.id)
        .order('date_from', { ascending: false })
        .then(({ data }) => {
          if (data) {
            setExperiences(data.map((e: EmploymentHistory) => ({
              school_name:        e.school_name,
              designation:        e.designation,
              date_from:          e.date_from,
              date_to:            e.date_to || '',
              years_of_experience: e.years_of_experience?.toString() || '',
              reason_for_leaving: e.reason_for_leaving || '',
            })))
          }
        })
    }
  }, [mode, teacher?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true })
      .then(({ data }) => {
        if (data) setAllSubjects(data as Subject[])
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      // Auto-suggest initials from full name
      if (key === 'full_name' && !prev.name_with_initials) {
        const parts = (value as string).trim().split(' ')
        if (parts.length >= 2) {
          const initials = parts.slice(0, -1).map(p => p[0] + '.').join(' ')
          const last     = parts[parts.length - 1]
          next.name_with_initials = `${initials} ${last}`
        }
      }
      return next
    })
  }

  function addExperience() {
    setExperiences(prev => [...prev, { school_name: '', designation: '', date_from: '', date_to: '', years_of_experience: '', reason_for_leaving: '' }])
  }

  function updateExp(i: number, f: string, v: string) {
    setExperiences(prev => prev.map((e, idx) => idx === i ? { ...e, [f]: v } : e))
  }

  function removeExp(i: number) {
    setExperiences(prev => prev.filter((_, idx) => idx !== i))
  }

  async function uploadResume(file: File): Promise<string> {
    const ext      = file.name.split('.').pop()
    const fileName = `${teacher?.id || 'new'}_${Date.now()}.${ext}`
    const filePath = `resumes/${fileName}`

    const { error } = await supabase.storage.from('documents').upload(filePath, file)
    if (error) throw error

    const { data } = supabase.storage.from('documents').getPublicUrl(filePath)
    return data.publicUrl
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    setUploadDrag(false)
    const file = e.dataTransfer.files?.[0]
    if (file && /\.(pdf|doc|docx)$/i.test(file.name)) setResumeFile(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      let resumeUrl = form.resume_url

      if (resumeFile) {
        setUploading(true)
        resumeUrl = await uploadResume(resumeFile)
        setUploading(false)
      }

      const payload = {
        ...form,
        transferred_to:  form.status === 'transferred' ? form.transferred_to : null,
        resume_url:      resumeUrl,
        graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
        email:           form.email || null,
        grade:           form.grade || null,
      }

      let teacherId: string

      if (mode === 'create') {
        const { data, error } = await supabase.from('teachers').insert(payload).select().single()
        if (error) throw error
        teacherId = data.id
      } else if (teacher) {
        const { error } = await supabase.from('teachers').update(payload).eq('id', teacher.id)
        if (error) throw error
        teacherId = teacher.id
      } else {
        throw new Error('Teacher not found for edit mode')
      }

      // Save experiences
      await supabase.from('employment_history').delete().eq('teacher_id', teacherId)
      if (experiences.length > 0) {
        const { error: expError } = await supabase.from('employment_history').insert(
          experiences.map(exp => ({
            teacher_id:         teacherId,
            school_name:        exp.school_name,
            designation:        exp.designation,
            date_from:          exp.date_from,
            date_to:            exp.date_to || null,
            years_of_experience: exp.years_of_experience ? parseInt(exp.years_of_experience) : null,
            reason_for_leaving: exp.reason_for_leaving || null,
          }))
        )
        if (expError) throw expError
      }

      toast.success(
        mode === 'create' ? 'Teacher created!' : 'Changes saved!',
        mode === 'create' ? 'New staff profile has been created.' : 'Teacher profile has been updated.'
      )

      router.push(`/teachers/${teacherId}`)
      router.refresh()
    } catch (err: any) {
      toast.error('Error', err.message)
      setLoading(false)
      setUploading(false)
    }
  }

  const inputCls   = 'input'
  const labelCls   = 'label'
  const selectCls  = 'input'

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {/* ── Step indicator (Desktop version) ─────────────────────── */}
      <div className="hidden md:block card p-4 mb-6">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center min-w-0">
              <button
                type="button"
                onClick={() => setStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
                            transition-all duration-150 whitespace-nowrap ${
                  i === step
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : i < step
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                                  ${i === step ? 'bg-white/20' : i < step ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  {i < step ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
                </span>
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-px flex-shrink-0 mx-1 ${i < step ? 'bg-emerald-300' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step indicator (Mobile version) ─────────────────────── */}
      <div className="block md:hidden card p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Step {step + 1} of {STEPS.length}
          </p>
          <p className="text-sm font-bold text-slate-800">
            {STEPS[step].label}
          </p>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill bg-emerald-600"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Step 0: Personal ───────────────────── */}
      {step === 0 && (
        <div className="form-section animate-fade-in-up">
          <h2 className="form-section-title">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
              <input required type="text" className={inputCls}
                value={form.full_name} onChange={e => update('full_name', e.target.value)}
                placeholder="Sureka Madushani Perera" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>
                Name with Initials <span className="text-red-500">*</span>
                <span className="text-xs text-slate-400 font-normal ml-2">(auto-suggested from full name)</span>
              </label>
              <input required type="text" className={inputCls}
                value={form.name_with_initials} onChange={e => update('name_with_initials', e.target.value)}
                placeholder="S. M. Perera" />
            </div>
            <div>
              <label className={labelCls}>NIC <span className="text-red-500">*</span></label>
              <input required type="text" className={inputCls}
                value={form.nic} onChange={e => update('nic', e.target.value)}
                placeholder="199012345678" />
            </div>
            <div>
              <label className={labelCls}>Date of Birth <span className="text-red-500">*</span></label>
              <input required type="date" className={inputCls}
                value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Gender <span className="text-red-500">*</span></label>
              <select className={selectCls} value={form.gender} onChange={e => update('gender', e.target.value as any)}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Contact ────────────────────── */}
      {step === 1 && (
        <div className="form-section animate-fade-in-up">
          <h2 className="form-section-title">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Phone <span className="text-red-500">*</span></label>
              <input required type="tel" className={inputCls}
                value={form.phone} onChange={e => update('phone', e.target.value)}
                placeholder="0771234567" />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" className={inputCls}
                value={form.email} onChange={e => update('email', e.target.value)}
                placeholder="name@school.lk" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Address <span className="text-red-500">*</span></label>
              <textarea required rows={3} className={inputCls}
                value={form.address} onChange={e => update('address', e.target.value)}
                placeholder="No. 123, Main Street, Kandy" />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Employment ─────────────────── */}
      {step === 2 && (
        <div className="form-section animate-fade-in-up">
          <h2 className="form-section-title">Employment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Designation <span className="text-red-500">*</span></label>
              <input required type="text" className={inputCls}
                value={form.designation} onChange={e => update('designation', e.target.value)}
                placeholder="Sectional Head / Teacher" />
            </div>
            <div>
              <label className={labelCls}>Date Joined <span className="text-red-500">*</span></label>
              <input required type="date" className={inputCls}
                value={form.date_joined} onChange={e => update('date_joined', e.target.value)} />
            </div>
            
            {/* Grade select field */}
            <div>
              <label className={labelCls}>Grade / Class of Service</label>
              <select
                className={selectCls}
                value={form.grade !== '' && !['1', '2 - I', '2 - II', '3 - I', '3 - II'].includes(form.grade) ? 'custom' : form.grade}
                onChange={e => {
                  const val = e.target.value
                  if (val === 'custom') {
                    update('grade', 'Custom')
                  } else {
                    update('grade', val)
                  }
                }}
              >
                <option value="">Select Grade</option>
                <option value="1">Class 1</option>
                <option value="2 - I">Class 2 - Grade I (2 - I)</option>
                <option value="2 - II">Class 2 - Grade II (2 - II)</option>
                <option value="3 - I">Class 3 - Grade I (3 - I)</option>
                <option value="3 - II">Class 3 - Grade II (3 - II)</option>
                <option value="custom">Other / Custom...</option>
              </select>
            </div>

            {form.grade !== '' && !['1', '2 - I', '2 - II', '3 - I', '3 - II'].includes(form.grade) && (
              <div>
                <label className={labelCls}>Custom Grade <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  className={inputCls}
                  value={form.grade === 'Custom' ? '' : form.grade}
                  onChange={e => update('grade', e.target.value)}
                  placeholder="Enter grade (e.g. 3-I)"
                />
              </div>
            )}

            <div>
              <label className={labelCls}>Employment Type <span className="text-red-500">*</span></label>
              <select className={selectCls} value={form.employment_type} onChange={e => update('employment_type', e.target.value as any)}>
                <option value="permanent">Permanent</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Status <span className="text-red-500">*</span></label>
              <select className={selectCls} value={form.status} onChange={e => update('status', e.target.value as any)}>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="transferred">Transferred</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            {form.status === 'transferred' && (
              <div className="md:col-span-2">
                <label className={labelCls}>Transferred To <span className="text-red-500">*</span></label>
                <input required type="text" className={inputCls}
                  value={form.transferred_to} onChange={e => update('transferred_to', e.target.value)}
                  placeholder="Name of the school transferred to" />
              </div>
            )}

            {/* Subjects checklist */}
            <div className="md:col-span-2">
              <label className={labelCls}>Assigned Subjects</label>
              {allSubjects.length === 0 ? (
                <p className="text-xs text-slate-400">Loading subjects...</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-2 p-4 bg-slate-50 border border-slate-200/60 rounded-xl max-h-48 overflow-y-auto">
                  {allSubjects.map(sub => {
                    const checked = form.subject_ids.includes(sub.id)
                    return (
                      <label key={sub.id} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900 transition-colors">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                          checked={checked}
                          onChange={() => {
                            const nextIds = checked
                              ? form.subject_ids.filter(id => id !== sub.id)
                              : [...form.subject_ids, sub.id]
                            update('subject_ids', nextIds)
                          }}
                        />
                        <span>{sub.name}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Notes</label>
              <textarea rows={3} className={inputCls}
                value={form.notes} onChange={e => update('notes', e.target.value)}
                placeholder="Any additional notes about this staff member…" />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Education ──────────────────── */}
      {step === 3 && (
        <div className="form-section animate-fade-in-up">
          <h2 className="form-section-title">Education & Qualifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>Highest Qualification <span className="text-red-500">*</span></label>
              <input required type="text" className={inputCls}
                value={form.highest_qualification} onChange={e => update('highest_qualification', e.target.value)}
                placeholder="BA in English Literature" />
            </div>
            <div>
              <label className={labelCls}>University / Institute</label>
              <input type="text" className={inputCls}
                value={form.university_or_institute} onChange={e => update('university_or_institute', e.target.value)}
                placeholder="University of Peradeniya" />
            </div>
            <div>
              <label className={labelCls}>Graduation Year</label>
              <input type="number" min="1960" max="2030" className={inputCls}
                value={form.graduation_year} onChange={e => update('graduation_year', e.target.value)}
                placeholder="2010" />
            </div>

            {/* Resume upload */}
            <div className="md:col-span-2">
              <label className={labelCls}>Resume (PDF, DOC, DOCX)</label>
              <div
                onDrop={handleFileDrop}
                onDragOver={e => { e.preventDefault(); setUploadDrag(true) }}
                onDragLeave={() => setUploadDrag(false)}
                className={`relative mt-1 border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
                            ${uploadDrag ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
                onClick={() => document.getElementById('resume-input')?.click()}
              >
                <input
                  id="resume-input"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={e => setResumeFile(e.target.files?.[0] || null)}
                />
                {resumeFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-medium text-slate-700">{resumeFile.name}</span>
                    <button type="button" onClick={e => { e.stopPropagation(); setResumeFile(null) }}
                            className="text-slate-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Drop file here or <span className="text-emerald-600 font-medium">browse</span></p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX supported</p>
                  </>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    <span className="ml-2 text-sm text-emerald-700">Uploading…</span>
                  </div>
                )}
              </div>

              {form.resume_url && !resumeFile && (
                <div className="mt-3 flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-500">Current resume:</span>
                  <a href={form.resume_url} target="_blank" rel="noopener noreferrer"
                     className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Experience ─────────────────── */}
      {step === 4 && (
        <div className="form-section animate-fade-in-up">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Past Teaching Experience</h2>
            <button type="button" onClick={addExperience} className="btn-secondary btn-sm">
              <Plus className="w-3.5 h-3.5" /> Add Entry
            </button>
          </div>

          {experiences.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Briefcase className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm">No past experiences added yet.</p>
              <button type="button" onClick={addExperience} className="mt-3 btn-secondary btn-sm">
                <Plus className="w-3.5 h-3.5" /> Add Experience
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {experiences.map((exp, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-5 relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-700">Experience {i + 1}</h3>
                    <button type="button" onClick={() => removeExp(i)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelCls}>School / Institution <span className="text-red-500">*</span></label>
                      <input required type="text" className={inputCls} value={exp.school_name}
                        onChange={e => updateExp(i, 'school_name', e.target.value)} placeholder="School name" />
                    </div>
                    <div>
                      <label className={labelCls}>Designation <span className="text-red-500">*</span></label>
                      <input required type="text" className={inputCls} value={exp.designation}
                        onChange={e => updateExp(i, 'designation', e.target.value)} placeholder="Teacher, Head, etc." />
                    </div>
                    <div>
                      <label className={labelCls}>Years of Experience</label>
                      <input type="number" min="0" max="50" className={inputCls} value={exp.years_of_experience}
                        onChange={e => updateExp(i, 'years_of_experience', e.target.value)} placeholder="3" />
                    </div>
                    <div>
                      <label className={labelCls}>From Date <span className="text-red-500">*</span></label>
                      <input required type="date" className={inputCls} value={exp.date_from}
                        onChange={e => updateExp(i, 'date_from', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>To Date</label>
                      <input type="date" className={inputCls} value={exp.date_to}
                        onChange={e => updateExp(i, 'date_to', e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Reason for Leaving</label>
                      <input type="text" className={inputCls} value={exp.reason_for_leaving}
                        onChange={e => updateExp(i, 'reason_for_leaving', e.target.value)}
                        placeholder="Transfer, Resignation, etc." />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Navigation buttons ─────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          {step > 0 && (
            <button type="button" onClick={() => setStep(s => s - 1)} className="btn-secondary">
              ← Previous
            </button>
          )}
          <Link
            href={teacher ? `/teachers/${teacher.id}` : '/teachers'}
            className="btn-ghost text-slate-500"
          >
            Cancel
          </Link>
        </div>

        {step < STEPS.length - 1 ? (
          <button type="button" onClick={() => setStep(s => s + 1)} className="btn-primary">
            Next →
          </button>
        ) : (
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploading ? 'Uploading…' : 'Saving…'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {mode === 'create' ? 'Create Teacher' : 'Save Changes'}
              </>
            )}
          </button>
        )}
      </div>
    </form>
  )
}

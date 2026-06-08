'use client'

import { useState } from 'react'
import { Teacher, EmploymentHistory, TimetableSlot, Subject } from '@/types'
import {
  Phone, Mail, MapPin, Calendar, GraduationCap,
  Briefcase, CreditCard, CalendarDays, FileText,
  Building2, ExternalLink, StickyNote
} from 'lucide-react'
import Link from 'next/link'
import TimetableGrid from '@/components/timetable/TimetableGrid'

interface Props {
  teacher:    Teacher
  history:    EmploymentHistory[]
  timetable:  TimetableSlot[]
  canModify:  boolean
  subjects:   Subject[]
}

type Tab = 'overview' | 'timetable' | 'history'

const INFO_ROW = 'flex items-start gap-3 py-3 border-b border-slate-50 last:border-0'

export default function TeacherProfileTabs({ teacher: t, history, timetable, canModify, subjects }: Props) {
  const [tab, setTab] = useState<Tab>('overview')

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview',  label: 'Overview',   icon: <Briefcase  className="w-3.5 h-3.5" /> },
    { key: 'timetable', label: 'Timetable',  icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { key: 'history',   label: 'History',    icon: <Building2  className="w-3.5 h-3.5" /> },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-6">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                        transition-all duration-150 ${
              tab === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {icon}
            {label}
            {key === 'history' && history.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 text-[10px] bg-slate-200 text-slate-600 rounded-full font-semibold">
                {history.length}
              </span>
            )}
            {key === 'timetable' && timetable.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded-full font-semibold">
                {timetable.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview tab ──────────────────────── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {/* Left column */}
          <div className="space-y-6">
            {/* Contact */}
            <div className="card p-6">
              <h2 className="form-section-title">
                <Phone className="w-4 h-4 text-slate-400" /> Contact
              </h2>
              <dl>
                <div className={INFO_ROW}>
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-400 mb-0.5">Phone</dt>
                    <dd>
                      {t.phone
                        ? <a href={`tel:${t.phone}`} className="text-sm font-medium text-slate-900 hover:text-emerald-600 transition-colors">{t.phone}</a>
                        : <span className="text-sm text-slate-400">—</span>}
                    </dd>
                  </div>
                </div>
                <div className={INFO_ROW}>
                  <Mail className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-400 mb-0.5">Email</dt>
                    <dd>
                      {t.email
                        ? <a href={`mailto:${t.email}`} className="text-sm font-medium text-slate-900 hover:text-emerald-600 transition-colors break-all">{t.email}</a>
                        : <span className="text-sm text-slate-400">—</span>}
                    </dd>
                  </div>
                </div>
                <div className={INFO_ROW}>
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-400 mb-0.5">Address</dt>
                    <dd className="text-sm text-slate-700 leading-relaxed">{t.address || '—'}</dd>
                  </div>
                </div>
              </dl>
            </div>

            {/* Personal */}
            <div className="card p-6">
              <h2 className="form-section-title">
                <CreditCard className="w-4 h-4 text-slate-400" /> Personal
              </h2>
              <dl>
                <div className={INFO_ROW}>
                  <CreditCard className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-400 mb-0.5">NIC</dt>
                    <dd className="text-sm font-mono font-medium text-slate-900">{t.nic}</dd>
                  </div>
                </div>
                <div className={INFO_ROW}>
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-slate-400 mb-0.5">Date of Birth</dt>
                    <dd className="text-sm text-slate-900">
                      {t.date_of_birth
                        ? new Date(t.date_of_birth).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: '2-digit' })
                        : '—'}
                    </dd>
                  </div>
                </div>
                <div className={INFO_ROW}>
                  <div className="w-4 h-4 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-slate-400 text-xs">♀♂</span>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 mb-0.5">Gender</dt>
                    <dd className="text-sm text-slate-900 capitalize">{t.gender}</dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>

          {/* Right columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Employment */}
            <div className="card p-6">
              <h2 className="form-section-title">
                <Briefcase className="w-4 h-4 text-slate-400" /> Employment Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Date Joined', value: new Date(t.date_joined).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' }) },
                  { label: 'Designation', value: t.designation },
                  { label: 'Employment', value: t.employment_type.charAt(0).toUpperCase() + t.employment_type.slice(1) },
                  { label: 'Status', value: t.status === 'on_leave' ? 'On Leave' : t.status.charAt(0).toUpperCase() + t.status.slice(1) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className="text-sm font-semibold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="card p-6">
              <h2 className="form-section-title">
                <GraduationCap className="w-4 h-4 text-slate-400" /> Education
              </h2>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-violet-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{t.highest_qualification || '—'}</p>
                  {t.university_or_institute && (
                    <p className="text-sm text-slate-500 mt-0.5">{t.university_or_institute}</p>
                  )}
                  {t.graduation_year && (
                    <p className="text-xs text-slate-400 mt-1">Graduated {t.graduation_year}</p>
                  )}
                  {t.resume_url && (
                    <a
                      href={t.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-sm text-emerald-600
                                 hover:text-emerald-700 font-medium transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      View Resume
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {t.notes && (
              <div className="card p-6">
                <h2 className="form-section-title">
                  <StickyNote className="w-4 h-4 text-slate-400" /> Notes
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{t.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Timetable tab ─────────────────────── */}
      {tab === 'timetable' && (
        <div className="animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              {timetable.length} period{timetable.length !== 1 ? 's' : ''} assigned this week
            </p>
            {canModify && (
              <Link href={`/teachers/${t.id}/timetable`} className="btn-primary btn-sm">
                <CalendarDays className="w-3.5 h-3.5" />
                Edit Timetable
              </Link>
            )}
          </div>
          {timetable.length > 0 ? (
            <TimetableGrid slots={timetable} />
          ) : (
            <div className="card empty-state">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <CalendarDays className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="text-sm font-semibold text-slate-600 mb-1">No timetable set</h3>
              <p className="text-xs text-slate-400">
                {canModify
                  ? <Link href={`/teachers/${t.id}/timetable`} className="text-emerald-600 hover:underline">Add periods to the timetable →</Link>
                  : 'No teaching periods have been assigned yet.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── History tab ───────────────────────── */}
      {tab === 'history' && (
        <div className="animate-fade-in-up">
          {history.length > 0 ? (
            <div className="card p-6">
              <h2 className="form-section-title">
                <Building2 className="w-4 h-4 text-slate-400" /> Employment History
              </h2>
              <div className="relative pl-6">
                {/* Timeline line */}
                <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200" />

                <div className="space-y-6">
                  {history.map((h, i) => (
                    <div key={h.id} className="relative">
                      {/* Dot */}
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm
                                      bg-gradient-to-br from-emerald-400 to-teal-500 flex-shrink-0" />
                      <div className="bg-slate-50 rounded-xl p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-1">
                          <p className="text-sm font-semibold text-slate-900">{h.school_name}</p>
                          {h.years_of_experience && (
                            <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200 flex-shrink-0">
                              {h.years_of_experience} yr{h.years_of_experience !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{h.designation}</p>
                        <p className="text-xs text-slate-400 mt-1.5">
                          {new Date(h.date_from).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })}
                          {' — '}
                          {h.date_to
                            ? new Date(h.date_to).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })
                            : 'Present'}
                        </p>
                        {h.reason_for_leaving && (
                          <p className="text-xs text-slate-400 mt-1.5 pt-1.5 border-t border-slate-200">
                            Reason: {h.reason_for_leaving}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card empty-state">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Building2 className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="text-sm font-semibold text-slate-600 mb-1">No employment history</h3>
              <p className="text-xs text-slate-400">Previous employment records will appear here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

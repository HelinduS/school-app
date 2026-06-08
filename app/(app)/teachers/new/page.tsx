import { requireRole } from '@/lib/auth'
import TeacherForm from '@/components/teachers/TeacherForm'
import Link from 'next/link'
import { ArrowLeft, UserPlus } from 'lucide-react'

export const metadata = { title: 'Add New Teacher' }

export default async function NewTeacherPage() {
  await requireRole(['principal', 'admin_clerk'])

  return (
    <div className="page-container max-w-4xl mx-auto animate-fade-in-up">
      <Link
        href="/teachers"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800
                   transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to teachers
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-emerald-600" />
            Add New Teacher
          </h1>
          <p className="page-subtitle">Complete the form to create a new staff profile.</p>
        </div>
      </div>

      <TeacherForm mode="create" />
    </div>
  )
}

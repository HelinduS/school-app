'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Trash2 } from 'lucide-react'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'

export default function DeleteTeacherButton({ teacherId }: { teacherId: string }) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const router   = useRouter()
  const supabase = createClient()
  const toast    = useToast()

  async function handleDelete() {
    setLoading(true)
    const { error } = await supabase.from('teachers').delete().eq('id', teacherId)

    if (error) {
      toast.error('Delete failed', error.message)
      setLoading(false)
      setOpen(false)
      return
    }

    toast.success('Teacher deleted', 'The staff record has been removed.')
    router.push('/teachers')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-danger"
        id="delete-teacher-btn"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>

      <ConfirmModal
        open={open}
        title="Delete Teacher?"
        message="This will permanently remove the teacher's profile, timetable, and employment history. This action cannot be undone."
        confirmLabel="Yes, Delete"
        danger
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}

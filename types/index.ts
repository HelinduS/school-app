export type UserRole = 'principal' | 'admin_clerk' | 'teacher'

export type EmploymentType = 'permanent' | 'contract' | 'temporary'

export type TeacherStatus = 'active' | 'on_leave' | 'transferred' | 'retired'

export interface Teacher {
  id: string
  created_at: string
  updated_at: string

  // Personal
  full_name: string
  name_with_initials: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  nic: string
  phone: string
  email: string | null
  address: string

  // Employment
  designation: string
  grade: string | null
  employment_type: EmploymentType
  status: TeacherStatus
  date_joined: string
  subject_ids: string[]

  // Transfer information
  transferred_to: string | null

  // Education
  highest_qualification: string
  university_or_institute: string
  graduation_year: number | null

  // Resume
  resume_url: string | null

  // Extra
  notes: string | null
}

export interface Subject {
  id: string
  name: string
  department: string | null
}

export interface TimetableSlot {
  id: string
  teacher_id: string
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'
  period: number
  subject_id: string
  grade: string
  class_name: string
  room: string | null
  subject?: Subject
  teacher?: Pick<Teacher, 'id' | 'full_name' | 'name_with_initials'>
}

export interface EmploymentHistory {
  id: string
  teacher_id: string
  school_name: string
  designation: string
  date_from: string
  date_to: string | null
  years_of_experience: number | null
  reason_for_leaving: string | null
}

export interface AppUser {
  id: string
  email: string
  role: UserRole
  teacher_id: string | null
  full_name: string
}

export interface DashboardStats {
  total_teachers: number
  active_teachers: number
  on_leave: number
  permanent: number
  contract: number
}

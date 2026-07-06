// ⚠️  GERADO AUTOMATICAMENTE — não edite à mão.
// Fonte: fitcoach-pro/src/types/database.ts
// Rode "npm run sync-types" após alterar os tipos no web.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Profile = {
  id: string
  full_name: string
  cpf: string
  cref: string
  email: string
  whatsapp: string
  phone: string | null
  birth_date: string
  city: string
  state: string
  avatar_url: string | null
  bio: string | null
  is_active: boolean
  is_admin: boolean
  plan: 'free' | 'pro' | 'business'
  phone_number: string | null
  phone_verified: boolean
  two_factor_channel: 'email' | 'sms'
  created_at: string
  updated_at: string
}

export type Student = {
  id: string
  trainer_id: string
  full_name: string
  whatsapp: string
  email: string | null
  birth_date: string | null
  gender: 'male' | 'female' | 'other' | null
  weight: number | null
  height: number | null
  objective: string | null
  injuries: string | null
  restrictions: string | null
  observations: string | null
  status: 'active' | 'inactive' | 'paused'
  subscription_start: string | null
  subscription_end: string | null
  monthly_fee: number | null
  whatsapp_opt_in: boolean
  whatsapp_opt_in_at: string | null
  created_at: string
  updated_at: string
}

export type Anamnese = {
  id: string
  student_id: string
  trainer_id: string
  health_history: string | null
  injuries: string | null
  surgeries: string | null
  medications: string | null
  objectives: string | null
  physical_activity_history: string | null
  smoker: boolean
  alcohol: boolean
  sleep_hours: number | null
  stress_level: number | null
  additional_info: string | null
  signed_at: string | null
  created_at: string
  updated_at: string
}

export type Evaluation = {
  id: string
  student_id: string
  trainer_id: string
  evaluation_date: string
  weight: number | null
  height: number | null
  body_fat: number | null
  lean_mass: number | null
  bmi: number | null
  neck: number | null
  chest: number | null
  waist: number | null
  abdomen: number | null
  hip: number | null
  right_arm: number | null
  left_arm: number | null
  right_forearm: number | null
  left_forearm: number | null
  right_thigh: number | null
  left_thigh: number | null
  right_calf: number | null
  left_calf: number | null
  tricep_fold: number | null
  subscapular_fold: number | null
  suprailiac_fold: number | null
  abdominal_fold: number | null
  thigh_fold: number | null
  observations: string | null
  created_at: string
  updated_at: string
}

export type Photo = {
  id: string
  student_id: string
  trainer_id: string
  photo_url: string
  photo_type: 'front' | 'back' | 'side_left' | 'side_right' | null
  taken_at: string
  notes: string | null
  created_at: string
}

export type ExerciseLibrary = {
  id: string
  trainer_id: string | null
  name: string
  category: string | null
  muscle_group: string | null
  equipment: string | null
  description: string | null
  video_url: string | null
  is_global: boolean
  created_at: string
  updated_at: string
}

export type Workout = {
  id: string
  trainer_id: string
  student_id: string | null
  name: string
  description: string | null
  type: 'custom' | 'template' | 'ai_generated'
  goal: string | null
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null
  duration_weeks: number | null
  days_per_week: number | null
  is_template: boolean
  template_category: string | null
  ai_prompt: string | null
  created_at: string
  updated_at: string
  workout_days?: WorkoutDay[]
}

export type WorkoutDay = {
  id: string
  workout_id: string
  name: string
  day_label: string
  day_order: number
  notes: string | null
  created_at: string
  workout_exercises?: WorkoutExercise[]
}

export type WorkoutExercise = {
  id: string
  workout_day_id: string
  workout_id: string
  exercise_name: string
  sets: number | null
  reps: string | null
  rest_seconds: number | null
  weight: string | null
  tempo: string | null
  notes: string | null
  exercise_order: number
  created_at: string
  updated_at: string
}

export type StudentWorkoutSchedule = {
  id: string
  student_id: string
  trainer_id: string
  workout_id: string
  weekday: number
  workout_label: string
  is_active: boolean
  created_at: string
  updated_at: string
  workout?: Workout
}

export type Payment = {
  id: string
  trainer_id: string
  student_id: string
  amount: number
  payment_date: string | null
  due_date: string
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  payment_method: 'pix' | 'cash' | 'transfer' | 'card' | 'other' | null
  reference_month: string | null
  notes: string | null
  created_at: string
  updated_at: string
  student?: Student
}

export type Notification = {
  id: string
  trainer_id: string
  student_id: string | null
  type: 'workout_reminder' | 'inactivity_alert' | 'renewal_reminder' | 'payment_due' | 'payment_received' | 'general'
  title: string
  message: string
  channel: 'whatsapp' | 'email' | 'push'
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  scheduled_for: string | null
  sent_at: string | null
  metadata: Json
  created_at: string
  updated_at: string
  student?: Student
}

export type AuditLog = {
  id: string
  user_id: string | null
  action: string
  resource: string
  resource_id: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: Json
  created_at: string
}

export type WhatsappMessage = {
  id: string
  trainer_id: string
  student_id: string
  message_sid: string | null
  kind: 'workout_pdf' | 'reminder' | 'video' | 'generic'
  status: string
  error_code: string | null
  created_at: string
}

export type CalendarConnection = {
  trainer_id: string
  provider: string
  refresh_token: string
  calendar_id: string
  connected_at: string
}

export type Session = {
  id: string
  trainer_id: string
  student_id: string
  starts_at: string
  ends_at: string
  google_event_id: string | null
  recurrence_rule: string | null
  reminder_sent: boolean
  created_at: string
  student?: Student
}

export type WorkoutVideo = {
  id: string
  trainer_id: string
  workout_id: string | null
  storage_path: string
  title: string
  description: string | null
  duration_seconds: number | null
  size_bytes: number | null
  shared_to_library: boolean
  library_status: 'private' | 'pending_review' | 'published' | 'rejected'
  published_at: string | null
  created_at: string
}

export type DashboardStats = {
  total_students: number
  active_students: number
  inactive_students: number
  paused_students: number
  total_workouts: number
  monthly_revenue: number
  pending_payments: number
  upcoming_renewals: number
}

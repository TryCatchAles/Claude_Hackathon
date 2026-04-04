// ── Enums ─────────────────────────────────────────────────────────────────────

export type UserStatus =
  | 'active'
  | 'flagged'
  | 'warning'
  | 'temp_ban'
  | 'tribunal'
  | 'permanent_ban'

export type TrustStatus =
  | 'active'
  | 'flagged'
  | 'warning_issued'
  | 'temporary_ban'
  | 'tribunal_review'
  | 'permanent_ban'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export type SessionStatus = 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled'

export type DisputeStatus = 'open' | 'resolved' | 'escalated'

export type FlagSeverity = 'low' | 'medium' | 'high'

// ── Table row types (mirror DB columns exactly) ───────────────────────────────

export interface Profile {
  id: string                  // mirrors auth.users(id)
  display_name: string | null
  bio: string | null
  school: string | null
  degree: string | null
  hashtags: string[]
  email_verified: boolean
  phone_verified: boolean
  edu_email: boolean
  status: UserStatus
  trust_status: TrustStatus
  credits: number
  created_at: string
  updated_at: string
}

export interface Skill {
  id: string
  name: string
  category: string | null
  created_at: string
}

export interface Booking {
  id: string
  mentor_id: string
  mentee_id: string
  scheduled_at: string
  duration_minutes: number
  status: BookingStatus
  message: string | null
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  booking_id: string
  mentor_id: string
  mentee_id: string
  calendar_event_id: string | null
  meet_meeting_code: string | null
  conference_record_id: string | null
  scheduled_at: string
  duration_minutes: number
  validated: boolean
  validated_at: string | null
  actual_duration_minutes: number | null
  status: SessionStatus
  created_at: string
  updated_at: string
}

export interface Rating {
  id: string
  session_id: string
  mentor_id: string
  mentee_id: string
  score: number             // 1–5
  comment: string | null
  fraud_flags: string[] | null
  created_at: string
}

export interface Credit {
  id: string
  user_id: string
  session_id: string
  rating_id: string
  amount: number
  created_at: string
}

export interface Dispute {
  id: string
  session_id: string
  filed_by: string
  reason: string
  status: DisputeStatus
  resolution: string | null
  created_at: string
  updated_at: string
}

export interface Flag {
  id: string
  user_id: string
  reason: string
  severity: FlagSeverity
  resolved: boolean
  created_at: string
  updated_at: string
}

// ── Action return shapes ───────────────────────────────────────────────────────

export interface ActionResult<T = void> {
  data: T | null
  error: string | null
}

export interface MentorSearchResult {
  profile: Profile
  relevance_score: number
  reason: string
}

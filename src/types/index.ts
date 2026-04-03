export type UserStatus = 'active' | 'flagged' | 'warning' | 'temp_ban' | 'tribunal' | 'permanent_ban'

export interface User {
  id: string
  email: string
  phone?: string
  status: UserStatus
  credits: number
  created_at: string
}

export interface Profile {
  id: string
  user_id: string
  bio?: string
  school?: string
  degree?: string
  hashtags: string[]
  is_verified: boolean
}

export interface Session {
  id: string
  mentor_id: string
  mentee_id: string
  meet_meeting_code: string
  conference_record_id?: string
  calendar_event_id: string
  scheduled_at: string
  duration_minutes: number
  status: 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled'
  validated: boolean
}

export interface Booking {
  id: string
  session_id: string
  mentee_id: string
  mentor_id: string
  created_at: string
}

export interface Rating {
  id: string
  session_id: string
  mentee_id: string
  mentor_id: string
  score: number // 1-5
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
  status: 'open' | 'resolved' | 'escalated'
  created_at: string
}

export interface Skill {
  id: string
  name: string
  category?: string
}

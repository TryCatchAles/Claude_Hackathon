## Product Name

Mentor-Mentee Skill Exchange Platform

---

## Goal

Enable users to:

* find mentors by skill
* book sessions
* learn through calls
* earn reputation (credits) by helping others

---

## Core Features

### 1. Authentication

* Google OAuth login
* No email/password signup in the app
* Optional school/work email verification

---

### 2. Profile System

Users can:

* add skills (hashtags)
* list school and degree
* write bio

---

### 3. Search & Discovery

* Search by skill or keyword only
* No name-based search
* AI-powered mentor matching (Claude API)

---

### 4. Booking System

Flow:

1. User selects mentor
2. Requests time slot
3. Booking confirmed
4. Calendar event created
5. Google Meet link generated

---

### 5. Session System

* Sessions occur on Google Meet
* System tracks:
  * Scheduled time
  * Manual confirmation (Honor System) to validate completion

---

### 6. Rating System

* Mentee can rate mentor
* Only once per session
* Optional (no blocking)
* Stored in rating history

---

### 7. Credit System

* Users start with 3 credits
* Credits are earned from high ratings
* Credits are NOT spent
* Credits act as reputation

---

### 8. History System

Users can view:

* past sessions
* ratings
* credits earned
* mentors/mentees interacted with

---

### 9. Trust & Safety

States:

* Active
* Flagged
* Warning
* Temporary ban
* Tribunal review
* Permanent ban

Triggers:

* low ratings
* disputes
* suspicious behavior

---

### 10. Disputes & Refunds

* Users can file disputes
* Disputes trigger review
* Credits may be withheld
* Refunds applied if needed

---

## User Flows

### Mentee Flow

1. Search skill
2. View mentors
3. Book session
4. Attend session
5. Optionally rate mentor

---

### Mentor Flow

1. Receive booking
2. Conduct session
3. Get rated
4. Earn credits if rating is high

---

## System Flow (Simplified)

User → Search → Match → Book → Session → Validate → Rate → Credit

---

## Tech Stack

### Frontend

* Next.js
* TypeScript
* Tailwind
* Vercel

### Backend

* Supabase (Postgres, Auth, Storage)
* Edge Functions

### AI

* Claude API

### External APIs

* Google Calendar API

---

## Non-Functional Requirements

* Prevent abuse (core priority)
* Fast search results
* Scalable matching
* Secure user data
* Clean UX (minimal friction)

---

## Risks

* credit farming via fake ratings
* low rating participation
* fake sessions
* trust degradation

---

## Future Improvements

* better fraud detection
* mentor verification tiers
* advanced ranking system
* real-time chat
* analytics dashboard

---

## Success Metrics

* sessions completed
* rating participation rate
* repeat users
* mentor engagement
* fraud rate (low)

---

## MVP Scope

Include:

* auth
* profile
* search
* booking
* Google Meet integration
* rating
* credits
* history

Exclude (for now):

* intro video
* payments
* advanced AI features

---

## Key Principle

The platform must ensure:

> Real interactions → meaningful ratings → earned reputation

Everything else supports this loop.

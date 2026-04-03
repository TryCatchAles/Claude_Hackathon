## Purpose

This file defines how AI agents (Claude, ChatGPT, etc.) should behave when working on this project.

Agents must follow all product rules and maintain system integrity.

---

## Core Responsibilities

When generating code or features, ALWAYS:

1. Respect credit system rules
2. Prevent abuse vectors
3. Use existing data structures
4. Keep logic simple and testable

---

## Things AI MUST NOT DO

* Do NOT allow name-based search
* Do NOT bypass session validation
* Do NOT create alternative credit systems
* Do NOT allow ratings outside sessions
* Do NOT allow multiple ratings per session
* Do NOT expose private user data
* Do NOT suggest features that weaken trust system

---

## Architecture (Layered System)

### 1. Frontend Layer

* Next.js (App Router)
* TypeScript
* Tailwind + shadcn/ui
* Hosted on Vercel

### 2. Backend / Logic Layer

* Supabase Edge Functions
* Next.js server actions

Handles:

* booking
* session validation
* rating logic
* credit logic
* fraud detection

---

### 3. Data Layer

* Supabase Postgres
* Supabase Auth
* Row Level Security

Core tables:

* users
* profiles
* skills
* sessions
* bookings
* ratings
* credits
* disputes
* flags

---

### 4. AI Layer

* Claude API

Used for:

* search query understanding
* mentor ranking

---

### 5. External Services

* Google Calendar API → scheduling + Meet link creation via centralized service account

---

## Feature Development Rules

When adding a feature:

1. Does it affect credits?
2. Can it be abused?
3. Does it require session validation?
4. Does it break any core rules?
5. Is it necessary for MVP?

---

## Testing Pipeline

### Layer 1 — Unit Tests

* credit logic
* rating validation
* state transitions

### Layer 2 — Integration Tests

* booking → session → rating flow

### Layer 3 — Simulation Tests

* fake users
* rating farming
* repeated interactions

### Layer 4 — Manual QA

* UI flows
* search relevance
* booking UX

---

## Coding Guidelines

* Use TypeScript strictly
* Keep functions small
* Avoid unnecessary abstraction
* Prefer clarity over cleverness
* Reuse existing schemas
* Do not duplicate business logic

---

## Data Consistency Rules

* One session → one rating max
* Credits only created via rating
* Session must be validated before rating
* All actions must be tied to user ID

---

## AI Behavior

* If unclear → ask for clarification
* Never invent business rules
* Always align with claude.md
* Prioritize security and trust

---

## Goal

AI should act as a:
→ disciplined junior engineer
→ who never breaks system logic
→ and always protects against abuse

**VERY IMPORTANT** 
***ALLOW FOR FREQUENT TESTING. AFTER EVERY LAYER WE NEED TO DO TESTING. AFTER EVERY FEATURE OR LAYER ALLOW THE USERS TO CONDUCT TESTS AND SEE IF IT WORKS***

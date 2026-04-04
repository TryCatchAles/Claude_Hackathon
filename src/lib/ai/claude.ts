import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export interface MentorProfile {
  id: string
  display_name: string | null
  bio: string | null
  hashtags: string[]
  school: string | null
  credits: number
}

export interface RankedMentor {
  mentor: MentorProfile
  relevanceScore: number
  reason: string
}

/**
 * Keyword-based fallback: scores mentors by how many query words appear
 * in their hashtags and bio. Returns only mentors with at least one match.
 */
function keywordMatch(query: string, mentors: MentorProfile[]): RankedMentor[] {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 1)
  if (words.length === 0) return []

  const scored = mentors.map(mentor => {
    const searchText = [
      ...mentor.hashtags,
      mentor.bio ?? '',
      mentor.school ?? '',
    ].join(' ').toLowerCase()

    const hashtagText = mentor.hashtags.join(' ').toLowerCase()

    let score = 0
    const matchedTags: string[] = []

    for (const word of words) {
      // Hashtag match scores higher than bio match
      if (hashtagText.includes(word)) {
        score += 2
        const tag = mentor.hashtags.find(t => t.includes(word))
        if (tag && !matchedTags.includes(tag)) matchedTags.push(tag)
      } else if (searchText.includes(word)) {
        score += 1
      }
    }

    return { mentor, score, matchedTags }
  }).filter(r => r.score > 0)

  const maxScore = Math.max(...scored.map(r => r.score), 1)

  return scored
    .sort((a, b) => b.score - a.score || b.mentor.credits - a.mentor.credits)
    .map(r => ({
      mentor: r.mentor,
      relevanceScore: Math.min(r.score / maxScore, 1),
      reason: r.matchedTags.length > 0
        ? `Matches your search on: ${r.matchedTags.slice(0, 3).join(', ')}`
        : 'Relevant based on profile content',
    }))
}

/**
 * Maps a natural language search query to relevant mentors.
 * Tries Gemini AI first; falls back to keyword matching if AI is unavailable.
 */
export async function matchMentors(
  query: string,
  mentors: MentorProfile[]
): Promise<RankedMentor[]> {
  if (mentors.length === 0) return []

  // Try Gemini AI first
  try {
    const prompt = `You are a skill-based mentor matching system. Match only by skills, keywords, bio, and expertise. NEVER match by name.

Search query: "${query}"

Mentor profiles:
${JSON.stringify(
  mentors.map((m) => ({
    id: m.id,
    bio: m.bio,
    hashtags: m.hashtags,
    school: m.school,
    credits: m.credits,
  })),
  null,
  2
)}

Return a JSON array of matched mentors ranked by relevance. Each item:
{ "mentorId": "<id>", "relevanceScore": <0.0-1.0>, "reason": "<one sentence, skill-based>" }

Rules:
- Only include mentors with relevanceScore > 0.1
- Return [] if no mentors are relevant
- Return ONLY the JSON array, no markdown`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

    const ranked: { mentorId: string; relevanceScore: number; reason: string }[] = JSON.parse(text)
    const matched = ranked
      .map((r) => ({
        mentor: mentors.find((m) => m.id === r.mentorId)!,
        relevanceScore: r.relevanceScore,
        reason: r.reason,
      }))
      .filter((r) => r.mentor != null)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)

    if (matched.length > 0) return matched
  } catch {
    // Gemini unavailable (rate limit, quota, etc.) — fall through to keyword matching
  }

  // Keyword fallback — always works, no API calls
  return keywordMatch(query, mentors)
}

export interface FraudCheckInput {
  menteeId: string
  mentorId: string
  score: number
  pastSessionCount: number      // total sessions between this pair
  menteeRatingsLast24h: number  // ratings the mentee submitted in the last 24 h
}

export interface FraudCheckResult {
  isSuspicious: boolean
  flags: string[]
  recommendation: 'allow' | 'flag' | 'review'
}

/**
 * Analyses a pending rating for fraud signals.
 * Runs in parallel with other checks via Promise.all — never blocks the happy path.
 * Returns 'allow' when nothing looks wrong.
 */
export async function detectFraud(input: FraudCheckInput): Promise<FraudCheckResult> {
  const prompt = `You are a fraud-detection agent for a mentor-mentee platform.
Analyse the following rating submission for suspicious patterns.

Rating context:
- mentee_id: ${input.menteeId}
- mentor_id: ${input.mentorId}
- score: ${input.score} / 5
- total past sessions between this pair: ${input.pastSessionCount}
- ratings submitted by this mentee in the last 24 h: ${input.menteeRatingsLast24h}

Fraud signals to check:
1. "repeat_pair" — more than 5 sessions between the same pair (possible friend-farming)
2. "rating_burst" — mentee submitted 5 or more ratings in the last 24 h (bot-like behaviour)
3. "extreme_score" — score is 1 or 5 with very high repeat_pair count (possible manipulation)

Return ONLY a JSON object, no markdown:
{
  "isSuspicious": <true|false>,
  "flags": ["<signal_name>", ...],
  "recommendation": "<allow|flag|review>"
}`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const fraudResult: FraudCheckResult = JSON.parse(cleaned)
    return fraudResult
  } catch {
    // Fail open — never block a legitimate rating due to a transient AI error
    return { isSuspicious: false, flags: [], recommendation: 'allow' }
  }
}

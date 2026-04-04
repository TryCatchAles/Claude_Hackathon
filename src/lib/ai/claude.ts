import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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
 * Maps a natural language search query to relevant mentors.
 * Matches by skill/keyword only — name matching is explicitly forbidden.
 */
export async function matchMentors(
  query: string,
  mentors: MentorProfile[]
): Promise<RankedMentor[]> {
  if (mentors.length === 0) return []

  const prompt = `You are a skill-based mentor matching system. You MUST match only by skills, keywords, bio, and expertise. You must NEVER match by name.

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

Return a JSON array of matched mentors ranked by relevance. Each item must have:
{
  "mentorId": "<id>",
  "relevanceScore": <number between 0.0 and 1.0>,
  "reason": "<one sentence, skill-based reason only>"
}

Rules:
- Only include mentors with relevanceScore > 0.1
- Return [] if no mentors are relevant
- Return ONLY the JSON array, no markdown, no explanation`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text =
    message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  try {
    const ranked: { mentorId: string; relevanceScore: number; reason: string }[] =
      JSON.parse(text)

    return ranked
      .map((r) => ({
        mentor: mentors.find((m) => m.id === r.mentorId)!,
        relevanceScore: r.relevanceScore,
        reason: r.reason,
      }))
      .filter((r) => r.mentor != null)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
  } catch {
    return []
  }
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
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })

    const text =
      message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const result: FraudCheckResult = JSON.parse(text)
    return result
  } catch {
    // Fail open — never block a legitimate rating due to a transient AI error
    return { isSuspicious: false, flags: [], recommendation: 'allow' }
  }
}

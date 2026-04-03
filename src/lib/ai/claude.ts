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

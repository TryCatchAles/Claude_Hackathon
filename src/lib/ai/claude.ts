import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * Maps a natural language search query to relevant skills/keywords.
 * Used for skill-based mentor discovery (no name search allowed).
 */
export async function mapQueryToSkills(query: string): Promise<string[]> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `Extract a list of relevant skills and keywords from this search query for a mentor platform.
Return only a JSON array of strings. Query: "${query}"`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
  try {
    return JSON.parse(text)
  } catch {
    return []
  }
}

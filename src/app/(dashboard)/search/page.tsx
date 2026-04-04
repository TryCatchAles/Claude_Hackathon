import { getAllProfiles } from '@/actions/profile'
import { matchMentors } from '@/lib/ai/claude'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import type { Profile } from '@/types'

interface Props {
  searchParams: Promise<{ q?: string }>
}

function StarDisplay({ avg, count }: { avg: number | null; count: number }) {
  if (count === 0) return <span className="text-xs text-zinc-300">No ratings yet</span>
  const full = Math.floor(avg ?? 0)
  const half = (avg ?? 0) - full >= 0.5
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1l1.3 2.6 2.9.4-2.1 2 .5 2.9L6 7.5l-2.6 1.4.5-2.9-2.1-2 2.9-.4z"
            fill={i <= full ? '#f59e0b' : (i === full + 1 && half) ? '#f59e0b' : 'none'}
            stroke="#f59e0b"
            strokeWidth="0.8"
            opacity={i <= full || (i === full + 1 && half) ? '1' : '0.3'}
          />
        </svg>
      ))}
      <span className="text-xs text-zinc-500 ml-1">{(avg ?? 0).toFixed(1)}</span>
      <span className="text-xs text-zinc-400">({count})</span>
    </span>
  )
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const { data: profiles } = await getAllProfiles()
  const allProfiles = profiles ?? []

  // Fetch average ratings for all mentors in one query
  const service = createServiceClient()
  const { data: ratingsData } = await service
    .from('ratings')
    .select('mentor_id, score')

  const ratingsByMentor = new Map<string, { sum: number; count: number }>()
  for (const r of ratingsData ?? []) {
    const cur = ratingsByMentor.get(r.mentor_id) ?? { sum: 0, count: 0 }
    ratingsByMentor.set(r.mentor_id, { sum: cur.sum + r.score, count: cur.count + 1 })
  }
  const avgRating = (id: string) => {
    const r = ratingsByMentor.get(id)
    if (!r || r.count === 0) return { avg: null, count: 0 }
    return { avg: r.sum / r.count, count: r.count }
  }

  // Top mentors by credits — always the fallback / default view
  const topMentors = [...allProfiles].sort((a, b) => b.credits - a.credits)

  let results: Profile[] = topMentors
  const reasons = new Map<string, string>()
  let searchUsed = false

  if (q?.trim() && allProfiles.length > 0) {
    const ranked = await matchMentors(
      q,
      allProfiles.map(p => ({
        id: p.id,
        display_name: p.display_name,
        bio: p.bio,
        hashtags: p.hashtags,
        school: p.school,
        credits: p.credits,
      })),
    )
    if (ranked.length > 0) {
      const profileMap = new Map(allProfiles.map(p => [p.id, p]))
      results = ranked
        .map(r => profileMap.get(r.mentor.id))
        .filter((p): p is Profile => p != null)
      for (const r of ranked) reasons.set(r.mentor.id, r.reason)
      searchUsed = true
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1">Find a mentor</h1>
        <p className="text-zinc-500 text-sm">Search by skill or keyword. Results are ranked by expertise — no name search.</p>
      </div>

      {/* Search bar */}
      <form method="GET" className="mb-8">
        <div className="flex gap-2 max-w-xl">
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="e.g. machine learning, React, AWS, design systems…"
            className="flex-1 bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
          />
          <button
            type="submit"
            className="bg-zinc-900 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-zinc-700 active:scale-[0.98] transition-all"
          >
            Search
          </button>
        </div>
        <p className="text-xs text-zinc-400 mt-2.5">
          {q
            ? searchUsed
              ? <>{results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;</>
              : <>No mentors matched &ldquo;{q}&rdquo; — showing top mentors by reputation</>
            : <>Top {results.length} mentor{results.length !== 1 ? 's' : ''} by reputation</>
          }
        </p>
      </form>

      {/* Results */}
      {results.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
          <p className="text-zinc-500 text-sm">No mentors yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {results.map((profile, i) => {
            const { avg, count } = avgRating(profile.id)
            return (
              <div
                key={profile.id}
                className="bg-white border border-zinc-200 rounded-xl p-5 flex items-start justify-between gap-6 hover:border-zinc-300 transition-colors"
              >
                <div className="flex items-start gap-4 min-w-0">
                  {/* Rank badge */}
                  <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {searchUsed ? (profile.display_name?.[0]?.toUpperCase() ?? '?') : `#${i + 1}`}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 text-sm leading-tight">
                      {profile.display_name ?? 'Anonymous'}
                    </p>
                    {profile.school && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {profile.school}{profile.degree ? ` · ${profile.degree}` : ''}
                      </p>
                    )}
                    <div className="mt-1">
                      <StarDisplay avg={avg} count={count} />
                    </div>
                    {reasons.get(profile.id) && (
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        {reasons.get(profile.id)}
                      </p>
                    )}
                    {profile.bio && (
                      <p className="text-sm text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {profile.bio}
                      </p>
                    )}
                    {profile.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {profile.hashtags.map(tag => (
                          <span key={tag} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md font-medium">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
                  <Link
                    href={`/book/${profile.id}`}
                    className="bg-zinc-900 text-white rounded-lg px-4 py-1.5 text-xs font-semibold hover:bg-zinc-700 transition-colors whitespace-nowrap"
                  >
                    Book · 1 credit
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { getAllProfiles } from '@/actions/profile'
import { matchMentors } from '@/lib/ai/claude'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import type { Profile } from '@/types'

interface Props {
  searchParams: Promise<{ q?: string }>
}

function StarDisplay({ avg, count }: { avg: number | null; count: number }) {
  if (count === 0) return <span className="text-xs text-white/70">No ratings yet</span>
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
            opacity={i <= full || (i === full + 1 && half) ? '1' : '0.25'}
          />
        </svg>
      ))}
      <span className="text-xs text-white/80 ml-1">{(avg ?? 0).toFixed(1)}</span>
      <span className="text-xs text-white/70">({count})</span>
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
      <div className="mb-10">
        <p
          className="text-xs font-light tracking-widest uppercase mb-3 opacity-60"
          style={{ color: 'rgba(210,180,255,0.9)', fontFamily: 'Sterion, sans-serif' }}
        >
          Mentor Discovery
        </p>
        <h1
          className="font-light tracking-tight leading-none mb-3 bg-gradient-to-r from-pink-300 via-purple-300 to-pink-300 bg-clip-text text-transparent"
          style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
        >
          Find a mentor
        </h1>
        <p className="text-white/45 font-light text-sm leading-relaxed">
          Search by skill or keyword. Results are ranked by expertise — no name search.
        </p>
      </div>

      {/* Search bar */}
      <form method="GET" className="mb-8">
        <div className="flex gap-2 max-w-xl">
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="e.g. machine learning, React, AWS, design systems…"
            suppressHydrationWarning
            className="flex-1 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-purple-400/30 transition"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.14)',
              backdropFilter: 'blur(12px)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.25)',
            }}
          />
          <button
            type="submit"
            suppressHydrationWarning
            className="bg-white text-zinc-900 rounded-2xl px-6 py-3 text-sm font-semibold hover:bg-violet-50 hover:shadow-[0_0_28px_rgba(160,100,220,0.5)] active:scale-[0.97] transition-all whitespace-nowrap"
          >
            Search
          </button>
        </div>
        <p className="text-xs text-white/40 mt-2.5">
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
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}
        >
          <p className="text-white/70 text-sm">No mentors yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {results.map((profile, i) => {
            const { avg, count } = avgRating(profile.id)
            return (
              <div
                key={profile.id}
                className="mentor-card rounded-2xl p-5 flex items-start justify-between gap-6"
              >
                <div className="flex items-start gap-4 min-w-0">
                  {/* Rank badge */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)' }}
                  >
                    {searchUsed ? (profile.display_name?.[0]?.toUpperCase() ?? '?') : `#${i + 1}`}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm leading-tight">
                      {profile.display_name ?? 'Anonymous'}
                    </p>
                    {profile.school && (
                      <p className="text-xs text-white/75 mt-0.5">
                        {profile.school}{profile.degree ? ` · ${profile.degree}` : ''}
                      </p>
                    )}
                    <div className="mt-1">
                      <StarDisplay avg={avg} count={count} />
                    </div>
                    {reasons.get(profile.id) && (
                      <p className="text-xs text-violet-400 mt-1 font-medium">
                        {reasons.get(profile.id)}
                      </p>
                    )}
                    {profile.bio && (
                      <p className="text-sm text-white/85 mt-1.5 line-clamp-2 leading-relaxed">
                        {profile.bio}
                      </p>
                    )}
                    {profile.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {profile.hashtags.map(tag => (
                          <span
                            key={tag}
                            className="text-xs text-white/85 px-2 py-0.5 rounded-md font-medium"
                            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.16)' }}
                          >
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
                    className="bg-white text-zinc-900 rounded-xl px-4 py-1.5 text-xs font-semibold hover:bg-violet-50 hover:shadow-[0_0_20px_rgba(160,100,220,0.4)] active:scale-[0.97] transition-all whitespace-nowrap"
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

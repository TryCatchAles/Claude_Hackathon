import { getAllProfiles } from '@/actions/profile'
import Link from 'next/link'
import type { Profile } from '@/types'

interface Props {
  searchParams: Promise<{ q?: string }>
}

function filterProfiles(profiles: Profile[], query: string): Profile[] {
  if (!query.trim()) return profiles
  const terms = query.toLowerCase().split(/\s+/)
  return profiles.filter(p => {
    const haystack = [
      ...(p.hashtags ?? []),
      p.bio ?? '',
      p.school ?? '',
      p.degree ?? '',
    ].join(' ').toLowerCase()
    return terms.every(term => haystack.includes(term))
  })
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const { data: profiles } = await getAllProfiles()
  const results = filterProfiles(profiles ?? [], q ?? '')

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1">Find a mentor</h1>
        <p className="text-zinc-500 text-sm">Search by skill or keyword. No name search — results are based on expertise only.</p>
      </div>

      {/* Search bar */}
      <form method="GET" className="mb-8">
        <div className="flex gap-2 max-w-xl">
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="e.g. python, system design, public speaking…"
            className="flex-1 bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
          />
          <button
            type="submit"
            className="bg-zinc-900 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-zinc-700 active:scale-[0.98] transition-all"
          >
            Search
          </button>
        </div>
        {q && (
          <p className="text-xs text-zinc-400 mt-2.5">
            {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
          </p>
        )}
      </form>

      {/* Results */}
      {results.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
          <p className="text-zinc-500 text-sm">No mentors found for that skill.</p>
          <p className="text-zinc-400 text-xs mt-1">Try a broader term like &ldquo;python&rdquo; or &ldquo;design&rdquo;.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {results.map(profile => (
            <div
              key={profile.id}
              className="bg-white border border-zinc-200 rounded-xl p-5 flex items-start justify-between gap-6 hover:border-zinc-300 transition-colors"
            >
              <div className="flex items-start gap-4 min-w-0">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {profile.display_name?.[0]?.toUpperCase() ?? '?'}
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-900 text-sm leading-tight">
                    {profile.display_name ?? 'Anonymous'}
                  </p>
                  {profile.school && (
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {profile.school}{profile.degree ? ` · ${profile.degree}` : ''}
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
                        <span
                          key={tag}
                          className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
                <span className="text-xs text-zinc-400">
                  {profile.credits} {profile.credits === 1 ? 'credit' : 'credits'}
                </span>
                <Link
                  href={`/book/${profile.id}`}
                  className="bg-zinc-900 text-white rounded-lg px-4 py-1.5 text-xs font-semibold hover:bg-zinc-700 transition-colors whitespace-nowrap"
                >
                  Book
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Find a Mentor</h1>

      <form method="GET" className="mb-8">
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search by skill, e.g. python, machine learning..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-700 transition"
          >
            Search
          </button>
        </div>
        {q && (
          <p className="text-sm text-gray-500 mt-2">
            {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
          </p>
        )}
      </form>

      {results.length === 0 ? (
        <p className="text-gray-500 text-sm">No mentors found. Try a different skill.</p>
      ) : (
        <div className="grid gap-4">
          {results.map(profile => (
            <div key={profile.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                  {profile.display_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{profile.display_name ?? 'Anonymous'}</p>
                  {profile.school && (
                    <p className="text-xs text-gray-500">{profile.school}{profile.degree ? ` · ${profile.degree}` : ''}</p>
                  )}
                  {profile.bio && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{profile.bio}</p>
                  )}
                  {profile.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {profile.hashtags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400">{profile.credits} credits</span>
                <Link
                  href={`/book/${profile.id}`}
                  className="bg-indigo-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-indigo-700 transition"
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

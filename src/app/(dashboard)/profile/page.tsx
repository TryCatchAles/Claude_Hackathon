import { getOwnProfile } from '@/actions/profile'
import { updateProfile } from '@/actions/profile'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const { data: profile, error } = await getOwnProfile()
  if (error || !profile) redirect('/login')

  async function handleUpdate(formData: FormData) {
    'use server'
    const hashtags = (formData.get('hashtags') as string)
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean)

    await updateProfile({
      display_name: (formData.get('display_name') as string) || undefined,
      bio: (formData.get('bio') as string) || undefined,
      school: (formData.get('school') as string) || undefined,
      degree: (formData.get('degree') as string) || undefined,
      hashtags,
    })
    redirect('/profile')
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
            {profile.display_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{profile.display_name ?? 'No name set'}</p>
            <p className="text-sm text-gray-500">{profile.credits} credits</p>
          </div>
        </div>
        {profile.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.hashtags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <form action={handleUpdate} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Edit Profile</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
          <input
            name="display_name"
            defaultValue={profile.display_name ?? ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            name="bio"
            defaultValue={profile.bio ?? ''}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
          <input
            name="school"
            defaultValue={profile.school ?? ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
          <input
            name="degree"
            defaultValue={profile.degree ?? ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Skills (comma-separated)
          </label>
          <input
            name="hashtags"
            defaultValue={profile.hashtags.join(', ')}
            placeholder="python, machine learning, react"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-400 mt-1">These are used to match you with mentees.</p>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition"
        >
          Save changes
        </button>
      </form>
    </div>
  )
}

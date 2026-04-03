import { getOwnProfile, updateProfile } from '@/actions/profile'
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
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1">Profile</h1>
        <p className="text-sm text-zinc-500">Your public mentor profile. Skills are used to match you with mentees.</p>
      </div>

      {/* Preview card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
          {profile.display_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="font-semibold text-zinc-900 text-sm">{profile.display_name ?? 'No name set'}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{profile.credits} credits earned</p>
          {profile.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {profile.hashtags.map(tag => (
                <span key={tag} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit form */}
      <form action={handleUpdate} className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
        <Field label="Display name" name="display_name" defaultValue={profile.display_name ?? ''} placeholder="Your full name" />

        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Bio</label>
          <textarea
            name="bio"
            defaultValue={profile.bio ?? ''}
            rows={3}
            placeholder="What can you teach? What's your background?"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="School" name="school" defaultValue={profile.school ?? ''} placeholder="MIT, Stanford…" />
          <Field label="Degree" name="degree" defaultValue={profile.degree ?? ''} placeholder="B.Sc. Computer Science" />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Skills</label>
          <input
            name="hashtags"
            defaultValue={profile.hashtags.join(', ')}
            placeholder="python, react, system design, machine learning"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition"
          />
          <p className="text-xs text-zinc-400 mt-1.5">Comma-separated. Used to match you in skill searches.</p>
        </div>

        <button
          type="submit"
          className="w-full bg-zinc-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-zinc-700 active:scale-[0.98] transition-all"
        >
          Save changes
        </button>
      </form>
    </div>
  )
}

function Field({ label, name, defaultValue, placeholder }: {
  label: string; name: string; defaultValue: string; placeholder: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition"
      />
    </div>
  )
}

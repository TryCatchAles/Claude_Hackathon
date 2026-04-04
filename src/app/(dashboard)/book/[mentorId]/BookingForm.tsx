'use client'

import { useRef, useState, useTransition } from 'react'

interface Props {
  selectedDate: string
  minDate: string
  bookedHours: number[]
  action: (formData: FormData) => Promise<void>
  formattedDate: string
}

const SLOT_HOURS = [9, 10, 11, 13, 14, 15, 16, 17]

function formatSlot(hour: number): string {
  const suffix = hour < 12 ? 'AM' : 'PM'
  const display = hour <= 12 ? hour : hour - 12
  return `${display}:00 ${suffix}`
}

export default function BookingForm({ selectedDate, minDate, bookedHours, action, formattedDate }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const bookedSet = new Set(bookedHours)

  function handleDateChange() {
    // Auto-submit to refresh available slots when the date changes
    formRef.current?.requestSubmit()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget
    const hour = new FormData(form).get('hour')
    // If no slot selected, it's a date-change submit — don't mark as booking submitted
    if (!hour) return
    setSubmitted(true)
  }

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit}>
      {/* Date picker — auto-submits on change */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Date</label>
        <input
          type="date"
          name="date"
          defaultValue={selectedDate}
          min={minDate}
          onChange={handleDateChange}
          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
        />
      </div>

      {/* Slots */}
      <div className="mb-6">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">{formattedDate}</p>
        <div className="grid grid-cols-4 gap-2">
          {SLOT_HOURS.map(hour => {
            const booked = bookedSet.has(hour)
            return (
              <label
                key={hour}
                className={`flex items-center justify-center rounded-lg border py-2.5 text-xs font-medium select-none transition-all
                  ${booked
                    ? 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed'
                    : 'border-zinc-200 text-zinc-700 cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 has-[:checked]:bg-zinc-900 has-[:checked]:border-zinc-900 has-[:checked]:text-white'
                  }`}
              >
                <input type="radio" name="hour" value={hour} disabled={booked} className="sr-only" />
                {formatSlot(hour)}
              </label>
            )
          })}
        </div>
        <p className="text-xs text-zinc-400 mt-2.5">Times shown in UTC · 60-minute sessions</p>
      </div>

      <button
        type="submit"
        disabled={submitted || isPending}
        className="w-full bg-zinc-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-zinc-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitted || isPending ? 'Booking…' : 'Confirm booking · 1 credit'}
      </button>
      <p className="text-xs text-zinc-400 text-center mt-3">
        A Google Calendar invite with Meet link will be sent to both participants.
      </p>
    </form>
  )
}

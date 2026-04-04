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
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const bookedSet = new Set(bookedHours)

  function handleDateChange() {
    setSelectedHour(null)
    formRef.current?.requestSubmit()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget
    const hour = new FormData(form).get('hour')
    if (!hour) return
    setSubmitted(true)
  }

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit}>
      {/* Date picker */}
      <div className="mb-6">
        <label className="block text-xs font-medium uppercase tracking-widest mb-2 text-white/40">Date</label>
        <input
          type="date"
          name="date"
          defaultValue={selectedDate}
          min={minDate}
          onChange={handleDateChange}
          className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400/40 transition"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.14)',
            backdropFilter: 'blur(12px)',
            colorScheme: 'dark',
          }}
        />
      </div>

      {/* Slots */}
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-widest mb-3 text-white/40">{formattedDate}</p>
        <div className="grid grid-cols-4 gap-2">
          {SLOT_HOURS.map(hour => {
            const booked = bookedSet.has(hour)
            const selected = selectedHour === hour
            return (
              <label
                key={hour}
                onClick={() => !booked && setSelectedHour(hour)}
                className={`flex items-center justify-center rounded-xl py-2.5 text-xs font-medium select-none transition-all
                  ${booked ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'}`}
                style={{
                  background: selected
                    ? 'rgba(255,255,255,0.25)'
                    : booked
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.07)',
                  border: selected
                    ? '1px solid rgba(255,255,255,0.5)'
                    : '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <input type="radio" name="hour" value={hour} disabled={booked} className="sr-only" readOnly checked={selected} />
                <span className={selected ? 'text-white font-semibold' : 'text-white/60'}>{formatSlot(hour)}</span>
              </label>
            )
          })}
        </div>
        <p className="text-xs text-white/30 mt-2.5">Times shown in UTC · 60-minute sessions</p>
      </div>

      <button
        type="submit"
        disabled={submitted || isPending}
        suppressHydrationWarning
        className="w-full rounded-xl px-5 py-3 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_28px_rgba(160,100,220,0.5)] active:scale-[0.98]"
        style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white' }}
      >
        {submitted || isPending ? 'Booking…' : 'Confirm booking · 1 credit'}
      </button>
      <p className="text-xs text-white/25 text-center mt-3">
        A Google Calendar invite with Meet link will be sent to both participants.
      </p>
    </form>
  )
}

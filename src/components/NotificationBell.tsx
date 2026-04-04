'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NotificationBell({ initialCount }: { initialCount: number }) {
  const pathname = usePathname()
  // Hide the badge as soon as the user is on the notifications page
  const count = pathname === '/notifications' ? 0 : initialCount

  return (
    <Link
      href="/notifications"
      className="relative hidden sm:flex items-center justify-center w-8 h-8 rounded-md hover:bg-zinc-100 transition-colors"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-zinc-500"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}

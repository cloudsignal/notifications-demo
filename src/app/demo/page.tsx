'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ReceiverApp } from '@/components/receiver-app'
import type { Session } from '@supabase/supabase-js'

export default function DemoPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
      if (!data.session) {
        window.location.href = '/'
      }
    })
  }, [supabase])

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between bg-gray-100 px-4 py-2">
        <span className="text-xs text-gray-500">Logged in as {session.user.email}</span>
        <div className="flex gap-2">
          <a
            href="/demo/split"
            className="rounded bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-800"
          >
            Open Split View
          </a>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
            className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200"
          >
            Sign Out
          </button>
        </div>
      </div>
      <div className="flex-1">
        <ReceiverApp session={session} />
      </div>
    </div>
  )
}

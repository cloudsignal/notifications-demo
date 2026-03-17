'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { SenderPanel } from '@/components/sender-panel'
import { ReceiverApp } from '@/components/receiver-app'
import type { Session } from '@supabase/supabase-js'

export default function SplitPage() {
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
    <div className="flex h-screen">
      {/* Left — Sender */}
      <div className="w-[400px] flex-shrink-0 border-r border-gray-700">
        <SenderPanel targetUserId={session.user.id} />
      </div>

      {/* Right — Receiver */}
      <div className="flex-1">
        <ReceiverApp session={session} />
      </div>
    </div>
  )
}

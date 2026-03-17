'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { AuthForm } from '@/components/auth-form'
import type { Session } from '@supabase/supabase-js'

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
      if (data.session) {
        window.location.href = '/demo'
      }
    })
  }, [supabase])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-800 p-8">
        <h1 className="mb-2 text-2xl font-bold text-white">
          CloudSignal Notifications
        </h1>
        <p className="mb-8 text-sm text-gray-400">
          Real-time notification demo powered by CloudSignal MQTT + Supabase Auth
        </p>
        <AuthForm />
      </div>
    </div>
  )
}

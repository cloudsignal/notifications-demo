'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    setLoading(false)
    if (!error) setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-400">Check your email for a magic link!</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        autoComplete="email"
        className="rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-blue-500 px-4 py-3 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Sign in with Magic Link'}
      </button>
    </form>
  )
}

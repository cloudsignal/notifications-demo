'use client'

import { useState, useCallback } from 'react'

interface SendOptions {
  userId?: string
  notification: Record<string, unknown>
  channel?: string
}

export function useNotificationSender() {
  const [sending, setSending] = useState(false)

  const send = useCallback(async (options: SendOptions) => {
    setSending(true)
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      return data
    } finally {
      setSending(false)
    }
  }, [])

  return { send, sending }
}

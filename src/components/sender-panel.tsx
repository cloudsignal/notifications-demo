'use client'

import { useState } from 'react'
import { useNotificationSender } from '@/hooks/use-notification-sender'
import { SAMPLES } from '@/lib/sample-notifications'

interface SenderPanelProps {
  targetUserId: string
}

interface LogEntry {
  id: string
  type: string
  title: string
  topic: string
  time: string
}

export function SenderPanel({ targetUserId }: SenderPanelProps) {
  const { send, sending } = useNotificationSender()
  const [log, setLog] = useState<LogEntry[]>([])

  const sendNotification = async (key: keyof typeof SAMPLES) => {
    const sample = SAMPLES[key]
    const channel = 'channel' in sample ? sample.channel : undefined

    const result = await send({
      userId: channel ? undefined : targetUserId,
      notification: { ...sample },
      channel: channel as string | undefined,
    })

    if (result?.ok) {
      setLog(prev => [{
        id: result.id,
        type: sample.type,
        title: sample.title,
        topic: result.topic,
        time: new Date().toLocaleTimeString(),
      }, ...prev].slice(0, 20))
    }
  }

  const personalButtons = [
    { key: 'orderShipped' as const, label: 'Ship Order #1234', color: 'bg-blue-500 hover:bg-blue-600' },
    { key: 'paymentReceived' as const, label: 'Payment Received $49.99', color: 'bg-green-500 hover:bg-green-600' },
    { key: 'paymentRefunded' as const, label: 'Refund Processed', color: 'bg-yellow-500 hover:bg-yellow-600' },
    { key: 'teamMention' as const, label: '@user mentioned you', color: 'bg-purple-500 hover:bg-purple-600' },
  ]

  const channelButtons = [
    { key: 'systemMaintenance' as const, label: 'System Maintenance', color: 'bg-orange-500 hover:bg-orange-600' },
    { key: 'flashSale' as const, label: 'Flash Sale: 50% Off', color: 'bg-pink-500 hover:bg-pink-600' },
  ]

  return (
    <div className="flex h-full flex-col bg-gray-900 p-6">
      <h2 className="mb-1 text-lg font-bold text-white">Sender Panel</h2>
      <p className="mb-6 text-xs text-gray-400">Simulates server-side notifications via API route</p>

      <div className="mb-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Personal Notifications</h3>
        <div className="flex flex-col gap-2">
          {personalButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => sendNotification(btn.key)}
              disabled={sending}
              className={`rounded-lg px-4 py-2.5 text-left text-sm font-medium text-white disabled:opacity-50 ${btn.color}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Channel Broadcasts</h3>
        <div className="flex flex-col gap-2">
          {channelButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => sendNotification(btn.key)}
              disabled={sending}
              className={`rounded-lg px-4 py-2.5 text-left text-sm font-medium text-white disabled:opacity-50 ${btn.color}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Send Log</h3>
        <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: '300px' }}>
          {log.length === 0 ? (
            <p className="text-xs text-gray-600">No notifications sent yet</p>
          ) : (
            log.map(entry => (
              <div key={entry.id + entry.time} className="rounded bg-gray-800 px-3 py-2 text-xs">
                <span className="text-gray-400">{entry.time}</span>
                <span className="mx-1 text-gray-600">|</span>
                <span className="font-medium text-white">{entry.title}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

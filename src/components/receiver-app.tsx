'use client'

import { NotificationProvider, NotificationBell, NotificationToast, useChannels } from '@cloudsignal/notifications'
import { StorefrontMock } from './storefront-mock'

interface Session {
  user: { id: string }
  access_token: string
}

interface ReceiverAppProps {
  session: Session
}

function ChannelToggles() {
  const { channels, subscribe, unsubscribe } = useChannels()

  const toggles = [
    { id: 'announcements', label: 'Announcements' },
    { id: 'promotions', label: 'Promotions' },
  ]

  return (
    <div className="flex items-center gap-4 border-t border-gray-200 bg-gray-50 px-6 py-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Channels:</span>
      {toggles.map(toggle => (
        <label key={toggle.id} className="flex items-center gap-1.5 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={channels.includes(toggle.id)}
            onChange={e => e.target.checked ? subscribe(toggle.id) : unsubscribe(toggle.id)}
            className="rounded"
          />
          {toggle.label}
        </label>
      ))}
    </div>
  )
}

export function ReceiverApp({ session }: ReceiverAppProps) {
  return (
    <NotificationProvider
      userId={session.user.id}
      connection={{
        host: process.env.NEXT_PUBLIC_CLOUDSIGNAL_WSS_URL!,
        organizationId: process.env.NEXT_PUBLIC_CLOUDSIGNAL_ORG_ID!,
        externalToken: session.access_token,
        tokenServiceUrl: process.env.NEXT_PUBLIC_TOKEN_SERVICE_URL!,
      }}
      channels={['announcements']}
    >
      <div className="flex h-full flex-col bg-white">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-900">ShopDemo</span>
            <nav className="flex gap-4 text-sm text-gray-500">
              <span>Products</span>
              <span>Orders</span>
              <span>Account</span>
            </nav>
          </div>
          <NotificationBell
            onNotificationClick={n => {
              if (n.action?.url) window.open(n.action.url, '_self')
            }}
          />
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <StorefrontMock />
        </div>

        {/* Channel toggles */}
        <ChannelToggles />
      </div>

      {/* Toast overlay */}
      <NotificationToast position="top-right" />
    </NotificationProvider>
  )
}

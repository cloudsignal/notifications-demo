# CloudSignal Notifications Demo

A live demo of `@cloudsignal/notifications` showing realtime in-app notifications in an e-commerce/SaaS context. Built with Next.js 16, Supabase Auth, and CloudSignal MQTT.

## What This Demo Shows

- **Realtime MQTT notifications** arriving instantly via WebSocket
- **Supabase Auth integration** with magic link login
- **Split view**: sender panel (simulating server) and receiver app side by side
- **Personal notifications**: order shipped, payment received, refund, team mention
- **Channel broadcasts**: system maintenance, flash sale promotions
- **Channel subscription toggles**: subscribe/unsubscribe at runtime
- **NotificationBell** with unread badge and dropdown
- **NotificationToast** with auto-dismiss popup alerts

## Architecture

```
+-------------------+         +--------------------+         +------------------+
|   Sender Panel    |  POST   |   /api/notify      |  MQTT   |   VerneMQ Broker |
|   (browser UI)    | ------> |   (API route)      | ------> |   (CloudSignal)  |
+-------------------+         +--------------------+         +--------+---------+
                                                                       |
                                                              MQTT/WSS |
                                                                       v
                              +--------------------+         +------------------+
                              |   Receiver App     | <------ |  MQTT Client     |
                              |   (browser UI)     |   push  |  (SDK internal)  |
                              +--------------------+         +------------------+
```

1. **Sender Panel** calls `/api/notify` with a notification payload
2. **API Route** verifies the Supabase session, connects to MQTT with a secret key, and publishes the notification
3. **VerneMQ Broker** routes the message to the correct topic
4. **Receiver App** receives the notification via the `@cloudsignal/notifications` SDK over WebSocket
5. **NotificationBell** and **NotificationToast** render the notification in real-time

## Setup

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)
- A CloudSignal organization with MQTT credentials

### 1. Clone and Install

```bash
cd notifications-demo
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

```bash
# .env.local

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# CloudSignal (client-side)
NEXT_PUBLIC_CLOUDSIGNAL_WSS_URL=wss://connect.cloudsignal.app:18885/
NEXT_PUBLIC_CLOUDSIGNAL_ORG_ID=org_your_org_short_id
NEXT_PUBLIC_TOKEN_SERVICE_URL=https://auth.cloudsignal.app

# CloudSignal (server-side only -- for API route publishing)
CLOUDSIGNAL_SECRET_KEY=sk_your_secret_key
CLOUDSIGNAL_MQTT_HOST=wss://connect.cloudsignal.app:18885/
CLOUDSIGNAL_ORG_ID=org_your_org_short_id
```

### 3. Supabase Project Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Authentication > URL Configuration
3. Add `http://localhost:3000/auth/callback` to the Redirect URLs
4. Copy the Project URL and Anon Key to your `.env.local`

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with a magic link, then navigate to the split view.

## How It Works

### Login Flow

The home page shows a magic link login form powered by Supabase Auth:

```tsx
// src/components/auth-form.tsx
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
});
```

After clicking the magic link, the auth callback route exchanges the code for a session:

```typescript
// src/app/auth/callback/route.ts
await supabase.auth.exchangeCodeForSession(code);
// Redirects to /demo
```

### Receiver App (SDK Integration)

The receiver app wraps everything in `NotificationProvider` with Supabase session credentials:

```tsx
// src/components/receiver-app.tsx
import { NotificationProvider, NotificationBell, NotificationToast, useChannels } from "@cloudsignal/notifications";

export function ReceiverApp({ session }: { session: Session }) {
  return (
    <NotificationProvider
      userId={session.user.id}
      connection={{
        host: process.env.NEXT_PUBLIC_CLOUDSIGNAL_WSS_URL!,
        organizationId: process.env.NEXT_PUBLIC_CLOUDSIGNAL_ORG_ID!,
        externalToken: session.access_token,
        tokenServiceUrl: process.env.NEXT_PUBLIC_TOKEN_SERVICE_URL!,
      }}
      channels={["announcements"]}
    >
      <header>
        <NotificationBell
          onNotificationClick={(n) => {
            if (n.action?.url) window.open(n.action.url, "_self");
          }}
        />
      </header>
      <StorefrontMock />
      <ChannelToggles />
      <NotificationToast position="top-right" />
    </NotificationProvider>
  );
}
```

### Channel Toggles

Users can subscribe/unsubscribe to channels at runtime:

```tsx
function ChannelToggles() {
  const { channels, subscribe, unsubscribe } = useChannels();

  const toggles = [
    { id: "announcements", label: "Announcements" },
    { id: "promotions", label: "Promotions" },
  ];

  return (
    <div>
      {toggles.map((toggle) => (
        <label key={toggle.id}>
          <input
            type="checkbox"
            checked={channels.includes(toggle.id)}
            onChange={(e) =>
              e.target.checked ? subscribe(toggle.id) : unsubscribe(toggle.id)
            }
          />
          {toggle.label}
        </label>
      ))}
    </div>
  );
}
```

### API Route (Server-Side MQTT Publish)

The sender panel calls `/api/notify` which publishes to MQTT server-side with a secret key:

```typescript
// src/app/api/notify/route.ts
import mqtt from "mqtt";

export async function POST(request: NextRequest) {
  // 1. Verify Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Parse request
  const { userId, notification, channel } = await request.json();

  // 3. Build payload
  const payload = {
    ...notification,
    id: notification.id || crypto.randomUUID().slice(0, 8),
    ts: notification.ts || Date.now(),
  };

  // 4. Determine topic
  let topic: string;
  if (channel) {
    topic = `$notifications/channels/${channel}`;
  } else {
    topic = `$notifications/${userId}/inbox`;
    if (notification.category) {
      topic = `$notifications/${userId}/inbox/${notification.category}`;
    }
  }

  // 5. Connect and publish
  const client = mqtt.connect(MQTT_HOST, {
    username: `server@${ORG_ID}`,
    password: SECRET_KEY,
    clientId: `notify-api-${Date.now()}`,
    connectTimeout: 5000,
  });

  // ... publish, disconnect, return response
}
```

### Split View

The split view (`/demo/split`) shows both panels side by side:

- **Left panel**: Sender buttons that trigger different notification types
- **Right panel**: The receiver app showing the storefront with bell, toasts, and channel toggles

```tsx
// src/app/demo/split/page.tsx
export default function SplitPage() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: "400px", borderRight: "1px solid #333" }}>
        <SenderPanel targetUserId={session.user.id} />
      </div>
      <div style={{ flex: 1 }}>
        <ReceiverApp session={session} />
      </div>
    </div>
  );
}
```

## Notification Types in the Demo

### Personal Notifications (published to user inbox)

```typescript
// Order Shipped
{
  type: "order.shipped",
  title: "Order Shipped",
  body: "Your order #1234 has been shipped and is on its way!",
  icon: "package-icon",
  category: "orders",
  action: { label: "Track Order", url: "/orders/1234" },
}

// Payment Received
{
  type: "payment.received",
  title: "Payment Received",
  body: "We received your payment of $49.99",
  icon: "credit-card-icon",
  category: "payments",
  action: { label: "View Receipt", url: "/payments/receipt-5678" },
}

// Payment Refunded
{
  type: "payment.refunded",
  title: "Refund Processed",
  body: "Your refund of $29.99 has been processed",
  icon: "money-icon",
  category: "payments",
  action: { label: "View Details", url: "/payments/refund-3456" },
}

// Team Mention
{
  type: "team.mention",
  title: "New Mention",
  body: "@alex mentioned you in Project Alpha",
  icon: "message-icon",
  category: "mentions",
  sender: { name: "Alex Chen" },
  action: { label: "View Message", url: "/messages/thread-91011" },
}
```

### Channel Broadcasts (published to channel topics)

```typescript
// System Maintenance (announcements channel)
{
  type: "system.maintenance",
  title: "Scheduled Maintenance",
  body: "Systems will be briefly unavailable tonight at 2:00 AM UTC",
  icon: "wrench-icon",
  category: "system",
  channel: "announcements",
}

// Flash Sale (promotions channel)
{
  type: "promotion.sale",
  title: "Flash Sale: 50% Off",
  body: "Limited time offer on all premium plans!",
  icon: "party-icon",
  category: "promotions",
  channel: "promotions",
  action: { label: "Shop Now", url: "/pricing" },
}
```

## How to Extend with Custom Notifications

### 1. Add a Sample Notification Template

```typescript
// src/lib/sample-notifications.ts
export const SAMPLES = {
  // ... existing samples ...

  inventoryAlert: {
    type: "inventory.low",
    title: "Low Stock Alert",
    body: "Wireless Headphones has only 3 units remaining",
    icon: "alert-icon",
    category: "inventory",
    action: { label: "Restock", url: "/admin/inventory/headphones" },
    data: { productId: "headphones-001", remaining: 3 },
  },
};
```

### 2. Add a Button to the Sender Panel

```tsx
// In sender-panel.tsx, add to personalButtons array:
{ key: "inventoryAlert" as const, label: "Low Stock Alert", color: "bg-red-500 hover:bg-red-600" },
```

### 3. Handle the Event in the Receiver

```tsx
import { useNotificationEvent } from "@cloudsignal/notifications";

function InventoryMonitor() {
  useNotificationEvent("inventory.low", (notification) => {
    console.log("Low stock:", notification.data);
    // Show a persistent warning, refresh inventory list, etc.
  });

  return null;
}
```

## Project Structure

```
notifications-demo/
  src/
    app/
      api/notify/route.ts       -- Server-side MQTT publish endpoint
      auth/callback/route.ts    -- Supabase auth callback handler
      demo/page.tsx             -- Main demo page (receiver only)
      demo/split/page.tsx       -- Split view (sender + receiver)
      page.tsx                  -- Login page
      layout.tsx                -- Root layout
    components/
      auth-form.tsx             -- Magic link login form
      receiver-app.tsx          -- NotificationProvider + bell + toasts
      sender-panel.tsx          -- Buttons that trigger notifications
      storefront-mock.tsx       -- Fake product grid
    hooks/
      use-notification-sender.ts -- fetch wrapper for /api/notify
    lib/
      sample-notifications.ts   -- Notification payload templates
      supabase.ts               -- Supabase browser client
  .env.example                  -- Environment variable template
  package.json
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@cloudsignal/notifications` | Realtime notification SDK (bell, toasts, hooks) |
| `@cloudsignal/mqtt-client` | MQTT WebSocket transport (peer dep) |
| `@supabase/ssr` | Supabase Auth with SSR cookie support |
| `@supabase/supabase-js` | Supabase client library |
| `mqtt` | Server-side MQTT client (for API route publishing) |
| `next` | Next.js 16 App Router |
| `react` / `react-dom` | React 19 |
| `tailwindcss` | Styling |

## Scripts

```bash
npm run dev    # Start development server on port 3000
npm run build  # Production build
npm run start  # Start production server
npm run lint   # Run ESLint
```

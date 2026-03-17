import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import mqtt from 'mqtt'

const MQTT_HOST = process.env.CLOUDSIGNAL_MQTT_HOST!
const SECRET_KEY = process.env.CLOUDSIGNAL_SECRET_KEY!
const ORG_ID = process.env.CLOUDSIGNAL_ORG_ID!

export async function POST(request: NextRequest) {
  try {
    // Verify Supabase session
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options as never))
          },
        },
      },
    )
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, notification, channel } = await request.json()

    if (!notification?.type || !notification?.title || !notification?.body) {
      return NextResponse.json({ error: 'Missing required notification fields' }, { status: 400 })
    }

    // Add id and ts if not provided — spread first, then override
    const payload = {
      ...notification,
      id: notification.id || crypto.randomUUID().slice(0, 8),
      ts: notification.ts || Date.now(),
    }

    // Determine target topic
    let topic: string
    if (channel) {
      topic = `$notifications/channels/${channel}`
    } else if (userId) {
      topic = `$notifications/${userId}/inbox`
      if (notification.category) {
        topic = `$notifications/${userId}/inbox/${notification.category}`
      }
    } else {
      return NextResponse.json({ error: 'userId or channel required' }, { status: 400 })
    }

    // Connect, publish, disconnect
    const client = mqtt.connect(MQTT_HOST, {
      username: `server@${ORG_ID}`,
      password: SECRET_KEY,
      clientId: `notify-api-${Date.now()}`,
      connectTimeout: 5000,
    })

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        client.end(true)
        reject(new Error('MQTT connection timeout'))
      }, 5000)

      client.on('connect', () => {
        clearTimeout(timeout)
        client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
          client.end()
          if (err) reject(err)
          else resolve()
        })
      })

      client.on('error', (err) => {
        clearTimeout(timeout)
        client.end(true)
        reject(err)
      })
    })

    return NextResponse.json({ ok: true, topic, id: payload.id })
  } catch (err) {
    console.error('Notify API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}

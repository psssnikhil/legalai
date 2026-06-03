// Google Calendar helper — uses stored OAuth tokens (no extra keys needed)
import { prisma } from '@/lib/prisma'

async function getAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: 'google' },
    select: { access_token: true, refresh_token: true, expires_at: true },
  })

  if (!account?.access_token) return null

  // Check if token is expired (expires_at is in seconds)
  const isExpired = account.expires_at && account.expires_at * 1000 < Date.now()

  if (!isExpired) return account.access_token

  // Refresh if expired
  if (!account.refresh_token) return null

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: account.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    const data = await res.json() as { access_token?: string; expires_in?: number }
    if (!data.access_token) return null

    // Update stored token
    await prisma.account.updateMany({
      where: { userId, provider: 'google' },
      data: {
        access_token: data.access_token,
        expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
      },
    })

    return data.access_token
  } catch {
    return null
  }
}

interface HearingEvent {
  title: string
  hearingDate: Date | string
  startTime: string | null
  endTime?: string | null
  court?: string | null
  clientName?: string | null
  caseTitle?: string | null
  notes?: string | null
}

function buildEventBody(h: HearingEvent) {
  const dateStr = h.hearingDate instanceof Date ? h.hearingDate.toISOString() : h.hearingDate
  const date = dateStr.split('T')[0] // YYYY-MM-DD
  const startTime = h.startTime || '10:00'
  const start = `${date}T${startTime}:00`
  const endTime = h.endTime || addHour(startTime)
  const end = `${date}T${endTime}:00`

  const description = [
    h.caseTitle && `Case: ${h.caseTitle}`,
    h.clientName && `Client: ${h.clientName}`,
    h.court && `Court: ${h.court}`,
    h.notes && `Notes: ${h.notes}`,
  ].filter(Boolean).join('\n')

  return {
    summary: h.title,
    location: h.court || '',
    description,
    start: { dateTime: start, timeZone: 'Asia/Kolkata' },
    end: { dateTime: end, timeZone: 'Asia/Kolkata' },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 1440 }, // 24h
      ],
    },
  }
}

function addHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const newH = (h + 1) % 24
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export async function createCalendarEvent(userId: string, hearing: HearingEvent): Promise<string | null> {
  const token = await getAccessToken(userId)
  if (!token) return null

  try {
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(buildEventBody(hearing)),
    })

    if (!res.ok) {
      console.error('[Calendar] Create failed:', await res.text())
      return null
    }

    const data = await res.json() as { id?: string }
    return data.id ?? null
  } catch (err) {
    console.error('[Calendar] Create error:', err)
    return null
  }
}

export async function updateCalendarEvent(userId: string, eventId: string, hearing: HearingEvent): Promise<void> {
  const token = await getAccessToken(userId)
  if (!token) return

  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(buildEventBody(hearing)),
    })
    if (!res.ok) console.error('[Calendar] Update failed:', await res.text())
  } catch (err) {
    console.error('[Calendar] Update error:', err)
  }
}

export async function deleteCalendarEvent(userId: string, eventId: string): Promise<void> {
  const token = await getAccessToken(userId)
  if (!token) return

  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok && res.status !== 404) console.error('[Calendar] Delete failed:', await res.text())
  } catch (err) {
    console.error('[Calendar] Delete error:', err)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmailToUser, buildDailyDigestEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // Protect cron endpoint
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999)
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  try {
    // Get all active users who have Google OAuth
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        accounts: { where: { provider: 'google' }, select: { access_token: true } },
      },
    })

    let sent = 0

    for (const user of users) {
      if (!user.email) continue
      const googleAccount = user.accounts[0]
      if (!googleAccount?.access_token) continue

      // Today's hearings
      const todayHearings = await prisma.hearing.findMany({
        where: {
          userId: user.id,
          hearingDate: { gte: todayStart, lte: todayEnd },
          status: { not: 'CANCELLED' },
        },
        select: { title: true, court: true, startTime: true, clientName: true },
      })

      // Upcoming deadlines (next 7 days)
      const cases = await prisma.case.findMany({
        where: {
          userId: user.id,
          status: { not: 'CLOSED' },
          OR: [
            { limitationDate: { gte: now, lte: sevenDaysLater } },
            { filingDeadline: { gte: now, lte: sevenDaysLater } },
            { replyDeadline: { gte: now, lte: sevenDaysLater } },
          ],
        },
        select: { title: true, limitationDate: true, filingDeadline: true, replyDeadline: true },
      })

      const deadlines: { caseTitle: string; type: string; date: string }[] = []
      for (const c of cases) {
        if (c.limitationDate) deadlines.push({ caseTitle: c.title, type: 'Limitation Date', date: c.limitationDate.toLocaleDateString('en-IN') })
        if (c.filingDeadline) deadlines.push({ caseTitle: c.title, type: 'Filing Deadline', date: c.filingDeadline.toLocaleDateString('en-IN') })
        if (c.replyDeadline) deadlines.push({ caseTitle: c.title, type: 'Reply Deadline', date: c.replyDeadline.toLocaleDateString('en-IN') })
      }

      // Pending tasks count
      const pendingTasks = await prisma.task.count({
        where: { case: { userId: user.id }, done: false },
      })

      // Skip if nothing to report
      if (!todayHearings.length && !deadlines.length && !pendingTasks) continue

      const html = buildDailyDigestEmail({
        userName: user.name?.split(' ')[0] || 'Advocate',
        todayHearings,
        upcomingDeadlines: deadlines,
        pendingTasks,
      })

      const ok = await sendEmailToUser(googleAccount.access_token, user.email, `📅 Daily Digest — ${new Date().toLocaleDateString('en-IN')}`, html)
      if (ok) sent++
    }

    return NextResponse.json({ ok: true, sent })
  } catch (err) {
    console.error('[Cron] Daily digest error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// Email via Gmail API (no extra packages needed — uses fetch + service account or OAuth)
// For simplicity: uses Gmail SMTP via the built-in Node net — OR just logs if not configured
// We use a simple approach: POST to a Gmail SMTP relay via fetch isn't possible without nodemailer
// So we'll use the Gmail API with the stored OAuth token

export async function sendEmailToUser(
  accessToken: string,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    // Build RFC 2822 email
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      html,
    ].join('\r\n')

    const encoded = Buffer.from(email).toString('base64url')

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encoded }),
    })

    if (!res.ok) {
      console.error('[Email] Gmail API error:', await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('[Email] Send failed:', err)
    return false
  }
}

export function buildDailyDigestEmail(data: {
  userName: string
  todayHearings: { title: string; court: string | null; startTime: string | null; clientName: string | null }[]
  upcomingDeadlines: { caseTitle: string; type: string; date: string }[]
  pendingTasks: number
}) {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  const hearingsHtml = data.todayHearings.length
    ? data.todayHearings.map(h => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">📅 ${h.title}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;">${h.startTime} · ${h.court || 'TBD'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;">${h.clientName || ''}</td>
        </tr>`).join('')
    : '<tr><td colspan="3" style="padding:12px;color:#94a3b8;">No hearings today</td></tr>'

  const deadlinesHtml = data.upcomingDeadlines.length
    ? data.upcomingDeadlines.map(d => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">⚠️ ${d.caseTitle}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#ef4444;">${d.type}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#ef4444;font-weight:600;">${d.date}</td>
        </tr>`).join('')
    : '<tr><td colspan="3" style="padding:12px;color:#94a3b8;">No urgent deadlines</td></tr>'

  return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;border-radius:12px 12px 0 0;">
        <h1 style="color:#ffffff;margin:0;font-size:22px;">Good morning, ${data.userName} 👋</h1>
        <p style="color:#c7d2fe;margin:8px 0 0;">${today}</p>
      </div>
      <div style="padding:24px;background:#f8fafc;">
        ${data.pendingTasks > 0 ? `
        <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
          📋 You have <strong>${data.pendingTasks} pending task${data.pendingTasks > 1 ? 's' : ''}</strong> across your cases.
        </div>` : ''}
        <div style="background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:20px;overflow:hidden;">
          <div style="padding:12px 16px;background:#f1f5f9;font-weight:700;color:#1e293b;">🏛️ Today's Hearings</div>
          <table style="width:100%;border-collapse:collapse;">${hearingsHtml}</table>
        </div>
        <div style="background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;">
          <div style="padding:12px 16px;background:#fef2f2;font-weight:700;color:#991b1b;">⚠️ Deadlines (Next 7 Days)</div>
          <table style="width:100%;border-collapse:collapse;">${deadlinesHtml}</table>
        </div>
      </div>
      <div style="padding:16px 24px;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #f1f5f9;">
        Tralyx Legal · <a href="${process.env.NEXTAUTH_URL}" style="color:#6366f1;">Open App</a>
      </div>
    </div>
  `
}

import { prisma } from './db'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

async function getSmtpSettings(): Promise<Record<string, string>> {
  const keys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from']
  const settings = await prisma.setting.findMany({ where: { key: { in: keys } } })
  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value
  return map
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  try {
    const smtp = await getSmtpSettings()
    if (!smtp.smtp_host || !smtp.smtp_user || !smtp.smtp_pass) {
      console.warn('[email] SMTP ayarları eksik, email gönderilmedi.')
      return false
    }

    // Dynamic nodemailer import — only used server-side
    const nodemailer = await import('nodemailer').catch(() => null)
    if (!nodemailer) {
      console.warn('[email] nodemailer yüklü değil.')
      return false
    }

    const transporter = nodemailer.default.createTransport({
      host: smtp.smtp_host,
      port: parseInt(smtp.smtp_port ?? '587', 10),
      secure: smtp.smtp_port === '465',
      auth: { user: smtp.smtp_user, pass: smtp.smtp_pass },
    })

    await transporter.sendMail({
      from: smtp.smtp_from ?? smtp.smtp_user,
      to,
      subject,
      html,
    })
    return true
  } catch (err) {
    console.error('[email] Gönderim hatası:', err)
    return false
  }
}

export async function sendNewCommentNotification(comment: {
  name: string
  email: string
  content: string
  postTitle: string
  postSlug: string
}): Promise<void> {
  try {
    const adminEmailSetting = await prisma.setting.findUnique({ where: { key: 'comment_notify_email' } })
    const notifyEnabled = await prisma.setting.findUnique({ where: { key: 'comment_notify_enabled' } })

    if (notifyEnabled?.value !== 'true') return
    const adminEmail = adminEmailSetting?.value
    if (!adminEmail) return

    const siteUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

    await sendEmail({
      to: adminEmail,
      subject: `Yeni yorum onay bekliyor — ${comment.postTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00c896;">💬 Yeni Yorum</h2>
          <p><strong>Kişi:</strong> ${comment.name} (${comment.email})</p>
          <p><strong>Yazı:</strong> ${comment.postTitle}</p>
          <hr/>
          <blockquote style="border-left: 3px solid #00c896; padding-left: 12px; color: #555;">
            ${comment.content}
          </blockquote>
          <hr/>
          <p>
            <a href="${siteUrl}/superadmin/yorumlar" style="background:#00c896;color:#000;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">
              Yorumları Yönet →
            </a>
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[email] Bildirim hatası:', err)
  }
}

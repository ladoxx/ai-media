import { prisma } from './db'

type NotificationType =
  | 'NEW_COMMENT'
  | 'NEW_SUBSCRIBER'
  | 'NEW_AFFILIATE_CLICK'
  | 'AUTOMATION_SUCCESS'
  | 'AUTOMATION_ERROR'
  | 'SYSTEM_ERROR'
  | 'NEW_USER'
  | 'LOW_DISK'

export async function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  try {
    await prisma.notification.create({
      data: { type, title, message, link: link ?? null },
    })

    // Check notification settings
    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: 'notif_' } },
    })
    const cfg = Object.fromEntries(settings.map((s) => [s.key, s.value]))

    // Email notification
    const emailEnabled = cfg['notif_email_enabled'] !== 'false'
    const emailMap: Partial<Record<NotificationType, string>> = {
      NEW_COMMENT:       'notif_email_new_comment',
      AUTOMATION_ERROR:  'notif_email_auto_error',
      SYSTEM_ERROR:      'notif_email_system_error',
      NEW_SUBSCRIBER:    'notif_email_new_subscriber',
    }
    const emailKey = emailMap[type]
    if (emailEnabled && emailKey && cfg[emailKey] !== 'false') {
      const adminEmail = cfg['notif_admin_email'] ?? 'admin@cyba.com.tr'
      const { sendEmail } = await import('./email')
      await sendEmail({
        to: adminEmail,
        subject: `[Cyba] ${title}`,
        html: `<p>${message}</p>${link ? `<p><a href="${link}">Görüntüle →</a></p>` : ''}`,
      }).catch(() => {})
    }
  } catch {
    // Never throw — notifications are non-critical
  }
}

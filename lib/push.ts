import { prisma } from './db'

export async function sendPushNotification(
  title: string,
  body: string,
  url: string = '/'
) {
  const webpush = await import('web-push')

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidEmail = process.env.VAPID_EMAIL ?? 'mailto:admin@cyba.com.tr'

  if (!vapidPublicKey || !vapidPrivateKey) return { sent: 0, failed: 0 }

  webpush.default.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)

  const subscriptions = await prisma.pushSubscription.findMany()
  let sent = 0
  let failed = 0

  const payload = JSON.stringify({ title, body, url })

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.default.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch {
        failed++
        // Remove expired/invalid subscriptions
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
      }
    })
  )

  return { sent, failed }
}

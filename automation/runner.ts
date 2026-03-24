/**
 * Standalone automation runner — spawned as a child process by the API route.
 * Outputs newline-delimited JSON to stdout so the parent can stream it as SSE.
 * Env vars are inherited from the parent Next.js process.
 */
import { runAutomation } from './index'

const category = process.argv[2] || 'all'

function emit(obj: object) {
  process.stdout.write(JSON.stringify(obj) + '\n')
}

runAutomation(category, async (message: string) => {
  emit({ type: 'log', message })
})
  .then((results) => {
    const totalPublished = results.reduce((s, r) => s + r.published, 0)
    const totalCost = results.length
    emit({ type: 'done', totalPublished, totalCost, results })
    process.exit(0)
  })
  .catch((err) => {
    const message = err instanceof Error ? err.message : String(err)
    emit({ type: 'error', message })
    process.exit(1)
  })

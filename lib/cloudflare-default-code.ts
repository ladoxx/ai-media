export const DEFAULT_WORKER_CODE = `export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Auth
    const authHeader = request.headers.get('Authorization')
    if (!env.SECRET_KEY || authHeader !== \`Bearer \${env.SECRET_KEY}\`) {
      return new Response('Unauthorized', { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return new Response('Invalid JSON', { status: 400 })
    }

    const { prompt, width = 1200, height = 630 } = body

    if (!prompt) {
      return new Response('Prompt required', { status: 400 })
    }

    try {
      const result = await env.AI.run(
        '@cf/black-forest-labs/flux-1-schnell',
        { prompt, num_steps: 4, width, height }
      )

      let imageData

      if (result instanceof ReadableStream) {
        const reader = result.getReader()
        const chunks = []
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
        }
        const totalLen = chunks.reduce((acc, c) => acc + c.length, 0)
        imageData = new Uint8Array(totalLen)
        let offset = 0
        for (const chunk of chunks) {
          imageData.set(chunk, offset)
          offset += chunk.length
        }
      } else if (result?.image) {
        const binary = atob(result.image)
        imageData = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          imageData[i] = binary.charCodeAt(i)
        }
      } else {
        imageData = result
      }

      return new Response(imageData, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }
  },
}`

export class CloudflareWorkerClient {
  private workerUrl: string
  private secretKey: string
  private accountId: string
  private apiToken: string
  private workerName: string

  constructor(config: {
    workerUrl: string
    secretKey: string
    accountId?: string
    apiToken?: string
    workerName?: string
  }) {
    this.workerUrl = config.workerUrl
    this.secretKey = config.secretKey
    this.accountId = config.accountId || ''
    this.apiToken = config.apiToken || ''
    this.workerName = config.workerName || ''
  }

  async generateImage(options: {
    prompt: string
    width?: number
    height?: number
  }): Promise<Buffer> {
    // Flux requires dimensions divisible by 8
    const snap8 = (n: number) => Math.round(n / 8) * 8
    const width = snap8(options.width || 1200)
    const height = snap8(options.height || 624)

    const response = await fetch(this.workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.secretKey}`,
      },
      body: JSON.stringify({ prompt: options.prompt, width, height }),
      signal: AbortSignal.timeout(120000),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Cloudflare Worker hata: ${response.status} ${text.slice(0, 100)}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  async getWorkerCode(): Promise<string> {
    if (!this.accountId || !this.apiToken || !this.workerName) {
      throw new Error('Account ID, API Token ve Worker adı gerekli')
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/workers/scripts/${this.workerName}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          Accept: 'application/javascript',
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Kod getirme hatası: ${response.status}`)
    }

    return await response.text()
  }

  async updateWorkerCode(code: string): Promise<void> {
    if (!this.accountId || !this.apiToken || !this.workerName) {
      throw new Error('Account ID, API Token ve Worker adı gerekli')
    }

    const formData = new FormData()
    formData.append(
      'metadata',
      new Blob(
        [JSON.stringify({ main_module: 'worker.js', compatibility_date: '2024-01-01' })],
        { type: 'application/json' },
      ),
    )
    formData.append(
      'worker.js',
      new Blob([code], { type: 'application/javascript+module' }),
      'worker.js',
    )

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/workers/scripts/${this.workerName}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: formData,
      },
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Kod güncelleme hatası: ${JSON.stringify(error)}`)
    }
  }

  async testConnection(): Promise<{
    success: boolean
    duration: number
    size?: number
    error?: string
  }> {
    const start = Date.now()
    try {
      const buffer = await this.generateImage({
        prompt: 'simple test image blue background white text',
        width: 256,
        height: 256,
      })
      return {
        success: buffer.length > 0,
        duration: Date.now() - start,
        size: buffer.length,
      }
    } catch (error: unknown) {
      return {
        success: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
}

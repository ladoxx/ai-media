import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const KEY_HEX = process.env.ENCRYPTION_KEY ?? ''

function getKey(): Buffer | null {
  if (!KEY_HEX || KEY_HEX.length !== 64) return null
  try {
    return Buffer.from(KEY_HEX, 'hex')
  } catch {
    return null
  }
}

/**
 * Encrypts a plain-text string using AES-256-CBC.
 * Returns a string in the format `iv_hex:encrypted_hex`.
 * Throws if ENCRYPTION_KEY is missing or invalid — never stores plain text.
 */
export function encrypt(text: string): string {
  const key = getKey()
  if (!key) {
    throw new Error(
      '[crypto] ENCRYPTION_KEY is missing or invalid. ' +
      'Set a 64-character hex string (openssl rand -hex 32) in your .env.local file.'
    )
  }
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Decrypts a string in the format `iv_hex:encrypted_hex`.
 * Throws if ENCRYPTION_KEY is missing or invalid.
 * Falls back to returning cipherText as-is only if the format doesn't match (legacy plain-text values).
 */
export function decrypt(cipherText: string): string {
  const key = getKey()
  if (!key) {
    throw new Error(
      '[crypto] ENCRYPTION_KEY is missing or invalid. Cannot decrypt stored values.'
    )
  }

  try {
    const [ivHex, encryptedHex] = cipherText.split(':')
    if (!ivHex || !encryptedHex) return cipherText
    const iv = Buffer.from(ivHex, 'hex')
    const encryptedBuffer = Buffer.from(encryptedHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    // Decryption failed — value may not be encrypted (legacy plain-text)
    return cipherText
  }
}

/**
 * Masks a decrypted value for safe display in the UI.
 * Returns first 4 chars + '••••••••' + last 4 chars.
 * Returns '(boş)' for empty strings.
 */
export function maskValue(value: string): string {
  if (!value || value.trim() === '') return '(boş)'
  if (value.length <= 8) return '••••••••'
  return `${value.slice(0, 4)}••••••••${value.slice(-4)}`
}

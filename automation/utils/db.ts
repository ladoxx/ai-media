import Database from 'better-sqlite3'
import path from 'path'
import crypto from 'crypto'

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(path.join(process.cwd(), 'automation.db'))
    _db.exec(`
      CREATE TABLE IF NOT EXISTS seen_urls (
        hash TEXT PRIMARY KEY,
        seen_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS seen_titles (
        hash TEXT PRIMARY KEY,
        seen_at INTEGER NOT NULL
      );
    `)
    // Cleanup records older than 7 days on init
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    _db.prepare('DELETE FROM seen_urls WHERE seen_at < ?').run(cutoff)
    _db.prepare('DELETE FROM seen_titles WHERE seen_at < ?').run(cutoff)
  }
  return _db
}

function hash(value: string): string {
  return crypto.createHash('md5').update(value.toLowerCase().trim()).digest('hex')
}

export function isSeenBefore(url: string, title?: string): boolean {
  const db = getDb()
  const urlHash = hash(url)
  const urlRow = db.prepare('SELECT hash FROM seen_urls WHERE hash = ?').get(urlHash)
  if (urlRow) return true

  if (title) {
    const titleHash = hash(title)
    const titleRow = db.prepare('SELECT hash FROM seen_titles WHERE hash = ?').get(titleHash)
    if (titleRow) return true
  }

  return false
}

export function markAsSeen(url: string, title?: string): void {
  const db = getDb()
  const now = Date.now()
  db.prepare('INSERT OR REPLACE INTO seen_urls (hash, seen_at) VALUES (?, ?)').run(hash(url), now)
  if (title) {
    db.prepare('INSERT OR REPLACE INTO seen_titles (hash, seen_at) VALUES (?, ?)').run(hash(title), now)
  }
}

export function getSeenCount(): number {
  const db = getDb()
  const row = db.prepare('SELECT COUNT(*) as count FROM seen_urls').get() as { count: number }
  return row.count
}

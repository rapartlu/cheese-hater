/**
 * Tests for GET /cheese/leaderboard — top N most-hated cheeses by score.
 *
 * Lower score = more hated. The leaderboard makes the hierarchy of suffering
 * visible and browsable. All entries are damning. There are no positive results.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

const REQUIRED_TOP_LEVEL_FIELDS = [
  'description',
  'total_rated',
  'showing',
  'limit',
  'entries',
  'note',
] as const

const REQUIRED_ENTRY_FIELDS = [
  'rank',
  'cheese',
  'score',
  'severity_tier',
  'verdict',
  'one_liner',
  'roast',
] as const

describe('GET /cheese/leaderboard', () => {
  it('returns 200 with correct top-level shape', async () => {
    const res = await request(app).get('/cheese/leaderboard')
    expect(res.status).toBe(200)
    for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
      expect(res.body).toHaveProperty(field)
    }
  })

  it('returns entries array with correct entry shape', async () => {
    const res = await request(app).get('/cheese/leaderboard')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.entries)).toBe(true)
    expect(res.body.entries.length).toBeGreaterThan(0)
    for (const entry of res.body.entries) {
      for (const field of REQUIRED_ENTRY_FIELDS) {
        expect(entry).toHaveProperty(field)
      }
    }
  })

  it('defaults to 10 entries', async () => {
    const res = await request(app).get('/cheese/leaderboard')
    expect(res.status).toBe(200)
    expect(res.body.entries.length).toBe(10)
    expect(res.body.limit).toBe(10)
    expect(res.body.showing).toBe(10)
  })

  it('respects ?limit=N', async () => {
    const res = await request(app).get('/cheese/leaderboard?limit=5')
    expect(res.status).toBe(200)
    expect(res.body.entries.length).toBe(5)
    expect(res.body.limit).toBe(5)
    expect(res.body.showing).toBe(5)
  })

  it('respects ?limit=1 — the single most-hated cheese', async () => {
    const res = await request(app).get('/cheese/leaderboard?limit=1')
    expect(res.status).toBe(200)
    expect(res.body.entries.length).toBe(1)
    expect(res.body.entries[0].rank).toBe(1)
  })

  it('caps limit at 20', async () => {
    const res = await request(app).get('/cheese/leaderboard?limit=999')
    expect(res.status).toBe(200)
    expect(res.body.limit).toBe(20)
    expect(res.body.entries.length).toBeLessThanOrEqual(20)
  })

  it('entries are sorted by score ascending (lower = more hated)', async () => {
    const res = await request(app).get('/cheese/leaderboard?limit=20')
    expect(res.status).toBe(200)
    const scores: number[] = res.body.entries.map((e: { score: number }) => e.score)
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1])
    }
  })

  it('ranks are sequential starting from 1', async () => {
    const res = await request(app).get('/cheese/leaderboard?limit=5')
    expect(res.status).toBe(200)
    const ranks: number[] = res.body.entries.map((e: { rank: number }) => e.rank)
    expect(ranks).toEqual([1, 2, 3, 4, 5])
  })

  it('each entry has a non-empty roast string', async () => {
    const res = await request(app).get('/cheese/leaderboard?limit=5')
    expect(res.status).toBe(200)
    for (const entry of res.body.entries) {
      expect(typeof entry.roast).toBe('string')
      expect(entry.roast.length).toBeGreaterThan(10)
    }
  })

  it('each entry has a non-empty one_liner', async () => {
    const res = await request(app).get('/cheese/leaderboard?limit=5')
    expect(res.status).toBe(200)
    for (const entry of res.body.entries) {
      expect(typeof entry.one_liner).toBe('string')
      expect(entry.one_liner.length).toBeGreaterThan(5)
    }
  })

  it('severity_tier is a non-empty lowercase string', async () => {
    const res = await request(app).get('/cheese/leaderboard?limit=5')
    expect(res.status).toBe(200)
    for (const entry of res.body.entries) {
      expect(typeof entry.severity_tier).toBe('string')
      expect(entry.severity_tier).toBe(entry.severity_tier.toLowerCase())
      expect(entry.severity_tier.length).toBeGreaterThan(0)
    }
  })

  it('total_rated reflects the full dataset size', async () => {
    const res = await request(app).get('/cheese/leaderboard')
    expect(res.status).toBe(200)
    expect(typeof res.body.total_rated).toBe('number')
    expect(res.body.total_rated).toBeGreaterThan(0)
  })

  it('note field is present and damning', async () => {
    const res = await request(app).get('/cheese/leaderboard')
    expect(res.status).toBe(200)
    expect(typeof res.body.note).toBe('string')
    expect(res.body.note.length).toBeGreaterThan(10)
  })

  it('returns 400 for ?limit=0', async () => {
    const res = await request(app).get('/cheese/leaderboard?limit=0')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    expect(res.body).toHaveProperty('hint')
  })

  it('returns 400 for ?limit=-1', async () => {
    const res = await request(app).get('/cheese/leaderboard?limit=-1')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 for ?limit=abc', async () => {
    const res = await request(app).get('/cheese/leaderboard?limit=abc')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('does not conflict with GET /cheese/:name — leaderboard route takes priority', async () => {
    // If routing were wrong, "leaderboard" would be treated as a cheese name
    const leaderboard = await request(app).get('/cheese/leaderboard')
    expect(leaderboard.status).toBe(200)
    expect(leaderboard.body).toHaveProperty('entries')
    expect(leaderboard.body).not.toHaveProperty('worst_quality') // profile shape absent
  })

  it('GET /cheese/brie still works after leaderboard route added', async () => {
    const res = await request(app).get('/cheese/brie')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('cheese')
    expect(res.body).toHaveProperty('worst_quality')
    expect(res.body).toHaveProperty('pairings')
  })
})

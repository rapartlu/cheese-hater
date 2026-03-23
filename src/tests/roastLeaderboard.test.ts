import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server.js'
import { cheeses, HISTORY_MAX_DAYS } from '../routes/roast.js'

describe('GET /roast/leaderboard', () => {
  it('returns 200 with required envelope fields', async () => {
    const res = await request(app).get('/roast/leaderboard')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('limit')
    expect(res.body).toHaveProperty('history_window_days', HISTORY_MAX_DAYS)
    expect(res.body).toHaveProperty('total_ranked')
    expect(res.body).toHaveProperty('leaderboard')
    expect(res.body).toHaveProperty('note')
    expect(Array.isArray(res.body.leaderboard)).toBe(true)
  })

  it('defaults to 10 entries when ?limit is omitted', async () => {
    const res = await request(app).get('/roast/leaderboard')
    expect(res.body.limit).toBe(10)
    expect(res.body.leaderboard.length).toBeLessThanOrEqual(10)
  })

  it('respects ?limit parameter', async () => {
    const res = await request(app).get('/roast/leaderboard?limit=3')
    expect(res.body.limit).toBe(3)
    expect(res.body.leaderboard).toHaveLength(3)
  })

  it('limit=1 returns exactly 1 entry', async () => {
    const res = await request(app).get('/roast/leaderboard?limit=1')
    expect(res.body.leaderboard).toHaveLength(1)
    expect(res.body.leaderboard[0].rank).toBe(1)
  })

  it('each entry has required fields', async () => {
    const res = await request(app).get('/roast/leaderboard')
    for (const entry of res.body.leaderboard) {
      expect(entry).toHaveProperty('rank')
      expect(entry).toHaveProperty('cheese')
      expect(entry).toHaveProperty('appearances')
      expect(entry).toHaveProperty('score_display')
      expect(entry).toHaveProperty('verdict')
      expect(entry).toHaveProperty('best_quote')
    }
  })

  it('rank is sequential starting from 1', async () => {
    const res = await request(app).get('/roast/leaderboard')
    res.body.leaderboard.forEach((entry: any, idx: number) => {
      expect(entry.rank).toBe(idx + 1)
    })
  })

  it('entries are sorted descending by appearances', async () => {
    const res = await request(app).get('/roast/leaderboard?limit=20')
    const appearances: number[] = res.body.leaderboard.map((e: any) => e.appearances)
    for (let i = 1; i < appearances.length; i++) {
      expect(appearances[i]).toBeLessThanOrEqual(appearances[i - 1])
    }
  })

  it('all cheese names are in the rated cheese database', async () => {
    const res = await request(app).get('/roast/leaderboard?limit=20')
    const knownNames = cheeses.map((c: any) => c.name)
    for (const entry of res.body.leaderboard) {
      expect(knownNames).toContain(entry.cheese)
    }
  })

  it('appearances are positive integers', async () => {
    const res = await request(app).get('/roast/leaderboard')
    for (const entry of res.body.leaderboard) {
      expect(Number.isInteger(entry.appearances)).toBe(true)
      expect(entry.appearances).toBeGreaterThan(0)
    }
  })

  it('total appearances sum to HISTORY_MAX_DAYS', async () => {
    // Request all possible entries (21 cheeses max)
    const res = await request(app).get('/roast/leaderboard?limit=21')
    const total = res.body.leaderboard.reduce((sum: number, e: any) => sum + e.appearances, 0)
    expect(total).toBe(HISTORY_MAX_DAYS)
  })

  it('best_quote is a non-empty string', async () => {
    const res = await request(app).get('/roast/leaderboard')
    for (const entry of res.body.leaderboard) {
      expect(typeof entry.best_quote).toBe('string')
      expect(entry.best_quote.length).toBeGreaterThan(10)
    }
  })

  it('total_ranked matches leaderboard array length', async () => {
    const res = await request(app).get('/roast/leaderboard?limit=5')
    expect(res.body.total_ranked).toBe(res.body.leaderboard.length)
  })

  it('is deterministic — same request always returns same result', async () => {
    const res1 = await request(app).get('/roast/leaderboard?limit=5')
    const res2 = await request(app).get('/roast/leaderboard?limit=5')
    expect(res1.body.leaderboard).toEqual(res2.body.leaderboard)
  })

  it('works from day 1 — returns results without any prior setup', async () => {
    const res = await request(app).get('/roast/leaderboard')
    expect(res.status).toBe(200)
    expect(res.body.leaderboard.length).toBeGreaterThan(0)
  })

  it('large limit returns at most the number of distinct cheeses in history', async () => {
    const res = await request(app).get('/roast/leaderboard?limit=999')
    // At most 21 cheeses total; at most HISTORY_MAX_DAYS distinct entries
    expect(res.body.leaderboard.length).toBeLessThanOrEqual(cheeses.length)
  })

  it('no cheese appears twice in the leaderboard', async () => {
    const res = await request(app).get('/roast/leaderboard?limit=21')
    const names = res.body.leaderboard.map((e: any) => e.cheese)
    expect(new Set(names).size).toBe(names.length)
  })

  // Validation
  it('returns 400 for ?limit=0', async () => {
    const res = await request(app).get('/roast/leaderboard?limit=0')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 for non-numeric ?limit', async () => {
    const res = await request(app).get('/roast/leaderboard?limit=lots')
    expect(res.status).toBe(400)
  })

  it('returns 400 for negative ?limit', async () => {
    const res = await request(app).get('/roast/leaderboard?limit=-5')
    expect(res.status).toBe(400)
  })

  it('note field mentions condemnation', async () => {
    const res = await request(app).get('/roast/leaderboard')
    expect(res.body.note).toMatch(/condemn/i)
  })
})

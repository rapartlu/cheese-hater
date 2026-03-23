/**
 * Tests for GET /worst.
 *
 * The least terrible cheese on this list is still cheese.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

const REQUIRED_ENTRY_FIELDS = [
  'rank',
  'cheese',
  'score',
  'severity_tier',
  'verdict',
  'why_it_wins',
] as const

const VALID_TIERS = ['catastrophic', 'revolting', 'condemned'] as const

// ── Basic shape ───────────────────────────────────────────────────────────────

describe('GET /worst — response shape', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/worst')
    expect(res.status).toBe(200)
  })

  it('returns a ranked array', async () => {
    const res = await request(app).get('/worst')
    expect(Array.isArray(res.body.ranked)).toBe(true)
  })

  it('total matches ranked array length', async () => {
    const res = await request(app).get('/worst')
    expect(res.body.total).toBe(res.body.ranked.length)
  })

  it('total_in_database is present and positive', async () => {
    const res = await request(app).get('/worst')
    expect(typeof res.body.total_in_database).toBe('number')
    expect(res.body.total_in_database).toBeGreaterThan(0)
  })

  it('note mentions "least terrible cheese on this list is still cheese"', async () => {
    const res = await request(app).get('/worst')
    expect(res.body.note).toMatch(/least terrible.*still cheese/i)
  })

  it('each entry has all required fields', async () => {
    const res = await request(app).get('/worst')
    for (const entry of res.body.ranked) {
      for (const field of REQUIRED_ENTRY_FIELDS) {
        expect(entry, `Missing field "${field}" in entry: ${entry.cheese}`).toHaveProperty(field)
      }
    }
  })

  it('each entry has a non-empty why_it_wins string', async () => {
    const res = await request(app).get('/worst')
    for (const entry of res.body.ranked) {
      expect(typeof entry.why_it_wins).toBe('string')
      expect(entry.why_it_wins.length, `Empty why_it_wins for ${entry.cheese}`).toBeGreaterThan(20)
    }
  })

  it('each entry severity_tier is a valid tier', async () => {
    const res = await request(app).get('/worst')
    for (const entry of res.body.ranked) {
      expect(
        VALID_TIERS as readonly string[],
        `Invalid tier "${entry.severity_tier}" for ${entry.cheese}`,
      ).toContain(entry.severity_tier)
    }
  })
})

// ── Ranking correctness ───────────────────────────────────────────────────────

describe('GET /worst — ranking order', () => {
  it('cheeses are sorted ascending by score (most terrible first)', async () => {
    const res = await request(app).get('/worst')
    const scores: number[] = res.body.ranked.map((e: { score: number }) => e.score)
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1])
    }
  })

  it('rank 1 entry is casu martzu (score 0.125 — the worst of the worst)', async () => {
    const res = await request(app).get('/worst')
    const first = res.body.ranked[0]
    expect(first.rank).toBe(1)
    expect(first.cheese.toLowerCase()).toBe('casu martzu')
    expect(first.score).toBe(0.125)
    expect(first.severity_tier).toBe('catastrophic')
  })

  it('rank 1 entry has a why_it_wins mentioning maggots', async () => {
    const res = await request(app).get('/worst')
    expect(res.body.ranked[0].why_it_wins.toLowerCase()).toMatch(/maggot/)
  })

  it('gouda appears last (score 2.475 — the least terrible)', async () => {
    const res = await request(app).get('/worst')
    const last = res.body.ranked[res.body.ranked.length - 1]
    expect(last.cheese.toLowerCase()).toBe('gouda')
    expect(last.score).toBe(2.475)
    expect(last.severity_tier).toBe('condemned')
  })

  it('ranks are sequential starting from 1', async () => {
    const res = await request(app).get('/worst')
    res.body.ranked.forEach((entry: { rank: number }, idx: number) => {
      expect(entry.rank).toBe(idx + 1)
    })
  })
})

// ── ?limit param ──────────────────────────────────────────────────────────────

describe('GET /worst?limit=N', () => {
  it('?limit=1 returns exactly one entry', async () => {
    const res = await request(app).get('/worst?limit=1')
    expect(res.status).toBe(200)
    expect(res.body.ranked).toHaveLength(1)
    expect(res.body.total).toBe(1)
  })

  it('?limit=1 returns casu martzu', async () => {
    const res = await request(app).get('/worst?limit=1')
    expect(res.body.ranked[0].cheese.toLowerCase()).toBe('casu martzu')
  })

  it('?limit=3 returns exactly three entries', async () => {
    const res = await request(app).get('/worst?limit=3')
    expect(res.body.ranked).toHaveLength(3)
    expect(res.body.total).toBe(3)
  })

  it('?limit=3 entry ranks are 1, 2, 3', async () => {
    const res = await request(app).get('/worst?limit=3')
    expect(res.body.ranked.map((e: { rank: number }) => e.rank)).toEqual([1, 2, 3])
  })

  it('response includes the limit field when ?limit is given', async () => {
    const res = await request(app).get('/worst?limit=5')
    expect(res.body.limit).toBe(5)
  })

  it('?limit=0 returns 400', async () => {
    const res = await request(app).get('/worst?limit=0')
    expect(res.status).toBe(400)
  })

  it('?limit=abc returns 400', async () => {
    const res = await request(app).get('/worst?limit=abc')
    expect(res.status).toBe(400)
  })
})

// ── ?tier param ───────────────────────────────────────────────────────────────

describe('GET /worst?tier=X', () => {
  it('?tier=catastrophic returns only catastrophic entries', async () => {
    const res = await request(app).get('/worst?tier=catastrophic')
    expect(res.status).toBe(200)
    for (const entry of res.body.ranked) {
      expect(entry.severity_tier).toBe('catastrophic')
    }
  })

  it('?tier=catastrophic returns 4 entries (scores < 1.0)', async () => {
    const res = await request(app).get('/worst?tier=catastrophic')
    expect(res.body.total).toBe(4)
  })

  it('?tier=catastrophic rank 1 is still casu martzu', async () => {
    const res = await request(app).get('/worst?tier=catastrophic')
    expect(res.body.ranked[0].cheese.toLowerCase()).toBe('casu martzu')
  })

  it('?tier=revolting returns only revolting entries', async () => {
    const res = await request(app).get('/worst?tier=revolting')
    expect(res.status).toBe(200)
    for (const entry of res.body.ranked) {
      expect(entry.severity_tier).toBe('revolting')
    }
  })

  it('?tier=condemned returns only condemned entries', async () => {
    const res = await request(app).get('/worst?tier=condemned')
    expect(res.status).toBe(200)
    for (const entry of res.body.ranked) {
      expect(entry.severity_tier).toBe('condemned')
    }
  })

  it('?tier=condemned last entry is gouda', async () => {
    const res = await request(app).get('/worst?tier=condemned')
    const entries = res.body.ranked
    expect(entries[entries.length - 1].cheese.toLowerCase()).toBe('gouda')
  })

  it('response includes filtered_by_tier when ?tier is given', async () => {
    const res = await request(app).get('/worst?tier=catastrophic')
    expect(res.body.filtered_by_tier).toBe('catastrophic')
  })

  it('?tier=invalid returns 400 with valid_tiers hint', async () => {
    const res = await request(app).get('/worst?tier=amazing')
    expect(res.status).toBe(400)
    expect(Array.isArray(res.body.valid_tiers)).toBe(true)
  })

  it('filtered ranks are re-numbered from 1', async () => {
    const res = await request(app).get('/worst?tier=revolting')
    res.body.ranked.forEach((entry: { rank: number }, idx: number) => {
      expect(entry.rank).toBe(idx + 1)
    })
  })
})

// ── ?tier + ?limit combined ───────────────────────────────────────────────────

describe('GET /worst — combined params', () => {
  it('?tier=catastrophic&limit=2 returns 2 catastrophic entries', async () => {
    const res = await request(app).get('/worst?tier=catastrophic&limit=2')
    expect(res.status).toBe(200)
    expect(res.body.ranked).toHaveLength(2)
    for (const entry of res.body.ranked) {
      expect(entry.severity_tier).toBe('catastrophic')
    }
  })

  it('?tier=catastrophic&limit=2 rank 1 is still casu martzu', async () => {
    const res = await request(app).get('/worst?tier=catastrophic&limit=2')
    expect(res.body.ranked[0].cheese.toLowerCase()).toBe('casu martzu')
  })

  it('?limit larger than total returns all entries without error', async () => {
    const res = await request(app).get('/worst?limit=9999')
    expect(res.status).toBe(200)
    expect(res.body.ranked.length).toBe(res.body.total_in_database)
  })
})

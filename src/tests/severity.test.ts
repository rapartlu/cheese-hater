/**
 * Tests for GET /severity/:tier and GET /severity.
 *
 * The Cheese Threat Advisory Scale: catastrophic, revolting, condemned.
 * All tiers are bad. The scale exists only to communicate the degree of
 * badness. Every cheese on every tier is still cheese.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

const VALID_TIERS = ['catastrophic', 'revolting', 'condemned'] as const
const CHEESE_ENTRY_FIELDS = ['rank', 'cheese', 'score', 'severity_tier', 'verdict', 'why_it_wins'] as const

// ── GET /severity — list all tiers ────────────────────────────────────────────

describe('GET /severity — tier listing', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/severity')
    expect(res.status).toBe(200)
  })

  it('has a title field', async () => {
    const res = await request(app).get('/severity')
    expect(typeof res.body.title).toBe('string')
    expect(res.body.title.length).toBeGreaterThan(0)
  })

  it('tiers is an array of exactly 3 entries', async () => {
    const res = await request(app).get('/severity')
    expect(Array.isArray(res.body.tiers)).toBe(true)
    expect(res.body.tiers.length).toBe(3)
  })

  it('each tier entry has: tier, label, score_range, threat_level, description, count, worst_in_tier', async () => {
    const res = await request(app).get('/severity')
    for (const entry of res.body.tiers) {
      expect(entry).toHaveProperty('tier')
      expect(entry).toHaveProperty('label')
      expect(entry).toHaveProperty('score_range')
      expect(entry).toHaveProperty('threat_level')
      expect(entry).toHaveProperty('description')
      expect(entry).toHaveProperty('count')
      expect(entry).toHaveProperty('worst_in_tier')
    }
  })

  it('all three valid tiers are present', async () => {
    const res = await request(app).get('/severity')
    const tierNames: string[] = res.body.tiers.map((t: { tier: string }) => t.tier)
    for (const tier of VALID_TIERS) {
      expect(tierNames).toContain(tier)
    }
  })

  it('total_cheeses_assessed is a positive integer', async () => {
    const res = await request(app).get('/severity')
    expect(Number.isInteger(res.body.total_cheeses_assessed)).toBe(true)
    expect(res.body.total_cheeses_assessed).toBeGreaterThan(0)
  })

  it('sum of tier counts equals total_cheeses_assessed', async () => {
    const res = await request(app).get('/severity')
    const sum = res.body.tiers.reduce((acc: number, t: { count: number }) => acc + t.count, 0)
    expect(sum).toBe(res.body.total_cheeses_assessed)
  })

  it('catastrophic tier has at least 1 cheese', async () => {
    const res = await request(app).get('/severity')
    const catastrophic = res.body.tiers.find((t: { tier: string }) => t.tier === 'catastrophic')
    expect(catastrophic.count).toBeGreaterThan(0)
  })

  it('worst_in_tier is a non-null string for all tiers', async () => {
    const res = await request(app).get('/severity')
    for (const entry of res.body.tiers) {
      expect(typeof entry.worst_in_tier).toBe('string')
      expect(entry.worst_in_tier.length).toBeGreaterThan(0)
    }
  })
})

// ── GET /severity/:tier — valid tiers ─────────────────────────────────────────

describe('GET /severity/:tier — valid tiers return 200', () => {
  for (const tier of VALID_TIERS) {
    it(`returns 200 for tier "${tier}"`, async () => {
      const res = await request(app).get(`/severity/${tier}`)
      expect(res.status).toBe(200)
    })
  }
})

describe('GET /severity/:tier — response shape', () => {
  it('has tier, label, score_range, threat_level, description, cheeses, total, note', async () => {
    const res = await request(app).get('/severity/catastrophic')
    expect(res.body).toHaveProperty('tier')
    expect(res.body).toHaveProperty('label')
    expect(res.body).toHaveProperty('score_range')
    expect(res.body).toHaveProperty('threat_level')
    expect(res.body).toHaveProperty('description')
    expect(res.body).toHaveProperty('cheeses')
    expect(res.body).toHaveProperty('total')
    expect(res.body).toHaveProperty('note')
  })

  it('cheeses is an array', async () => {
    const res = await request(app).get('/severity/catastrophic')
    expect(Array.isArray(res.body.cheeses)).toBe(true)
  })

  it('total matches cheeses array length', async () => {
    const res = await request(app).get('/severity/revolting')
    expect(res.body.total).toBe(res.body.cheeses.length)
  })

  it('each cheese entry has all required fields', async () => {
    const res = await request(app).get('/severity/condemned')
    for (const entry of res.body.cheeses) {
      for (const field of CHEESE_ENTRY_FIELDS) {
        expect(entry, `Missing field "${field}" in cheese entry`).toHaveProperty(field)
      }
    }
  })

  it('tier field in response matches the requested tier', async () => {
    for (const tier of VALID_TIERS) {
      const res = await request(app).get(`/severity/${tier}`)
      expect(res.body.tier).toBe(tier)
    }
  })
})

// ── GET /severity/:tier — tier membership correctness ─────────────────────────

describe('GET /severity/:tier — tier membership', () => {
  it('all catastrophic cheeses have severity_tier: "catastrophic"', async () => {
    const res = await request(app).get('/severity/catastrophic')
    for (const entry of res.body.cheeses) {
      expect(entry.severity_tier).toBe('catastrophic')
    }
  })

  it('all revolting cheeses have severity_tier: "revolting"', async () => {
    const res = await request(app).get('/severity/revolting')
    for (const entry of res.body.cheeses) {
      expect(entry.severity_tier).toBe('revolting')
    }
  })

  it('all condemned cheeses have severity_tier: "condemned"', async () => {
    const res = await request(app).get('/severity/condemned')
    for (const entry of res.body.cheeses) {
      expect(entry.severity_tier).toBe('condemned')
    }
  })

  it('catastrophic scores are all < 1.0', async () => {
    const res = await request(app).get('/severity/catastrophic')
    for (const entry of res.body.cheeses) {
      expect(entry.score).toBeLessThan(1.0)
    }
  })

  it('revolting scores are all between 1.0 and 1.99', async () => {
    const res = await request(app).get('/severity/revolting')
    for (const entry of res.body.cheeses) {
      expect(entry.score).toBeGreaterThanOrEqual(1.0)
      expect(entry.score).toBeLessThan(2.0)
    }
  })

  it('condemned scores are all >= 2.0', async () => {
    const res = await request(app).get('/severity/condemned')
    for (const entry of res.body.cheeses) {
      expect(entry.score).toBeGreaterThanOrEqual(2.0)
    }
  })

  it('cheeses are ranked ascending by score within each tier (worst first)', async () => {
    for (const tier of VALID_TIERS) {
      const res = await request(app).get(`/severity/${tier}`)
      const scores: number[] = res.body.cheeses.map((e: { score: number }) => e.score)
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1])
      }
    }
  })

  it('ranks are sequential starting from 1', async () => {
    const res = await request(app).get('/severity/revolting')
    const ranks: number[] = res.body.cheeses.map((e: { rank: number }) => e.rank)
    ranks.forEach((rank, idx) => expect(rank).toBe(idx + 1))
  })
})

// ── GET /severity/:tier — cross-tier consistency ──────────────────────────────

describe('GET /severity — cross-tier consistency', () => {
  it('no cheese appears in more than one tier', async () => {
    const seenNames = new Set<string>()
    for (const tier of VALID_TIERS) {
      const res = await request(app).get(`/severity/${tier}`)
      for (const entry of res.body.cheeses) {
        expect(seenNames.has(entry.cheese), `"${entry.cheese}" appears in multiple tiers`).toBe(false)
        seenNames.add(entry.cheese)
      }
    }
  })

  it('total across all tiers matches GET /severity total_cheeses_assessed', async () => {
    const listRes = await request(app).get('/severity')
    let total = 0
    for (const tier of VALID_TIERS) {
      const res = await request(app).get(`/severity/${tier}`)
      total += res.body.total
    }
    expect(total).toBe(listRes.body.total_cheeses_assessed)
  })
})

// ── GET /severity/:tier — case insensitivity ──────────────────────────────────

describe('GET /severity/:tier — case insensitivity', () => {
  it('CATASTROPHIC (uppercase) returns the catastrophic tier', async () => {
    const res = await request(app).get('/severity/CATASTROPHIC')
    expect(res.status).toBe(200)
    expect(res.body.tier).toBe('catastrophic')
  })

  it('REVOLTING (uppercase) returns the revolting tier', async () => {
    const res = await request(app).get('/severity/REVOLTING')
    expect(res.status).toBe(200)
    expect(res.body.tier).toBe('revolting')
  })
})

// ── GET /severity/:tier — invalid tier → 400 ─────────────────────────────────

describe('GET /severity/:tier — invalid tiers return 400', () => {
  it('unknown tier returns 400', async () => {
    const res = await request(app).get('/severity/mild')
    expect(res.status).toBe(400)
  })

  it('400 response has an error field', async () => {
    const res = await request(app).get('/severity/disgusting')
    expect(res.body).toHaveProperty('error')
  })

  it('400 response includes valid_tiers field', async () => {
    const res = await request(app).get('/severity/offensive')
    expect(res.body).toHaveProperty('valid_tiers')
  })

  it('valid_tiers lists all three tiers', async () => {
    const res = await request(app).get('/severity/terrible')
    const listed = Object.keys(res.body.valid_tiers)
    for (const tier of VALID_TIERS) {
      expect(listed).toContain(tier)
    }
  })

  it('completely invalid string returns 400', async () => {
    const res = await request(app).get('/severity/notarealthing')
    expect(res.status).toBe(400)
  })
})

// ── GET /api schema coverage ──────────────────────────────────────────────────

describe('GET /api — schema includes severity endpoints', () => {
  it('GET /api lists /severity', async () => {
    const res = await request(app).get('/api')
    const paths: string[] = res.body.endpoints.map((e: { path: string }) => e.path)
    expect(paths).toContain('/severity')
  })

  it('GET /api lists /severity/:tier', async () => {
    const res = await request(app).get('/api')
    const paths: string[] = res.body.endpoints.map((e: { path: string }) => e.path)
    expect(paths).toContain('/severity/:tier')
  })
})

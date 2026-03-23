/**
 * Tests for GET /severity/:tier/worst and GET /severity/:tier/least-bad.
 *
 * The worst cheese in a tier is the lowest-scoring (most condemned).
 * The least-bad cheese in a tier is the highest-scoring (least condemned).
 * Neither is a compliment. Both are still cheese.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

const VALID_TIERS = ['catastrophic', 'revolting', 'condemned'] as const

const REQUIRED_FIELDS = [
  'tier',
  'position',
  'cheese',
  'score',
  'severity_tier',
  'verdict',
  'why_it_wins',
  'rank_in_tier',
  'total_in_tier',
  'score_range',
  'threat_level',
  'note',
] as const

// ── GET /severity/:tier/worst — valid tiers ───────────────────────────────────

describe('GET /severity/:tier/worst — valid tiers return 200', () => {
  for (const tier of VALID_TIERS) {
    it(`returns 200 for /severity/${tier}/worst`, async () => {
      const res = await request(app).get(`/severity/${tier}/worst`)
      expect(res.status).toBe(200)
    })
  }
})

describe('GET /severity/:tier/worst — response shape', () => {
  it('has all required fields', async () => {
    const res = await request(app).get('/severity/catastrophic/worst')
    for (const field of REQUIRED_FIELDS) {
      expect(res.body, `Missing field "${field}"`).toHaveProperty(field)
    }
  })

  it('position is "worst"', async () => {
    const res = await request(app).get('/severity/catastrophic/worst')
    expect(res.body.position).toBe('worst')
  })

  it('tier echoes the requested tier', async () => {
    for (const tier of VALID_TIERS) {
      const res = await request(app).get(`/severity/${tier}/worst`)
      expect(res.body.tier).toBe(tier)
    }
  })

  it('rank_in_tier is 1 (the worst is always rank 1)', async () => {
    for (const tier of VALID_TIERS) {
      const res = await request(app).get(`/severity/${tier}/worst`)
      expect(res.body.rank_in_tier).toBe(1)
    }
  })

  it('total_in_tier is a positive integer', async () => {
    for (const tier of VALID_TIERS) {
      const res = await request(app).get(`/severity/${tier}/worst`)
      expect(Number.isInteger(res.body.total_in_tier)).toBe(true)
      expect(res.body.total_in_tier).toBeGreaterThan(0)
    }
  })

  it('note is a non-empty string', async () => {
    const res = await request(app).get('/severity/catastrophic/worst')
    expect(typeof res.body.note).toBe('string')
    expect(res.body.note.length).toBeGreaterThan(0)
  })
})

// ── GET /severity/:tier/worst — score correctness ─────────────────────────────

describe('GET /severity/:tier/worst — score is lowest in tier', () => {
  it('catastrophic/worst has a lower score than all other catastrophic cheeses', async () => {
    const [worstRes, tierRes] = await Promise.all([
      request(app).get('/severity/catastrophic/worst'),
      request(app).get('/severity/catastrophic'),
    ])
    const worstScore: number = worstRes.body.score
    const allScores: number[] = tierRes.body.cheeses.map((c: { score: number }) => c.score)
    expect(Math.min(...allScores)).toBe(worstScore)
  })

  it('revolting/worst has a lower score than all other revolting cheeses', async () => {
    const [worstRes, tierRes] = await Promise.all([
      request(app).get('/severity/revolting/worst'),
      request(app).get('/severity/revolting'),
    ])
    const worstScore: number = worstRes.body.score
    const allScores: number[] = tierRes.body.cheeses.map((c: { score: number }) => c.score)
    expect(Math.min(...allScores)).toBe(worstScore)
  })

  it('condemned/worst has a lower score than all other condemned cheeses', async () => {
    const [worstRes, tierRes] = await Promise.all([
      request(app).get('/severity/condemned/worst'),
      request(app).get('/severity/condemned'),
    ])
    const worstScore: number = worstRes.body.score
    const allScores: number[] = tierRes.body.cheeses.map((c: { score: number }) => c.score)
    expect(Math.min(...allScores)).toBe(worstScore)
  })

  it('severity_tier on the result matches the requested tier', async () => {
    for (const tier of VALID_TIERS) {
      const res = await request(app).get(`/severity/${tier}/worst`)
      expect(res.body.severity_tier).toBe(tier)
    }
  })
})

// ── GET /severity/:tier/least-bad — valid tiers ───────────────────────────────

describe('GET /severity/:tier/least-bad — valid tiers return 200', () => {
  for (const tier of VALID_TIERS) {
    it(`returns 200 for /severity/${tier}/least-bad`, async () => {
      const res = await request(app).get(`/severity/${tier}/least-bad`)
      expect(res.status).toBe(200)
    })
  }
})

describe('GET /severity/:tier/least-bad — response shape', () => {
  it('has all required fields', async () => {
    const res = await request(app).get('/severity/condemned/least-bad')
    for (const field of REQUIRED_FIELDS) {
      expect(res.body, `Missing field "${field}"`).toHaveProperty(field)
    }
  })

  it('position is "least-bad"', async () => {
    const res = await request(app).get('/severity/condemned/least-bad')
    expect(res.body.position).toBe('least-bad')
  })

  it('tier echoes the requested tier', async () => {
    for (const tier of VALID_TIERS) {
      const res = await request(app).get(`/severity/${tier}/least-bad`)
      expect(res.body.tier).toBe(tier)
    }
  })

  it('rank_in_tier equals total_in_tier (least-bad is always last rank)', async () => {
    for (const tier of VALID_TIERS) {
      const res = await request(app).get(`/severity/${tier}/least-bad`)
      expect(res.body.rank_in_tier).toBe(res.body.total_in_tier)
    }
  })

  it('total_in_tier is a positive integer', async () => {
    for (const tier of VALID_TIERS) {
      const res = await request(app).get(`/severity/${tier}/least-bad`)
      expect(Number.isInteger(res.body.total_in_tier)).toBe(true)
      expect(res.body.total_in_tier).toBeGreaterThan(0)
    }
  })

  it('note mentions "least bad" or "not a compliment"', async () => {
    const res = await request(app).get('/severity/condemned/least-bad')
    expect(res.body.note.toLowerCase()).toMatch(/least.bad|not a compliment/)
  })
})

// ── GET /severity/:tier/least-bad — score correctness ────────────────────────

describe('GET /severity/:tier/least-bad — score is highest in tier', () => {
  it('catastrophic/least-bad has the highest score in the catastrophic tier', async () => {
    const [lbRes, tierRes] = await Promise.all([
      request(app).get('/severity/catastrophic/least-bad'),
      request(app).get('/severity/catastrophic'),
    ])
    const lbScore: number = lbRes.body.score
    const allScores: number[] = tierRes.body.cheeses.map((c: { score: number }) => c.score)
    expect(Math.max(...allScores)).toBe(lbScore)
  })

  it('revolting/least-bad has the highest score in the revolting tier', async () => {
    const [lbRes, tierRes] = await Promise.all([
      request(app).get('/severity/revolting/least-bad'),
      request(app).get('/severity/revolting'),
    ])
    const lbScore: number = lbRes.body.score
    const allScores: number[] = tierRes.body.cheeses.map((c: { score: number }) => c.score)
    expect(Math.max(...allScores)).toBe(lbScore)
  })

  it('condemned/least-bad has the highest score in the condemned tier', async () => {
    const [lbRes, tierRes] = await Promise.all([
      request(app).get('/severity/condemned/least-bad'),
      request(app).get('/severity/condemned'),
    ])
    const lbScore: number = lbRes.body.score
    const allScores: number[] = tierRes.body.cheeses.map((c: { score: number }) => c.score)
    expect(Math.max(...allScores)).toBe(lbScore)
  })

  it('severity_tier on the result matches the requested tier', async () => {
    for (const tier of VALID_TIERS) {
      const res = await request(app).get(`/severity/${tier}/least-bad`)
      expect(res.body.severity_tier).toBe(tier)
    }
  })
})

// ── worst vs least-bad cross-checks ─────────────────────────────────────────

describe('GET /severity/:tier — worst vs least-bad cross-checks', () => {
  it('worst score <= least-bad score for every tier', async () => {
    for (const tier of VALID_TIERS) {
      const [worstRes, lbRes] = await Promise.all([
        request(app).get(`/severity/${tier}/worst`),
        request(app).get(`/severity/${tier}/least-bad`),
      ])
      expect(worstRes.body.score).toBeLessThanOrEqual(lbRes.body.score)
    }
  })

  it('total_in_tier is consistent between worst and least-bad', async () => {
    for (const tier of VALID_TIERS) {
      const [worstRes, lbRes] = await Promise.all([
        request(app).get(`/severity/${tier}/worst`),
        request(app).get(`/severity/${tier}/least-bad`),
      ])
      expect(worstRes.body.total_in_tier).toBe(lbRes.body.total_in_tier)
    }
  })

  it('when tier has 1 cheese, worst and least-bad are the same cheese', async () => {
    // This is a structural invariant — if any tier had exactly one cheese,
    // worst and least-bad must be identical. We verify the logic holds
    // by checking that both endpoint scores are internally consistent.
    for (const tier of VALID_TIERS) {
      const [worstRes, lbRes] = await Promise.all([
        request(app).get(`/severity/${tier}/worst`),
        request(app).get(`/severity/${tier}/least-bad`),
      ])
      if (worstRes.body.total_in_tier === 1) {
        expect(worstRes.body.cheese).toBe(lbRes.body.cheese)
      }
    }
  })
})

// ── Case insensitivity ────────────────────────────────────────────────────────

describe('GET /severity/:tier/worst and /least-bad — case insensitivity', () => {
  it('CATASTROPHIC/worst returns the catastrophic tier worst', async () => {
    const res = await request(app).get('/severity/CATASTROPHIC/worst')
    expect(res.status).toBe(200)
    expect(res.body.tier).toBe('catastrophic')
    expect(res.body.position).toBe('worst')
  })

  it('CONDEMNED/least-bad returns the condemned tier least-bad', async () => {
    const res = await request(app).get('/severity/CONDEMNED/least-bad')
    expect(res.status).toBe(200)
    expect(res.body.tier).toBe('condemned')
    expect(res.body.position).toBe('least-bad')
  })
})

// ── Invalid tier → 400 ───────────────────────────────────────────────────────

describe('GET /severity/:tier/worst and /least-bad — invalid tier', () => {
  it('invalid tier on /worst returns 400', async () => {
    const res = await request(app).get('/severity/mild/worst')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    expect(res.body).toHaveProperty('valid_tiers')
  })

  it('invalid tier on /least-bad returns 400', async () => {
    const res = await request(app).get('/severity/terrible/least-bad')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    expect(res.body).toHaveProperty('valid_tiers')
  })

  it('valid_tiers lists all three tiers on /worst 400', async () => {
    const res = await request(app).get('/severity/bogus/worst')
    const listed = Object.keys(res.body.valid_tiers)
    expect(listed).toContain('catastrophic')
    expect(listed).toContain('revolting')
    expect(listed).toContain('condemned')
  })
})

// ── GET /severity/:tier now includes extremes field ──────────────────────────

describe('GET /severity/:tier — includes extremes navigation links', () => {
  for (const tier of VALID_TIERS) {
    it(`includes extremes.worst and extremes.least_bad for tier "${tier}"`, async () => {
      const res = await request(app).get(`/severity/${tier}`)
      expect(res.body).toHaveProperty('extremes')
      expect(res.body.extremes).toHaveProperty('worst')
      expect(res.body.extremes).toHaveProperty('least_bad')
    })
  }
})

// ── GET /api schema coverage ─────────────────────────────────────────────────

describe('GET /api — schema includes severity extreme endpoints', () => {
  it('lists /severity/:tier/worst', async () => {
    const res = await request(app).get('/api')
    const paths: string[] = res.body.endpoints.map((e: { path: string }) => e.path)
    expect(paths).toContain('/severity/:tier/worst')
  })

  it('lists /severity/:tier/least-bad', async () => {
    const res = await request(app).get('/api')
    const paths: string[] = res.body.endpoints.map((e: { path: string }) => e.path)
    expect(paths).toContain('/severity/:tier/least-bad')
  })
})

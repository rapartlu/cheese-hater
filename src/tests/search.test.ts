/**
 * Tests for GET /search?q=<query>.
 *
 * All results are guilty. The query only determines which cheese's guilt
 * is most relevant to your search.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

const REQUIRED_RESULT_FIELDS = [
  'cheese',
  'score',
  'severity_tier',
  'verdict',
  'why_it_wins',
  'match_reason',
] as const

// ── 400 validation ────────────────────────────────────────────────────────────

describe('GET /search — input validation', () => {
  it('returns 400 when ?q is missing', async () => {
    const res = await request(app).get('/search')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    expect(res.body).toHaveProperty('usage')
  })

  it('returns 400 when ?q is an empty string', async () => {
    const res = await request(app).get('/search?q=')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when ?q is only whitespace', async () => {
    const res = await request(app).get('/search?q=%20%20')
    expect(res.status).toBe(400)
  })

  it('400 includes usage hint and examples', async () => {
    const res = await request(app).get('/search')
    expect(res.body.usage).toMatch(/search\?q=/)
    expect(Array.isArray(res.body.examples)).toBe(true)
  })
})

// ── Response shape ─────────────────────────────────────────────────────────────

describe('GET /search — response shape', () => {
  it('returns 200 for a valid query with results', async () => {
    const res = await request(app).get('/search?q=brie')
    expect(res.status).toBe(200)
  })

  it('echoes back the query string', async () => {
    const res = await request(app).get('/search?q=mold')
    expect(res.body.query).toBe('mold')
  })

  it('results is an array', async () => {
    const res = await request(app).get('/search?q=brie')
    expect(Array.isArray(res.body.results)).toBe(true)
  })

  it('total matches results array length', async () => {
    const res = await request(app).get('/search?q=mold')
    expect(res.body.total).toBe(res.body.results.length)
  })

  it('note is present and non-empty', async () => {
    const res = await request(app).get('/search?q=brie')
    expect(typeof res.body.note).toBe('string')
    expect(res.body.note.length).toBeGreaterThan(0)
  })

  it('each result has all required fields', async () => {
    const res = await request(app).get('/search?q=cheese')
    for (const result of res.body.results) {
      for (const field of REQUIRED_RESULT_FIELDS) {
        expect(result, `Missing field "${field}"`).toHaveProperty(field)
      }
    }
  })

  it('match_reason is a non-empty string', async () => {
    const res = await request(app).get('/search?q=mold')
    for (const result of res.body.results) {
      expect(typeof result.match_reason).toBe('string')
      expect(result.match_reason.length).toBeGreaterThan(0)
    }
  })

  it('no relevance field leaks into results', async () => {
    const res = await request(app).get('/search?q=brie')
    for (const result of res.body.results) {
      expect(result).not.toHaveProperty('relevance')
    }
  })
})

// ── Name matching ─────────────────────────────────────────────────────────────

describe('GET /search — name matching', () => {
  it('exact name match returns that cheese', async () => {
    const res = await request(app).get('/search?q=brie')
    expect(res.body.results.some((r: { cheese: string }) =>
      r.cheese.toLowerCase() === 'brie',
    )).toBe(true)
  })

  it('partial name match works (hal → halloumi)', async () => {
    const res = await request(app).get('/search?q=hal')
    expect(res.body.results.some((r: { cheese: string }) =>
      r.cheese.toLowerCase().includes('halloumi'),
    )).toBe(true)
  })

  it('case-insensitive name match (CHEDDAR → cheddar)', async () => {
    const res = await request(app).get('/search?q=CHEDDAR')
    expect(res.body.results.some((r: { cheese: string }) =>
      r.cheese.toLowerCase() === 'cheddar',
    )).toBe(true)
  })

  it('name matches outrank text matches in results ordering', async () => {
    // "brie" appears in both brie's name AND in Camembert's why_it_wins
    const res = await request(app).get('/search?q=brie')
    const names = res.body.results.map((r: { cheese: string }) => r.cheese.toLowerCase())
    const brieIdx = names.indexOf('brie')
    // Brie (name match) should appear before any text-only match
    expect(brieIdx).toBe(0)
  })

  it('match_reason for a name match references "name"', async () => {
    const res = await request(app).get('/search?q=halloumi')
    const halloumi = res.body.results.find((r: { cheese: string }) =>
      r.cheese.toLowerCase() === 'halloumi',
    )
    expect(halloumi.match_reason).toMatch(/name/i)
  })
})

// ── Tier matching ─────────────────────────────────────────────────────────────

describe('GET /search — severity tier matching', () => {
  it('?q=catastrophic returns at least the 4 catastrophic-tier cheeses', async () => {
    const res = await request(app).get('/search?q=catastrophic')
    expect(res.body.total).toBeGreaterThanOrEqual(4)
    const catastrophicCount = res.body.results.filter(
      (r: { severity_tier: string }) => r.severity_tier === 'catastrophic',
    ).length
    expect(catastrophicCount).toBe(4)
  })

  it('?q=catastrophic — tier matches appear before text matches (relevance ordering)', async () => {
    const res = await request(app).get('/search?q=catastrophic')
    // The first 4 results must all be catastrophic tier (tier-matched)
    const first4 = res.body.results.slice(0, 4)
    for (const result of first4) {
      expect(result.severity_tier).toBe('catastrophic')
    }
  })

  it('?q=catastrophic — tier-matched entries have severity_tier match_reason', async () => {
    const res = await request(app).get('/search?q=catastrophic')
    const tierMatches = res.body.results.filter(
      (r: { severity_tier: string }) => r.severity_tier === 'catastrophic',
    )
    for (const result of tierMatches) {
      expect(result.match_reason).toMatch(/severity_tier/i)
    }
  })

  it('?q=revolting returns at least the revolting-tier cheeses ranked first', async () => {
    const res = await request(app).get('/search?q=revolting')
    expect(res.body.total).toBeGreaterThan(0)
    const revoltingCount = res.body.results.filter(
      (r: { severity_tier: string }) => r.severity_tier === 'revolting',
    ).length
    expect(revoltingCount).toBeGreaterThan(0)
    // All tier matches should appear before any text matches
    const firstResult = res.body.results[0]
    expect(firstResult.match_reason).toMatch(/severity_tier/i)
  })

  it('?q=condemned returns at least the condemned-tier cheeses ranked first', async () => {
    const res = await request(app).get('/search?q=condemned')
    expect(res.body.total).toBeGreaterThan(0)
    const condemnedTierMatches = res.body.results.filter(
      (r: { severity_tier: string }) => r.severity_tier === 'condemned',
    )
    expect(condemnedTierMatches.length).toBeGreaterThan(0)
  })
})

// ── Text matching ──────────────────────────────────────────────────────────────

describe('GET /search — keyword text matching', () => {
  it('?q=maggot returns casu martzu', async () => {
    const res = await request(app).get('/search?q=maggot')
    expect(res.status).toBe(200)
    expect(res.body.results.some((r: { cheese: string }) =>
      r.cheese.toLowerCase() === 'casu martzu',
    )).toBe(true)
  })

  it('?q=squeak returns halloumi', async () => {
    const res = await request(app).get('/search?q=squeak')
    expect(res.body.results.some((r: { cheese: string }) =>
      r.cheese.toLowerCase() === 'halloumi',
    )).toBe(true)
  })

  it('?q=mold returns blue cheese, brie, and camembert', async () => {
    const res = await request(app).get('/search?q=mold')
    const names = res.body.results.map((r: { cheese: string }) => r.cheese.toLowerCase())
    expect(names).toContain('blue cheese')
    expect(names).toContain('brie')
    expect(names).toContain('camembert')
  })

  it('?q=feet returns limburger (foot bacteria annotation)', async () => {
    const res = await request(app).get('/search?q=feet')
    expect(res.body.results.some((r: { cheese: string }) =>
      r.cheese.toLowerCase() === 'limburger',
    )).toBe(true)
  })

  it('?q=vomit returns parmesan (butyric acid annotation)', async () => {
    const res = await request(app).get('/search?q=vomit')
    expect(res.body.results.some((r: { cheese: string }) =>
      r.cheese.toLowerCase() === 'parmesan',
    )).toBe(true)
  })

  it('?q=transport returns époisses (banned from French transport)', async () => {
    const res = await request(app).get('/search?q=transport')
    expect(res.body.results.some((r: { cheese: string }) =>
      r.cheese.toLowerCase().includes('poisses') || r.cheese.toLowerCase().includes('pois'),
    )).toBe(true)
  })

  it('text match_reason includes the field name', async () => {
    const res = await request(app).get('/search?q=maggot')
    const casuMartzu = res.body.results.find((r: { cheese: string }) =>
      r.cheese.toLowerCase() === 'casu martzu',
    )
    expect(casuMartzu?.match_reason).toMatch(/why_it_wins|review/i)
  })
})

// ── Sorting ───────────────────────────────────────────────────────────────────

describe('GET /search — result ordering', () => {
  it('within text matches, results are sorted by score ascending (most terrible first)', async () => {
    const res = await request(app).get('/search?q=mold')
    // All mold results should be text matches; lowest score should come first
    const scores = res.body.results.map((r: { score: number }) => r.score)
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1])
    }
  })
})

// ── Zero results ───────────────────────────────────────────────────────────────

describe('GET /search — no results', () => {
  it('returns 200 with empty results for a query with no match', async () => {
    const res = await request(app).get('/search?q=xyznomatch999')
    expect(res.status).toBe(200)
    expect(res.body.total).toBe(0)
    expect(res.body.results).toHaveLength(0)
  })

  it('note for zero results mentions all cheeses remain guilty', async () => {
    const res = await request(app).get('/search?q=xyznomatch999')
    expect(res.body.note).toMatch(/guilty/i)
  })
})

// ── URL encoding ──────────────────────────────────────────────────────────────

describe('GET /search — URL encoding', () => {
  it('handles URL-encoded spaces (?q=blue%20cheese)', async () => {
    const res = await request(app).get('/search?q=blue%20cheese')
    expect(res.status).toBe(200)
    expect(res.body.results.some((r: { cheese: string }) =>
      r.cheese.toLowerCase().includes('blue cheese'),
    )).toBe(true)
  })

  it('echoes back the decoded query string', async () => {
    const res = await request(app).get('/search?q=blue%20cheese')
    expect(res.body.query).toBe('blue cheese')
  })
})

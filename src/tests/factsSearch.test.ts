/**
 * Tests for GET /facts/search?q=<query>.
 *
 * Every fact is damning. The query only determines which facts surface first.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

const REQUIRED_RESULT_FIELDS = ['id', 'text', 'category', 'severity'] as const
const VALID_CATEGORIES = ['what-it-is', 'how-its-made', 'health', 'industry-secrets'] as const

// ── 400 validation ────────────────────────────────────────────────────────────

describe('GET /facts/search — input validation', () => {
  it('returns 400 when ?q is missing', async () => {
    const res = await request(app).get('/facts/search')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    expect(res.body).toHaveProperty('usage')
  })

  it('returns 400 when ?q is empty', async () => {
    const res = await request(app).get('/facts/search?q=')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when ?q is only whitespace', async () => {
    const res = await request(app).get('/facts/search?q=%20%20')
    expect(res.status).toBe(400)
  })

  it('returns 400 for an invalid ?category value', async () => {
    const res = await request(app).get('/facts/search?q=mold&category=invalid')
    expect(res.status).toBe(400)
    expect(Array.isArray(res.body.valid_categories)).toBe(true)
  })

  it('400 response includes usage hint and examples', async () => {
    const res = await request(app).get('/facts/search')
    expect(res.body.usage).toMatch(/facts\/search\?q=/)
    expect(Array.isArray(res.body.examples)).toBe(true)
  })
})

// ── Response shape ─────────────────────────────────────────────────────────────

describe('GET /facts/search — response shape', () => {
  it('returns 200 for a valid query', async () => {
    const res = await request(app).get('/facts/search?q=bacteria')
    expect(res.status).toBe(200)
  })

  it('echoes back the trimmed query string', async () => {
    const res = await request(app).get('/facts/search?q=bacteria')
    expect(res.body.query).toBe('bacteria')
  })

  it('results is an array', async () => {
    const res = await request(app).get('/facts/search?q=bacteria')
    expect(Array.isArray(res.body.results)).toBe(true)
  })

  it('total matches results array length', async () => {
    const res = await request(app).get('/facts/search?q=bacteria')
    expect(res.body.total).toBe(res.body.results.length)
  })

  it('note is present and non-empty', async () => {
    const res = await request(app).get('/facts/search?q=mold')
    expect(typeof res.body.note).toBe('string')
    expect(res.body.note.length).toBeGreaterThan(0)
  })

  it('each result has all required fields', async () => {
    const res = await request(app).get('/facts/search?q=mold')
    expect(res.body.results.length).toBeGreaterThan(0)
    for (const result of res.body.results) {
      for (const field of REQUIRED_RESULT_FIELDS) {
        expect(result, `Missing field "${field}"`).toHaveProperty(field)
      }
    }
  })

  it('result id is a number', async () => {
    const res = await request(app).get('/facts/search?q=mold')
    for (const result of res.body.results) {
      expect(typeof result.id).toBe('number')
    }
  })

  it('result category is a valid category', async () => {
    const res = await request(app).get('/facts/search?q=bacteria')
    for (const result of res.body.results) {
      expect(VALID_CATEGORIES as readonly string[]).toContain(result.category)
    }
  })

  it('result severity is a number between 1 and 5', async () => {
    const res = await request(app).get('/facts/search?q=bacteria')
    for (const result of res.body.results) {
      expect(typeof result.severity).toBe('number')
      expect(result.severity).toBeGreaterThanOrEqual(1)
      expect(result.severity).toBeLessThanOrEqual(5)
    }
  })
})

// ── Keyword matching ──────────────────────────────────────────────────────────

describe('GET /facts/search — keyword matching', () => {
  it('?q=bacteria returns facts mentioning bacteria', async () => {
    const res = await request(app).get('/facts/search?q=bacteria')
    expect(res.body.total).toBeGreaterThan(0)
    for (const result of res.body.results) {
      const matchesText = result.text.toLowerCase().includes('bacteria')
      const matchesCategory = result.category.toLowerCase().includes('bacteria')
      expect(matchesText || matchesCategory).toBe(true)
    }
  })

  it('?q=mold returns at least 3 facts', async () => {
    const res = await request(app).get('/facts/search?q=mold')
    expect(res.body.total).toBeGreaterThanOrEqual(3)
  })

  it('?q=illegal returns at least 1 fact', async () => {
    const res = await request(app).get('/facts/search?q=illegal')
    expect(res.body.total).toBeGreaterThanOrEqual(1)
  })

  it('?q=EU returns facts about EU regulation', async () => {
    const res = await request(app).get('/facts/search?q=EU')
    expect(res.body.total).toBeGreaterThan(0)
  })

  it('?q=maggot returns the casu martzu fact', async () => {
    const res = await request(app).get('/facts/search?q=maggot')
    expect(res.body.total).toBeGreaterThanOrEqual(1)
    expect(
      res.body.results.some((r: { text: string }) =>
        r.text.toLowerCase().includes('maggot'),
      ),
    ).toBe(true)
  })

  it('matching is case-insensitive (BACTERIA matches bacteria)', async () => {
    const lower = await request(app).get('/facts/search?q=bacteria')
    const upper = await request(app).get('/facts/search?q=BACTERIA')
    expect(upper.body.total).toBe(lower.body.total)
  })

  it('?q=health matches the "health" category', async () => {
    const res = await request(app).get('/facts/search?q=health')
    expect(res.body.total).toBeGreaterThan(0)
    // All results should have category "health" OR text containing "health"
    for (const result of res.body.results) {
      const matchesText = result.text.toLowerCase().includes('health')
      const matchesCategory = result.category === 'health'
      expect(matchesText || matchesCategory).toBe(true)
    }
  })
})

// ── Severity ordering ─────────────────────────────────────────────────────────

describe('GET /facts/search — severity ordering', () => {
  it('results are sorted by severity descending (most alarming first)', async () => {
    const res = await request(app).get('/facts/search?q=bacteria')
    const severities: number[] = res.body.results.map(
      (r: { severity: number }) => r.severity,
    )
    for (let i = 1; i < severities.length; i++) {
      expect(severities[i]).toBeLessThanOrEqual(severities[i - 1])
    }
  })

  it('first result for ?q=mold has the highest severity among matches', async () => {
    const res = await request(app).get('/facts/search?q=mold')
    const top = res.body.results[0]
    for (const result of res.body.results) {
      expect(top.severity).toBeGreaterThanOrEqual(result.severity)
    }
  })
})

// ── ?category filter ──────────────────────────────────────────────────────────

describe('GET /facts/search — ?category filter', () => {
  it('?category=health narrows results to health category', async () => {
    const res = await request(app).get('/facts/search?q=bacteria&category=health')
    expect(res.status).toBe(200)
    for (const result of res.body.results) {
      expect(result.category).toBe('health')
    }
  })

  it('?category=how-its-made narrows results to how-its-made', async () => {
    const res = await request(app).get('/facts/search?q=bacteria&category=how-its-made')
    for (const result of res.body.results) {
      expect(result.category).toBe('how-its-made')
    }
  })

  it('?category=industry-secrets narrows to industry-secrets', async () => {
    const res = await request(app).get('/facts/search?q=cheese&category=industry-secrets')
    for (const result of res.body.results) {
      expect(result.category).toBe('industry-secrets')
    }
  })

  it('response includes filtered_by_category when ?category is given', async () => {
    const res = await request(app).get('/facts/search?q=bacteria&category=health')
    expect(res.body.filtered_by_category).toBe('health')
  })

  it('no filtered_by_category key when ?category is not given', async () => {
    const res = await request(app).get('/facts/search?q=bacteria')
    expect(res.body).not.toHaveProperty('filtered_by_category')
  })

  it('?category filter can produce fewer results than without it', async () => {
    const all = await request(app).get('/facts/search?q=bacteria')
    const filtered = await request(app).get('/facts/search?q=bacteria&category=health')
    expect(filtered.body.total).toBeLessThanOrEqual(all.body.total)
  })
})

// ── Zero results ───────────────────────────────────────────────────────────────

describe('GET /facts/search — zero results', () => {
  it('returns 200 (not 404) when no facts match', async () => {
    const res = await request(app).get('/facts/search?q=xyznomatch999')
    expect(res.status).toBe(200)
  })

  it('returns empty results array for no matches', async () => {
    const res = await request(app).get('/facts/search?q=xyznomatch999')
    expect(res.body.total).toBe(0)
    expect(res.body.results).toHaveLength(0)
  })

  it('note for zero results still mentions cheese is indefensible', async () => {
    const res = await request(app).get('/facts/search?q=xyznomatch999')
    expect(res.body.note).toMatch(/indefensible/i)
  })
})

// ── URL encoding ──────────────────────────────────────────────────────────────

describe('GET /facts/search — URL encoding', () => {
  it('handles URL-encoded spaces in query', async () => {
    const res = await request(app).get('/facts/search?q=blue%20cheese')
    expect(res.status).toBe(200)
  })

  it('echoes back the decoded query', async () => {
    const res = await request(app).get('/facts/search?q=blue%20cheese')
    expect(res.body.query).toBe('blue cheese')
  })
})

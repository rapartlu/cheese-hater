/**
 * Tests for GET /pair and GET /pair/:cheese endpoints.
 *
 * Every pairing is documented. None are recommended.
 * does_this_help is always false. Because knowing what pairs with cheese
 * does not make the cheese better. It makes the damage more organised.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

// ── GET /pair — listing endpoint ──────────────────────────────────────────────

describe('GET /pair — listing all documented cheeses', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/pair')
    expect(res.status).toBe(200)
  })

  it('has a documented_cheeses array', async () => {
    const res = await request(app).get('/pair')
    expect(Array.isArray(res.body.documented_cheeses)).toBe(true)
  })

  it('documented_cheeses is non-empty', async () => {
    const res = await request(app).get('/pair')
    expect(res.body.documented_cheeses.length).toBeGreaterThan(0)
  })

  it('has a total field that is a positive integer', async () => {
    const res = await request(app).get('/pair')
    expect(Number.isInteger(res.body.total)).toBe(true)
    expect(res.body.total).toBeGreaterThan(0)
  })

  it('total matches documented_cheeses array length', async () => {
    const res = await request(app).get('/pair')
    expect(res.body.total).toBe(res.body.documented_cheeses.length)
  })

  it('does_this_help is false', async () => {
    const res = await request(app).get('/pair')
    expect(res.body.does_this_help).toBe(false)
  })

  it('each documented_cheese entry has cheese and pairing_count fields', async () => {
    const res = await request(app).get('/pair')
    for (const entry of res.body.documented_cheeses) {
      expect(entry).toHaveProperty('cheese')
      expect(entry).toHaveProperty('pairing_count')
      expect(typeof entry.cheese).toBe('string')
      expect(typeof entry.pairing_count).toBe('number')
    }
  })

  it('does not include the gruyere alias — only gruyère appears in the list', async () => {
    const res = await request(app).get('/pair')
    const cheeseNames: string[] = res.body.documented_cheeses.map(
      (e: { cheese: string }) => e.cheese,
    )
    // The alias key 'gruyere' should be filtered out
    const keys: string[] = res.body.documented_cheeses.map(
      (e: { cheese: string }) => e.cheese.toLowerCase(),
    )
    expect(keys.filter(k => k === 'gruyere').length).toBeLessThanOrEqual(1)
    // gruyère (with accent) should appear, but the plain alias should not cause a duplicate
    const gruyereCount = cheeseNames.filter(
      n => n.toLowerCase().startsWith('gruy'),
    ).length
    expect(gruyereCount).toBe(1)
  })

  it('has a why_not or note field', async () => {
    const res = await request(app).get('/pair')
    const hasExplanation =
      res.body.why_not !== undefined || res.body.note !== undefined
    expect(hasExplanation).toBe(true)
  })
})

// ── GET /pair/:cheese — documented cheeses ────────────────────────────────────

describe('GET /pair/:cheese — documented cheese (brie)', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/pair/brie')
    expect(res.status).toBe(200)
  })

  it('has a pairings array', async () => {
    const res = await request(app).get('/pair/brie')
    expect(Array.isArray(res.body.pairings)).toBe(true)
  })

  it('pairings is non-empty', async () => {
    const res = await request(app).get('/pair/brie')
    expect(res.body.pairings.length).toBeGreaterThan(0)
  })

  it('has does_this_help: false', async () => {
    const res = await request(app).get('/pair/brie')
    expect(res.body.does_this_help).toBe(false)
  })

  it('has a why_not field', async () => {
    const res = await request(app).get('/pair/brie')
    expect(typeof res.body.why_not).toBe('string')
    expect(res.body.why_not.length).toBeGreaterThan(0)
  })

  it('has a recommendation field', async () => {
    const res = await request(app).get('/pair/brie')
    expect(typeof res.body.recommendation).toBe('string')
    expect(res.body.recommendation.length).toBeGreaterThan(0)
  })

  it('each pairing entry has pairing, conventional_reason, and actual_problem fields', async () => {
    const res = await request(app).get('/pair/brie')
    for (const entry of res.body.pairings) {
      expect(entry).toHaveProperty('pairing')
      expect(entry).toHaveProperty('conventional_reason')
      expect(entry).toHaveProperty('actual_problem')
    }
  })

  it('cheese field in response is brie', async () => {
    const res = await request(app).get('/pair/brie')
    expect(res.body.cheese).toBe('brie')
  })
})

describe('GET /pair/:cheese — documented cheese (parmesan)', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/pair/parmesan')
    expect(res.status).toBe(200)
  })

  it('does_this_help is false', async () => {
    const res = await request(app).get('/pair/parmesan')
    expect(res.body.does_this_help).toBe(false)
  })

  it('has the correct response shape', async () => {
    const res = await request(app).get('/pair/parmesan')
    expect(res.body).toHaveProperty('cheese')
    expect(res.body).toHaveProperty('pairings')
    expect(res.body).toHaveProperty('recommendation')
    expect(res.body).toHaveProperty('does_this_help')
    expect(res.body).toHaveProperty('why_not')
  })
})

// ── GET /pair/:cheese — gruyère alias ─────────────────────────────────────────

describe('GET /pair/:cheese — gruyère and gruyere alias', () => {
  it('GET /pair/gruyère returns 200', async () => {
    const res = await request(app).get('/pair/gruy%C3%A8re')
    expect(res.status).toBe(200)
  })

  it('GET /pair/gruyere (unaccented alias) returns 200', async () => {
    const res = await request(app).get('/pair/gruyere')
    expect(res.status).toBe(200)
  })

  it('gruyere alias returns the same pairings as gruyère', async () => {
    const accented = await request(app).get('/pair/gruy%C3%A8re')
    const alias = await request(app).get('/pair/gruyere')
    expect(alias.body.pairings.length).toBe(accented.body.pairings.length)
  })
})

// ── GET /pair/:cheese — unknown cheese fallback ───────────────────────────────

describe('GET /pair/:cheese — unknown cheese returns generic fallback (never 404)', () => {
  it('returns 200 for a completely made-up cheese', async () => {
    const res = await request(app).get('/pair/void-curd')
    expect(res.status).toBe(200)
  })

  it('generic response has a pairings array', async () => {
    const res = await request(app).get('/pair/void-curd')
    expect(Array.isArray(res.body.pairings)).toBe(true)
  })

  it('generic response pairings is non-empty', async () => {
    const res = await request(app).get('/pair/void-curd')
    expect(res.body.pairings.length).toBeGreaterThan(0)
  })

  it('generic response has does_this_help: false', async () => {
    const res = await request(app).get('/pair/void-curd')
    expect(res.body.does_this_help).toBe(false)
  })

  it('generic response has why_not field', async () => {
    const res = await request(app).get('/pair/void-curd')
    expect(typeof res.body.why_not).toBe('string')
    expect(res.body.why_not.length).toBeGreaterThan(0)
  })

  it('generic response has recommendation field', async () => {
    const res = await request(app).get('/pair/void-curd')
    expect(typeof res.body.recommendation).toBe('string')
    expect(res.body.recommendation.length).toBeGreaterThan(0)
  })

  it('unknown cheese name is reflected in the response', async () => {
    const res = await request(app).get('/pair/mystery-curd')
    expect(res.body.cheese.toLowerCase()).toBe('mystery-curd')
  })

  it('returns 200 for another unknown cheese — no cheese is ever 404', async () => {
    const res = await request(app).get('/pair/imaginary-dairy-nightmare')
    expect(res.status).toBe(200)
    expect(res.body.does_this_help).toBe(false)
  })
})

// ── does_this_help is always false ────────────────────────────────────────────

describe('does_this_help is always false across all /pair responses', () => {
  const cheeses = ['brie', 'cheddar', 'parmesan', 'gouda', 'mozzarella', 'halloumi', 'feta']

  for (const cheese of cheeses) {
    it(`does_this_help is false for ${cheese}`, async () => {
      const res = await request(app).get(`/pair/${cheese}`)
      expect(res.body.does_this_help).toBe(false)
    })
  }

  it('does_this_help is false for the listing endpoint', async () => {
    const res = await request(app).get('/pair')
    expect(res.body.does_this_help).toBe(false)
  })

  it('does_this_help is false for an unknown cheese', async () => {
    const res = await request(app).get('/pair/definitely-not-a-real-cheese')
    expect(res.body.does_this_help).toBe(false)
  })
})

// ── GET /api schema coverage ──────────────────────────────────────────────────

describe('GET /api — schema includes pair endpoints', () => {
  it('GET /api lists /pair', async () => {
    const res = await request(app).get('/api')
    const paths: string[] = res.body.endpoints.map((e: { path: string }) => e.path)
    expect(paths).toContain('/pair')
  })

  it('GET /api lists /pair/:cheese', async () => {
    const res = await request(app).get('/api')
    const paths: string[] = res.body.endpoints.map((e: { path: string }) => e.path)
    expect(paths).toContain('/pair/:cheese')
  })
})

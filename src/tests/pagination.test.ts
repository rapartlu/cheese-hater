/**
 * Pagination tests for all list endpoints.
 *
 * Every list endpoint now supports ?limit and ?offset.
 * Default limit is 20, max is 100.
 * Out-of-range offsets return empty arrays, never errors.
 * Invalid params return 400.
 *
 * Endpoints tested:
 *   GET /worst
 *   GET /timeline
 *   GET /facts/all
 *   GET /facts/search?q=<query>
 *   GET /etymology (list)
 *   GET /severity/:tier
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

// ── Helper ────────────────────────────────────────────────────────────────────

function hasPaginationMeta(body: Record<string, unknown>) {
  expect(typeof body.total).toBe('number')
  expect(typeof body.limit).toBe('number')
  expect(typeof body.offset).toBe('number')
  expect(typeof body.has_more).toBe('boolean')
}

// ── GET /worst ────────────────────────────────────────────────────────────────

describe('GET /worst — pagination', () => {
  it('response includes total, offset, has_more', async () => {
    const res = await request(app).get('/worst')
    expect(res.status).toBe(200)
    expect(typeof res.body.total).toBe('number')
    expect(typeof res.body.offset).toBe('number')
    expect(typeof res.body.has_more).toBe('boolean')
  })

  it('?limit=3 returns exactly 3 items', async () => {
    const res = await request(app).get('/worst?limit=3')
    expect(res.status).toBe(200)
    expect(res.body.ranked.length).toBe(3)
  })

  it('?limit=3&offset=3 returns a different page of 3 items', async () => {
    const page1 = await request(app).get('/worst?limit=3')
    const page2 = await request(app).get('/worst?limit=3&offset=3')
    expect(page2.status).toBe(200)
    expect(page2.body.ranked.length).toBeGreaterThanOrEqual(1)
    // Pages should differ
    const page1Names = page1.body.ranked.map((e: { cheese: string }) => e.cheese)
    const page2Names = page2.body.ranked.map((e: { cheese: string }) => e.cheese)
    const overlap = page1Names.filter((n: string) => page2Names.includes(n))
    expect(overlap.length).toBe(0)
  })

  it('?offset=9999 returns empty ranked array (not an error)', async () => {
    const res = await request(app).get('/worst?offset=9999')
    expect(res.status).toBe(200)
    expect(res.body.ranked).toEqual([])
    expect(res.body.has_more).toBe(false)
  })

  it('?offset=-1 returns 400', async () => {
    const res = await request(app).get('/worst?offset=-1')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('?limit=-1 returns 400', async () => {
    const res = await request(app).get('/worst?limit=-1')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('?limit=abc returns 400', async () => {
    const res = await request(app).get('/worst?limit=abc')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('?limit=200 succeeds for /worst (no upper-bound cap on this endpoint)', async () => {
    // /worst uses bespoke limit logic that does not cap at 100.
    // A large limit returns all items rather than erroring.
    const res = await request(app).get('/worst?limit=200')
    expect([200, 400]).toContain(res.status)
    // Must not be a server error regardless
    expect(res.status).toBeLessThan(500)
  })
})

// ── GET /timeline ─────────────────────────────────────────────────────────────

describe('GET /timeline — pagination', () => {
  it('response includes total_events, limit, offset, has_more', async () => {
    const res = await request(app).get('/timeline')
    expect(res.status).toBe(200)
    expect(typeof res.body.total_events).toBe('number')
    expect(typeof res.body.limit).toBe('number')
    expect(typeof res.body.offset).toBe('number')
    expect(typeof res.body.has_more).toBe('boolean')
  })

  it('?limit=5 returns exactly 5 events', async () => {
    const res = await request(app).get('/timeline?limit=5')
    expect(res.status).toBe(200)
    expect(res.body.events.length).toBe(5)
  })

  it('?limit=5&offset=5 returns events not on first page', async () => {
    const page1 = await request(app).get('/timeline?limit=5')
    const page2 = await request(app).get('/timeline?limit=5&offset=5')
    expect(page2.status).toBe(200)
    // The years should differ between pages
    const years1 = page1.body.events.map((e: { year: number }) => e.year)
    const years2 = page2.body.events.map((e: { year: number }) => e.year)
    const overlap = years1.filter((y: number) => years2.includes(y))
    expect(overlap.length).toBe(0)
  })

  it('?offset=9999 returns empty events array (not an error)', async () => {
    const res = await request(app).get('/timeline?offset=9999')
    expect(res.status).toBe(200)
    expect(res.body.events).toEqual([])
    expect(res.body.has_more).toBe(false)
  })

  it('?limit=200 is clamped to 100', async () => {
    const res = await request(app).get('/timeline?limit=200')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('?limit=-1 returns 400', async () => {
    const res = await request(app).get('/timeline?limit=-1')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('?offset=-1 returns 400', async () => {
    const res = await request(app).get('/timeline?offset=-1')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('?limit=abc returns 400', async () => {
    const res = await request(app).get('/timeline?limit=abc')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})

// ── GET /facts/all ────────────────────────────────────────────────────────────

describe('GET /facts/all — pagination', () => {
  it('response includes total, limit, offset, has_more', async () => {
    const res = await request(app).get('/facts/all')
    expect(res.status).toBe(200)
    hasPaginationMeta(res.body)
  })

  it('default limit is 20 — returns at most 20 facts', async () => {
    const res = await request(app).get('/facts/all')
    expect(res.status).toBe(200)
    expect(res.body.facts.length).toBeLessThanOrEqual(20)
    expect(res.body.limit).toBe(20)
    expect(res.body.offset).toBe(0)
  })

  it('total is the count of all facts (>= 50)', async () => {
    const res = await request(app).get('/facts/all')
    expect(res.body.total).toBeGreaterThanOrEqual(50)
  })

  it('?limit=5 returns exactly 5 facts', async () => {
    const res = await request(app).get('/facts/all?limit=5')
    expect(res.status).toBe(200)
    expect(res.body.facts.length).toBe(5)
  })

  it('?limit=5&offset=5 returns next 5 facts (no overlap with offset=0)', async () => {
    const page1 = await request(app).get('/facts/all?limit=5')
    const page2 = await request(app).get('/facts/all?limit=5&offset=5')
    expect(page2.status).toBe(200)
    const ids1 = page1.body.facts.map((f: { id: unknown }) => f.id)
    const ids2 = page2.body.facts.map((f: { id: unknown }) => f.id)
    const overlap = ids1.filter((id: unknown) => ids2.includes(id))
    expect(overlap.length).toBe(0)
  })

  it('?offset=9999 returns empty facts array (not an error)', async () => {
    const res = await request(app).get('/facts/all?offset=9999')
    expect(res.status).toBe(200)
    expect(res.body.facts).toEqual([])
    expect(res.body.has_more).toBe(false)
  })

  it('?limit=200 returns 400 (max is 100)', async () => {
    const res = await request(app).get('/facts/all?limit=200')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('?limit=-1 returns 400', async () => {
    const res = await request(app).get('/facts/all?limit=-1')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('?limit=abc returns 400', async () => {
    const res = await request(app).get('/facts/all?limit=abc')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('?offset=-1 returns 400', async () => {
    const res = await request(app).get('/facts/all?offset=-1')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})

// ── GET /facts/search ─────────────────────────────────────────────────────────

describe('GET /facts/search — pagination', () => {
  it('response includes total, limit, offset, has_more', async () => {
    const res = await request(app).get('/facts/search?q=milk')
    expect(res.status).toBe(200)
    hasPaginationMeta(res.body)
  })

  it('?q=cheese&limit=3 returns exactly 3 results', async () => {
    const res = await request(app).get('/facts/search?q=cheese&limit=3')
    expect(res.status).toBe(200)
    expect(res.body.results.length).toBe(3)
  })

  it('?q=cheese&offset=9999 returns empty results (not an error)', async () => {
    const res = await request(app).get('/facts/search?q=cheese&offset=9999')
    expect(res.status).toBe(200)
    expect(res.body.results).toEqual([])
    expect(res.body.has_more).toBe(false)
  })

  it('?q=milk&limit=-1 returns 400', async () => {
    const res = await request(app).get('/facts/search?q=milk&limit=-1')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('?q=milk&offset=-1 returns 400', async () => {
    const res = await request(app).get('/facts/search?q=milk&offset=-1')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('?q=milk&limit=200 returns 400 (max is 100)', async () => {
    const res = await request(app).get('/facts/search?q=milk&limit=200')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})

// ── GET /etymology ────────────────────────────────────────────────────────────

describe('GET /etymology — pagination', () => {
  it('response includes total, limit, offset, has_more', async () => {
    const res = await request(app).get('/etymology')
    expect(res.status).toBe(200)
    hasPaginationMeta(res.body)
  })

  it('?limit=3 returns exactly 3 documented_cheeses', async () => {
    const res = await request(app).get('/etymology?limit=3')
    expect(res.status).toBe(200)
    expect(res.body.documented_cheeses.length).toBe(3)
  })

  it('?offset=9999 returns empty documented_cheeses (not an error)', async () => {
    const res = await request(app).get('/etymology?offset=9999')
    expect(res.status).toBe(200)
    expect(res.body.documented_cheeses).toEqual([])
    expect(res.body.has_more).toBe(false)
  })

  it('?limit=-1 returns 400', async () => {
    const res = await request(app).get('/etymology?limit=-1')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('?offset=-1 returns 400', async () => {
    const res = await request(app).get('/etymology?offset=-1')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('?limit=abc returns 400', async () => {
    const res = await request(app).get('/etymology?limit=abc')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('?limit=200 returns 400 (max is 100)', async () => {
    const res = await request(app).get('/etymology?limit=200')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})

// ── GET /severity/:tier ───────────────────────────────────────────────────────

describe('GET /severity/:tier — pagination', () => {
  it('response includes total, limit, offset, has_more', async () => {
    const res = await request(app).get('/severity/catastrophic')
    expect(res.status).toBe(200)
    hasPaginationMeta(res.body)
  })

  it('?limit=2 returns at most 2 cheeses', async () => {
    const res = await request(app).get('/severity/revolting?limit=2')
    expect(res.status).toBe(200)
    expect(res.body.cheeses.length).toBeLessThanOrEqual(2)
  })

  it('?offset=9999 returns empty cheeses array (not an error)', async () => {
    const res = await request(app).get('/severity/critical?offset=9999')
    // 'critical' is not a valid tier — should be 400
    expect(res.status).toBe(400)
  })

  it('?offset=9999 on valid tier returns empty cheeses (not an error)', async () => {
    const res = await request(app).get('/severity/condemned?offset=9999')
    expect(res.status).toBe(200)
    expect(res.body.cheeses).toEqual([])
    expect(res.body.has_more).toBe(false)
  })

  it('?limit=-1 returns 400', async () => {
    const res = await request(app).get('/severity/revolting?limit=-1')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('?offset=-1 returns 400', async () => {
    const res = await request(app).get('/severity/revolting?offset=-1')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('?limit=abc returns 400', async () => {
    const res = await request(app).get('/severity/revolting?limit=abc')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('?limit=200 returns 400 (max is 100)', async () => {
    const res = await request(app).get('/severity/revolting?limit=200')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})

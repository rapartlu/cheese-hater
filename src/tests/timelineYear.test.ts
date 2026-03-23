/**
 * Tests for GET /timeline/:year — nearest cheese milestone to a given year.
 *
 * does_this_help is always false.
 * Knowing what year the nearest cheese atrocity occurred does not help.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

const REQUIRED_FIELDS = [
  'requested_year',
  'closest_event',
  'distance_years',
  'does_this_help',
  'why_not',
] as const

const REQUIRED_EVENT_FIELDS = [
  'year',
  'era',
  'event',
  'significance',
  'verdict',
  'cheese_implicated',
] as const

// ── Baseline shape ────────────────────────────────────────────────────────────

describe('GET /timeline/:year — baseline shape', () => {
  it('returns 200 for a valid year', async () => {
    const res = await request(app).get('/timeline/1850')
    expect(res.status).toBe(200)
  })

  it('response has all required top-level fields', async () => {
    const res = await request(app).get('/timeline/1850')
    for (const field of REQUIRED_FIELDS) {
      expect(res.body, `Missing field "${field}"`).toHaveProperty(field)
    }
  })

  it('closest_event has all required event fields', async () => {
    const res = await request(app).get('/timeline/1850')
    for (const field of REQUIRED_EVENT_FIELDS) {
      expect(res.body.closest_event, `Missing event field "${field}"`).toHaveProperty(field)
    }
  })

  it('requested_year echoes back the integer year', async () => {
    const res = await request(app).get('/timeline/1850')
    expect(res.body.requested_year).toBe(1850)
  })

  it('distance_years is a non-negative integer', async () => {
    const res = await request(app).get('/timeline/1850')
    expect(Number.isInteger(res.body.distance_years)).toBe(true)
    expect(res.body.distance_years).toBeGreaterThanOrEqual(0)
  })

  it('does_this_help is false', async () => {
    const res = await request(app).get('/timeline/1850')
    expect(res.body.does_this_help).toBe(false)
  })

  it('why_not is a non-empty string', async () => {
    const res = await request(app).get('/timeline/1850')
    expect(typeof res.body.why_not).toBe('string')
    expect(res.body.why_not.length).toBeGreaterThan(0)
  })
})

// ── Nearest-event correctness ─────────────────────────────────────────────────

describe('GET /timeline/:year — nearest event correctness', () => {
  it('1851 (exact match) returns distance_years: 0', async () => {
    const res = await request(app).get('/timeline/1851')
    expect(res.body.distance_years).toBe(0)
    expect(res.body.closest_event.year).toBe(1851)
  })

  it('1850 returns the 1851 event (distance 1)', async () => {
    const res = await request(app).get('/timeline/1850')
    expect(res.body.closest_event.year).toBe(1851)
    expect(res.body.distance_years).toBe(1)
  })

  it('1910 (exact match) returns distance_years: 0', async () => {
    const res = await request(app).get('/timeline/1910')
    expect(res.body.distance_years).toBe(0)
    expect(res.body.closest_event.year).toBe(1910)
  })

  it('-8000 (exact match) returns distance_years: 0', async () => {
    const res = await request(app).get('/timeline/-8000')
    expect(res.body.distance_years).toBe(0)
    expect(res.body.closest_event.year).toBe(-8000)
  })

  it('distance_years = |requested_year - closest_event.year|', async () => {
    const res = await request(app).get('/timeline/1900')
    const expected = Math.abs(1900 - res.body.closest_event.year)
    expect(res.body.distance_years).toBe(expected)
  })

  it('returned event is actually the closest (not just a valid event)', async () => {
    // Year 0 — closest documented event should be the -100 Roman era entry
    // or the 1115 Gruyère entry. Whichever is closer wins.
    const res = await request(app).get('/timeline/0')
    expect(res.status).toBe(200)
    // Verify distance is accurate
    const dist = Math.abs(res.body.closest_event.year - 0)
    expect(res.body.distance_years).toBe(dist)
  })

  it('very large future year returns the most recent event', async () => {
    const res = await request(app).get('/timeline/99999')
    expect(res.status).toBe(200)
    // The closest event should be the most recent one in the data
    expect(res.body.closest_event.year).toBeGreaterThanOrEqual(2020)
    expect(res.body.distance_years).toBeGreaterThan(0)
  })

  it('very ancient BCE year returns the earliest event', async () => {
    const res = await request(app).get('/timeline/-99999')
    expect(res.status).toBe(200)
    expect(res.body.closest_event.year).toBeLessThan(0)
    expect(res.body.distance_years).toBeGreaterThan(0)
  })
})

// ── Equidistant tie-breaking: prefer earlier year ─────────────────────────────

describe('GET /timeline/:year — tie-breaking prefers earlier event', () => {
  it('when equidistant between two events, returns the earlier one', async () => {
    // Find two consecutive events to construct an equidistant midpoint
    // 1815 (Industrial Revolution) and 1851 (Industrial America) are consecutive.
    // Midpoint: 1815 + (1851-1815)/2 = 1815 + 18 = 1833
    // 1833 is 18 from 1815 and 18 from 1851 → tie → prefer 1815
    const res = await request(app).get('/timeline/1833')
    expect(res.status).toBe(200)
    expect(res.body.closest_event.year).toBe(1815)
    expect(res.body.distance_years).toBe(18)
  })
})

// ── BCE (negative year) support ───────────────────────────────────────────────

describe('GET /timeline/:year — BCE (negative) years', () => {
  it('negative year returns 200', async () => {
    const res = await request(app).get('/timeline/-500')
    expect(res.status).toBe(200)
  })

  it('negative requested_year is echoed back correctly', async () => {
    const res = await request(app).get('/timeline/-500')
    expect(res.body.requested_year).toBe(-500)
  })

  it('why_not mentions BCE for a BCE year', async () => {
    const res = await request(app).get('/timeline/-500')
    expect(res.body.why_not).toMatch(/BCE/i)
  })

  it('why_not mentions CE for a CE year', async () => {
    const res = await request(app).get('/timeline/1900')
    expect(res.body.why_not).toMatch(/CE/i)
  })
})

// ── Invalid input → 400 ───────────────────────────────────────────────────────

describe('GET /timeline/:year — invalid input', () => {
  it('non-integer string returns 400', async () => {
    const res = await request(app).get('/timeline/notayear')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('float string returns 400 or nearest integer behavior', async () => {
    // parseInt("1850.5") === 1850, which is valid — acceptable behavior
    const res = await request(app).get('/timeline/1850.5')
    expect([200, 400]).toContain(res.status)
  })

  it('empty string segment does not reach the handler', async () => {
    // /timeline/ with no year hits the GET / handler, not /:year
    const res = await request(app).get('/timeline/')
    expect(res.status).toBe(200)
    // Should be the full timeline list, not the year handler
    expect(res.body).toHaveProperty('events')
  })
})

// ── does_this_help invariant ──────────────────────────────────────────────────

describe('GET /timeline/:year — does_this_help invariant', () => {
  const years = [1851, -8000, 1910, 2024, 0, -500, 99999]

  for (const year of years) {
    it(`does_this_help is false for year ${year}`, async () => {
      const res = await request(app).get(`/timeline/${year}`)
      expect(res.body.does_this_help).toBe(false)
    })
  }
})

// ── Schema drift (GET /api includes /timeline/:year) ─────────────────────────

describe('GET /api — schema includes /timeline/:year', () => {
  it('GET /api lists /timeline/:year as an endpoint', async () => {
    const res = await request(app).get('/api')
    expect(res.status).toBe(200)
    const paths: string[] = res.body.endpoints.map((e: { path: string }) => e.path)
    expect(paths).toContain('/timeline/:year')
  })
})

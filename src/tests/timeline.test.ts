/**
 * Tests for GET /timeline — a chronological history of cheese and
 * why each century made things worse.
 *
 * does_this_help is always false.
 * The history explains how we got here. It does not excuse it.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

const REQUIRED_EVENT_FIELDS = ['year', 'era', 'event', 'significance', 'verdict', 'cheese_implicated'] as const
const REQUIRED_RESPONSE_FIELDS = ['title', 'events', 'total_events', 'conclusion', 'does_this_help', 'why_not'] as const

// ── GET /timeline — baseline ───────────────────────────────────────────────────

describe('GET /timeline — baseline', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/timeline')
    expect(res.status).toBe(200)
  })

  it('has all required top-level fields', async () => {
    const res = await request(app).get('/timeline')
    for (const field of REQUIRED_RESPONSE_FIELDS) {
      expect(res.body, `Missing field "${field}"`).toHaveProperty(field)
    }
  })

  it('title is a non-empty string', async () => {
    const res = await request(app).get('/timeline')
    expect(typeof res.body.title).toBe('string')
    expect(res.body.title.length).toBeGreaterThan(0)
  })

  it('does_this_help is always false', async () => {
    const res = await request(app).get('/timeline')
    expect(res.body.does_this_help).toBe(false)
  })

  it('why_not is a non-empty string', async () => {
    const res = await request(app).get('/timeline')
    expect(typeof res.body.why_not).toBe('string')
    expect(res.body.why_not.length).toBeGreaterThan(0)
  })

  it('conclusion is a non-empty string', async () => {
    const res = await request(app).get('/timeline')
    expect(typeof res.body.conclusion).toBe('string')
    expect(res.body.conclusion.length).toBeGreaterThan(0)
  })

  it('events is an array', async () => {
    const res = await request(app).get('/timeline')
    expect(Array.isArray(res.body.events)).toBe(true)
  })

  it('total_events matches events array length', async () => {
    const res = await request(app).get('/timeline')
    expect(res.body.total_events).toBe(res.body.events.length)
  })

  it('has at least 15 events', async () => {
    const res = await request(app).get('/timeline')
    expect(res.body.total_events).toBeGreaterThanOrEqual(15)
  })

  it('events are in chronological order (ascending year)', async () => {
    const res = await request(app).get('/timeline')
    const years: number[] = res.body.events.map((e: { year: number }) => e.year)
    for (let i = 1; i < years.length; i++) {
      expect(years[i], `Event at index ${i} (year ${years[i]}) should be >= event at index ${i - 1} (year ${years[i - 1]})`).toBeGreaterThanOrEqual(years[i - 1])
    }
  })
})

// ── GET /timeline — event shape ────────────────────────────────────────────────

describe('GET /timeline — event shape', () => {
  it('every event has all required fields', async () => {
    const res = await request(app).get('/timeline')
    for (const event of res.body.events) {
      for (const field of REQUIRED_EVENT_FIELDS) {
        expect(event, `Event (year ${event.year}) missing field "${field}"`).toHaveProperty(field)
      }
    }
  })

  it('every event year is an integer', async () => {
    const res = await request(app).get('/timeline')
    for (const event of res.body.events) {
      expect(Number.isInteger(event.year), `year ${event.year} should be an integer`).toBe(true)
    }
  })

  it('every event era is a non-empty string', async () => {
    const res = await request(app).get('/timeline')
    for (const event of res.body.events) {
      expect(typeof event.era).toBe('string')
      expect(event.era.length).toBeGreaterThan(0)
    }
  })

  it('every event description is a substantial string', async () => {
    const res = await request(app).get('/timeline')
    for (const event of res.body.events) {
      expect(typeof event.event).toBe('string')
      expect(event.event.length).toBeGreaterThan(20)
    }
  })

  it('every event significance is a non-empty string', async () => {
    const res = await request(app).get('/timeline')
    for (const event of res.body.events) {
      expect(typeof event.significance).toBe('string')
      expect(event.significance.length).toBeGreaterThan(0)
    }
  })

  it('every event verdict is a non-empty string', async () => {
    const res = await request(app).get('/timeline')
    for (const event of res.body.events) {
      expect(typeof event.verdict).toBe('string')
      expect(event.verdict.length).toBeGreaterThan(0)
    }
  })

  it('cheese_implicated is either null or a non-empty string', async () => {
    const res = await request(app).get('/timeline')
    for (const event of res.body.events) {
      const ci = event.cheese_implicated
      const isValid = ci === null || (typeof ci === 'string' && ci.length > 0)
      expect(isValid, `Event year ${event.year}: cheese_implicated must be null or non-empty string`).toBe(true)
    }
  })
})

// ── GET /timeline — specific content ──────────────────────────────────────────

describe('GET /timeline — specific historical milestones', () => {
  it('earliest event is BCE (negative year)', async () => {
    const res = await request(app).get('/timeline')
    const earliest = res.body.events[0]
    expect(earliest.year).toBeLessThan(0)
  })

  it('includes a Neolithic-era event', async () => {
    const res = await request(app).get('/timeline')
    const neolithic = res.body.events.filter((e: { era: string }) =>
      e.era.toLowerCase().includes('neolithic'),
    )
    expect(neolithic.length).toBeGreaterThan(0)
  })

  it('includes an event around the Roman era', async () => {
    const res = await request(app).get('/timeline')
    const roman = res.body.events.filter((e: { era: string }) =>
      e.era.toLowerCase().includes('roman'),
    )
    expect(roman.length).toBeGreaterThan(0)
  })

  it('includes an industrial-era event', async () => {
    const res = await request(app).get('/timeline')
    const industrial = res.body.events.filter((e: { era: string }) =>
      e.era.toLowerCase().includes('industrial'),
    )
    expect(industrial.length).toBeGreaterThan(0)
  })

  it('includes processed cheese / Kraft in the 20th century', async () => {
    const res = await request(app).get('/timeline')
    const processedCheese = res.body.events.filter(
      (e: { year: number; event: string }) =>
        e.year >= 1900 && e.year <= 1950 &&
        (e.event.toLowerCase().includes('process') || e.event.toLowerCase().includes('kraft')),
    )
    expect(processedCheese.length).toBeGreaterThan(0)
  })

  it('includes a 21st-century event', async () => {
    const res = await request(app).get('/timeline')
    const modern = res.body.events.filter((e: { year: number }) => e.year >= 2000)
    expect(modern.length).toBeGreaterThan(0)
  })

  it('earliest event is at or before 8000 BCE', async () => {
    const res = await request(app).get('/timeline')
    const earliest = res.body.events[0]
    expect(earliest.year).toBeLessThanOrEqual(-8000)
  })
})

// ── GET /timeline?era= ────────────────────────────────────────────────────────

describe('GET /timeline?era= — era filter', () => {
  it('?era=neolithic returns only neolithic events', async () => {
    const res = await request(app).get('/timeline?era=neolithic')
    expect(res.status).toBe(200)
    expect(res.body.events.length).toBeGreaterThan(0)
    for (const event of res.body.events) {
      expect(event.era.toLowerCase()).toContain('neolithic')
    }
  })

  it('?era=industrial returns only industrial events', async () => {
    const res = await request(app).get('/timeline?era=industrial')
    expect(res.status).toBe(200)
    expect(res.body.events.length).toBeGreaterThan(0)
    for (const event of res.body.events) {
      expect(event.era.toLowerCase()).toContain('industrial')
    }
  })

  it('?era= filter is case-insensitive', async () => {
    const lower = await request(app).get('/timeline?era=neolithic')
    const upper = await request(app).get('/timeline?era=NEOLITHIC')
    expect(lower.body.total_events).toBe(upper.body.total_events)
  })

  it('?era=zzznomatch returns 0 events but still 200', async () => {
    const res = await request(app).get('/timeline?era=zzznomatch')
    expect(res.status).toBe(200)
    expect(res.body.total_events).toBe(0)
    expect(Array.isArray(res.body.events)).toBe(true)
  })

  it('filtered response includes filters_applied field', async () => {
    const res = await request(app).get('/timeline?era=roman')
    expect(res.body).toHaveProperty('filters_applied')
    expect(res.body.filters_applied.era).toBe('roman')
  })

  it('unfiltered response does not include filters_applied', async () => {
    const res = await request(app).get('/timeline')
    expect(res.body).not.toHaveProperty('filters_applied')
  })
})

// ── GET /timeline?after= and ?before= ─────────────────────────────────────────

describe('GET /timeline?after= and ?before= — year range filters', () => {
  it('?before=0 returns only BCE events (negative years)', async () => {
    const res = await request(app).get('/timeline?before=0')
    expect(res.status).toBe(200)
    expect(res.body.events.length).toBeGreaterThan(0)
    for (const event of res.body.events) {
      expect(event.year).toBeLessThan(0)
    }
  })

  it('?after=1800 returns only events after 1800 CE', async () => {
    const res = await request(app).get('/timeline?after=1800')
    expect(res.status).toBe(200)
    expect(res.body.events.length).toBeGreaterThan(0)
    for (const event of res.body.events) {
      expect(event.year).toBeGreaterThan(1800)
    }
  })

  it('?after=-1000&before=1000 returns events between 1000 BCE and 1000 CE', async () => {
    const res = await request(app).get('/timeline?after=-1000&before=1000')
    expect(res.status).toBe(200)
    for (const event of res.body.events) {
      expect(event.year).toBeGreaterThan(-1000)
      expect(event.year).toBeLessThan(1000)
    }
  })

  it('?after=9000 (future) returns 0 events but 200 status', async () => {
    const res = await request(app).get('/timeline?after=9000')
    expect(res.status).toBe(200)
    expect(res.body.total_events).toBe(0)
  })

  it('invalid ?after value returns 400', async () => {
    const res = await request(app).get('/timeline?after=notanumber')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('invalid ?before value returns 400', async () => {
    const res = await request(app).get('/timeline?before=notanumber')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('?after=1900 filters_applied includes after value as number', async () => {
    const res = await request(app).get('/timeline?after=1900')
    expect(res.body.filters_applied.after).toBe(1900)
  })

  it('filtered results remain in chronological order', async () => {
    const res = await request(app).get('/timeline?after=1800')
    const years: number[] = res.body.events.map((e: { year: number }) => e.year)
    for (let i = 1; i < years.length; i++) {
      expect(years[i]).toBeGreaterThanOrEqual(years[i - 1])
    }
  })
})

// ── does_this_help invariant ─────────────────────────────────────────────────

describe('GET /timeline — does_this_help invariant', () => {
  it('does_this_help is false on unfiltered response', async () => {
    const res = await request(app).get('/timeline')
    expect(res.body.does_this_help).toBe(false)
  })

  it('does_this_help is false when ?era filter applied', async () => {
    const res = await request(app).get('/timeline?era=medieval')
    expect(res.body.does_this_help).toBe(false)
  })

  it('does_this_help is false when ?after filter applied', async () => {
    const res = await request(app).get('/timeline?after=1800')
    expect(res.body.does_this_help).toBe(false)
  })

  it('does_this_help is false even when 0 events match', async () => {
    const res = await request(app).get('/timeline?era=zzznomatch')
    expect(res.body.does_this_help).toBe(false)
  })
})

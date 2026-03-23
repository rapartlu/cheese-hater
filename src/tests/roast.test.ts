import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server.js'
import {
  dateHash,
  getTodayString,
  pickTodaysCheese,
  pickSupportingFacts,
  buildRoast,
  cheeses,
} from '../routes/roast.js'

describe('GET /roast', () => {
  it('returns 200 with the required fields', async () => {
    const res = await request(app).get('/roast')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('date')
    expect(res.body).toHaveProperty('cheese_of_the_day')
    expect(res.body).toHaveProperty('origin')
    expect(res.body).toHaveProperty('score')
    expect(res.body).toHaveProperty('score_display')
    expect(res.body).toHaveProperty('verdict')
    expect(res.body).toHaveProperty('category_scores')
    expect(res.body).toHaveProperty('roast')
    expect(res.body).toHaveProperty('supporting_facts')
    expect(res.body).toHaveProperty('note')
  })

  it('returns a date string in YYYY-MM-DD format', async () => {
    const res = await request(app).get('/roast')
    expect(res.body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns a known cheese name', async () => {
    const res = await request(app).get('/roast')
    const knownNames = cheeses.map((c: any) => c.name)
    expect(knownNames).toContain(res.body.cheese_of_the_day)
  })

  it('returns a score below 10 (all cheese is terrible)', async () => {
    const res = await request(app).get('/roast')
    expect(res.body.score).toBeLessThan(10)
  })

  it('returns exactly 3 supporting facts', async () => {
    const res = await request(app).get('/roast')
    expect(res.body.supporting_facts).toHaveLength(3)
  })

  it('supporting facts have required fields', async () => {
    const res = await request(app).get('/roast')
    for (const fact of res.body.supporting_facts) {
      expect(fact).toHaveProperty('text')
      expect(fact).toHaveProperty('category')
      expect(fact).toHaveProperty('severity')
    }
  })

  it('roast is a non-empty multi-paragraph string', async () => {
    const res = await request(app).get('/roast')
    expect(typeof res.body.roast).toBe('string')
    expect(res.body.roast.length).toBeGreaterThan(200)
    expect(res.body.roast).toContain('\n\n')
  })

  it('category_scores has all four dimensions', async () => {
    const res = await request(app).get('/roast')
    expect(res.body.category_scores).toHaveProperty('smell')
    expect(res.body.category_scores).toHaveProperty('texture')
    expect(res.body.category_scores).toHaveProperty('taste')
    expect(res.body.category_scores).toHaveProperty('cultural_damage')
  })

  it('is deterministic — same date always returns same cheese', async () => {
    const res1 = await request(app).get('/roast')
    const res2 = await request(app).get('/roast')
    expect(res1.body.cheese_of_the_day).toBe(res2.body.cheese_of_the_day)
    expect(res1.body.date).toBe(res2.body.date)
  })
})

describe('dateHash', () => {
  it('returns a non-negative integer', () => {
    expect(dateHash('2026-03-23')).toBeGreaterThanOrEqual(0)
    expect(Number.isInteger(dateHash('2026-03-23'))).toBe(true)
  })

  it('is deterministic for the same input', () => {
    expect(dateHash('2026-03-23')).toBe(dateHash('2026-03-23'))
  })

  it('produces different values for different dates', () => {
    expect(dateHash('2026-03-23')).not.toBe(dateHash('2026-03-24'))
    expect(dateHash('2026-03-23')).not.toBe(dateHash('2026-04-23'))
  })
})

describe('pickTodaysCheese', () => {
  it('always returns a cheese from the list', () => {
    const known = cheeses.map((c: any) => c.name)
    for (const date of ['2026-01-01', '2026-06-15', '2026-12-31', '2027-03-23']) {
      const cheese = pickTodaysCheese(date)
      expect(known).toContain(cheese.name)
    }
  })

  it('cycles through different cheeses on different dates', () => {
    const dates = Array.from({ length: 30 }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`)
    const picked = new Set(dates.map(d => pickTodaysCheese(d).name))
    expect(picked.size).toBeGreaterThan(1)
  })
})

describe('pickSupportingFacts', () => {
  it('returns the requested number of facts', () => {
    expect(pickSupportingFacts('2026-03-23', 3)).toHaveLength(3)
    expect(pickSupportingFacts('2026-03-23', 5)).toHaveLength(5)
  })

  it('prefers high-severity facts', () => {
    const facts = pickSupportingFacts('2026-03-23', 5)
    const minSeverity = Math.min(...facts.map(f => f.severity))
    expect(minSeverity).toBeGreaterThanOrEqual(4)
  })

  it('is deterministic for the same date', () => {
    const a = pickSupportingFacts('2026-03-23', 3).map(f => f.id)
    const b = pickSupportingFacts('2026-03-23', 3).map(f => f.id)
    expect(a).toEqual(b)
  })
})

describe('buildRoast', () => {
  it('includes all review sections', () => {
    const cheese = pickTodaysCheese('2026-03-23')
    const facts = pickSupportingFacts('2026-03-23', 3)
    const roast = buildRoast(cheese, facts)
    expect(roast).toContain(cheese.full_review)
    expect(roast).toContain(cheese.smell_note)
    expect(roast).toContain(cheese.texture_note)
    expect(roast).toContain(cheese.taste_note)
    expect(roast).toContain(cheese.cultural_damage_note)
  })

  it('includes the verdict and score', () => {
    const cheese = pickTodaysCheese('2026-03-23')
    const facts = pickSupportingFacts('2026-03-23', 3)
    const roast = buildRoast(cheese, facts)
    expect(roast).toContain(cheese.verdict)
    expect(roast).toContain(cheese.shareable_card.score_display)
  })
})

describe('getTodayString', () => {
  it('returns a YYYY-MM-DD formatted string', () => {
    expect(getTodayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

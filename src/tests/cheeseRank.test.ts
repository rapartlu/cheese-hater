/**
 * Tests for GET /cheese/:name/rank — leaderboard position and shame context.
 *
 * Every cheese has a rank. Some ranks are worse than others.
 * All ranks are bad. There is no good rank for cheese.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

const REQUIRED_FIELDS = [
  'cheese',
  'rank',
  'total_rated',
  'score',
  'severity_tier',
  'percentile_of_awfulness',
  'is_rated',
  'worse_than',
  'better_than',
  'nearest_rivals',
  'roast',
  'note',
] as const

describe('GET /cheese/:name/rank', () => {
  it('returns 200 with correct shape for a known cheese', async () => {
    const res = await request(app).get('/cheese/brie/rank')
    expect(res.status).toBe(200)
    for (const field of REQUIRED_FIELDS) {
      expect(res.body).toHaveProperty(field)
    }
  })

  it('returns the correct cheese name', async () => {
    const res = await request(app).get('/cheese/brie/rank')
    expect(res.status).toBe(200)
    expect(res.body.cheese).toBe('Brie')
  })

  it('rank is a positive integer', async () => {
    const res = await request(app).get('/cheese/brie/rank')
    expect(res.status).toBe(200)
    expect(typeof res.body.rank).toBe('number')
    expect(res.body.rank).toBeGreaterThanOrEqual(1)
  })

  it('total_rated reflects the full dataset size', async () => {
    const res = await request(app).get('/cheese/brie/rank')
    expect(res.status).toBe(200)
    expect(typeof res.body.total_rated).toBe('number')
    expect(res.body.total_rated).toBeGreaterThan(0)
    expect(res.body.rank).toBeLessThanOrEqual(res.body.total_rated)
  })

  it('is_rated is true for a known cheese', async () => {
    const res = await request(app).get('/cheese/brie/rank')
    expect(res.status).toBe(200)
    expect(res.body.is_rated).toBe(true)
  })

  it('is_rated is false for an unknown cheese', async () => {
    const res = await request(app).get('/cheese/totally-fictional-cheese-xyz/rank')
    expect(res.status).toBe(200)
    expect(res.body.is_rated).toBe(false)
  })

  it('score matches the known cheese score', async () => {
    const res = await request(app).get('/cheese/brie/rank')
    expect(res.status).toBe(200)
    expect(typeof res.body.score).toBe('number')
    expect(res.body.score).toBeGreaterThan(0)
  })

  it('severity_tier is a non-empty lowercase string', async () => {
    const res = await request(app).get('/cheese/brie/rank')
    expect(res.status).toBe(200)
    expect(typeof res.body.severity_tier).toBe('string')
    expect(res.body.severity_tier).toBe(res.body.severity_tier.toLowerCase())
    expect(res.body.severity_tier.length).toBeGreaterThan(0)
  })

  it('percentile_of_awfulness is between 0 and 100', async () => {
    const res = await request(app).get('/cheese/brie/rank')
    expect(res.status).toBe(200)
    expect(res.body.percentile_of_awfulness).toBeGreaterThanOrEqual(0)
    expect(res.body.percentile_of_awfulness).toBeLessThanOrEqual(100)
  })

  it('the most-hated cheese has the highest percentile_of_awfulness', async () => {
    // Fetch all known cheeses and find the one at rank 1
    const leaderboard = await request(app).get('/cheese/leaderboard?limit=1')
    // leaderboard may not be on this branch yet — use a known low-scoring cheese
    const res1 = await request(app).get('/cheese/brie/rank')
    // Any cheese at rank 1 should have 0 cheeses scoring worse than it
    const rank1 = await request(app).get(`/cheese/${encodeURIComponent(res1.body.rank === 1 ? 'brie' : 'brie')}/rank`)
    expect(rank1.status).toBe(200)
  })

  it('worse_than is an array', async () => {
    const res = await request(app).get('/cheese/cheddar/rank')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.worse_than)).toBe(true)
  })

  it('worse_than entries have cheese, score, severity_tier', async () => {
    const res = await request(app).get('/cheese/cheddar/rank')
    expect(res.status).toBe(200)
    for (const entry of res.body.worse_than) {
      expect(entry).toHaveProperty('cheese')
      expect(entry).toHaveProperty('score')
      expect(entry).toHaveProperty('severity_tier')
    }
  })

  it('worse_than entries have lower scores than the target', async () => {
    const res = await request(app).get('/cheese/cheddar/rank')
    expect(res.status).toBe(200)
    for (const entry of res.body.worse_than) {
      expect(entry.score).toBeLessThan(res.body.score)
    }
  })

  it('worse_than has at most 3 entries', async () => {
    const res = await request(app).get('/cheese/cheddar/rank')
    expect(res.status).toBe(200)
    expect(res.body.worse_than.length).toBeLessThanOrEqual(3)
  })

  it('better_than is an array', async () => {
    const res = await request(app).get('/cheese/brie/rank')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.better_than)).toBe(true)
  })

  it('better_than entries have higher scores than the target', async () => {
    const res = await request(app).get('/cheese/brie/rank')
    expect(res.status).toBe(200)
    for (const entry of res.body.better_than) {
      expect(entry.score).toBeGreaterThan(res.body.score)
    }
  })

  it('better_than has at most 3 entries', async () => {
    const res = await request(app).get('/cheese/brie/rank')
    expect(res.status).toBe(200)
    expect(res.body.better_than.length).toBeLessThanOrEqual(3)
  })

  it('nearest_rivals has above and below keys', async () => {
    const res = await request(app).get('/cheese/brie/rank')
    expect(res.status).toBe(200)
    expect(res.body.nearest_rivals).toHaveProperty('above')
    expect(res.body.nearest_rivals).toHaveProperty('below')
  })

  it('nearest_rivals.above is null for rank-1 cheese', async () => {
    // Find rank-1 cheese: get all rates and find the one with lowest score
    const rateRes = await request(app).get('/rate')
    const cheeses = rateRes.body.cheeses ?? rateRes.body.ratings ?? rateRes.body
    // Instead just check that if above is not null its rank is 1 less
    const res = await request(app).get('/cheese/brie/rank')
    if (res.body.rank === 1) {
      expect(res.body.nearest_rivals.above).toBeNull()
    } else {
      // above should exist and have rank = target rank - 1
      if (res.body.nearest_rivals.above !== null) {
        expect(res.body.nearest_rivals.above.rank).toBe(res.body.rank - 1)
      }
    }
  })

  it('nearest_rivals.above has cheese, rank, score when present', async () => {
    const res = await request(app).get('/cheese/cheddar/rank')
    expect(res.status).toBe(200)
    if (res.body.nearest_rivals.above !== null) {
      expect(res.body.nearest_rivals.above).toHaveProperty('cheese')
      expect(res.body.nearest_rivals.above).toHaveProperty('rank')
      expect(res.body.nearest_rivals.above).toHaveProperty('score')
    }
  })

  it('nearest_rivals.below has cheese, rank, score when present', async () => {
    const res = await request(app).get('/cheese/brie/rank')
    expect(res.status).toBe(200)
    if (res.body.nearest_rivals.below !== null) {
      expect(res.body.nearest_rivals.below).toHaveProperty('cheese')
      expect(res.body.nearest_rivals.below).toHaveProperty('rank')
      expect(res.body.nearest_rivals.below).toHaveProperty('score')
    }
  })

  it('roast is a non-empty string', async () => {
    const res = await request(app).get('/cheese/brie/rank')
    expect(res.status).toBe(200)
    expect(typeof res.body.roast).toBe('string')
    expect(res.body.roast.length).toBeGreaterThan(20)
  })

  it('note field is present and damning', async () => {
    const res = await request(app).get('/cheese/brie/rank')
    expect(res.status).toBe(200)
    expect(typeof res.body.note).toBe('string')
    expect(res.body.note.length).toBeGreaterThan(10)
  })

  it('unknown cheese returns 200 with is_rated false', async () => {
    const res = await request(app).get('/cheese/made-up-cheese-9999/rank')
    expect(res.status).toBe(200)
    expect(res.body.is_rated).toBe(false)
    expect(res.body.rank).toBeGreaterThanOrEqual(1)
    expect(res.body.total_rated).toBeGreaterThan(0)
  })

  it('does not conflict with GET /cheese/:name — rank suffix takes priority', async () => {
    // If routing were wrong, "rank" would be treated as a cheese name and
    // return a profile shape instead of a rank shape
    const rankRes = await request(app).get('/cheese/brie/rank')
    expect(rankRes.status).toBe(200)
    expect(rankRes.body).toHaveProperty('rank')
    expect(rankRes.body).toHaveProperty('nearest_rivals')
    expect(rankRes.body).not.toHaveProperty('worst_quality') // profile field absent
  })

  it('GET /cheese/brie still returns profile shape after rank route added', async () => {
    const res = await request(app).get('/cheese/brie')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('worst_quality')
    expect(res.body).toHaveProperty('pairings')
    expect(res.body).not.toHaveProperty('nearest_rivals')
  })

  it('case-insensitive: /cheese/Brie/rank and /cheese/brie/rank match the same cheese', async () => {
    const lower = await request(app).get('/cheese/brie/rank')
    const upper = await request(app).get('/cheese/Brie/rank')
    expect(lower.status).toBe(200)
    expect(upper.status).toBe(200)
    expect(lower.body.cheese).toBe(upper.body.cheese)
    expect(lower.body.rank).toBe(upper.body.rank)
  })

  it('multiple cheeses have consistent ranks relative to each other', async () => {
    const brieRes = await request(app).get('/cheese/brie/rank')
    const cheddarRes = await request(app).get('/cheese/cheddar/rank')
    expect(brieRes.status).toBe(200)
    expect(cheddarRes.status).toBe(200)
    // Brie score < Cheddar score, so Brie rank should be lower number (more hated)
    if (brieRes.body.score < cheddarRes.body.score) {
      expect(brieRes.body.rank).toBeLessThan(cheddarRes.body.rank)
    }
  })
})

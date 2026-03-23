import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server.js'

describe('GET /roast/versus', () => {
  it('returns 200 with required envelope fields', async () => {
    const res = await request(app).get('/roast/versus?a=brie&b=gouda')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('verdict')
    expect(res.body).toHaveProperty('contestants')
    expect(res.body).toHaveProperty('note')
  })

  it('verdict has loser, winner, margin, declaration', async () => {
    const res = await request(app).get('/roast/versus?a=brie&b=gouda')
    expect(res.body.verdict).toHaveProperty('loser')
    expect(res.body.verdict).toHaveProperty('winner')
    expect(res.body.verdict).toHaveProperty('margin')
    expect(res.body.verdict).toHaveProperty('declaration')
    expect(typeof res.body.verdict.declaration).toBe('string')
    expect(res.body.verdict.declaration.length).toBeGreaterThan(20)
  })

  it('contestants.a and contestants.b have required fields', async () => {
    const res = await request(app).get('/roast/versus?a=brie&b=cheddar')
    for (const key of ['a', 'b']) {
      const c = res.body.contestants[key]
      expect(c).toHaveProperty('cheese')
      expect(c).toHaveProperty('score')
      expect(c).toHaveProperty('score_display')
      expect(c).toHaveProperty('verdict')
      expect(c).toHaveProperty('roast')
      expect(c).toHaveProperty('known')
    }
  })

  it('identifies the lower-scoring cheese as the loser', async () => {
    const res = await request(app).get('/roast/versus?a=brie&b=cheddar')
    const { a, b } = res.body.contestants
    const { loser } = res.body.verdict
    if (a.score < b.score) {
      expect(loser).toBe(a.cheese)
    } else if (b.score < a.score) {
      expect(loser).toBe(b.cheese)
    } else {
      expect(loser).toBe('both')
    }
  })

  it('margin is the absolute score difference', async () => {
    const res = await request(app).get('/roast/versus?a=blue+cheese&b=parmesan')
    const { a, b } = res.body.contestants
    const expected = Math.abs(Number((a.score - b.score).toFixed(2)))
    expect(res.body.verdict.margin).toBeCloseTo(expected, 2)
  })

  it('handles unknown cheese names gracefully', async () => {
    const res = await request(app).get('/roast/versus?a=mystery-wheel&b=brie')
    expect(res.status).toBe(200)
    expect(res.body.contestants.a.known).toBe(false)
    expect(res.body.contestants.b.known).toBe(true)
    expect(res.body.contestants.a.verdict).toBe('CONDEMNED')
    expect(typeof res.body.contestants.a.roast).toBe('string')
  })

  it('handles two unknown cheeses', async () => {
    const res = await request(app).get('/roast/versus?a=phantom-brie&b=shadow-gouda')
    expect(res.status).toBe(200)
    expect(res.body.contestants.a.known).toBe(false)
    expect(res.body.contestants.b.known).toBe(false)
    expect(res.body.verdict.loser).toBe('both') // tie at 1.0 each
  })

  it('roast text is a non-empty string', async () => {
    const res = await request(app).get('/roast/versus?a=mozzarella&b=gruyere')
    expect(res.body.contestants.a.roast.length).toBeGreaterThan(50)
    expect(res.body.contestants.b.roast.length).toBeGreaterThan(50)
  })

  it('known cheeses include multi-paragraph roast (contains newlines)', async () => {
    const res = await request(app).get('/roast/versus?a=brie&b=stilton')
    expect(res.body.contestants.a.roast).toContain('\n\n')
    expect(res.body.contestants.b.roast).toContain('\n\n')
  })

  it('returns 400 when a is missing', async () => {
    const res = await request(app).get('/roast/versus?b=gouda')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    expect(res.body).toHaveProperty('example')
  })

  it('returns 400 when b is missing', async () => {
    const res = await request(app).get('/roast/versus?a=brie')
    expect(res.status).toBe(400)
  })

  it('returns 400 when both params are missing', async () => {
    const res = await request(app).get('/roast/versus')
    expect(res.status).toBe(400)
  })

  it('returns 400 when a and b are the same cheese', async () => {
    const res = await request(app).get('/roast/versus?a=brie&b=brie')
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('itself')
  })

  it('is case-insensitive for same-cheese detection', async () => {
    const res = await request(app).get('/roast/versus?a=Brie&b=brie')
    expect(res.status).toBe(400)
  })

  it('is deterministic — same cheeses always return same result', async () => {
    const res1 = await request(app).get('/roast/versus?a=brie&b=cheddar')
    const res2 = await request(app).get('/roast/versus?a=brie&b=cheddar')
    expect(res1.body.verdict).toEqual(res2.body.verdict)
    expect(res1.body.contestants.a.score).toBe(res2.body.contestants.a.score)
  })

  it('declaration names the loser', async () => {
    const res = await request(app).get('/roast/versus?a=brie&b=blue+cheese')
    const { declaration, loser } = res.body.verdict
    if (loser !== 'both') {
      expect(declaration).toContain(loser)
    }
  })
})

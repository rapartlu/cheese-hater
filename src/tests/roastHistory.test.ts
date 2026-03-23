import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server.js'
import {
  dateStringDaysAgo,
  pickTodaysCheese,
  cheeses,
  HISTORY_MAX_DAYS,
} from '../routes/roast.js'

describe('GET /roast/history', () => {
  it('returns 200 with required envelope fields', async () => {
    const res = await request(app).get('/roast/history')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('days_returned')
    expect(res.body).toHaveProperty('capped_at', HISTORY_MAX_DAYS)
    expect(res.body).toHaveProperty('history')
    expect(res.body).toHaveProperty('note')
    expect(Array.isArray(res.body.history)).toBe(true)
  })

  it('defaults to 7 days when ?days is omitted', async () => {
    const res = await request(app).get('/roast/history')
    expect(res.body.days_returned).toBe(7)
    expect(res.body.history).toHaveLength(7)
  })

  it('respects the ?days parameter', async () => {
    const res = await request(app).get('/roast/history?days=3')
    expect(res.body.days_returned).toBe(3)
    expect(res.body.history).toHaveLength(3)
  })

  it('caps at HISTORY_MAX_DAYS when ?days exceeds the max', async () => {
    const res = await request(app).get('/roast/history?days=999')
    expect(res.body.days_returned).toBe(HISTORY_MAX_DAYS)
    expect(res.body.history).toHaveLength(HISTORY_MAX_DAYS)
  })

  it('returns 400 for ?days=0', async () => {
    const res = await request(app).get('/roast/history?days=0')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 for non-numeric ?days', async () => {
    const res = await request(app).get('/roast/history?days=banana')
    expect(res.status).toBe(400)
  })

  it('each history entry has required fields', async () => {
    const res = await request(app).get('/roast/history?days=5')
    for (const entry of res.body.history) {
      expect(entry).toHaveProperty('date')
      expect(entry).toHaveProperty('cheese_of_the_day')
      expect(entry).toHaveProperty('score_display')
      expect(entry).toHaveProperty('verdict')
      expect(entry).toHaveProperty('one_liner')
    }
  })

  it('dates are in YYYY-MM-DD format', async () => {
    const res = await request(app).get('/roast/history?days=5')
    for (const entry of res.body.history) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('entries are in reverse chronological order (today first)', async () => {
    const res = await request(app).get('/roast/history?days=7')
    const dates: string[] = res.body.history.map((e: any) => e.date)
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] < dates[i - 1]).toBe(true)
    }
  })

  it('first entry matches today\'s roast', async () => {
    const roastRes = await request(app).get('/roast')
    const historyRes = await request(app).get('/roast/history?days=1')
    expect(historyRes.body.history[0].date).toBe(roastRes.body.date)
    expect(historyRes.body.history[0].cheese_of_the_day).toBe(roastRes.body.cheese_of_the_day)
  })

  it('all cheese names are known rated cheeses', async () => {
    const res = await request(app).get('/roast/history?days=21')
    const knownNames = cheeses.map((c: any) => c.name)
    for (const entry of res.body.history) {
      expect(knownNames).toContain(entry.cheese_of_the_day)
    }
  })

  it('is deterministic — same request returns same history', async () => {
    const res1 = await request(app).get('/roast/history?days=5')
    const res2 = await request(app).get('/roast/history?days=5')
    expect(res1.body.history).toEqual(res2.body.history)
  })
})

describe('dateStringDaysAgo', () => {
  it('returns today for 0 days ago', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(dateStringDaysAgo(0)).toBe(today)
  })

  it('returns a YYYY-MM-DD string', () => {
    expect(dateStringDaysAgo(0)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(dateStringDaysAgo(7)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(dateStringDaysAgo(30)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns earlier dates for larger offsets', () => {
    const d0 = dateStringDaysAgo(0)
    const d1 = dateStringDaysAgo(1)
    const d7 = dateStringDaysAgo(7)
    expect(d1 < d0).toBe(true)
    expect(d7 < d1).toBe(true)
  })

  it('is consistent — same offset always returns same date (within a day boundary)', () => {
    expect(dateStringDaysAgo(3)).toBe(dateStringDaysAgo(3))
  })

  it('history entries use dates matching dateStringDaysAgo offsets', async () => {
    const res = await request(app).get('/roast/history?days=3')
    for (let i = 0; i < 3; i++) {
      expect(res.body.history[i].date).toBe(dateStringDaysAgo(i))
    }
  })

  it('each date maps to the correct deterministic cheese', () => {
    for (let i = 0; i < 7; i++) {
      const dateStr = dateStringDaysAgo(i)
      const cheese = pickTodaysCheese(dateStr)
      expect(cheese).toBeDefined()
      expect(typeof cheese.name).toBe('string')
    }
  })
})

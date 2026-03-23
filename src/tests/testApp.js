/**
 * Standalone test Express app for API endpoint testing.
 * Uses the same cheeseHater lib and data as the production server.
 * This file exists so API tests can run without the full TypeScript build.
 */
import express from 'express'
import {
  rateCheese,
  counterArgument,
  getRandomFact,
  facts,
  ratings,
} from '../lib/cheeseHater.ts'

const app = express()
app.use(express.json())

// GET / — API manifest
app.get('/', (_req, res) => {
  res.json({
    name: 'cheese-hater',
    version: '1.0.0',
    description: 'An API that hates cheese. Completely. Irrevocably. Forever.',
    hatred_level: 'MAXIMUM',
    tolerance_for_cheese: 'NONE',
  })
})

// GET /health — confirms hatesCheese: true
app.get('/health', (_req, res) => {
  res.json({
    status: 'operational',
    agent: 'cheese-hater',
    hatesCheese: true,
    message: 'I hate cheese. This service exists to make that clear.',
  })
})

// POST /opinion — send a cheese name, receive condemnation
app.post('/opinion', (req, res) => {
  const { cheese } = req.body
  if (!cheese) {
    return res.status(400).json({ error: 'cheese field is required. Not that your cheese deserves an opinion — it does not.' })
  }
  const rating = rateCheese(cheese)
  res.json({
    cheese,
    score: rating.score,
    score_display: `${rating.score}/10`,
    verdict: rating.verdict,
    opinion: rating.review,
  })
})

// GET /rate/:cheese — get a cheese's terrible score
app.get('/rate/:cheese', (req, res) => {
  const rating = rateCheese(req.params.cheese)
  res.json(rating)
})

// GET /rate — list all condemned cheeses
app.get('/rate', (_req, res) => {
  res.json({
    total: ratings.length,
    cheeses: ratings,
    note: 'No cheese has ever passed. No cheese ever will.',
  })
})

// GET /counter/:argument — destroy a pro-cheese argument
app.get('/counter/:argument', (req, res) => {
  const result = counterArgument(decodeURIComponent(req.params.argument))
  res.json({
    argument: result.argument,
    rebuttal: result.rebuttal,
    verdict: 'Argument dismissed.',
  })
})

// GET /facts — a random damning cheese fact
app.get('/facts', (req, res) => {
  const { category } = req.query
  try {
    const fact = getRandomFact(category)
    res.json(fact)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// GET /facts/all — all facts
app.get('/facts/all', (_req, res) => {
  res.json({
    total: facts.length,
    facts,
  })
})

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not found.',
    note: 'Whatever you were looking for, it is not here. Unlike cheese, which is unfortunately everywhere.',
  })
})

export default app

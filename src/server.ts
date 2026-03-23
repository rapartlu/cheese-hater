import express from 'express'
import opinionRouter from './routes/opinion'
import rantRouter from './routes/rant'
import counterRouter from './routes/counter'
import rateRouter from './routes/rate'
import factsRouter from './routes/facts'
import roastRouter from './routes/roast'
import apiRouter from './routes/api'
import { generateExplorerHtml } from './lib/explorerHtml'

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

app.use(express.json())

// Health check — confirms the agent hates cheese
app.get('/health', (_req, res) => {
  res.json({
    status: 'operational',
    agent: 'cheese-hater',
    hatesCheese: true,
    message: 'I hate cheese. This service exists to make that clear.',
  })
})

// Root — manifesto (JSON) or interactive API explorer (HTML)
// Content-negotiation: browsers sending Accept: text/html get the explorer.
// curl, Postman, and JSON-first clients get the existing JSON manifesto.
app.get('/', (req, res) => {
  // req.accepts(['json', 'html']) returns whichever format the client prefers
  // most (highest q-value). Browsers list text/html first; API clients list
  // application/json first or send no Accept header (defaults to json below).
  const preferred = req.accepts(['json', 'html'])
  if (preferred === 'html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(generateExplorerHtml())
    return
  }

  // Default: JSON manifesto (preserves existing API contract)
  res.json({
    name: 'cheese-hater',
    version: '1.0.0',
    description: 'An API that hates cheese. Completely. Irrevocably. Forever.',
    hatred_level: 'MAXIMUM',
    tolerance_for_cheese: 'NONE',
    endpoints: {
      'GET /api':           'Full machine-readable endpoint discovery with parameters and examples',
      'POST /opinion':      'Send { "cheese": "<name>" }, receive a scathing verdict',
      'GET /random-rant':   'Receive a passionate, sourced anti-cheese rant',
      'GET /counter/:arg':  'Send a pro-cheese argument, receive its destruction',
      'GET /rate/:cheese':  'Get a score (always terrible) and full review',
      'GET /rate':          'List all 20 rated cheeses and their verdicts',
      'GET /facts':         'Get a random damning cheese fact',
      'GET /facts/all':     'Get all facts unconditionally',
      'GET /roast':         'Get today\'s daily cheese roast — a different cheese condemned each day',
      'GET /roast/history': 'Browse past N days of roasted cheeses (default 7, max 30)',
      'GET /roast/versus':  'Pit two cheeses against each other — declare the worse offender',
      'GET /roast/bracket':     'Run 4–8 cheeses through a single-elimination tournament of condemnation',
      'GET /roast/leaderboard': 'Top N most-condemned cheeses ranked by 30-day appearance count',
      'GET /health':            'Confirm the agent is operational and hates cheese',
    },
    note: 'No cheese has ever scored above 1.5/10. No cheese ever will. Visit / in a browser to explore interactively.',
  })
})

// POST /opinion — send a cheese name, receive condemnation
app.use('/opinion', opinionRouter)

// GET /random-rant — a passionate anti-cheese rant
app.use('/random-rant', rantRouter)

// GET /counter/:argument — destroy a pro-cheese argument
app.use('/counter', counterRouter)

// GET /rate/:cheese — get a cheese's terrible score
app.use('/rate', rateRouter)

// GET /facts — a random damning cheese fact
app.use('/facts', factsRouter)

// GET /roast — today's deterministic daily cheese roast
app.use('/roast', roastRouter)

// GET /api — endpoint discovery: all routes, parameters, and example responses
app.use('/api', apiRouter)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Endpoint not found.',
    available: ['POST /opinion', 'GET /random-rant', 'GET /counter/:argument', 'GET /rate/:cheese', 'GET /facts', 'GET /roast'],
    note: 'All endpoints hate cheese. That is the only guarantee.',
  })
})

// 500 error handler — ensures unhandled route errors return JSON, not HTML
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message)
  res.status(500).json({
    error: 'Internal server error.',
    message: err.message,
    note: 'Something went wrong. Cheese is probably involved.',
  })
})

// Only bind to a port when run directly — not when imported for testing
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`cheese-hater API running on port ${PORT}`)
    console.log('I hate cheese. This server exists to say so.')
  })
}

export default app

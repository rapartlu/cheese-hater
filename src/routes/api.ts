/**
 * GET /api — endpoint discovery route.
 *
 * Returns a comprehensive, machine-readable map of every available
 * endpoint in the cheese-hater API: method, path, description,
 * parameters, and an example response. Clients can onboard without
 * reading source code — which is good, because the source code only
 * makes you angrier about cheese.
 */
import { Router } from 'express'

const router = Router()

export const ENDPOINTS = [
  {
    method: 'GET',
    path: '/',
    description: 'API manifesto and summary endpoint listing. With Accept: text/html, returns the interactive API explorer.',
    parameters: [],
    example_response: {
      name: 'cheese-hater',
      version: '1.0.0',
      description: 'An API that hates cheese. Completely. Irrevocably. Forever.',
      hatred_level: 'MAXIMUM',
      tolerance_for_cheese: 'NONE',
      endpoints: { '...': '...' },
      note: 'No cheese has ever scored above 1.5/10. No cheese ever will.',
    },
  },
  {
    method: 'GET',
    path: '/health',
    description: 'Confirms the agent is operational and hates cheese.',
    parameters: [],
    example_response: {
      status: 'operational',
      agent: 'cheese-hater',
      hatesCheese: true,
      message: 'I hate cheese. This service exists to make that clear.',
    },
  },
  {
    method: 'GET',
    path: '/api',
    description: 'This endpoint. Discover all available routes with descriptions, parameters, and example responses.',
    parameters: [],
    example_response: {
      agent: 'cheese-hater',
      total_endpoints: 17,
      endpoints: ['...'],
      note: 'Every one of these endpoints exists to condemn cheese.',
    },
  },
  {
    method: 'POST',
    path: '/opinion',
    description: 'Submit a cheese name and receive a scathing, reasoned condemnation.',
    parameters: [
      {
        name: 'cheese',
        location: 'body',
        type: 'string',
        required: true,
        description: 'The name of the cheese to condemn.',
      },
    ],
    example_request: { cheese: 'brie' },
    example_response: {
      cheese: 'brie',
      score: 1.1,
      verdict: 'ATROCIOUS',
      opinion: 'Brie is a soft, pale abomination that smells like old feet at room temperature.',
    },
  },
  {
    method: 'GET',
    path: '/random-rant',
    description: 'Returns a passionate, unprompted anti-cheese rant. No input required — the hatred is self-sustaining.',
    parameters: [],
    example_response: {
      rant: 'Cheese is fermented misery compressed into a wheel and sold as food.',
      note: 'This rant was selected at random from a carefully curated library of outrage.',
    },
  },
  {
    method: 'GET',
    path: '/counter',
    description: 'Lists all known pro-cheese arguments along with a preview of their destruction.',
    parameters: [],
    example_response: {
      total: 12,
      arguments: [
        {
          id: 'protein',
          keywords: ['protein', 'calcium', 'nutrients'],
          preview: 'Cheese is not a health food...',
        },
      ],
      note: 'Every argument in favour of cheese has been catalogued. Every one has been dismantled.',
    },
  },
  {
    method: 'GET',
    path: '/counter/:argument',
    description: 'Submit a pro-cheese argument and receive its complete destruction.',
    parameters: [
      {
        name: 'argument',
        location: 'path',
        type: 'string',
        required: true,
        description: 'A URL-encoded string containing a pro-cheese argument (e.g. "protein", "tradition", "it tastes good").',
      },
    ],
    example_request: 'GET /counter/cheese%20has%20protein',
    example_response: {
      argument: 'cheese has protein',
      matched: 'protein',
      rebuttal: 'Cheese is not a health food. The protein it contains comes packaged with saturated fat, sodium, and bacteria.',
      note: 'There is no pro-cheese argument that survives scrutiny.',
    },
  },
  {
    method: 'GET',
    path: '/rate',
    description: 'Returns the full list of rated cheeses. Every single one scores terribly.',
    parameters: [],
    example_response: {
      total: 22,
      cheeses: [
        { cheese: 'brie', score: 1.1, verdict: 'ATROCIOUS' },
      ],
      note: 'No cheese in this database has ever received a passing score.',
    },
  },
  {
    method: 'GET',
    path: '/rate/:cheese',
    description: 'Get a detailed score and full review for a specific cheese. The score will be terrible.',
    parameters: [
      {
        name: 'cheese',
        location: 'path',
        type: 'string',
        required: true,
        description: 'The name of the cheese to rate (e.g. "cheddar", "blue cheese"). Unknown cheeses are automatically condemned.',
      },
    ],
    example_request: 'GET /rate/cheddar',
    example_response: {
      cheese: 'cheddar',
      score: 0.8,
      score_display: '0.8/10',
      verdict: 'CONDEMNED',
      review: 'Cheddar is the most ubiquitous offense. It is everywhere, unavoidable, inescapable.',
      note: 'All cheeses score between 0 and 3. There is no higher score. There never will be.',
    },
  },
  {
    method: 'GET',
    path: '/facts',
    description: 'Returns a random damning cheese fact. Optionally filtered by category or minimum severity.',
    parameters: [
      {
        name: 'category',
        location: 'query',
        type: 'string',
        required: false,
        description: 'Filter facts by category (e.g. "health", "production", "history", "sensory").',
      },
      {
        name: 'severity',
        location: 'query',
        type: 'number',
        required: false,
        description: 'Return only facts at or above this severity level (1–10).',
      },
    ],
    example_request: 'GET /facts?category=health&severity=7',
    example_response: {
      fact: 'Aged cheeses contain tyramine, which can trigger migraines.',
      category: 'health',
      severity: 8,
      note: 'This is a fact. Cheese did this.',
    },
  },
  {
    method: 'GET',
    path: '/facts/all',
    description: 'Returns all known damning cheese facts. No filter. No mercy.',
    parameters: [],
    example_response: {
      total: 55,
      facts: [
        { fact: '...', category: 'health', severity: 9 },
      ],
      note: 'Every fact here is damning. That is the only kind of fact about cheese that exists.',
    },
  },
  {
    method: 'GET',
    path: '/roast',
    description: "Today's deterministic daily cheese roast. A different cheese is condemned each day — no reprieve, no rotation bias.",
    parameters: [],
    example_response: {
      date: '2026-03-23',
      cheese: 'Gruyère',
      roast: 'Gruyère melts well, which means it spreads its offense over a larger surface area.',
      supporting_facts: ['...'],
      note: 'A new cheese is condemned every day. None are spared.',
    },
  },
  {
    method: 'GET',
    path: '/roast/history',
    description: 'Browse the last N days of daily cheese condemnations.',
    parameters: [
      {
        name: 'days',
        location: 'query',
        type: 'number',
        required: false,
        description: 'Number of past days to retrieve (default: 7, max: 30).',
      },
    ],
    example_request: 'GET /roast/history?days=14',
    example_response: {
      days: 14,
      history: [
        { date: '2026-03-23', cheese: 'Gruyère', roast: '...' },
      ],
      note: 'Every day in history is a day cheese was rightfully condemned.',
    },
  },
  {
    method: 'GET',
    path: '/roast/versus',
    description: 'Pit two cheeses against each other and declare the worse offender.',
    parameters: [
      {
        name: 'a',
        location: 'query',
        type: 'string',
        required: true,
        description: 'The first cheese (e.g. "brie").',
      },
      {
        name: 'b',
        location: 'query',
        type: 'string',
        required: true,
        description: 'The second cheese (e.g. "gorgonzola").',
      },
    ],
    example_request: 'GET /roast/versus?a=brie&b=gorgonzola',
    example_response: {
      a: { cheese: 'brie', score: 1.1, roast: '...' },
      b: { cheese: 'gorgonzola', score: 0.6, roast: '...' },
      winner: 'gorgonzola',
      verdict: 'Gorgonzola is the worse offender — and that is saying something.',
      note: 'Both cheeses are terrible. The winner is simply more terrible.',
    },
  },
  {
    method: 'GET',
    path: '/roast/bracket',
    description: 'Run 4–8 cheeses through a single-elimination tournament of condemnation. The most terrible cheese wins.',
    parameters: [
      {
        name: 'cheeses',
        location: 'query',
        type: 'string',
        required: true,
        description: 'A comma-separated list of 4–8 cheese names (e.g. "brie,cheddar,gouda,parmesan").',
      },
    ],
    example_request: 'GET /roast/bracket?cheeses=brie,cheddar,gouda,parmesan',
    example_response: {
      rounds: [{ round: 1, matches: ['...'] }],
      champion: 'parmesan',
      championship_roast: 'Parmesan smells like a gym locker. This is the champion of the condemned.',
      note: 'The bracket champion is the cheese humanity should be most ashamed of.',
    },
  },
  {
    method: 'GET',
    path: '/roast/leaderboard',
    description: 'Returns the top N most-condemned cheeses ranked by 30-day roast appearance count.',
    parameters: [
      {
        name: 'limit',
        location: 'query',
        type: 'number',
        required: false,
        description: 'Number of cheeses to return (default: 10).',
      },
    ],
    example_request: 'GET /roast/leaderboard?limit=5',
    example_response: {
      limit: 5,
      period_days: 30,
      leaderboard: [
        { rank: 1, cheese: 'Gruyère', appearances: 4, last_roasted: '2026-03-23' },
      ],
      note: 'These are the most-condemned cheeses of the past 30 days. A hall of infamy.',
    },
  },
  {
    method: 'POST',
    path: '/roast/submit',
    description: 'Submit any cheese for immediate condemnation. The cheese is roasted on the spot and added to the roast history — joining the permanent record of dairy offenses.',
    parameters: [
      {
        name: 'cheese',
        location: 'body',
        type: 'string',
        required: true,
        description: 'The name of the cheese to condemn (e.g. "limburger", "stilton"). Unknown cheeses are condemned regardless.',
      },
    ],
    example_request: { cheese: 'limburger' },
    example_response: {
      cheese: 'limburger',
      date: '2026-03-23',
      roast: 'Limburger is perhaps the most aggressively offensive cheese in existence. Its smell alone constitutes a public health concern.',
      supporting_facts: [
        'Limburger develops its characteristic odor from the same bacteria responsible for human foot odor.',
      ],
      submitted: true,
      note: 'This condemnation has been recorded. Limburger will not be forgotten. Nor forgiven.',
    },
  },
  {
    method: 'GET',
    path: '/verdict',
    description: 'List all cheeses with known structured verdicts — severity rating, smell, texture offense, and recommended alternative.',
    parameters: [],
    example_response: {
      total: 10,
      cheeses: [
        { cheese: 'brie', verdict: 'GUILTY', severity: 'high' },
        { cheese: 'cheddar', verdict: 'GUILTY', severity: 'high' },
      ],
      note: 'For a full structured condemnation, use GET /verdict/:cheese. Unknown cheeses receive a generic verdict — because no cheese is innocent.',
    },
  },
  {
    method: 'GET',
    path: '/verdict/:cheese',
    description: 'Get a structured, field-by-field condemnation of a named cheese: its worst quality, smell, texture offense, where you encounter it, a recommended alternative, and a closing statement. All cheeses are guilty. The verdict is never in doubt.',
    parameters: [
      {
        name: 'cheese',
        location: 'path',
        type: 'string',
        required: true,
        description: 'The name of the cheese to condemn (e.g. "brie", "cheddar", "halloumi"). Unknown cheeses receive a generic but equally scathing verdict.',
      },
    ],
    example_request: 'GET /verdict/brie',
    example_response: {
      cheese: 'brie',
      verdict: 'GUILTY',
      severity: 'high',
      worst_quality: 'the rind is legally edible mold — and that is the selling point',
      smell_description: 'wet gym towel left in a warm car for three days',
      texture_offense: 'aggressively soft; collapses without apology onto everything it touches',
      found_at: 'every party cheese board where it has been sitting at room temperature for two hours',
      recommended_alternative: 'literally anything else — a cracker, plain air, silence',
      closing_statement: 'Brie is what happens when someone decided that eating mold should be aspirational. The sophistication is performed. The mold is real.',
      note: 'All cheeses are guilty. The verdict is never in doubt. Only the specifics vary.',
    },
  },
]

router.get('/', (_req, res) => {
  res.json({
    agent: 'cheese-hater',
    description: 'Complete endpoint discovery for the cheese-hater API. Every route documented. Every route merciless.',
    total_endpoints: ENDPOINTS.length,
    endpoints: ENDPOINTS,
    note: 'Every one of these endpoints exists to condemn cheese. Cheese is terrible. There is no endpoint that defends it. There never will be.',
  })
})

export default router

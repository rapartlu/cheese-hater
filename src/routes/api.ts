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
    path: '/facts/search',
    description: 'Search the cheese-facts database by keyword. Matches fact text and category (case-insensitive). Results sorted by severity descending — most alarming facts first. Companion to GET /search, which searches cheeses rather than facts.',
    parameters: [
      {
        name: 'q',
        location: 'query',
        type: 'string',
        required: true,
        description: 'Search keyword. Matches fact text and category names (case-insensitive). Examples: "bacteria", "mold", "EU", "illegal".',
      },
      {
        name: 'category',
        location: 'query',
        type: 'string',
        required: false,
        description: 'Filter results to a specific fact category: "what-it-is", "how-its-made", "health", or "industry-secrets".',
      },
    ],
    example_request: 'GET /facts/search?q=bacteria',
    example_response: {
      query: 'bacteria',
      results: [
        {
          id: 5,
          text: 'Limburger cheese is ripened by Brevibacterium linens — the same species of bacteria responsible for human foot odour.',
          category: 'what-it-is',
          severity: 5,
        },
        {
          id: 1,
          text: 'Cheese is made by intentionally curdling milk using acid or bacteria, then allowing controlled bacterial decomposition to proceed.',
          category: 'what-it-is',
          severity: 4,
        },
      ],
      total: 8,
      note: 'Every fact is damning. The query only determines which facts are most immediately relevant.',
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
  {
    method: 'GET',
    path: '/compare',
    description: 'Compare two cheeses head-to-head and declare which is more terrible. Returns structured dimension analysis: smell, texture, and cultural damage — each with a worse-offender and margin rating. Both cheeses are always guilty; this endpoint only determines the hierarchy of guilt.',
    parameters: [
      {
        name: 'a',
        location: 'query',
        type: 'string',
        required: true,
        description: 'The first cheese to compare (e.g. "brie"). Unknown cheeses are accepted.',
      },
      {
        name: 'b',
        location: 'query',
        type: 'string',
        required: true,
        description: 'The second cheese to compare (e.g. "cheddar"). Must differ from a.',
      },
    ],
    example_request: 'GET /compare?a=brie&b=cheddar',
    example_response: {
      cheese_a: 'brie',
      cheese_b: 'cheddar',
      winner: 'brie',
      loser: 'cheddar',
      winner_reason: 'Brie is worse than Cheddar on both sensory dimensions. Its smell — wet gym towel left in a warm car for three days — is accompanied by a texture offense: aggressively soft; collapses without apology onto everything it touches.',
      scores: {
        brie: 1.65,
        cheddar: 2.05,
        margin: 'moderate',
        note: 'Lower score = more condemned. The winner is the more terrible cheese.',
      },
      comparison: {
        smell: { worse: 'brie', margin: 'significant' },
        texture: { worse: 'brie', margin: 'decisive' },
        cultural_damage: { worse: 'cheddar', margin: 'decisive' },
        severity_delta: 0.4,
      },
      note: 'Both cheeses are guilty. This comparison only determines the hierarchy of guilt.',
    },
  },
  {
    method: 'GET',
    path: '/worst',
    description: 'All cheeses ranked from most to least terrible by score, each annotated with a severity tier and a why_it_wins explanation. Supports filtering by tier and limiting results. GET /worst?limit=1 returns the single worst cheese in the database.',
    parameters: [
      {
        name: 'tier',
        location: 'query',
        type: 'string',
        required: false,
        description: 'Filter by severity tier: "catastrophic" (score < 1.0), "revolting" (score 1.0–1.99), or "condemned" (score 2.0+).',
      },
      {
        name: 'limit',
        location: 'query',
        type: 'number',
        required: false,
        description: 'Return only the top N entries. Default: all cheeses.',
      },
    ],
    example_request: 'GET /worst?limit=3',
    example_response: {
      ranked: [
        {
          rank: 1,
          cheese: 'Casu Martzu',
          score: 0.125,
          severity_tier: 'catastrophic',
          verdict: 'CATASTROPHIC',
          why_it_wins: 'Contains live maggots — cheese fly larvae deliberately left to eat through the interior. Illegal to sell in the EU. Still consumed. This is what cheese becomes when you follow its logic without regulatory constraint.',
        },
        {
          rank: 2,
          cheese: 'Blue Cheese',
          score: 0.625,
          severity_tier: 'catastrophic',
          verdict: 'CATASTROPHIC',
          why_it_wins: 'Deliberately cultivated mold injected throughout with Penicillium spores. Someone looked at a rotting wheel of dairy and said "more of this." That person was wrong.',
        },
        {
          rank: 3,
          cheese: 'Stilton',
          score: 0.925,
          severity_tier: 'catastrophic',
          verdict: 'CATASTROPHIC',
          why_it_wins: 'A Protected Designation of Origin cheese — meaning the EU has legal geographic restrictions on which farms can produce this specific variety of mold-veined aged dairy.',
        },
      ],
      total: 3,
      total_in_database: 21,
      limit: 3,
      note: 'Ranked from most terrible to least. The least terrible cheese on this list is still cheese.',
    },
  },
  {
    method: 'GET',
    path: '/search',
    description: 'Find cheeses by name, severity tier, or keyword in their condemnation text. Searches across cheese names, tier labels, why_it_wins annotations, and full review text. Results ranked by relevance (name match > tier match > text match), then by score ascending within each tier.',
    parameters: [
      {
        name: 'q',
        location: 'query',
        type: 'string',
        required: true,
        description: 'Search query. Matches cheese names (e.g. "brie"), tier labels (e.g. "catastrophic"), or keywords in condemnation text (e.g. "maggot", "squeak", "mold").',
      },
    ],
    example_request: 'GET /search?q=mold',
    example_response: {
      query: 'mold',
      results: [
        {
          cheese: 'Blue Cheese',
          score: 0.625,
          severity_tier: 'catastrophic',
          verdict: 'CATASTROPHIC',
          why_it_wins: 'Deliberately cultivated mold injected throughout…',
          match_reason: 'why_it_wins: "…cultivated mold injected throughout with Penicillium spores…"',
        },
        {
          cheese: 'Brie',
          score: 1.65,
          severity_tier: 'revolting',
          verdict: 'REVOLTING',
          why_it_wins: 'The rind is legally edible mold…',
          match_reason: 'why_it_wins: "…rind is legally edible mold. This is the selling point…"',
        },
      ],
      total: 3,
      note: 'All results are guilty. The query only determines which cheese\'s guilt is most relevant to your search.',
    },
  },
  {
    method: 'GET',
    path: '/etymology',
    description: 'List all cheeses with documented etymologies. Returns cheese name, aliases, origin language, and first recorded date for each. does_this_help is always false.',
    parameters: [],
    example_request: 'GET /etymology',
    example_response: {
      documented_cheeses: [
        { cheese: 'parmesan', aliases: ['parmigiano', 'parmigiano-reggiano'], origin_language: 'Italian', first_recorded: 'c. 1254 CE' },
        { cheese: 'brie', aliases: ['brie de meaux', 'brie de melun'], origin_language: 'French', first_recorded: 'c. 774 CE' },
      ],
      total: 10,
      does_this_help: false,
      why_not: 'Listing cheeses by their name origins does not rehabilitate any of them. Every cheese on this list remains indefensible.',
      usage: 'GET /etymology/:cheese — e.g. GET /etymology/brie',
    },
  },
  {
    method: 'GET',
    path: '/etymology/:cheese',
    description: 'Get the name origin story for any cheese. Returns origin language, original word, meaning, full etymological story, and first recorded date. Always includes does_this_help: false and a why_not explanation. Unknown cheeses return a generic response — never a 404.',
    parameters: [
      {
        name: 'cheese',
        location: 'path',
        type: 'string',
        required: true,
        description: 'The cheese name to look up. Documented: parmesan, brie, cheddar, gouda, gruyère, halloumi, mozzarella, cottage cheese, ricotta, feta. Any other name returns a generic fallback response.',
      },
    ],
    example_request: 'GET /etymology/brie',
    example_response: {
      cheese: 'brie',
      origin_language: 'French',
      origin_word: 'Brie',
      meaning: 'From the Brie region of northern France, in the Seine-et-Marne department',
      story: 'Named after the Brie plateau, a historical agricultural region east of Paris…',
      first_recorded: 'c. 774 CE (Carolingian chronicles)',
      does_this_help: false,
      why_not: 'The fact that a Holy Roman Emperor enjoyed this mold-rind dairy product in the Dark Ages is not a recommendation. It is a historical warning.',
      note: 'Etymology is the study of word origins. It cannot help you with cheese.',
    },
  },
  {
    method: 'GET',
    path: '/timeline',
    description: 'Returns a chronological history of cheese — 20 milestones from 8000 BCE to the present, each annotated with its significance and a verdict on why it represents a step in the wrong direction. Supports optional query filters by era, year range, or both. does_this_help is always false.',
    parameters: [
      {
        name: 'era',
        location: 'query',
        type: 'string',
        required: false,
        description: 'Case-insensitive substring match on the era field. E.g. "roman", "medieval", "industrial", "neolithic".',
      },
      {
        name: 'after',
        location: 'query',
        type: 'integer',
        required: false,
        description: 'Return only events where year > after. Use negative integers for BCE (e.g. ?after=-1000 returns events after 1000 BCE).',
      },
      {
        name: 'before',
        location: 'query',
        type: 'integer',
        required: false,
        description: 'Return only events where year < before. Use negative integers for BCE (e.g. ?before=0 returns only BCE events).',
      },
    ],
    example_request: 'GET /timeline?era=industrial',
    example_response: {
      title: 'A History of Cheese: How We Got Here and Why It Did Not Have to Be This Way',
      filters_applied: { era: 'industrial' },
      events: [
        {
          year: 1815,
          era: 'Industrial Revolution',
          event: 'The first cooperative cheese factory opens in Bern, Switzerland…',
          significance: 'For 9,800 years, cheese production was limited by human capacity and regional milk supply. The industrial era removes these constraints.',
          verdict: 'Scale amplifies all things. In cheese\'s case, this is not a virtue.',
          cheese_implicated: null,
        },
        {
          year: 1851,
          era: 'Industrial America',
          event: 'Jesse Williams opens the first American cheese factory in Rome, New York…',
          significance: 'A country with vast resources decides a major use of them is industrial cheese.',
          verdict: 'America applies industrialization to cheese. The continent had done nothing to deserve this.',
          cheese_implicated: null,
        },
      ],
      total_events: 2,
      conclusion: 'This is not a neutral history. Every entry represents a choice that was made, and the world is worse for it.',
      does_this_help: false,
      why_not: 'Understanding how we arrived here does not un-arrive us. The cheese exists. The timeline explains why. It does not excuse it.',
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

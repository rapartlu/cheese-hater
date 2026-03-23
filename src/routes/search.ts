/**
 * GET /search?q=<query> — find cheeses by name, severity tier, or keyword.
 *
 * Searches across cheese names, severity tiers, why_it_wins annotations,
 * and full review text. Results are sorted by relevance tier first (name
 * match outranks tier match; tier match outranks text match), then by score
 * ascending (most terrible first) within each relevance tier.
 *
 * Returns 400 if ?q is missing or empty.
 */
import { Router, Request, Response } from 'express'
import { ratings } from '../lib/cheeseHater'
import { WHY_IT_WINS, VERDICT_TO_TIER, defaultWhyItWins } from '../lib/worstAnnotations'

const router = Router()

// ── Relevance levels (higher = more relevant) ─────────────────────────────────
const RELEVANCE_NAME   = 3
const RELEVANCE_TIER   = 2
const RELEVANCE_TEXT   = 1

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Return a short excerpt of `text` around the first occurrence of `query`,
 * padded with surrounding context. Used to build match_reason snippets.
 */
function excerpt(text: string, query: string, contextChars = 60): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text.slice(0, contextChars * 2) + '…'
  const start = Math.max(0, idx - contextChars)
  const end   = Math.min(text.length, idx + query.length + contextChars)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return prefix + text.slice(start, end) + suffix
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.get('/', (req: Request, res: Response) => {
  const rawQ = req.query.q

  if (!rawQ || typeof rawQ !== 'string' || rawQ.trim() === '') {
    res.status(400).json({
      error: 'Query parameter ?q is required and must not be empty.',
      usage: 'GET /search?q=<query>',
      examples: [
        'GET /search?q=mold',
        'GET /search?q=squeak',
        'GET /search?q=catastrophic',
        'GET /search?q=brie',
      ],
      note: 'All cheeses are guilty. The query only determines which guilt is most relevant.',
    })
    return
  }

  const query = rawQ.trim().toLowerCase()

  // Build the search index from ratings + annotations
  const index = ratings.map(r => {
    const tier     = VERDICT_TO_TIER[r.verdict] ?? r.verdict.toLowerCase()
    const whyText  = WHY_IT_WINS[r.name] ?? defaultWhyItWins(r.name, r.score)
    return {
      name:     r.name,
      score:    r.score,
      verdict:  r.verdict,
      tier,
      whyText,
      review:   r.review,
    }
  })

  // Score each cheese against the query
  type Match = {
    cheese: string
    score: number
    severity_tier: string
    verdict: string
    why_it_wins: string
    match_reason: string
    relevance: number
  }

  const matches: Match[] = []

  for (const item of index) {
    const nameLower   = item.name.toLowerCase()
    const tierLower   = item.tier.toLowerCase()
    const whyLower    = item.whyText.toLowerCase()
    const reviewLower = item.review?.toLowerCase() ?? ''

    let relevance  = 0
    let matchField = ''
    let snippet    = ''

    if (nameLower.includes(query)) {
      relevance  = RELEVANCE_NAME
      matchField = 'name'
      snippet    = item.name
    } else if (tierLower === query || tierLower.includes(query)) {
      relevance  = RELEVANCE_TIER
      matchField = 'severity_tier'
      snippet    = item.tier
    } else if (whyLower.includes(query)) {
      relevance  = RELEVANCE_TEXT
      matchField = 'why_it_wins'
      snippet    = excerpt(item.whyText, query)
    } else if (reviewLower.includes(query)) {
      relevance  = RELEVANCE_TEXT
      matchField = 'review'
      snippet    = excerpt(item.review ?? '', query)
    }

    if (relevance > 0) {
      matches.push({
        cheese:        item.name,
        score:         item.score,
        severity_tier: item.tier,
        verdict:       item.verdict,
        why_it_wins:   item.whyText,
        match_reason:  `${matchField}: "${snippet}"`,
        relevance,
      })
    }
  }

  // Sort: relevance desc, then score asc (most terrible first within tier)
  matches.sort((a, b) =>
    b.relevance !== a.relevance
      ? b.relevance - a.relevance
      : a.score - b.score,
  )

  // Strip internal relevance field from output
  const results = matches.map(({ relevance: _r, ...rest }) => rest)

  res.json({
    query: rawQ.trim(),
    results,
    total: results.length,
    note: results.length > 0
      ? 'All results are guilty. The query only determines which cheese\'s guilt is most relevant to your search.'
      : 'No cheeses matched this query. All cheeses remain guilty regardless.',
  })
})

export default router

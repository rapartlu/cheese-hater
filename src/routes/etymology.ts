/**
 * GET /etymology/:cheese — name origin story for any cheese.
 *
 * Every etymology ends with does_this_help: false.
 * Because knowing where the word came from does not make the cheese better.
 * Nothing makes the cheese better.
 */
import { Router, Request, Response } from 'express'
import etymologiesRaw from '../data/cheese-etymologies.json'
import { parsePagination, applyPagination, buildLinks } from '../lib/paginate'

interface Etymology {
  cheese: string
  aliases: string[]
  origin_language: string
  origin_word: string
  meaning: string
  story: string
  first_recorded: string
  does_this_help: boolean
  why_not: string
}

const etymologies = etymologiesRaw as Etymology[]

const router = Router()

// Build a lookup: canonical name + all aliases → etymology entry
const lookup = new Map<string, Etymology>()
for (const entry of etymologies) {
  lookup.set(entry.cheese.toLowerCase(), entry)
  for (const alias of entry.aliases) {
    lookup.set(alias.toLowerCase(), entry)
  }
}

// Generic fallback for undocumented cheeses
function genericEtymology(cheeseName: string): Omit<Etymology, 'aliases'> {
  const name = cheeseName.trim()
  return {
    cheese: name,
    origin_language: 'Unknown',
    origin_word: 'Unknown',
    meaning: `The precise etymology of "${name}" has not been catalogued here. It is almost certainly named after a place, a person, or a production method — all of which are equally irrelevant to the fact that it is cheese.`,
    story: `The origin of the name "${name}" is not documented in our records. What is documented is that it is cheese: a fermented, bacteria-laden, curdled animal milk product. The name could derive from ancient Latin, medieval French, regional dialect, or pure invention. None of these possible origins would make the cheese more palatable. The etymology is, in this case as in all cases, beside the point.`,
    first_recorded: 'Unknown',
    does_this_help: false,
    why_not: `Not knowing the etymology of "${name}" does not help. Knowing it would not help either. The problem is not the name. The problem is the cheese.`,
  }
}

// ── GET /etymology/:cheese ────────────────────────────────────────────────────

router.get('/:cheese', (req: Request, res: Response) => {
  const raw = req.params.cheese.trim()
  const key = raw.toLowerCase()

  const entry = lookup.get(key)

  if (entry) {
    res.json({
      cheese: entry.cheese,
      origin_language: entry.origin_language,
      origin_word: entry.origin_word,
      meaning: entry.meaning,
      story: entry.story,
      first_recorded: entry.first_recorded,
      does_this_help: false,
      why_not: entry.why_not,
      note: 'Etymology is the study of word origins. It cannot help you with cheese.',
    })
    return
  }

  // Unknown cheese — generic fallback, never 404
  const fallback = genericEtymology(raw)
  res.json({
    cheese: fallback.cheese,
    origin_language: fallback.origin_language,
    origin_word: fallback.origin_word,
    meaning: fallback.meaning,
    story: fallback.story,
    first_recorded: fallback.first_recorded,
    does_this_help: false,
    why_not: fallback.why_not,
    note: 'Etymology is the study of word origins. It cannot help you with cheese.',
  })
})

// ── GET /etymology — list all documented cheeses ──────────────────────────────

router.get('/', (req: Request, res: Response) => {
  const paginationResult = parsePagination(req.query as Record<string, unknown>)
  if ('error' in paginationResult) {
    res.status(400).json({ error: paginationResult.error })
    return
  }
  const { params } = paginationResult

  const allEtymologies = etymologies.map(e => ({
    cheese: e.cheese,
    aliases: e.aliases,
    origin_language: e.origin_language,
    first_recorded: e.first_recorded,
  }))

  const { page, total, limit, offset, has_more } = applyPagination(allEtymologies, params)
  const { next, prev } = buildLinks('/etymology', params, total)

  res.json({
    documented_cheeses: page,
    total,
    limit,
    offset,
    has_more,
    next,
    prev,
    does_this_help: false,
    why_not: 'Listing cheeses by their name origins does not rehabilitate any of them. Every cheese on this list remains indefensible.',
    usage: 'GET /etymology/:cheese — e.g. GET /etymology/brie',
    note: 'Unknown cheeses return a generic response. No cheese returns a 404. All cheese returns does_this_help: false.',
  })
})

export default router

/**
 * GET /glossary       — all cheese terminology, each definition an indictment.
 * GET /glossary/:term — full detail for a single term.
 *
 * Every term in the cheese world exists to make fermented, bacteria-laden,
 * mold-adjacent dairy sound sophisticated. This glossary strips the euphemism.
 *
 * Unknown terms return a generic response — never a 404.
 * does_this_help is always false. Knowing the terminology does not
 * rehabilitate the cheese.
 */
import { Router, Request, Response } from 'express'
import glossaryData from '../data/cheese-glossary.json' with { type: 'json' }

const router = Router()

// ── Types ─────────────────────────────────────────────────────────────────────

interface GlossaryTerm {
  term: string
  pronunciation: string
  origin_language: string
  literal_meaning: string
  what_it_actually_means: string
  used_in_a_sentence: string
  verdict: string
  does_this_help: false
  why_not: string
}

interface GlossaryData {
  terms: GlossaryTerm[]
  generic_term: Omit<GlossaryTerm, 'term'>
}

// ── Data ──────────────────────────────────────────────────────────────────────

const { terms, generic_term } = glossaryData as GlossaryData

// Build a lookup map: normalised term key → full entry
const termMap: Record<string, GlossaryTerm> = Object.fromEntries(
  terms.map(t => [t.term.toLowerCase(), t])
)

// Also index common multi-word aliases that users might search
const ALIASES: Record<string, string> = {
  'cave aged': 'cave-aged',
  'bloomy': 'bloomy rind',
  'washed': 'washed rind',
  'pdo': 'pdo',
  'protected designation of origin': 'pdo',
  'tyrosine': 'tyrosine crystals',
  'crystals': 'tyrosine crystals',
  'pasteurization': 'pasteurisation',
  'pasteurize': 'pasteurisation',
}

function findTerm(raw: string): GlossaryTerm | null {
  const key = raw.toLowerCase().trim()

  // Direct match
  if (termMap[key]) return termMap[key]

  // Alias match
  const aliasTarget = ALIASES[key]
  if (aliasTarget && termMap[aliasTarget]) return termMap[aliasTarget]

  // Partial match — term starts with or contains the key
  const partial = Object.values(termMap).find(
    t => t.term.toLowerCase().startsWith(key) || key.startsWith(t.term.toLowerCase())
  )
  if (partial) return partial

  return null
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /glossary — full term list (summary form)
router.get('/', (_req: Request, res: Response) => {
  res.json({
    description: 'The language of cheese, translated honestly. Every term defined, every definition a warning.',
    terms: terms.map(t => ({
      term: t.term,
      pronunciation: t.pronunciation,
      origin_language: t.origin_language,
      literal_meaning: t.literal_meaning,
      verdict: t.verdict,
      endpoint: `/glossary/${encodeURIComponent(t.term)}`,
    })),
    total: terms.length,
    does_this_help: false,
    why_not: 'Knowing the vocabulary of cheese does not improve cheese. It improves your ability to describe why it is bad.',
  })
})

// GET /glossary/:term — full detail for a single term
router.get('/:term', (req: Request, res: Response) => {
  const raw = req.params.term.trim()
  const entry = findTerm(raw)

  if (entry) {
    res.json(entry)
    return
  }

  // Unknown term — generic fallback, never 404
  res.json({
    term: raw,
    ...generic_term,
    why_not: `The term "${raw}" has not been specifically documented here. ${generic_term.why_not}`,
  })
})

export default router

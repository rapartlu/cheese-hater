/**
 * GET /timeline — a chronological history of cheese and why each
 * century made things worse.
 *
 * Supports optional query filters:
 *   ?era=<string>     — case-insensitive substring match on the era field
 *   ?after=<int>      — include only events where year > after
 *   ?before=<int>     — include only events where year < before
 *
 * does_this_help is always false. The history explains how we got here.
 * It does not excuse it.
 */
import { Router, Request, Response } from 'express'
import timelineRaw from '../data/cheese-timeline.json'

interface TimelineEvent {
  year: number
  era: string
  event: string
  significance: string
  verdict: string
  cheese_implicated: string | null
}

const TIMELINE: TimelineEvent[] = (timelineRaw as TimelineEvent[]).sort(
  (a, b) => a.year - b.year,
)

const router = Router()

// ── GET /timeline ─────────────────────────────────────────────────────────────

router.get('/', (req: Request, res: Response) => {
  const { era, after, before } = req.query

  // Parse numeric filters
  const afterYear = after !== undefined ? parseInt(after as string, 10) : null
  const beforeYear = before !== undefined ? parseInt(before as string, 10) : null

  if (after !== undefined && (afterYear === null || isNaN(afterYear))) {
    res.status(400).json({
      error: 'Invalid ?after parameter — must be an integer (use negative numbers for BCE, e.g. ?after=-1000)',
    })
    return
  }

  if (before !== undefined && (beforeYear === null || isNaN(beforeYear))) {
    res.status(400).json({
      error: 'Invalid ?before parameter — must be an integer (use negative numbers for BCE, e.g. ?before=0)',
    })
    return
  }

  let events = TIMELINE

  // Filter by era (case-insensitive substring)
  if (era && typeof era === 'string' && era.trim().length > 0) {
    const eraLower = era.trim().toLowerCase()
    events = events.filter(e => e.era.toLowerCase().includes(eraLower))
  }

  // Filter by year range
  if (afterYear !== null) {
    events = events.filter(e => e.year > afterYear)
  }
  if (beforeYear !== null) {
    events = events.filter(e => e.year < beforeYear)
  }

  const isFiltered = !!(era || after !== undefined || before !== undefined)

  const filtersApplied: Record<string, string | number> = {}
  if (era && typeof era === 'string') filtersApplied.era = era
  if (afterYear !== null) filtersApplied.after = afterYear
  if (beforeYear !== null) filtersApplied.before = beforeYear

  res.json({
    title: 'A History of Cheese: How We Got Here and Why It Did Not Have to Be This Way',
    ...(isFiltered ? { filters_applied: filtersApplied } : {}),
    events,
    total_events: events.length,
    ...(isFiltered && events.length === 0
      ? { note: 'No events match the given filters. The cheese persists regardless.' }
      : {}),
    conclusion:
      'This is not a neutral history. Every entry represents a choice that was made — a moment where humanity could have pivoted — and the world is measurably worse for each one.',
    does_this_help: false,
    why_not:
      'Understanding how we arrived here does not un-arrive us. The cheese exists. The timeline explains the sequence of failures that produced it. It does not excuse a single one of them.',
  })
})

export default router

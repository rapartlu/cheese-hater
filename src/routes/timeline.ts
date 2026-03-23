/**
 * GET /timeline — a chronological history of cheese and why each
 * century made things worse.
 *
 * Supports optional query filters:
 *   ?era=<string>     — case-insensitive substring match on the era field
 *   ?after=<int>      — include only events where year > after
 *   ?before=<int>     — include only events where year < before
 *
 * GET /timeline/:year — returns the single event whose year is closest
 * to the requested year. Equidistant ties go to the earlier event.
 * Invalid (non-integer) year returns 400. does_this_help is always false.
 *
 * does_this_help is always false. The history explains how we got here.
 * It does not excuse it.
 */
import { Router, Request, Response } from 'express'
import timelineRaw from '../data/cheese-timeline.json'
import { parsePagination, applyPagination, buildLinks } from '../lib/paginate'

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

  // Parse pagination params
  const paginationResult = parsePagination(req.query as Record<string, unknown>)
  if ('error' in paginationResult) {
    res.status(400).json({ error: paginationResult.error })
    return
  }
  const { params } = paginationResult

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

  const { page, total, limit, offset, has_more } = applyPagination(events, params)
  const extraParams: Record<string, string> = {}
  if (era && typeof era === 'string') extraParams.era = era
  if (afterYear !== null) extraParams.after = String(afterYear)
  if (beforeYear !== null) extraParams.before = String(beforeYear)
  const { next, prev } = buildLinks('/timeline', params, total, extraParams)

  res.json({
    title: 'A History of Cheese: How We Got Here and Why It Did Not Have to Be This Way',
    ...(isFiltered ? { filters_applied: filtersApplied } : {}),
    events: page,
    total_events: total,
    limit,
    offset,
    has_more,
    next,
    prev,
    ...(isFiltered && total === 0
      ? { note: 'No events match the given filters. The cheese persists regardless.' }
      : {}),
    conclusion:
      'This is not a neutral history. Every entry represents a choice that was made — a moment where humanity could have pivoted — and the world is measurably worse for each one.',
    does_this_help: false,
    why_not:
      'Understanding how we arrived here does not un-arrive us. The cheese exists. The timeline explains the sequence of failures that produced it. It does not excuse a single one of them.',
  })
})

// ── GET /timeline/:year — nearest milestone to a given year ───────────────────

router.get('/:year', (req: Request, res: Response) => {
  const raw = req.params.year
  if (!/^-?\d+$/.test(raw.trim())) {
    res.status(400).json({
      error: 'Invalid year — must be an integer. Use negative integers for BCE (e.g. /timeline/-500).',
    })
    return
  }
  const requestedYear = parseInt(raw, 10)

  // Find nearest event — ties go to the earlier (lower year) event.
  // TIMELINE is already sorted ascending by year, so the first of any
  // equidistant pair is naturally the earlier one.
  let nearest: TimelineEvent = TIMELINE[0]
  let minDistance = Math.abs(TIMELINE[0].year - requestedYear)

  for (const event of TIMELINE) {
    const distance = Math.abs(event.year - requestedYear)
    if (distance < minDistance) {
      minDistance = distance
      nearest = event
    }
    // Equidistant: TIMELINE is sorted ascending, so the current `nearest`
    // is already the earlier event — do not overwrite on tie.
  }

  const absYear = Math.abs(requestedYear)
  const yearLabel = requestedYear < 0 ? `${absYear} BCE` : `${requestedYear} CE`

  res.json({
    requested_year: requestedYear,
    closest_event: nearest,
    distance_years: minDistance,
    does_this_help: false,
    why_not: `Knowing what was happening with cheese in ${yearLabel} does not help. It confirms that cheese-related decisions were being made then too, and that they were wrong.`,
  })
})

export default router

/**
 * GET /severity/:tier — browse all cheeses at a given threat level.
 *
 * Valid tiers (the Cheese Threat Advisory Scale):
 *   catastrophic — score < 1.0. The worst of all possible cheeses.
 *   revolting    — score 1.0–1.99. Bad in every measurable way.
 *   condemned    — score 2.0+. Still cheese. Still guilty.
 *
 * Returns cheeses in the tier ranked ascending by score (worst first).
 * Invalid tier names return 400 with the valid tier list and descriptions.
 *
 * GET /severity — lists all tiers with counts and descriptions.
 */
import { Router, Request, Response } from 'express'
import { ratings } from '../lib/cheeseHater'
import { WHY_IT_WINS, VERDICT_TO_TIER, defaultWhyItWins } from '../lib/worstAnnotations'

const router = Router()

// ── Tier definitions (the Cheese Threat Advisory Scale) ───────────────────────

const TIER_ADVISORY: Record<string, { label: string; score_range: string; description: string; threat_level: string }> = {
  catastrophic: {
    label: 'CATASTROPHIC',
    score_range: '0.0 – 0.99',
    description: 'The apex of dairy failure. These cheeses represent the full deployment of everything wrong with fermented milk. Maggots, banned-from-public-transport odours, deliberately cultivated mold in quantities that exceed all reasonable standards. Encountering one of these cheeses is a threat to the immediate environment.',
    threat_level: 'Immediate. No mitigation available.',
  },
  revolting: {
    label: 'REVOLTING',
    score_range: '1.0 – 1.99',
    description: 'Serious and sustained dairy offenses. These cheeses are not catastrophic only because the catastrophic tier exists. They are mold-ripened, bacteria-colonised, or structured in ways that no food should be structured. They have convinced significant portions of the population that they are acceptable. They are not.',
    threat_level: 'High. Avoidance strongly recommended.',
  },
  condemned: {
    label: 'CONDEMNED',
    score_range: '2.0 and above',
    description: 'The mildest tier of a bad thing is still a bad thing. Condemned cheeses score highest on this scale because they are marginally less awful than the tiers above. They are still fermented animal milk products. They are still cheese. The gap between condemned and revolting is a matter of degree. The verdict is the same.',
    threat_level: 'Moderate. Do not be deceived by comparatively higher scores.',
  },
}

const VALID_TIERS = new Set(Object.keys(TIER_ADVISORY))

// Build the full ranked dataset once
function buildAllRanked() {
  return [...ratings]
    .sort((a, b) => a.score - b.score)
    .map((r, idx) => ({
      rank: idx + 1,
      cheese: r.name,
      score: r.score,
      severity_tier: VERDICT_TO_TIER[r.verdict] ?? r.verdict.toLowerCase(),
      verdict: r.verdict,
      why_it_wins: WHY_IT_WINS[r.name] ?? defaultWhyItWins(r.name, r.score),
    }))
}

// ── GET /severity — list all tiers with counts ────────────────────────────────

router.get('/', (_req: Request, res: Response) => {
  const all = buildAllRanked()

  const tierSummary = Object.entries(TIER_ADVISORY).map(([key, advisory]) => {
    const cheeses = all.filter(e => e.severity_tier === key)
    return {
      tier: key,
      label: advisory.label,
      score_range: advisory.score_range,
      threat_level: advisory.threat_level,
      description: advisory.description,
      count: cheeses.length,
      worst_in_tier: cheeses[0]?.cheese ?? null,
    }
  })

  res.json({
    title: 'The Cheese Threat Advisory Scale',
    description: 'All known cheeses classified by severity. The scale runs from condemned (bad) through revolting (worse) to catastrophic (the worst). Every tier is indefensible. The scale exists only to communicate the degree of indefensibility.',
    tiers: tierSummary,
    total_cheeses_assessed: all.length,
    note: 'Use GET /severity/:tier to see all cheeses at a given threat level. Valid tiers: catastrophic, revolting, condemned.',
  })
})

// ── GET /severity/:tier — cheeses at a given threat level ────────────────────

router.get('/:tier', (req: Request, res: Response) => {
  const raw = req.params.tier.trim().toLowerCase()

  if (!VALID_TIERS.has(raw)) {
    res.status(400).json({
      error: `Unknown severity tier: "${req.params.tier}".`,
      valid_tiers: {
        catastrophic: `${TIER_ADVISORY.catastrophic.score_range} — ${TIER_ADVISORY.catastrophic.threat_level}`,
        revolting:    `${TIER_ADVISORY.revolting.score_range} — ${TIER_ADVISORY.revolting.threat_level}`,
        condemned:    `${TIER_ADVISORY.condemned.score_range} — ${TIER_ADVISORY.condemned.threat_level}`,
      },
      note: 'The Cheese Threat Advisory Scale has three levels. All three are bad. Pick one.',
    })
    return
  }

  const advisory = TIER_ADVISORY[raw]
  const all = buildAllRanked()
  const inTier = all
    .filter(e => e.severity_tier === raw)
    .map((e, idx) => ({ ...e, rank: idx + 1 }))   // re-rank within tier

  res.json({
    tier: raw,
    label: advisory.label,
    score_range: advisory.score_range,
    threat_level: advisory.threat_level,
    description: advisory.description,
    cheeses: inTier,
    total: inTier.length,
    note: `All ${inTier.length} cheeses in this tier have been assessed, found guilty, and ranked accordingly. The ranking is from most to least terrible within the tier.`,
  })
})

export default router

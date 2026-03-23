/**
 * Schema-drift test for GET /api.
 *
 * Walks app.router.stack at runtime (Express 5) to enumerate every route
 * registered in server.ts and asserts that each one appears in the GET /api
 * discovery schema.  If a route is added to server.ts but forgotten in
 * ENDPOINTS, this test fails — making schema drift impossible to merge
 * unnoticed.
 *
 * Deliberately does NOT import ENDPOINTS directly — that would only check
 * internal consistency.  Instead it compares the live Express routing table
 * against the live /api JSON response, catching any drift between what
 * the server actually serves and what the schema claims to serve.
 *
 * ## How mount-path discovery works in Express 5
 *
 * Express 5 replaced `layer.regexp` (Express 4) with `layer.matchers[]`.
 * Each matcher is a compiled path-to-regexp function; calling it with a full
 * URL path returns `{ path: matchedPrefix, params }` or `false`.
 *
 * To find the mount prefix of a sub-router (e.g., "/roast") we probe its
 * layer's `matchers[0]` with every path that the schema already knows about.
 * The first probe that returns a truthy result reveals the prefix.  This
 * works for all currently registered sub-routers; a net-new sub-router with
 * zero schema entries would not be discovered — a deliberate trade-off noted
 * in the "unmapped layers" assertion below.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

// ── Express 5 type shims ─────────────────────────────────────────────────────

type MatchResult = { path: string; params: Record<string, string> }

type ExpressLayer = {
  route?: { path: string; methods: Record<string, boolean> }
  handle?: { stack?: ExpressLayer[] }
  /** true when the layer is mounted at "/" with `end: false` (root middleware) */
  slash: boolean
  /** compiled path-to-regexp functions; one per mount path */
  matchers: Array<((input: string) => MatchResult | false) | null>
  name?: string
}

// ── Route helpers ─────────────────────────────────────────────────────────────

type Route = { method: string; path: string }

/**
 * Probe a sub-router layer's matcher with candidate schema paths.
 * Returns the mount prefix ("/roast", "/api", …) or null if no candidate
 * matches (happens only for sub-routers with no schema entries yet).
 */
function probeMountPrefix(
  layer: ExpressLayer,
  candidatePaths: string[],
): string | null {
  if (layer.slash) return '' // root-mounted middleware

  const matcher = layer.matchers?.[0]
  if (!matcher) return null

  for (const path of candidatePaths) {
    const result = matcher(path)
    if (result && typeof result === 'object' && result.path) {
      return result.path
    }
  }
  return null
}

/**
 * Recursively walk the Express 5 router stack and collect every concrete
 * { method, path } pair.
 *
 * @param stack          the layer array to walk
 * @param schemaPaths    full absolute paths from GET /api, used to probe sub-router mount prefixes
 * @param prefix         mount prefix accumulated during recursion
 * @param unmapped       accumulates layers whose mount prefix could not be determined
 */
function extractRoutes(
  stack: ExpressLayer[],
  schemaPaths: string[],
  prefix = '',
  unmapped: ExpressLayer[] = [],
): Route[] {
  const routes: Route[] = []

  for (const layer of stack) {
    if (layer.route) {
      // Concrete route: extract every HTTP method registered on it
      const methods = Object.keys(layer.route.methods)
        .filter(m => layer.route!.methods[m])
        .map(m => m.toUpperCase())

      const rawPath = prefix + layer.route.path
      // Normalise trailing slash but preserve bare "/"
      const path =
        rawPath.length > 1 && rawPath.endsWith('/')
          ? rawPath.slice(0, -1)
          : rawPath

      for (const method of methods) {
        routes.push({ method, path })
      }
    } else if (layer.handle?.stack) {
      // Sub-router layer: discover mount prefix via probing, then recurse
      const mountPrefix = probeMountPrefix(layer, schemaPaths)
      if (mountPrefix !== null) {
        routes.push(
          ...extractRoutes(
            layer.handle.stack,
            schemaPaths,
            prefix + mountPrefix,
            unmapped,
          ),
        )
      } else {
        unmapped.push(layer)
      }
    }
    // Middleware layers (no route, no handle.stack, slash=true) are ignored
  }

  return routes
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api schema-drift detection', () => {
  it('GET /api returns 200 with an endpoints array', async () => {
    const res = await request(app).get('/api')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.endpoints)).toBe(true)
  })

  it('total_endpoints field matches the actual endpoints array length', async () => {
    const res = await request(app).get('/api')
    expect(res.body.total_endpoints).toBe(res.body.endpoints.length)
  })

  it('every route registered in server.ts appears in the GET /api schema', async () => {
    const res = await request(app).get('/api')
    const schemaRoutes: Route[] = res.body.endpoints.map(
      (e: { method: string; path: string }) => ({
        method: e.method,
        path: e.path,
      }),
    )
    const schemaPaths = schemaRoutes.map(r => r.path)

    // Express 5 exposes routes via app.router, not app._router
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stack: ExpressLayer[] = (app as any).router?.stack ?? []

    const unmapped: ExpressLayer[] = []
    const appRoutes = extractRoutes(stack, schemaPaths, '', unmapped)

    // Every route the server handles must appear in the schema
    const missing: Route[] = appRoutes.filter(
      appRoute =>
        !schemaRoutes.some(
          s => s.method === appRoute.method && s.path === appRoute.path,
        ),
    )

    expect(
      missing,
      `Routes registered in server.ts but missing from GET /api:\n${JSON.stringify(missing, null, 2)}`,
    ).toEqual([])
  })

  it('GET /api lists no phantom routes (every schema entry has a real handler)', async () => {
    const res = await request(app).get('/api')
    const schemaRoutes: Route[] = res.body.endpoints.map(
      (e: { method: string; path: string }) => ({
        method: e.method,
        path: e.path,
      }),
    )
    const schemaPaths = schemaRoutes.map(r => r.path)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stack: ExpressLayer[] = (app as any).router?.stack ?? []
    const appRoutes = extractRoutes(stack, schemaPaths)

    const phantom: Route[] = schemaRoutes.filter(
      schema =>
        !appRoutes.some(
          a => a.method === schema.method && a.path === schema.path,
        ),
    )

    expect(
      phantom,
      `Schema entries in GET /api with no registered handler:\n${JSON.stringify(phantom, null, 2)}`,
    ).toEqual([])
  })

  it('all sub-router mount prefixes can be discovered from the schema (no unmapped routers)', async () => {
    // If this fails, a sub-router was mounted in server.ts but has zero
    // schema entries — the drift test above cannot see its routes.
    const res = await request(app).get('/api')
    const schemaPaths = res.body.endpoints.map(
      (e: { path: string }) => e.path,
    ) as string[]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stack: ExpressLayer[] = (app as any).router?.stack ?? []
    const unmapped: ExpressLayer[] = []
    extractRoutes(stack, schemaPaths, '', unmapped)

    expect(
      unmapped.map(l => l.name),
      'Sub-routers with no schema entries (mount prefix cannot be determined):',
    ).toEqual([])
  })
})

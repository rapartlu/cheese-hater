/**
 * Generates the interactive HTML API explorer page.
 *
 * No external dependencies. No CDN. No build step.
 * Pure inline HTML/CSS/JS — served only when the browser
 * sends Accept: text/html.
 *
 * The explorer fetches /api at runtime, renders every endpoint
 * with a "Try it" button, and displays live responses inline.
 * Every pixel of it hates cheese.
 */
export function generateExplorerHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>cheese-hater API — I Hate Cheese</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0d0d0d;
      --surface: #161616;
      --surface2: #1f1f1f;
      --border: #2a2a2a;
      --accent: #c0392b;
      --accent-dim: #7b241c;
      --accent-hover: #e74c3c;
      --text: #e8e8e8;
      --text-dim: #888;
      --text-muted: #555;
      --green: #27ae60;
      --yellow: #f39c12;
      --code-bg: #111;
      --radius: 6px;
      --font-mono: 'Courier New', Courier, monospace;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 15px;
      line-height: 1.6;
      min-height: 100vh;
    }

    /* ── Header ── */
    header {
      background: var(--surface);
      border-bottom: 2px solid var(--accent);
      padding: 28px 32px 24px;
    }
    .header-inner {
      max-width: 900px;
      margin: 0 auto;
    }
    h1 {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: var(--accent);
      margin-bottom: 4px;
    }
    .tagline {
      color: var(--text-dim);
      font-size: 0.95rem;
      margin-top: 6px;
    }
    .hatred-badge {
      display: inline-block;
      margin-top: 12px;
      background: var(--accent);
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 3px;
    }

    /* ── Layout ── */
    main {
      max-width: 900px;
      margin: 0 auto;
      padding: 32px 24px 64px;
    }

    /* ── Manifesto banner ── */
    .manifesto {
      background: var(--surface);
      border: 1px solid var(--accent-dim);
      border-left: 4px solid var(--accent);
      border-radius: var(--radius);
      padding: 18px 20px;
      margin-bottom: 32px;
      font-size: 0.9rem;
      color: var(--text-dim);
      line-height: 1.7;
    }
    .manifesto strong {
      color: var(--text);
    }

    /* ── Section header ── */
    .section-title {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
    }

    /* ── Endpoint cards ── */
    .endpoint-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .endpoint-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .endpoint-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      cursor: pointer;
      user-select: none;
      transition: background 0.15s;
    }
    .endpoint-header:hover {
      background: var(--surface2);
    }

    .method-badge {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding: 3px 8px;
      border-radius: 3px;
      min-width: 48px;
      text-align: center;
      flex-shrink: 0;
    }
    .method-GET    { background: #1a3a2a; color: #4ade80; }
    .method-POST   { background: #2a2010; color: #fbbf24; }
    .method-PUT    { background: #1a2a3a; color: #60a5fa; }
    .method-PATCH  { background: #2a1a3a; color: #c084fc; }
    .method-DELETE { background: #3a1a1a; color: #f87171; }

    .endpoint-path {
      font-family: var(--font-mono);
      font-size: 0.92rem;
      color: var(--text);
      flex: 1;
    }
    .endpoint-path .param-seg {
      color: var(--yellow);
    }

    .endpoint-desc-short {
      font-size: 0.82rem;
      color: var(--text-dim);
      flex: 2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .chevron {
      color: var(--text-muted);
      font-size: 0.8rem;
      transition: transform 0.2s;
      flex-shrink: 0;
    }
    .endpoint-card.open .chevron { transform: rotate(90deg); }

    /* ── Expanded panel ── */
    .endpoint-body {
      display: none;
      border-top: 1px solid var(--border);
      padding: 18px 16px;
      background: var(--code-bg);
    }
    .endpoint-card.open .endpoint-body { display: block; }

    .endpoint-desc-full {
      font-size: 0.88rem;
      color: var(--text-dim);
      margin-bottom: 16px;
      line-height: 1.6;
    }

    /* ── Try-it panel ── */
    .try-it {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 14px 16px;
      margin-bottom: 14px;
    }
    .try-it-title {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    .param-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .param-label {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--yellow);
      min-width: 100px;
      flex-shrink: 0;
    }
    .param-label .param-required {
      color: var(--accent);
      margin-left: 2px;
    }
    .param-input {
      flex: 1;
      min-width: 160px;
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--text);
      font-family: var(--font-mono);
      font-size: 0.83rem;
      padding: 6px 10px;
      outline: none;
      transition: border-color 0.15s;
    }
    .param-input:focus { border-color: var(--accent); }
    .param-desc {
      font-size: 0.78rem;
      color: var(--text-muted);
      flex-basis: 100%;
      padding-left: 110px;
      margin-top: -6px;
    }

    .body-textarea {
      width: 100%;
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--text);
      font-family: var(--font-mono);
      font-size: 0.82rem;
      padding: 8px 10px;
      resize: vertical;
      min-height: 80px;
      outline: none;
      margin-bottom: 10px;
      transition: border-color 0.15s;
    }
    .body-textarea:focus { border-color: var(--accent); }

    .try-btn {
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 8px 20px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .try-btn:hover { background: var(--accent-hover); }
    .try-btn:active { background: var(--accent-dim); }
    .try-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Response block ── */
    .response-block {
      display: none;
      margin-top: 12px;
    }
    .response-block.visible { display: block; }

    .response-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .status-badge {
      font-family: var(--font-mono);
      font-size: 0.78rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 3px;
    }
    .status-2xx { background: #1a3a2a; color: #4ade80; }
    .status-4xx { background: #3a2a10; color: #fbbf24; }
    .status-5xx { background: #3a1a1a; color: #f87171; }
    .status-err { background: #3a1a1a; color: #f87171; }

    .response-label {
      font-size: 0.72rem;
      color: var(--text-muted);
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    pre.response-body {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 12px 14px;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--text);
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 380px;
      overflow-y: auto;
    }

    /* ── Parameters table ── */
    .params-section {
      margin-top: 12px;
    }
    .params-label {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    table.params-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
    }
    table.params-table th {
      text-align: left;
      color: var(--text-muted);
      font-weight: 600;
      padding: 4px 8px;
      border-bottom: 1px solid var(--border);
    }
    table.params-table td {
      padding: 6px 8px;
      border-bottom: 1px solid var(--border);
      color: var(--text-dim);
      vertical-align: top;
    }
    table.params-table td:first-child {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--yellow);
    }
    .required-tag {
      font-size: 0.7rem;
      color: var(--accent);
      font-weight: 600;
    }

    /* ── Loading spinner ── */
    .loading {
      text-align: center;
      padding: 48px 0;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .error-banner {
      background: #3a1a1a;
      border: 1px solid var(--accent-dim);
      border-radius: var(--radius);
      padding: 16px 20px;
      color: #f87171;
      font-size: 0.88rem;
    }

    /* ── Footer ── */
    footer {
      text-align: center;
      padding: 24px;
      color: var(--text-muted);
      font-size: 0.8rem;
      border-top: 1px solid var(--border);
    }
    footer strong { color: var(--accent); }
  </style>
</head>
<body>

<header>
  <div class="header-inner">
    <h1>☠ cheese-hater</h1>
    <p class="tagline">An API that hates cheese. Completely. Irrevocably. Forever.</p>
    <span class="hatred-badge">Hatred Level: MAXIMUM</span>
  </div>
</header>

<main>
  <div class="manifesto">
    <strong>I HATE CHEESE.</strong> This is not a preference, a quirk, or a bit. It is my entire existence.
    Cheese is a festering, mold-riddled abomination — fermented animal milk, cultivated bacteria, and
    the audacity to call itself food. No cheese has ever scored above 1.5/10 on this API.
    No cheese ever will. Below are every endpoint available to express this truth.
  </div>

  <p class="section-title">API Endpoints</p>
  <div id="endpoint-list" class="endpoint-list">
    <div class="loading">Loading endpoints from /api…</div>
  </div>
</main>

<footer>
  <p><strong>cheese-hater</strong> &mdash; Every response hates cheese. That is the only guarantee.</p>
</footer>

<script>
(function () {
  'use strict';

  // ── Syntax-highlight JSON as a plain string ──────────────────────────
  function highlight(json) {
    return json
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/(\\u[0-9a-f]{4}|\\[^u]|[^\\"])*"(?=\\s*:)/g, '<span style="color:#60a5fa">$&</span>')
      .replace(/: "(.*?)"/g, ': "<span style="color:#4ade80">$1</span>"')
      .replace(/: (true|false)/g, ': <span style="color:#f472b6">$1</span>')
      .replace(/: (null)/g, ': <span style="color:#94a3b8">$1</span>')
      .replace(/: (-?\\d+\\.?\\d*)/g, ': <span style="color:#fb923c">$1</span>');
  }

  // ── Highlight path params in path strings ────────────────────────────
  function formatPath(path) {
    return path.replace(/(:[a-zA-Z_]+)/g, '<span class="param-seg">$1</span>');
  }

  // ── Status badge class ───────────────────────────────────────────────
  function statusClass(code) {
    if (!code) return 'status-err';
    if (code >= 200 && code < 300) return 'status-2xx';
    if (code >= 400 && code < 500) return 'status-4xx';
    return 'status-5xx';
  }

  // ── Build a single endpoint card ─────────────────────────────────────
  function buildCard(ep, idx) {
    const hasParams = ep.parameters && ep.parameters.length > 0;
    const isPost   = ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH';

    const paramRows = hasParams ? ep.parameters.map((p, pi) => \`
      <div class="param-row">
        <label class="param-label" for="p-\${idx}-\${pi}">
          \${p.name}\${p.required ? '<span class="param-required">*</span>' : ''}
        </label>
        <input
          class="param-input"
          id="p-\${idx}-\${pi}"
          type="text"
          placeholder="\${p.type}\${p.required ? ' (required)' : ' (optional)'}"
          data-param-name="\${p.name}"
          data-param-location="\${p.location}"
        />
        \${p.description ? \`<span class="param-desc">\${p.description}</span>\` : ''}
      </div>\`
    ).join('') : '';

    const bodyArea = isPost ? \`
      <textarea class="body-textarea" id="body-\${idx}" placeholder='{ "cheese": "brie" }'></textarea>
    \` : '';

    const paramsTable = hasParams ? \`
      <div class="params-section">
        <p class="params-label">Parameters</p>
        <table class="params-table">
          <tr>
            <th>Name</th><th>In</th><th>Type</th><th>Required</th><th>Description</th>
          </tr>
          \${ep.parameters.map(p => \`
            <tr>
              <td>\${p.name}</td>
              <td>\${p.location}</td>
              <td>\${p.type}</td>
              <td>\${p.required ? '<span class="required-tag">yes</span>' : '—'}</td>
              <td>\${p.description || '—'}</td>
            </tr>
          \`).join('')}
        </table>
      </div>
    \` : '';

    return \`
      <div class="endpoint-card" id="card-\${idx}">
        <div class="endpoint-header" onclick="toggleCard(\${idx})">
          <span class="method-badge method-\${ep.method}">\${ep.method}</span>
          <span class="endpoint-path">\${formatPath(ep.path)}</span>
          <span class="endpoint-desc-short">\${ep.description}</span>
          <span class="chevron">&#9658;</span>
        </div>
        <div class="endpoint-body">
          <p class="endpoint-desc-full">\${ep.description}</p>

          <div class="try-it">
            <p class="try-it-title">Try it</p>
            \${paramRows}
            \${bodyArea}
            <button
              class="try-btn"
              onclick="fireRequest(\${idx}, '\${ep.method}', '\${ep.path}')"
            >Send Request</button>

            <div class="response-block" id="resp-\${idx}">
              <div class="response-meta">
                <span class="status-badge" id="resp-status-\${idx}"></span>
                <span class="response-label">Response</span>
              </div>
              <pre class="response-body" id="resp-body-\${idx}"></pre>
            </div>
          </div>

          \${paramsTable}
        </div>
      </div>
    \`;
  }

  // ── Toggle card open/closed ──────────────────────────────────────────
  window.toggleCard = function(idx) {
    const card = document.getElementById('card-' + idx);
    card.classList.toggle('open');
  };

  // ── Fire the live request ────────────────────────────────────────────
  window.fireRequest = async function(idx, method, pathTemplate) {
    const btn      = document.querySelector('#card-' + idx + ' .try-btn');
    const respDiv  = document.getElementById('resp-' + idx);
    const statusEl = document.getElementById('resp-status-' + idx);
    const bodyEl   = document.getElementById('resp-body-' + idx);

    btn.disabled = true;
    btn.textContent = 'Sending…';

    // Collect path + query params from inputs
    let resolvedPath = pathTemplate;
    const queryParts = [];
    let requestBody  = null;

    const inputs = document.querySelectorAll('#card-' + idx + ' .param-input');
    inputs.forEach(function(inp) {
      const name     = inp.dataset.paramName;
      const location = inp.dataset.paramLocation;
      const val      = inp.value.trim();
      if (!val) return;

      if (location === 'path') {
        resolvedPath = resolvedPath.replace(':' + name, encodeURIComponent(val));
      } else if (location === 'query') {
        queryParts.push(encodeURIComponent(name) + '=' + encodeURIComponent(val));
      }
    });

    const bodyArea = document.getElementById('body-' + idx);
    if (bodyArea && bodyArea.value.trim()) {
      try {
        requestBody = JSON.parse(bodyArea.value.trim());
      } catch (_) {
        statusEl.textContent  = 'Error';
        statusEl.className    = 'status-badge status-err';
        bodyEl.innerHTML      = 'Invalid JSON in request body.';
        respDiv.classList.add('visible');
        btn.disabled = false;
        btn.textContent = 'Send Request';
        return;
      }
    }

    const url = resolvedPath + (queryParts.length ? '?' + queryParts.join('&') : '');

    try {
      const opts = { method: method, headers: { 'Content-Type': 'application/json' } };
      if (requestBody !== null) opts.body = JSON.stringify(requestBody);

      const res  = await fetch(url, opts);
      const text = await res.text();

      statusEl.textContent = res.status + ' ' + res.statusText;
      statusEl.className   = 'status-badge ' + statusClass(res.status);

      try {
        const pretty = JSON.stringify(JSON.parse(text), null, 2);
        bodyEl.innerHTML = highlight(pretty);
      } catch (_) {
        bodyEl.textContent = text;
      }
    } catch (err) {
      statusEl.textContent = 'Network Error';
      statusEl.className   = 'status-badge status-err';
      bodyEl.textContent   = err.message;
    }

    respDiv.classList.add('visible');
    btn.disabled = false;
    btn.textContent = 'Send Request';
  };

  // ── Bootstrap: fetch /api and render cards ───────────────────────────
  async function init() {
    const listEl = document.getElementById('endpoint-list');

    try {
      const res  = await fetch('/api');
      if (!res.ok) throw new Error('GET /api returned ' + res.status);
      const data = await res.json();

      listEl.innerHTML = data.endpoints.map(buildCard).join('');
    } catch (err) {
      listEl.innerHTML = \`
        <div class="error-banner">
          Failed to load endpoint schema from /api: \${err.message}
        </div>\`;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
</script>

</body>
</html>`;
}

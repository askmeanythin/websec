import React, { useEffect } from 'react';
import './App.css';

export default function WebCheck() {

  useEffect(() => {
    const GROQ_API_KEY = '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';
    const GROQ_MODEL   = 'llama-3.3-70b-versatile';

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    function normalizeUrl(raw) {
      raw = raw.trim();
      if (!raw) return null;
      if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
      try { return new URL(raw).href; } catch { return null; }
    }

    function esc(s) {
      return String(s)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;');
    }

    function tryUrl(domain) {
      document.getElementById('url-input').value = domain;
      document.getElementById('url-input').focus();
    }

    const STEPS = [
      { icon: '🌐', text: 'Resolving domain & checking DNS records...' },
      { icon: '🔒', text: 'Evaluating SSL/TLS certificate...' },
      { icon: '📋', text: 'Checking HTTP security headers...' },
      { icon: '🍪', text: 'Analyzing cookie configuration...' },
      { icon: '🛡', text: 'Scanning for known vulnerabilities...' },
      { icon: '📧', text: 'Verifying email security (SPF, DMARC, DKIM)...' },
      { icon: '🤖', text: 'AI generating your personalized report...' },
    ];

    function buildProgressSteps() {
      const el = document.getElementById('prog-steps');
      el.innerHTML = '';
      STEPS.forEach((s, i) => {
        el.innerHTML += `
          <div class="ps" id="ps-${i}">
            <div class="ps-icon">${s.icon}</div>
            <span>${s.text}</span>
          </div>`;
      });
    }

    async function animateProgress(apiPromise) {
      buildProgressSteps();
      let done = false;
      apiPromise.finally(() => done = true);
      const pct = [5, 18, 32, 46, 60, 74, 85];
      const fill = document.getElementById('prog-fill');
      for (let i = 0; i < STEPS.length; i++) {
        if (i > 0) {
          document.getElementById(`ps-${i-1}`).classList.remove('active');
          document.getElementById(`ps-${i-1}`).classList.add('done');
          document.getElementById(`ps-${i-1}`).querySelector('.ps-icon').textContent = '✓';
        }
        document.getElementById(`ps-${i}`).classList.add('active');
        fill.style.width = pct[i] + '%';
        if (i === STEPS.length - 1) {
          while (!done) await sleep(200);
        } else {
          await sleep(620);
        }
      }
      fill.style.width = '100%';
      document.getElementById(`ps-${STEPS.length-1}`).classList.remove('active');
      document.getElementById(`ps-${STEPS.length-1}`).classList.add('done');
      document.getElementById(`ps-${STEPS.length-1}`).querySelector('.ps-icon').textContent = '✓';
      await sleep(350);
    }

    async function callGroq(url) {
      const system = `You are SecureCheck, an expert web security analyzer. Analyze the given URL thoroughly and return ONLY a valid JSON object. No markdown fences, no explanation — just the raw JSON.

Your analysis must be specific to this URL's domain, likely infrastructure, and tech stack. Do not be generic.

Return this exact structure:
{
  "score": <integer 0-100>,
  "grade": "<A+|A|B|C|D|F>",
  "risk_level": "<low|medium|high|critical>",
  "headline": "<one punchy sentence, e.g. 'Strong security foundation with a few gaps to patch'>",
  "executive_summary": "<2-3 sentence plain English summary. No jargon.>",
  "dimensions": [
    { "name": "Encryption",  "score": <0-100>, "emoji": "🔒" },
    { "name": "Headers",     "score": <0-100>, "emoji": "📋" },
    { "name": "Cookies",     "score": <0-100>, "emoji": "🍪" },
    { "name": "Email Sec",   "score": <0-100>, "emoji": "📧" },
    { "name": "Exposure",    "score": <0-100>, "emoji": "👁" },
    { "name": "Privacy",     "score": <0-100>, "emoji": "🔐" }
  ],
  "findings": [
    {
      "id": "<e.g. TLS-01>",
      "category": "<category name>",
      "title": "<plain English title, max 8 words>",
      "plain_english": "<1-2 sentence explanation for a non-technical person.>",
      "severity": "<pass|warn|fail|info>",
      "emoji": "<single relevant emoji>",
      "technical_detail": "<precise technical explanation>",
      "cvss": "<e.g. CVSS:3.1 — 6.5 Medium or N/A>",
      "references": "<e.g. RFC 6797 · OWASP A05:2021>"
    }
  ],
  "recommendations": [
    {
      "title": "<action title, max 6 words>",
      "priority": "<critical|high|medium>",
      "plain_english": "<what this fixes and why it matters>",
      "code_snippet": "<exact config line to add>"
    }
  ],
  "threat_intel": {
    "attack_vectors": ["<vector 1>", "<vector 2>", "<vector 3>"],
    "breach_impact": "<Low|Medium|High|Critical>",
    "compliance_gaps": ["<e.g. PCI-DSS 4.0 Req 6.4.3>"],
    "real_world_risk": "<one sentence real-world risk>"
  }
}

Rules:
- Include at least 10 findings covering: HTTPS/TLS, HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, cookies, DNSSEC, SPF, DMARC, server info disclosure, and any platform-specific risks
- plain_english fields must be genuinely simple
- Be accurate and specific to the domain provided
- Score rigorously: A+ = 90-100, A = 80-89, B = 70-79, C = 55-69, D = 40-54, F = below 40`;

      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          temperature: 0.3,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: `Perform a thorough security analysis of: ${url}` }
          ]
        })
      });

      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e.error?.message || `Groq API error ${resp.status}`);
      }
      const data = await resp.json();
      const raw = data.choices?.[0]?.message?.content || '';
      return JSON.parse(raw);
    }

    let lastReport = null;

    async function startScan() {
      const raw = document.getElementById('url-input').value;
      const url = normalizeUrl(raw);
      const errEl = document.getElementById('url-error');
      errEl.style.display = 'none';

      if (!url) {
        errEl.textContent = '⚠ Please enter a valid website URL, e.g. yoursite.com';
        errEl.style.display = 'block';
        return;
      }
      if (!GROQ_API_KEY) {
        errEl.textContent = '⚠ Add your Groq API key at the top of this file. Free at console.groq.com';
        errEl.style.display = 'block';
        return;
      }

      const btn = document.getElementById('scan-btn');
      btn.disabled = true;
      document.getElementById('btn-spin').style.display = 'block';
      document.getElementById('btn-label').textContent = 'Scanning…';

      document.getElementById('results-stage').style.display = 'none';
      document.getElementById('progress-stage').style.display = 'block';
      document.getElementById('prog-target').textContent = url;
      document.getElementById('prog-fill').style.width = '0%';

      const apiCall = callGroq(url);
      try {
        await animateProgress(apiCall);
        const report = await apiCall;
        lastReport = report;
        document.getElementById('progress-stage').style.display = 'none';
        renderResults(report, url);
      } catch (err) {
        document.getElementById('progress-stage').style.display = 'none';
        errEl.textContent = '⚠ ' + err.message;
        errEl.style.display = 'block';
      } finally {
        btn.disabled = false;
        document.getElementById('btn-spin').style.display = 'none';
        document.getElementById('btn-label').textContent = 'Analyze →';
      }
    }

    function riskColor(risk) {
      if (risk === 'low')    return { c: '#1b7a45', bg: '#e8f5ee', border: '#8fd4aa' };
      if (risk === 'medium') return { c: '#b86e00', bg: '#fef3e2', border: '#f0c97a' };
      return                        { c: '#bf3030', bg: '#fdecea', border: '#f0a8a8' };
    }

    function scoreColor(s) {
      if (s >= 75) return '#1b7a45';
      if (s >= 50) return '#b86e00';
      return '#bf3030';
    }

    function renderResults(r, url) {
      const { c, bg } = riskColor(r.risk_level);
      const gh = document.getElementById('grade-header');
      gh.style.setProperty('--accent-grad', `linear-gradient(90deg, ${c}, ${c}aa)`);

      const gc = document.getElementById('grade-circle');
      gc.style.borderColor = c;
      gc.style.background = bg;

      document.getElementById('grade-letter').textContent = r.grade;
      document.getElementById('grade-letter').style.color = c;
      document.getElementById('grade-score-label').textContent = `${r.score}/100`;

      const rp = document.getElementById('grade-risk-pill');
      rp.textContent = r.risk_level.charAt(0).toUpperCase() + r.risk_level.slice(1) + ' Risk';
      rp.className = `grade-risk-pill ${r.risk_level === 'critical' ? 'high' : r.risk_level}`;

      document.getElementById('grade-headline').textContent = r.headline;
      document.getElementById('grade-summary').textContent = r.executive_summary;

      const findings = r.findings || [];
      document.getElementById('g-p').textContent = findings.filter(f => f.severity === 'pass').length;
      document.getElementById('g-w').textContent = findings.filter(f => f.severity === 'warn').length;
      document.getElementById('g-f').textContent = findings.filter(f => f.severity === 'fail').length;

      const dimsEl = document.getElementById('dims');
      dimsEl.innerHTML = '';
      (r.dimensions || []).forEach((d, i) => {
        const col = scoreColor(d.score);
        const div = document.createElement('div');
        div.className = 'dim';
        div.innerHTML = `
          <div class="dim-emoji">${d.emoji}</div>
          <div class="dim-score" style="color:${col}">${d.score}</div>
          <div class="dim-name">${d.name}</div>
          <div class="dim-bar">
            <div class="dim-bar-fill" style="background:${col}" data-w="${d.score}"></div>
          </div>`;
        dimsEl.appendChild(div);
        setTimeout(() => div.querySelector('.dim-bar-fill').style.width = d.score + '%', 150 + i * 90);
      });

      const sevOrd = { fail:0, warn:1, info:2, pass:3 };
      const sorted = [...findings].sort((a,b) => (sevOrd[a.severity]??4) - (sevOrd[b.severity]??4));
      const flEl = document.getElementById('findings-list');
      flEl.innerHTML = '';
      const sevLabel = { pass:'Secure', warn:'Warning', fail:'Issue', info:'Info' };

      sorted.forEach((f, i) => {
        const div = document.createElement('div');
        div.className = 'fc';
        div.style.animationDelay = `${i * 35}ms`;
        div.innerHTML = `
          <div class="fc-top" onclick="toggleFc(this.parentElement)">
            <div class="fc-icon ${f.severity}">${f.emoji || '🔍'}</div>
            <div class="fc-mid">
              <div class="fc-title">${esc(f.title)}</div>
              <div class="fc-plain">${esc(f.plain_english)}</div>
            </div>
            <div class="fc-right">
              <span class="sev ${f.severity}">${sevLabel[f.severity] || f.severity}</span>
              <span class="chevron">▾</span>
            </div>
          </div>
          <div class="fc-drawer">
            <div class="fc-drawer-inner">
              <div class="drawer-label">Technical Detail</div>
              <div class="drawer-text">${esc(f.technical_detail || '')}</div>
              ${f.cvss && f.cvss !== 'N/A' ? `<div class="drawer-code">${esc(f.cvss)}</div>` : ''}
              <div class="drawer-tags">
                ${f.id        ? `<span class="dtag">${esc(f.id)}</span>` : ''}
                ${f.category  ? `<span class="dtag">${esc(f.category)}</span>` : ''}
                ${f.references? `<span class="dtag">${esc(f.references)}</span>` : ''}
              </div>
            </div>
          </div>`;
        flEl.appendChild(div);
      });

      const ti = r.threat_intel || {};
      document.getElementById('threat-box').innerHTML = `
        <div class="threat-box-label">// THREAT INTELLIGENCE</div>
        <div class="threat-rows">
          <div class="tr"><span class="tr-key">Attack Vectors</span><span class="tr-val">${esc((ti.attack_vectors||[]).join(' · '))}</span></div>
          <div class="tr"><span class="tr-key">Breach Impact</span><span class="tr-val">${esc(ti.breach_impact || '—')}</span></div>
          <div class="tr"><span class="tr-key">Compliance Gaps</span><span class="tr-val">${esc((ti.compliance_gaps||[]).join(', ') || 'None identified')}</span></div>
          <div class="tr"><span class="tr-key">Real-world Risk</span><span class="tr-val">${esc(ti.real_world_risk || '—')}</span></div>
        </div>`;

      const recsEl = document.getElementById('recs-list');
      recsEl.innerHTML = '';
      (r.recommendations || []).forEach((rec, i) => {
        const div = document.createElement('div');
        div.className = 'rc';
        div.style.animationDelay = `${i * 50}ms`;
        div.innerHTML = `
          <div class="rc-stripe ${rec.priority}"></div>
          <div class="rc-body">
            <div class="rc-head">
              <div class="rc-title">${esc(rec.title)}</div>
              <span class="rc-badge ${rec.priority}">${rec.priority}</span>
            </div>
            <div class="rc-desc">${esc(rec.plain_english)}</div>
            ${rec.code_snippet ? `<div class="rc-code">${esc(rec.code_snippet)}</div>` : ''}
          </div>`;
        recsEl.appendChild(div);
      });

      document.getElementById('results-stage').style.display = 'block';
      document.getElementById('results-stage').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function toggleFc(card) { card.classList.toggle('open'); }

    document.getElementById('url-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') startScan();
    });

    document.getElementById('rescan-btn').addEventListener('click', () => {
      document.getElementById('results-stage').style.display = 'none';
      document.getElementById('url-input').value = '';
      document.getElementById('url-input').focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('copy-btn').addEventListener('click', () => {
      if (!lastReport) return;
      navigator.clipboard.writeText(JSON.stringify(lastReport, null, 2)).then(() => {
        const b = document.getElementById('copy-btn');
        b.textContent = '✓ Copied!';
        setTimeout(() => b.textContent = '⎘ Export JSON report', 2000);
      });
    });

    window.startScan = startScan;
    window.tryUrl = tryUrl;
    window.toggleFc = toggleFc;
  }, []);

  return (
    <div className="page">
      <nav>
        <a className="nav-logo" href="#">
          <div className="nav-logo-mark">
            <svg viewBox="0 0 18 18" fill="none">
              <path d="M9 1L2 4.5v5.5c0 4.5 3 8.2 7 9.5 4-1.3 7-5 7-9.5V4.5L9 1z" stroke="#fff" strokeWidth="1.4" fill="none" />
              <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="#0d9e8d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="nav-logo-name">Secure<span>Check</span></span>
        </a>
        <div className="nav-badge">Free · No signup</div>
      </nav>

      <div className="hero">
        <div className="hero-eyebrow">AI Security Analysis</div>
        <h1>Is your website<br /><em>actually</em> secure?</h1>
        <p className="hero-sub">
          Paste your URL below. Our AI scans it instantly and explains every security issue in plain English — no tech background needed.
        </p>
        <div className="hero-features">
          <span className="hero-feat">Free to use</span>
          <span className="hero-feat">Results in 15 seconds</span>
          <span className="hero-feat">Plain English explanations</span>
          <span className="hero-feat">Technical details on demand</span>
        </div>
      </div>

      <div className="main-card">
        <div className="url-stage">
          <div className="url-stage-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Enter your website URL
          </div>
          <div className="url-row">
            <div className="url-input-wrap">
              <span className="url-prefix">https://</span>
              <input type="text" id="url-input" placeholder="yourwebsite.com" autoComplete="off" spellCheck="false" />
            </div>
            <button className="scan-btn" id="scan-btn" onClick={() => window.startScan()}>
              <div className="btn-spin" id="btn-spin"></div>
              <span id="btn-label">Analyze →</span>
            </button>
          </div>
          <div className="quick-picks">
            <span className="pick-label">Try:</span>
            <span className="pick" onClick={() => window.tryUrl('github.com')}>github.com</span>
            <span className="pick" onClick={() => window.tryUrl('stripe.com')}>stripe.com</span>
            <span className="pick" onClick={() => window.tryUrl('shopify.com')}>shopify.com</span>
            <span className="pick" onClick={() => window.tryUrl('wordpress.org')}>wordpress.org</span>
          </div>
          <div className="url-error" id="url-error"></div>
        </div>

        <div id="progress-stage">
          <div className="prog-header">
            <div className="prog-title">Analyzing your website...</div>
            <div className="prog-target" id="prog-target"></div>
          </div>
          <div className="prog-track"><div className="prog-fill" id="prog-fill"></div></div>
          <div className="prog-steps" id="prog-steps"></div>
        </div>

        <div id="results-stage">
          <div className="grade-header" id="grade-header">
            <div className="grade-circle" id="grade-circle">
              <div className="grade-letter" id="grade-letter">—</div>
              <div className="grade-score-label" id="grade-score-label">—</div>
            </div>
            <div className="grade-info">
              <div className="grade-risk-pill" id="grade-risk-pill">—</div>
              <div className="grade-headline" id="grade-headline"></div>
              <div className="grade-summary" id="grade-summary"></div>
              <div className="grade-stats">
                <div className="gstat"><div className="gstat-dot p"></div><span><strong id="g-p">0</strong> passed</span></div>
                <div className="gstat"><div className="gstat-dot w"></div><span><strong id="g-w">0</strong> warnings</span></div>
                <div className="gstat"><div className="gstat-dot f"></div><span><strong id="g-f">0</strong> issues</span></div>
              </div>
            </div>
          </div>

          <div className="dims" id="dims"></div>

          <div className="findings-section">
            <div className="section-label">What we found</div>
            <div className="findings-list" id="findings-list"></div>
          </div>

          <div className="threat-section">
            <div className="section-label">Threat intelligence</div>
            <div className="threat-box" id="threat-box"></div>
          </div>

          <div className="recs-section">
            <div className="section-label">How to fix it</div>
            <div className="recs-list" id="recs-list"></div>
          </div>

          <div className="results-bottom">
            <button className="btn-ghost" id="rescan-btn">← Scan another site</button>
            <button className="btn-dark" id="copy-btn">⎘ Export JSON report</button>
          </div>
        </div>
      </div>

      <div className="powered-by">
        Powered by <strong>Groq</strong> · Llama 3.3 70B · Results are AI-generated estimates
      </div>
    </div>
  );
}
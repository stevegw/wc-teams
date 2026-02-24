
(function () {
  // ---------- Helpers ----------
  const q = (s, el = document) => el.querySelector(s);
  const qa = (s, el = document) => Array.from(el.querySelectorAll(s));
  const stateKey = (id) => `wcai-teams-progress:${id}`;

  const app = {
    flows: [],
    current: null,
    settings: { theme: localStorage.getItem('theme') || 'dark' }
  };

  function setTheme(mode) {
    if (mode === 'light') document.body.classList.add('light');
    else document.body.classList.remove('light');
    localStorage.setItem('theme', mode);
    app.settings.theme = mode;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  // ---------- Load flows ----------
  async function loadFlows() {
    try {
      const res = await fetch('flows/index.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`flows/index.json responded ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('flows/index.json must be an array');

      app.flows = data;

      // Ensure search is cleared on first load so nothing is hidden
      const sf = q('#flowSearch');
      if (sf) sf.value = '';

      renderFlowList();
      route();
    } catch (e) {
      q('#content').innerHTML =
        '<h1>Windchill Teams Assistant</h1>' +
        '<p>⚠️ <strong>Flows failed to load.</strong></p>' +
        '<p>Make sure this site is hosted via GitHub Pages and that ' +
        '<code>/flows/index.json</code> exists at the site root.</p>' +
        '<p><em>Error:</em> ' + escapeHtml(e.message) + '</p>' +
        '<p>Test this URL directly: ' +
        '<a href="flows/index.json" target="_blank" rel="noopener">flows/index.json</a></p>';
    }
  }

  // ---------- Sidebar list ----------
  function renderFlowList(filter = '') {
    const nav = q('#flowList');
    if (!nav) return;
    nav.innerHTML = '';

    const term = (filter || '').trim().toLowerCase();

    app.flows
      .filter(f =>
        !term ||
        (f.title && f.title.toLowerCase().includes(term)) ||
        ((f.tags || []).join(' ').toLowerCase().includes(term))
      )
      .forEach(f => {
        const a = document.createElement('a');
        a.href = '#flow=' + encodeURIComponent(f.id);
        a.className = 'flow-item' + (app.current && app.current.id === f.id ? ' active' : '');
        const tags = (f.tags || []).join(' • ');
        a.innerHTML =
          '<div>' + escapeHtml(f.title || f.id) + '</div>' +
          '<small class="muted">' + escapeHtml(tags) + '</small>';
        nav.appendChild(a);
      });

    // If no items match filter, give a friendly hint
    if (!nav.children.length) {
      const hint = document.createElement('div');
      hint.className = 'flow-item';
      hint.innerHTML = '<small class="muted">No flows found. Clear the search above to see all.</small>';
      nav.appendChild(hint);
    }
  }

  // ---------- Show a flow ----------
  async function showFlow(id) {
    const meta = app.flows.find(f => f.id === id);
    if (!meta) {
      q('#content').innerHTML = '<p>Flow not found: ' + escapeHtml(id) + '</p>';
      return;
    }

    try {
      const res = await fetch('flows/' + id + '.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`flows/${id}.json responded ${res.status}`);
      const data = await res.json();

      app.current = data;
      renderFlow(data);
      const sf = q('#flowSearch');
      renderFlowList(sf ? sf.value : '');
    } catch (e) {
      q('#content').innerHTML =
        '<h1>' + escapeHtml(meta.title || meta.id) + '</h1>' +
        '<p>⚠️ Failed to load flow data: <code>flows/' + escapeHtml(id) + '.json</code></p>' +
        '<p><em>Error:</em> ' + escapeHtml(e.message) + '</p>';
    }
  }

  // ---------- Render flow content ----------
  function renderFlow(flow) {
    const el = q('#content');
    if (!el) return;

    const progress = JSON.parse(localStorage.getItem(stateKey(flow.id)) || '{}');

    const stepsHtml = (flow.steps || []).map((s, idx) => {
      const checked = !!progress[idx];
      const whereHtml = s.where
        ? (
          '<div class="kv">' +
            '<b>Where</b> ' +
            '<span>' + escapeHtml(s.where) + '</span> ' +
            '<button class="btn" data-copy="' + encodeURIComponent(s.where) + '">Copy</button>' +
          '</div>'
        )
        : '';

      let inputsHtml = '';
      if (s.inputs) {
        const inputsText = JSON.stringify(s.inputs, null, 2);
        inputsHtml =
          '<details><summary>Inputs</summary>' +
            '<pre>' + escapeHtml(inputsText) + '</pre>' +
            '<button class="btn" data-copy="' + encodeURIComponent(inputsText) + '">Copy</button>' +
          '</details>';
      }

      const doHtml = s.action ? ('<div class="do"><b>Do:</b> ' + escapeHtml(s.action) + '</div>') : '';
      const verifyHtml = s.verify ? ('<div class="verify"><b>Verify:</b> ' + escapeHtml(s.verify) + '</div>') : '';
      const notesHtml = (s.notes || []).length
        ? ('<ul class="notes">' + s.notes.map(n => '<li>' + escapeHtml(n) + '</li>').join('') + '</ul>')
        : '';

      return (
        '<section class="step" data-idx="' + idx + '">' +
          '<h3>' + (idx + 1) + '. ' + escapeHtml(s.label || 'Step') + '</h3>' +
          whereHtml + doHtml + inputsHtml + verifyHtml + notesHtml +
          '<div class="actions-row">' +
            '<label><input type="checkbox" data-step="' + idx + '" ' + (checked ? 'checked' : '') + '> Mark complete</label>' +
          '</div>' +
        '</section>'
      );
    }).join('');

    const headerHtml =
      '<div class="flow-header">' +
        '<h1>' + escapeHtml(flow.title || flow.id) + '</h1>' +
        '<div class="flow-meta">' +
          '<span class="badge">Steps: ' + ((flow.steps || []).length) + '</span>' +
          (flow.level ? ('<span class="badge">Level: ' + escapeHtml(flow.level) + '</span>') : '') +
        '</div>' +
      '</div>' +
      (flow.summary ? ('<p class="muted">' + escapeHtml(flow.summary) + '</p>') : '');

    const resourcesHtml = (flow.resources || []).length
      ? ('<h3>Resources</h3><ul>' +
          flow.resources.map(r =>
            '<li><a href="' + escapeHtml(String(r.href || '#')) + '" target="_blank" rel="noopener">' +
              escapeHtml(String(r.label || r.href || 'Link')) +
            '</a></li>'
          ).join('') +
        '</ul>')
      : '';

    el.innerHTML = headerHtml + stepsHtml + resourcesHtml;

    // Bind events
    qa('input[type="checkbox"][data-step]', el).forEach(chk => {
      chk.addEventListener('change', (e) => {
        const idx = e.target.getAttribute('data-step');
        const st = JSON.parse(localStorage.getItem(stateKey(flow.id)) || '{}');
        st[idx] = e.target.checked;
        localStorage.setItem(stateKey(flow.id), JSON.stringify(st));
      });
    });

    qa('button[data-copy]', el).forEach(btn => {
      btn.addEventListener('click', () => {
        const val = decodeURIComponent(btn.getAttribute('data-copy') || '');
        navigator.clipboard.writeText(val).then(() => {
          btn.classList.add('success');
          btn.textContent = '✓ Copied';
          setTimeout(() => {
            btn.classList.remove('success');
            btn.textContent = 'Copy';
          }, 1200);
        });
      });
    });
  }

  // ---------- Router ----------
  function route() {
    const m = location.hash.match(/flow=([^&]+)/);
    if (m) showFlow(decodeURIComponent(m[1]));
    else renderHome();
  }

  function renderHome() {
    const el = q('#content');
    if (!el) return;
    el.innerHTML =
      '<h1>Windchill Teams Assistant</h1>' +
      '<p>Click a flow on the left to begin. ' +
      'If nothing appears, ensure <code>/flows/index.json</code> is published and clear the search box.</p>' +
      '<ul>' +
        '<li><a href="#flow=participants.create-user">Open: Create a Windchill User</a></li>' +
        '<li><a href="#flow=licensing.assign-license-group">Open: Assign License via License Group</a></li>' +
        '<li><a href="#flow=teams.context-team-basics">Open: Context Team Basics</a></li>' +
        '<li><a href="#flow=teams.shared-teams">Open: Shared Teams</a></li>' +
        '<li><a href="#flow=teams.team-template-oir">Open: Team Template + OIR</a></li>' +
        '<li><a href="#flow=role-resolution.explainer">Open: Role Resolution Explainer</a></li>' +
      '</ul>';
  }

  // ---------- Export/Reset ----------
  function exportProgress() {
    const all = {};
    (app.flows || []).forEach(f => {
      const st = localStorage.getItem(stateKey(f.id));
      if (st) all[f.id] = JSON.parse(st);
    });
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'wc-teams-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function resetProgress() {
    if (!confirm('Reset all flow progress?')) return;
    (app.flows || []).forEach(f => localStorage.removeItem(stateKey(f.id)));
    route();
  }

  // ---------- Wire up ----------
  window.addEventListener('hashchange', route);

  document.addEventListener('DOMContentLoaded', () => {
    // Hook up controls if present
    const sf = q('#flowSearch');

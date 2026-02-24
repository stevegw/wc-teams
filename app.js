(function(){
  const q = (s, el=document) => el.querySelector(s);
  const qa = (s, el=document) => Array.from(el.querySelectorAll(s));
  const stateKey = (id) => `wcai-teams-progress:${id}`;

  const app = {
    flows: [],
    current: null,
    settings: { theme: localStorage.getItem('theme') || 'dark' }
  };

  function setTheme(mode){
    if(mode === 'light') document.body.classList.add('light');
    else document.body.classList.remove('light');
    localStorage.setItem('theme', mode);
    app.settings.theme = mode;
  }

  async function loadFlows(){
    const res = await fetch('flows/index.json');
    app.flows = await res.json();
    renderFlowList();
    route();
  }

  function renderFlowList(filter=''){
    const nav = q('#flowList');
    nav.innerHTML = '';
    const term = filter.trim().toLowerCase();
    app.flows
      .filter(f => !term || f.title.toLowerCase().includes(term) || (f.tags||[]).join(' ').toLowerCase().includes(term))
      .forEach(f => {
        const a = document.createElement('a');
        a.href = `#flow=${encodeURIComponent(f.id)}`;
        a.className = 'flow-item' + (app.current && app.current.id===f.id ? ' active':'');
        a.innerHTML = `<div>${f.title}</div><small class="muted">${(f.tags||[]).join(' • ')}</small>`;
        nav.appendChild(a);
      });
  }

  async function showFlow(id){
    const meta = app.flows.find(f => f.id===id);
    if(!meta){ q('#content').innerHTML = `<p>Flow not found.</p>`; return; }
    const res = await fetch(`flows/${id}.json`);
    const data = await res.json();
    app.current = data;
    renderFlow(data);
    renderFlowList(q('#flowSearch').value);
  }

  function renderFlow(flow){
    const el = q('#content');
    const progress = JSON.parse(localStorage.getItem(stateKey(flow.id) )|| '{}');

    const stepsHtml = (flow.steps||[]).map((s, idx)=>{
      const checked = !!progress[idx];
      const where = s.where ? `<div class="kv"><b>Where</b> <span>${escapeHtml(s.where)}</span> <button class="btn" data-copy="${encodeURIComponent(s.where)}">Copy</button></div>`: '';
      const inputs = s.inputs ? `<details><summary>Inputs</summary><pre>${escapeHtml(JSON.stringify(s.inputs, null, 2))}</pre><button class="btn" data-copy="${encodeURIComponent(JSON.stringify(s.inputs))}">Copy</button></details>`: '';
      const doTxt = s.action ? `<div class="do"><b>Do:</b> ${escapeHtml(s.action)}</div>`: '';
      const verify = s.verify ? `<div class="verify"><b>Verify:</b> ${escapeHtml(s.verify)}</div>`: '';
      const notes = (s.notes||[]).length ? `<ul class="notes">${s.notes.map(n=>`<li>${escapeHtml(n)}</li>`).join('')}</ul>`: '';
      return `
      <section class="step" data-idx="${idx}">
        <h3>${idx+1}. ${escapeHtml(s.label)}</h3>
        ${where}
        ${doTxt}
        ${inputs}
        ${verify}
        ${notes}
        <div class="actions-row">
          <label><input type="checkbox" data-step="${idx}" ${checked?'checked':''}/> Mark complete</label>
        </div>
      </section>`;
    }).join('');

    const header = `
      <div class="flow-header">
        <h1>${escapeHtml(flow.title)}</h1>
        <div class="flow-meta">
          <span class="badge">Steps: ${(flow.steps||[]).length}</span>
          ${flow.level?`<span class="badge">Level: ${escapeHtml(flow.level)}</span>`:''}
        </div>
      </div>
      ${flow.summary?`<p class="muted">${escapeHtml(flow.summary)}</p>`:''}
    `;

    const resources = (flow.resources||[]).map(r=>`<li><a href="${r.href}" target="_blank" rel="noopener">${escapeHtml(r.label)}</a></li>`).join('');

    el.innerHTML = `${header}${stepsHtml}${resources?`<h3>Resources</h3><ul>${resources}</ul>`:''}`;

    // Events
    qa('input[type="checkbox"][data-step]', el).forEach(chk=>{
      chk.addEventListener('change', (e)=>{
        const idx = e.target.getAttribute('data-step');
        const st = JSON.parse(localStorage.getItem(stateKey(flow.id))||'{}');
        st[idx] = e.target.checked;
        localStorage.setItem(stateKey(flow.id), JSON.stringify(st));
      });
    });

    qa('button[data-copy]', el).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const val = decodeURIComponent(btn.getAttribute('data-copy'));
        navigator.clipboard.writeText(val);
        btn.classList.add('success');
        btn.textContent = '✓ Copied';
        setTimeout(()=>{ btn.classList.remove('success'); btn.textContent='Copy'; }, 1200);
      });
    });
  }

  function route(){
    const m = location.hash.match(/flow=([^&]+)/);
    if(m) showFlow(decodeURIComponent(m[1]));
    else renderHome();
  }

  function renderHome(){
    q('#content').innerHTML = `<h1>Windchill Teams Assistant</h1><p>Select a flow to get started.</p>`;
  }

  function exportProgress(){
    const all = {};
    app.flows.forEach(f=>{
      const st = localStorage.getItem(stateKey(f.id));
      if(st) all[f.id] = JSON.parse(st);
    });
    const blob = new Blob([JSON.stringify(all, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'wcai-teams-progress.json';
    document.body.appendChild(a); a.click(); a.remove();
  }

  function resetProgress(){
    if(!confirm('Reset all flow progress?')) return;
    app.flows.forEach(f=> localStorage.removeItem(stateKey(f.id)) );
    route();
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",""":"&quot;","'":"&#39;"}[c]));
  }

  // Wire up
  window.addEventListener('hashchange', route);
  q('#flowSearch').addEventListener('input', (e)=> renderFlowList(e.target.value));
  q('#exportProgress').addEventListener('click', exportProgress);
  q('#resetProgress').addEventListener('click', resetProgress);
  q('#themeToggle').addEventListener('click', ()=> setTheme(app.settings.theme==='light'?'dark':'light'));
  setTheme(app.settings.theme);
  loadFlows();
})();

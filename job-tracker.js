(() => {
  const STORAGE_KEY = 'careerApplicationTrackerV1';
  const THEME_KEY = 'careerTrackerTheme';
  const STATUSES = ['Lead','Resume promised','Applied','Recruiter screen','Interview','Technical interview','Take-home','Final interview','Offer','Rejected','Withdrawn','On hold'];

  const $ = id => document.getElementById(id);
  const todayISO = () => new Date().toISOString().slice(0,10);
  const plusDays = (iso, days) => {
    const d = iso ? new Date(`${iso}T12:00:00`) : new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0,10);
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const makeId = () => `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

  const seed = () => ({
    schemaVersion: 1,
    records: [
      {
        id: 'twilio-2026-08-12', company: 'Twilio', role: 'Sr Architect - Emerging Technologies (Fraud Detection and Governance)',
        status: 'Applied', priority: 'High', appliedDate: '2026-08-12', followUpDate: '2026-08-19', arrangement: 'Full-time W-2',
        compensation: '$292,080-$365,100 CA outside Bay Area', location: 'Remote - US', c2c: 'W-2 only', fairChance: 'Explicit',
        contact: '', jobUrl: 'https://job-boards.greenhouse.io/twilio/jobs/7960476',
        materials: 'Giorgiy_Shepov_Twilio_Sr_Architect_Resume_2026.docx + tailored cover letter',
        jobDescription: 'Senior Architect for Emerging Technologies Experimentation Team focused on fraud detection and governance. Architecture and rapid prototyping; AI, ML and LLMs; AWS and Azure; technical leadership and mentoring; front-end/back-end systems; SQL and NoSQL; distributed systems; remote-first global team.',
        notes: 'Application submitted successfully. Main strengths: telecom/OSS architecture, distributed leadership, AI/automation. Main risk: dedicated fraud-detection/governance experience is less direct.'
      },
      {
        id: 'bennett-adelson-2026-08-15', company: 'Bennett Adelson', role: 'Senior .NET opportunity (confirm exact title)',
        status: 'Resume promised', priority: 'High', appliedDate: '2026-08-15', followUpDate: '2026-08-16', arrangement: 'Full-time / hybrid - verify',
        compensation: '', location: 'Independence / Cleveland, OH - verify', c2c: 'Not stated', fairChance: 'Unknown / verify',
        contact: 'American recruiter/contact - identify from email/text', jobUrl: '', materials: 'Bennett-specific resume needed', jobDescription: '',
        notes: 'Brief phone conversation. Promised resume. Need identify contact and exact opening before sending.'
      }
    ]
  });

  let state = load();
  let editingId = '';

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : seed();
    } catch { return seed(); }
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  function initSelects() {
    $('status').innerHTML = STATUSES.map(x => `<option>${esc(x)}</option>`).join('');
    $('statusFilter').innerHTML += STATUSES.map(x => `<option>${esc(x)}</option>`).join('');
  }

  function recordFromForm() {
    return {
      id: editingId || makeId(), company: $('company').value.trim(), role: $('role').value.trim(), status: $('status').value,
      priority: $('priority').value, appliedDate: $('appliedDate').value, followUpDate: $('followUpDate').value,
      arrangement: $('arrangement').value.trim(), compensation: $('compensation').value.trim(), location: $('location').value.trim(),
      c2c: $('c2c').value, fairChance: $('fairChance').value, contact: $('contact').value.trim(), jobUrl: $('jobUrl').value.trim(),
      materials: $('materials').value.trim(), jobDescription: $('jobDescription').value.trim(), notes: $('notes').value.trim(),
      updatedAt: new Date().toISOString()
    };
  }

  function setForm(r={}) {
    editingId = r.id || '';
    $('recordId').value = editingId;
    ['company','role','appliedDate','followUpDate','arrangement','compensation','location','contact','jobUrl','materials','jobDescription','notes'].forEach(k => $(k).value = r[k] || '');
    $('status').value = r.status || 'Lead'; $('priority').value = r.priority || 'Medium'; $('c2c').value = r.c2c || 'Not stated'; $('fairChance').value = r.fairChance || 'Not stated';
    $('deleteBtn').classList.toggle('hidden', !editingId);
  }

  function renderSummary(records) {
    const active = records.filter(r => !['Rejected','Withdrawn'].includes(r.status));
    const applied = records.filter(r => r.status === 'Applied').length;
    const interviewing = records.filter(r => /Interview|Take-home|Recruiter screen/i.test(r.status)).length;
    const due = records.filter(r => r.followUpDate && r.followUpDate <= todayISO() && !['Rejected','Withdrawn','Offer'].includes(r.status)).length;
    const fair = records.filter(r => /Explicit|verified/i.test(r.fairChance)).length;
    const values = [['Active',active.length],['Applied',applied],['Interviewing',interviewing],['Follow-ups due',due],['Fair-chance',fair]];
    $('summaryCards').innerHTML = values.map(([label,val]) => `<div class="summary-card"><strong>${val}</strong><span>${label}</span></div>`).join('');
  }

  function renderFollowups(records) {
    const due = records.filter(r => r.followUpDate && r.followUpDate <= plusDays(todayISO(),2) && !['Rejected','Withdrawn','Offer'].includes(r.status)).sort((a,b)=>a.followUpDate.localeCompare(b.followUpDate));
    if (!due.length) { $('followUps').innerHTML = 'No follow-ups due in the next 48 hours.'; return; }
    const overdue = due.filter(r => r.followUpDate < todayISO()).length;
    $('followUps').innerHTML = `<strong>${overdue ? `${overdue} overdue · ` : ''}${due.length} follow-up${due.length===1?'':'s'} due soon:</strong> ${due.slice(0,4).map(r=>`${esc(r.company)} — ${esc(r.followUpDate)}`).join(' · ')}`;
  }

  function render() {
    const q = $('searchInput').value.trim().toLowerCase();
    const sf = $('statusFilter').value;
    let records = [...state.records].filter(r => !sf || r.status === sf).filter(r => !q || [r.company,r.role,r.contact,r.notes,r.location].join(' ').toLowerCase().includes(q));
    records.sort((a,b) => (a.followUpDate || '9999').localeCompare(b.followUpDate || '9999') || (b.appliedDate || '').localeCompare(a.appliedDate || ''));
    renderSummary(state.records); renderFollowups(state.records);
    if (!records.length) { $('applicationList').innerHTML = '<div class="empty-list">No applications match this view.</div>'; return; }
    $('applicationList').innerHTML = records.map(r => {
      const cls = r.followUpDate && r.followUpDate < todayISO() ? 'overdue' : r.followUpDate === todayISO() ? 'today' : '';
      return `<article class="application-card ${cls}" data-id="${esc(r.id)}">
        <div class="application-main"><h3><span class="company">${esc(r.company)}</span> · ${esc(r.role)}</h3>
          <div class="application-meta"><span class="badge">${esc(r.status)}</span><span class="badge ${String(r.priority).toLowerCase()}">${esc(r.priority)}</span>${r.arrangement?`<span class="badge">${esc(r.arrangement)}</span>`:''}${r.c2c?`<span class="badge">${esc(r.c2c)}</span>`:''}${r.fairChance&&r.fairChance!=='Not stated'?`<span class="badge ${/Explicit|verified/.test(r.fairChance)?'explicit':''}">${esc(r.fairChance)}</span>`:''}</div>
          ${r.location?`<div class="small-note">${esc(r.location)}</div>`:''}
        </div>
        <div class="application-side">${r.compensation?`<strong>${esc(r.compensation)}</strong>`:''}${r.followUpDate?`Follow up ${esc(r.followUpDate)}`:(r.appliedDate?`Updated ${esc(r.appliedDate)}`:'')}</div>
      </article>`;
    }).join('');
  }

  function select(id) {
    const r = state.records.find(x => x.id === id); if (!r) return; setForm(r); window.scrollTo({top:0,behavior:'smooth'});
  }

  function prep() {
    const text = $('jobDescription').value.trim();
    if (!text) { alert('Paste the job description first.'); return; }
    localStorage.setItem('interviewPositionRequirements', text);
    localStorage.setItem('careerPrepContext', JSON.stringify({ company:$('company').value.trim(), role:$('role').value.trim(), trackerId:editingId || null, sentAt:new Date().toISOString() }));
    location.href = './index.html?from=job-tracker&analyze=1';
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initSelects();
    const preferred = localStorage.getItem(THEME_KEY) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); applyTheme(preferred);
    $('themeBtn').addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
    $('applicationForm').addEventListener('submit', e => {
      e.preventDefault(); const r = recordFromForm();
      const i = state.records.findIndex(x => x.id === r.id); if (i >= 0) state.records[i] = r; else state.records.unshift(r);
      save(); setForm(r); render();
    });
    $('newBtn').addEventListener('click', () => setForm({status:'Lead',priority:'Medium',appliedDate:todayISO(),followUpDate:plusDays(todayISO(),3)}));
    $('deleteBtn').addEventListener('click', () => { if (!editingId || !confirm('Delete this application record?')) return; state.records = state.records.filter(x=>x.id!==editingId); save(); setForm(); render(); });
    $('prepBtn').addEventListener('click', prep);
    $('applicationList').addEventListener('click', e => { const card=e.target.closest('[data-id]'); if(card) select(card.dataset.id); });
    $('searchInput').addEventListener('input', render); $('statusFilter').addEventListener('change', render);
    $('exportBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`career-tracker-${todayISO()}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500);
    });
    $('importInput').addEventListener('change', async e => {
      const f=e.target.files?.[0]; if(!f) return; try { const data=JSON.parse(await f.text()); if(!Array.isArray(data.records)) throw new Error('Missing records'); state=data; save(); setForm(); render(); } catch(err){ alert(`Could not import: ${err.message}`); } e.target.value='';
    });
    save(); render();
  });
})();

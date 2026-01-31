
const DATA_URL = 'content/data.json';
let SITE_DATA = null;
const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries)=>{for (const e of entries) if (e.isIntersecting) e.target.classList.add('is-visible');},{threshold:.1}) : null;
function initReveal(){ document.querySelectorAll('.reveal').forEach(el=> io && io.observe(el)); }
function initNav(){
  const toggle = document.querySelector('.nav-toggle');
  const list = document.getElementById('nav-list');
  if(!toggle || !list) return;
  const mq = window.matchMedia('(max-width: 820px)');
  const apply = () => { list.style.display = mq.matches ? 'none' : 'flex'; toggle.style.display = mq.matches ? 'inline-block' : 'none'; toggle.setAttribute('aria-expanded','false'); };
  apply(); mq.addEventListener('change', apply);
  toggle.addEventListener('click', ()=>{
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    list.style.display = open ? 'none' : 'flex';
  });
}
function initTabs(){
  document.querySelectorAll('.tabs').forEach(group=>{
    const tabs = group.querySelectorAll('[role=tab]');
    tabs.forEach(tab=> tab.addEventListener('click', ()=>{
      tabs.forEach(t=>{ t.setAttribute('aria-selected','false'); const id=t.getAttribute('aria-controls'); document.getElementById(id).hidden=true; });
      tab.setAttribute('aria-selected','true');
      document.getElementById(tab.getAttribute('aria-controls')).hidden=false;
      localStorage.setItem('btau-tier-tab', tab.textContent.trim());
    }));
    const saved = localStorage.getItem('btau-tier-tab');
    if(saved){ const found = Array.from(tabs).find(t=>t.textContent.trim()===saved); if(found) found.click(); }
  });
}
function initCalc(){
  const form = document.getElementById('calc'); if(!form) return;
  const prog = document.getElementById('prog');
  const out = document.getElementById('result');
  const tierSel = document.getElementById('tier');
  const acts = ()=> Array.from(document.querySelectorAll('.act:checked')).map(a=>Number(a.dataset.local)||0);
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const trav = Math.max(1, Number(document.getElementById('trav').value));
    const nights = Math.max(1, Number(document.getElementById('nights').value));
    const tier = tierSel.value;
    const t = SITE_DATA.tiers[tier] || SITE_DATA.tiers['Mid'];
    const perDayLocal = Number(t.local);
    const perDayUSD = Number(t.usd);
    const perDayINR = Number(t.inr);
    const extras = acts().reduce((s,v)=>s+v,0);
    const perPersonLocal = perDayLocal + extras;
    const totalLocal = perPersonLocal * nights * trav * 1.10;
    const totalUSD = (perDayUSD + extras*0.65) * nights * trav * 1.10;
    const totalINR = (perDayINR + extras*55) * nights * trav * 1.10;
    prog.style.width = Math.min(100, (perPersonLocal / 400)*100) + '%';
    out.innerHTML = `<div class="card"><h2>Estimate (+10% buffer)</h2><ul class="list"><li><strong>AUD</strong> ~ ${totalLocal.toFixed(0)}</li><li><strong>USD</strong> ~ ${totalUSD.toFixed(0)}</li><li><strong>INR</strong> ~ ${totalINR.toFixed(0)}</li></ul></div>`;
  });
  document.getElementById('exportJson')?.addEventListener('click', ()=>{
    const data = {
      travelers: Number(document.getElementById('trav').value),
      nights: Number(document.getElementById('nights').value),
      tier: tierSel.value,
      activities_local_each: acts(),
      last_updated: SITE_DATA.last_updated
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='budget-plan.json'; a.click();
  });
}
function initPicker(){
  const vf = document.getElementById('vibeFilter');
  const pf = document.getElementById('priceFilter');
  const btn = document.getElementById('applyPicker');
  const list = document.getElementById('neighborhoodResults');
  const matrix = document.getElementById('areaMatrix');
  if(!btn || !list) return;
  const render = ()=>{
    list.innerHTML = '';
    const vibe = (vf.value||'').toLowerCase();
    const price = Number(pf.value||Infinity);
    const rows = [];
    SITE_DATA.neighborhoods
      .filter(n => (!vibe || n.vibe.toLowerCase()===vibe))
      .filter(n => n.avg_nightly_local <= (isFinite(price)? price : 99999))
      .forEach(n => {
        const card = document.createElement('article'); card.className='card reveal';
        card.innerHTML = `<h3>${n.name}</h3><p>Vibe: ${n.vibe} · Nightly avg: AUD ${n.avg_nightly_local}</p>`;
        list.appendChild(card); if(window.IntersectionObserver) io.observe(card);
        rows.push(`<tr><td>${n.name}</td><td>${n.pros.join(', ')}</td><td>${n.cons.join(', ')}</td></tr>`);
      });
    if(matrix) matrix.innerHTML = rows.join('');
  };
  btn.addEventListener('click', render); render();
}
function hydrateLists(){
  const airportRoot = document.getElementById('airportTable');
  if(airportRoot){
    const rows = (SITE_DATA.transport?.from_airport||[]).map(a=>`<tr><td>${a.city}</td><td>${a.mode}</td><td>${a.time_min} min</td><td>AUD ${a.cost_local}</td><td>${a.notes}</td></tr>`).join('');
    airportRoot.innerHTML = `<table class="striped"><thead><tr><th>City</th><th>Mode</th><th>Time</th><th>Cost</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  const attRoot = document.getElementById('attractionList');
  if(attRoot){
    attRoot.innerHTML = (SITE_DATA.attractions||[]).map(a=>`<article class="card"><h3>${a.name}</h3><p>Typical: AUD ${a.price_local} · best: ${a.best_time}</p><p class="small">${a.notes}</p></article>`).join('');
  }
  const foodRoot = document.getElementById('foodList');
  if(foodRoot){
    foodRoot.innerHTML = (SITE_DATA.food||[]).map(f=>`<li class="card"><strong>${f.dish}</strong><br><span class="small">${f.where} — ~AUD ${f.cost_local} · tip: ${f.hygiene_tip}</span></li>`).join('');
  }
  const it48 = document.getElementById('it48');
  if(it48){
    it48.innerHTML = (SITE_DATA.itineraries?.['48h']||[]).map(i=>`<li><strong>${i.time}</strong> — ${i.place} · ~AUD ${i.cost_local} <span class="small">${i.note||''}</span></li>`).join('');
  }
  const faqRoot = document.getElementById('faqList');
  if(faqRoot){
    faqRoot.innerHTML = (SITE_DATA.faq||[]).slice(0,20).map((f,idx)=>`<div class="item"><h3><button aria-expanded="false" aria-controls="faq${idx}" id="q${idx}">${f.q}</button></h3><div id="faq${idx}" role="region" aria-labelledby="q${idx}" class="panel" hidden>${f.a}</div></div>`).join('');
    faqRoot.addEventListener('click', (e)=>{
      if(e.target.tagName==='BUTTON'){ const btn=e.target; const id=btn.getAttribute('aria-controls'); const p=document.getElementById(id); const open=btn.getAttribute('aria-expanded')==='true'; btn.setAttribute('aria-expanded', String(!open)); p.hidden=open; }
    });
  }
}
window.addEventListener('DOMContentLoaded', async ()=>{
  initReveal(); initNav(); initTabs();
  try { const res = await fetch(DATA_URL); SITE_DATA = await res.json(); } catch(e) { console.warn('DATA load failed', e); }
  if(!SITE_DATA) return;
  document.querySelectorAll('[data-bind="last_updated"]').forEach(el=> el.textContent = SITE_DATA.last_updated);
  const tiers = SITE_DATA.tiers || {};
  const map = {'Shoestring':'Shoestring','Budget':'Budget','Mid':'Mid','Comfort':'Comfort'};
  for (const k in map){
    const key = map[k];
    (document.querySelector('[data-bind="tier.'+key+'.inr"]')||{}).textContent = (tiers[key]?.inr||'').toLocaleString('en-IN');
    (document.querySelector('[data-bind="tier.'+key+'.usd"]')||{}).textContent = (tiers[key]?.usd||'').toLocaleString('en-US');
    (document.querySelector('[data-bind="tier.'+key+'.local"]')||{}).textContent = (tiers[key]?.local||'').toLocaleString('en-AU');
  }
  hydrateLists(); initPicker(); initCalc();
});

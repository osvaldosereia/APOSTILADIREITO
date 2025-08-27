/**
 * direito.love — Simulador de Chat (MVP corrigido)
 * - BK estática em kb/... (prompts + snippets)
 * - Slot-filling: substitui somente {{TEMA}}
 * - Fluxo: intro → q1 → a1 → q2 → building → result
 * - Layout inteligente com Virtual Keyboard API / visualViewport
 */

const State = {
  step: 'intro',
  choice: null,
  theme: '',
  prompt: '',
  history: []
};

const chatEl = document.getElementById('chat');
const composerEl = document.getElementById('composer');

// BK cache simples
const BK = {
  meta: null,
  prompts: {},
  snippets: {}
};

const wait = (ms) => new Promise(res => setTimeout(res, ms));
function scrollToBottomSmart(force=false){
  const atBottom = (chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight) < 80;
  if (force || atBottom) chatEl.scrollTop = chatEl.scrollHeight;
}

function typingNode(){
  const d = document.createElement('span');
  d.className = 'typing';
  d.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
  return d;
}

function addMsg({text, role='sys', html=false}){
  const b = document.createElement('div');
  b.className = `chat__msg chat__msg--${role === 'user' ? 'user' : 'sys'}`;
  if(html){ b.innerHTML = text; } else { b.textContent = text; }
  chatEl.appendChild(b);
  scrollToBottomSmart(true);
  return b;
}

async function typeAndAppend(text){
  const container = document.createElement('div');
  container.className = 'chat__msg chat__msg--sys';
  const buf = document.createElement('span');
  container.appendChild(buf);
  chatEl.appendChild(container);
  scrollToBottomSmart(true);
  for (const ch of text){
    buf.textContent += ch;
    await wait(12 + Math.random()*12);
  }
}

// ================== BK ===================
async function loadMeta(){
  if(BK.meta) return BK.meta;
  const res = await fetch('kb/meta.json', {cache:'no-store'});
  if(!res.ok) throw new Error('BK meta não encontrada');
  BK.meta = await res.json();
  return BK.meta;
}

async function loadPromptFile(key){
  if(BK.prompts[key]) return BK.prompts[key];
  const meta = await loadMeta();
  const ver = meta?.prompts?.[key] || Date.now();
  const res = await fetch(`kb/prompts/${key}.json?v=${encodeURIComponent(ver)}`, {cache:'no-store'});
  if(!res.ok) throw new Error(`BK prompt ${key} não encontrado`);
  const json = await res.json();
  BK.prompts[key] = json;
  return json;
}

async function loadSnippets(domain='civil'){
  if(BK.snippets[domain]) return BK.snippets[domain];
  const meta = await loadMeta();
  const ver = meta?.snippets?.[domain] || Date.now();
  const res = await fetch(`kb/snippets/${domain}.json?v=${encodeURIComponent(ver)}`, {cache:'no-store'});
  if(!res.ok) throw new Error(`BK snippets ${domain} não encontrado`);
  const json = await res.json();
  BK.snippets[domain] = json;
  return json;
}

async function loadFrases(){
  try{
    const res = await fetch('frases.txt', {cache:'no-store'});
    if(!res.ok) return [];
    const txt = await res.text();
    return txt.split('\n').map(l=>l.trim()).filter(Boolean);
  }catch{ return []; }
}

function chooseVariant(file){
  const {variants=[], selection='first'} = file || {};
  if(!variants.length) return null;
  if(selection === 'random') return variants[Math.floor(Math.random()*variants.length)];
  if(selection === 'rotate'){
    const k = `dl_rotate_${file.objective}`;
    const idx = Number(localStorage.getItem(k) || '0');
    const chosen = variants[idx % variants.length];
    localStorage.setItem(k, String((idx+1)%variants.length));
    return chosen;
  }
  return variants[0];
}

function sanitizeTheme(s){ return (s||'').trim().slice(0,300); }
function fillTemplate(template, theme){ return template.replaceAll('{{TEMA}}', theme); }

// ================== Composer ===================
function renderQ1(){
  composerEl.innerHTML = `
    <div class="composer__inner">
      <div class="btn-grid">
        <button class="btn btn--primary" data-choice="aprender">Agora eu Aprendo</button>
        <button class="btn btn--primary" data-choice="treinar">Vamos Treinar</button>
        <button class="btn btn--primary" data-choice="raiox">Raio-X do Tema</button>
      </div>
    </div>
  `;
  composerEl.querySelectorAll('button[data-choice]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      State.choice = btn.dataset.choice;
      await onChoice();
    });
  });
}

function renderQ2(){
  composerEl.innerHTML = `
    <div class="composer__inner">
      <label class="small" for="theme">Escreva o tema em até 300 caracteres.</label>
      <div class="row">
        <textarea id="theme" class="textarea" rows="1" maxlength="300" placeholder="Ex.: Responsabilidade civil do fornecedor por vício do produto"></textarea>
        <button id="send" class="btn btn--primary" disabled>Enviar</button>
      </div>
      <div class="counter" id="counter">0/300</div>
    </div>
  `;
  const ta = document.getElementById('theme');
  const send = document.getElementById('send');
  const counter = document.getElementById('counter');

  const autoResize = () => { ta.style.height = 'auto'; ta.style.height = Math.min(120, ta.scrollHeight) + 'px'; };
  ta.addEventListener('input', ()=>{
    counter.textContent = `${ta.value.length}/300`;
    send.disabled = sanitizeTheme(ta.value).length === 0;
    autoResize();
  });
  autoResize();

  send.addEventListener('click', async ()=>{
    const theme = sanitizeTheme(ta.value);
    if(!theme) return;
    State.theme = theme;
    addMsg({text: theme, role:'user'});
    renderBuilding();
    await buildPrompt();
  });
}

function renderBuilding(){
  composerEl.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'chat__msg chat__msg--sys';
  wrap.textContent = 'Criando seu prompt... ';
  wrap.appendChild(typingNode());
  chatEl.appendChild(wrap);
  scrollToBottomSmart(true);
}

function renderResult(){
  composerEl.innerHTML = `
    <div class="composer__inner">
      <div class="row">
        <button id="copyBtn" class="btn btn--success">Copiar</button>
        <button id="restartBtn" class="btn btn--ghost">Reiniciar</button>
      </div>
      <p class="small m0 mt8">Depois de copiar, cole no GPT, Gemini ou Perplexity.</p>
    </div>
  `;
  document.getElementById('copyBtn').addEventListener('click', copyPrompt);
  document.getElementById('restartBtn').addEventListener('click', restart);
}

async function copyPrompt(){
  try{
    await navigator.clipboard.writeText(State.prompt);
    addMsg({text:'Copiado! Agora cole no GPT/Gemini/Perplexity.', role:'sys'});
  }catch{
    const ta = document.createElement('textarea');
    ta.value = State.prompt; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); addMsg({text:'Copiado! Agora cole no GPT/Gemini/Perplexity.', role:'sys'}); }
    catch{ addMsg({text:'Não consegui copiar. Selecione manualmente.', role:'sys'}); }
    document.body.removeChild(ta);
  }
}

function restart(){
  State.step = 'intro'; State.choice = null; State.theme = ''; State.prompt = ''; State.history = [];
  chatEl.innerHTML = '';
  boot();
}

// ================== Fluxo ===================
async function boot(){
  const frases = await loadFrases();
  const saud = frases.length ? frases[Math.floor(Math.random()*frases.length)] : 'Olá! Vamos destravar seu estudo hoje?';
  await wait(700 + Math.random()*400);
  await typeAndAppend(saud);

  await wait(500 + Math.random()*400);
  await typeAndAppend('Qual o objetivo do prompt que você quer que eu crie?');
  renderQ1();
  State.step = 'q1';
}

async function onChoice(){
  await wait(500 + Math.random()*400);
  await typeAndAppend(`Beleza. Você escolheu: ${labelChoice(State.choice)}.`);

  try{
    const s = await loadSnippets('civil');
    const items = s.items || [];
    if(items.length){
      const it = items[Math.floor(Math.random()*items.length)];
      const html = `<strong>${it.title}</strong><br>${it.quote}<br><span class="chat__meta"><a href="${it.source}" target="_blank" rel="noopener">Ver PDF</a></span>`;
      addMsg({text: html, role:'sys', html:true});
    }
  }catch{}

  await wait(500);
  await typeAndAppend('Escreva o tema em até 300 caracteres.');
  renderQ2();
  State.step = 'q2';
}

function labelChoice(c){
  return c === 'aprender' ? 'Agora eu Aprendo' : c === 'treinar' ? 'Vamos Treinar' : 'Raio-X do Tema';
}

async function buildPrompt(){
  State.step = 'building';
  try{
    const file = await loadPromptFile(State.choice);
    const variant = chooseVariant(file);
    if(!variant || !variant.template.includes('{{TEMA}}')) throw new Error('Molde inválido');
    await wait(900 + Math.random()*500);
    const finalPrompt = fillTemplate(variant.template, State.theme);
    State.prompt = finalPrompt;

    addMsg({text: `Pronto! Aqui está seu prompt ${labelChoice(State.choice)}:`});
    addMsg({text: finalPrompt, role:'sys', html:false}).classList.add('prompt-block');
    renderResult();
    State.step = 'result';
  }catch(e){
    console.error(e);
    addMsg({text:'BK indisponível. Atualize ou revise os arquivos em kb/.'});
    renderResult();
  }
}

// ================== PWA ===================
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}

boot();

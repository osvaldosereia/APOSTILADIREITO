/**
 * direito.love — Simulador de Chat (MVP corrigido)
 * - BK em arquivos TXT (prompts-molde)
 * - Slot-filling: substitui somente {{TEMA}}
 * - Fluxo: recepção → escolha → tema → pensando → pronto (botão copiar)
 */

const State = {
  step: 'intro',
  choice: null,
  theme: '',
  prompt: ''
};

const chatEl = document.getElementById('chat');
const composerEl = document.getElementById('composer');

const wait = (ms) => new Promise(res => setTimeout(res, ms));
function scrollToBottom(){ chatEl.scrollTop = chatEl.scrollHeight; }

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
  scrollToBottom();
  return b;
}

async function typeAndAppend(text){
  const container = document.createElement('div');
  container.className = 'chat__msg chat__msg--sys';
  const buf = document.createElement('span');
  container.appendChild(buf);
  chatEl.appendChild(container);
  scrollToBottom();
  for (const ch of text){
    buf.textContent += ch;
    await wait(12 + Math.random()*12);
  }
  scrollToBottom();
}

// ======= BK =======
async function loadPromptTxt(file){
  const res = await fetch(`kb/${file}.txt`, {cache:'no-store'});
  if(!res.ok) throw new Error(`Prompt ${file} não encontrado`);
  return await res.text();
}

function sanitizeTheme(s){ return (s||'').trim().slice(0,300); }
function fillTemplate(template, theme){ return template.replaceAll('{{TEMA}}', theme); }

// ======= Composer =======
function renderQ1(){
  const wrap = document.createElement('div');
  wrap.className = 'chat__msg chat__msg--sys';
  wrap.innerHTML = `
    <p class="m0">Me diga, como posso te ajudar hoje?</p>
    <div class="btn-grid mt8">
      <button class="btn btn--primary" data-choice="aprender">Agora eu Aprendo</button>
      <button class="btn btn--primary" data-choice="treinar">Vamos Treinar</button>
      <button class="btn btn--primary" data-choice="raiox">Raio-X do Tema</button>
    </div>
  `;
  chatEl.appendChild(wrap);
  scrollToBottom();

  wrap.querySelectorAll('button[data-choice]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      State.choice = btn.dataset.choice;
      await onChoice();
    });
  });
}

function renderQ2(){
  composerEl.innerHTML = `
    <div class="composer__inner">
      <label class="small" for="theme">Show! Agora escreve rapidinho qual é o tema que você quer explorar (até 300 caracteres).</label>
      <div class="row">
        <textarea id="theme" class="textarea" rows="1" maxlength="300"></textarea>
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
    composerEl.innerHTML = '';
    await buildPrompt();
  });
}

function renderResult(){
  composerEl.innerHTML = `
    <div class="composer__inner">
      <div class="row">
        <button id="copyBtn" class="btn btn--success">Copiar Prompt</button>
        <button id="restartBtn" class="btn btn--ghost">Reiniciar</button>
      </div>
    </div>
  `;
  document.getElementById('copyBtn').addEventListener('click', copyPrompt);
  document.getElementById('restartBtn').addEventListener('click', restart);
}

async function copyPrompt(){
  try{
    await navigator.clipboard.writeText(State.prompt);
    addMsg({text:'Copiado! Agora cole no GPT/Gemini/Perplexity 🚀', role:'sys'});
  }catch{
    addMsg({text:'Não consegui copiar automaticamente. Copie manualmente.', role:'sys'});
  }
}

function restart(){
  State.step = 'intro'; State.choice = null; State.theme = ''; State.prompt = '';
  chatEl.innerHTML = ''; composerEl.innerHTML = '';
  boot();
}

// ======= Fluxo =======
async function boot(){
  await typeAndAppend('Olá, é muito bom ter você por aqui! 🙌');
  await wait(500);
  renderQ1();
  State.step = 'q1';
}

async function onChoice(){
  await wait(600);
  await typeAndAppend(`Boa escolha 😉`);
  await wait(600);
  renderQ2();
  State.step = 'q2';
}

async function buildPrompt(){
  await wait(800);
  await typeAndAppend('Hmm... deixa eu pensar aqui 🤔');
  await wait(1200);

  // Gif animado divertido
  const gif = document.createElement('div');
  gif.className = 'chat__msg chat__msg--sys';
  gif.innerHTML = `<img src="icons/thinking.gif" alt="Pensando..." style="max-width:120px;border-radius:12px">`;
  chatEl.appendChild(gif);
  scrollToBottom();
  await wait(1500);

  // Carregar prompt da BK
  try{
    const txt = await loadPromptTxt(State.choice);
    State.prompt = fillTemplate(txt, State.theme);

    await typeAndAppend('Prontinho, seu prompt ficou incrível! 🎉');
    renderResult();
    State.step = 'result';
  }catch(e){
    console.error(e);
    addMsg({text:'Erro ao carregar o prompt. Confira os arquivos em kb/.', role:'sys'});
    renderResult();
  }
}

// ======= PWA =======
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}

boot();

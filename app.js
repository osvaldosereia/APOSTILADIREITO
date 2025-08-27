/**
 * direito.love — Simulador de Chat (safe build, SW off)
 * - BK em TXT: kb/aprender.txt, kb/treinar.txt, kb/raiox.txt
 * - Frases aleatórias: kb/greetings.txt, kb/choice_ack.txt, kb/thinking.txt (uma por linha)
 * - GIF pensando aleatório: icons/thinking1.gif ... icons/thinking10.gif
 * - Botões 1 por linha, em cascata
 * - Digitação lenta com auto-scroll sempre visível
 * - SW desativado temporariamente para evitar cache preso
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

/* ---------- Auto-scroll: mantém sempre a última visível ---------- */
function scrollToBottomAlways() {
  chatEl.scrollTop = chatEl.scrollHeight;
}
const chatObserver = new MutationObserver(() => scrollToBottomAlways());
chatObserver.observe(chatEl, { childList: true, subtree: true });

/* ---------- Utils ---------- */
async function fetchTxt(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Falha ao carregar: ${path}`);
  return res.text();
}
async function loadLines(file) {
  const txt = await fetchTxt(`kb/${file}`);
  return txt.split('\n').map(s => s.trim()).filter(Boolean);
}
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function sanitizeTheme(s) { return (s || '').trim().slice(0, 300); }
function fillTemplate(tpl, theme) { return tpl.replaceAll('{{TEMA}}', theme); }

/* ---------- Mensagens ---------- */
function typingNode() {
  const d = document.createElement('span');
  d.className = 'typing';
  d.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
  return d;
}

function addMsg({ text, role = 'sys', html = false }) {
  const b = document.createElement('div');
  b.className = `chat__msg chat__msg--${role === 'user' ? 'user' : 'sys'}`;
  if (html) { b.innerHTML = text; } else { b.textContent = text; }
  chatEl.appendChild(b);
  scrollToBottomAlways();
  const imgs = b.querySelectorAll && b.querySelectorAll('img');
  imgs && imgs.forEach(img => img.addEventListener('load', scrollToBottomAlways, { once: true }));
  return b;
}

/* Digitação mais lenta (aprox. 28–42ms por caractere) */
async function typeAndAppend(text) {
  const container = document.createElement('div');
  container.className = 'chat__msg chat__msg--sys';
  const buf = document.createElement('span');
  container.appendChild(buf);
  chatEl.appendChild(container);
  scrollToBottomAlways();
  for (const ch of text) {
    buf.textContent += ch;
    await wait(28 + Math.random() * 14);
  }
  scrollToBottomAlways();
}

/* ---------- Composer (tema) ---------- */
function renderQ2() {
  composerEl.innerHTML = `
    <div class="composer__inner">
      <label class="small" for="theme">Show! Escreve rapidinho qual é o tema que você quer explorar (até 300 caracteres).</label>
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
  ta.addEventListener('input', () => {
    counter.textContent = `${ta.value.length}/300`;
    send.disabled = sanitizeTheme(ta.value).length === 0;
    autoResize();
  });
  autoResize();

  send.addEventListener('click', async () => {
    const theme = sanitizeTheme(ta.value);
    if (!theme) return;
    State.theme = theme;
    addMsg({ text: theme, role: 'user' });
    composerEl.innerHTML = '';
    await buildPrompt();
  });
}

/* ---------- Botões em cascata (1 por linha) ---------- */
async function renderChoiceButtonsCascata() {
  // Mensagem da pergunta
  await typeAndAppend('Me diga, como posso te ajudar hoje?');

  // Container dos botões (bolha separada, lista vertical)
  const box = document.createElement('div');
  box.className = 'chat__msg chat__msg--sys';
  const list = document.createElement('div');
  list.className = 'btn-list';
  box.appendChild(list);
  chatEl.appendChild(box);
  scrollToBottomAlways();

  const buttons = [
    { key: 'aprender', label: 'Agora eu Aprendo' },
    { key: 'treinar',  label: 'Vamos Treinar' },
    { key: 'raiox',    label: 'Raio-X do Tema' }
  ];

  for (const btnDef of buttons) {
    await wait(220); // atraso curto para efeito cascata
    const btn = document.createElement('button');
    btn.className = 'btn btn--primary btn-in';
    btn.textContent = btnDef.label;
    btn.dataset.choice = btnDef.key;
    list.appendChild(btn);
    btn.addEventListener('click', async () => {
      State.choice = btn.dataset.choice;
      await onChoice();
    });
    scrollToBottomAlways();
  }
}

/* ---------- Fluxo ---------- */
async function boot() {
  try {
    const greetings = await loadLines('greetings.txt');
    await typeAndAppend(pickRandom(greetings));
  } catch {
    await typeAndAppend('Olá, é muito bom ter você por aqui! 🙌');
  }

  await wait(500);
  await renderChoiceButtonsCascata();
  State.step = 'q1';
}

async function onChoice() {
  await wait(500);
  try {
    const acks = await loadLines('choice_ack.txt');
    await typeAndAppend(pickRandom(acks));
  } catch {
    await typeAndAppend('Boa escolha 😉');
  }
  await wait(500);
  renderQ2();
  State.step = 'q2';
}

async function buildPrompt() {
  await wait(700);
  try {
    const thinkLines = await loadLines('thinking.txt');
    await typeAndAppend(pickRandom(thinkLines));
  } catch {
    await typeAndAppend('Hmm... deixa eu pensar aqui 🤔');
  }

  // GIF aleatório: icons/thinking1.gif ... thinking10.gif
  const thinkingGifs = Array.from({ length: 10 }, (_, i) => `icons/thinking${i + 1}.gif`);
  await wait(900);
  const gifWrap = document.createElement('div');
  gifWrap.className = 'chat__msg chat__msg--sys';
  const gifChoice = thinkingGifs[Math.floor(Math.random() * thinkingGifs.length)];
  gifWrap.innerHTML = `<img src="${gifChoice}" alt="Pensando..." style="max-width:120px;border-radius:12px">`;
  chatEl.appendChild(gifWrap);
  scrollToBottomAlways();

  await wait(1200);

  try {
    const txt = await fetchTxt(`kb/${State.choice}.txt`);
    State.prompt = fillTemplate(txt, State.theme);

    await typeAndAppend('Prontinho, seu prompt ficou incrível! 🎉');
    renderResult();
    State.step = 'result';
  } catch (e) {
    console.error(e);
    addMsg({ text: 'Erro ao carregar o prompt. Confira os arquivos em kb/.', role: 'sys' });
    renderResult();
  }
}

/* ---------- Resultado: copiar + agradecimento ---------- */
function renderResult() {
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

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(State.prompt);
    addMsg({ text: 'Copiado! Agora cole no GPT/Gemini/Perplexity 🚀', role: 'sys' });
  } catch {
    addMsg({ text: 'Não consegui copiar automaticamente. Copie manualmente.', role: 'sys' });
  }
  await wait(400);
  addMsg({ text: 'Valeu por usar o direito.love! 💙 Se quiser gerar outro prompt, é só clicar em Reiniciar.', role: 'sys' });
}

function restart() {
  State.step = 'intro'; State.choice = null; State.theme = ''; State.prompt = '';
  chatEl.innerHTML = ''; composerEl.innerHTML = '';
  boot();
}

/* ---------- PWA (desativado temporariamente) ---------- */
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('sw.js').catch(() => {});
//   });
// }

/* start */
boot();

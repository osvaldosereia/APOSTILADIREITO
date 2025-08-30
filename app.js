// app.js (ES module, zero dependências)
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];
const app = $('#app');
const tpl = $('#tpl-message');
const form = $('#prompt-form');
const input = $('#text-input');
const btnReset = $('#btn-reset');
const btnHistory = $('#btn-history');
const dlgHistory = $('#history-modal');
const listHistory = $('#history-list');
const btnInstall = $('#btn-install');

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; btnInstall.style.display='inline-block'; });

// PWA install
btnInstall.addEventListener('click', async () => {
  if (!deferredPrompt) return alert('Se disponível, o banner aparecerá automaticamente.');
  deferredPrompt.prompt();
  await deferredPrompt.userChoice; deferredPrompt = null; btnInstall.style.display='none';
});

btnReset.addEventListener('click', () => { location.reload(); });

btnHistory.addEventListener('click', () => { renderHistory(); dlgHistory.showModal(); });
$('#close-history').addEventListener('click', () => dlgHistory.close());

// storage simples
const store = {
  key: 'cj-history-v1',
  get(){ try { return JSON.parse(localStorage.getItem(this.key)||'[]'); } catch { return []; } },
  add(item){ const cur = this.get(); cur.unshift(item); localStorage.setItem(this.key, JSON.stringify(cur.slice(0,200))); }
};

// util UI
function say(text, who='bot', html=false){
  const node = tpl.content.firstElementChild.cloneNode(true);
  if (who==='me') node.classList.add('me');
  const bubble = $('.bubble', node);
  bubble[html?'innerHTML':'textContent'] = text;
  app.appendChild(node);
  app.scrollTop = app.scrollHeight;
  return bubble;
}
function chips(options){
  const row = document.createElement('div'); row.className='choices';
  options.forEach(({label, value, onClick})=>{
    const b = document.createElement('button'); b.type='button'; b.className='chip'; b.textContent=label;
    b.addEventListener('click', ()=>onClick(value,label));
    row.appendChild(b);
  });
  app.lastElementChild?.appendChild(row);
}

// fluxo curto
let state = { objetivo:null, tema:null, nivel:'intermediário', formatos:[] };

function greet(){
  say('Olá! Vou criar um prompt perfeito pra você.');
  setTimeout(()=>{
    const b = say('Qual é o seu objetivo agora?');
    chips([
      {label:'Estudar', value:'estudar', onClick: setObjetivo},
      {label:'Treinar 1ª fase', value:'treinar1', onClick: setObjetivo},
      {label:'Treinar 2ª fase', value:'treinar2', onClick: setObjetivo},
      {label:'Montar Peça', value:'peca', onClick: setObjetivo},
      {label:'Jurisprudência', value:'juris', onClick: setObjetivo},
      {label:'Estágio', value:'estagio', onClick: setObjetivo},
    ]);
  }, 400);
}
function setObjetivo(val,label){
  state.objetivo = val;
  say(`Objetivo: ${label}`, 'me');
  askTema();
}
function askTema(){
  const b = say('Digite o tema (ex.: dano estético em erro médico).');
  input.placeholder = 'Ex.: dano estético em erro médico';
  input.focus();
}
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const t = input.value.trim();
  if(!t) return;
  say(t, 'me');
  input.value='';
  if(!state.tema){
    state.tema = t;
    askRefinos();
  } else {
    // mensagens livres pós-prompt
    followup(t);
  }
});
function askRefinos(){
  setTimeout(()=>{
    say('Quer ajustar algo ou deixo no automático?');
    chips([
      {label:'Automático', value:'auto', onClick: ()=>{ buildAndShowPrompt(); }},
      {label:'Escolher formato', value:'fmt', onClick: chooseFormat},
      {label:'Escolher nível', value:'nivel', onClick: chooseLevel},
      {label:'Formatos + Nível', value:'both', onClick: ()=>{ chooseFormat(()=>chooseLevel(buildAndShowPrompt)); }},
    ]);
  }, 300);
}
function chooseFormat(next){
  say('Escolha 1–3 formatos (toque para marcar e novamente para desmarcar), depois “Continuar”.');
  const chosen = new Set();
  const row = document.createElement('div'); row.className='choices';
  const opts = ['Explicação', 'Mapa mental', 'Quadro comparativo', 'Flashcards', 'Simulado (1ª fase)', 'Discursivas/Peça', 'Jurisprudência', 'Resumo 5-10-20', 'Checklist/Estágio'];
  opts.forEach(label=>{
    const b = document.createElement('button'); b.type='button'; b.className='chip'; b.textContent=label;
    b.addEventListener('click', ()=>{
      if(chosen.has(label)){ chosen.delete(label); b.style.opacity='1'; }
      else { chosen.add(label); b.style.opacity='.6'; }
    });
    row.appendChild(b);
  });
  const go = document.createElement('button'); go.className='chip'; go.textContent='Continuar';
  go.addEventListener('click', ()=>{
    state.formatos = [...chosen];
    if(typeof next==='function') next(); else askRefinos();
  });
  row.appendChild(go);
  app.lastElementChild?.appendChild(row);
}
function chooseLevel(next){
  say('Qual o nível?');
  chips([
    {label:'Iniciante', value:'iniciante', onClick:(v)=>{ state.nivel=v; if(next) next(); else askRefinos(); }},
    {label:'Intermediário', value:'intermediário', onClick:(v)=>{ state.nivel=v; if(next) next(); else askRefinos(); }},
    {label:'Avançado', value:'avançado', onClick:(v)=>{ state.nivel=v; if(next) next(); else askRefinos(); }},
  ]);
}

function buildPrompt({objetivo, tema, nivel, formatos}){
  // mapeia objetivo -> instruções específicas
  const blocks = {
    estudar: `- Explique de forma clara, com precisão técnica e sem juridiquês desnecessário.
- Inclua 2 exemplos práticos, 4 pegadinhas e um mapa mental em texto (tópicos hierárquicos).
- Traga apenas entendimentos majoritários de STF/STJ sem citar números de processos.
- Finalize com 3–5 próximos passos práticos.`,

    treinar1: `- Gere 10 questões objetivas no estilo OAB (FGV), variando fácil/médio/difícil.
- Traga comentário de 2–3 linhas por item.
- Mostre o gabarito **somente ao final**.
- Liste 4 pegadinhas típicas do tema.`,

    treinar2: `- Proponha 2 questões discursivas e um esqueleto de peça relevante, com checklist de pontos obrigatórios.
- Inclua critérios de correção e gestão de tempo.
- Fundamente com entendimento majoritário (sem nº de processo).`,

    peca: `- Entregue um esqueleto completo de peça (endereçamento, qualificação, fatos, fundamentos, pedidos).
- Liste fundamentos materiais e processuais típicos e 5 erros comuns.
- Inclua checklist de documentos e observações de estratégia.`,

    juris: `- Sintetize o entendimento majoritário (STF/STJ) e quando **não** se aplica.
- Dê 1 exemplo de caso típico e 1 de exceção.
- Liste 3 alertas para prova e prática.`,

    estagio: `- Produza checklist operativo (antes/durante/depois), uma minuta modelo curta e roteiro de audiência (quando couber).
- Inclua boas práticas de redação e protocolo.`
  };

  const objetivoKey = (objetivo==='peca') ? 'peca' : objetivo;
  const core = blocks[objetivoKey] || blocks.estudar;

  const fmt = (formatos && formatos.length)
    ? `\n[FORMATOS DE ENTREGA]\n- ${formatos.join('\n- ')}`
    : '';

  return `Você é um professor e coach jurídico de alto nível.
[OBJETIVO] ${objetivo}
[TEMA] ${tema}
[NÍVEL] ${nivel}
${fmt}

[REGRAS GERAIS]
- Linguagem simples, estrutura clara por seções e tópicos.
- Use exemplos concretos e analogias quando útil.
- Se citar jurisprudência, use **apenas entendimentos majoritários** (sem números de processos).
- Para peça, entregue **esqueleto, fundamentos, pedidos e erros a evitar**.
- Para treino, **gabarito apenas no fim** e **comente cada item**.

[ENTREGA ESPERADA]
- Sumário executivo (5 linhas).
- Corpo conforme o objetivo/formatos.
- Próximos passos (3–5).`;
}

function buildAndShowPrompt(){
  say('Gerando o prompt perfeito…');
  setTimeout(()=>{
    const text = buildPrompt(state);
    renderPromptCard(text);
    store.add({ ts: Date.now(), ...state, prompt:text });
    suggestNext();
  }, 300);
}
function renderPromptCard(text){
  const html = `
  <div class="code" tabindex="0">${escapeHtml(text)}</div>
  <div class="btn-row">
    <button class="btn copy" id="btn-copy">Copiar prompt</button>
    <button class="btn ia" id="open-gpt"><img src="icons/gpt.svg" alt="">Abrir ChatGPT</button>
    <button class="btn ia" id="open-gemini"><img src="icons/gemini.svg" alt="">Abrir Gemini</button>
    <button class="btn ia" id="open-perp"><img src="icons/perplexity.svg" alt="">Abrir Perplexity</button>
  </div>`;
  say(html,'bot',true);

  $('#btn-copy').addEventListener('click', async ()=>{
    const code = app.querySelector('.code:last-of-type').innerText;
    await navigator.clipboard.writeText(code);
    alert('Prompt copiado!');
  });

  // abrir ias (sem usar API — apenas nova aba)
  const latest = () => app.querySelector('.code:last-of-type').innerText;

  $('#open-gpt').addEventListener('click', ()=>{
    // sem URL oficial para pré-preencher de forma estável — abrimos a home
    window.open('https://chat.openai.com/', '_blank');
  });
  $('#open-gemini').addEventListener('click', ()=>{
    window.open('https://gemini.google.com/', '_blank');
  });
  $('#open-perp').addEventListener('click', ()=>{
    // perplexity aceita query via ?q= em algumas rotas, mas muda com frequência — abrimos a home
    window.open('https://www.perplexity.ai/', '_blank');
  });
}

function suggestNext(){
  const html = `
  Quer variar agora?
  <div class="choices" style="margin-top:8px">
    <button class="chip" type="button" id="again">Novo tema</button>
    <button class="chip" type="button" id="alt1">Flashcards</button>
    <button class="chip" type="button" id="alt2">Quadro comparativo</button>
    <button class="chip" type="button" id="alt3">Simulado</button>
  </div>`;
  const b = say(html,'bot',true);
  $('#again').addEventListener('click', ()=>location.reload());
  $('#alt1').addEventListener('click', ()=>{ state.formatos=['Flashcards']; buildAndShowPrompt(); });
  $('#alt2').addEventListener('click', ()=>{ state.formatos=['Quadro comparativo']; buildAndShowPrompt(); });
  $('#alt3').addEventListener('click', ()=>{ state.objetivo='treinar1'; state.formatos=['Simulado (1ª fase)']; buildAndShowPrompt(); });
}

function renderHistory(){
  const items = store.get();
  if(!items.length){ listHistory.innerHTML = '<p>Nada salvo ainda.</p>'; return; }
  listHistory.innerHTML = items.map(x=>`
    <div class="history-item">
      <b>${escapeHtml(x.tema)}</b> · <small>${escapeHtml(x.objetivo)} · ${escapeHtml(x.nivel)}</small>
      <details>
        <summary>ver prompt</summary>
        <pre class="code">${escapeHtml(x.prompt)}</pre>
      </details>
    </div>
  `).join('');
}

function escapeHtml(s){ return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

function followup(txt){
  // comportamento simples: se o usuário digitar algo após receber o prompt
  say('Se quiser, clique em um dos chips acima para gerar uma variação rápida 😉');
}

// inicia
greet();

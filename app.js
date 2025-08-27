/**
* direito.love — Simulador de Chat (MVP)
* - BK estática em /kb/... (prompts + snippets)
* - Slot-filling: substitui somente {{TEMA}}
* - Fluxo: intro → q1 → a1 → q2 → building → result
* - Layout inteligente com Virtual Keyboard API / visualViewport
*/


const State = {
step: 'intro', // 'q1' | 'a1' | 'q2' | 'building' | 'result'
choice: null, // 'aprender' | 'treinar' | 'raiox'
theme: '',
prompt: '',
history: []
};


const chatEl = document.getElementById('chat');
const composerEl = document.getElementById('composer');


// BK cache simples (memória)
const BK = {
meta: null,
prompts: {},
snippets: {}
};


// Util: sleep
const wait = (ms) => new Promise(res => setTimeout(res, ms));


// Util: rolar para o fim apenas se usuário estiver perto do fim
function scrollToBottomSmart(force=false){
const atBottom = (chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight) < 80;
if (force || atBottom) chatEl.scrollTop = chatEl.scrollHeight;
}


// Indicador “digitando…”
function typingNode(){
const d = document.createElement('span');
d.className = 'typing';
d.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
return d;
}


// Adiciona mensagem ao chat
function addMsg({text, role='sys', html=false}){
const b = document.createElement('div');
b.className = `chat__msg chat__msg--${role === 'user' ? 'user' : 'sys'}`;
boot();

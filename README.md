# APOSTILA DIREITO — Gerador de Prompt

Aplicação de página única (SPA) para gerar prompts de alta qualidade para apostilas e conteúdos jurídicos.

## 🚀 Funcionalidades
- Fluxo em **4 etapas** com guardas (Tema obrigatório).
- Estratégias: **Apostila Didática**, **Artigo Acadêmico**, **Perguntas e Respostas**, **Casos**.
- Ajustes automáticos: **Nível × Versão** (bloqueios coerentes).
- Prompt final: pesquisa **ampla e aprofundada**; **sem tabelas/gráficos/quadros/mapas mentais**.
- Botões **Gerar**, **Copiar** (com fallback) e **Início** (reset).
- Layout **dark** com painéis coloridos (alto contraste).

## 📦 Como usar
1. Abra o `index.html` no navegador.
2. Preencha as etapas e clique em **Gerar Prompt**.
3. Use **Copiar** para colocar o resultado na área de transferência.

## 🌐 Publicar no GitHub Pages
1. Crie um repositório e envie estes arquivos.
2. Em **Settings → Pages**, selecione a branch `main` e a pasta `/root`.
3. Acesse a URL publicada (padrão: `https://<seu-usuario>.github.io/<repo>/`).

## 🧩 Estrutura
```
apostila-direito/
├─ index.html
├─ README.md
├─ LICENSE
└─ .gitignore
```

## 📝 Licença
Este projeto usa a licença **MIT** (ver `LICENSE`).

---

**Indicado para uso no Gemini** • Siga: [@osvaldosereiajr](https://www.instagram.com/osvaldosereiajr/)

### Domínio próprio (CNAME)
1. Edite o arquivo `CNAME` e coloque **apenas** o seu domínio (ex.: `apostila.osvaldo.com.br`).
2. Aponte um CNAME no seu DNS para `seu-usuario.github.io`.
3. Em **Settings → Pages**, marque **Enforce HTTPS** quando disponível.

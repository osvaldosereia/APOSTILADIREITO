# Apostila Direito — AD

Gerador de prompts (web-only) para criar apostilas jurídicas (GPT/Gemini).

## Publicação no GitHub Pages

1. Crie um repositório no GitHub (ex.: `apostila-direito`).
2. Faça upload destes arquivos na **raiz** do repositório:
   - `index.html`
   - `manifest.webmanifest`
   - `sw.js`
   - `icons/icon-192.png`
   - `icons/icon-512.png`
   - `CNAME` (opcional; somente se usar domínio próprio)
3. Em **Settings › Pages**, selecione **Deploy from a branch** e aponte para a branch `main` e **/ (root)**.
4. (Domínio próprio) Deixe o campo **Custom domain** como `apostiladireito.com.br` e salve. O arquivo `CNAME` já está incluso.

### DNS para domínio próprio (resumo)
- Aponte o **apex** `apostiladireito.com.br` para os IPs do GitHub Pages (A): 185.199.108.153 / .109 / .110 / .111
- (Opcional) Aponte `www.apostiladireito.com.br` via **CNAME** para `<seu-usuario>.github.io`
- Habilite **Enforce HTTPS** em Settings › Pages quando o certificado aparecer.

## Uso
1. Abra o site publicado.
2. Preencha os passos 1–5 e avance.
3. Na etapa 6, confira o **Revisar** e clique em **Gerar prompt**.
4. Copie o prompt e cole no GPT/Gemini.

## PWA
- Já vem com `manifest.webmanifest` e `sw.js` para cache básico/offline.
- Usuários móveis verão o convite para “Adicionar à tela inicial” (depende do navegador).

---
Feito para rodar **sem backend** e **sem dependências externas**.

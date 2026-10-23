# insightops.com.br

Site institucional da InsightOps. Sem dependências e sem build: o que está em `public/` vai para o ar como está. A única parte dinâmica é o formulário de contato (`src/worker.js`).

## Estrutura

```
public/            tudo o que é publicado (e só isso)
  index.html       página única
  404.html         página de erro (servida pelo Cloudflare para endereços inexistentes)
  obrigado.html    confirmação do formulário quando o navegador está sem JavaScript
  css/ js/         estilo e o único script (ano do rodapé e envio do formulário)
  assets/img/      logo.svg, lente-humana.svg, favicons e imagem de compartilhamento (og.png)
  _headers         headers de segurança e cache (Cloudflare)
  robots.txt  sitemap.xml  site.webmanifest  favicon.ico
src/worker.js      Worker: serve ./public e atende POST /api/contato (envia o formulário por e-mail)
brand/             arquivos-mestre da marca (NÃO publicados): logo original, Lente Humana, avatares e capas
                   (linkedin/, redes/ para Instagram e Facebook, github/)
wrangler.jsonc     configuração do Worker "insightops-site" (publica só ./public + o Worker)
```

## Ver localmente

Qualquer servidor estático serve. Com Python:

```
cd public
python -m http.server 8080
```

Abra http://localhost:8080 (o formulário não envia nesse modo). Para simular o Cloudflare de verdade (404, `_headers` e o formulário), com Node instalado:

```
npx wrangler dev
```

No `wrangler dev` o e-mail não sai de verdade: o conteúdo é gravado num arquivo `.eml` e o caminho aparece no terminal.

## Publicar (homologação antes de produção)

O Cloudflare Workers Builds está ligado ao repositório `insightops-br/insightops-site` (https://github.com/insightops-br/insightops-site).

1. Trabalhe numa branch (ex.: `git switch -c ajuste-x`), faça commit e `git push -u origin ajuste-x`.
2. O Cloudflare gera uma URL de prévia para a branch. Teste nela (celular incluso).
3. Aprovado, faça merge na `main`. O push na `main` publica em https://insightops.com.br.

Ao mudar `css/style.css` ou `js/main.js`, atualize o `?v=AAAAMMDD` nas tags do `index.html` e do `404.html` para que os navegadores baixem a versão nova.

## Formulário de contato

- O formulário envia para `POST /api/contato`. O Worker valida os campos, descarta robôs (campo invisível e envio em menos de 3 s) e manda a mensagem para **insightops.br@gmail.com** pelo Cloudflare Email Routing (binding `CONTATO` no `wrangler.jsonc`). O remetente é `formulario@insightops.com.br` e o "Responder" vai direto para quem escreveu.
- Requisitos no Cloudflare: Email Routing ativo em insightops.com.br e o endereço de destino verificado (já estão). Para trocar o destino, mude `destination_address` no `wrangler.jsonc` e `CONTATO_DESTINO` (opcional) nas variáveis do Worker. O novo endereço precisa estar verificado no Email Routing.
- Os assuntos ficam em `ASSUNTOS` no `src/worker.js` e nas `<option>` do `index.html`. Mantenha os dois iguais.
- Os logs de envio aparecem em Workers & Pages › insightops-site › Logs. O conteúdo das mensagens não é registrado.

## Domínios

- Oficial: **insightops.com.br** (www redireciona para sem www).
- Antigo: **insigthops.com.br** e www, redirecionam com 301 preservando caminho e query.
- E-mail público: **contato@insightops.com.br** (Cloudflare Email Routing).

## Créditos

Ícones (WhatsApp, Instagram, Facebook, LinkedIn, site, serviços): Font Awesome Free 6.5.2 (CC BY 4.0), embutidos como SVG em `index.html`. Símbolo da Lente Humana: `lente-humana/docs/marca`.

## Redes

Instagram, Facebook e LinkedIn ficam no rodapé (`<ul class="redes">`) e em `sameAs` nos dados estruturados. Para incluir outra rede, faça nos dois lugares. As imagens de perfil e capa estão em `brand/`.

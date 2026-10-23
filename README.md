# insightops.com.br

Site institucional da InsightOps. Estático, sem dependências e sem build: o que está em `public/` é exatamente o que vai para o ar.

## Estrutura

```
public/            tudo o que é publicado (e só isso)
  index.html       página única
  404.html         página de erro (servida pelo Cloudflare para endereços inexistentes)
  css/ js/         estilo e o único script (ano do rodapé)
  assets/img/      logo.svg (vetorizado do arquivo-mestre), favicons e imagem de compartilhamento (og.png)
  _headers         headers de segurança e cache (Cloudflare)
  robots.txt  sitemap.xml  site.webmanifest  favicon.ico
brand/             arquivos-mestre da marca (NÃO publicados): logo original, símbolos JC e Lente Humana
wrangler.jsonc     configuração do Worker "insightops-site" (publica só ./public)
```

## Ver localmente

Qualquer servidor estático serve. Com Python:

```
cd public
python -m http.server 8080
```

Abra http://localhost:8080. Para simular o Cloudflare de verdade (404, `_headers`), com Node instalado:

```
npx wrangler dev
```

## Publicar (homologação antes de produção)

O Cloudflare Workers Builds está ligado ao repositório `insigthops/insightops-site`.

1. Trabalhe numa branch (ex.: `git switch -c ajuste-x`), faça commit e `git push -u origin ajuste-x`.
2. O Cloudflare gera uma URL de prévia para a branch. Teste nela (celular incluso).
3. Aprovado, faça merge na `main`. O push na `main` publica em https://insightops.com.br.

Ao mudar `css/style.css` ou `js/main.js`, atualize o `?v=AAAAMMDD` nas tags do `index.html` e do `404.html` para que os navegadores baixem a versão nova.

## Domínios

- Oficial: **insightops.com.br** (www redireciona para sem www).
- Antigo: **insigthops.com.br** e www, redirecionam com 301 preservando caminho e query.
- E-mail público: **contato@insightops.com.br** (Cloudflare Email Routing).

## Créditos

Ícones de WhatsApp, e-mail, Instagram, Facebook e LinkedIn: Font Awesome Free 6.5.2 (CC BY 4.0), embutidos como SVG em `index.html`. Símbolo da Lente Humana: `lente-humana/docs/marca`. JC: tipografia Gelasio (SIL OFL), convertida em contornos.

## LinkedIn (quando existir)

Em `index.html`, no rodapé (`<ul class="redes">`), acrescente um item igual aos outros usando o ícone `#i-linkedin`, que já está no arquivo, e inclua o endereço em `sameAs` nos dados estruturados.

// InsightOps — Worker do site.
// Serve os arquivos de ./public e atende uma única rota dinâmica:
// POST /api/contato, que envia a mensagem do formulário por e-mail
// (Cloudflare Email Routing, binding CONTATO em wrangler.jsonc).
// Sem dependências: a mensagem MIME é montada aqui mesmo.

import { EmailMessage } from "cloudflare:email";

const REMETENTE = "formulario@insightops.com.br";
const ORIGENS = ["https://insightops.com.br", "https://www.insightops.com.br"];

export const ASSUNTOS = {
    observabilidade: "Observabilidade e monitoramento",
    automacao: "Automação de processos",
    dados: "Dashboards e indicadores",
    desenvolvimento: "Desenvolvimento de sistema, site ou API",
    consultoria: "Consultoria",
    outro: "Outro assunto",
};

const LIMITES = { nome: [2, 60], sobrenome: [2, 80], email: [6, 120], mensagem: [10, 3000] };

const SEGURANCA = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cache-Control": "no-store",
};

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname === "/api/contato") {
            if (request.method !== "POST") {
                return resposta(request, 405, "Método não permitido.", { Allow: "POST" });
            }
            try {
                return await contato(request, env);
            } catch (erro) {
                console.error("contato: falha inesperada", erro && erro.message);
                return resposta(request, 500, "Não foi possível enviar agora. Tente de novo em instantes ou fale pelo WhatsApp.");
            }
        }
        return env.ASSETS.fetch(request);
    },
};

async function contato(request, env) {
    const origem = request.headers.get("Origin");
    if (origem && !ORIGENS.includes(origem) && !origemLocal(origem)) {
        return resposta(request, 403, "Origem não permitida.");
    }
    const tamanho = Number(request.headers.get("Content-Length") || 0);
    if (tamanho > 20000) {
        return resposta(request, 413, "Mensagem grande demais.");
    }

    let dados;
    try {
        dados = await request.formData();
    } catch {
        return resposta(request, 400, "Formulário inválido.");
    }
    const campo = (nome) => String(dados.get(nome) || "").trim();

    // Armadilhas para robôs: campo invisível preenchido ou envio rápido demais.
    // Respondemos "ok" para não ensinar o robô a contornar.
    const aberto = Number(campo("t"));
    if (campo("site") || (aberto && Date.now() - aberto < 3000)) {
        console.log("contato: descartado como automático");
        return resposta(request, 200, "Mensagem enviada.");
    }

    const f = {
        nome: umaLinha(campo("nome")),
        sobrenome: umaLinha(campo("sobrenome")),
        email: umaLinha(campo("email")).toLowerCase(),
        celular: campo("celular").replace(/\D/g, ""),
        assunto: campo("assunto"),
        mensagem: campo("mensagem").replace(/\r\n?/g, "\n"),
    };

    const erros = [];
    for (const [chave, [min, max]] of Object.entries(LIMITES)) {
        if (f[chave].length < min || f[chave].length > max) erros.push(chave);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) erros.push("email");
    if (f.celular.length < 10 || f.celular.length > 13) erros.push("celular");
    if (!ASSUNTOS[f.assunto]) erros.push("assunto");
    if (erros.length) {
        return resposta(request, 422, "Confira os campos destacados.", {}, [...new Set(erros)]);
    }

    const assunto = ASSUNTOS[f.assunto];
    const corpo = [
        `Nova mensagem pelo site insightops.com.br`,
        ``,
        `Nome: ${f.nome} ${f.sobrenome}`,
        `E-mail: ${f.email}`,
        `Celular: ${formatarCelular(f.celular)}`,
        `Assunto: ${assunto}`,
        ``,
        f.mensagem,
        ``,
        `--`,
        `Responda este e-mail para falar direto com ${f.nome}.`,
    ].join("\n");

    const destino = env.CONTATO_DESTINO || "insightops.br@gmail.com";
    const mime = montarMime({
        de: REMETENTE,
        deNome: "Site InsightOps",
        para: destino,
        responderPara: f.email,
        assunto: `[Site] ${assunto} · ${f.nome} ${f.sobrenome}`,
        corpo,
    });

    await env.CONTATO.send(new EmailMessage(REMETENTE, destino, mime));
    console.log("contato: enviado", f.assunto);
    return resposta(request, 200, "Mensagem enviada.");
}

function origemLocal(origem) {
    return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origem);
}

function umaLinha(texto) {
    return texto.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ");
}

function formatarCelular(d) {
    const n = d.startsWith("55") && d.length > 11 ? d.slice(2) : d;
    return n.length === 11 ? `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}` : d;
}

function b64(texto) {
    const bytes = new TextEncoder().encode(texto);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
}

function cabecalho(texto) {
    return /^[\x20-\x7e]*$/.test(texto) ? texto : `=?UTF-8?B?${b64(texto)}?=`;
}

function montarMime({ de, deNome, para, responderPara, assunto, corpo }) {
    const conteudo = b64(corpo).replace(/.{76}/g, "$&\r\n");
    return [
        `From: ${cabecalho(deNome)} <${de}>`,
        `To: <${para}>`,
        `Reply-To: <${responderPara}>`,
        `Subject: ${cabecalho(assunto)}`,
        `Date: ${new Date().toUTCString()}`,
        `Message-ID: <${crypto.randomUUID()}@insightops.com.br>`,
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset=UTF-8`,
        `Content-Transfer-Encoding: base64`,
        ``,
        conteudo,
    ].join("\r\n");
}

function resposta(request, status, mensagem, extras = {}, campos = []) {
    const querJson = (request.headers.get("Accept") || "").includes("application/json");
    if (querJson) {
        return new Response(JSON.stringify({ ok: status === 200, mensagem, campos }), {
            status,
            headers: { "Content-Type": "application/json; charset=utf-8", ...SEGURANCA, ...extras },
        });
    }
    // Sem JavaScript: volta para a página com o resultado.
    if (status === 200) {
        return new Response(null, { status: 303, headers: { Location: "/obrigado.html", ...SEGURANCA } });
    }
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Não foi possível enviar | InsightOps</title><link rel="stylesheet" href="/css/style.css"></head><body><main class="hero erro"><h1>Não foi possível enviar.</h1><p class="hero-texto">${mensagem}</p><div class="acoes"><a class="botao" href="/#contato">Voltar ao formulário</a></div></main></body></html>`;
    return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", ...SEGURANCA, ...extras } });
}

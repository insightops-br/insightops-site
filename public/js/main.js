// InsightOps — único script do site.
(function () {
    var ano = document.getElementById("ano");
    if (ano) ano.textContent = String(new Date().getFullYear());

    var form = document.getElementById("form-contato");
    if (!form || !window.fetch || !window.FormData) return;

    var status = form.querySelector(".form-status");
    var botao = form.querySelector("button[type=submit]");
    var textoBotao = botao.textContent;
    form.noValidate = true;
    form.elements.t.value = String(Date.now());

    var NOMES = {
        nome: "nome",
        sobrenome: "sobrenome",
        email: "e-mail",
        celular: "celular",
        assunto: "assunto",
        mensagem: "mensagem"
    };

    function avisar(texto, tipo) {
        status.textContent = texto;
        status.className = "form-status" + (tipo ? " form-status-" + tipo : "");
    }

    function marcar(campos) {
        Array.prototype.forEach.call(form.querySelectorAll("[aria-invalid]"), function (el) {
            el.removeAttribute("aria-invalid");
        });
        campos.forEach(function (nome) {
            var el = form.elements[nome];
            if (el) el.setAttribute("aria-invalid", "true");
        });
        if (campos.length && form.elements[campos[0]]) form.elements[campos[0]].focus();
    }

    form.addEventListener("input", function (e) {
        if (e.target.getAttribute("aria-invalid") && e.target.checkValidity()) {
            e.target.removeAttribute("aria-invalid");
        }
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        var invalidos = Array.prototype.filter.call(form.elements, function (el) {
            return el.willValidate && !el.checkValidity();
        }).map(function (el) { return el.name; });

        if (invalidos.length) {
            marcar(invalidos);
            avisar("Confira: " + invalidos.map(function (n) { return NOMES[n] || n; }).join(", ") + ".", "erro");
            return;
        }

        marcar([]);
        botao.disabled = true;
        botao.textContent = "Enviando…";
        avisar("");

        fetch(form.action, {
            method: "POST",
            body: new FormData(form),
            headers: { Accept: "application/json" }
        })
            .then(function (r) {
                return r.json().catch(function () { return {}; }).then(function (dados) {
                    return { ok: r.ok, dados: dados };
                });
            })
            .then(function (res) {
                if (res.ok) {
                    form.reset();
                    form.elements.t.value = String(Date.now());
                    avisar("Mensagem enviada. Obrigado! Respondemos em breve pelo seu e-mail.", "ok");
                } else {
                    marcar(res.dados.campos || []);
                    avisar(res.dados.mensagem || "Não foi possível enviar. Tente de novo.", "erro");
                }
            })
            .catch(function () {
                avisar("Sem conexão no momento. Tente de novo ou fale pelo WhatsApp.", "erro");
            })
            .then(function () {
                botao.disabled = false;
                botao.textContent = textoBotao;
            });
    });
})();

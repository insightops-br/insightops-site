// Atualiza o ano do rodapé (o HTML já traz o ano corrente como padrão sem JS).
(function () {
    var ano = document.getElementById("ano");
    if (ano) ano.textContent = String(new Date().getFullYear());
})();

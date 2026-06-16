document.addEventListener("DOMContentLoaded", init);

function init() {
    updateFooterYear();
}

function updateFooterYear() {
    const yearElement = document.getElementById("year");

    if (!yearElement) return;

    yearElement.textContent = new Date().getFullYear();
}
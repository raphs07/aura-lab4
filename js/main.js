// Utilidades compartilhadas por todas as páginas: aviso (toast)
(function () {
  let toastEl = document.getElementById("toast");
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.id = "toast";
    toastEl.className = "toast";
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    document.body.appendChild(toastEl);
  }
  let timer;
  window.auraToast = function (msg, ms) {
    toastEl.textContent = msg;
    toastEl.classList.add("on");
    clearTimeout(timer);
    timer = setTimeout(() => toastEl.classList.remove("on"), ms || 4800);
  };
})();

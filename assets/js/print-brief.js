(function () {
  "use strict";

  const body = document.body;
  const printClass = "is-printing-brief";
  let originalTitle = document.title;

  function clearPrintMode() {
    body.classList.remove(printClass);
    document.title = originalTitle;
  }

  function printBrief() {
    originalTitle = document.title;
    body.classList.add(printClass);
    document.title = "Neuseeland-2026-Reise-Kurzblatt";
    window.setTimeout(() => window.print(), 0);
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-print-brief]");
    if (!button) return;
    event.preventDefault();
    printBrief();
  });

  window.addEventListener("afterprint", clearPrintMode);

  const media = window.matchMedia && window.matchMedia("print");
  if (media && typeof media.addEventListener === "function") {
    media.addEventListener("change", (event) => {
      if (!event.matches) clearPrintMode();
    });
  }
}());

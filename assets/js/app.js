(function () {
  "use strict";

  const data = window.tripData;
  if (!data) return;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const stageDialog = $("#stage-dialog");
  const storageKey = "nz-2026-checklist-v41a";

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function mapUrl(query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  function renderTripFacts() {
    const facts = [
      ["Zeitraum", "5.–17. Sept. 2026"],
      ["Dauer", `${data.meta.totalDays} Tage · ${data.meta.totalNights} Nächte`],
      ["Fahrstrecke", data.meta.totalDistance],
      ["Abschluss", "17. Sept. · 20:00 Uhr Abflug"]
    ];
    $("#trip-facts").innerHTML = facts.map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
    $("#updated-date").textContent = data.meta.updated;
  }

  function routeClass(day) {
    if (day.number === 1) return "ferry";
    if (day.number === data.days.length) return "return";
    return "road";
  }

  function renderRoute() {
    const track = $("#route-track");
    track.innerHTML = data.days.map((day) => `
      <div class="route-stop ${routeClass(day)}" title="Tag ${day.number}: ${escapeHtml(day.route)}">
        <span class="route-day">Tag ${day.number}</span>
        <span class="route-place">${escapeHtml(day.end)}</span>
      </div>
    `).join("");
  }

  function renderStages() {
    $("#stage-count").textContent = `${data.days.length} Etappen · ${data.meta.totalNights} Übernachtungen`;
    $("#stages-grid").innerHTML = data.days.map((day) => `
      <article class="stage-card" data-stage="${day.number}">
        <div class="stage-top">
          <div>
            <span class="stage-day">Tag ${day.number}</span>
            <p class="stage-date">${escapeHtml(day.date)}</p>
          </div>
          <span class="status">${escapeHtml(day.status)}</span>
        </div>
        <h3>${escapeHtml(day.route)}</h3>
        <p class="stage-type">${escapeHtml(day.type)}</p>
        <div class="stage-stats">
          <span>${escapeHtml(day.drive)}</span>
          <span>${escapeHtml(day.distance)}</span>
        </div>
        <p class="stage-priority">${escapeHtml(day.priority)}</p>
        <footer>
          <span class="stage-overnight">Übernachtung: ${escapeHtml(day.overnight)}</span>
          <button class="stage-detail-button" type="button" data-open-stage="${day.number}">Details</button>
        </footer>
      </article>
    `).join("");
  }

  function stageDialogHtml(day) {
    return `
      <p class="dialog-eyebrow">Tag ${day.number} · ${escapeHtml(day.date)}</p>
      <h2 id="dialog-title">${escapeHtml(day.route)}</h2>
      <p class="dialog-subtitle">${escapeHtml(day.type)} · ${escapeHtml(day.priority)}</p>
      <div class="dialog-facts">
        <div><span>Fahrt</span><strong>${escapeHtml(day.drive)}</strong></div>
        <div><span>Distanz</span><strong>${escapeHtml(day.distance)}</strong></div>
        <div><span>Übernachtung</span><strong>${escapeHtml(day.overnight)}</strong></div>
      </div>
      <div class="dialog-grid">
        <section>
          <h3>Tagesnotiz</h3>
          <p>${escapeHtml(day.notes)}</p>
          <h3 style="margin-top:24px">Mögliche Höhepunkte</h3>
          <ul>${day.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </section>
        <section>
          <h3>Praktisch</h3>
          <ul>${day.practical.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </section>
      </div>
      <a class="dialog-map-link" href="${mapUrl(day.mapQuery)}" target="_blank" rel="noopener noreferrer">In Google Maps anzeigen ↗</a>
    `;
  }

  function openStage(number) {
    const day = data.days.find((item) => item.number === Number(number));
    if (!day || !stageDialog) return;
    $("#dialog-content").innerHTML = stageDialogHtml(day);
    stageDialog.showModal();
  }

  function closeStage() {
    if (stageDialog && stageDialog.open) stageDialog.close();
  }

  function getChecklistState() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch (_) {
      return {};
    }
  }

  function saveChecklistState(state) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (_) {
      // Die Liste funktioniert auch ohne lokalen Speicher.
    }
  }

  function renderChecklist() {
    const state = getChecklistState();
    $("#checklist").innerHTML = data.checklist.map((item, index) => {
      const id = `check-${index}`;
      const checked = state[index] ? " checked" : "";
      return `<li><input id="${id}" type="checkbox" data-check-index="${index}"${checked}><label for="${id}">${escapeHtml(item)}</label></li>`;
    }).join("");
  }

  function bindEvents() {
    $(".menu-toggle").addEventListener("click", (event) => {
      const button = event.currentTarget;
      const nav = $("#site-nav");
      const open = nav.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(open));
    });

    $$("#site-nav a").forEach((link) => link.addEventListener("click", () => {
      $("#site-nav").classList.remove("is-open");
      $(".menu-toggle").setAttribute("aria-expanded", "false");
    }));

    document.addEventListener("click", (event) => {
      const stageButton = event.target.closest("[data-open-stage]");
      if (stageButton) openStage(stageButton.dataset.openStage);
      if (event.target.closest("[data-close-dialog]")) closeStage();
      if (event.target.closest("[data-print]")) window.print();
      if (event.target.closest("[data-reset-checklist]")) {
        saveChecklistState({});
        renderChecklist();
      }
    });

    document.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-check-index]");
      if (!checkbox) return;
      const state = getChecklistState();
      state[checkbox.dataset.checkIndex] = checkbox.checked;
      saveChecklistState(state);
    });

    stageDialog?.addEventListener("click", (event) => {
      const rect = stageDialog.getBoundingClientRect();
      const inside = rect.top <= event.clientY && event.clientY <= rect.bottom && rect.left <= event.clientX && event.clientX <= rect.right;
      if (!inside) closeStage();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeStage();
    });
  }

  renderTripFacts();
  renderRoute();
  renderStages();
  renderChecklist();
  bindEvents();
}());

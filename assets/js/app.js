(function () {
  "use strict";

  const data = window.tripData;
  if (!data) return;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const stageDialog = $("#stage-dialog");
  const checklistStorageKey = "nz-2026-checklist-v41b";
  const plannerStorageKey = "nz-2026-planner-v41b";
  let activeStageFilter = "all";

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

  function loadState(storageKey, fallback) {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveState(storageKey, state) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (_) {
      // Die Seite bleibt auch ohne lokalen Speicher verwendbar.
    }
  }

  function getPlannerState() {
    return loadState(plannerStorageKey, { taskStatus: {}, dayStatus: {}, notes: {} });
  }

  function getTaskStatus(task) {
    const state = getPlannerState();
    return state.taskStatus[task.id] || task.status;
  }

  function getDayStatus(day) {
    const state = getPlannerState();
    return state.dayStatus[day.number] || day.status;
  }

  function statusLabel(status) {
    const labels = {
      offen: "offen",
      optional: "optional",
      vorgemerkt: "vorgemerkt",
      gebucht: "gebucht",
      erledigt: "erledigt"
    };
    return labels[status] || status;
  }

  function statusOptions(selected, includeOptional) {
    const values = includeOptional
      ? ["offen", "optional", "vorgemerkt", "gebucht", "erledigt"]
      : ["offen", "vorgemerkt", "gebucht", "erledigt"];
    return values.map((value) => `<option value="${value}"${value === selected ? " selected" : ""}>${statusLabel(value)}</option>`).join("");
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
      <button class="route-stop ${routeClass(day)}" type="button" data-route-day="${day.number}" title="Tag ${day.number}: ${escapeHtml(day.route)}">
        <span class="route-day">Tag ${day.number}</span>
        <span class="route-place">${escapeHtml(day.end)}</span>
      </button>
    `).join("");
  }

  function visibleDays() {
    if (activeStageFilter === "all") return data.days;
    return data.days.filter((day) => day.filterTags.includes(activeStageFilter));
  }

  function signalMarkup(day) {
    if (!day.signals || !day.signals.length) return "";
    return `<div class="signal-list">${day.signals.map((signal) => `<span>${escapeHtml(signal)}</span>`).join("")}</div>`;
  }

  function renderStages() {
    const days = visibleDays();
    const suffix = activeStageFilter === "all" ? "Etappen" : "passende Etappen";
    $("#stage-count").textContent = `${days.length} ${suffix} · ${data.meta.totalNights} Übernachtungen`;
    $("#stages-grid").innerHTML = days.map((day) => {
      const status = getDayStatus(day);
      return `
        <article class="stage-card" data-stage="${day.number}">
          <div class="stage-top">
            <div>
              <span class="stage-day">Tag ${day.number}</span>
              <p class="stage-date">${escapeHtml(day.date)}</p>
            </div>
            <span class="status status-${escapeHtml(status)}">${escapeHtml(statusLabel(status))}</span>
          </div>
          <h3>${escapeHtml(day.route)}</h3>
          <p class="stage-type">${escapeHtml(day.type)}</p>
          ${signalMarkup(day)}
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
      `;
    }).join("");
  }

  function planningStats() {
    const taskStatuses = data.planning.map((task) => getTaskStatus(task));
    return {
      complete: taskStatuses.filter((status) => status === "gebucht" || status === "erledigt").length,
      open: taskStatuses.filter((status) => status === "offen").length,
      optional: taskStatuses.filter((status) => status === "optional").length,
      weather: data.days.filter((day) => day.filterTags.includes("weather")).length
    };
  }

  function renderPlanning() {
    const stats = planningStats();
    $("#planning-summary").innerHTML = `
      <article class="planning-stat"><strong>${stats.complete}</strong><span>gesichert</span></article>
      <article class="planning-stat"><strong>${stats.open}</strong><span>offene Punkte</span></article>
      <article class="planning-stat"><strong>${stats.optional}</strong><span>optionale Punkte</span></article>
      <article class="planning-stat"><strong>${stats.weather}</strong><span>Wetterfenster</span></article>
    `;

    $("#planning-board").innerHTML = data.planning.map((task) => {
      const status = getTaskStatus(task);
      return `
        <article class="planning-item" data-planning-task="${escapeHtml(task.id)}">
          <div class="planning-item-top">
            <span class="planning-category">${escapeHtml(task.category)}</span>
            <span class="planning-day">Tag ${task.day}</span>
          </div>
          <h3>${escapeHtml(task.title)}</h3>
          <p>${escapeHtml(task.note)}</p>
          <div class="planning-item-bottom">
            <label>
              <span class="visually-hidden">Status für ${escapeHtml(task.title)}</span>
              <select class="planning-select" data-task-status="${escapeHtml(task.id)}">
                ${statusOptions(status, true)}
              </select>
            </label>
            <button class="planning-jump" type="button" data-jump-stage="${task.day}">Zur Etappe <span aria-hidden="true">→</span></button>
          </div>
        </article>
      `;
    }).join("");
  }

  function stageDialogHtml(day) {
    const state = getPlannerState();
    const status = getDayStatus(day);
    const note = state.notes[day.number] || "";
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
          <h3 class="dialog-section-title">Mögliche Höhepunkte</h3>
          <ul>${day.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </section>
        <section>
          <h3>Praktisch</h3>
          <ul>${day.practical.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </section>
      </div>
      <section class="personal-note">
        <div class="personal-note-heading">
          <div>
            <span class="personal-note-label">Eigene Planung</span>
            <h3>Notiz zu diesem Tag</h3>
          </div>
          <label class="dialog-status-control">
            <span>Planungsstatus</span>
            <select data-day-status="${day.number}">${statusOptions(status, false)}</select>
          </label>
        </div>
        <textarea data-day-note="${day.number}" rows="4" placeholder="Zum Beispiel: Unterkunft, Buchungsnummer, Abfahrtszeit …">${escapeHtml(note)}</textarea>
        <p class="note-save-hint">Wird automatisch in diesem Browser gespeichert.</p>
      </section>
      <a class="dialog-map-link" href="${mapUrl(day.mapQuery)}" target="_blank" rel="noopener noreferrer">In Google Maps anzeigen <span aria-hidden="true">↗</span></a>
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

  function focusStage(number, openDetails) {
    activeStageFilter = "all";
    renderStages();
    updateFilterButtons();
    const card = document.querySelector(`[data-stage="${number}"]`);
    card?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (openDetails) window.setTimeout(() => openStage(number), 360);
  }

  function getChecklistState() {
    return loadState(checklistStorageKey, {});
  }

  function saveChecklistState(state) {
    saveState(checklistStorageKey, state);
  }

  function renderChecklist() {
    const state = getChecklistState();
    $("#checklist").innerHTML = data.checklist.map((item, index) => {
      const id = `check-${index}`;
      const checked = state[index] ? " checked" : "";
      return `<li><input id="${id}" type="checkbox" data-check-index="${index}"${checked}><label for="${id}">${escapeHtml(item)}</label></li>`;
    }).join("");
  }

  function updateFilterButtons() {
    $$('[data-stage-filter]').forEach((button) => {
      const active = button.dataset.stageFilter === activeStageFilter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function updateTaskStatus(taskId, status) {
    const state = getPlannerState();
    state.taskStatus[taskId] = status;
    saveState(plannerStorageKey, state);
    renderPlanning();
  }

  function updateDayStatus(number, status) {
    const state = getPlannerState();
    state.dayStatus[number] = status;
    saveState(plannerStorageKey, state);
    renderStages();
  }

  function updateDayNote(number, note) {
    const state = getPlannerState();
    state.notes[number] = note;
    saveState(plannerStorageKey, state);
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
      const routeButton = event.target.closest("[data-route-day]");
      const jumpButton = event.target.closest("[data-jump-stage]");
      const filterButton = event.target.closest("[data-stage-filter]");

      if (stageButton) openStage(stageButton.dataset.openStage);
      if (routeButton) focusStage(routeButton.dataset.routeDay, true);
      if (jumpButton) focusStage(jumpButton.dataset.jumpStage, false);
      if (filterButton) {
        activeStageFilter = filterButton.dataset.stageFilter;
        renderStages();
        updateFilterButtons();
      }
      if (event.target.closest("[data-close-dialog]")) closeStage();
      if (event.target.closest("[data-print]")) window.print();
      if (event.target.closest("[data-reset-checklist]")) {
        saveChecklistState({});
        renderChecklist();
      }
    });

    document.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-check-index]");
      const taskSelect = event.target.closest("[data-task-status]");
      const daySelect = event.target.closest("[data-day-status]");
      if (checkbox) {
        const state = getChecklistState();
        state[checkbox.dataset.checkIndex] = checkbox.checked;
        saveChecklistState(state);
      }
      if (taskSelect) updateTaskStatus(taskSelect.dataset.taskStatus, taskSelect.value);
      if (daySelect) updateDayStatus(daySelect.dataset.dayStatus, daySelect.value);
    });

    document.addEventListener("input", (event) => {
      const note = event.target.closest("[data-day-note]");
      if (note) updateDayNote(note.dataset.dayNote, note.value);
    });

    stageDialog?.addEventListener("click", (event) => {
      if (event.target === stageDialog) closeStage();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeStage();
    });
  }

  renderTripFacts();
  renderRoute();
  renderPlanning();
  renderStages();
  renderChecklist();
  bindEvents();
}());

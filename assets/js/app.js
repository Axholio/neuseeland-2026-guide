(function () {
  "use strict";

  const data = window.tripData;
  if (!data) return;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const stageDialog = $("#stage-dialog");
  const checklistStorageKey = "nz-2026-checklist-v41b";
  const plannerStorageKey = "nz-2026-planner-v41b";
  const bookingStorageKey = "nz-2026-bookings-v41c";
  const budgetStorageKey = "nz-2026-budget-v41d";
  const backupSchema = "nz-2026-guide-backup";
  const backupVersion = 1;
  const localStorageKeys = [checklistStorageKey, plannerStorageKey, bookingStorageKey, budgetStorageKey];
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

  function formatNzd(amount) {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "NZD",
      maximumFractionDigits: 0
    }).format(amount);
  }

  function amountValue(value) {
    const normalized = String(value || "").trim().replace(",", ".");
    const amount = Number(normalized);
    return Number.isFinite(amount) && amount > 0 ? amount : 0;
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
    renderBookings();
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

  function getBookingState() {
    return loadState(bookingStorageKey, {});
  }

  function getBooking(taskId) {
    const state = getBookingState();
    return state[taskId] || {};
  }

  function bookingIsFilled(booking) {
    return Boolean(booking.provider || booking.reference || booking.amount || booking.note);
  }

  function renderBookingSummary() {
    const state = getBookingState();
    const records = data.planning.map((task) => state[task.id] || {});
    const filled = records.filter(bookingIsFilled).length;
    const amount = records.reduce((sum, booking) => sum + amountValue(booking.amount), 0);
    const confirmed = data.planning.filter((task) => {
      const status = getTaskStatus(task);
      return status === "gebucht" || status === "erledigt";
    }).length;

    $("#booking-summary").innerHTML = `
      <article class="booking-stat"><strong>${filled}/${data.planning.length}</strong><span>Dokumentiert</span></article>
      <article class="booking-stat"><strong>${confirmed}</strong><span>Gebucht / erledigt</span></article>
      <article class="booking-stat"><strong>${amount ? formatNzd(amount) : "—"}</strong><span>Eingetragene Beträge</span></article>
    `;
  }

  function bookingField(task, field, label, type, value, extra = "") {
    const safeValue = escapeHtml(value || "");
    const common = `data-booking-id="${escapeHtml(task.id)}" data-booking-field="${escapeHtml(field)}"`;
    if (type === "textarea") {
      return `
        <label class="booking-field booking-field-wide">
          <span>${escapeHtml(label)}</span>
          <textarea ${common} rows="3" placeholder="Wichtige Hinweise, Uhrzeit, Treffpunkt …">${safeValue}</textarea>
        </label>
      `;
    }
    return `
      <label class="booking-field">
        <span>${escapeHtml(label)}</span>
        <input ${common} type="${type}" value="${safeValue}" ${extra}>
      </label>
    `;
  }

  function renderBookings() {
    renderBookingSummary();
    $("#booking-board").innerHTML = data.planning.map((task) => {
      const booking = getBooking(task.id);
      const status = getTaskStatus(task);
      const documentation = bookingIsFilled(booking) ? "Buchungsdaten gespeichert" : "Noch keine Buchungsdaten";
      return `
        <article class="booking-card" data-booking-card="${escapeHtml(task.id)}">
          <div class="booking-card-top">
            <div>
              <span class="booking-category">${escapeHtml(task.category)}</span>
              <h3>${escapeHtml(task.title)}</h3>
            </div>
            <div class="booking-card-meta">
              <span class="planning-day">Tag ${task.day}</span>
              <span class="status status-${escapeHtml(status)}">${escapeHtml(statusLabel(status))}</span>
            </div>
          </div>
          <p class="booking-card-note">${escapeHtml(task.note)}</p>
          <div class="booking-fields">
            ${bookingField(task, "provider", "Anbieter / Unterkunft", "text", booking.provider, 'autocomplete="organization"')}
            ${bookingField(task, "reference", "Bestätigungsnummer", "text", booking.reference, 'autocomplete="off"')}
            ${bookingField(task, "amount", "Betrag in NZD", "number", booking.amount, 'inputmode="decimal" min="0" step="0.01"')}
            ${bookingField(task, "note", "Persönliche Notiz", "textarea", booking.note)}
          </div>
          <footer class="booking-card-footer">
            <span class="booking-save-hint" data-booking-hint="${escapeHtml(task.id)}">${documentation}</span>
            <button class="booking-jump" type="button" data-jump-stage="${task.day}">Zur Etappe <span aria-hidden="true">→</span></button>
          </footer>
        </article>
      `;
    }).join("");
  }

  function updateBookingField(taskId, field, value) {
    const state = getBookingState();
    state[taskId] = { ...(state[taskId] || {}), [field]: value };
    saveState(bookingStorageKey, state);
    renderBookingSummary();
    const hint = document.querySelector(`[data-booking-hint="${taskId}"]`);
    if (hint) hint.textContent = bookingIsFilled(state[taskId]) ? "Buchungsdaten gespeichert" : "Noch keine Buchungsdaten";
  }

  function getBudgetState() {
    return loadState(budgetStorageKey, {});
  }

  function getBudgetRecord(categoryId) {
    const state = getBudgetState();
    return state[categoryId] || {};
  }

  function budgetField(category, field, label, type, value, extra = "") {
    const safeValue = escapeHtml(value || "");
    const common = `data-budget-id="${escapeHtml(category.id)}" data-budget-field="${escapeHtml(field)}"`;
    if (type === "textarea") {
      return `
        <label class="budget-field budget-field-wide">
          <span>${escapeHtml(label)}</span>
          <textarea ${common} rows="2" placeholder="Zum Beispiel: Anbieter, Datum, enthaltene Leistungen …">${safeValue}</textarea>
        </label>
      `;
    }
    return `
      <label class="budget-field">
        <span>${escapeHtml(label)}</span>
        <input ${common} type="${type}" value="${safeValue}" ${extra}>
      </label>
    `;
  }

  function budgetTotals() {
    const state = getBudgetState();
    return data.budget.reduce((totals, category) => {
      const record = state[category.id] || {};
      totals.planned += amountValue(record.planned);
      totals.actual += amountValue(record.actual);
      return totals;
    }, { planned: 0, actual: 0 });
  }

  function budgetValue(amount) {
    return amount > 0 ? formatNzd(amount) : "—";
  }

  function renderBudgetSummary() {
    const totals = budgetTotals();
    const remaining = totals.planned - totals.actual;
    const remainingLabel = totals.planned ? formatNzd(Math.abs(remaining)) : "—";
    const remainingText = totals.planned ? (remaining >= 0 ? "noch im Rahmen" : "über Plan") : "Planbudget fehlt";

    $("#budget-summary").innerHTML = `
      <article class="budget-stat"><strong>${budgetValue(totals.planned)}</strong><span>Planbudget</span></article>
      <article class="budget-stat"><strong>${budgetValue(totals.actual)}</strong><span>Erfasst</span></article>
      <article class="budget-stat ${remaining < 0 ? "is-over" : ""}"><strong>${remainingLabel}</strong><span>${remainingText}</span></article>
    `;
  }

  function renderBudget() {
    const state = getBudgetState();
    renderBudgetSummary();
    $("#budget-board").innerHTML = data.budget.map((category) => {
      const record = state[category.id] || {};
      const planned = amountValue(record.planned);
      const actual = amountValue(record.actual);
      const ratio = planned > 0 ? (actual / planned) * 100 : 0;
      const progress = Math.min(100, Math.round(ratio));
      const progressLabel = planned > 0 ? `${Math.round(ratio)} % des Planbudgets` : "Planbudget eintragen";
      const stateClass = planned > 0 && actual > planned ? "is-over" : "";
      return `
        <article class="budget-card ${stateClass}" data-budget-card="${escapeHtml(category.id)}">
          <div class="budget-card-top">
            <div>
              <span class="budget-category">Kostenblock</span>
              <h3>${escapeHtml(category.title)}</h3>
            </div>
            <span class="budget-progress-label">${escapeHtml(progressLabel)}</span>
          </div>
          <p class="budget-card-note">${escapeHtml(category.note)}</p>
          <div class="budget-fields">
            ${budgetField(category, "planned", "Planbudget in NZD", "number", record.planned, 'inputmode="decimal" min="0" step="0.01"')}
            ${budgetField(category, "actual", "Erfasst in NZD", "number", record.actual, 'inputmode="decimal" min="0" step="0.01"')}
            ${budgetField(category, "note", "Eigene Notiz", "textarea", record.note)}
          </div>
          <div class="budget-meter" aria-label="${escapeHtml(progressLabel)}">
            <span style="width: ${progress}%"></span>
          </div>
        </article>
      `;
    }).join("");
  }

  function updateBudgetField(categoryId, field, value) {
    const state = getBudgetState();
    state[categoryId] = { ...(state[categoryId] || {}), [field]: value };
    saveState(budgetStorageKey, state);
    renderBudgetSummary();

    if (field === "planned" || field === "actual") {
      const category = data.budget.find((item) => item.id === categoryId);
      const card = document.querySelector(`[data-budget-card="${categoryId}"]`);
      if (!category || !card) return;
      const record = state[categoryId] || {};
      const planned = amountValue(record.planned);
      const actual = amountValue(record.actual);
      const ratio = planned > 0 ? (actual / planned) * 100 : 0;
      const progress = Math.min(100, Math.round(ratio));
      const label = planned > 0 ? `${Math.round(ratio)} % des Planbudgets` : "Planbudget eintragen";
      card.classList.toggle("is-over", planned > 0 && actual > planned);
      const progressLabel = $(".budget-progress-label", card);
      const meter = $(".budget-meter", card);
      if (progressLabel) progressLabel.textContent = label;
      if (meter) {
        meter.setAttribute("aria-label", label);
        const bar = $("span", meter);
        if (bar) bar.style.width = `${progress}%`;
      }
    }
  }


  function savedEntryCount() {
    const planner = getPlannerState();
    const booking = getBookingState();
    const budget = getBudgetState();
    const checklist = getChecklistState();
    const plannerCount = Object.keys(planner.taskStatus || {}).length + Object.keys(planner.dayStatus || {}).length + Object.keys(planner.notes || {}).filter((key) => planner.notes[key]).length;
    const bookingCount = Object.values(booking).filter(bookingIsFilled).length;
    const budgetCount = Object.values(budget).filter((record) => record && (record.planned || record.actual || record.note)).length;
    const checklistCount = Object.values(checklist).filter(Boolean).length;
    return { planner: plannerCount, booking: bookingCount, budget: budgetCount, checklist: checklistCount };
  }

  function renderBackupSummary() {
    const target = $("#backup-summary");
    if (!target) return;
    const count = savedEntryCount();
    target.innerHTML = `
      <article class="backup-stat"><strong>${count.planner}</strong><span>Planungseinträge</span></article>
      <article class="backup-stat"><strong>${count.booking + count.budget}</strong><span>Buchungs- & Kosteneinträge</span></article>
      <article class="backup-stat"><strong>${count.checklist}</strong><span>Packliste erledigt</span></article>
    `;
  }

  function setBackupStatus(message, type = "") {
    const target = $("#backup-status");
    if (!target) return;
    target.textContent = message;
    target.className = `backup-status${type ? ` is-${type}` : ""}`;
  }

  function backupPayload() {
    return {
      schema: backupSchema,
      version: backupVersion,
      createdAt: new Date().toISOString(),
      tripVersion: data.meta.version,
      state: {
        checklist: getChecklistState(),
        planner: getPlannerState(),
        bookings: getBookingState(),
        budget: getBudgetState()
      }
    };
  }

  function downloadBackup() {
    try {
      const payload = JSON.stringify(backupPayload(), null, 2);
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `neuseeland-2026-sicherung-${date}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setBackupStatus("Sicherungsdatei wurde erstellt.", "success");
    } catch (_) {
      setBackupStatus("Die Sicherungsdatei konnte nicht erstellt werden.", "error");
    }
  }

  function plainObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function refreshLocalViews() {
    renderPlanning();
    renderBookings();
    renderBudget();
    renderStages();
    renderChecklist();
    renderBackupSummary();
  }

  function importBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const payload = JSON.parse(String(event.target?.result || ""));
        if (!payload || payload.schema !== backupSchema || payload.version !== backupVersion || !plainObject(payload.state)) {
          throw new Error("invalid-backup");
        }
        const state = payload.state;
        saveChecklistState(plainObject(state.checklist));
        saveState(plannerStorageKey, plainObject(state.planner));
        saveState(bookingStorageKey, plainObject(state.bookings));
        saveState(budgetStorageKey, plainObject(state.budget));
        closeStage();
        refreshLocalViews();
        setBackupStatus("Sicherungsdatei wurde eingespielt. Vorherige lokale Eingaben wurden ersetzt.", "success");
      } catch (_) {
        setBackupStatus("Diese Datei ist keine gültige Sicherungsdatei dieses Reiseführers.", "error");
      }
    };
    reader.onerror = () => setBackupStatus("Die Sicherungsdatei konnte nicht gelesen werden.", "error");
    reader.readAsText(file, "utf-8");
  }

  function clearLocalData() {
    if (!window.confirm("Alle persönlichen Eingaben in diesem Browser löschen? Die Reiseplanung selbst bleibt erhalten.")) return;
    try {
      localStorageKeys.forEach((key) => localStorage.removeItem(key));
      closeStage();
      refreshLocalViews();
      setBackupStatus("Alle lokalen Eingaben wurden aus diesem Browser entfernt.", "success");
    } catch (_) {
      setBackupStatus("Lokale Eingaben konnten nicht vollständig entfernt werden.", "error");
    }
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
        renderBackupSummary();
      }
      if (event.target.closest("[data-reset-budget]")) {
        saveState(budgetStorageKey, {});
        renderBudget();
        renderBackupSummary();
      }
      if (event.target.closest("[data-export-state]")) downloadBackup();
      if (event.target.closest("[data-select-import]")) $("#backup-import")?.click();
      if (event.target.closest("[data-clear-local]")) clearLocalData();
    });

    document.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-check-index]");
      const taskSelect = event.target.closest("[data-task-status]");
      const daySelect = event.target.closest("[data-day-status]");
      const backupImport = event.target.closest("[data-backup-import]");
      if (checkbox) {
        const state = getChecklistState();
        state[checkbox.dataset.checkIndex] = checkbox.checked;
        saveChecklistState(state);
        renderBackupSummary();
      }
      if (taskSelect) {
        updateTaskStatus(taskSelect.dataset.taskStatus, taskSelect.value);
        renderBackupSummary();
      }
      if (daySelect) {
        updateDayStatus(daySelect.dataset.dayStatus, daySelect.value);
        renderBackupSummary();
      }
      if (backupImport) {
        importBackup(backupImport.files?.[0]);
        backupImport.value = "";
      }
    });

    document.addEventListener("input", (event) => {
      const note = event.target.closest("[data-day-note]");
      const bookingField = event.target.closest("[data-booking-field]");
      const budgetField = event.target.closest("[data-budget-field]");
      if (note) {
        updateDayNote(note.dataset.dayNote, note.value);
        renderBackupSummary();
      }
      if (bookingField) {
        updateBookingField(bookingField.dataset.bookingId, bookingField.dataset.bookingField, bookingField.value);
        renderBackupSummary();
      }
      if (budgetField) {
        updateBudgetField(budgetField.dataset.budgetId, budgetField.dataset.budgetField, budgetField.value);
        renderBackupSummary();
      }
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
  renderBookings();
  renderBudget();
  renderStages();
  renderChecklist();
  renderBackupSummary();
  bindEvents();
}());

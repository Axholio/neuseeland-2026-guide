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
  const driveStorageKey = "nz-2026-drive-v43";
  const weatherStorageKey = "nz-2026-weather-v44";
  const backupSchema = "nz-2026-guide-backup";
  const backupVersion = 1;
  const localStorageKeys = [checklistStorageKey, plannerStorageKey, bookingStorageKey, budgetStorageKey, driveStorageKey, weatherStorageKey];
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


  function getDriveState() {
    const state = loadState(driveStorageKey, { activeDay: 1, days: {} });
    return {
      activeDay: Number(state.activeDay) || 1,
      days: state.days && typeof state.days === "object" && !Array.isArray(state.days) ? state.days : {}
    };
  }

  function driveRecord(dayNumber) {
    const state = getDriveState();
    const record = state.days[dayNumber] && typeof state.days[dayNumber] === "object" ? state.days[dayNumber] : {};
    return {
      checks: record.checks && typeof record.checks === "object" && !Array.isArray(record.checks) ? record.checks : {},
      startTime: record.startTime || "",
      mileageStart: record.mileageStart || "",
      mileageEnd: record.mileageEnd || "",
      note: record.note || ""
    };
  }

  function driveRecordHasEntry(record) {
    return Boolean(record.startTime || record.mileageStart || record.mileageEnd || record.note || Object.values(record.checks || {}).some(Boolean));
  }

  function isDriveReady(record) {
    return data.driveCheck.every((item) => record.checks && record.checks[item.id]);
  }

  function mileageDifference(record) {
    const start = Number(String(record.mileageStart || "").replace(",", "."));
    const end = Number(String(record.mileageEnd || "").replace(",", "."));
    const difference = end - start;
    return Number.isFinite(difference) && difference >= 0 && difference <= 1200 ? difference : 0;
  }

  function driveStats() {
    const records = data.days.map((day) => driveRecord(day.number));
    const ready = records.filter(isDriveReady).length;
    const started = records.filter(driveRecordHasEntry).length;
    const kilometres = records.reduce((sum, record) => sum + mileageDifference(record), 0);
    return { ready, started, kilometres };
  }

  function renderDriveSummary() {
    const stats = driveStats();
    const missing = data.days.length - stats.ready;
    $("#drive-summary").innerHTML = `
      <article class="drive-stat"><strong>${stats.ready}</strong><span>Tageschecks vollständig</span></article>
      <article class="drive-stat"><strong>${stats.started}</strong><span>Tage mit Eintrag</span></article>
      <article class="drive-stat"><strong>${stats.kilometres > 0 ? `${Math.round(stats.kilometres)} km` : "—"}</strong><span>erfasste Kilometer</span></article>
      <article class="drive-stat"><strong>${missing}</strong><span>noch offen</span></article>
    `;
  }

  function renderDrive() {
    const state = getDriveState();
    const activeDay = data.days.find((day) => day.number === state.activeDay) || data.days[0];
    const record = driveRecord(activeDay.number);
    renderDriveSummary();

    $("#drive-day-picker").innerHTML = data.days.map((day) => {
      const dayRecord = driveRecord(day.number);
      const stateLabel = isDriveReady(dayRecord) ? "bereit" : driveRecordHasEntry(dayRecord) ? "in Arbeit" : "offen";
      return `
        <button class="drive-day-button${day.number === activeDay.number ? " is-active" : ""}${isDriveReady(dayRecord) ? " is-ready" : ""}" type="button" data-drive-day="${day.number}" aria-pressed="${day.number === activeDay.number}">
          <span>Tag ${day.number}</span>
          <small>${escapeHtml(stateLabel)}</small>
        </button>
      `;
    }).join("");

    $("#drive-card").innerHTML = `
      <div class="drive-card-heading">
        <div>
          <span class="drive-kicker">Tag ${activeDay.number} · ${escapeHtml(activeDay.date)}</span>
          <h3>${escapeHtml(activeDay.route)}</h3>
          <p>${escapeHtml(activeDay.drive)} · ${escapeHtml(activeDay.distance)}</p>
        </div>
        <a class="drive-map-link" href="${mapUrl(activeDay.mapQuery)}" target="_blank" rel="noopener noreferrer">Route öffnen <span aria-hidden="true">↗</span></a>
      </div>
      <div class="drive-checks" role="group" aria-label="Tagescheck für Tag ${activeDay.number}">
        ${data.driveCheck.map((item) => `
          <label class="drive-check${record.checks[item.id] ? " is-checked" : ""}">
            <input type="checkbox" data-drive-check="${escapeHtml(item.id)}" data-drive-day-number="${activeDay.number}"${record.checks[item.id] ? " checked" : ""}>
            <span>${escapeHtml(item.label)}</span>
          </label>
        `).join("")}
      </div>
      <div class="drive-fields">
        <label class="drive-field">
          <span>Abfahrt</span>
          <input type="time" value="${escapeHtml(record.startTime)}" data-drive-field="startTime" data-drive-day-number="${activeDay.number}">
        </label>
        <label class="drive-field">
          <span>Km-Stand Start</span>
          <input type="number" min="0" step="1" inputmode="numeric" placeholder="z. B. 12480" value="${escapeHtml(record.mileageStart)}" data-drive-field="mileageStart" data-drive-day-number="${activeDay.number}">
        </label>
        <label class="drive-field">
          <span>Km-Stand Ende</span>
          <input type="number" min="0" step="1" inputmode="numeric" placeholder="z. B. 12635" value="${escapeHtml(record.mileageEnd)}" data-drive-field="mileageEnd" data-drive-day-number="${activeDay.number}">
        </label>
        <label class="drive-field drive-field-wide">
          <span>Tagesnotiz</span>
          <textarea rows="3" placeholder="Wetter, Tankstopp, Unterkunft, Besonderheiten …" data-drive-field="note" data-drive-day-number="${activeDay.number}">${escapeHtml(record.note)}</textarea>
        </label>
      </div>
      <p class="drive-save-hint">Alle Angaben werden automatisch lokal in diesem Browser gespeichert.</p>
    `;
  }

  function setActiveDriveDay(dayNumber) {
    const state = getDriveState();
    state.activeDay = Number(dayNumber);
    saveState(driveStorageKey, state);
    renderDrive();
  }

  function updateDriveCheck(dayNumber, checkId, checked) {
    const state = getDriveState();
    const record = driveRecord(dayNumber);
    record.checks[checkId] = checked;
    state.days[dayNumber] = record;
    saveState(driveStorageKey, state);
    renderDrive();
    renderBackupSummary();
  }

  function updateDriveField(dayNumber, field, value) {
    const state = getDriveState();
    const record = driveRecord(dayNumber);
    record[field] = value;
    state.days[dayNumber] = record;
    saveState(driveStorageKey, state);
    renderDriveSummary();
    renderBackupSummary();
  }

  function resetDrive() {
    if (!window.confirm("Alle Fahrtag-Einträge in diesem Browser löschen?")) return;
    saveState(driveStorageKey, { activeDay: 1, days: {} });
    renderDrive();
    renderBackupSummary();
  }



  function getWeatherState() {
    return loadState(weatherStorageKey, {});
  }

  function weatherRecord(windowId) {
    const state = getWeatherState();
    const record = state[windowId] && typeof state[windowId] === "object" ? state[windowId] : {};
    const permitted = ["open", "good", "mixed", "critical", "plan-b"];
    return {
      status: permitted.includes(record.status) ? record.status : "open",
      checkedAt: record.checkedAt || "",
      note: record.note || ""
    };
  }

  function weatherStatusLabel(status) {
    const labels = {
      open: "noch prüfen",
      good: "günstig",
      mixed: "wechselhaft",
      critical: "kritisch",
      "plan-b": "Plan B"
    };
    return labels[status] || labels.open;
  }

  function weatherStatusOptions(selected) {
    return ["open", "good", "mixed", "critical", "plan-b"].map((value) =>
      `<option value="${value}"${value === selected ? " selected" : ""}>${weatherStatusLabel(value)}</option>`
    ).join("");
  }

  function weatherStats() {
    const records = data.weatherWindows.map((window) => weatherRecord(window.id));
    return {
      checked: records.filter((record) => record.status !== "open").length,
      good: records.filter((record) => record.status === "good").length,
      action: records.filter((record) => record.status === "critical" || record.status === "plan-b").length,
      open: records.filter((record) => record.status === "open").length
    };
  }

  function weatherWindowHasEntry(record) {
    return Boolean(record.status !== "open" || record.checkedAt || record.note);
  }

  function renderWeatherSummary() {
    const stats = weatherStats();
    const target = $("#weather-summary");
    if (!target) return;
    target.innerHTML = `
      <article class="weather-stat"><strong>${stats.checked}/${data.weatherWindows.length}</strong><span>bewertet</span></article>
      <article class="weather-stat"><strong>${stats.good}</strong><span>günstige Fenster</span></article>
      <article class="weather-stat${stats.action ? " is-action" : ""}"><strong>${stats.action}</strong><span>Plan B / kritisch</span></article>
      <article class="weather-stat"><strong>${stats.open}</strong><span>noch prüfen</span></article>
    `;
  }

  function renderWeather() {
    const target = $("#weather-board");
    if (!target || !Array.isArray(data.weatherWindows)) return;
    renderWeatherSummary();
    target.innerHTML = data.weatherWindows.map((window) => {
      const record = weatherRecord(window.id);
      return `
        <article class="weather-card status-${escapeHtml(record.status)}" data-weather-card="${escapeHtml(window.id)}">
          <div class="weather-card-top">
            <div>
              <span class="weather-region">${escapeHtml(window.region)}</span>
              <h3>${escapeHtml(window.title)}</h3>
            </div>
            <span class="weather-day">Tag ${escapeHtml(window.day)}</span>
          </div>
          <p class="weather-priority">${escapeHtml(window.priority)}</p>
          <div class="weather-plans">
            <p><span>Plan A</span>${escapeHtml(window.planA)}</p>
            <p><span>Plan B</span>${escapeHtml(window.planB)}</p>
          </div>
          <div class="weather-fields">
            <label class="weather-field">
              <span>Lage</span>
              <select data-weather-id="${escapeHtml(window.id)}" data-weather-field="status">${weatherStatusOptions(record.status)}</select>
            </label>
            <label class="weather-field">
              <span>Geprüft am</span>
              <input type="datetime-local" value="${escapeHtml(record.checkedAt)}" data-weather-id="${escapeHtml(window.id)}" data-weather-field="checkedAt">
            </label>
            <label class="weather-field weather-field-wide">
              <span>Entscheidung / Notiz</span>
              <textarea rows="2" placeholder="Quelle, Uhrzeit, Ersatzplan oder Buchungsentscheidung …" data-weather-id="${escapeHtml(window.id)}" data-weather-field="note">${escapeHtml(record.note)}</textarea>
            </label>
          </div>
          <footer class="weather-card-footer">
            <span class="weather-save-hint">Wird automatisch lokal gespeichert.</span>
            <button class="weather-jump" type="button" data-jump-stage="${escapeHtml(window.day)}">Zur Etappe <span aria-hidden="true">→</span></button>
          </footer>
        </article>
      `;
    }).join("");
  }

  function updateWeatherField(windowId, field, value) {
    const state = getWeatherState();
    const allowedFields = ["status", "checkedAt", "note"];
    if (!allowedFields.includes(field)) return;
    state[windowId] = { ...(state[windowId] || {}), [field]: value };
    saveState(weatherStorageKey, state);
    renderWeatherSummary();
    renderBackupSummary();

    if (field === "status") {
      const card = document.querySelector(`[data-weather-card="${windowId}"]`);
      if (card) {
        card.classList.remove("status-open", "status-good", "status-mixed", "status-critical", "status-plan-b");
        card.classList.add(`status-${value}`);
      }
    }
  }

  function resetWeather() {
    if (!window.confirm("Alle Wetterfenster-Einträge in diesem Browser löschen?")) return;
    saveState(weatherStorageKey, {});
    renderWeather();
    renderBackupSummary();
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
    const drive = getDriveState();
    const weather = getWeatherState();
    const plannerCount = Object.keys(planner.taskStatus || {}).length + Object.keys(planner.dayStatus || {}).length + Object.keys(planner.notes || {}).filter((key) => planner.notes[key]).length;
    const bookingCount = Object.values(booking).filter(bookingIsFilled).length;
    const budgetCount = Object.values(budget).filter((record) => record && (record.planned || record.actual || record.note)).length;
    const checklistCount = Object.values(checklist).filter(Boolean).length;
    const driveCount = Object.values(drive.days || {}).filter((record) => driveRecordHasEntry({
      checks: record && record.checks,
      startTime: record && record.startTime,
      mileageStart: record && record.mileageStart,
      mileageEnd: record && record.mileageEnd,
      note: record && record.note
    })).length;
    const weatherCount = Array.isArray(data.weatherWindows) ? data.weatherWindows.filter((window) => weatherWindowHasEntry(weatherRecord(window.id))).length : 0;
    return { planner: plannerCount, booking: bookingCount, budget: budgetCount, checklist: checklistCount, drive: driveCount, weather: weatherCount };
  }

  function renderBackupSummary() {
    const target = $("#backup-summary");
    if (!target) return;
    const count = savedEntryCount();
    target.innerHTML = `
      <article class="backup-stat"><strong>${count.planner}</strong><span>Planungseinträge</span></article>
      <article class="backup-stat"><strong>${count.booking + count.budget}</strong><span>Buchungs- & Kosteneinträge</span></article>
      <article class="backup-stat"><strong>${count.drive}</strong><span>Fahrtage erfasst</span></article>
      <article class="backup-stat"><strong>${count.weather}</strong><span>Wetterfenster bewertet</span></article>
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
        budget: getBudgetState(),
        drive: getDriveState(),
        weather: getWeatherState()
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
    renderDrive();
    renderWeather();
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
        saveState(driveStorageKey, plainObject(state.drive));
        saveState(weatherStorageKey, plainObject(state.weather));
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
      const driveDayButton = event.target.closest("[data-drive-day]");

      if (stageButton) openStage(stageButton.dataset.openStage);
      if (routeButton) focusStage(routeButton.dataset.routeDay, true);
      if (jumpButton) focusStage(jumpButton.dataset.jumpStage, false);
      if (filterButton) {
        activeStageFilter = filterButton.dataset.stageFilter;
        renderStages();
        updateFilterButtons();
      }
      if (driveDayButton) setActiveDriveDay(driveDayButton.dataset.driveDay);
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
      if (event.target.closest("[data-reset-drive]")) resetDrive();
      if (event.target.closest("[data-reset-weather]")) resetWeather();
      if (event.target.closest("[data-export-state]")) downloadBackup();
      if (event.target.closest("[data-select-import]")) $("#backup-import")?.click();
      if (event.target.closest("[data-clear-local]")) clearLocalData();
    });

    document.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-check-index]");
      const taskSelect = event.target.closest("[data-task-status]");
      const daySelect = event.target.closest("[data-day-status]");
      const backupImport = event.target.closest("[data-backup-import]");
      const driveCheck = event.target.closest("[data-drive-check]");
      const weatherField = event.target.closest("[data-weather-field]");
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
      if (driveCheck) updateDriveCheck(driveCheck.dataset.driveDayNumber, driveCheck.dataset.driveCheck, driveCheck.checked);
      if (weatherField) updateWeatherField(weatherField.dataset.weatherId, weatherField.dataset.weatherField, weatherField.value);
    });

    document.addEventListener("input", (event) => {
      const note = event.target.closest("[data-day-note]");
      const bookingField = event.target.closest("[data-booking-field]");
      const budgetField = event.target.closest("[data-budget-field]");
      const driveField = event.target.closest("[data-drive-field]");
      const weatherField = event.target.closest("[data-weather-field]");
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
      if (driveField) updateDriveField(driveField.dataset.driveDayNumber, driveField.dataset.driveField, driveField.value);
      if (weatherField) updateWeatherField(weatherField.dataset.weatherId, weatherField.dataset.weatherField, weatherField.value);
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
  renderDrive();
  renderWeather();
  renderStages();
  renderChecklist();
  renderBackupSummary();
  bindEvents();
}());

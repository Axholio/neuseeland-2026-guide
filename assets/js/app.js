(function () {
  "use strict";

  const data = window.tripData;
  if (!data) return;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const stageDialog = $("#stage-dialog");
  const checklistStorageKey = "nz-2026-checklist-v45";
  const plannerStorageKey = "nz-2026-planner-v45";
  const bookingStorageKey = "nz-2026-bookings-v45";
  const budgetStorageKey = "nz-2026-budget-v45";
  const driveStorageKey = "nz-2026-drive-v45";
  const weatherStorageKey = "nz-2026-weather-v45";
  const stayStorageKey = "nz-2026-stays-v46";
  const briefingStorageKey = "nz-2026-briefing-v47";
  const rentalStorageKey = "nz-2026-rental-v48";
  const documentsStorageKey = "nz-2026-documents-v49";
  const backupSchema = "nz-2026-guide-backup";
  const backupVersion = 4;
  const localStorageKeys = [checklistStorageKey, plannerStorageKey, bookingStorageKey, budgetStorageKey, driveStorageKey, weatherStorageKey, stayStorageKey, briefingStorageKey, rentalStorageKey, documentsStorageKey];
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

  function safeExternalUrl(value) {
    const raw = String(value || "").trim();
    if (raw.startsWith("#")) return raw;
    try {
      const url = new URL(raw, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function resourceLinksFor(collection, key) {
    const source = data.externalLinks && data.externalLinks[collection];
    if (!source) return [];
    if (Array.isArray(source)) return source;
    if (!key) return [];
    const links = source[key] || source[String(key)] || [];
    return Array.isArray(links) ? links : [];
  }

  function linkIcon(type) {
    const icons = {
      map: "⌖",
      road: "↗",
      weather: "☁",
      track: "⌁",
      rail: "↹",
      airport: "✈",
      activity: "◌",
      document: "▣",
      internal: "→"
    };
    return icons[type] || "↗";
  }

  function resourceLinksMarkup(links, options = {}) {
    const seenUrls = new Set();
    const validLinks = (Array.isArray(links) ? links : [])
      .map((link) => ({ ...link, safeUrl: safeExternalUrl(link && link.url) }))
      .filter((link) => {
        if (!link.safeUrl || seenUrls.has(link.safeUrl)) return false;
        seenUrls.add(link.safeUrl);
        return true;
      });
    if (!validLinks.length) return "";

    const title = options.title ? `<p class="resource-links-title">${escapeHtml(options.title)}</p>` : "";
    const modifier = options.compact ? " resource-links-compact" : "";
    const className = options.className ? ` ${escapeHtml(options.className)}` : "";
    return `
      <section class="resource-links${modifier}${className}" aria-label="${escapeHtml(options.ariaLabel || options.title || "Weiterführende Links")}">
        ${title}
        <div class="resource-link-list">
          ${validLinks.map((link) => {
            const internal = link.safeUrl.startsWith("#");
            const target = internal ? "" : ' target="_blank" rel="noopener noreferrer"';
            const openMark = internal ? "→" : "↗";
            return `
              <a class="resource-link resource-link-${escapeHtml(link.type || "default")}" href="${escapeHtml(link.safeUrl)}"${target}>
                <span class="resource-link-icon" aria-hidden="true">${linkIcon(link.type)}</span>
                <span class="resource-link-copy"><strong>${escapeHtml(link.label || "Link öffnen")}</strong>${link.note ? `<small>${escapeHtml(link.note)}</small>` : ""}</span>
                <span class="resource-link-open" aria-hidden="true">${openMark}</span>
              </a>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function dayLinks(day) {
    if (!day) return [];
    return [
      { label: "Route in Google Maps", note: "Navigation und Übersicht der Tagesetappe", url: mapUrl(day.mapQuery), type: "map" },
      ...resourceLinksFor("days", day.number)
    ];
  }

  function dayResourceLinks(day, options = {}) {
    return resourceLinksMarkup(dayLinks(day), {
      title: options.title || "Direkt öffnen",
      compact: Boolean(options.compact),
      className: options.className || "",
      ariaLabel: options.ariaLabel || `Links für Tag ${day && day.number ? day.number : ""}`
    });
  }

  function uniqueLinks(links) {
    const seen = new Set();
    return (Array.isArray(links) ? links : []).filter((link) => {
      const safeUrl = safeExternalUrl(link && link.url);
      if (!safeUrl || seen.has(safeUrl)) return false;
      seen.add(safeUrl);
      return true;
    });
  }

  function stageLinkLabel(link) {
    const labels = {
      map: "Karte",
      road: "Straße",
      weather: "Wetter",
      track: "DOC",
      rail: "Zug",
      airport: "Flughafen",
      activity: "Aktivität",
      document: "Unterlagen",
      internal: "Öffnen"
    };
    return labels[link && link.type] || "Link";
  }

  function stageQuickLinks(day) {
    const links = uniqueLinks(dayLinks(day)).slice(0, 3);
    if (!links.length) return "";
    return `
      <nav class="stage-quick-links" aria-label="Direktlinks für Tag ${escapeHtml(day.number)}">
        ${links.map((link) => {
          const url = safeExternalUrl(link.url);
          const internal = url.startsWith("#");
          const target = internal ? "" : ' target="_blank" rel="noopener noreferrer"';
          return `<a class="stage-quick-link stage-quick-link-${escapeHtml(link.type || "default")}" href="${escapeHtml(url)}"${target} title="${escapeHtml(link.label || "Link öffnen")}"><span aria-hidden="true">${linkIcon(link.type)}</span>${escapeHtml(stageLinkLabel(link))}</a>`;
        }).join("")}
      </nav>
    `;
  }

  function collectExternalLinks(source) {
    const links = [];
    const visit = (value) => {
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (!value || typeof value !== "object") return;
      if (Object.prototype.hasOwnProperty.call(value, "url")) {
        links.push(value);
        return;
      }
      Object.values(value).forEach(visit);
    };
    visit(source);
    return links;
  }

  function linkAudit() {
    const configured = collectExternalLinks(data.externalLinks || {});
    const mapLinks = (Array.isArray(data.days) ? data.days : []).map((day) => ({
      label: `Route in Google Maps · Tag ${day.number}`,
      url: mapUrl(day.mapQuery),
      type: "map"
    }));
    const links = [...configured, ...mapLinks];
    const valid = links.filter((link) => Boolean(safeExternalUrl(link.url)));
    const external = valid.filter((link) => !safeExternalUrl(link.url).startsWith("#"));
    const domains = new Set(external.map((link) => {
      try { return new URL(safeExternalUrl(link.url)).hostname; } catch (_) { return ""; }
    }).filter(Boolean));
    const dayCoverage = (Array.isArray(data.days) ? data.days : []).filter((day) => dayLinks(day).length >= 2).length;
    return {
      total: valid.length,
      invalid: links.length - valid.length,
      sources: domains.size,
      dayCoverage,
      totalDays: Array.isArray(data.days) ? data.days.length : 0
    };
  }

  function renderLinkAudit() {
    const target = $("#link-audit-panel");
    if (!target) return;
    const audit = linkAudit();
    const details = data.linkAudit || {};
    const safeChecked = escapeHtml(details.checked || data.meta.updated || "Projektstand");
    const safeScope = escapeHtml(details.scope || "Operative Reise-Links");
    const safeNote = escapeHtml(details.note || "Aktuelle Bedingungen sind auf den externen Quellen verbindlich.");
    target.innerHTML = `
      <div class="link-audit-copy">
        <span>Link-Audit · ${safeChecked}</span>
        <h3>Direktzugriff vollständig hinterlegt</h3>
        <p>${safeScope}. ${safeNote}</p>
      </div>
      <dl class="link-audit-stats">
        <div><dt>${audit.total}</dt><dd>operative Links</dd></div>
        <div><dt>${audit.sources}</dt><dd>externe Quellen</dd></div>
        <div><dt>${audit.dayCoverage}/${audit.totalDays}</dt><dd>Tage mit Direktlinks</dd></div>
        <div><dt>${audit.invalid ? audit.invalid : "0"}</dt><dd>ungültige Ziele</dd></div>
      </dl>
    `;
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
      ["Zeitraum", data.meta.dateRange || data.meta.subtitle],
      ["Dauer", `${data.meta.totalDays} Tage · ${data.meta.totalNights} Nächte`],
      ["Fahrstrecke", data.meta.totalDistance],
      ["Abschluss", data.meta.returnInfo || "Rückgabe & Abflug"]
    ];
    $("#trip-facts").innerHTML = facts.map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
    $("#updated-date").textContent = data.meta.updated;
  }

  function routeClass(day) {
    if (day.routeKind) return day.routeKind;
    if (day.number === data.days.length) return "return";
    return "road";
  }

  function renderRoute() {
    const track = $("#route-track");
    track.style.setProperty("--route-days", data.days.length);
    track.innerHTML = data.days.map((day) => `
      <button class="route-stop ${routeClass(day)}" type="button" data-route-day="${day.number}" title="Tag ${day.number}: ${escapeHtml(day.route)}">
        <span class="route-day">Tag ${day.number}</span>
        <span class="route-place">${escapeHtml(day.end)}</span>
      </button>
    `).join("");
  }

  function getBriefingState() {
    const state = loadState(briefingStorageKey, { activeDay: 1, days: {} });
    return {
      activeDay: Number(state.activeDay) || 1,
      days: state.days && typeof state.days === "object" && !Array.isArray(state.days) ? state.days : {}
    };
  }

  function briefingRecord(dayNumber) {
    const state = getBriefingState();
    const record = state.days[dayNumber] && typeof state.days[dayNumber] === "object" && !Array.isArray(state.days[dayNumber]) ? state.days[dayNumber] : {};
    return {
      status: record.status || "offen",
      departureTime: record.departureTime || "",
      arrivalTarget: record.arrivalTarget || "",
      focus: record.focus || "",
      checks: record.checks && typeof record.checks === "object" && !Array.isArray(record.checks) ? record.checks : {}
    };
  }

  function briefingRecordHasEntry(record) {
    return Boolean(
      record.departureTime || record.arrivalTarget || record.focus || (record.status && record.status !== "offen") || Object.values(record.checks || {}).some(Boolean)
    );
  }

  function briefingStatusLabel(status) {
    const labels = {
      offen: "offen",
      vorbereitet: "vorbereitet",
      bereit: "bereit",
      erledigt: "abgeschlossen"
    };
    return labels[status] || "offen";
  }

  function briefingStatusOptions(selected) {
    return ["offen", "vorbereitet", "bereit", "erledigt"]
      .map((value) => `<option value="${value}"${value === selected ? " selected" : ""}>${briefingStatusLabel(value)}</option>`)
      .join("");
  }

  function briefingChecks(day) {
    const driveRelevant = day.routeKind !== "arrival";
    return [
      { id: "priority", label: "Tagespriorität und Route angesehen" },
      { id: "weather", label: "Wetter-, Straßen- und Betreiberhinweise geprüft" },
      { id: "logistics", label: driveRelevant ? "Unterkunft, Ankunft und Ausrüstung geklärt" : "Unterkunft, Gepäck und Folgetag geklärt" }
    ];
  }

  function briefingStats() {
    const records = data.days.map((day) => briefingRecord(day.number));
    const ready = records.filter((record) => record.status === "bereit" || record.status === "erledigt").length;
    const prepared = records.filter(briefingRecordHasEntry).length;
    const timed = records.filter((record) => record.departureTime).length;
    const completed = data.days.filter((day) => briefingChecks(day).every((check) => briefingRecord(day.number).checks[check.id])).length;
    return { ready, prepared, timed, completed };
  }

  function renderBriefingSummary() {
    const target = $("#briefing-summary");
    if (!target) return;
    const stats = briefingStats();
    target.innerHTML = `
      <article class="briefing-stat"><strong>${stats.ready}</strong><span>startbereit</span></article>
      <article class="briefing-stat"><strong>${stats.prepared}</strong><span>Briefings angelegt</span></article>
      <article class="briefing-stat"><strong>${stats.timed}</strong><span>Abfahrtszeiten erfasst</span></article>
      <article class="briefing-stat"><strong>${stats.completed}</strong><span>Checks vollständig</span></article>
    `;
  }

  function renderBriefing() {
    const picker = $("#briefing-day-picker");
    const card = $("#briefing-card");
    if (!picker || !card) return;
    const state = getBriefingState();
    const activeDay = data.days.find((day) => day.number === state.activeDay) || data.days[0];
    const record = briefingRecord(activeDay.number);
    const checks = briefingChecks(activeDay);
    const allChecked = checks.every((item) => record.checks[item.id]);
    renderBriefingSummary();

    picker.innerHTML = data.days.map((day) => {
      const item = briefingRecord(day.number);
      const readiness = briefingStatusLabel(item.status);
      const stateClass = item.status === "bereit" || item.status === "erledigt" ? " is-ready" : briefingRecordHasEntry(item) ? " is-prepared" : "";
      return `
        <button class="briefing-day-button${day.number === activeDay.number ? " is-active" : ""}${stateClass}" type="button" data-briefing-day="${day.number}" aria-pressed="${day.number === activeDay.number}">
          <span>Tag ${day.number}</span>
          <small>${escapeHtml(readiness)}</small>
        </button>
      `;
    }).join("");

    card.innerHTML = `
      <div class="briefing-card-heading">
        <div>
          <span class="briefing-kicker">Tag ${activeDay.number} · ${escapeHtml(activeDay.date)}</span>
          <h3>${escapeHtml(activeDay.route)}</h3>
          <p>${escapeHtml(activeDay.type)}</p>
        </div>
        <label class="briefing-status-control">
          <span>Vorbereitung</span>
          <select data-briefing-status="${activeDay.number}">
            ${briefingStatusOptions(record.status)}
          </select>
        </label>
      </div>
      <div class="briefing-facts">
        <div><span>Fahrt</span><strong>${escapeHtml(activeDay.drive)}</strong></div>
        <div><span>Distanz</span><strong>${escapeHtml(activeDay.distance)}</strong></div>
        <div><span>Übernachtung</span><strong>${escapeHtml(activeDay.overnight)}</strong></div>
      </div>
      <div class="briefing-guidance">
        <section class="briefing-priority">
          <span>Heute priorisieren</span>
          <p>${escapeHtml(activeDay.priority)}</p>
        </section>
        <div class="briefing-columns">
          <section>
            <h4>Orientierung für den Tag</h4>
            <ul>${activeDay.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </section>
          <section>
            <h4>Praktischer Fokus</h4>
            <ul>${activeDay.practical.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </section>
        </div>
      </div>
      <section class="briefing-personal">
        <div class="briefing-personal-heading">
          <div>
            <span>Eigene Vorbereitung</span>
            <h4>Startklar machen</h4>
          </div>
          <small>${allChecked ? "Tageschecks vollständig" : "Tageschecks noch offen"}</small>
        </div>
        <div class="briefing-checks" role="group" aria-label="Tagesvorbereitung für Tag ${activeDay.number}">
          ${checks.map((item) => `
            <label class="briefing-check${record.checks[item.id] ? " is-checked" : ""}">
              <input type="checkbox" data-briefing-check="${escapeHtml(item.id)}" data-briefing-day-number="${activeDay.number}"${record.checks[item.id] ? " checked" : ""}>
              <span>${escapeHtml(item.label)}</span>
            </label>
          `).join("")}
        </div>
        <div class="briefing-fields">
          <label class="briefing-field">
            <span>Geplante Abfahrt</span>
            <input type="time" value="${escapeHtml(record.departureTime)}" data-briefing-field="departureTime" data-briefing-day-number="${activeDay.number}">
          </label>
          <label class="briefing-field">
            <span>Ankunftsziel / Check-in</span>
            <input type="text" value="${escapeHtml(record.arrivalTarget)}" placeholder="Zum Beispiel: gegen 17:30 Uhr" data-briefing-field="arrivalTarget" data-briefing-day-number="${activeDay.number}">
          </label>
          <label class="briefing-field briefing-field-wide">
            <span>Morgenfokus</span>
            <textarea rows="3" placeholder="Was darf heute nicht untergehen?" data-briefing-field="focus" data-briefing-day-number="${activeDay.number}">${escapeHtml(record.focus)}</textarea>
          </label>
        </div>
      </section>
      ${dayResourceLinks(activeDay, { title: "Direkt für diesen Tag", compact: true, className: "resource-links-briefing" })}
      <footer class="briefing-card-footer">
        <button type="button" data-jump-stage="${activeDay.number}">Etappe öffnen <span aria-hidden="true">→</span></button>
      </footer>
    `;
  }

  function setActiveBriefingDay(dayNumber) {
    const state = getBriefingState();
    state.activeDay = Number(dayNumber) || 1;
    saveState(briefingStorageKey, state);
    renderBriefing();
  }

  function updateBriefingField(dayNumber, field, value) {
    const state = getBriefingState();
    const record = state.days[dayNumber] && typeof state.days[dayNumber] === "object" && !Array.isArray(state.days[dayNumber]) ? state.days[dayNumber] : {};
    record[field] = value;
    state.days[dayNumber] = record;
    saveState(briefingStorageKey, state);
    if (field === "status") {
      renderBriefing();
    } else {
      renderBriefingSummary();
    }
    renderBackupSummary();
  }

  function updateBriefingCheck(dayNumber, checkId, checked) {
    const state = getBriefingState();
    const record = state.days[dayNumber] && typeof state.days[dayNumber] === "object" && !Array.isArray(state.days[dayNumber]) ? state.days[dayNumber] : {};
    record.checks = record.checks && typeof record.checks === "object" && !Array.isArray(record.checks) ? record.checks : {};
    record.checks[checkId] = checked;
    state.days[dayNumber] = record;
    saveState(briefingStorageKey, state);
    renderBriefing();
    renderBackupSummary();
  }

  function resetBriefing() {
    if (!window.confirm("Alle Tagesbriefings in diesem Browser löschen?")) return;
    saveState(briefingStorageKey, {});
    renderBriefing();
    renderBackupSummary();
  }

  function getStayState() {
    return loadState(stayStorageKey, {});
  }

  function getStayRecord(stay) {
    const state = getStayState();
    const record = state[stay.id] && typeof state[stay.id] === "object" && !Array.isArray(state[stay.id]) ? state[stay.id] : {};
    return {
      status: record.status || stay.status || "offen",
      property: record.property || "",
      reference: record.reference || "",
      contact: record.contact || "",
      arrivalTime: record.arrivalTime || "",
      note: record.note || ""
    };
  }

  function stayRecordHasEntry(record) {
    return Boolean(
      record.property || record.reference || record.contact || record.arrivalTime || record.note || (record.status && record.status !== "offen")
    );
  }

  function stayStats() {
    const stays = Array.isArray(data.stays) ? data.stays : [];
    const records = stays.map((stay) => ({ stay, record: getStayRecord(stay) }));
    const secured = records.filter(({ record }) => record.status === "gebucht" || record.status === "erledigt");
    const documented = records.filter(({ record }) => stayRecordHasEntry(record));
    const nights = secured.reduce((sum, { stay }) => sum + Number(stay.nights || 0), 0);
    return { total: stays.length, secured: secured.length, documented: documented.length, nights };
  }

  function renderStaySummary() {
    const target = $("#stay-summary");
    if (!target) return;
    const stats = stayStats();
    target.innerHTML = `
      <article class="stay-stat"><strong>${stats.total}</strong><span>Übernachtungsorte</span></article>
      <article class="stay-stat"><strong>${data.meta.totalNights}</strong><span>Nächte auf der Route</span></article>
      <article class="stay-stat"><strong>${stats.secured}</strong><span>Orte gebucht</span></article>
      <article class="stay-stat"><strong>${stats.nights}</strong><span>Nächte gesichert</span></article>
      <article class="stay-stat"><strong>${stats.documented}</strong><span>Einträge ergänzt</span></article>
    `;
  }

  function renderStays() {
    const target = $("#stay-board");
    if (!target || !Array.isArray(data.stays)) return;
    renderStaySummary();
    target.innerHTML = data.stays.map((stay) => {
      const record = getStayRecord(stay);
      return `
        <article class="stay-card" data-stay="${escapeHtml(stay.id)}">
          <div class="stay-card-top">
            <div>
              <span class="stay-date">${escapeHtml(stay.dates)}</span>
              <h3>${escapeHtml(stay.city)}</h3>
              <p class="stay-region">${escapeHtml(stay.region)}</p>
            </div>
            <label class="stay-status-control">
              <span class="visually-hidden">Status für ${escapeHtml(stay.city)}</span>
              <select data-stay-status="${escapeHtml(stay.id)}">
                ${statusOptions(record.status, false)}
              </select>
            </label>
          </div>
          <div class="stay-context">
            <p><strong>Ankunft</strong>${escapeHtml(stay.arrival)}</p>
            <p><strong>Danach</strong>${escapeHtml(stay.next)}</p>
          </div>
          <div class="stay-fields">
            <label class="stay-field stay-field-wide">
              <span>Unterkunft / Adresse</span>
              <input type="text" autocomplete="organization" placeholder="Name der Unterkunft" value="${escapeHtml(record.property)}" data-stay-field="property" data-stay-id="${escapeHtml(stay.id)}">
            </label>
            <label class="stay-field">
              <span>Bestätigung</span>
              <input type="text" autocomplete="off" placeholder="Buchungsnummer" value="${escapeHtml(record.reference)}" data-stay-field="reference" data-stay-id="${escapeHtml(stay.id)}">
            </label>
            <label class="stay-field">
              <span>Kontakt</span>
              <input type="text" autocomplete="off" placeholder="Telefon oder E-Mail" value="${escapeHtml(record.contact)}" data-stay-field="contact" data-stay-id="${escapeHtml(stay.id)}">
            </label>
            <label class="stay-field">
              <span>Geplante Ankunft</span>
              <input type="time" value="${escapeHtml(record.arrivalTime)}" data-stay-field="arrivalTime" data-stay-id="${escapeHtml(stay.id)}">
            </label>
            <label class="stay-field stay-field-wide">
              <span>Eigene Notiz</span>
              <textarea rows="2" placeholder="Check-in, Parkplatz, Besonderheiten …" data-stay-field="note" data-stay-id="${escapeHtml(stay.id)}">${escapeHtml(record.note)}</textarea>
            </label>
          </div>
          <div class="stay-links">
            <a class="stay-map-link" href="${mapUrl(stay.mapQuery)}" target="_blank" rel="noopener noreferrer">${escapeHtml(stay.city)} in Google Maps öffnen <span aria-hidden="true">↗</span></a>
          </div>
          <footer class="stay-card-footer">
            <button type="button" data-jump-stage="${stay.day}">Zur Etappe <span aria-hidden="true">→</span></button>
          </footer>
        </article>
      `;
    }).join("");
  }

  function updateStayField(stayId, field, value) {
    const state = getStayState();
    const record = state[stayId] && typeof state[stayId] === "object" && !Array.isArray(state[stayId]) ? state[stayId] : {};
    record[field] = value;
    state[stayId] = record;
    saveState(stayStorageKey, state);
    renderStaySummary();
    renderBackupSummary();
  }

  function resetStays() {
    if (!window.confirm("Alle Unterkunftseinträge in diesem Browser löschen?")) return;
    saveState(stayStorageKey, {});
    renderStays();
    renderBackupSummary();
  }


  function getRentalState() {
    const state = loadState(rentalStorageKey, { pickup: {}, returnInfo: {} });
    return {
      pickup: state.pickup && typeof state.pickup === "object" && !Array.isArray(state.pickup) ? state.pickup : {},
      returnInfo: state.returnInfo && typeof state.returnInfo === "object" && !Array.isArray(state.returnInfo) ? state.returnInfo : {}
    };
  }

  function rentalRecord(part) {
    const state = getRentalState();
    const source = part === "pickup" ? state.pickup : state.returnInfo;
    return {
      checks: source.checks && typeof source.checks === "object" && !Array.isArray(source.checks) ? source.checks : {},
      provider: source.provider || "",
      reference: source.reference || "",
      vehicle: source.vehicle || "",
      registration: source.registration || "",
      time: source.time || "",
      mileage: source.mileage || "",
      fuel: source.fuel || "",
      note: source.note || ""
    };
  }

  function rentalInfo(part) {
    const rental = data.rentalCar || {};
    return part === "pickup" ? (rental.pickup || {}) : (rental.returnInfo || {});
  }

  function rentalChecks(part) {
    const rental = data.rentalCar || {};
    const checks = part === "pickup" ? rental.pickupChecks : rental.returnChecks;
    return Array.isArray(checks) ? checks : [];
  }

  function rentalRecordHasEntry(record) {
    return Boolean(record.provider || record.reference || record.vehicle || record.registration || record.time || record.mileage || record.fuel || record.note || Object.values(record.checks || {}).some(Boolean));
  }

  function rentalCheckCount(part) {
    const record = rentalRecord(part);
    return rentalChecks(part).filter((check) => record.checks[check.id]).length;
  }

  function rentalMileage() {
    const pickup = Number(String(rentalRecord("pickup").mileage || "").replace(",", "."));
    const returnMileage = Number(String(rentalRecord("return").mileage || "").replace(",", "."));
    const difference = returnMileage - pickup;
    return Number.isFinite(difference) && pickup >= 0 && returnMileage >= pickup && difference <= 4000 ? difference : 0;
  }

  function renderRentalSummary() {
    const target = $("#rental-summary");
    if (!target) return;
    const pickup = rentalRecord("pickup");
    const returnRecord = rentalRecord("return");
    const pickupTotal = rentalChecks("pickup").length;
    const returnTotal = rentalChecks("return").length;
    const vehicleState = pickup.vehicle || pickup.registration ? "erfasst" : "offen";
    const returnState = returnRecordHasEntry(returnRecord) ? "angelegt" : "offen";
    const kilometres = rentalMileage();
    target.innerHTML = `
      <article class="rental-stat"><strong>${pickupTotal ? `${rentalCheckCount("pickup")}/${pickupTotal}` : "—"}</strong><span>Übernahme-Checks</span></article>
      <article class="rental-stat"><strong>${vehicleState}</strong><span>Fahrzeugdaten</span></article>
      <article class="rental-stat"><strong>${returnTotal ? `${rentalCheckCount("return")}/${returnTotal}` : "—"}</strong><span>Rückgabe-Checks</span></article>
      <article class="rental-stat"><strong>${kilometres > 0 ? `${Math.round(kilometres)} km` : "—"}</strong><span>zwischen Übergabe & Rückgabe</span></article>
    `;
  }

  function rentalCard(part) {
    const isPickup = part === "pickup";
    const info = rentalInfo(part);
    const record = rentalRecord(part);
    const checks = rentalChecks(part);
    const phase = isPickup ? "Übernahme" : "Rückgabe";
    const day = data.days.find((item) => Number(item.number) === Number(info.day));
    const location = info.place || "Ort laut Buchung";
    const timeDescription = info.time || "Zeit laut Buchung";
    const route = day ? day.route : "";
    const detailFields = isPickup ? `
      <label class="rental-field">
        <span>Anbieter</span>
        <input type="text" autocomplete="organization" placeholder="z. B. Mietwagenanbieter" value="${escapeHtml(record.provider)}" data-rental-field="provider" data-rental-part="pickup">
      </label>
      <label class="rental-field">
        <span>Reservierungsnummer</span>
        <input type="text" autocomplete="off" placeholder="Buchungsnummer" value="${escapeHtml(record.reference)}" data-rental-field="reference" data-rental-part="pickup">
      </label>
      <label class="rental-field">
        <span>Fahrzeug</span>
        <input type="text" autocomplete="off" placeholder="Modell / Kategorie" value="${escapeHtml(record.vehicle)}" data-rental-field="vehicle" data-rental-part="pickup">
      </label>
      <label class="rental-field">
        <span>Kennzeichen</span>
        <input type="text" autocomplete="off" placeholder="Nummernschild" value="${escapeHtml(record.registration)}" data-rental-field="registration" data-rental-part="pickup">
      </label>
      <label class="rental-field">
        <span>Übergabezeit</span>
        <input type="time" value="${escapeHtml(record.time)}" data-rental-field="time" data-rental-part="pickup">
      </label>
      <label class="rental-field">
        <span>Kilometerstand</span>
        <input type="number" min="0" step="1" inputmode="numeric" placeholder="z. B. 12480" value="${escapeHtml(record.mileage)}" data-rental-field="mileage" data-rental-part="pickup">
      </label>
      <label class="rental-field rental-field-wide">
        <span>Tankstand bei Übernahme</span>
        <input type="text" autocomplete="off" placeholder="z. B. voll / 7/8" value="${escapeHtml(record.fuel)}" data-rental-field="fuel" data-rental-part="pickup">
      </label>
      <label class="rental-field rental-field-wide">
        <span>Eigene Notiz</span>
        <textarea rows="3" placeholder="Schäden, Versicherung, Übergabeort, besondere Regeln …" data-rental-field="note" data-rental-part="pickup">${escapeHtml(record.note)}</textarea>
      </label>
    ` : `
      <label class="rental-field">
        <span>Rückgabezeit</span>
        <input type="time" value="${escapeHtml(record.time)}" data-rental-field="time" data-rental-part="return">
      </label>
      <label class="rental-field">
        <span>Kilometerstand</span>
        <input type="number" min="0" step="1" inputmode="numeric" placeholder="z. B. 14180" value="${escapeHtml(record.mileage)}" data-rental-field="mileage" data-rental-part="return">
      </label>
      <label class="rental-field rental-field-wide">
        <span>Tankstand bei Rückgabe</span>
        <input type="text" autocomplete="off" placeholder="z. B. voll / 7/8" value="${escapeHtml(record.fuel)}" data-rental-field="fuel" data-rental-part="return">
      </label>
      <label class="rental-field rental-field-wide">
        <span>Eigene Notiz</span>
        <textarea rows="3" placeholder="Tankbeleg, Rückgabe, Abflugpuffer, Bestätigung …" data-rental-field="note" data-rental-part="return">${escapeHtml(record.note)}</textarea>
      </label>
    `;

    return `
      <article class="rental-card rental-card-${isPickup ? "pickup" : "return"}">
        <div class="rental-card-top">
          <div>
            <span class="rental-phase">${phase} · Tag ${escapeHtml(info.day || "—")}</span>
            <h3>${escapeHtml(info.title || phase)}</h3>
            <p class="rental-date">${escapeHtml(info.date || "")}</p>
          </div>
          <span class="rental-check-count">${rentalCheckCount(part)}/${checks.length || "—"} Checks</span>
        </div>
        <div class="rental-context">
          <p><strong>Ort</strong>${escapeHtml(location)}</p>
          <p><strong>Rahmen</strong>${escapeHtml(timeDescription)}</p>
          <p><strong>Fokus</strong>${escapeHtml(info.focus || "Verbindliche Buchungsdaten prüfen.")}</p>
        </div>
        <div class="rental-checks" role="group" aria-label="${phase}-Checks">
          ${checks.map((check) => `
            <label class="rental-check${record.checks[check.id] ? " is-checked" : ""}">
              <input type="checkbox" data-rental-check="${escapeHtml(check.id)}" data-rental-part="${part}"${record.checks[check.id] ? " checked" : ""}>
              <span>${escapeHtml(check.label)}</span>
            </label>
          `).join("")}
        </div>
        <div class="rental-fields">
          ${detailFields}
        </div>
        ${resourceLinksMarkup([
          { label: "Ort in Google Maps", note: "Übergabe- oder Rückgabeort öffnen", url: mapUrl(info.mapQuery || location), type: "map" },
          ...resourceLinksFor("rental", isPickup ? "pickup" : "return")
        ], { title: "Mietwagen-Links", compact: true, className: "resource-links-rental" })}
        <footer class="rental-card-footer">
          ${day ? `<button type="button" data-jump-stage="${day.number}">Zur Etappe${route ? ` · ${escapeHtml(route)}` : ""} <span aria-hidden="true">→</span></button>` : ""}
        </footer>
      </article>
    `;
  }

  function renderRental() {
    const board = $("#rental-board");
    if (!board) return;
    renderRentalSummary();
    board.innerHTML = `${rentalCard("pickup")}${rentalCard("return")}`;
  }

  function updateRentalCheck(part, checkId, checked) {
    const state = getRentalState();
    const key = part === "pickup" ? "pickup" : "returnInfo";
    const record = rentalRecord(part);
    record.checks[checkId] = checked;
    state[key] = record;
    saveState(rentalStorageKey, state);
    renderRental();
    renderBackupSummary();
  }

  function updateRentalField(part, field, value) {
    const state = getRentalState();
    const key = part === "pickup" ? "pickup" : "returnInfo";
    const record = rentalRecord(part);
    record[field] = value;
    state[key] = record;
    saveState(rentalStorageKey, state);
    renderRentalSummary();
    renderBackupSummary();
  }

  function resetRental() {
    if (!window.confirm("Alle Einträge im Mietwagen-Journal in diesem Browser löschen?")) return;
    saveState(rentalStorageKey, { pickup: {}, returnInfo: {} });
    renderRental();
    renderBackupSummary();
  }



  function getDocumentState() {
    return loadState(documentsStorageKey, {});
  }

  function documentRecord(item) {
    const state = getDocumentState();
    const source = state[item.id] && typeof state[item.id] === "object" && !Array.isArray(state[item.id]) ? state[item.id] : {};
    return {
      status: source.status || "offen",
      reference: source.reference || "",
      location: source.location || "",
      note: source.note || "",
      checks: source.checks && typeof source.checks === "object" && !Array.isArray(source.checks) ? source.checks : {}
    };
  }

  function documentStatusLabel(status) {
    const labels = {
      offen: "offen",
      geprüft: "geprüft",
      offline: "offline bereit",
      eingepackt: "eingepackt"
    };
    return labels[status] || "offen";
  }

  function documentStatusOptions(selected) {
    return ["offen", "geprüft", "offline", "eingepackt"]
      .map((value) => `<option value="${value}"${value === selected ? " selected" : ""}>${documentStatusLabel(value)}</option>`)
      .join("");
  }

  function documentRecordHasEntry(record) {
    return Boolean(record.reference || record.location || record.note || (record.status && record.status !== "offen") || Object.values(record.checks || {}).some(Boolean));
  }

  function documentCheckCount(item) {
    const record = documentRecord(item);
    const checks = Array.isArray(item.checks) ? item.checks : [];
    return checks.filter((check) => record.checks[check.id]).length;
  }

  function documentStats() {
    const items = Array.isArray(data.documents) ? data.documents : [];
    const records = items.map((item) => ({ item, record: documentRecord(item) }));
    const checked = records.filter(({ item }) => documentCheckCount(item) === (item.checks || []).length && (item.checks || []).length > 0).length;
    const offline = records.filter(({ record }) => record.status === "offline" || record.status === "eingepackt").length;
    const packed = records.filter(({ record }) => record.status === "eingepackt").length;
    const started = records.filter(({ record }) => documentRecordHasEntry(record)).length;
    return { total: items.length, checked, offline, packed, started };
  }

  function renderDocumentSummary() {
    const target = $("#document-summary");
    if (!target) return;
    const stats = documentStats();
    target.innerHTML = `
      <article class="document-stat"><strong>${stats.total}</strong><span>Unterlagenpakete</span></article>
      <article class="document-stat"><strong>${stats.checked}/${stats.total}</strong><span>Checks vollständig</span></article>
      <article class="document-stat"><strong>${stats.offline}</strong><span>offline bereit</span></article>
      <article class="document-stat"><strong>${stats.packed}</strong><span>eingepackt</span></article>
    `;
  }

  function documentCard(item) {
    const record = documentRecord(item);
    const checks = Array.isArray(item.checks) ? item.checks : [];
    const allChecked = checks.length > 0 && checks.every((check) => record.checks[check.id]);
    return `
      <article class="document-card${allChecked ? " is-complete" : ""}">
        <div class="document-card-top">
          <div>
            <span class="document-category">${escapeHtml(item.category || "Unterlagen")}</span>
            <h3>${escapeHtml(item.title || "Unterlagenpaket")}</h3>
          </div>
          <label class="document-status-control">
            <span>Status</span>
            <select data-document-status="${escapeHtml(item.id)}">
              ${documentStatusOptions(record.status)}
            </select>
          </label>
        </div>
        <p class="document-priority">${escapeHtml(item.priority || "Wichtige Unterlagen vor Abflug prüfen.")}</p>
        <div class="document-checks" role="group" aria-label="Checks für ${escapeHtml(item.title || "Unterlagen")}">
          ${checks.map((check) => `
            <label class="document-check${record.checks[check.id] ? " is-checked" : ""}">
              <input type="checkbox" data-document-check="${escapeHtml(check.id)}" data-document-id="${escapeHtml(item.id)}"${record.checks[check.id] ? " checked" : ""}>
              <span>${escapeHtml(check.label)}</span>
            </label>
          `).join("")}
        </div>
        <div class="document-fields">
          <label class="document-field">
            <span>Referenz / Hinweis</span>
            <input type="text" autocomplete="off" placeholder="z. B. Bestätigung oder Ablaufdatum" value="${escapeHtml(record.reference)}" data-document-field="reference" data-document-id="${escapeHtml(item.id)}">
          </label>
          <label class="document-field">
            <span>Ablage / Zugriff</span>
            <input type="text" autocomplete="off" placeholder="z. B. offline im Telefon / Reisemappe" value="${escapeHtml(record.location)}" data-document-field="location" data-document-id="${escapeHtml(item.id)}">
          </label>
          <label class="document-field document-field-wide">
            <span>Eigene Notiz</span>
            <textarea rows="3" placeholder="Nur organisatorische Hinweise – keine sensiblen Daten" data-document-field="note" data-document-id="${escapeHtml(item.id)}">${escapeHtml(record.note)}</textarea>
          </label>
        </div>
        ${resourceLinksMarkup(resourceLinksFor("documents", item.id), { title: "Offizielle Quelle", compact: true, className: "resource-links-document" })}
        <footer class="document-card-footer">
          <span>${documentCheckCount(item)}/${checks.length || "—"} Checks erledigt</span>
          <span>${escapeHtml(documentStatusLabel(record.status))}</span>
        </footer>
      </article>
    `;
  }

  function renderDocuments() {
    const board = $("#document-board");
    if (!board) return;
    renderDocumentSummary();
    const items = Array.isArray(data.documents) ? data.documents : [];
    board.innerHTML = items.map(documentCard).join("");
  }

  function updateDocumentCheck(id, checkId, checked) {
    const state = getDocumentState();
    const record = documentRecord({ id });
    record.checks[checkId] = checked;
    state[id] = record;
    saveState(documentsStorageKey, state);
    renderDocuments();
    renderBackupSummary();
  }

  function updateDocumentField(id, field, value) {
    const state = getDocumentState();
    const record = documentRecord({ id });
    record[field] = value;
    state[id] = record;
    saveState(documentsStorageKey, state);
    if (field === "status") renderDocuments();
    else renderDocumentSummary();
    renderBackupSummary();
  }

  function resetDocuments() {
    if (!window.confirm("Alle Einträge im Unterlagencheck in diesem Browser löschen?")) return;
    saveState(documentsStorageKey, {});
    renderDocuments();
    renderBackupSummary();
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
          ${resourceLinksMarkup([
            { label: "Wetter · MetService", note: "Aktuelle Ortsprognose und Warnungen", url: "https://www.metservice.com/towns-cities", type: "weather" },
            { label: "Straßenlage · NZTA", note: "Vor Fahrt oder Transfer prüfen", url: "https://www.journeys.nzta.govt.nz/highway-conditions", type: "road" },
            ...resourceLinksFor("weather", window.id)
          ], { title: "Jetzt prüfen", compact: true, className: "resource-links-weather" })}
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
          ${stageQuickLinks(day)}
          <footer>
            <span class="stage-overnight">Übernachtung: ${escapeHtml(day.overnight)}</span>
            <button class="stage-detail-button" type="button" data-open-stage="${day.number}">Details</button>
          </footer>
        </article>
      `;
    }).join("");
  }

  function renderLinkHub() {
    const global = $("#link-hub-global");
    const days = $("#link-hub-days");
    if (global) {
      global.innerHTML = resourceLinksMarkup(resourceLinksFor("global", "global"), {
        title: "Immer aktuell prüfen",
        className: "resource-links-global",
        ariaLabel: "Wichtige Reisequellen"
      });
    }
    if (days) {
      days.innerHTML = data.days.map((day) => `
        <article class="day-link-card">
          <div class="day-link-card-top">
            <div>
              <span>Tag ${day.number} · ${escapeHtml(day.date)}</span>
              <h3>${escapeHtml(day.route)}</h3>
            </div>
            <a href="#etappen" data-jump-stage="${day.number}">Etappe <span aria-hidden="true">→</span></a>
          </div>
          ${dayResourceLinks(day, { title: "Links dieser Etappe", compact: true, className: "resource-links-day" })}
        </article>
      `).join("");
    }
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
          ${resourceLinksMarkup(resourceLinksFor("planning", task.id), { title: "Direkt öffnen", compact: true, className: "resource-links-planning" })}
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
      ${window.NZDayAtlas && typeof window.NZDayAtlas.dialogMarkup === "function" ? window.NZDayAtlas.dialogMarkup(day.number) : ""}
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
      ${dayResourceLinks(day, { title: "Direkt für diese Etappe", className: "resource-links-dialog" })}
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
          ${resourceLinksMarkup(resourceLinksFor("planning", task.id), { title: "Zum Anbieter / zur Quelle", compact: true, className: "resource-links-booking" })}
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
    const briefing = getBriefingState();
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
    const stayCount = Array.isArray(data.stays) ? data.stays.filter((stay) => stayRecordHasEntry(getStayRecord(stay))).length : 0;
    const briefingCount = data.days.filter((day) => briefingRecordHasEntry(briefingRecord(day.number))).length;
    const rentalCount = [rentalRecord("pickup"), rentalRecord("return")].filter(rentalRecordHasEntry).length;
    const documentCount = Array.isArray(data.documents) ? data.documents.filter((item) => documentRecordHasEntry(documentRecord(item))).length : 0;
    return { planner: plannerCount, booking: bookingCount, budget: budgetCount, checklist: checklistCount, drive: driveCount, weather: weatherCount, stays: stayCount, briefing: briefingCount, rental: rentalCount, documents: documentCount };
  }

  function renderBackupSummary() {
    const target = $("#backup-summary");
    if (!target) return;
    const count = savedEntryCount();
    target.innerHTML = `
      <article class="backup-stat"><strong>${count.planner}</strong><span>Planungseinträge</span></article>
      <article class="backup-stat"><strong>${count.booking + count.budget + count.stays + count.rental + count.documents}</strong><span>Buchungs-, Unterlagen-, Unterkunfts-, Kosten- & Mietwagen-Einträge</span></article>
      <article class="backup-stat"><strong>${count.drive}</strong><span>Fahrtage erfasst</span></article>
      <article class="backup-stat"><strong>${count.weather}</strong><span>Wetterfenster bewertet</span></article>
      <article class="backup-stat"><strong>${count.briefing}</strong><span>Tagesbriefings erfasst</span></article>
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
        weather: getWeatherState(),
        stays: getStayState(),
        briefing: getBriefingState(),
        rental: getRentalState(),
        documents: getDocumentState()
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
    renderStays();
    renderDrive();
    renderWeather();
    renderLinkHub();
    renderBriefing();
    renderRental();
    renderDocuments();
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
        if (!payload || payload.schema !== backupSchema || ![1, 2, 3, 4].includes(Number(payload.version)) || !plainObject(payload.state)) {
          throw new Error("invalid-backup");
        }
        const state = payload.state;
        saveChecklistState(plainObject(state.checklist));
        saveState(plannerStorageKey, plainObject(state.planner));
        saveState(bookingStorageKey, plainObject(state.bookings));
        saveState(budgetStorageKey, plainObject(state.budget));
        saveState(driveStorageKey, plainObject(state.drive));
        saveState(weatherStorageKey, plainObject(state.weather));
        saveState(stayStorageKey, plainObject(state.stays));
        saveState(briefingStorageKey, plainObject(state.briefing));
        saveState(rentalStorageKey, plainObject(state.rental));
        saveState(documentsStorageKey, plainObject(state.documents));
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
      const briefingDayButton = event.target.closest("[data-briefing-day]");

      if (stageButton) openStage(stageButton.dataset.openStage);
      if (routeButton) focusStage(routeButton.dataset.routeDay, true);
      if (jumpButton) focusStage(jumpButton.dataset.jumpStage, false);
      if (filterButton) {
        activeStageFilter = filterButton.dataset.stageFilter;
        renderStages();
        updateFilterButtons();
      }
      if (driveDayButton) setActiveDriveDay(driveDayButton.dataset.driveDay);
      if (briefingDayButton) setActiveBriefingDay(briefingDayButton.dataset.briefingDay);
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
      if (event.target.closest("[data-reset-stays]")) resetStays();
      if (event.target.closest("[data-reset-briefing]")) resetBriefing();
      if (event.target.closest("[data-reset-rental]")) resetRental();
      if (event.target.closest("[data-reset-documents]")) resetDocuments();
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
      const stayStatus = event.target.closest("[data-stay-status]");
      const briefingCheck = event.target.closest("[data-briefing-check]");
      const briefingStatus = event.target.closest("[data-briefing-status]");
      const rentalCheck = event.target.closest("[data-rental-check]");
      const documentCheck = event.target.closest("[data-document-check]");
      const documentStatus = event.target.closest("[data-document-status]");
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
      if (stayStatus) updateStayField(stayStatus.dataset.stayStatus, "status", stayStatus.value);
      if (briefingCheck) updateBriefingCheck(briefingCheck.dataset.briefingDayNumber, briefingCheck.dataset.briefingCheck, briefingCheck.checked);
      if (briefingStatus) updateBriefingField(briefingStatus.dataset.briefingStatus, "status", briefingStatus.value);
      if (rentalCheck) updateRentalCheck(rentalCheck.dataset.rentalPart, rentalCheck.dataset.rentalCheck, rentalCheck.checked);
      if (documentCheck) updateDocumentCheck(documentCheck.dataset.documentId, documentCheck.dataset.documentCheck, documentCheck.checked);
      if (documentStatus) updateDocumentField(documentStatus.dataset.documentStatus, "status", documentStatus.value);
    });

    document.addEventListener("input", (event) => {
      const note = event.target.closest("[data-day-note]");
      const bookingField = event.target.closest("[data-booking-field]");
      const budgetField = event.target.closest("[data-budget-field]");
      const driveField = event.target.closest("[data-drive-field]");
      const weatherField = event.target.closest("[data-weather-field]");
      const stayField = event.target.closest("[data-stay-field]");
      const briefingField = event.target.closest("[data-briefing-field]");
      const rentalField = event.target.closest("[data-rental-field]");
      const documentField = event.target.closest("[data-document-field]");
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
      if (stayField) updateStayField(stayField.dataset.stayId, stayField.dataset.stayField, stayField.value);
      if (briefingField) updateBriefingField(briefingField.dataset.briefingDayNumber, briefingField.dataset.briefingField, briefingField.value);
      if (rentalField) updateRentalField(rentalField.dataset.rentalPart, rentalField.dataset.rentalField, rentalField.value);
      if (documentField) updateDocumentField(documentField.dataset.documentId, documentField.dataset.documentField, documentField.value);
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
  renderStays();
  renderDrive();
  renderWeather();
  renderLinkAudit();
  renderLinkHub();
  renderBriefing();
  renderRental();
  renderDocuments();
  renderStages();
  renderChecklist();
  renderBackupSummary();
  bindEvents();
}());

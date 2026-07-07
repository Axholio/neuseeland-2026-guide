(function () {
  "use strict";

  const data = window.tripData;
  if (!data || !Array.isArray(data.days) || !data.days.length) return;

  const storageKey = "nz-2026-guide-travel-mode-v1";
  const select = document.querySelector("[data-travel-mode-select]");
  const panel = document.querySelector("#travel-mode-panel");
  const status = document.querySelector("#travel-mode-status");
  const resetButton = document.querySelector("[data-travel-mode-auto]");

  if (!select || !panel || !status) return;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function dayIso(dayNumber) {
    return `2026-09-${String(6 + Number(dayNumber)).padStart(2, "0")}`;
  }

  function nowInNewZealand() {
    try {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Pacific/Auckland",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).formatToParts(new Date());
      const part = (type) => parts.find((item) => item.type === type)?.value;
      return `${part("year")}-${part("month")}-${part("day")}`;
    } catch (_) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function dayDifference(fromIso, toIso) {
    const [fromYear, fromMonth, fromDay] = fromIso.split("-").map(Number);
    const [toYear, toMonth, toDay] = toIso.split("-").map(Number);
    return Math.round((Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) / 86400000);
  }

  function getSavedMode() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (parsed && parsed.mode === "manual" && data.days.some((day) => Number(day.number) === Number(parsed.day))) {
        return { mode: "manual", day: Number(parsed.day) };
      }
    } catch (_) {
      // Fallback below keeps the travel mode usable when local storage is unavailable.
    }
    return { mode: "auto", day: null };
  }

  function saveMode(mode) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(mode));
    } catch (_) {
      // The selected view remains active until the page is closed.
    }
  }

  function automaticState() {
    const today = nowInNewZealand();
    const firstIso = dayIso(data.days[0].number);
    const lastIso = dayIso(data.days[data.days.length - 1].number);

    if (today < firstIso) {
      return {
        phase: "before",
        day: data.days[0],
        daysUntil: Math.max(0, dayDifference(today, firstIso)),
        today
      };
    }
    if (today > lastIso) {
      return {
        phase: "after",
        day: data.days[data.days.length - 1],
        daysUntil: 0,
        today
      };
    }

    const activeDay = data.days.find((day) => dayIso(day.number) === today) || data.days[0];
    return { phase: "active", day: activeDay, daysUntil: 0, today };
  }

  function phaseCopy(state, isManual) {
    if (isManual) {
      return {
        kicker: "Manuelle Vorschau",
        title: `Tag ${state.day.number} · ${state.day.route}`,
        description: `Diese Ansicht ist manuell ausgewählt. Im automatischen Modus richtet sich der Guide nach dem Datum in Neuseeland.`,
        status: `Vorschau für ${state.day.date}`
      };
    }
    if (state.phase === "before") {
      const days = state.daysUntil;
      return {
        kicker: "Vor der Reise",
        title: days === 0 ? "Heute geht es nach Christchurch" : `Noch ${days} ${days === 1 ? "Tag" : "Tage"} bis Christchurch`,
        description: "Der Reisemodus zeigt automatisch die nächste Etappe. Für die Vorabprüfung kannst du jeden Reisetag manuell auswählen.",
        status: `Automatische Vorschau · ${state.day.date}`
      };
    }
    if (state.phase === "after") {
      return {
        kicker: "Nach der Rundreise",
        title: "Die Südinsel-Rundreise ist abgeschlossen",
        description: "Die letzte Etappe führt von Akaroa zum Christchurch Airport. Persönliche Einträge und Sicherungsdateien bleiben auf diesem Gerät verfügbar.",
        status: "Automatische Ansicht · letzte Etappe"
      };
    }
    return {
      kicker: "Heute in Neuseeland",
      title: `Reisetag ${state.day.number} · ${state.day.route}`,
      description: "Das Tagesbriefing, die Detailkarte und die Kernpunkte dieser Etappe sind direkt erreichbar.",
      status: `Automatisch erkannt · ${state.day.date}`
    };
  }

  function nextDay(currentDay) {
    return data.days.find((day) => Number(day.number) === Number(currentDay.number) + 1) || null;
  }

  function mapUrl(query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || "South Island New Zealand")}`;
  }

  function render() {
    const saved = getSavedMode();
    const automatic = automaticState();
    const current = saved.mode === "manual"
      ? { phase: "manual", day: data.days.find((day) => Number(day.number) === saved.day) || automatic.day, daysUntil: 0 }
      : automatic;
    const copy = phaseCopy(current, saved.mode === "manual");
    const day = current.day;
    const following = nextDay(day);
    const highlights = Array.isArray(day.highlights) ? day.highlights.slice(0, 3) : [];
    const primaryPractical = Array.isArray(day.practical) && day.practical[0] ? day.practical[0] : "Aktuelle Betreiber-, Straßen- und Wetterhinweise vor der Abfahrt prüfen.";

    select.value = saved.mode === "manual" ? `day-${day.number}` : "auto";
    status.textContent = copy.status;
    status.dataset.state = saved.mode === "manual" ? "manual" : current.phase;

    panel.innerHTML = `
      <article class="travel-mode-card travel-mode-card-feature">
        <div class="travel-mode-card-head">
          <span class="travel-mode-kicker">${escapeHtml(copy.kicker)}</span>
          <span class="travel-mode-day">Tag ${escapeHtml(day.number)} · ${escapeHtml(day.date)}</span>
        </div>
        <h3>${escapeHtml(copy.title)}</h3>
        <p>${escapeHtml(copy.description)}</p>
        <div class="travel-mode-route" aria-label="Route der gewählten Etappe">
          <span>${escapeHtml(day.start)}</span>
          <i aria-hidden="true">→</i>
          <span>${escapeHtml(day.end)}</span>
        </div>
        <div class="travel-mode-actions">
          <a class="travel-mode-button travel-mode-button-light" href="#tagesbriefing">Tagesbriefing öffnen</a>
          <button class="travel-mode-button travel-mode-button-outline" type="button" data-open-stage="${escapeHtml(day.number)}">Etappe im Detail</button>
        </div>
      </article>
      <article class="travel-mode-card">
        <span class="travel-mode-kicker">Kernpunkte</span>
        <h3>${escapeHtml(day.type)}</h3>
        <dl class="travel-mode-facts">
          <div><dt>Fahrt</dt><dd>${escapeHtml(day.drive)}</dd></div>
          <div><dt>Distanz</dt><dd>${escapeHtml(day.distance)}</dd></div>
          <div><dt>Nacht</dt><dd>${escapeHtml(day.overnight)}</dd></div>
        </dl>
        <p class="travel-mode-priority"><span>Priorität</span>${escapeHtml(day.priority)}</p>
      </article>
      <article class="travel-mode-card travel-mode-card-next">
        <span class="travel-mode-kicker">Nächster Schritt</span>
        <h3>${following ? `Danach: Tag ${following.number}` : "Rückgabe & Abflug"}</h3>
        <p>${following ? `${following.date} · ${following.route}` : escapeHtml(data.meta.returnInfo || "Mietwagenrückgabe und Abflug prüfen.")}</p>
        <ul class="travel-mode-list">
          ${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
        <p class="travel-mode-note"><strong>Vorher klären:</strong> ${escapeHtml(primaryPractical)}</p>
        <a class="travel-mode-map" href="${mapUrl(day.mapQuery)}" target="_blank" rel="noopener noreferrer">In Karten suchen <span aria-hidden="true">↗</span></a>
      </article>
    `;
  }

  function populateSelect() {
    select.innerHTML = [
      '<option value="auto">Automatisch nach Datum in Neuseeland</option>',
      ...data.days.map((day) => `<option value="day-${escapeHtml(day.number)}">Tag ${escapeHtml(day.number)} · ${escapeHtml(day.date)} · ${escapeHtml(day.route)}</option>`)
    ].join("");
  }

  select.addEventListener("change", () => {
    if (select.value === "auto") {
      saveMode({ mode: "auto", day: null });
    } else {
      saveMode({ mode: "manual", day: Number(select.value.replace("day-", "")) });
    }
    render();
  });

  resetButton?.addEventListener("click", () => {
    saveMode({ mode: "auto", day: null });
    render();
  });

  populateSelect();
  render();

  // Aktualisiert die automatische Tagesansicht nach Mitternacht in Neuseeland.
  const minutesUntilRefresh = 1000 * 60 * 10;
  window.setInterval(() => {
    if (getSavedMode().mode === "auto") render();
  }, minutesUntilRefresh);
})();

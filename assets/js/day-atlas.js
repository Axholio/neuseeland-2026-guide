(function () {
  "use strict";

  const data = window.tripData;
  if (!data || !Array.isArray(data.days)) return;

  const atlasItems = Array.isArray(data.dayAtlas) ? data.dayAtlas : [];
  const atlasByDay = new Map(atlasItems.map((item) => [Number(item.day), item]));
  const mapConfig = data.routeMap || {};
  const segmentByDay = new Map((Array.isArray(mapConfig.segments) ? mapConfig.segments : []).map((segment) => [Number(segment.day), segment]));
  const root = document.getElementById("day-atlas-grid");

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function itemFor(dayNumber) {
    const day = data.days.find((entry) => Number(entry.number) === Number(dayNumber));
    const item = atlasByDay.get(Number(dayNumber)) || {};
    return { day, item };
  }

  function routePoints(dayNumber, item) {
    if (Array.isArray(item.mapPoints) && item.mapPoints.length) return item.mapPoints;
    const segment = segmentByDay.get(Number(dayNumber));
    if (segment && Array.isArray(segment.points) && segment.points.length) return segment.points;
    return [];
  }

  function projectPoints(points, width, height, padding) {
    const usable = Array.isArray(points) ? points.filter((point) => Array.isArray(point) && point.length >= 2) : [];
    if (!usable.length) return [];

    const lats = usable.map((point) => Number(point[0]));
    const lngs = usable.map((point) => Number(point[1]));
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latSpan = Math.max(maxLat - minLat, 0.018);
    const lngSpan = Math.max(maxLng - minLng, 0.018);

    return usable.map((point) => {
      const x = padding + ((Number(point[1]) - minLng) / lngSpan) * (width - padding * 2);
      const y = height - padding - ((Number(point[0]) - minLat) / latSpan) * (height - padding * 2);
      return [Number(x.toFixed(1)), Number(y.toFixed(1))];
    });
  }

  function routeMapMarkup(dayNumber, variant) {
    const { day, item } = itemFor(dayNumber);
    if (!day) return "";
    const points = routePoints(dayNumber, item);
    const wide = variant === "dialog";
    const width = wide ? 520 : 310;
    const height = wide ? 190 : 138;
    const padding = wide ? 26 : 18;
    const coords = projectPoints(points, width, height, padding);
    const polyline = coords.map((point) => point.join(",")).join(" ");
    const kind = item.routeKind || day.routeKind || "road";
    const start = coords[0];
    const end = coords[coords.length - 1];
    const labelStart = escapeHtml(item.mapStartLabel || day.start || "Start");
    const labelEnd = escapeHtml(item.mapEndLabel || day.end || "Ziel");
    const railClass = kind === "rail" ? " atlas-map-line-rail" : "";
    const localClass = kind === "local" ? " atlas-map-line-local" : "";
    const returnClass = kind === "return" ? " atlas-map-line-return" : "";

    if (!coords.length) {
      return `
        <div class="atlas-map atlas-map-empty" role="img" aria-label="Lokale Orientierung für Tag ${escapeHtml(day.number)}">
          <span>Lokale Orientierung</span>
          <strong>${escapeHtml(day.end)}</strong>
        </div>
      `;
    }

    const milestoneDots = coords.length > 2
      ? coords.slice(1, -1).map((point) => `<circle class="atlas-map-waypoint" cx="${point[0]}" cy="${point[1]}" r="3.5"></circle>`).join("")
      : "";

    return `
      <div class="atlas-map-shell">
        <svg class="atlas-map" viewBox="0 0 ${width} ${height}" role="img" aria-label="Schematische Tageskarte: ${escapeHtml(item.routeLabel || day.route)}">
          <defs>
            <linearGradient id="atlas-wash-${escapeHtml(day.number)}-${wide ? "dialog" : "card"}" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#edf4ef"></stop>
              <stop offset="100%" stop-color="#dce9df"></stop>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="${width}" height="${height}" rx="16" fill="url(#atlas-wash-${escapeHtml(day.number)}-${wide ? "dialog" : "card"})"></rect>
          <path class="atlas-map-contour" d="M ${padding - 4} ${height * 0.28} C ${width * 0.24} ${height * 0.08}, ${width * 0.42} ${height * 0.46}, ${width * 0.58} ${height * 0.23} S ${width * 0.85} ${height * 0.14}, ${width - padding + 10} ${height * 0.34}"></path>
          <path class="atlas-map-contour atlas-map-contour-two" d="M ${padding + 12} ${height * 0.76} C ${width * 0.27} ${height * 0.58}, ${width * 0.45} ${height * 0.92}, ${width * 0.65} ${height * 0.68} S ${width * 0.86} ${height * 0.73}, ${width - padding - 8} ${height * 0.62}"></path>
          ${coords.length > 1 ? `<polyline class="atlas-map-line${railClass}${localClass}${returnClass}" points="${polyline}"></polyline>` : ""}
          ${milestoneDots}
          <circle class="atlas-map-point atlas-map-point-start" cx="${start[0]}" cy="${start[1]}" r="7"></circle>
          <circle class="atlas-map-point atlas-map-point-end" cx="${end[0]}" cy="${end[1]}" r="7"></circle>
          <text class="atlas-map-label atlas-map-label-start" x="${Math.min(width - 52, Math.max(10, start[0] + 10))}" y="${Math.max(14, start[1] - 10)}">S</text>
          <text class="atlas-map-label atlas-map-label-end" x="${Math.min(width - 52, Math.max(10, end[0] + 10))}" y="${Math.max(14, end[1] - 10)}">Z</text>
        </svg>
        <div class="atlas-map-caption"><span>${labelStart}</span><span>${labelEnd}</span></div>
      </div>
    `;
  }

  function imageMarkup(item, day) {
    if (!item.image) return "";
    return `
      <figure class="atlas-photo">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || `Bild zu Tag ${day.number}`)}" loading="lazy">
        <figcaption>${escapeHtml(item.imageLabel || "Bild der Etappe")}</figcaption>
      </figure>
    `;
  }

  function stopListMarkup(item) {
    const stops = Array.isArray(item.stops) ? item.stops : [];
    if (!stops.length) return "";
    return `<ol class="atlas-stop-list">${stops.map((stop) => `<li>${escapeHtml(stop)}</li>`).join("")}</ol>`;
  }

  function timelineMarkup(item, compact) {
    const windows = Array.isArray(item.windows) ? item.windows : [];
    if (!windows.length) return "";
    const entries = compact ? windows.slice(0, 3) : windows;
    return `
      <ol class="atlas-timeline${compact ? " atlas-timeline-compact" : ""}">
        ${entries.map((entry) => `
          <li>
            <span>${escapeHtml(entry.when || "Unterwegs")}</span>
            <div><strong>${escapeHtml(entry.title || "Tagespunkt")}</strong><p>${escapeHtml(entry.note || "")}</p></div>
          </li>
        `).join("")}
      </ol>
    `;
  }

  function cardMarkup(day) {
    const { item } = itemFor(day.number);
    const kind = item.routeKind || day.routeKind || "road";
    return `
      <article class="atlas-card atlas-card-${escapeHtml(kind)}" data-atlas-day="${escapeHtml(day.number)}">
        <header class="atlas-card-head">
          <div>
            <span class="atlas-card-day">Tag ${escapeHtml(day.number)} · ${escapeHtml(day.date)}</span>
            <h3>${escapeHtml(item.cardTitle || day.route)}</h3>
          </div>
          <span class="atlas-card-mode">${escapeHtml(item.modeLabel || day.type)}</span>
        </header>
        <div class="atlas-card-route"><span>${escapeHtml(day.start)}</span><i aria-hidden="true">→</i><span>${escapeHtml(day.end)}</span></div>
        <div class="atlas-card-visuals">
          ${routeMapMarkup(day.number, "card")}
          ${imageMarkup(item, day)}
        </div>
        <div class="atlas-card-copy">
          <p class="atlas-card-lead">${escapeHtml(item.routeLabel || day.notes)}</p>
          ${stopListMarkup(item)}
        </div>
        ${timelineMarkup(item, true)}
        <aside class="atlas-decision"><span>Worauf es ankommt</span><p>${escapeHtml(item.decision || day.priority)}</p></aside>
        <footer class="atlas-card-footer">
          <span>${escapeHtml(day.drive)} · ${escapeHtml(day.distance)}</span>
          <button type="button" data-open-stage="${escapeHtml(day.number)}">Tagesseite öffnen <span aria-hidden="true">→</span></button>
        </footer>
      </article>
    `;
  }

  function dialogMarkup(dayNumber) {
    const { day, item } = itemFor(dayNumber);
    if (!day) return "";
    const planB = item.planB || "Route und Tagesprogramm bei Wetter, Straßenlage oder verspätetem Start reduzieren und den Unterkunftsort priorisieren.";
    return `
      <section class="dialog-atlas" aria-label="Tageskarte und Tagesablauf">
        <div class="dialog-atlas-heading">
          <div>
            <span>Tageskarte</span>
            <h3>${escapeHtml(item.routeLabel || `${day.start} nach ${day.end}`)}</h3>
          </div>
          <p>${escapeHtml(item.modeLabel || day.type)}</p>
        </div>
        ${routeMapMarkup(day.number, "dialog")}
        <div class="dialog-atlas-grid">
          <section>
            <h4>Streckenfolge</h4>
            ${stopListMarkup(item)}
          </section>
          <section>
            <h4>Tagesrhythmus</h4>
            ${timelineMarkup(item, false)}
          </section>
        </div>
        <aside class="dialog-plan-b"><span>Plan B</span><p>${escapeHtml(planB)}</p></aside>
      </section>
    `;
  }

  window.NZDayAtlas = { dialogMarkup, routeMapMarkup };

  if (root) {
    root.innerHTML = data.days.map(cardMarkup).join("");
  }
}());

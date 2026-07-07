(function () {
  "use strict";

  const data = window.tripData;
  const select = document.querySelector("[data-calendar-day-select]");
  const allButton = document.querySelector("[data-export-calendar-all]");
  const dayButton = document.querySelector("[data-export-calendar-day]");
  const status = document.getElementById("calendar-status");

  if (!data || !Array.isArray(data.days) || !select || !allButton || !dayButton) return;

  const tripStart = new Date(Date.UTC(2026, 8, 7));

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function escapeIcs(value) {
    return String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");
  }

  function foldLine(line) {
    const limit = 72;
    if (line.length <= limit) return line;
    const chunks = [];
    let position = 0;
    while (position < line.length) {
      chunks.push((position ? " " : "") + line.slice(position, position + (position ? limit - 1 : limit)));
      position += position ? limit - 1 : limit;
    }
    return chunks.join("\r\n");
  }

  function formatDate(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }

  function calendarDate(day) {
    const date = new Date(tripStart);
    date.setUTCDate(tripStart.getUTCDate() + Number(day.number || 1) - 1);
    return date;
  }

  function eventLines(day) {
    const start = calendarDate(day);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 1);
    const details = [
      `Route: ${day.route}`,
      `Start: ${day.start} · Ziel: ${day.end}`,
      day.drive ? `Transport: ${day.drive}` : "",
      day.distance ? `Distanz: ${day.distance}` : "",
      day.overnight ? `Übernachtung: ${day.overnight}` : "",
      day.priority ? `Tagesfokus: ${day.priority}` : ""
    ].filter(Boolean).join("\n");
    const lines = [
      "BEGIN:VEVENT",
      `UID:nz-2026-tag-${String(day.number).padStart(2, "0")}@axholio.github.io`,
      "DTSTAMP:20260707T000000Z",
      `DTSTART;VALUE=DATE:${formatDate(start)}`,
      `DTEND;VALUE=DATE:${formatDate(end)}`,
      `SUMMARY:${escapeIcs(`Neuseeland 2026 · Tag ${day.number}: ${day.route}`)}`,
      `DESCRIPTION:${escapeIcs(details)}`,
      `LOCATION:${escapeIcs(day.end || day.route)}`,
      "STATUS:CONFIRMED",
      "TRANSP:TRANSPARENT",
      "END:VEVENT"
    ];
    return lines.map(foldLine);
  }

  function exportCalendar(days, filename) {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Axholio//Neuseeland 2026 Reiseführer//DE",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${escapeIcs("Neuseeland 2026 – Südinsel-Rundreise")}`,
      "X-WR-CALDESC:Persönlicher Reiseplan · 7.–17. September 2026",
      ...days.flatMap(eventLines),
      "END:VCALENDAR",
      ""
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function fillSelect() {
    select.innerHTML = data.days.map((day) => {
      const label = `Tag ${day.number} · ${day.date} · ${day.route}`;
      return `<option value="${day.number}">${label}</option>`;
    }).join("");
  }

  fillSelect();

  allButton.addEventListener("click", function () {
    exportCalendar(data.days, "Neuseeland-2026-Suedinsel-Rundreise.ics");
    setStatus("Kalenderdatei für alle 11 Reisetage wurde erstellt.");
  });

  dayButton.addEventListener("click", function () {
    const selected = data.days.find((day) => String(day.number) === select.value);
    if (!selected) return;
    exportCalendar([selected], `Neuseeland-2026-Tag-${String(selected.number).padStart(2, "0")}.ics`);
    setStatus(`Kalenderdatei für Tag ${selected.number} wurde erstellt: ${selected.route}.`);
  });
}());

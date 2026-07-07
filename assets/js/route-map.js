(function () {
  "use strict";

  function initRouteMap() {
    const target = document.getElementById("route-map");
    const config = window.tripData && window.tripData.routeMap;
    if (!target || !config || !window.L) return;

    target.innerHTML = "";
    const map = window.L.map(target, {
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: true
    });

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap-Mitwirkende"
    }).addTo(map);

    const colors = {
      rail: "#b17c2e",
      road: "#2d705e",
      return: "#b36745",
      local: "#577a6e"
    };

    const bounds = [];
    config.segments.forEach(function (segment) {
      const color = colors[segment.kind] || colors.road;
      const line = window.L.polyline(segment.points, {
        color: color,
        weight: segment.kind === "rail" ? 5 : 4,
        opacity: 0.86,
        dashArray: segment.kind === "rail" ? "8 7" : null,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(map);

      line.bindTooltip("Tag " + segment.day + " · " + segment.title, {
        sticky: true,
        direction: "top",
        offset: [0, -8],
        className: "route-map-tooltip"
      });
      line.on("click", function () {
        const stage = document.querySelector('[data-route-day="' + segment.day + '"]');
        if (stage) stage.click();
      });
      segment.points.forEach(function (point) { bounds.push(point); });
    });

    config.stops.forEach(function (stop) {
      const icon = window.L.divIcon({
        className: "route-map-marker-wrap",
        html: '<span class="route-map-marker">' + stop.label + "</span>",
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const marker = window.L.marker(stop.point, { icon: icon, keyboard: true }).addTo(map);
      marker.bindPopup(
        "<strong>" + stop.name + "</strong><br><span>" + stop.detail + "</span>",
        { closeButton: true, autoPanPadding: [24, 24] }
      );
      bounds.push(stop.point);
    });

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [26, 26], maxZoom: 7 });
    } else {
      map.setView(config.center, config.zoom);
    }

    window.setTimeout(function () { map.invalidateSize(); }, 60);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRouteMap, { once: true });
  } else {
    initRouteMap();
  }
}());

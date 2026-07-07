(function () {
  "use strict";

  const status = document.getElementById("pwa-status");
  const detail = document.getElementById("pwa-detail");
  const installButtons = Array.from(document.querySelectorAll("[data-install-guide]"));
  let deferredInstallPrompt = null;

  function setStatus(message, note, mode) {
    if (status) {
      status.textContent = message;
      status.dataset.state = mode || "neutral";
    }
    if (detail && note) detail.textContent = note;
  }

  function setInstallVisibility(visible) {
    installButtons.forEach((button) => {
      button.hidden = !visible;
    });
  }

  function connectionLabel() {
    if (!navigator.onLine) {
      setStatus(
        "Du bist offline – der gespeicherte Guide ist verfügbar.",
        "Karte, externe Links und Live-Informationen brauchen wieder eine Verbindung.",
        "offline"
      );
      return;
    }
    setStatus(
      "Online – Offline-Version wird auf diesem Gerät bereitgehalten.",
      "Vor Fahrtbeginn den Guide einmal vollständig geöffnet lassen, bis dieser Hinweis erscheint.",
      "online"
    );
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      setStatus(
        "Dieser Browser unterstützt keinen Offline-Cache.",
        "Der Guide bleibt online nutzbar; für Offline-Funktionen einen aktuellen Browser verwenden.",
        "error"
      );
      return;
    }

    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./service-worker.js", { scope: "./" })
        .then(function (registration) {
          if (registration.active) connectionLabel();
          registration.addEventListener("updatefound", function () {
            const worker = registration.installing;
            if (!worker) return;
            worker.addEventListener("statechange", function () {
              if (worker.state === "activated") connectionLabel();
            });
          });
        })
        .catch(function () {
          setStatus(
            "Offline-Cache konnte nicht aktiviert werden.",
            "Über GitHub Pages muss die Seite per HTTPS geöffnet werden. Beim lokalen Öffnen einer Datei ist diese Funktion nicht verfügbar.",
            "error"
          );
        });
    }, { once: true });
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredInstallPrompt = event;
    setInstallVisibility(true);
  });

  installButtons.forEach(function (button) {
    button.addEventListener("click", async function () {
      if (!deferredInstallPrompt) {
        setStatus(
          "Installation im Browser starten.",
          "Im Browser-Menü „Zum Home-Bildschirm“ oder „App installieren“ wählen.",
          "online"
        );
        return;
      }
      deferredInstallPrompt.prompt();
      try {
        await deferredInstallPrompt.userChoice;
      } finally {
        deferredInstallPrompt = null;
        setInstallVisibility(false);
      }
    });
  });

  window.addEventListener("appinstalled", function () {
    setInstallVisibility(false);
    setStatus(
      "Guide wurde auf dem Gerät gespeichert.",
      "Die App lässt sich jetzt über das App-Symbol oder den Startbildschirm öffnen.",
      "installed"
    );
  });

  window.addEventListener("online", connectionLabel);
  window.addEventListener("offline", connectionLabel);

  if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
    setStatus(
      "Guide läuft als Web-App auf diesem Gerät.",
      "Die Inhalte bleiben nach dem ersten vollständigen Laden offline verfügbar.",
      "installed"
    );
  } else {
    connectionLabel();
  }

  registerServiceWorker();
}());

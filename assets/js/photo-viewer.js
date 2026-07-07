(function () {
  "use strict";

  const dialog = document.getElementById("photo-dialog");
  const image = document.getElementById("photo-dialog-image");
  const kicker = document.getElementById("photo-dialog-kicker");
  const title = document.getElementById("photo-dialog-title");
  const caption = document.getElementById("photo-dialog-caption");
  const triggers = Array.from(document.querySelectorAll("[data-open-photo]"));

  if (!dialog || !image || !kicker || !title || !caption || !triggers.length) return;

  let activeIndex = 0;
  let opener = null;

  const photos = triggers.map((trigger) => {
    const figure = trigger.closest("figure");
    const source = trigger.querySelector("img");
    const label = figure ? figure.querySelector("figcaption span") : null;
    const heading = figure ? figure.querySelector("figcaption h3") : null;
    const copy = figure ? figure.querySelector("figcaption p") : null;
    return {
      src: source ? source.getAttribute("src") : "",
      alt: source ? source.getAttribute("alt") : "",
      kicker: label ? label.textContent.trim() : "Bild der Route",
      title: heading ? heading.textContent.trim() : "Bild der Route",
      caption: copy ? copy.textContent.trim() : ""
    };
  });

  function renderPhoto(index) {
    activeIndex = (index + photos.length) % photos.length;
    const photo = photos[activeIndex];
    image.src = photo.src;
    image.alt = photo.alt;
    kicker.textContent = photo.kicker;
    title.textContent = photo.title;
    caption.textContent = photo.caption;
    const position = `${activeIndex + 1} von ${photos.length}`;
    dialog.querySelector("[data-photo-previous]").setAttribute("aria-label", `Vorheriges Bild, ${position}`);
    dialog.querySelector("[data-photo-next]").setAttribute("aria-label", `Nächstes Bild, ${position}`);
  }

  function open(index, trigger) {
    opener = trigger || document.activeElement;
    renderPhoto(index);
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    dialog.querySelector("[data-close-photo]").focus();
  }

  function close() {
    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
    if (opener && typeof opener.focus === "function") opener.focus();
  }

  triggers.forEach((trigger, index) => {
    trigger.addEventListener("click", () => open(index, trigger));
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target.closest("[data-close-photo]")) close();
    if (event.target.closest("[data-photo-previous]")) renderPhoto(activeIndex - 1);
    if (event.target.closest("[data-photo-next]")) renderPhoto(activeIndex + 1);
  });

  document.addEventListener("keydown", (event) => {
    if (!dialog.open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
    if (event.key === "ArrowLeft") renderPhoto(activeIndex - 1);
    if (event.key === "ArrowRight") renderPhoto(activeIndex + 1);
  });
}());

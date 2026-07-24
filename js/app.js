(function () {
  "use strict";

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function () {
        // The app still works online when service worker registration is unavailable.
      });
    });
  }

  document.addEventListener("click", function (event) {
    document.querySelectorAll(".mobile-more[open]").forEach(function (menu) {
      if (!menu.contains(event.target)) menu.removeAttribute("open");
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    document.querySelectorAll(".mobile-more[open]").forEach(function (menu) {
      menu.removeAttribute("open");
      const summary = menu.querySelector("summary");
      if (summary) summary.focus();
    });
  });
})();

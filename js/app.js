(function () {
  "use strict";

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function () {
        // The app still works online when service worker registration is unavailable.
      });
    });
  }
})();

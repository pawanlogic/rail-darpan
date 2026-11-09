(() => {
  let deferredInstallPrompt = null;
  let installButton = null;
  let offlineBanner = null;

  const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true;

  const isAppleMobile = () =>
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  function createInstallButton() {
    const nav = document.querySelector("header nav");
    if (!nav || document.getElementById("rdPwaInstallButton")) return;

    const style = document.createElement("style");
    style.textContent = `
      .rd-pwa-install-button {
        border: 0;
        border-radius: 9px;
        padding: 10px 15px;
        background: #1459d9;
        color: #fff;
        font-size: 13px;
        font-weight: 750;
        cursor: pointer;
      }
      .rd-pwa-install-button[hidden] { display: none !important; }
      .rd-pwa-offline-banner {
        padding: 11px 16px;
        text-align: center;
        background: #fff1d6;
        color: #754600;
        font-size: 13px;
        line-height: 1.5;
      }
    `;
    document.head.appendChild(style);

    installButton = document.createElement("button");
    installButton.id = "rdPwaInstallButton";
    installButton.type = "button";
    installButton.className = "rd-pwa-install-button";
    installButton.textContent = "Install App";
    installButton.hidden = true;

    installButton.addEventListener("click", async () => {
      if (deferredInstallPrompt) {
        const promptEvent = deferredInstallPrompt;
        deferredInstallPrompt = null;

        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;

        if (choice.outcome === "accepted") {
          installButton.hidden = true;
        }

        return;
      }

      if (isAppleMobile()) {
        window.alert(
          "To install Rail Darpan:\n\n" +
          "1. Open this website in Safari.\n" +
          "2. Tap the Share button.\n" +
          "3. Select Add to Home Screen.\n" +
          "4. Tap Add."
        );
      }
    });

    nav.appendChild(installButton);

    if (!isStandalone() && isAppleMobile()) {
      installButton.hidden = false;
    }
  }

  function updateNetworkStatus() {
    if (!document.body) return;

    if (!navigator.onLine) {
      if (!offlineBanner) {
        offlineBanner = document.createElement("div");
        offlineBanner.className = "rd-pwa-offline-banner";
        offlineBanner.textContent =
          "You are offline. Current railway information needs an internet connection.";

        document.body.insertBefore(offlineBanner, document.body.firstChild);
      }
    } else if (offlineBanner) {
      offlineBanner.remove();
      offlineBanner = null;
    }
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(error => {
        console.error("App installation support could not be enabled:", error);
      });
  }

  function init() {
    createInstallButton();
    updateNetworkStatus();
    registerServiceWorker();

    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    window.addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      deferredInstallPrompt = event;

      if (installButton && !isStandalone()) {
        installButton.hidden = false;
      }
    });

    window.addEventListener("appinstalled", () => {
      if (installButton) installButton.hidden = true;
      deferredInstallPrompt = null;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

(() => {
  "use strict";

  const firebaseConfig = {
    apiKey: "AIzaSyBCT8iWHpru4iuMpYsoT_Lb9_y_lqGxRig",
    authDomain: "rail-darpan.firebaseapp.com",
    projectId: "rail-darpan",
    storageBucket: "rail-darpan.firebasestorage.app",
    messagingSenderId: "754436844412",
    appId: "1:754436844412:web:33a16b3b679e143cf352f9"
  };

  if (!window.firebase) {
    console.error("Firebase SDK did not load.");
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const auth = firebase.auth();
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(console.error);

  let currentUser = null;
  let modalOpen = false;

  const $ = id => document.getElementById(id);

  function addStyles() {
    if ($("rdAuthStyles")) return;

    const style = document.createElement("style");
    style.id = "rdAuthStyles";
    style.textContent = `
      #rdAuthButton {
        border:0;border-radius:9px;padding:10px 16px;
        background:#1459d9;color:white;font-weight:750;
        cursor:pointer;font-size:13px;margin-left:10px;
      }
      #rdAuthOverlay {
        position:fixed;inset:0;z-index:999999;
        display:none;align-items:center;justify-content:center;
        padding:18px;background:rgba(5,12,28,.72);
        backdrop-filter:blur(5px);
      }
      #rdAuthOverlay.rd-auth-visible {display:flex}
      .rd-auth-card {
        width:min(100%,420px);background:#fff;color:#152238;
        border-radius:18px;padding:26px;position:relative;
        box-shadow:0 24px 80px rgba(0,0,0,.3);
        font-family:Arial,sans-serif;
      }
      .rd-auth-card h2 {margin:0 0 8px;font-size:24px}
      .rd-auth-muted {color:#68758a;font-size:13px;line-height:1.6}
      .rd-auth-close {
        position:absolute;right:15px;top:12px;border:0;
        background:#eef2f7;border-radius:50%;width:34px;height:34px;
        cursor:pointer;font-size:20px;
      }
      .rd-auth-action {
        width:100%;padding:13px;border-radius:9px;
        border:1px solid #d7dfeb;background:#fff;
        color:#17243a;font-weight:700;cursor:pointer;
        margin-top:12px;font-size:14px;
      }
      .rd-auth-primary {background:#1459d9;color:#fff;border:0}
      .rd-auth-input {
        width:100%;padding:13px;border:1px solid #d7dfeb;
        border-radius:9px;font-size:15px;box-sizing:border-box;
        margin-top:10px;outline-color:#1459d9;
      }
      #rdAuthMessage {
        min-height:20px;margin-top:12px;font-size:13px;
        line-height:1.5;color:#b42318;
      }

      .rd-auth-brand {
        text-align:center;
        padding:8px 4px 18px;
      }
      .rd-auth-brand img {
        display:block;
        width:108px;
        height:108px;
        object-fit:contain;
        margin:0 auto 10px;
      }
      .rd-auth-brand-name {
        color:#1459d9;
        font-size:19px;
        font-weight:800;
        letter-spacing:1.5px;
        margin-bottom:16px;
      }
      .rd-auth-brand h2 {margin:0 0 8px;font-size:25px}
      .rd-auth-brand .rd-auth-muted {margin:0 auto;max-width:310px}
      .rd-auth-google {
        display:flex;
        align-items:center;
        justify-content:center;
        gap:12px;
        min-height:48px;
        margin-top:8px;
      }
      .rd-google-g {
        font-size:21px;
        font-weight:800;
        color:#4285f4;
      }
      .rd-auth-footer {text-align:center;margin-top:16px}

      #rdAuthUser {font-size:12px;color:#ffffff;margin-left:8px;font-weight:600;opacity:1;text-shadow:0 1px 2px rgba(0,0,0,.35)}
      @media(max-width:600px) {
        #rdAuthButton {padding:9px 11px;margin-left:4px}
        .rd-auth-card {padding:22px}
      }
    `;
    document.head.appendChild(style);
  }

  function createUI() {
    addStyles();

    const nav = document.querySelector("header nav");
    if (nav && !$("rdAuthButton")) {
      const button = document.createElement("button");
      button.id = "rdAuthButton";
      button.type = "button";
      button.textContent = "Login";
      button.addEventListener("click", () => {
        if (currentUser) {
          logout();
        } else {
          openModal();
        }
      });
      nav.appendChild(button);
    }

    if (nav && !$("rdAuthUser")) {
      const userLabel = document.createElement("button");
      userLabel.id = "rdAuthUser";
      userLabel.setAttribute("aria-live", "polite");
      nav.appendChild(userLabel);
    }

    if (!$("rdAuthOverlay")) {
      const overlay = document.createElement("div");
      overlay.id = "rdAuthOverlay";
      overlay.innerHTML = `
        <div class="rd-auth-card" role="dialog"
             aria-modal="true" aria-labelledby="rdAuthTitle">
          <button class="rd-auth-close" id="rdAuthClose"
                  aria-label="Close">&times;</button>

          <div class="rd-auth-brand">
            <img src="/images/logo.png" alt="Rail Darpan Logo">
            <div class="rd-auth-brand-name">RAIL DARPAN</div>
            <h2 id="rdAuthTitle">Welcome Back</h2>
            <p class="rd-auth-muted">
              Sign in to access PNR status, live train tracking,
              schedules and railway services.
            </p>
          </div>

          <button class="rd-auth-action rd-auth-google" id="rdGoogleLogin">
            <span class="rd-google-g">G</span>
            Continue with Google
          </button>

          <div id="rdAuthMessage" role="status" aria-live="polite"></div>
          <p class="rd-auth-muted rd-auth-footer">
            Secure login with your Google Account.
          </p>
        </div>
      `;
      document.body.appendChild(overlay);

      $("rdAuthClose").addEventListener("click", closeModal);
      overlay.addEventListener("click", event => {
        if (event.target === overlay) closeModal();
      });
      $("rdGoogleLogin").addEventListener("click", googleLogin);
    }

    setupAccountMenu();
    updateUserUI(currentUser);
}


  function setupAccountMenu() {
    const userLabel = $("rdAuthUser");
    if (!userLabel || $("rdAccountMenu")) return;

    userLabel.type = "button";
    userLabel.setAttribute("aria-haspopup", "true");
    userLabel.setAttribute("aria-expanded", "false");

    const menu = document.createElement("div");
    menu.id = "rdAccountMenu";
    menu.hidden = true;
    menu.innerHTML = `
      <button type="button" data-action="profile">My Profile</button>
      <button type="button" data-action="settings">Settings</button>
      <button type="button" data-action="logout">Logout</button>
    `;
    document.body.appendChild(menu);

    const panel = document.createElement("div");
    panel.id = "rdAccountPanel";
    panel.hidden = true;
    panel.innerHTML = `
      <div class="rd-account-card" role="dialog" aria-modal="true">
        <button type="button" id="rdAccountClose" aria-label="Close">×</button>
        <h2 id="rdAccountHeading">My Profile</h2>
        <div id="rdAccountContent"></div>
      </div>
    `;
    document.body.appendChild(panel);

    userLabel.addEventListener("click", () => {
      if (!currentUser) return openModal();
      const rect = userLabel.getBoundingClientRect();
      menu.style.top = (rect.bottom + 8) + "px";
      menu.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 220)) + "px";
      menu.hidden = !menu.hidden;
      userLabel.setAttribute("aria-expanded", String(!menu.hidden));
    });

    document.addEventListener("click", event => {
      if (!menu.hidden && !menu.contains(event.target) && event.target !== userLabel) {
        menu.hidden = true;
        userLabel.setAttribute("aria-expanded", "false");
      }
    });

    menu.addEventListener("click", event => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (!action) return;
      menu.hidden = true;
      userLabel.setAttribute("aria-expanded", "false");

      if (action === "logout") logout();
      else showAccountPanel(action);
    });

    $("rdAccountClose").addEventListener("click", () => {
      panel.hidden = true;
    });

    panel.addEventListener("click", event => {
      if (event.target === panel) panel.hidden = true;
    });

    const style = document.createElement("style");
    style.id = "rdAccountMenuStyles";
    style.textContent = `
      #rdAuthUser {
        display:none;
        color:#fff!important;
        background:transparent;
        border:0;
        padding:8px;
        font:inherit;
        font-size:12px;
        font-weight:600;
        cursor:pointer;
        border-radius:8px;
      }
      #rdAuthUser:hover {background:rgba(255,255,255,.12)}
      #rdAccountMenu {
        position:fixed;
        z-index:100001;
        width:205px;
        padding:7px;
        background:#101c31;
        border:1px solid #34445f;
        border-radius:12px;
        box-shadow:0 12px 35px rgba(0,0,0,.35);
      }
      #rdAccountMenu[hidden], #rdAccountPanel[hidden] {display:none!important}
      #rdAccountMenu button {
        display:block;
        width:100%;
        padding:12px;
        text-align:left;
        color:#fff;
        background:transparent;
        border:0;
        border-radius:8px;
        cursor:pointer;
      }
      #rdAccountMenu button:hover {background:#263a59}
      #rdAccountMenu button:last-child {color:#ff8585}
      #rdAccountPanel {
        position:fixed;
        inset:0;
        z-index:100002;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:16px;
        background:rgba(0,0,0,.7);
      }
      .rd-account-card {
        position:relative;
        width:min(100%,430px);
        padding:26px;
        color:#fff;
        background:#101c31;
        border:1px solid #34445f;
        border-radius:16px;
        box-shadow:0 20px 60px rgba(0,0,0,.4);
      }
      #rdAccountClose {
        position:absolute;
        top:12px;
        right:15px;
        color:#fff;
        background:transparent;
        border:0;
        font-size:26px;
        cursor:pointer;
      }
      .rd-account-card h2 {margin:0 35px 20px 0}
      .rd-account-card label {
        display:block;
        margin:13px 0 6px;
        color:#b9c7dc;
        font-size:13px;
      }
      .rd-account-card input {
        width:100%;
        box-sizing:border-box;
        padding:12px;
        color:#fff;
        background:#1b2b44;
        border:1px solid #405574;
        border-radius:8px;
      }
      .rd-account-value {
        padding:11px;
        background:#1b2b44;
        border-radius:8px;
        overflow-wrap:anywhere;
      }
      .rd-account-save {
        width:100%;
        margin-top:18px;
        padding:12px;
        color:#fff;
        background:#1769e0;
        border:0;
        border-radius:8px;
        cursor:pointer;
      }
      #rdAccountMessage {margin-top:12px;font-size:13px;color:#a9d4ff}
      @media(max-width:600px) {
        #rdAuthUser {max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      }
    `;
    document.head.appendChild(style);
  }

  function showAccountPanel(mode) {
    const user = currentUser;
    if (!user) return openModal();

    const panel = $("rdAccountPanel");
    const heading = $("rdAccountHeading");
    const content = $("rdAccountContent");
    if (!panel || !content) return;

    if (mode === "profile") {
      heading.textContent = "My Profile";
      content.innerHTML = `
        <label>Name</label>
        <div class="rd-account-value" id="rdProfileName"></div>
        <label>Email</label>
        <div class="rd-account-value" id="rdProfileEmail"></div>
<label>Sign-in Provider</label>
        <div class="rd-account-value" id="rdProfileProvider"></div>
      `;
      $("rdProfileName").textContent = user.displayName || "Not set";
      $("rdProfileEmail").textContent = user.email || "Not provided";
$("rdProfileProvider").textContent =
        (user.providerData || []).map(item => item.providerId).join(", ") || "Firebase";
    } else {
      heading.textContent = "Settings";
      content.innerHTML = `
        <label for="rdEditDisplayName">Display Name</label>
        <input id="rdEditDisplayName" maxlength="80" autocomplete="name">
        <p style="font-size:12px;color:#aebbd0">
          Your Google Account email is managed securely by Google.
        </p>
        <button type="button" class="rd-account-save" id="rdSaveDisplayName">
          Save Changes
        </button>
        <div id="rdAccountMessage" role="status"></div>
      `;
      $("rdEditDisplayName").value = user.displayName || "";

      $("rdSaveDisplayName").addEventListener("click", async () => {
        const name = $("rdEditDisplayName").value.trim();
        const message = $("rdAccountMessage");
        const saveButton = $("rdSaveDisplayName");

        if (name.length < 2) {
          message.textContent = "Enter a name with at least 2 characters.";
          return;
        }

        try {
          saveButton.disabled = true;
          message.textContent = "Saving...";
          await user.updateProfile({ displayName: name });
          updateUserUI(auth.currentUser);
          message.textContent = "Profile name updated successfully.";
        } catch (error) {
          console.error("Profile update:", error);
          message.textContent = error.message || "Could not update profile.";
        } finally {
          saveButton.disabled = false;
        }
      });
    }

    panel.hidden = false;
  }

function openModal() {
    if (!$("rdAuthOverlay")) return;
    modalOpen = true;
    $("rdAuthOverlay").classList.add("rd-auth-visible");
    setMessage("");
  }

  function closeModal() {
    modalOpen = false;
    $("rdAuthOverlay")?.classList.remove("rd-auth-visible");
    setMessage("");
  }

  function setMessage(message) {
    if ($("rdAuthMessage")) $("rdAuthMessage").textContent = message;
  }

  function updateUserUI(user) {
    currentUser = user || null;
    const button = $("rdAuthButton");

    if (button) {
      button.textContent = "Login";
      button.style.display = currentUser ? "none" : "";
      const userLabel = $("rdAuthUser");
    if (userLabel) {
      if (currentUser) {
        const name = currentUser.displayName || currentUser.email || "Rail Darpan User";
        const contact = currentUser.email || "";
        userLabel.textContent = contact ? name + " · " + contact + " ▾" : name + " ▾";
        userLabel.style.display = "inline-flex";
        userLabel.title = contact;
      } else {
        userLabel.textContent = "";
        userLabel.style.display = "none";
        userLabel.title = "";
      }
    }

    button.title = currentUser
        ? (currentUser.email || "Signed in")
        : "Login to Rail Darpan";
    }

    document.dispatchEvent(new CustomEvent("railDarpanAuthChanged", {
      detail: {
        user: currentUser ? {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName
        } : null
      }
    }));

    if (currentUser && modalOpen) closeModal();
  }

  async function googleLogin() {
    try {
      setMessage("Opening Google sign-in...");
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await auth.signInWithPopup(provider);
    } catch (error) {
      console.error("Google sign-in:", error);
      setMessage(error.message || "Google login failed.");
    }
  }


  async function logout() {
    try {
      await auth.signOut();
      updateUserUI(null);
    } catch (error) {
      console.error("Logout:", error);
      alert("Could not sign out. Please try again.");
    }
  }

  // Attach Firebase ID tokens to same-origin protected API requests.
  // Health and public railway news remain public.
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function(input, init) {
    let url;

    try {
      url = new URL(
        input instanceof Request ? input.url : input,
        window.location.href
      );
    } catch (_) {
      return originalFetch(input, init);
    }

    const isApi = url.origin === window.location.origin &&
      url.pathname.startsWith("/api/");

    const isPublic = url.pathname === "/api/health" ||
      url.pathname === "/api/news";

    if (isApi && !isPublic && currentUser) {
      try {
        const token = await currentUser.getIdToken();
        const headers = new Headers(
          init?.headers ||
          (input instanceof Request ? input.headers : undefined)
        );
        headers.set("Authorization", "Bearer " + token);
        init = { ...init, headers };
      } catch (error) {
        console.error("Could not obtain Firebase token:", error);
      }
    }

    const response = await originalFetch(input, init);

    if (isApi && !isPublic && response.status === 401) {
      response.clone().json().then(data => {
        if (
          data?.code === "AUTH_REQUIRED" ||
          data?.code === "INVALID_TOKEN"
        ) {
          document.dispatchEvent(new CustomEvent("railDarpanLoginRequired"));
          if (!currentUser) openModal();
        }
      }).catch(() => {});
    }

    return response;
  };

  auth.onAuthStateChanged(updateUserUI);

  document.addEventListener("railDarpanLoginRequired", () => {
    if (!currentUser) openModal();
  });

  window.RailDarpanAuth = {
    get currentUser() { return currentUser; },
    getIdToken: async () => currentUser ? currentUser.getIdToken() : null,
    loginGoogle: googleLogin,
    logout,
    openLogin: openModal
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createUI, { once: true });
  } else {
    createUI();
  }
})();

(() => {
  "use strict";

  const SUPABASE_URL = "https://pydhzquxqhcnivjsyntz.supabase.co";

  // Yahan APNI publishable key paste karo.
  // Ye Settings → API Keys mein "Publishable key" hai.
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_zMLSa5HCsgO2dduSO_lIRg_chA18HRZ";

  const { createClient } = window.supabase;
  const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  const ADMIN_EMAIL = "akshit.25kumar@gmail.com";

  const views = {
    home: document.getElementById("homeView"),
    login: document.getElementById("loginView"),
    dashboard: document.getElementById("dashboardView")
  };

  const confessionForm = document.getElementById("confessionForm");
  const confessionText = document.getElementById("confessionText");
  const recipientInput = document.getElementById("recipient");
  const successMessage = document.getElementById("successMessage");
  const submitError = document.getElementById("submitError");

  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");

  const recordsList = document.getElementById("recordsList");

  const deleteModal = document.getElementById("deleteModal");

  let pendingDeleteId = null;
  let returnFocus = null;

  // -----------------------------
  // AUTH
  // -----------------------------

  async function isAuthenticated() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error(error);
      return false;
    }

    return Boolean(data.session);
  }

  async function setView(name) {
    const authenticated = await isAuthenticated();

    const safeName =
      name === "dashboard" && !authenticated
        ? "login"
        : name;

    Object.entries(views).forEach(([key, view]) => {
      view.hidden = key !== safeName;
    });

    if (safeName === "dashboard") {
      await renderDashboard();
    }

    if (safeName === "login") {
      loginError.hidden = true;

      window.setTimeout(() => {
        const emailInput = document.getElementById("adminEmail");
        if (emailInput) emailInput.focus();
      }, 0);
    }
  }

  // -----------------------------
  // NAVIGATION
  // -----------------------------

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      setView(button.dataset.view);
    });
  });

  document.querySelectorAll("[data-home]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setView("home");
    });
  });

  // -----------------------------
  // SUBMIT CONFESSION
  // -----------------------------

  confessionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const text = confessionText.value.trim();
    const recipient = recipientInput.value.trim() || null;

    if (!text) {
      submitError.textContent = "Pehle apni baat likhein.";
      submitError.hidden = false;
      confessionText.focus();
      return;
    }

    submitError.hidden = true;

    const { error } = await supabaseClient
      .from("confessions")
      .insert({
        text,
        recipient
      });

    if (error) {
      console.error("Confession submit error:", error);

      submitError.textContent =
        "Confession save nahi ho paaya. Dobara try karein.";

      submitError.hidden = false;
      return;
    }

    confessionForm.reset();

    successMessage.hidden = false;
    confessionText.focus();
  });

  confessionText.addEventListener("input", () => {
    if (!successMessage.hidden) {
      successMessage.hidden = true;
    }

    submitError.hidden = true;
  });

  // -----------------------------
  // LOGIN
  // -----------------------------

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    loginError.hidden = true;

    const emailInput = document.getElementById("adminEmail");
    const passwordInput = document.getElementById("adminPassword");

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showLoginError("Apna email aur password likhein.");
      (!email ? emailInput : passwordInput).focus();
      return;
    }

    if (!emailInput.validity.valid) {
      showLoginError("Sahi email format likhein.");
      emailInput.focus();
      return;
    }

    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      showLoginError("Email ya password sahi nahi hai.");
      passwordInput.focus();
      return;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error("Login error:", error);
      showLoginError("Email ya password sahi nahi hai.");
      passwordInput.focus();
      return;
    }

    loginForm.reset();

    await setView("dashboard");
  });

  function showLoginError(message) {
    loginError.textContent = message;
    loginError.hidden = false;
  }

  // -----------------------------
  // LOGOUT
  // -----------------------------

  document
    .getElementById("logoutButton")
    .addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      await setView("home");
    });

  // -----------------------------
  // LOAD CONFESSIONS
  // -----------------------------

  async function renderDashboard() {
    const { data: records, error } = await supabaseClient
      .from("confessions")
      .select("id, created_at, text, recipient")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Dashboard error:", error);

      recordsList.replaceChildren();

      const errorMessage = document.createElement("div");
      errorMessage.className = "empty-state";
      errorMessage.textContent =
        "Confessions load nahi ho paayi. Dobara refresh karein.";

      recordsList.append(errorMessage);
      return;
    }

    const safeRecords = Array.isArray(records) ? records : [];

    document.getElementById("adminEmailLabel").textContent = ADMIN_EMAIL;

    document.getElementById("totalCount").textContent =
      String(safeRecords.length);

    document.getElementById("recordCount").textContent =
      `${safeRecords.length} ${
        safeRecords.length === 1
          ? "CONFESSION"
          : "CONFESSIONS"
      }`;

    recordsList.replaceChildren();

    if (!safeRecords.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";

      const illustration = document.createElement("img");
      illustration.className = "empty-doraemon";
      illustration.src = "./images/doraemon-note.png";
      illustration.alt = "";

      const title = document.createElement("strong");
      title.textContent = "Abhi tak koi confession nahi aaya.";

      const detail = document.createElement("span");
      detail.textContent =
        "Jab koi apni baat bhejega, yahan dikh jayegi.";

      empty.append(illustration, title, detail);
      recordsList.append(empty);

      return;
    }

    safeRecords.forEach((record) => {
      const item = document.createElement("article");
      item.className = "record-item";

      const content = document.createElement("div");

      const message = document.createElement("p");
      message.className = "record-text";
      message.textContent = record.text;

      const meta = document.createElement("div");
      meta.className = "record-meta";

      const date = document.createElement("time");

      const parsedDate = new Date(record.created_at);

      if (!Number.isNaN(parsedDate.getTime())) {
        date.dateTime = record.created_at;

        date.textContent = parsedDate.toLocaleString(
          "hi-Latn-IN",
          {
            dateStyle: "medium",
            timeStyle: "short"
          }
        );
      } else {
        date.textContent = "Date nahi mil paayi.";
      }

      meta.append(date);

      if (record.recipient) {
        const recipient = document.createElement("span");
        recipient.className = "recipient-tag";
        recipient.textContent =
          `Jinke liye: ${record.recipient}`;

        meta.append(recipient);
      }

      content.append(message, meta);

      const deleteButton = document.createElement("button");

      deleteButton.type = "button";
      deleteButton.className = "record-delete";
      deleteButton.textContent = "Mitaayein";
      deleteButton.setAttribute(
        "aria-label",
        "Yeh confession mitaayein"
      );

      deleteButton.addEventListener("click", () => {
        openDeleteModal(record.id, deleteButton);
      });

      item.append(content, deleteButton);

      recordsList.append(item);
    });
  }

  // -----------------------------
  // DELETE
  // -----------------------------

  function openDeleteModal(id, button) {
    pendingDeleteId = id;
    returnFocus = button;

    deleteModal.hidden = false;

    document.getElementById("cancelDelete").focus();
  }

  function closeDeleteModal() {
    deleteModal.hidden = true;
    pendingDeleteId = null;

    if (returnFocus && document.contains(returnFocus)) {
      returnFocus.focus();
    }
  }

  document
    .getElementById("cancelDelete")
    .addEventListener("click", closeDeleteModal);

  document
    .getElementById("confirmDelete")
    .addEventListener("click", async () => {
      if (!pendingDeleteId) return;

      const { error } = await supabaseClient
        .from("confessions")
        .delete()
        .eq("id", pendingDeleteId);

      if (error) {
        console.error("Delete error:", error);
        closeDeleteModal();
        return;
      }

      closeDeleteModal();
      await renderDashboard();
    });

  deleteModal.addEventListener("click", (event) => {
    if (event.target === deleteModal) {
      closeDeleteModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (deleteModal.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeDeleteModal();
    } else if (event.key === "Tab") {
      const focusables = [
        document.getElementById("cancelDelete"),
        document.getElementById("confirmDelete")
      ];

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  // -----------------------------
  // START APP
  // -----------------------------

  supabaseClient.auth.onAuthStateChange(() => {
    // Auth state is handled when views are opened.
  });

  setView("home");
})();
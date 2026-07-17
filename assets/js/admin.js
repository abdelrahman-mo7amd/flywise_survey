// FlyWise - admin.js
(async function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Wait for firebase-config.js (loaded as a module before this one) to
     expose window.FlyWiseData. Small retry loop keeps this robust even if
     module execution order timing varies across browsers.
     --------------------------------------------------------------------- */
  async function waitForFlyWiseData(maxWaitMs = 3000) {
    const start = Date.now();
    while (!window.FlyWiseData && Date.now() - start < maxWaitMs) {
      await new Promise((r) => setTimeout(r, 50));
    }
    return window.FlyWiseData || null;
  }

  const LOCAL_KEY = "flywise_survey_responses";

  /* ---------------------------------------------------------------------
     One-time cleanup: earlier versions of this dashboard auto-seeded 42
     fake "FW-DEMO-xxx" responses into localStorage so the page wasn't
     empty on first open. That's been removed - this strips out any of
     those demo rows a browser may still be holding from before.
     --------------------------------------------------------------------- */
  function removeAnyStoredDemoData() {
    let existing = [];
    try {
      existing = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    } catch {
      existing = [];
    }
    const real = existing.filter((r) => r.source !== "demo");
    if (real.length !== existing.length) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(real));
    }
  }

  removeAnyStoredDemoData();

  const FlyWiseData = await waitForFlyWiseData();

  /* ---------------------------------------------------------------------
     AUTH GATE
     The dashboard reads every survey response, so it stays hidden behind
     a Firebase Auth sign-in. If Auth isn't reachable at all (offline /
     Firebase blocked), we fall back to showing local demo data straight
     away, since there is nothing sensitive to protect in that case.
     --------------------------------------------------------------------- */
  const loginView = document.getElementById("admin-login");
  const appView = document.getElementById("admin-app");
  const loginForm = document.getElementById("admin-login-form");
  const loginError = document.getElementById("admin-login-error");
  const loginNote = document.getElementById("admin-login-note");
  const loginBtn = document.getElementById("admin-login-btn");
  const userEmailLabel = document.getElementById("admin-user-email");
  const signOutBtn = document.getElementById("admin-signout-btn");

  let dashboardStarted = false;

  function showLogin(message) {
    loginView.classList.remove("hidden");
    appView.classList.add("hidden");
    if (message) {
      loginError.textContent = message;
      loginError.classList.remove("hidden");
    } else {
      loginError.classList.add("hidden");
    }
  }

  function showApp(user) {
    loginView.classList.add("hidden");
    appView.classList.remove("hidden");
    if (userEmailLabel) userEmailLabel.textContent = user ? user.email : "";
    if (!dashboardStarted) {
      dashboardStarted = true;
      startDashboard();
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("admin-email").value.trim();
      const password = document.getElementById("admin-password").value;
      loginBtn.disabled = true;
      loginBtn.textContent = "Signing in…";
      try {
        await FlyWiseData.signIn(email, password);
        // onAuthStateChanged (below) picks up the new session and calls showApp().
      } catch (err) {
        const msg = (err && err.code === "auth/invalid-credential") || (err && err.code === "auth/wrong-password") || (err && err.code === "auth/user-not-found")
          ? "Incorrect email or password."
          : (err && err.message) ? err.message : "Sign-in failed. Please try again.";
        showLogin(msg);
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = "Sign in";
      }
    });
  }

  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      if (FlyWiseData) await FlyWiseData.signOutAdmin();
      window.location.reload();
    });
  }

  if (FlyWiseData && FlyWiseData.isAuthAvailable()) {
    FlyWiseData.onAuthChange((user) => {
      if (user) {
        showApp(user);
      } else {
        showLogin();
      }
    });
  } else {
    // No live Firebase connection: nothing sensitive to gate, so drop
    // straight into the dashboard using whatever local demo data exists.
    if (loginNote) {
      loginNote.textContent = "Firebase Authentication isn't reachable right now, so sign-in is unavailable. Showing local demo data only.";
    }
    showApp(null);
  }

  /* ---------------------------------------------------------------------
     Dashboard rendering. Runs once, after a successful sign-in (or
     immediately in the no-Firebase fallback above).
     --------------------------------------------------------------------- */
  async function startDashboard() {

  let responses = [];
  try {
    responses = FlyWiseData ? await FlyWiseData.fetchAllResponses() : JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    responses = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  }

  // Newest first, so a growing response set stays easy to scan.
  responses.sort((a, b) => {
    const at = (a.timestamp && a.timestamp.seconds) ? a.timestamp.seconds * 1000 : new Date(a.timestamp || a.savedAt || 0).getTime();
    const bt = (b.timestamp && b.timestamp.seconds) ? b.timestamp.seconds * 1000 : new Date(b.timestamp || b.savedAt || 0).getTime();
    return bt - at;
  });

  const usingFirestore = responses.some((r) => r.source === "firestore");
  const badge = document.getElementById("data-source-badge");
  badge.textContent = usingFirestore ? "Live Firestore + local data" : "Local data on this device";

  const note = document.getElementById("data-source-note");
  if (note && !usingFirestore) {
    const reason = FlyWiseData && FlyWiseData.getLastReadError ? FlyWiseData.getLastReadError() : null;
    note.textContent = reason
      ? `Could not load shared Firestore data (${reason}). Showing responses saved locally on this device only. Check your Firestore Security Rules allow reads on "survey_responses".`
      : "No shared Firestore data found. Showing responses saved locally on this device only. If a response was submitted on a different device or browser, it will only show here once Firestore is reachable.";
    note.classList.remove("hidden");
  }

  /* ---------------------------------------------------------------------
     Normalize helpers
     --------------------------------------------------------------------- */
  function get(r, path, fallback) {
    return path.split(".").reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), r) ?? fallback;
  }

  function formatDate(r) {
    const raw = r.timestamp || r.savedAt;
    if (!raw) return "N/A";
    if (typeof raw === "object" && raw.seconds) {
      return new Date(raw.seconds * 1000).toLocaleDateString();
    }
    const d = new Date(raw);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
  }

  /* ---------------------------------------------------------------------
     KPIs
     --------------------------------------------------------------------- */
  document.getElementById("kpi-total").textContent = responses.length;

  const confidences = responses.map((r) => Number(get(r, "packingHabits.q5"))).filter((n) => !isNaN(n));
  const avgConfidence = confidences.length ? (confidences.reduce((a, b) => a + b, 0) / confidences.length).toFixed(1) : "N/A";
  document.getElementById("kpi-confidence").textContent = confidences.length ? `${avgConfidence} / 5` : "N/A";

  const offsetAware = responses.filter((r) => get(r, "awareness.q8") === "Yes").length;
  document.getElementById("kpi-offset").textContent = responses.length ? `${Math.round((offsetAware / responses.length) * 100)}%` : "N/A";

  const rewardsScores = responses.map((r) => Number(get(r, "awareness.q10"))).filter((n) => !isNaN(n));
  const avgRewards = rewardsScores.length ? (rewardsScores.reduce((a, b) => a + b, 0) / rewardsScores.length).toFixed(1) : "N/A";
  document.getElementById("kpi-rewards").textContent = rewardsScores.length ? `${avgRewards} / 5` : "N/A";

  const baggageAlways = responses.filter((r) => get(r, "packingHabits.q6") === "Always").length;
  document.getElementById("kpi-baggage").textContent = responses.length ? `${Math.round((baggageAlways / responses.length) * 100)}%` : "N/A";

  /* ---------------------------------------------------------------------
     Charts
     --------------------------------------------------------------------- */
  const palette = ["#101B42", "#2A3FA0", "#4A3AD1", "#6D42D6", "#9C8CE8"];

  function countBy(values, categories) {
    const counts = Object.fromEntries(categories.map((c) => [c, 0]));
    values.forEach((v) => {
      if (v in counts) counts[v]++;
    });
    return categories.map((c) => counts[c]);
  }

  function barChart(canvasId, labels, data, horizontal = false) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{ data, backgroundColor: labels.map((_, i) => palette[i % palette.length]), borderRadius: 8, maxBarThickness: 46 }]
      },
      options: {
        indexAxis: horizontal ? "y" : "x",
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: !horizontal }, ticks: { font: { size: 11 } } },
          y: { grid: { display: horizontal }, ticks: { font: { size: 11 } } }
        }
      }
    });
  }

  const freqCategories = ["First time", "2-5 times", "More than 5 times"];
  barChart("chart-frequency", freqCategories, countBy(responses.map((r) => get(r, "travelExperience.q1")), freqCategories));

  const packingCategories = ["Never", "Rarely", "Sometimes", "Often", "Always"];
  barChart("chart-packing", packingCategories, countBy(responses.map((r) => get(r, "packingHabits.q3")), packingCategories), true);

  const offsetCtx = document.getElementById("chart-offset");
  if (offsetCtx) {
    const yesCount = responses.filter((r) => get(r, "awareness.q8") === "Yes").length;
    const noCount = responses.length - yesCount;
    new Chart(offsetCtx, {
      type: "doughnut",
      data: {
        labels: ["Heard of it", "Not familiar"],
        datasets: [{ data: [yesCount, noCount], backgroundColor: ["#2A3FA0", "#E7E9F2"], borderWidth: 0 }]
      },
      options: { plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } }, cutout: "62%" }
    });
  }

  const rewardsDist = [1, 2, 3, 4, 5].map((n) => responses.filter((r) => Number(get(r, "awareness.q10")) === n).length);
  barChart("chart-rewards", ["1", "2", "3", "4", "5"], rewardsDist);

  /* ---------------------------------------------------------------------
     Table: render, search, filter
     --------------------------------------------------------------------- */
  const purposeSet = new Set(responses.map((r) => get(r, "travelExperience.q2")).filter(Boolean));
  const purposeSelect = document.getElementById("filter-purpose");
  purposeSet.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    purposeSelect.appendChild(opt);
  });

  const tbody = document.getElementById("responses-tbody");
  const emptyState = document.getElementById("empty-state");

  function renderTable(list) {
    tbody.innerHTML = "";
    emptyState.classList.toggle("hidden", list.length > 0);
    list.slice(0, 300).forEach((r) => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-black/5 hover:bg-black/[0.02]";
      tr.innerHTML = `
        <td class="py-2 pr-4 font-mono text-xs">${escapeHtml(r.responseID || r.id || "N/A")}</td>
        <td class="py-2 pr-4 text-xs text-[--ink-500]">${formatDate(r)}</td>
        <td class="py-2 pr-4 text-xs uppercase">${escapeHtml(r.language || "N/A")}</td>
        <td class="py-2 pr-4 text-xs">${escapeHtml(get(r, "travelExperience.q1", "N/A"))}</td>
        <td class="py-2 pr-4 text-xs">${escapeHtml(get(r, "travelExperience.q2", "N/A"))}</td>
        <td class="py-2 pr-4 text-xs">${escapeHtml(get(r, "packingHabits.q5", "N/A"))}/5</td>
        <td class="py-2 pr-4 text-xs">${escapeHtml(get(r, "awareness.q8", "N/A"))}</td>
        <td class="py-2 pr-4 text-xs max-w-[220px] truncate" title="${escapeHtml(get(r, "comments.worry", ""))}">${escapeHtml(get(r, "comments.worry", "N/A"))}</td>
        <td class="py-2 pr-4 text-xs"><span class="px-2 py-0.5 rounded-full ${r.source === "firestore" ? "bg-green-100 text-green-700" : "bg-black/5 text-[--ink-500]"}">${escapeHtml(r.source || "local")}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function applyFilters() {
    const q = document.getElementById("search-input").value.trim().toLowerCase();
    const lang = document.getElementById("filter-lang").value;
    const purpose = document.getElementById("filter-purpose").value;

    const filtered = responses.filter((r) => {
      if (lang && r.language !== lang) return false;
      if (purpose && get(r, "travelExperience.q2") !== purpose) return false;
      if (q) {
        const haystack = JSON.stringify(r).toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    renderTable(filtered);
    return filtered;
  }

  document.getElementById("search-input").addEventListener("input", applyFilters);
  document.getElementById("filter-lang").addEventListener("change", applyFilters);
  document.getElementById("filter-purpose").addEventListener("change", applyFilters);

  renderTable(responses);

  /* ---------------------------------------------------------------------
     Export
     --------------------------------------------------------------------- */
  function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  document.getElementById("btn-export-json").addEventListener("click", () => {
    const data = applyFilters();
    download(`flywise_responses_${Date.now()}.json`, JSON.stringify(data, null, 2), "application/json");
  });

  const EXPORT_COLUMNS = [
    "responseID", "language", "date",
    "q1_travelFrequency", "q2_purpose",
    "q3_neverWornClothes", "q4_packedUnusedFood", "q5_packingConfidence", "q6_baggageLimit",
    "q7_fuelAwareness", "q8_offsetAwareness", "q9_offsetParticipation", "q10_rewardsInterest",
    "q11_recommendationsHelp", "q12_mealSelection", "q13_sustainableAction",
    "q14_worry", "q15_additionalComments", "source"
  ];

  function toExportRows(data) {
    return data.map((r) => [
      r.responseID || r.id || "",
      r.language || "",
      formatDate(r),
      get(r, "travelExperience.q1", ""),
      get(r, "travelExperience.q2", ""),
      get(r, "packingHabits.q3", ""),
      get(r, "packingHabits.q4", ""),
      get(r, "packingHabits.q5", ""),
      get(r, "packingHabits.q6", ""),
      get(r, "awareness.q7", ""),
      get(r, "awareness.q8", ""),
      get(r, "awareness.q9", ""),
      get(r, "awareness.q10", ""),
      get(r, "behavior.q11", ""),
      get(r, "behavior.q12", ""),
      get(r, "behavior.q13", ""),
      get(r, "comments.worry", ""),
      get(r, "comments.additional", ""),
      r.source || "local"
    ]);
  }

  document.getElementById("btn-export-csv").addEventListener("click", () => {
    const data = applyFilters();
    const rows = toExportRows(data);
    const csvEscape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [EXPORT_COLUMNS.map(csvEscape).join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");
    download(`flywise_responses_${Date.now()}.csv`, csv, "text/csv");
  });

  document.getElementById("btn-export-xlsx").addEventListener("click", () => {
    if (typeof XLSX === "undefined") {
      alert("Excel export library failed to load. Check your internet connection and try again.");
      return;
    }
    const data = applyFilters();
    const rows = toExportRows(data);
    const sheetData = [EXPORT_COLUMNS, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    worksheet["!cols"] = EXPORT_COLUMNS.map((c) => ({ wch: Math.max(12, c.length + 2) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Survey Responses");
    XLSX.writeFile(workbook, `flywise_responses_${Date.now()}.xlsx`);
  });

  } // end startDashboard
})();
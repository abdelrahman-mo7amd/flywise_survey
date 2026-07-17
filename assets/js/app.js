// FlyWise - app.js
(function () {
  "use strict";

  /* ======================================================================
     I18N ENGINE
     ====================================================================== */
  const STORAGE_LANG_KEY = "flywise_lang";
  let currentLang = localStorage.getItem(STORAGE_LANG_KEY) || "en";

  function t(path) {
    const parts = path.split(".");
    let node = TRANSLATIONS[currentLang];
    for (const p of parts) {
      if (node == null) return "";
      node = node[p];
    }
    return node == null ? "" : node;
  }

  function applyTranslations() {
    document.documentElement.lang = currentLang;
    document.documentElement.dir = t("dir") || "ltr";
    document.title = t("meta.title");
    const metaDesc = document.getElementById("meta-description");
    if (metaDesc) metaDesc.setAttribute("content", t("meta.description"));

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = t(key);
      if (typeof val === "string") el.textContent = val;
    });

    document.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === currentLang);
    });
    positionLangPill();

    renderSurvey(); // rebuild survey markup with the new language
    updateSurveyStepUI();
  }

  function positionLangPill() {
    const toggle = document.getElementById("lang-toggle");
    const pill = document.getElementById("lang-pill");
    const activeBtn = toggle && toggle.querySelector("[data-lang].active");
    if (!toggle || !pill || !activeBtn) return;
    const toggleRect = toggle.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    pill.style.left = `${btnRect.left - toggleRect.left}px`;
    pill.style.width = `${btnRect.width}px`;
  }
  window.addEventListener("resize", positionLangPill);

  function setLang(lang) {
    if (lang !== "en" && lang !== "ar") return;
    currentLang = lang;
    localStorage.setItem(STORAGE_LANG_KEY, lang);
    applyTranslations();
  }

  document.getElementById("lang-toggle").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lang]");
    if (btn) setLang(btn.getAttribute("data-lang"));
  });

  /* ======================================================================
     NAV: scroll shadow + mobile menu
     ====================================================================== */
  const nav = document.getElementById("site-nav");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 12);
  });

  const mobileToggle = document.getElementById("mobile-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  mobileToggle.addEventListener("click", () => mobileNav.classList.toggle("open"));
  mobileNav.querySelectorAll("a, button").forEach((el) =>
    el.addEventListener("click", () => mobileNav.classList.remove("open"))
  );

  /* ======================================================================
     SCROLL REVEAL
     ====================================================================== */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  /* ======================================================================
     VIEW ROUTER (landing / survey / thanks)
     ====================================================================== */
  // Belt-and-suspenders: control visibility with inline styles directly,
  // not just CSS classes, so a third-party stylesheet (e.g. Tailwind's own
  // `flex`/`block` utility classes used *inside* these same sections) can
  // never accidentally leave a view visible when it shouldn't be.
  function showView(name) {
    document.querySelectorAll(".view").forEach((v) => {
      const isTarget = v.id === `view-${name}`;
      v.classList.toggle("active", isTarget);
      v.style.display = isTarget ? (v.id === "view-thanks" ? "flex" : "block") : "none";
    });
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  // Survey is the priority action on this site: every primary CTA button
  // (hero, nav pill, mobile nav pill, and the survey-intro section button)
  // jumps straight into the survey in a single click, no intermediate scroll step.
  function startSurvey() {
    showView("survey");
    updateSurveyStepUI();
  }

  ["start-survey-btn", "hero-cta-btn", "nav-cta-btn", "mobile-cta-btn"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", startSurvey);
  });
  document.getElementById("thanks-home-btn").addEventListener("click", (e) => {
    e.preventDefault();
    showView("landing");
    window.location.hash = "#top";
  });

  /* ======================================================================
     SURVEY SCHEMA
     Each question references its i18n key; `type` drives rendering.
     ====================================================================== */
  const SURVEY_SCHEMA = [
    { id: "q1", key: "q1", type: "options", section: "s1" },
    { id: "q2", key: "q2", type: "options", section: "s1" },
    { id: "q3", key: "q3", type: "options", section: "s2" },
    { id: "q4", key: "q4", type: "options", section: "s2" },
    { id: "q5", key: "q5", type: "scale", section: "s2" },
    { id: "q6", key: "q6", type: "options", section: "s2" },
    { id: "q7", key: "q7", type: "options", section: "s3" },
    { id: "q8", key: "q8", type: "options", section: "s3" },
    { id: "q9", key: "q9", type: "options", section: "s3" },
    { id: "q10", key: "q10", type: "scale", section: "s3" },
    { id: "q11", key: "q11", type: "options", section: "s4" },
    { id: "q12", key: "q12", type: "options", section: "s4" },
    { id: "q13", key: "q13", type: "options", section: "s4" },
    { id: "q14", key: "q14", type: "text", section: "s4", optional: true },
    { id: "q15", key: "q15", type: "text", section: "s4", optional: true }
  ];
  const TOTAL_STEPS = SURVEY_SCHEMA.length;
  const AVG_SECONDS_PER_STEP = 20; // ~5 min / 15 steps

  let currentStep = 0; // index into SURVEY_SCHEMA
  const answers = {}; // { q1: "First time", q5: 4, ... }

  const AUTOSAVE_KEY = "flywise_survey_draft";

  function loadDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || "null");
      if (draft && draft.answers) {
        Object.assign(answers, draft.answers);
        currentStep = Math.min(draft.step || 0, TOTAL_STEPS - 1);
      }
    } catch {
      /* ignore corrupted draft */
    }
  }

  function saveDraft() {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ answers, step: currentStep }));
    const badge = document.getElementById("survey-autosave");
    badge.style.opacity = "1";
    clearTimeout(saveDraft._t);
    saveDraft._t = setTimeout(() => (badge.style.opacity = "0"), 1200);
  }

  function clearDraft() {
    localStorage.removeItem(AUTOSAVE_KEY);
  }

  /* ---------------------- render survey markup ---------------------- */
  function renderSurvey() {
    const container = document.getElementById("survey-steps");
    if (!container) return;
    container.innerHTML = "";

    SURVEY_SCHEMA.forEach((q, index) => {
      const wrap = document.createElement("div");
      wrap.className = "survey-step" + (index === currentStep ? " active" : "");
      wrap.dataset.index = String(index);

      const sectionLabel = document.createElement("div");
      sectionLabel.className = "text-xs font-bold tracking-widest uppercase text-violet mb-3";
      sectionLabel.textContent = t(`survey.sections.${q.section}`);
      wrap.appendChild(sectionLabel);

      const title = document.createElement("h3");
      title.className = "text-xl sm:text-2xl font-bold leading-snug mb-6";
      title.textContent = t(`survey.${q.key}.title`);
      wrap.appendChild(title);

      if (q.type === "options") {
        const list = document.createElement("div");
        list.className = "grid gap-3";
        const options = t(`survey.${q.key}.options`) || [];
        options.forEach((label) => {
          const opt = document.createElement("div");
          opt.className = "option-card flex items-center gap-3 px-5 py-4";
          opt.setAttribute("role", "button");
          opt.tabIndex = 0;
          opt.dataset.value = label;
          if (answers[q.id] === label) opt.classList.add("selected");
          opt.innerHTML = `<span class="option-dot"></span><span class="font-medium">${escapeHtml(label)}</span>`;
          const select = () => {
            answers[q.id] = label;
            list.querySelectorAll(".option-card").forEach((el) => el.classList.remove("selected"));
            opt.classList.add("selected");
            hideError();
            saveDraft();
          };
          opt.addEventListener("click", select);
          opt.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              select();
            }
          });
          list.appendChild(opt);
        });
        wrap.appendChild(list);
      } else if (q.type === "scale") {
        const scaleWrap = document.createElement("div");
        scaleWrap.className = "flex flex-col gap-4";
        const dots = document.createElement("div");
        dots.className = "flex items-center justify-between gap-2";
        for (let i = 1; i <= 5; i++) {
          const dot = document.createElement("div");
          dot.className = "scale-dot";
          dot.textContent = String(i);
          dot.tabIndex = 0;
          dot.setAttribute("role", "button");
          if (answers[q.id] === i) dot.classList.add("selected");
          const select = () => {
            answers[q.id] = i;
            dots.querySelectorAll(".scale-dot").forEach((el) => el.classList.remove("selected"));
            dot.classList.add("selected");
            hideError();
            saveDraft();
          };
          dot.addEventListener("click", select);
          dot.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              select();
            }
          });
          dots.appendChild(dot);
        }
        const labels = document.createElement("div");
        labels.className = "flex items-center justify-between text-xs text-[--ink-500]";
        labels.innerHTML = `<span>${escapeHtml(t(`survey.${q.key}.scale_low`))}</span><span>${escapeHtml(t(`survey.${q.key}.scale_high`))}</span>`;
        scaleWrap.appendChild(dots);
        scaleWrap.appendChild(labels);
        wrap.appendChild(scaleWrap);
      } else if (q.type === "text") {
        const textarea = document.createElement("textarea");
        textarea.className = "survey-textarea w-full p-4 text-sm";
        textarea.rows = 4;
        textarea.placeholder = t(`survey.${q.key}.placeholder`);
        textarea.value = answers[q.id] || "";
        textarea.addEventListener("input", () => {
          answers[q.id] = textarea.value;
          hideError();
          saveDraft();
        });
        wrap.appendChild(textarea);
      }

      container.appendChild(wrap);
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function hideError() {
    document.getElementById("survey-error").classList.add("hidden");
  }
  function showError() {
    document.getElementById("survey-error").classList.remove("hidden");
  }

  function isStepAnswered(index) {
    const q = SURVEY_SCHEMA[index];
    if (q.optional) return true;
    const val = answers[q.id];
    if (q.type === "text") return true; // text questions in schema are optional by design
    return val !== undefined && val !== null && val !== "";
  }

  function updateSurveyStepUI() {
    document.querySelectorAll(".survey-step").forEach((el, i) => {
      el.classList.toggle("active", i === currentStep);
    });

    const stepLabel = document.getElementById("survey-step-label");
    const timeLabel = document.getElementById("survey-time-label");
    if (stepLabel) {
      stepLabel.textContent = t("survey.step_of")
        .replace("{current}", String(currentStep + 1))
        .replace("{total}", String(TOTAL_STEPS));
    }
    if (timeLabel) {
      const remainingMin = Math.max(1, Math.ceil(((TOTAL_STEPS - currentStep) * AVG_SECONDS_PER_STEP) / 60));
      timeLabel.textContent = t("survey.time_left").replace("{time}", String(remainingMin));
    }
    const fill = document.getElementById("survey-progress-fill");
    if (fill) fill.style.width = `${((currentStep + 1) / TOTAL_STEPS) * 100}%`;

    document.getElementById("survey-back").style.visibility = currentStep === 0 ? "hidden" : "visible";
    const isLast = currentStep === TOTAL_STEPS - 1;
    document.getElementById("survey-next").classList.toggle("hidden", isLast);
    document.getElementById("survey-submit").classList.toggle("hidden", !isLast);
    hideError();
  }

  document.getElementById("survey-back").addEventListener("click", () => {
    if (currentStep > 0) {
      currentStep--;
      updateSurveyStepUI();
      saveDraft();
    }
  });

  document.getElementById("survey-next").addEventListener("click", () => {
    if (!isStepAnswered(currentStep)) {
      showError();
      return;
    }
    if (currentStep < TOTAL_STEPS - 1) {
      currentStep++;
      updateSurveyStepUI();
      saveDraft();
    }
  });

  function generateResponseId() {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    const time = Date.now().toString(36).toUpperCase();
    return `FW-${time}-${rand}`;
  }

  document.getElementById("survey-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!isStepAnswered(currentStep)) {
      showError();
      return;
    }

    const responseId = generateResponseId();
    const submitBtn = document.getElementById("survey-submit");
    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.7";

    const payload = {
      responseID: responseId,
      language: currentLang,
      timestamp: new Date().toISOString(),
      travelExperience: { q1: answers.q1, q2: answers.q2 },
      packingHabits: { q3: answers.q3, q4: answers.q4, q5: answers.q5, q6: answers.q6 },
      awareness: { q7: answers.q7, q8: answers.q8, q9: answers.q9, q10: answers.q10 },
      behavior: { q11: answers.q11, q12: answers.q12, q13: answers.q13 },
      comments: { worry: answers.q14 || "", additional: answers.q15 || "" }
    };

    let saveResult = { source: "local-only" };
    try {
      if (window.FlyWiseData) {
        saveResult = await window.FlyWiseData.saveSurveyResponse(payload);
      }
    } catch (err) {
      console.warn("FlyWise: survey save encountered an issue, response was still kept locally.", err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.textContent = originalLabel;
    }

    clearDraft();
    document.getElementById("thanks-response-id").textContent = responseId;
    const statusEl = document.getElementById("thanks-save-status");
    if (statusEl) {
      if (saveResult.source === "firestore") {
        statusEl.textContent = "Saved to the shared research database.";
      } else {
        const reason = window.FlyWiseData && window.FlyWiseData.getLastWriteError
          ? window.FlyWiseData.getLastWriteError()
          : null;
        statusEl.textContent = reason
          ? `Saved locally on this device only (${reason}).`
          : "Saved locally on this device only.";
      }
    }
    showView("thanks");
  });

  /* ======================================================================
     INIT
     ====================================================================== */
  document.getElementById("year").textContent = String(new Date().getFullYear());
  loadDraft();
  applyTranslations();
  showView("landing"); // authoritative: guarantees survey/thanks start hidden

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(positionLangPill).catch(() => {});
  }
  requestAnimationFrame(positionLangPill);
})();
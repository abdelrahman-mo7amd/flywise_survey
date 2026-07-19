// FlyWise — app.js
// i18n rendering, RTL/LTR switching, view routing, scroll reveals, and the
// authentication + coming-soon flow. Uses the Firebase compat SDK via
// window.FlyWiseData (see firebase-config.js).

(function () {
  "use strict";

  var LANG_KEY = "flywise_lang";
  var state = {
    lang: localStorage.getItem(LANG_KEY) || "ar",
    user: null
  };

  // ---------------------------------------------------------------------
  // i18n
  // ---------------------------------------------------------------------
  function t(path) {
    var parts = path.split(".");
    var node = TRANSLATIONS[state.lang];
    for (var i = 0; i < parts.length; i++) {
      if (node == null) return "";
      node = node[parts[i]];
    }
    return node == null ? "" : node;
  }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var val = t(el.getAttribute("data-i18n"));
      if (val) el.textContent = val;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var val = t(el.getAttribute("data-i18n-placeholder"));
      if (val) el.setAttribute("placeholder", val);
    });
    document.title = t("meta.title");
    var metaDesc = document.getElementById("meta-description");
    if (metaDesc) metaDesc.setAttribute("content", t("meta.description"));

    renderSurvey();
    updateSurveyStepUI();
  }

  function setLanguage(lang, persist) {
    state.lang = lang;
    if (persist !== false) localStorage.setItem(LANG_KEY, lang);
    var dir = TRANSLATIONS[lang].dir;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", dir);
    applyTranslations();
    updateLangToggleUI();
  }

  function updateLangToggleUI() {
    document.querySelectorAll(".lang-toggle").forEach(function (toggle) {
      var buttons = toggle.querySelectorAll("button[data-lang]");
      var pill = toggle.querySelector(".lang-pill");
      var activeBtn = null;
      buttons.forEach(function (b) {
        var isActive = b.getAttribute("data-lang") === state.lang;
        b.classList.toggle("active", isActive);
        if (isActive) activeBtn = b;
      });
      if (activeBtn && pill) {
        var toggleRect = toggle.getBoundingClientRect();
        var btnRect = activeBtn.getBoundingClientRect();
        pill.style.width = btnRect.width + "px";
        pill.style.left = (btnRect.left - toggleRect.left) + "px";
      }
    });
  }

  document.querySelectorAll(".lang-toggle button[data-lang]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setLanguage(btn.getAttribute("data-lang"));
    });
  });

  window.addEventListener("resize", updateLangToggleUI);

  // ---------------------------------------------------------------------
  // Nav: scrolled state + mobile menu
  // ---------------------------------------------------------------------
  var siteNav = document.getElementById("site-nav");
  function onScroll() {
    if (!siteNav) return;
    siteNav.classList.toggle("scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var mobileToggle = document.getElementById("mobile-toggle");
  var mobileNav = document.getElementById("mobile-nav");
  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener("click", function () {
      mobileNav.classList.toggle("open");
    });
    mobileNav.querySelectorAll("a, button").forEach(function (el) {
      el.addEventListener("click", function () { mobileNav.classList.remove("open"); });
    });
  }

  // ---------------------------------------------------------------------
  // Scroll reveal
  // ---------------------------------------------------------------------
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  function observeReveals(root) {
    (root || document).querySelectorAll(".reveal").forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  // ---------------------------------------------------------------------
  // View routing: #/  #login  #signup  #coming-soon
  // ---------------------------------------------------------------------
  var views = {
    landing: document.getElementById("view-landing"),
    login: document.getElementById("view-login"),
    signup: document.getElementById("view-signup"),
    comingSoon: document.getElementById("view-coming-soon"),
    survey: document.getElementById("view-survey"),
    thanks: document.getElementById("view-thanks")
  };

  function showView(name) {
    Object.keys(views).forEach(function (key) {
      var el = views[key];
      if (!el) return;
      var active = key === name;
      el.classList.toggle("active", active);
      el.style.display = active ? (key === "login" || key === "signup" || key === "thanks" ? "flex" : "block") : "none";
    });
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    observeReveals(views[name]);
    clearAuthErrors();
    if (name === "survey") updateSurveyStepUI();
  }

  function routeFromHash() {
    var hash = window.location.hash.replace("#", "");
    if (hash === "login") {
      showView("login");
    } else if (hash === "signup") {
      showView("signup");
    } else if (hash === "coming-soon") {
      if (state.user) {
        showView("comingSoon");
      } else {
        window.location.hash = "login";
      }
    } else if (hash === "survey") {
      showView("survey");
    } else {
      showView("landing");
    }
  }

  window.addEventListener("hashchange", routeFromHash);

  document.querySelectorAll("[data-goto]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.hash = el.getAttribute("data-goto");
    });
  });

  // ---------------------------------------------------------------------
  // SURVEY: schema, rendering, step navigation, autosave draft, submit
  // ---------------------------------------------------------------------
  var SURVEY_SCHEMA = [
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
  var TOTAL_STEPS = SURVEY_SCHEMA.length;
  var AVG_SECONDS_PER_STEP = 18;

  var currentStep = 0;
  var answers = {};
  var AUTOSAVE_KEY = "flywise_survey_draft";

  function loadDraft() {
    try {
      var draft = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || "null");
      if (draft && draft.answers) {
        Object.assign(answers, draft.answers);
        currentStep = Math.min(draft.step || 0, TOTAL_STEPS - 1);
      }
    } catch (e) { /* ignore corrupted draft */ }
  }

  function saveDraft() {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ answers: answers, step: currentStep }));
    var badge = document.getElementById("survey-autosave");
    if (!badge) return;
    badge.style.opacity = "1";
    clearTimeout(saveDraft._t);
    saveDraft._t = setTimeout(function () { badge.style.opacity = "0"; }, 1200);
  }

  function clearDraft() {
    localStorage.removeItem(AUTOSAVE_KEY);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderSurvey() {
    var container = document.getElementById("survey-steps");
    if (!container) return;
    container.innerHTML = "";

    SURVEY_SCHEMA.forEach(function (q, index) {
      var wrap = document.createElement("div");
      wrap.className = "survey-step" + (index === currentStep ? " active" : "");
      wrap.dataset.index = String(index);

      var sectionLabel = document.createElement("div");
      sectionLabel.className = "text-xs font-bold tracking-widest uppercase text-violet mb-3";
      sectionLabel.textContent = t("survey.sections." + q.section);
      wrap.appendChild(sectionLabel);

      var title = document.createElement("h3");
      title.className = "text-xl sm:text-2xl font-bold leading-snug mb-6";
      title.textContent = t("survey." + q.key + ".title");
      wrap.appendChild(title);

      if (q.type === "options") {
        var list = document.createElement("div");
        list.className = "grid gap-3";
        var options = t("survey." + q.key + ".options") || [];
        options.forEach(function (label, i) {
          var opt = document.createElement("div");
          opt.className = "option-card flex items-center gap-3 px-4 py-3.5";
          opt.tabIndex = 0;
          opt.setAttribute("role", "button");
          if (answers[q.id] === label) opt.classList.add("selected");
          opt.innerHTML = '<span class="option-dot"></span><span class="font-medium text-sm">' + escapeHtml(label) + "</span>";
          var select = function () {
            answers[q.id] = label;
            list.querySelectorAll(".option-card").forEach(function (el) { el.classList.remove("selected"); });
            opt.classList.add("selected");
            hideError();
            saveDraft();
          };
          opt.addEventListener("click", select);
          opt.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(); }
          });
          list.appendChild(opt);
        });
        wrap.appendChild(list);
      } else if (q.type === "scale") {
        var scaleWrap = document.createElement("div");
        scaleWrap.className = "flex flex-col gap-4";
        var dots = document.createElement("div");
        dots.className = "flex items-center justify-between gap-2";
        for (var i = 1; i <= 5; i++) {
          (function (i) {
            var dot = document.createElement("div");
            dot.className = "scale-dot";
            dot.textContent = String(i);
            dot.tabIndex = 0;
            dot.setAttribute("role", "button");
            if (answers[q.id] === i) dot.classList.add("selected");
            var select = function () {
              answers[q.id] = i;
              dots.querySelectorAll(".scale-dot").forEach(function (el) { el.classList.remove("selected"); });
              dot.classList.add("selected");
              hideError();
              saveDraft();
            };
            dot.addEventListener("click", select);
            dot.addEventListener("keydown", function (e) {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(); }
            });
            dots.appendChild(dot);
          })(i);
        }
        var labels = document.createElement("div");
        labels.className = "flex items-center justify-between text-xs text-[--ink-500]";
        labels.innerHTML = "<span>" + escapeHtml(t("survey." + q.key + ".scale_low")) + "</span><span>" + escapeHtml(t("survey." + q.key + ".scale_high")) + "</span>";
        scaleWrap.appendChild(dots);
        scaleWrap.appendChild(labels);
        wrap.appendChild(scaleWrap);
      } else if (q.type === "text") {
        var textarea = document.createElement("textarea");
        textarea.className = "survey-textarea w-full p-4 text-sm";
        textarea.rows = 4;
        textarea.placeholder = t("survey." + q.key + ".placeholder");
        textarea.value = answers[q.id] || "";
        textarea.addEventListener("input", function () {
          answers[q.id] = textarea.value;
          hideError();
          saveDraft();
        });
        wrap.appendChild(textarea);
      }

      container.appendChild(wrap);
    });
  }

  function hideError() {
    var el = document.getElementById("survey-error");
    if (el) el.classList.add("hidden");
  }
  function showError() {
    var el = document.getElementById("survey-error");
    if (el) el.classList.remove("hidden");
  }

  function isStepAnswered(index) {
    var q = SURVEY_SCHEMA[index];
    if (!q) return true;
    if (q.optional) return true;
    if (q.type === "text") return true;
    var val = answers[q.id];
    return val !== undefined && val !== null && val !== "";
  }

  function updateSurveyStepUI() {
    document.querySelectorAll(".survey-step").forEach(function (el, i) {
      el.classList.toggle("active", i === currentStep);
    });

    var stepLabel = document.getElementById("survey-step-label");
    var timeLabel = document.getElementById("survey-time-label");
    if (stepLabel) {
      stepLabel.textContent = t("survey.step_of")
        .replace("{current}", String(currentStep + 1))
        .replace("{total}", String(TOTAL_STEPS));
    }
    if (timeLabel) {
      var remainingMin = Math.max(1, Math.ceil(((TOTAL_STEPS - currentStep) * AVG_SECONDS_PER_STEP) / 60));
      timeLabel.textContent = t("survey.time_left").replace("{time}", String(remainingMin));
    }
    var fill = document.getElementById("survey-progress-fill");
    if (fill) fill.style.width = (((currentStep + 1) / TOTAL_STEPS) * 100) + "%";

    var backBtn = document.getElementById("survey-back");
    if (backBtn) backBtn.style.visibility = currentStep === 0 ? "hidden" : "visible";
    var isLast = currentStep === TOTAL_STEPS - 1;
    var nextBtn = document.getElementById("survey-next");
    var submitBtn = document.getElementById("survey-submit");
    if (nextBtn) nextBtn.classList.toggle("hidden", isLast);
    if (submitBtn) submitBtn.classList.toggle("hidden", !isLast);
    hideError();
  }

  var surveyBackBtn = document.getElementById("survey-back");
  if (surveyBackBtn) {
    surveyBackBtn.addEventListener("click", function () {
      if (currentStep > 0) {
        currentStep--;
        updateSurveyStepUI();
        saveDraft();
      }
    });
  }

  var surveyNextBtn = document.getElementById("survey-next");
  if (surveyNextBtn) {
    surveyNextBtn.addEventListener("click", function () {
      if (!isStepAnswered(currentStep)) { showError(); return; }
      if (currentStep < TOTAL_STEPS - 1) {
        currentStep++;
        updateSurveyStepUI();
        saveDraft();
      }
    });
  }

  function generateResponseId() {
    var rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    var time = Date.now().toString(36).toUpperCase();
    return "FW-" + time + "-" + rand;
  }

  var surveyForm = document.getElementById("survey-form");
  if (surveyForm) {
    surveyForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!isStepAnswered(currentStep)) { showError(); return; }

      var responseId = generateResponseId();
      var submitBtn = document.getElementById("survey-submit");
      if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = "0.7"; }

      var payload = {
        responseID: responseId,
        language: state.lang,
        timestamp: new Date().toISOString(),
        travelExperience: { q1: answers.q1, q2: answers.q2 },
        packingHabits: { q3: answers.q3, q4: answers.q4, q5: answers.q5, q6: answers.q6 },
        awareness: { q7: answers.q7, q8: answers.q8, q9: answers.q9, q10: answers.q10 },
        behavior: { q11: answers.q11, q12: answers.q12, q13: answers.q13 },
        comments: { worry: answers.q14 || "", additional: answers.q15 || "" }
      };

      Promise.resolve(window.FlyWiseData ? window.FlyWiseData.saveSurveyResponse(payload) : { source: "local-only" })
        .catch(function (err) {
          console.warn("FlyWise: survey save encountered an issue, response was still kept locally.", err);
          return { source: "local-only" };
        })
        .then(function (saveResult) {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = "1"; }
          clearDraft();
          currentStep = 0;
          answers = {};
          var idEl = document.getElementById("thanks-response-id");
          if (idEl) idEl.textContent = responseId;
          var statusEl = document.getElementById("thanks-save-status");
          if (statusEl) {
            if (saveResult && saveResult.source === "firestore") {
              statusEl.textContent = t("thanks.saved_shared");
            } else {
              statusEl.textContent = t("thanks.saved_local");
            }
          }
          showView("thanks");
        });
    });
  }

  // ---------------------------------------------------------------------
  // Auth form helpers
  // ---------------------------------------------------------------------
  function clearAuthErrors() {
    document.querySelectorAll(".field-error-msg").forEach(function (el) { el.classList.remove("show"); });
    document.querySelectorAll(".field-input").forEach(function (el) { el.classList.remove("field-error"); });
    document.querySelectorAll(".form-toplevel-error").forEach(function (el) {
      el.classList.add("hidden");
      el.textContent = "";
    });
  }

  function showFieldError(inputEl, msgEl, message) {
    if (inputEl) inputEl.classList.add("field-error");
    if (msgEl) {
      msgEl.textContent = message;
      msgEl.classList.add("show");
    }
  }

  function showTopError(formEl, message) {
    var el = formEl.querySelector(".form-toplevel-error");
    if (el) {
      el.textContent = message;
      el.classList.remove("hidden");
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    var spinner = btn.querySelector(".spinner");
    var label = btn.querySelector(".btn-label");
    if (spinner) spinner.classList.toggle("show", loading);
    if (label) label.style.opacity = loading ? "0.55" : "1";
  }

  function friendlyAuthError(err) {
    var code = err && err.code;
    if (code === "auth/email-already-in-use") return t("auth.err_email_in_use");
    if (code === "auth/wrong-password" || code === "auth/user-not-found" || code === "auth/invalid-credential") {
      return t("auth.err_invalid_credentials");
    }
    if (code === "auth/weak-password") return t("auth.err_password_len");
    if (code === "auth/invalid-email") return t("auth.err_email");
    return t("auth.err_generic");
  }

  // ---------------------------------------------------------------------
  // Login form
  // ---------------------------------------------------------------------
  var loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      clearAuthErrors();
      var email = document.getElementById("login-email");
      var password = document.getElementById("login-password");
      var valid = true;

      if (!email.value.trim() || !isValidEmail(email.value.trim())) {
        showFieldError(email, document.getElementById("login-email-error"), email.value.trim() ? t("auth.err_email") : t("auth.err_required"));
        valid = false;
      }
      if (!password.value) {
        showFieldError(password, document.getElementById("login-password-error"), t("auth.err_required"));
        valid = false;
      }
      if (!valid) return;

      var btn = document.getElementById("login-submit-btn");
      setLoading(btn, true);
      window.FlyWiseData.signIn(email.value.trim(), password.value)
        .then(function () {
          window.location.hash = "coming-soon";
        })
        .catch(function (err) {
          showTopError(loginForm, friendlyAuthError(err));
        })
        .finally(function () { setLoading(btn, false); });
    });
  }

  var loginGoogleBtn = document.getElementById("login-google-btn");
  var signupGoogleBtn = document.getElementById("signup-google-btn");
  [loginGoogleBtn, signupGoogleBtn].forEach(function (btn) {
    if (!btn) return;
    btn.addEventListener("click", function () {
      var formEl = btn.closest("form") || btn.closest(".auth-card");
      window.FlyWiseData.signInWithGoogle()
        .then(function () { window.location.hash = "coming-soon"; })
        .catch(function () {
          if (formEl) showTopError(formEl, t("auth.err_google"));
        });
    });
  });

  // ---------------------------------------------------------------------
  // Signup form
  // ---------------------------------------------------------------------
  var signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      clearAuthErrors();
      var name = document.getElementById("signup-name");
      var email = document.getElementById("signup-email");
      var password = document.getElementById("signup-password");
      var confirm = document.getElementById("signup-confirm");
      var terms = document.getElementById("signup-terms");
      var valid = true;

      if (!name.value.trim()) {
        showFieldError(name, document.getElementById("signup-name-error"), t("auth.err_required"));
        valid = false;
      }
      if (!email.value.trim() || !isValidEmail(email.value.trim())) {
        showFieldError(email, document.getElementById("signup-email-error"), email.value.trim() ? t("auth.err_email") : t("auth.err_required"));
        valid = false;
      }
      if (!password.value || password.value.length < 6) {
        showFieldError(password, document.getElementById("signup-password-error"), t("auth.err_password_len"));
        valid = false;
      }
      if (confirm.value !== password.value || !confirm.value) {
        showFieldError(confirm, document.getElementById("signup-confirm-error"), t("auth.err_password_match"));
        valid = false;
      }
      if (!terms.checked) {
        showTopError(signupForm, t("auth.err_terms"));
        valid = false;
      }
      if (!valid) return;

      var btn = document.getElementById("signup-submit-btn");
      setLoading(btn, true);
      window.FlyWiseData.signUp(name.value.trim(), email.value.trim(), password.value)
        .then(function () {
          window.location.hash = "coming-soon";
        })
        .catch(function (err) {
          showTopError(signupForm, friendlyAuthError(err));
        })
        .finally(function () { setLoading(btn, false); });
    });
  }

  // ---------------------------------------------------------------------
  // Auth state -> nav + coming-soon profile indicator
  // ---------------------------------------------------------------------
  function refreshAuthUI() {
    var isAuthed = !!state.user;
    document.querySelectorAll("[data-auth-only]").forEach(function (el) {
      el.classList.toggle("hidden", !isAuthed);
    });
    document.querySelectorAll("[data-guest-only]").forEach(function (el) {
      el.classList.toggle("hidden", isAuthed);
    });
    var nameEls = document.querySelectorAll("[data-user-name]");
    var displayName = state.user ? (state.user.displayName || state.user.email || "") : "";
    nameEls.forEach(function (el) { el.textContent = displayName; });
  }

  if (window.FlyWiseData && window.FlyWiseData.onAuthChange) {
    window.FlyWiseData.onAuthChange(function (user) {
      state.user = user;
      refreshAuthUI();
      if (window.location.hash === "#coming-soon" && !user) {
        window.location.hash = "login";
      }
    });
  }

  var logoutBtns = document.querySelectorAll("[data-logout]");
  logoutBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      window.FlyWiseData.signOutUser().then(function () {
        window.location.hash = "";
      });
    });
  });

  // ---------------------------------------------------------------------
  // Countdown timer (Coming Soon)
  // ---------------------------------------------------------------------
  var LAUNCH_DATE = new Date("2026-11-01T00:00:00Z");
  function tickCountdown() {
    var el = document.getElementById("countdown");
    if (!el) return;
    var diff = LAUNCH_DATE.getTime() - Date.now();
    if (diff < 0) diff = 0;
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    var minutes = Math.floor((diff / (1000 * 60)) % 60);
    var seconds = Math.floor((diff / 1000) % 60);
    var setNum = function (id, val) {
      var n = document.getElementById(id);
      if (n) n.textContent = String(val).padStart(2, "0");
    };
    setNum("cd-days", days);
    setNum("cd-hours", hours);
    setNum("cd-minutes", minutes);
    setNum("cd-seconds", seconds);
  }
  setInterval(tickCountdown, 1000);
  tickCountdown();

  // ---------------------------------------------------------------------
  // Notify-me form
  // ---------------------------------------------------------------------
  var notifyForm = document.getElementById("notify-form");
  if (notifyForm) {
    notifyForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("notify-email");
      var successEl = document.getElementById("notify-success");
      if (!input.value.trim() || !isValidEmail(input.value.trim())) {
        input.classList.add("field-error");
        return;
      }
      input.classList.remove("field-error");
      var btn = document.getElementById("notify-submit-btn");
      setLoading(btn, true);
      window.FlyWiseData.saveLaunchNotifyEmail(input.value.trim()).then(function () {
        setLoading(btn, false);
        input.value = "";
        if (successEl) successEl.classList.remove("hidden");
      });
    });
  }

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------
  document.getElementById("year") && (document.getElementById("year").textContent = new Date().getFullYear());
  loadDraft();
  setLanguage(state.lang, false);
  routeFromHash();
  observeReveals(document);
})();

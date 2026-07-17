// FlyWise - firebase-config.js
// Initializes Firebase (Analytics + Firestore) using the Firebase "compat" SDK,
// loaded as plain <script> tags in index.html/admin.html (not type="module").
// This is what lets the site run by double-clicking the HTML file (file://),
// since browsers block ES module imports on the file:// protocol.
// Falls back to localStorage-only "demo mode" if Firebase can't reach the network
// (e.g. offline, blocked, or ad-blocker); nothing about the UI breaks either way.

(function () {
  "use strict";

  var firebaseConfig = {
    apiKey: "AIzaSyBuigjjBViw7TR0mNJYGkO00jnP7ofUF00",
    authDomain: "flywise-f997e.firebaseapp.com",
    projectId: "flywise-f997e",
    storageBucket: "flywise-f997e.firebasestorage.app",
    messagingSenderId: "140212335360",
    appId: "1:140212335360:web:dc9c98eb722cb4c0ee79e5",
    measurementId: "G-TR3SJL8J0S"
  };

  var db = null;
  var auth = null;
  var firebaseReady = false;

  try {
    if (typeof firebase === "undefined") {
      throw new Error("Firebase compat SDK did not load (check your internet connection).");
    }
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    if (firebase.auth) {
      auth = firebase.auth();
    }
    firebaseReady = true;

    if (firebase.analytics) {
      try {
        firebase.analytics();
      } catch (analyticsErr) {
        // Analytics is optional; ignore failures (e.g. blocked by an ad-blocker).
      }
    }
  } catch (err) {
    console.warn("FlyWise: Firebase failed to initialize, running in local demo mode.", err);
    firebaseReady = false;
  }

  var LOCAL_KEY = "flywise_survey_responses";
  var lastWriteError = null;
  var lastReadError = null;

  function readLocalResponses() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function writeLocalResponse(response) {
    var all = readLocalResponses();
    var record = Object.assign({}, response, { savedAt: new Date().toISOString(), source: "local" });
    all.push(record);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  }

  /**
   * Saves a survey response.
   * Always writes a local copy (so the admin demo dashboard always has data),
   * and additionally writes to Firestore's `survey_responses` collection when available.
   */
  async function saveSurveyResponse(response) {
    writeLocalResponse(response);

    if (firebaseReady && db) {
      try {
        await db.collection("survey_responses").add(
          Object.assign({}, response, { timestamp: firebase.firestore.FieldValue.serverTimestamp() })
        );
        lastWriteError = null;
        return { ok: true, source: "firestore" };
      } catch (err) {
        lastWriteError = (err && err.message) ? err.message : String(err);
        console.warn("FlyWise: Firestore write failed, response kept locally only.", err);
        return { ok: true, source: "local-only" };
      }
    }
    lastWriteError = firebaseReady ? null : "Firebase did not initialize.";
    return { ok: true, source: "local-only" };
  }

  /**
   * Fetches responses from Firestore for the admin dashboard, merged with local demo data.
   * Every successful submission is written to BOTH Firestore and this device's
   * localStorage (the local copy is a safety net for offline/blocked writes),
   * so the same response can legitimately exist in both places. We de-duplicate
   * by responseID here and always keep the Firestore copy when both exist,
   * so the dashboard shows each response once.
   */
  async function fetchAllResponses() {
    var local = readLocalResponses();
    if (!firebaseReady || !db) {
      lastReadError = "Firebase did not initialize.";
      return local;
    }

    try {
      var snap = await db.collection("survey_responses").get();
      var remote = [];
      snap.forEach(function (doc) {
        remote.push(Object.assign({ id: doc.id }, doc.data(), { source: "firestore" }));
      });
      lastReadError = null;
      return dedupeByResponseId(remote.concat(local));
    } catch (err) {
      lastReadError = (err && err.message) ? err.message : String(err);
      console.warn("FlyWise: Firestore read failed, showing local demo data only.", err);
      return local;
    }
  }

  /**
   * Keeps one record per responseID. When a response exists in both
   * Firestore and local storage (the normal case for a successful submit),
   * the Firestore copy wins since it's the shared source of truth.
   * Records with no responseID (shouldn't normally happen) are kept as-is.
   */
  function dedupeByResponseId(list) {
    var byId = new Map();
    var noId = [];
    list.forEach(function (r) {
      var key = r.responseID;
      if (!key) {
        noId.push(r);
        return;
      }
      var existing = byId.get(key);
      if (!existing || (existing.source !== "firestore" && r.source === "firestore")) {
        byId.set(key, r);
      }
    });
    return Array.from(byId.values()).concat(noId);
  }

  /**
   * Admin auth helpers. These are only meaningful when Firebase initialized
   * successfully and the Auth SDK script was loaded (admin.html only).
   * On index.html (public site) these are simply unused.
   */
  function isAuthAvailable() {
    return !!(firebaseReady && auth);
  }

  function onAuthChange(callback) {
    if (!isAuthAvailable()) {
      // No real auth available (offline / Firebase blocked): treat as
      // "signed out" so the caller can decide how to degrade gracefully.
      callback(null);
      return function unsubscribe() {};
    }
    return auth.onAuthStateChanged(callback);
  }

  async function signIn(email, password) {
    if (!isAuthAvailable()) {
      throw new Error("Firebase Authentication is not available right now.");
    }
    const cred = await auth.signInWithEmailAndPassword(email, password);
    return cred.user;
  }

  async function signOutAdmin() {
    if (isAuthAvailable()) {
      await auth.signOut();
    }
  }

  window.FlyWiseData = {
    saveSurveyResponse: saveSurveyResponse,
    fetchAllResponses: fetchAllResponses,
    readLocalResponses: readLocalResponses,
    getLastWriteError: function () { return lastWriteError; },
    getLastReadError: function () { return lastReadError; },
    isAuthAvailable: isAuthAvailable,
    onAuthChange: onAuthChange,
    signIn: signIn,
    signOutAdmin: signOutAdmin,
    LOCAL_KEY: LOCAL_KEY
  };
})();
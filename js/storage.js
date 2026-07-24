(function () {
  "use strict";

  const KEYS = {
    draft: "tradingCompanionDraftV1",
    history: "tradingCompanionHistoryV1"
  };

  function parse(value, fallback) {
    if (!value) return fallback;
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `setup-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function createDraft() {
    const now = new Date().toISOString();
    return {
      id: createId(),
      createdAt: now,
      updatedAt: now,
      currentStep: 0,
      instrument: "XAUUSD",
      session: "auto",
      direction: "",
      setupType: "",
      answers: {},
      notes: ""
    };
  }

  function normalizeDraft(draft) {
    const base = createDraft();
    if (!draft || typeof draft !== "object") return base;
    return {
      ...base,
      ...draft,
      answers: draft.answers && typeof draft.answers === "object" ? draft.answers : {}
    };
  }

  function loadDraft() {
    const saved = parse(localStorage.getItem(KEYS.draft), null);
    return saved ? normalizeDraft(saved) : null;
  }

  function saveDraft(draft) {
    const next = normalizeDraft({
      ...draft,
      updatedAt: new Date().toISOString()
    });
    localStorage.setItem(KEYS.draft, JSON.stringify(next));
    return next;
  }

  function clearDraft() {
    localStorage.removeItem(KEYS.draft);
  }

  function hasMeaningfulDraft(draft) {
    if (!draft) return false;
    return Boolean(
      draft.direction ||
      draft.notes ||
      Object.keys(draft.answers || {}).length
    );
  }

  function loadHistory() {
    const saved = parse(localStorage.getItem(KEYS.history), []);
    return Array.isArray(saved) ? saved : [];
  }

  function saveAssessment(draft, evaluation) {
    const history = loadHistory();
    const record = {
      id: draft.id || createId(),
      createdAt: draft.createdAt || new Date().toISOString(),
      savedAt: new Date().toISOString(),
      instrument: draft.instrument,
      session: draft.session,
      direction: draft.direction,
      setupType: draft.setupType,
      answers: { ...draft.answers },
      notes: draft.notes || "",
      result: {
        state: evaluation.state,
        score: evaluation.score,
        grade: evaluation.grade,
        blockers: [...evaluation.blockers]
      }
    };
    const next = [record, ...history.filter((item) => item.id !== record.id)].slice(0, 200);
    localStorage.setItem(KEYS.history, JSON.stringify(next));
    return record;
  }

  window.TradingStorage = {
    KEYS,
    createDraft,
    loadDraft,
    saveDraft,
    clearDraft,
    hasMeaningfulDraft,
    loadHistory,
    saveAssessment
  };
})();

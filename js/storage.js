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
      tradePlan: {
        entry: "",
        stopLoss: "",
        takeProfit: ""
      },
      notes: ""
    };
  }

  function normalizeDraft(draft) {
    const base = createDraft();
    if (!draft || typeof draft !== "object") return base;
    return {
      ...base,
      ...draft,
      answers: draft.answers && typeof draft.answers === "object" ? draft.answers : {},
      tradePlan: {
        ...base.tradePlan,
        ...(draft.tradePlan && typeof draft.tradePlan === "object" ? draft.tradePlan : {})
      }
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
      Object.values(draft.tradePlan || {}).some(Boolean) ||
      Object.keys(draft.answers || {}).length
    );
  }

  function loadHistory() {
    const saved = parse(localStorage.getItem(KEYS.history), []);
    return Array.isArray(saved) ? saved : [];
  }

  function saveAssessment(draft, evaluation, options) {
    const history = loadHistory();
    const decision = options && options.decision ? options.decision : "reviewed";
    const now = new Date().toISOString();
    const tradePlan = options && options.tradePlan ? options.tradePlan : draft.tradePlan;
    const lifecycleStatus = decision === "entered" ? "open" :
      decision === "skip" ? "skipped" : "reviewed";
    const record = {
      id: draft.id || createId(),
      createdAt: draft.createdAt || new Date().toISOString(),
      savedAt: now,
      instrument: draft.instrument,
      session: draft.session,
      direction: draft.direction,
      setupType: draft.setupType,
      answers: { ...draft.answers },
      tradePlan: {
        entry: tradePlan && tradePlan.entry ? String(tradePlan.entry) : "",
        stopLoss: tradePlan && tradePlan.stopLoss ? String(tradePlan.stopLoss) : "",
        takeProfit: tradePlan && tradePlan.takeProfit ? String(tradePlan.takeProfit) : "",
        plannedRr: tradePlan && Number.isFinite(Number(tradePlan.plannedRr)) ?
          Number(tradePlan.plannedRr) : null
      },
      notes: draft.notes || "",
      lifecycle: {
        decision,
        status: lifecycleStatus,
        openedAt: decision === "entered" ? now : null,
        closedAt: null,
        outcome: null
      },
      result: {
        state: evaluation.state,
        score: evaluation.score,
        grade: evaluation.grade,
        scoreProfile: evaluation.scoreProfile || "legacy",
        scoreBreakdown: Array.isArray(evaluation.scoreBreakdown) ?
          evaluation.scoreBreakdown.map((category) => ({ ...category })) : [],
        blockers: [...evaluation.blockers]
      }
    };
    const next = [record, ...history.filter((item) => item.id !== record.id)].slice(0, 200);
    localStorage.setItem(KEYS.history, JSON.stringify(next));
    return record;
  }

  function loadOpenPositions() {
    return loadHistory().filter(function (item) {
      return item.lifecycle && item.lifecycle.status === "open";
    });
  }

  function closePosition(id, outcome) {
    const allowed = ["win", "loss", "break-even"];
    if (!allowed.includes(outcome)) return null;

    let updated = null;
    const next = loadHistory().map(function (item) {
      if (item.id !== id || !item.lifecycle || item.lifecycle.status !== "open") {
        return item;
      }
      updated = {
        ...item,
        lifecycle: {
          ...item.lifecycle,
          status: "closed",
          outcome,
          closedAt: new Date().toISOString()
        }
      };
      return updated;
    });
    localStorage.setItem(KEYS.history, JSON.stringify(next));
    return updated;
  }

  window.TradingStorage = {
    KEYS,
    createDraft,
    loadDraft,
    saveDraft,
    clearDraft,
    hasMeaningfulDraft,
    loadHistory,
    saveAssessment,
    loadOpenPositions,
    closePosition
  };
})();

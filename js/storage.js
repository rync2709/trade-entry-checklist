(function () {
  "use strict";

  const KEYS = {
    draft: "tradingCompanionDraftV1",
    history: "tradingCompanionHistoryV1"
  };
  const VALIDATION_TARGET = 20;
  const JOURNAL_EMOTIONS = ["calm", "neutral", "fearful", "angry", "overconfident"];
  const JOURNAL_MISTAKES = [
    "fomo",
    "late-entry",
    "no-htf",
    "ignored-cisd",
    "ignored-displacement"
  ];

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

  function isValidationEligible(item) {
    return Boolean(
      item &&
      item.result &&
      item.result.scoreProfile === "score-v1" &&
      Array.isArray(item.result.scoreBreakdown) &&
      item.result.scoreBreakdown.length
    );
  }

  function normalizeJournal(journal) {
    const source = journal && typeof journal === "object" ? journal : {};
    const emotion = JOURNAL_EMOTIONS.includes(source.emotion) ? source.emotion : "";
    const mistakes = Array.isArray(source.mistakes) ?
      [...new Set(source.mistakes.filter((item) => JOURNAL_MISTAKES.includes(item)))] : [];
    const rawTradingViewUrl = typeof source.tradingViewUrl === "string" ?
      source.tradingViewUrl.trim().slice(0, 500) : "";
    const tradingViewUrl = !rawTradingViewUrl || /^https?:\/\//i.test(rawTradingViewUrl) ?
      rawTradingViewUrl : "";
    const lesson = typeof source.lesson === "string" ? source.lesson.trim().slice(0, 2000) : "";

    return {
      emotion,
      mistakes,
      lesson,
      tradingViewUrl,
      updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null
    };
  }

  function isEnteredRecord(item) {
    return Boolean(
      item &&
      item.lifecycle &&
      (
        item.lifecycle.decision === "entered" ||
        item.lifecycle.status === "open" ||
        item.lifecycle.status === "closed"
      )
    );
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
      validation: {
        verdict: null,
        reviewedAt: null
      },
      journal: normalizeJournal(),
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

  function loadJournalTrades() {
    return loadHistory().filter(isEnteredRecord);
  }

  function saveJournalReview(id, review) {
    const source = review && typeof review === "object" ? review : {};
    const url = typeof source.tradingViewUrl === "string" ? source.tradingViewUrl.trim() : "";
    if (url && !/^https?:\/\//i.test(url)) return null;

    const journal = normalizeJournal({
      ...source,
      updatedAt: new Date().toISOString()
    });
    let updated = null;
    const next = loadHistory().map(function (item) {
      if (item.id !== id || !isEnteredRecord(item)) return item;
      updated = {
        ...item,
        journal
      };
      return updated;
    });
    if (!updated) return null;

    localStorage.setItem(KEYS.history, JSON.stringify(next));
    return updated;
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

  function reviewSkippedAssessment(id, verdict) {
    const allowed = ["good-skip", "missed-move"];
    if (!allowed.includes(verdict)) return null;

    let updated = null;
    const next = loadHistory().map(function (item) {
      if (
        item.id !== id ||
        !item.lifecycle ||
        item.lifecycle.status !== "skipped" ||
        !isValidationEligible(item)
      ) {
        return item;
      }
      updated = {
        ...item,
        validation: {
          ...(item.validation || {}),
          verdict,
          reviewedAt: new Date().toISOString()
        }
      };
      return updated;
    });
    localStorage.setItem(KEYS.history, JSON.stringify(next));
    return updated;
  }

  function getValidationSummary(history) {
    const records = Array.isArray(history) ? history : loadHistory();
    const eligible = records.filter(isValidationEligible);
    const closed = eligible.filter((item) =>
      item.lifecycle && item.lifecycle.status === "closed"
    ).length;
    const reviewedSkips = eligible.filter((item) =>
      item.lifecycle && item.lifecycle.status === "skipped" &&
      item.validation && ["good-skip", "missed-move"].includes(item.validation.verdict)
    ).length;
    const pendingSkips = eligible.filter((item) =>
      item.lifecycle && item.lifecycle.status === "skipped" &&
      (!item.validation || !["good-skip", "missed-move"].includes(item.validation.verdict))
    ).length;
    const validated = closed + reviewedSkips;

    return {
      target: VALIDATION_TARGET,
      validated,
      closed,
      reviewedSkips,
      pendingSkips,
      remaining: Math.max(VALIDATION_TARGET - validated, 0),
      percent: Math.min(Math.round((validated / VALIDATION_TARGET) * 100), 100)
    };
  }

  window.TradingStorage = {
    KEYS,
    VALIDATION_TARGET,
    createDraft,
    loadDraft,
    saveDraft,
    clearDraft,
    hasMeaningfulDraft,
    loadHistory,
    isValidationEligible,
    normalizeJournal,
    isEnteredRecord,
    saveAssessment,
    loadOpenPositions,
    loadJournalTrades,
    saveJournalReview,
    closePosition,
    reviewSkippedAssessment,
    getValidationSummary
  };
})();

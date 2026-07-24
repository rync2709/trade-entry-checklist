(function () {
  "use strict";

  const KEYS = {
    draft: "tradingCompanionDraftV1",
    history: "tradingCompanionHistoryV1",
    weeklyReviews: "tradingCompanionWeeklyReviewsV1",
    sessionPlans: "tradingCompanionSessionPlansV1",
    watchlist: "tradingCompanionWatchlistV1"
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

  function normalizeScreenshotMetadata(screenshot) {
    if (!screenshot || typeof screenshot !== "object") return null;
    const type = typeof screenshot.type === "string" ? screenshot.type : "";
    const size = Number(screenshot.size);
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(type) ||
      !Number.isFinite(size) ||
      size <= 0
    ) return null;
    return {
      name: typeof screenshot.name === "string" ?
        screenshot.name.trim().slice(0, 180) : "screenshot",
      type,
      size,
      updatedAt: typeof screenshot.updatedAt === "string" ?
        screenshot.updatedAt : null
    };
  }

  function normalizeCloseReview(closeReview) {
    const source = closeReview && typeof closeReview === "object" ? closeReview : {};
    const hasRealizedRr = source.realizedRr !== null &&
      source.realizedRr !== undefined &&
      source.realizedRr !== "";
    const realizedRr = hasRealizedRr ? Number(source.realizedRr) : null;
    return {
      actualExit: typeof source.actualExit === "string" ?
        source.actualExit.trim().slice(0, 40) : "",
      realizedRr: realizedRr !== null && Number.isFinite(realizedRr) ? realizedRr : null,
      closeNote: typeof source.closeNote === "string" ?
        source.closeNote.trim().slice(0, 2000) : "",
      updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null
    };
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
      screenshot: normalizeScreenshotMetadata(source.screenshot),
      closeReview: normalizeCloseReview(source.closeReview),
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

  function deleteHistoryRecord(id, predicate) {
    const recordId = String(id || "");
    if (!recordId) return null;

    const history = loadHistory();
    const deleted = history.find(function (item) {
      return String(item.id) === recordId && (!predicate || predicate(item));
    }) || null;
    if (!deleted) return null;

    const next = history.filter(function (item) {
      return String(item.id) !== recordId;
    });
    localStorage.setItem(KEYS.history, JSON.stringify(next));
    return deleted;
  }

  function deleteAssessment(id) {
    return deleteHistoryRecord(id, function (item) {
      return !isEnteredRecord(item);
    });
  }

  function deleteJournalTrade(id) {
    return deleteHistoryRecord(id, isEnteredRecord);
  }

  function normalizeWeeklyReview(review, weekStart) {
    const source = review && typeof review === "object" ? review : {};
    return {
      weekStart: typeof weekStart === "string" ? weekStart : "",
      strengths: typeof source.strengths === "string" ?
        source.strengths.trim().slice(0, 2000) : "",
      improvements: typeof source.improvements === "string" ?
        source.improvements.trim().slice(0, 2000) : "",
      nextFocus: typeof source.nextFocus === "string" ?
        source.nextFocus.trim().slice(0, 2000) : "",
      updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null
    };
  }

  function loadWeeklyReviews() {
    const saved = parse(localStorage.getItem(KEYS.weeklyReviews), {});
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
    return Object.keys(saved).reduce(function (reviews, weekStart) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) return reviews;
      reviews[weekStart] = normalizeWeeklyReview(saved[weekStart], weekStart);
      return reviews;
    }, {});
  }

  function loadWeeklyReview(weekStart) {
    if (typeof weekStart !== "string") return normalizeWeeklyReview(null, "");
    const reviews = loadWeeklyReviews();
    return normalizeWeeklyReview(reviews[weekStart], weekStart);
  }

  function saveWeeklyReview(weekStart, review) {
    if (typeof weekStart !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      return null;
    }
    const reviews = loadWeeklyReviews();
    const next = normalizeWeeklyReview({
      ...review,
      updatedAt: new Date().toISOString()
    }, weekStart);
    reviews[weekStart] = next;
    localStorage.setItem(KEYS.weeklyReviews, JSON.stringify(reviews));
    return next;
  }

  function normalizeSessionPlan(plan, dateKey) {
    const source = plan && typeof plan === "object" ? plan : {};
    const bias = ["bullish", "bearish", "neutral"].includes(source.bias) ?
      source.bias : "";
    const newsStatus = ["clear", "high-impact"].includes(source.newsStatus) ?
      source.newsStatus : "not-reviewed";
    const normalizeText = function (value) {
      return typeof value === "string" ? value.trim().slice(0, 2000) : "";
    };
    return {
      dateKey: typeof dateKey === "string" ? dateKey : "",
      bias,
      htfNarrative: normalizeText(source.htfNarrative),
      keyPois: normalizeText(source.keyPois),
      liquidityTargets: normalizeText(source.liquidityTargets),
      londonPlan: normalizeText(source.londonPlan),
      newYorkPlan: normalizeText(source.newYorkPlan),
      newsStatus,
      newsNote: normalizeText(source.newsNote),
      noTradeConditions: normalizeText(source.noTradeConditions),
      updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null
    };
  }

  function loadSessionPlans() {
    const saved = parse(localStorage.getItem(KEYS.sessionPlans), {});
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
    return Object.keys(saved).reduce(function (plans, dateKey) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return plans;
      plans[dateKey] = normalizeSessionPlan(saved[dateKey], dateKey);
      return plans;
    }, {});
  }

  function loadSessionPlan(dateKey) {
    if (typeof dateKey !== "string") return normalizeSessionPlan(null, "");
    const plans = loadSessionPlans();
    return normalizeSessionPlan(plans[dateKey], dateKey);
  }

  function saveSessionPlan(dateKey, plan) {
    if (typeof dateKey !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return null;
    }
    const plans = loadSessionPlans();
    const next = normalizeSessionPlan({
      ...plan,
      updatedAt: new Date().toISOString()
    }, dateKey);
    plans[dateKey] = next;
    localStorage.setItem(KEYS.sessionPlans, JSON.stringify(plans));
    return next;
  }

  function clearSessionPlan(dateKey) {
    if (typeof dateKey !== "string") return false;
    const plans = loadSessionPlans();
    if (!Object.prototype.hasOwnProperty.call(plans, dateKey)) return false;
    delete plans[dateKey];
    localStorage.setItem(KEYS.sessionPlans, JSON.stringify(plans));
    return true;
  }

  function hasMeaningfulSessionPlan(plan) {
    if (!plan || typeof plan !== "object") return false;
    return Boolean(
      plan.bias ||
      plan.newsStatus === "clear" ||
      plan.newsStatus === "high-impact" ||
      [
        "htfNarrative",
        "keyPois",
        "liquidityTargets",
        "londonPlan",
        "newYorkPlan",
        "newsNote",
        "noTradeConditions"
      ].some((field) => Boolean(plan[field]))
    );
  }

  function normalizeWatchlistSymbol(value) {
    return typeof value === "string" ?
      value.trim().toUpperCase().replace(/[^A-Z0-9._-]/g, "").slice(0, 20) : "";
  }

  function normalizeWatchlistItem(item) {
    const source = item && typeof item === "object" ? item : {};
    const symbol = normalizeWatchlistSymbol(source.symbol);
    const bias = ["bullish", "bearish", "neutral"].includes(source.bias) ?
      source.bias : "";
    const allowedStatuses = [
      "monitoring",
      "waiting-htf",
      "waiting-poi",
      "waiting-sweep",
      "waiting-confirmation",
      "ready",
      "no-trade"
    ];
    const status = allowedStatuses.includes(source.status) ? source.status : "monitoring";
    const normalizeText = function (value, maximum) {
      return typeof value === "string" ? value.trim().slice(0, maximum) : "";
    };
    return {
      id: typeof source.id === "string" && source.id ?
        source.id.slice(0, 100) : `watch-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      symbol,
      name: normalizeText(source.name, 80) || symbol,
      bias,
      status,
      currentZone: normalizeText(source.currentZone, 500),
      nextCondition: normalizeText(source.nextCondition, 500),
      reviewNote: normalizeText(source.reviewNote, 1000),
      createdAt: typeof source.createdAt === "string" ?
        source.createdAt : new Date().toISOString(),
      updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null
    };
  }

  function createDefaultWatchlist() {
    return [
      ["watch-xauusd", "XAUUSD", "Gold"],
      ["watch-btcusd", "BTCUSD", "Bitcoin"],
      ["watch-ethusd", "ETHUSD", "Ethereum"],
      ["watch-solusd", "SOLUSD", "Solana"],
      ["watch-nas100", "NAS100", "Nasdaq"]
    ].map(function ([id, symbol, name]) {
      return normalizeWatchlistItem({
        id,
        symbol,
        name,
        status: "monitoring",
        createdAt: new Date().toISOString()
      });
    });
  }

  function saveWatchlist(items) {
    const next = (Array.isArray(items) ? items : [])
      .map(normalizeWatchlistItem)
      .filter((item) => item.symbol)
      .slice(0, 30);
    localStorage.setItem(KEYS.watchlist, JSON.stringify(next));
    return next;
  }

  function loadWatchlist() {
    const raw = localStorage.getItem(KEYS.watchlist);
    if (raw === null) return saveWatchlist(createDefaultWatchlist());
    const saved = parse(raw, []);
    return Array.isArray(saved) ?
      saved.map(normalizeWatchlistItem).filter((item) => item.symbol).slice(0, 30) : [];
  }

  function addWatchlistItem(symbol, name) {
    const normalizedSymbol = normalizeWatchlistSymbol(symbol);
    if (!normalizedSymbol) return null;
    const items = loadWatchlist();
    if (items.some((item) => item.symbol === normalizedSymbol)) return null;
    const now = new Date().toISOString();
    const item = normalizeWatchlistItem({
      id: `watch-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      symbol: normalizedSymbol,
      name: typeof name === "string" && name.trim() ? name : normalizedSymbol,
      status: "monitoring",
      createdAt: now,
      updatedAt: null
    });
    saveWatchlist([...items, item]);
    return item;
  }

  function saveWatchlistItem(id, updates) {
    if (typeof id !== "string") return null;
    let updated = null;
    const items = loadWatchlist().map(function (item) {
      if (item.id !== id) return item;
      updated = normalizeWatchlistItem({
        ...item,
        ...(updates && typeof updates === "object" ? updates : {}),
        id: item.id,
        symbol: item.symbol,
        createdAt: item.createdAt,
        updatedAt: new Date().toISOString()
      });
      return updated;
    });
    if (!updated) return null;
    saveWatchlist(items);
    return updated;
  }

  function removeWatchlistItem(id) {
    if (typeof id !== "string") return false;
    const items = loadWatchlist();
    const next = items.filter((item) => item.id !== id);
    if (next.length === items.length) return false;
    saveWatchlist(next);
    return true;
  }

  function saveJournalReview(id, review) {
    const source = review && typeof review === "object" ? review : {};
    const url = typeof source.tradingViewUrl === "string" ? source.tradingViewUrl.trim() : "";
    if (url && !/^https?:\/\//i.test(url)) return null;

    let updated = null;
    const next = loadHistory().map(function (item) {
      if (item.id !== id || !isEnteredRecord(item)) return item;
      updated = {
        ...item,
        journal: normalizeJournal({
          ...normalizeJournal(item.journal),
          ...source,
          updatedAt: new Date().toISOString()
        })
      };
      return updated;
    });
    if (!updated) return null;

    localStorage.setItem(KEYS.history, JSON.stringify(next));
    return updated;
  }

  function saveJournalScreenshot(id, screenshot) {
    let updated = null;
    const next = loadHistory().map(function (item) {
      if (item.id !== id || !isEnteredRecord(item)) return item;
      updated = {
        ...item,
        journal: normalizeJournal({
          ...normalizeJournal(item.journal),
          screenshot,
          updatedAt: new Date().toISOString()
        })
      };
      return updated;
    });
    if (!updated) return null;

    localStorage.setItem(KEYS.history, JSON.stringify(next));
    return updated;
  }

  function calculateRealizedRr(item, actualExit) {
    if (!item || actualExit === "" || actualExit == null) return null;
    const exit = Number(actualExit);
    const plan = item.tradePlan || {};
    const entry = Number(plan.entry);
    const stopLoss = Number(plan.stopLoss);
    if (
      !Number.isFinite(exit) ||
      !Number.isFinite(entry) ||
      !Number.isFinite(stopLoss) ||
      exit <= 0 ||
      entry <= 0 ||
      stopLoss <= 0 ||
      !["bullish", "bearish"].includes(item.direction)
    ) return null;

    const risk = Math.abs(entry - stopLoss);
    const stopIsValid = item.direction === "bullish" ?
      stopLoss < entry : stopLoss > entry;
    if (risk <= 0 || !stopIsValid) return null;
    const result = item.direction === "bullish" ? exit - entry : entry - exit;
    const realizedRr = result / risk;
    return Number.isFinite(realizedRr) ? Math.round(realizedRr * 100) / 100 : null;
  }

  function saveCloseReview(id, review) {
    const source = review && typeof review === "object" ? review : {};
    const actualExit = source.actualExit == null ? "" : String(source.actualExit).trim();
    const closeNote = source.closeNote == null ? "" : String(source.closeNote).trim();
    let updated = null;
    let invalid = false;
    const next = loadHistory().map(function (item) {
      if (
        item.id !== id ||
        !item.lifecycle ||
        item.lifecycle.status !== "closed" ||
        !isEnteredRecord(item)
      ) return item;

      const realizedRr = actualExit ? calculateRealizedRr(item, actualExit) : null;
      if (actualExit && realizedRr === null) {
        invalid = true;
        return item;
      }

      const now = new Date().toISOString();
      updated = {
        ...item,
        journal: normalizeJournal({
          ...normalizeJournal(item.journal),
          closeReview: {
            actualExit,
            realizedRr,
            closeNote,
            updatedAt: now
          },
          updatedAt: now
        })
      };
      return updated;
    });
    if (invalid || !updated) return null;

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
    normalizeScreenshotMetadata,
    normalizeCloseReview,
    normalizeJournal,
    isEnteredRecord,
    saveAssessment,
    loadOpenPositions,
    loadJournalTrades,
    deleteAssessment,
    deleteJournalTrade,
    normalizeWeeklyReview,
    loadWeeklyReviews,
    loadWeeklyReview,
    saveWeeklyReview,
    normalizeSessionPlan,
    loadSessionPlans,
    loadSessionPlan,
    saveSessionPlan,
    clearSessionPlan,
    hasMeaningfulSessionPlan,
    normalizeWatchlistSymbol,
    normalizeWatchlistItem,
    createDefaultWatchlist,
    loadWatchlist,
    addWatchlistItem,
    saveWatchlistItem,
    removeWatchlistItem,
    saveJournalReview,
    saveJournalScreenshot,
    calculateRealizedRr,
    saveCloseReview,
    closePosition,
    reviewSkippedAssessment,
    getValidationSummary
  };
})();

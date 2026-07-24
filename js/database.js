(function () {
  "use strict";

  const TIME_ZONE = "Asia/Bangkok";
  const SESSION_LABELS = {
    asia: "Asia",
    london: "London",
    "new-york": "New York",
    auto: "Not set"
  };
  const SETUP_LABELS = {
    reversal: "Reversal",
    continuation: "Continuation"
  };
  const DIRECTION_LABELS = {
    bullish: "Bullish",
    bearish: "Bearish",
    neutral: "No Bias"
  };
  const MISTAKE_LABELS = {
    fomo: "FOMO",
    "late-entry": "Late entry",
    "no-htf": "No HTF context",
    "ignored-cisd": "Ignored CISD",
    "ignored-displacement": "Ignored displacement"
  };

  function normalizeText(value) {
    return String(value == null ? "" : value)
      .normalize("NFKD")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function getActivityDate(item) {
    if (!item) return "";
    const lifecycle = item.lifecycle || {};
    return lifecycle.status === "closed" ?
      lifecycle.closedAt || item.savedAt || item.createdAt || "" :
      lifecycle.openedAt || item.savedAt || item.createdAt || "";
  }

  function getDateKey(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);
    const values = {};
    parts.forEach(function (part) {
      if (["year", "month", "day"].includes(part.type)) {
        values[part.type] = part.value;
      }
    });
    return values.year && values.month && values.day ?
      `${values.year}-${values.month}-${values.day}` : "";
  }

  function getRealizedRr(item) {
    const closeReview = item && item.journal && item.journal.closeReview;
    const value = closeReview ? closeReview.realizedRr : null;
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function getResultKey(item) {
    if (!item || !item.lifecycle) return "unknown";
    if (item.lifecycle.status === "open") return "open";
    if (item.lifecycle.status === "closed") {
      return ["win", "loss", "break-even"].includes(item.lifecycle.outcome) ?
        item.lifecycle.outcome : "closed";
    }
    return item.lifecycle.status || "unknown";
  }

  function hasReview(item) {
    const journal = item && item.journal ? item.journal : {};
    const closeReview = journal.closeReview || {};
    return Boolean(
      journal.updatedAt ||
      journal.screenshot ||
      journal.emotion ||
      (Array.isArray(journal.mistakes) && journal.mistakes.length) ||
      journal.lesson ||
      journal.tradingViewUrl ||
      closeReview.updatedAt ||
      closeReview.actualExit ||
      closeReview.closeNote
    );
  }

  function buildSearchText(item) {
    const journal = item && item.journal ? item.journal : {};
    const closeReview = journal.closeReview || {};
    const result = item && item.result ? item.result : {};
    const mistakes = Array.isArray(journal.mistakes) ? journal.mistakes : [];
    return normalizeText([
      item && item.instrument,
      item && item.direction,
      DIRECTION_LABELS[item && item.direction],
      item && item.setupType,
      SETUP_LABELS[item && item.setupType],
      item && item.session,
      SESSION_LABELS[item && item.session],
      result.grade,
      getResultKey(item),
      item && item.notes,
      journal.lesson,
      closeReview.closeNote,
      mistakes.join(" "),
      mistakes.map((mistake) => MISTAKE_LABELS[mistake]).join(" ")
    ].join(" "));
  }

  function filterRecords(records, filters) {
    const source = Array.isArray(records) ? records : [];
    const options = filters && typeof filters === "object" ? filters : {};
    const tokens = normalizeText(options.query).split(" ").filter(Boolean);

    return source.filter(function (item) {
      const journal = item && item.journal ? item.journal : {};
      const mistakes = Array.isArray(journal.mistakes) ? journal.mistakes : [];
      const grade = item && item.result ? item.result.grade : "";
      const result = getResultKey(item);
      const dateKey = getDateKey(getActivityDate(item));

      if (tokens.length) {
        const searchText = buildSearchText(item);
        if (!tokens.every((token) => searchText.includes(token))) return false;
      }
      if (options.instrument && options.instrument !== "all" &&
        item.instrument !== options.instrument) return false;
      if (options.setup && options.setup !== "all" &&
        item.setupType !== options.setup) return false;
      if (options.session && options.session !== "all" &&
        item.session !== options.session) return false;
      if (options.grade && options.grade !== "all" && grade !== options.grade) return false;
      if (options.result && options.result !== "all") {
        if (options.result === "closed") {
          if (!item.lifecycle || item.lifecycle.status !== "closed") return false;
        } else if (result !== options.result) {
          return false;
        }
      }
      if (options.mistake && options.mistake !== "all" &&
        !mistakes.includes(options.mistake)) return false;
      if (options.dateFrom && (!dateKey || dateKey < options.dateFrom)) return false;
      if (options.dateTo && (!dateKey || dateKey > options.dateTo)) return false;
      return true;
    });
  }

  function sortRecords(records, sort) {
    const source = [...(Array.isArray(records) ? records : [])];
    const dateValue = function (item) {
      const parsed = Date.parse(getActivityDate(item));
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const sortMode = sort || "newest";

    return source.sort(function (left, right) {
      if (sortMode === "oldest") return dateValue(left) - dateValue(right);
      if (sortMode === "rr-high" || sortMode === "rr-low") {
        const leftR = getRealizedRr(left);
        const rightR = getRealizedRr(right);
        if (leftR === null && rightR !== null) return 1;
        if (leftR !== null && rightR === null) return -1;
        if (leftR !== null && rightR !== null && leftR !== rightR) {
          return sortMode === "rr-high" ? rightR - leftR : leftR - rightR;
        }
      }
      return dateValue(right) - dateValue(left);
    });
  }

  function summarizeDatabase(records, matching) {
    const source = Array.isArray(records) ? records : [];
    const filtered = Array.isArray(matching) ? matching : source;
    return {
      total: source.length,
      matching: filtered.length,
      closed: source.filter((item) =>
        item.lifecycle && item.lifecycle.status === "closed"
      ).length,
      reviewed: source.filter(hasReview).length
    };
  }

  function formatDate(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "--";
    return new Intl.DateTimeFormat("th-TH", {
      timeZone: TIME_ZONE,
      day: "numeric",
      month: "short",
      year: "2-digit"
    }).format(date);
  }

  function formatR(value) {
    if (value === null || !Number.isFinite(value)) return "--";
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value.toFixed(2)}R`;
  }

  function resultDisplay(item) {
    const key = getResultKey(item);
    return {
      open: { label: "OPEN", state: "open" },
      win: { label: "WIN", state: "ready" },
      loss: { label: "LOSS", state: "no-trade" },
      "break-even": { label: "BREAK EVEN", state: "developing" },
      closed: { label: "CLOSED", state: "waiting" }
    }[key] || { label: key.toUpperCase(), state: "waiting" };
  }

  function createCell(tagName, label, className) {
    const cell = document.createElement(tagName);
    cell.dataset.label = label;
    if (className) cell.className = className;
    return cell;
  }

  function renderResults(container, records) {
    container.replaceChildren();
    const wrap = document.createElement("div");
    wrap.className = "database-table-wrap";
    const table = document.createElement("table");
    table.className = "database-table";

    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["Date", "Pair", "Context", "Grade", "Result", "Realized R", "Review", ""]
      .forEach(function (label) {
        const cell = document.createElement("th");
        cell.scope = "col";
        cell.textContent = label;
        headRow.appendChild(cell);
      });
    head.appendChild(headRow);

    const body = document.createElement("tbody");
    records.forEach(function (item) {
      const row = document.createElement("tr");
      const journal = item.journal || {};
      const closeReview = journal.closeReview || {};
      const result = item.result || {};
      const realizedRr = getRealizedRr(item);
      const status = resultDisplay(item);

      const date = createCell("td", "Date", "database-date");
      date.textContent = formatDate(getActivityDate(item));

      const instrument = createCell("th", "Pair", "database-instrument");
      instrument.scope = "row";
      instrument.textContent = item.instrument || "Unknown";

      const context = createCell("td", "Context", "database-context");
      const contextPrimary = document.createElement("strong");
      contextPrimary.textContent = `${DIRECTION_LABELS[item.direction] || "Unknown"} · ` +
        `${SETUP_LABELS[item.setupType] || "Unknown"}`;
      const contextSecondary = document.createElement("span");
      contextSecondary.textContent = SESSION_LABELS[item.session] || "Not set";
      context.append(contextPrimary, contextSecondary);

      const grade = createCell("td", "Grade", "database-grade");
      const gradeValue = document.createElement("strong");
      gradeValue.textContent = result.grade || "--";
      const gradeScore = document.createElement("span");
      gradeScore.textContent = Number.isFinite(Number(result.score)) ?
        `${Number(result.score)} / 100` : "No score";
      grade.append(gradeValue, gradeScore);

      const outcome = createCell("td", "Result", "database-result");
      const outcomePill = document.createElement("span");
      outcomePill.className = "status-pill";
      outcomePill.dataset.state = status.state;
      const outcomeDot = document.createElement("span");
      outcomeDot.className = "status-dot";
      const outcomeCopy = document.createElement("span");
      outcomeCopy.textContent = status.label;
      outcomePill.append(outcomeDot, outcomeCopy);
      outcome.appendChild(outcomePill);

      const rr = createCell("td", "Realized R", "database-rr");
      rr.textContent = formatR(realizedRr);
      rr.dataset.result = realizedRr === null ? "neutral" :
        realizedRr > 0 ? "positive" : realizedRr < 0 ? "negative" : "neutral";

      const review = createCell("td", "Review", "database-review");
      const reviewText = document.createElement("strong");
      reviewText.textContent = journal.lesson || closeReview.closeNote ||
        item.notes || "ยังไม่มีบทเรียน";
      const mistakes = Array.isArray(journal.mistakes) ? journal.mistakes : [];
      const mistakeText = document.createElement("span");
      mistakeText.textContent = mistakes.length ?
        mistakes.map((mistake) => MISTAKE_LABELS[mistake] || mistake).join(" · ") :
        "No recorded mistake";
      review.append(reviewText, mistakeText);
      const flags = document.createElement("div");
      flags.className = "database-review-flags";
      if (journal.screenshot) {
        const screenshot = document.createElement("span");
        screenshot.textContent = "Screenshot";
        flags.appendChild(screenshot);
      }
      if (journal.emotion) {
        const emotion = document.createElement("span");
        emotion.textContent = `Emotion: ${journal.emotion}`;
        flags.appendChild(emotion);
      }
      if (flags.childElementCount) review.appendChild(flags);

      const action = createCell("td", "Action", "database-action");
      const link = document.createElement("a");
      link.className = "button";
      link.href = `journal.html#trade-${encodeURIComponent(String(item.id))}`;
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("class", "icon");
      icon.setAttribute("aria-hidden", "true");
      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute("href", "./assets/icons.svg#icon-book-open");
      icon.appendChild(use);
      const linkText = document.createElement("span");
      linkText.textContent = "Review";
      link.append(icon, linkText);
      action.appendChild(link);

      row.append(date, instrument, context, grade, outcome, rr, review, action);
      body.appendChild(row);
    });
    table.append(head, body);
    wrap.appendChild(table);
    container.appendChild(wrap);
  }

  function initializePage() {
    const storage = window.TradingStorage;
    const controls = {
      query: document.getElementById("databaseQuery"),
      instrument: document.getElementById("databaseInstrument"),
      setup: document.getElementById("databaseSetup"),
      session: document.getElementById("databaseSession"),
      grade: document.getElementById("databaseGrade"),
      result: document.getElementById("databaseResult"),
      mistake: document.getElementById("databaseMistake"),
      dateFrom: document.getElementById("databaseDateFrom"),
      dateTo: document.getElementById("databaseDateTo"),
      sort: document.getElementById("databaseSort")
    };
    const results = document.getElementById("databaseResults");
    const empty = document.getElementById("databaseEmpty");
    const emptyTitle = document.getElementById("databaseEmptyTitle");
    const emptyMessage = document.getElementById("databaseEmptyMessage");
    const emptyAction = document.getElementById("databaseEmptyAction");

    function readFilters() {
      return {
        query: controls.query.value,
        instrument: controls.instrument.value,
        setup: controls.setup.value,
        session: controls.session.value,
        grade: controls.grade.value,
        result: controls.result.value,
        mistake: controls.mistake.value,
        dateFrom: controls.dateFrom.value,
        dateTo: controls.dateTo.value
      };
    }

    function syncInstrumentOptions(records) {
      const selected = controls.instrument.value || "all";
      const instruments = [...new Set(records
        .map((item) => item.instrument)
        .filter(Boolean))]
        .sort((left, right) => left.localeCompare(right));
      controls.instrument.replaceChildren();
      const all = document.createElement("option");
      all.value = "all";
      all.textContent = "All pairs";
      controls.instrument.appendChild(all);
      instruments.forEach(function (instrument) {
        const option = document.createElement("option");
        option.value = instrument;
        option.textContent = instrument;
        controls.instrument.appendChild(option);
      });
      controls.instrument.value = instruments.includes(selected) ? selected : "all";
    }

    function render() {
      const records = storage.loadJournalTrades();
      syncInstrumentOptions(records);
      const filtered = sortRecords(
        filterRecords(records, readFilters()),
        controls.sort.value
      );
      const summary = summarizeDatabase(records, filtered);
      document.getElementById("databaseTotal").textContent = String(summary.total);
      document.getElementById("databaseMatching").textContent = String(summary.matching);
      document.getElementById("databaseClosed").textContent = String(summary.closed);
      document.getElementById("databaseReviewed").textContent = String(summary.reviewed);
      document.getElementById("resultCount").textContent =
        `พบ ${summary.matching} จาก ${summary.total} รายการ`;

      const hasResults = filtered.length > 0;
      results.hidden = !hasResults;
      empty.hidden = hasResults;
      if (hasResults) {
        renderResults(results, filtered);
      } else {
        results.replaceChildren();
        if (records.length) {
          emptyTitle.textContent = "ไม่พบ Trade ที่ตรงกับตัวกรอง";
          emptyMessage.textContent = "ปรับคำค้นหา ช่วงวันที่ หรือตัวกรองที่เลือก";
          emptyAction.hidden = true;
        } else {
          emptyTitle.textContent = "ยังไม่มี Trade ใน Database";
          emptyMessage.textContent = "รายการที่เลือก ENTERED จาก New Trade จะปรากฏที่นี่";
          emptyAction.hidden = false;
        }
      }
    }

    Object.values(controls).forEach(function (control) {
      control.addEventListener(control === controls.query ? "input" : "change", render);
    });
    document.getElementById("resetDatabaseFilters").addEventListener("click", function () {
      controls.query.value = "";
      controls.instrument.value = "all";
      controls.setup.value = "all";
      controls.session.value = "all";
      controls.grade.value = "all";
      controls.result.value = "all";
      controls.mistake.value = "all";
      controls.dateFrom.value = "";
      controls.dateTo.value = "";
      controls.sort.value = "newest";
      render();
      controls.query.focus();
    });
    window.addEventListener("storage", render);
    render();
  }

  window.TradingDatabase = {
    TIME_ZONE,
    normalizeText,
    getActivityDate,
    getDateKey,
    getRealizedRr,
    getResultKey,
    hasReview,
    buildSearchText,
    filterRecords,
    sortRecords,
    summarizeDatabase,
    formatDate,
    formatR
  };

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", initializePage);
  }
})();

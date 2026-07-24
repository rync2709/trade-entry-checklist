(function () {
  "use strict";

  const TIME_ZONE = "Asia/Bangkok";
  const DAY_LABELS = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
  const MISTAKE_LABELS = {
    fomo: "FOMO",
    "late-entry": "Late Entry",
    "no-htf": "No HTF",
    "ignored-cisd": "Ignored CISD",
    "ignored-displacement": "Ignored Displacement"
  };

  function average(values) {
    if (!values.length) return null;
    return values.reduce((total, value) => total + value, 0) / values.length;
  }

  function getDateParts(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return null;
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);
    const result = {};
    parts.forEach(function (part) {
      if (["year", "month", "day"].includes(part.type)) {
        result[part.type] = Number(part.value);
      }
    });
    return result.year && result.month && result.day ? result : null;
  }

  function partsToKey(parts) {
    if (!parts) return "";
    return [
      String(parts.year).padStart(4, "0"),
      String(parts.month).padStart(2, "0"),
      String(parts.day).padStart(2, "0")
    ].join("-");
  }

  function keyToDate(key) {
    if (typeof key !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
    const values = key.split("-").map(Number);
    const date = new Date(Date.UTC(values[0], values[1] - 1, values[2], 12));
    if (
      date.getUTCFullYear() !== values[0] ||
      date.getUTCMonth() !== values[1] - 1 ||
      date.getUTCDate() !== values[2]
    ) return null;
    return date;
  }

  function dateToKey(date) {
    return [
      String(date.getUTCFullYear()).padStart(4, "0"),
      String(date.getUTCMonth() + 1).padStart(2, "0"),
      String(date.getUTCDate()).padStart(2, "0")
    ].join("-");
  }

  function shiftDateKey(key, days) {
    const date = keyToDate(key);
    if (!date || !Number.isFinite(Number(days))) return "";
    date.setUTCDate(date.getUTCDate() + Number(days));
    return dateToKey(date);
  }

  function getWeekRange(value) {
    const parts = getDateParts(value === undefined ? new Date() : value);
    if (!parts) return null;
    const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
    const mondayOffset = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - mondayOffset);
    const startKey = dateToKey(date);
    return {
      startKey,
      endKey: shiftDateKey(startKey, 6),
      days: Array.from({ length: 7 }, function (_, index) {
        return shiftDateKey(startKey, index);
      })
    };
  }

  function getTradeDateKey(item) {
    if (!item || !item.lifecycle || item.lifecycle.status !== "closed") return "";
    return partsToKey(getDateParts(item.lifecycle.closedAt));
  }

  function getRealizedRr(item) {
    const value = item &&
      item.journal &&
      item.journal.closeReview ?
      item.journal.closeReview.realizedRr : null;
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function hasJournalReview(item) {
    const journal = item && item.journal;
    if (!journal || typeof journal !== "object") return false;
    const closeReview = journal.closeReview || {};
    return Boolean(
      journal.emotion ||
      (Array.isArray(journal.mistakes) && journal.mistakes.length) ||
      journal.lesson ||
      journal.tradingViewUrl ||
      journal.screenshot ||
      closeReview.actualExit ||
      closeReview.closeNote
    );
  }

  function getWeekRecords(records, weekStart) {
    const endKey = shiftDateKey(weekStart, 6);
    if (!endKey) return [];
    return (Array.isArray(records) ? records : []).filter(function (item) {
      const dateKey = getTradeDateKey(item);
      return dateKey && dateKey >= weekStart && dateKey <= endKey;
    });
  }

  function summarize(records) {
    const source = Array.isArray(records) ? records : [];
    const outcomes = { win: 0, loss: 0, "break-even": 0 };
    const rrValues = [];
    const positiveR = [];
    const negativeR = [];
    let reviewed = 0;
    const mistakes = {};

    source.forEach(function (item) {
      const outcome = item && item.lifecycle ? item.lifecycle.outcome : null;
      if (Object.prototype.hasOwnProperty.call(outcomes, outcome)) outcomes[outcome] += 1;

      const realizedRr = getRealizedRr(item);
      if (realizedRr !== null) {
        rrValues.push(realizedRr);
        if (realizedRr > 0) positiveR.push(realizedRr);
        if (realizedRr < 0) negativeR.push(Math.abs(realizedRr));
      }

      if (hasJournalReview(item)) reviewed += 1;
      const itemMistakes = item && item.journal && Array.isArray(item.journal.mistakes) ?
        item.journal.mistakes : [];
      itemMistakes.forEach(function (mistake) {
        mistakes[mistake] = (mistakes[mistake] || 0) + 1;
      });
    });

    const decisiveTrades = outcomes.win + outcomes.loss;
    const averageWin = average(positiveR);
    const averageLoss = average(negativeR);
    return {
      total: source.length,
      outcomes,
      decisiveTrades,
      winRate: decisiveTrades ? outcomes.win / decisiveTrades * 100 : null,
      rrCount: rrValues.length,
      rrCoverage: source.length ? rrValues.length / source.length * 100 : 0,
      netR: rrValues.reduce((total, value) => total + value, 0),
      expectancy: average(rrValues),
      averageRr: averageWin !== null && averageLoss !== null && averageLoss > 0 ?
        averageWin / averageLoss : null,
      reviewed,
      reviewCoverage: source.length ? reviewed / source.length * 100 : 0,
      mistakes
    };
  }

  function buildDailyResults(records, weekStart) {
    return Array.from({ length: 7 }, function (_, index) {
      const dateKey = shiftDateKey(weekStart, index);
      const dayRecords = getWeekRecords(records, dateKey).filter(function (item) {
        return getTradeDateKey(item) === dateKey;
      });
      const summary = summarize(dayRecords);
      let state = "empty";
      if (summary.total && summary.rrCount < summary.total) state = "incomplete";
      else if (summary.rrCount && summary.netR > 0) state = "winning";
      else if (summary.rrCount && summary.netR < 0) state = "losing";
      else if (summary.rrCount) state = "break-even";
      return { dateKey, state, summary };
    });
  }

  function buildInsights(summary) {
    const strengths = [];
    const focusAreas = [];
    if (!summary.total) {
      return {
        strengths: ["ยังไม่มี Closed Trade สำหรับประเมินสัปดาห์นี้"],
        focusAreas: ["บันทึก Trade และปิดผลให้ครบก่อนเริ่มสรุปพฤติกรรม"]
      };
    }

    if (summary.expectancy !== null && summary.expectancy > 0) {
      strengths.push(`Expectancy เป็นบวกที่ ${formatR(summary.expectancy, true)} ต่อ Trade`);
    }
    if (summary.rrCoverage >= 80) {
      strengths.push(`บันทึก Actual Exit ครบ ${Math.round(summary.rrCoverage)}% ของ Trade`);
    } else {
      focusAreas.push(`เพิ่ม Actual Exit ให้ครบ ปัจจุบันมีข้อมูล ${summary.rrCount}/${summary.total} Trade`);
    }
    if (summary.reviewCoverage >= 80) {
      strengths.push(`ทบทวน Journal แล้ว ${summary.reviewed}/${summary.total} Trade`);
    } else {
      focusAreas.push(`กลับไปทบทวน Journal ที่ยังไม่ครบ ปัจจุบัน ${summary.reviewed}/${summary.total} Trade`);
    }
    if (summary.decisiveTrades >= 3 && summary.winRate >= 60) {
      strengths.push(`รักษาคุณภาพการคัด Setup: Win rate ${Math.round(summary.winRate)}%`);
    }
    if (summary.expectancy !== null && summary.expectancy < 0) {
      focusAreas.push(`Expectancy ติดลบ ${formatR(summary.expectancy, true)} ควรทบทวน Loss ที่กระทบมากที่สุด`);
    }

    const topMistake = Object.entries(summary.mistakes)
      .sort(function (left, right) {
        return right[1] - left[1] || left[0].localeCompare(right[0]);
      })[0];
    if (topMistake) {
      focusAreas.push(`ลด ${MISTAKE_LABELS[topMistake[0]] || topMistake[0]} ซึ่งเกิด ${topMistake[1]} ครั้ง`);
    }

    if (!strengths.length) {
      strengths.push("ข้อมูลยังไม่พอสำหรับระบุจุดแข็งที่ชัดเจน");
    }
    if (!focusAreas.length) {
      focusAreas.push("เลือกพฤติกรรมสำคัญ 1 เรื่องเพื่อรักษาความสม่ำเสมอ");
    }
    return { strengths, focusAreas };
  }

  function formatPercent(value) {
    return value === null ? "--" : `${Math.round(value)}%`;
  }

  function formatR(value, includePlus) {
    if (value === null || !Number.isFinite(value)) return "--";
    const prefix = includePlus && value > 0 ? "+" : "";
    return `${prefix}${value.toFixed(2)}R`;
  }

  function formatCompactR(value) {
    if (!Number.isFinite(value)) return "--";
    const rounded = Math.round(value * 10) / 10;
    const prefix = rounded > 0 ? "+" : "";
    return `${prefix}${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}R`;
  }

  function formatWeekRange(weekStart) {
    const start = keyToDate(weekStart);
    const end = keyToDate(shiftDateKey(weekStart, 6));
    if (!start || !end) return "--";
    const formatter = new Intl.DateTimeFormat("th-TH", {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
    return `${formatter.format(start)} – ${formatter.format(end)}`;
  }

  function renderList(element, items, tone) {
    element.replaceChildren();
    items.forEach(function (copy) {
      const item = document.createElement("li");
      item.dataset.tone = tone;
      item.textContent = copy;
      element.appendChild(item);
    });
  }

  function renderMistakes(summary) {
    const container = document.getElementById("weeklyMistakes");
    const entries = Object.entries(summary.mistakes)
      .sort(function (left, right) {
        return right[1] - left[1] || left[0].localeCompare(right[0]);
      });
    container.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "mistake-empty";
      empty.textContent = summary.total ?
        "ยังไม่มี Mistake ที่บันทึกไว้ ไม่ได้หมายความว่าไม่มีข้อผิดพลาด" :
        "Mistake จะสรุปจาก Closed Trade ในสัปดาห์ที่เลือก";
      container.appendChild(empty);
      return;
    }

    const maximum = Math.max(...entries.map((entry) => entry[1]));
    entries.forEach(function (entry) {
      const row = document.createElement("div");
      row.className = "mistake-row";
      const copy = document.createElement("div");
      copy.className = "mistake-copy";
      const label = document.createElement("span");
      label.textContent = MISTAKE_LABELS[entry[0]] || entry[0];
      const count = document.createElement("strong");
      count.textContent = String(entry[1]);
      copy.append(label, count);

      const track = document.createElement("div");
      track.className = "mistake-track";
      const bar = document.createElement("span");
      bar.style.width = `${entry[1] / maximum * 100}%`;
      track.appendChild(bar);
      row.append(copy, track);
      container.appendChild(row);
    });
  }

  function renderDays(records, weekStart) {
    const container = document.getElementById("weeklyDays");
    const dateFormatter = new Intl.DateTimeFormat("th-TH", {
      timeZone: "UTC",
      day: "numeric",
      month: "short"
    });
    container.replaceChildren();
    buildDailyResults(records, weekStart).forEach(function (day, index) {
      const card = document.createElement("article");
      card.className = "weekly-day";
      card.dataset.state = day.state;
      const result = day.state === "incomplete" ? "Needs R" :
        day.summary.rrCount ? formatCompactR(day.summary.netR) : "--";
      card.innerHTML = `
        <span class="weekly-day-name">${DAY_LABELS[index]}</span>
        <span class="weekly-day-date">${dateFormatter.format(keyToDate(day.dateKey))}</span>
        <strong>${result}</strong>
        <span class="weekly-day-count">${day.summary.total} Trade</span>
      `;
      container.appendChild(card);
    });
  }

  function formatSavedAt(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "บันทึกไว้ในอุปกรณ์นี้";
    return `บันทึกล่าสุด ${new Intl.DateTimeFormat("th-TH", {
      timeZone: TIME_ZONE,
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date)}`;
  }

  function initializePage() {
    const currentRange = getWeekRange(new Date());
    let selectedWeek = currentRange ? currentRange.startKey : "";
    const form = document.getElementById("weeklyReviewForm");
    const fields = {
      strengths: document.getElementById("weeklyStrengthsInput"),
      improvements: document.getElementById("weeklyImprovementsInput"),
      nextFocus: document.getElementById("weeklyNextFocusInput")
    };

    function loadReflection() {
      const review = window.TradingStorage.loadWeeklyReview(selectedWeek);
      fields.strengths.value = review.strengths;
      fields.improvements.value = review.improvements;
      fields.nextFocus.value = review.nextFocus;
      const saved = Boolean(review.updatedAt);
      const state = document.getElementById("weeklySaveState");
      state.textContent = saved ? "บันทึกแล้ว" : "ยังไม่ได้บันทึก";
      state.dataset.state = saved ? "saved" : "unsaved";
      document.getElementById("weeklyUpdatedAt").textContent =
        saved ? formatSavedAt(review.updatedAt) : "บันทึกไว้ในอุปกรณ์นี้";
    }

    function render() {
      const allTrades = window.TradingStorage.loadJournalTrades();
      const records = getWeekRecords(allTrades, selectedWeek);
      const summary = summarize(records);
      const insights = buildInsights(summary);
      const status = document.getElementById("weeklyStatus");

      document.getElementById("weekLabel").textContent = formatWeekRange(selectedWeek);
      document.getElementById("weeklyTrades").textContent = String(summary.total);
      document.getElementById("weeklyOutcomeNote").textContent =
        `${summary.outcomes.win} Win · ${summary.outcomes.loss} Loss · ${summary.outcomes["break-even"]} BE`;
      document.getElementById("weeklyWinRate").textContent = formatPercent(summary.winRate);
      document.getElementById("weeklyNetR").textContent =
        summary.rrCount ? formatR(summary.netR, true) : "--";
      document.getElementById("weeklyNetR").dataset.result = !summary.rrCount ? "neutral" :
        summary.netR > 0 ? "positive" : summary.netR < 0 ? "negative" : "neutral";
      document.getElementById("weeklyExpectancy").textContent =
        formatR(summary.expectancy, true);
      document.getElementById("weeklyAverageRr").textContent =
        summary.averageRr === null ? "--" : `${summary.averageRr.toFixed(2)} : 1`;
      document.getElementById("weeklyCoverage").textContent =
        `${Math.round(summary.rrCoverage)}%`;
      document.getElementById("weeklyCoverageNote").textContent = summary.total ?
        `${summary.rrCount} จาก ${summary.total} Trade` : "ยังไม่มี Actual Exit";

      if (!summary.total) {
        status.dataset.state = "waiting";
        document.getElementById("weeklyStatusText").textContent =
          "ยังไม่มี Closed Trade ในสัปดาห์นี้ แต่สามารถบันทึกแผนทบทวนได้";
      } else if (summary.rrCount < summary.total) {
        status.dataset.state = "developing";
        document.getElementById("weeklyStatusText").textContent =
          `ข้อมูล Realized R ${summary.rrCount} จาก ${summary.total} Closed Trade`;
      } else {
        status.dataset.state = "ready";
        document.getElementById("weeklyStatusText").textContent =
          `ข้อมูล Realized R ครบ ${summary.total} Closed Trade พร้อมทบทวน`;
      }

      renderDays(allTrades, selectedWeek);
      renderList(document.getElementById("weeklyStrengths"), insights.strengths, "positive");
      renderList(document.getElementById("weeklyFocusAreas"), insights.focusAreas, "warning");
      renderMistakes(summary);
      loadReflection();

      const thisWeek = currentRange && selectedWeek === currentRange.startKey;
      document.getElementById("nextWeek").disabled = thisWeek;
    }

    function markUnsaved() {
      const state = document.getElementById("weeklySaveState");
      state.textContent = "มีการแก้ไขที่ยังไม่บันทึก";
      state.dataset.state = "unsaved";
    }

    Object.values(fields).forEach(function (field) {
      field.addEventListener("input", markUnsaved);
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const review = window.TradingStorage.saveWeeklyReview(selectedWeek, {
        strengths: fields.strengths.value,
        improvements: fields.improvements.value,
        nextFocus: fields.nextFocus.value
      });
      if (!review) return;
      const state = document.getElementById("weeklySaveState");
      state.textContent = "บันทึกแล้ว";
      state.dataset.state = "saved";
      document.getElementById("weeklyUpdatedAt").textContent = formatSavedAt(review.updatedAt);
    });
    document.getElementById("previousWeek").addEventListener("click", function () {
      selectedWeek = shiftDateKey(selectedWeek, -7);
      render();
    });
    document.getElementById("nextWeek").addEventListener("click", function () {
      if (currentRange && selectedWeek >= currentRange.startKey) return;
      selectedWeek = shiftDateKey(selectedWeek, 7);
      render();
    });
    document.getElementById("currentWeek").addEventListener("click", function () {
      if (!currentRange) return;
      selectedWeek = currentRange.startKey;
      render();
    });
    window.addEventListener("storage", render);
    render();
  }

  window.TradingWeekly = {
    TIME_ZONE,
    getDateParts,
    partsToKey,
    keyToDate,
    shiftDateKey,
    getWeekRange,
    getTradeDateKey,
    getRealizedRr,
    hasJournalReview,
    getWeekRecords,
    summarize,
    buildDailyResults,
    buildInsights,
    formatPercent,
    formatR,
    formatCompactR,
    formatWeekRange
  };

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", initializePage);
  }
})();

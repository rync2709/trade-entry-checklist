(function () {
  "use strict";

  const storage = window.TradingStorage;
  const logic = window.TradingLogic;

  function localDateKey(value) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date(value));
  }

  function currentSession() {
    const hour = Number(new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      hourCycle: "h23"
    }).format(new Date()));

    if (hour >= 19 && hour < 21) return ["London / New York", "ช่วงตลาดซ้อนกัน"];
    if (hour >= 21 || hour < 2) return ["New York", "เวลาอ้างอิงกรุงเทพฯ"];
    if (hour >= 14 && hour < 19) return ["London", "เวลาอ้างอิงกรุงเทพฯ"];
    if (hour >= 7 && hour < 14) return ["Asia", "เวลาอ้างอิงกรุงเทพฯ"];
    return ["Off session", "รอ Session ตามแผน"];
  }

  function currentWeekStart() {
    const key = localDateKey(new Date());
    const values = key.split("-").map(Number);
    const date = new Date(Date.UTC(values[0], values[1] - 1, values[2], 12));
    const mondayOffset = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - mondayOffset);
    return [
      String(date.getUTCFullYear()).padStart(4, "0"),
      String(date.getUTCMonth() + 1).padStart(2, "0"),
      String(date.getUTCDate()).padStart(2, "0")
    ].join("-");
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  }

  function directionLabel(direction) {
    if (direction === "bullish") return "Bullish";
    if (direction === "bearish") return "Bearish";
    return "No bias";
  }

  function recordStatus(item) {
    const lifecycle = item.lifecycle;
    if (lifecycle && lifecycle.status === "open") return { label: "OPEN", state: "open" };
    if (lifecycle && lifecycle.status === "skipped") {
      if (item.validation && item.validation.verdict === "good-skip") {
        return { label: "GOOD SKIP", state: "ready" };
      }
      if (item.validation && item.validation.verdict === "missed-move") {
        return { label: "MISSED MOVE", state: "developing" };
      }
      return { label: "SKIPPED", state: "waiting" };
    }
    if (lifecycle && lifecycle.status === "closed") {
      if (lifecycle.outcome === "win") return { label: "WIN", state: "ready" };
      if (lifecycle.outcome === "loss") return { label: "LOSS", state: "no-trade" };
      return { label: "BREAK EVEN", state: "developing" };
    }
    if (item.result.state === "ready") return { label: "READY", state: "ready" };
    if (item.result.state === "no-trade") return { label: "NO TRADE", state: "no-trade" };
    return { label: "REVIEWED", state: "waiting" };
  }

  function formatPlanValue(value) {
    return value === null || value === undefined || value === "" ? "--" : String(value);
  }

  function renderOpenPositions(positions) {
    const list = document.getElementById("positionList");
    const empty = document.getElementById("positionEmpty");
    list.replaceChildren();

    if (!positions.length) {
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    positions.forEach(function (item) {
      const row = document.createElement("article");
      row.className = "position-row";

      const detail = document.createElement("div");
      const heading = document.createElement("div");
      heading.className = "position-heading";
      const instrument = document.createElement("strong");
      instrument.textContent = item.instrument || "ไม่ระบุสินทรัพย์";
      const status = document.createElement("span");
      status.className = "status-pill";
      status.dataset.state = "open";
      status.textContent = "OPEN";
      heading.append(instrument, status);

      const meta = document.createElement("div");
      meta.className = "position-meta";
      const setup = item.setupType === "continuation" ? "Continuation" : "Reversal";
      meta.textContent = `${directionLabel(item.direction)} · ${setup} · เปิด ${formatDate(item.lifecycle.openedAt)}`;

      const plan = document.createElement("div");
      plan.className = "position-plan";
      [
        ["Entry", formatPlanValue(item.tradePlan && item.tradePlan.entry)],
        ["Stop Loss", formatPlanValue(item.tradePlan && item.tradePlan.stopLoss)],
        ["Take Profit", formatPlanValue(item.tradePlan && item.tradePlan.takeProfit)],
        ["Planned RR", item.tradePlan && item.tradePlan.plannedRr ?
          `1:${Number(item.tradePlan.plannedRr).toFixed(2)}` : "--"]
      ].forEach(function ([label, value]) {
        const cell = document.createElement("div");
        const labelElement = document.createElement("span");
        labelElement.textContent = label;
        const valueElement = document.createElement("strong");
        valueElement.textContent = value;
        cell.append(labelElement, valueElement);
        plan.appendChild(cell);
      });

      detail.append(heading, meta, plan);

      const result = document.createElement("div");
      result.className = "position-result";
      const resultLabel = document.createElement("div");
      resultLabel.className = "position-result-label";
      resultLabel.textContent = "ปิดผลของ Position";
      const control = document.createElement("div");
      control.className = "result-control";
      [
        ["win", "WIN"],
        ["loss", "LOSS"],
        ["break-even", "BE"]
      ].forEach(function ([outcome, label]) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "result-button";
        button.dataset.closePosition = item.id;
        button.dataset.outcome = outcome;
        button.textContent = label;
        control.appendChild(button);
      });
      result.append(resultLabel, control);
      row.append(detail, result);
      list.appendChild(row);
    });
  }

  function renderHistory(history) {
    const list = document.getElementById("historyList");
    const empty = document.getElementById("historyEmpty");
    list.replaceChildren();

    if (!history.length) {
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    const pendingSkips = history.filter((item) =>
      storage.isValidationEligible(item) &&
      item.lifecycle &&
      item.lifecycle.status === "skipped" &&
      (!item.validation || !["good-skip", "missed-move"].includes(item.validation.verdict))
    );
    const visibleHistory = [...pendingSkips, ...history.slice(0, 5)].filter(
      (item, index, records) => records.findIndex((record) => record.id === item.id) === index
    );

    visibleHistory.forEach(function (item) {
      const row = document.createElement("div");
      row.className = "history-item";

      const info = document.createElement("div");
      const primary = document.createElement("div");
      primary.className = "history-primary";

      const instrument = document.createElement("strong");
      instrument.textContent = item.instrument || "ไม่ระบุสินทรัพย์";
      primary.appendChild(instrument);

      const status = document.createElement("span");
      status.className = "status-pill";
      const statusData = recordStatus(item);
      status.dataset.state = statusData.state;
      status.textContent = statusData.label;
      primary.appendChild(status);

      const meta = document.createElement("div");
      meta.className = "history-meta";
      const setup = item.setupType === "continuation" ? "Continuation" : "Reversal";
      meta.textContent = `${directionLabel(item.direction)} · ${setup} · ${formatDate(item.savedAt)}`;

      info.append(primary, meta);

      if (
        storage.isValidationEligible(item) &&
        item.lifecycle &&
        item.lifecycle.status === "skipped"
      ) {
        const review = document.createElement("div");
        review.className = "skip-review";
        const reviewLabel = document.createElement("span");
        reviewLabel.textContent = "ผลหลัง Setup จบ";
        const reviewControl = document.createElement("div");
        reviewControl.className = "skip-review-control";
        [
          ["good-skip", "GOOD SKIP"],
          ["missed-move", "MISSED MOVE"]
        ].forEach(function ([verdict, label]) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "skip-review-button";
          button.dataset.reviewSkip = item.id;
          button.dataset.verdict = verdict;
          button.setAttribute(
            "aria-pressed",
            String(Boolean(item.validation && item.validation.verdict === verdict))
          );
          button.textContent = label;
          reviewControl.appendChild(button);
        });
        review.append(reviewLabel, reviewControl);
        info.appendChild(review);
      }

      const grade = document.createElement("div");
      grade.className = "history-grade";
      const gradeValue = document.createElement("strong");
      gradeValue.textContent = item.result.grade;
      if (item.result.grade === "NO TRADE") gradeValue.style.color = "var(--red)";
      const score = document.createElement("span");
      score.textContent = `${item.result.score} / 100`;
      grade.append(gradeValue, score);

      const actions = document.createElement("div");
      actions.className = "history-actions";
      actions.appendChild(grade);

      if (!storage.isEnteredRecord(item)) {
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "button button-quiet button-danger history-delete";
        deleteButton.dataset.deleteAssessment = item.id;
        deleteButton.title = "ลบรายการนี้";
        deleteButton.setAttribute(
          "aria-label",
          `ลบรายการ ${item.instrument || "ไม่ระบุสินทรัพย์"}`
        );
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("class", "icon");
        icon.setAttribute("aria-hidden", "true");
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttribute("href", "./assets/icons.svg#icon-trash");
        icon.appendChild(use);
        deleteButton.appendChild(icon);
        actions.appendChild(deleteButton);
      }

      row.append(info, actions);
      list.appendChild(row);
    });
  }

  function render() {
    const draft = storage.loadDraft();
    const hasDraft = storage.hasMeaningfulDraft(draft);
    const evaluation = draft ? logic.evaluate(draft) : null;
    const history = storage.loadHistory();
    const openPositions = storage.loadOpenPositions();
    const validation = storage.getValidationSummary(history);
    const today = localDateKey(new Date());
    const todayHistory = history.filter((item) => localDateKey(item.savedAt) === today);
    const enteredToday = todayHistory.filter((item) =>
      item.lifecycle && item.lifecycle.decision === "entered"
    ).length;
    const session = currentSession();
    const sessionPlan = storage.loadSessionPlan(today);
    const sessionPlanEvaluation = window.TradingPlanner.evaluatePlan(sessionPlan);
    const watchlist = storage.loadWatchlist();
    const watchlistSummary = window.TradingWatchlist.summarize(watchlist);
    const weekStart = currentWeekStart();
    const weekEndDate = new Date(`${weekStart}T12:00:00Z`);
    weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
    const weekEnd = weekEndDate.toISOString().slice(0, 10);
    const weeklyReview = storage.loadWeeklyReview(weekStart);
    const weeklyClosed = storage.loadJournalTrades().filter(function (item) {
      if (!item.lifecycle || item.lifecycle.status !== "closed") return false;
      const closedDate = localDateKey(item.lifecycle.closedAt);
      return closedDate >= weekStart && closedDate <= weekEnd;
    }).length;

    document.getElementById("todayCount").textContent = String(todayHistory.length);
    document.getElementById("enteredCount").textContent = String(enteredToday);
    document.getElementById("openCount").textContent = String(openPositions.length);
    document.getElementById("sessionName").textContent = session[0];
    document.getElementById("sessionNote").textContent = session[1];

    const plannerPromptState = document.getElementById("plannerPromptState");
    const plannerPromptMessage = document.getElementById("plannerPromptMessage");
    const plannerPromptAction = document.getElementById("plannerPromptAction");
    if (sessionPlanEvaluation.state === "ready") {
      plannerPromptState.dataset.state = "ready";
      plannerPromptState.querySelector(".pill-copy").textContent = "PLAN READY";
      plannerPromptMessage.textContent =
        `${window.TradingPlanner.BIAS_LABELS[sessionPlan.bias]} Bias · Pre-market plan ครบ 7 ข้อ`;
      plannerPromptAction.querySelector("span").textContent = "ดู Session Plan";
    } else if (sessionPlanEvaluation.state === "draft") {
      plannerPromptState.dataset.state = "developing";
      plannerPromptState.querySelector(".pill-copy").textContent = "PLAN DRAFT";
      plannerPromptMessage.textContent =
        `${sessionPlanEvaluation.complete} / ${sessionPlanEvaluation.total} ข้อ · ถัดไป: ${sessionPlanEvaluation.nextRequirement}`;
      plannerPromptAction.querySelector("span").textContent = "ทำ Session Plan ต่อ";
    } else {
      plannerPromptState.dataset.state = "waiting";
      plannerPromptState.querySelector(".pill-copy").textContent = "OPEN FOR PLANNING";
      plannerPromptMessage.textContent =
        "ยังไม่มี Daily Plan กำหนด Bias, POI และ No Trade Conditions ก่อนตลาดเปิด";
      plannerPromptAction.querySelector("span").textContent = "เริ่ม Session Plan";
    }

    const watchlistPromptState = document.getElementById("watchlistPromptState");
    const watchlistPromptMessage = document.getElementById("watchlistPromptMessage");
    const watchlistPromptAction = document.getElementById("watchlistPromptAction");
    if (watchlistSummary.freshReady) {
      watchlistPromptState.dataset.state = "ready";
      watchlistPromptState.querySelector(".pill-copy").textContent =
        `${watchlistSummary.freshReady} READY`;
      watchlistPromptMessage.textContent =
        `${watchlistSummary.freshReadySymbols.slice(0, 3).join(", ")} พร้อมตรวจ Setup จาก Context ที่อัปเดตแล้ว`;
      watchlistPromptAction.querySelector("span").textContent = "ดู Pair ที่พร้อม";
    } else if (!watchlistSummary.total) {
      watchlistPromptState.dataset.state = "waiting";
      watchlistPromptState.querySelector(".pill-copy").textContent = "WATCHLIST EMPTY";
      watchlistPromptMessage.textContent =
        "เพิ่ม Pair ที่ต้องการติดตาม แล้วกำหนด HTF Bias และเงื่อนไขที่กำลังรอ";
      watchlistPromptAction.querySelector("span").textContent = "เพิ่ม Watchlist";
    } else if (watchlistSummary.stale) {
      watchlistPromptState.dataset.state = "developing";
      watchlistPromptState.querySelector(".pill-copy").textContent = "NEEDS UPDATE";
      watchlistPromptMessage.textContent =
        `${watchlistSummary.stale} จาก ${watchlistSummary.total} Pair ต้องอัปเดต Context ก่อนใช้ตัดสินใจ`;
      watchlistPromptAction.querySelector("span").textContent = "อัปเดต Watchlist";
    } else {
      watchlistPromptState.dataset.state = "waiting";
      watchlistPromptState.querySelector(".pill-copy").textContent = "WAITING";
      watchlistPromptMessage.textContent =
        `${watchlistSummary.waiting} Pair กำลังรอเงื่อนไขตาม Context ที่บันทึกไว้`;
      watchlistPromptAction.querySelector("span").textContent = "เปิด Watchlist";
    }

    const weeklyPromptState = document.getElementById("weeklyPromptState");
    const weeklyPromptMessage = document.getElementById("weeklyPromptMessage");
    const weeklyPromptAction = document.getElementById("weeklyPromptAction");
    if (weeklyReview.updatedAt) {
      weeklyPromptState.dataset.state = "ready";
      weeklyPromptState.querySelector(".pill-copy").textContent = "REVIEW SAVED";
      weeklyPromptMessage.textContent =
        `ทบทวนสัปดาห์นี้แล้ว พร้อมข้อมูล ${weeklyClosed} Closed Trade`;
      weeklyPromptAction.querySelector("span").textContent = "ดู Weekly Review";
    } else if (weeklyClosed) {
      weeklyPromptState.dataset.state = "developing";
      weeklyPromptState.querySelector(".pill-copy").textContent = "REVIEW DUE";
      weeklyPromptMessage.textContent =
        `มี ${weeklyClosed} Closed Trade รอสรุปเป็นบทเรียนประจำสัปดาห์`;
      weeklyPromptAction.querySelector("span").textContent = "เริ่ม Weekly Review";
    } else {
      weeklyPromptState.dataset.state = "waiting";
      weeklyPromptState.querySelector(".pill-copy").textContent = "OPEN FOR PLANNING";
      weeklyPromptMessage.textContent =
        "ยังไม่มี Closed Trade สัปดาห์นี้ แต่สามารถบันทึกแผนและจุดโฟกัสได้";
      weeklyPromptAction.querySelector("span").textContent = "เปิด Weekly Review";
    }

    const validationState = validation.validated >= validation.target ? "ready" :
      validation.validated >= 10 ? "developing" : "waiting";
    const validationLabel = validation.validated >= validation.target ? "CALIBRATION READY" :
      validation.validated >= 10 ? "FIRST REVIEW READY" : "COLLECTING EVIDENCE";
    const validationMessage = validation.validated >= validation.target ?
      "มีข้อมูลครบสำหรับทบทวนสูตรคะแนนรอบหลัก" :
      validation.validated >= 10 ?
        "มีข้อมูลพอสำหรับทบทวนสูตรคะแนนรอบแรก" :
        `ต้องการอีก ${validation.remaining} ผลลัพธ์เพื่อครบเป้าหมาย`;
    const validationPill = document.getElementById("validationState");
    validationPill.dataset.state = validationState;
    validationPill.querySelector(".pill-copy").textContent = validationLabel;
    document.getElementById("validationCount").textContent =
      `${validation.validated} / ${validation.target}`;
    document.getElementById("validationMessage").textContent = validationMessage;
    document.getElementById("validationProgress").style.width = `${validation.percent}%`;
    document.getElementById("closedEvidenceCount").textContent = String(validation.closed);
    document.getElementById("reviewedSkipCount").textContent = String(validation.reviewedSkips);
    document.getElementById("pendingSkipCount").textContent = String(validation.pendingSkips);

    const statePill = document.getElementById("activeStatePill");
    const stateTitle = document.getElementById("activeState");
    const nextAction = document.getElementById("nextAction");
    const progressText = document.getElementById("progressText");
    const progressValue = document.getElementById("progressValue");
    const primaryAction = document.getElementById("primaryAction");
    const newAction = document.getElementById("newAction");
    const grade = document.getElementById("gradeValue");
    const gradeScore = document.getElementById("gradeScore");

    if (hasDraft && evaluation) {
      statePill.dataset.state = evaluation.state;
      statePill.querySelector(".pill-copy").textContent = evaluation.stateLabel;
      stateTitle.textContent = `${draft.instrument} · ${draft.direction === "bullish" ? "Bullish" : draft.direction === "bearish" ? "Bearish" : "ยังไม่เลือกทิศทาง"}`;
      nextAction.textContent = evaluation.nextAction;
      progressText.textContent = `${evaluation.progress.complete} / ${evaluation.progress.total} เงื่อนไข`;
      progressValue.style.width = `${evaluation.progress.percent}%`;
      primaryAction.href = "trade.html";
      primaryAction.querySelector("span").textContent = "ทำรายการต่อ";
      newAction.hidden = false;
      grade.textContent = evaluation.grade;
      grade.dataset.grade = evaluation.grade === "NO TRADE" ? "no-trade" : evaluation.grade.toLowerCase();
      gradeScore.textContent = `${evaluation.score} / 100 คะแนน`;
    } else {
      statePill.dataset.state = "waiting";
      statePill.querySelector(".pill-copy").textContent = "ยังไม่มี Active Setup";
      stateTitle.textContent = "เริ่มจากแผน ไม่ใช่สัญญาณ";
      nextAction.textContent = "สร้างรายการใหม่เพื่อให้ระบบพาเช็กทีละขั้น";
      progressText.textContent = "0 / 23 เงื่อนไข";
      progressValue.style.width = "0%";
      primaryAction.href = "trade.html";
      primaryAction.querySelector("span").textContent = "เริ่ม New Trade";
      newAction.hidden = true;
      grade.textContent = "--";
      grade.dataset.grade = "";
      gradeScore.textContent = "ยังไม่มีคะแนน";
    }

    document.querySelectorAll("[data-pipeline-step]").forEach(function (row, index) {
      const step = evaluation && evaluation.steps[index];
      row.dataset.complete = step ? String(step.complete) : "false";
      row.querySelector(".pipeline-state").textContent = step && step.complete ? "COMPLETE" : "WAITING";
    });

    renderOpenPositions(openPositions);
    renderHistory(history);
  }

  document.addEventListener("click", function (event) {
    const deleteButton = event.target.closest("[data-delete-assessment]");
    if (deleteButton) {
      const assessment = storage.loadHistory().find(function (item) {
        return String(item.id) === deleteButton.dataset.deleteAssessment;
      });
      if (!assessment || storage.isEnteredRecord(assessment)) {
        window.alert("ไม่พบรายการที่ต้องการลบ");
        return;
      }

      const instrument = assessment.instrument || "ไม่ระบุสินทรัพย์";
      const grade = assessment.result && assessment.result.grade ?
        assessment.result.grade : "Assessment";
      if (!window.confirm(
        `ลบรายการ ${instrument} (${grade}) นี้ถาวรใช่หรือไม่?\n\n` +
        "รายการจะถูกนำออกจาก Recent assessments และ Phase 1 validation"
      )) return;

      const deleted = storage.deleteAssessment(assessment.id);
      if (!deleted) {
        window.alert("ลบรายการไม่สำเร็จ กรุณาลองอีกครั้ง");
        return;
      }
      render();
      return;
    }

    const closeButton = event.target.closest("[data-close-position]");
    if (closeButton) {
      const outcomeLabel = {
        win: "WIN",
        loss: "LOSS",
        "break-even": "BREAK EVEN"
      }[closeButton.dataset.outcome];
      if (!window.confirm(`ปิด Position นี้เป็น ${outcomeLabel} หรือไม่?`)) return;
      storage.closePosition(closeButton.dataset.closePosition, closeButton.dataset.outcome);
      render();
      return;
    }

    const reviewButton = event.target.closest("[data-review-skip]");
    if (!reviewButton) return;
    storage.reviewSkippedAssessment(
      reviewButton.dataset.reviewSkip,
      reviewButton.dataset.verdict
    );
    render();
  });

  render();
})();

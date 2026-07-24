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
    if (lifecycle && lifecycle.status === "skipped") return { label: "SKIPPED", state: "waiting" };
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
    history.slice(0, 5).forEach(function (item) {
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

      const grade = document.createElement("div");
      grade.className = "history-grade";
      const gradeValue = document.createElement("strong");
      gradeValue.textContent = item.result.grade;
      if (item.result.grade === "NO TRADE") gradeValue.style.color = "var(--red)";
      const score = document.createElement("span");
      score.textContent = `${item.result.score} / 100`;
      grade.append(gradeValue, score);

      row.append(info, grade);
      list.appendChild(row);
    });
  }

  function render() {
    const draft = storage.loadDraft();
    const hasDraft = storage.hasMeaningfulDraft(draft);
    const evaluation = draft ? logic.evaluate(draft) : null;
    const history = storage.loadHistory();
    const openPositions = storage.loadOpenPositions();
    const today = localDateKey(new Date());
    const todayHistory = history.filter((item) => localDateKey(item.savedAt) === today);
    const enteredToday = todayHistory.filter((item) =>
      item.lifecycle && item.lifecycle.decision === "entered"
    ).length;
    const session = currentSession();

    document.getElementById("todayCount").textContent = String(todayHistory.length);
    document.getElementById("enteredCount").textContent = String(enteredToday);
    document.getElementById("openCount").textContent = String(openPositions.length);
    document.getElementById("sessionName").textContent = session[0];
    document.getElementById("sessionNote").textContent = session[1];

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
    const button = event.target.closest("[data-close-position]");
    if (!button) return;
    const outcomeLabel = {
      win: "WIN",
      loss: "LOSS",
      "break-even": "BREAK EVEN"
    }[button.dataset.outcome];
    if (!window.confirm(`ปิด Position นี้เป็น ${outcomeLabel} หรือไม่?`)) return;
    storage.closePosition(button.dataset.closePosition, button.dataset.outcome);
    render();
  });

  render();
})();

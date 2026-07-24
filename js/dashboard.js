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
      status.dataset.state = item.result.state;
      status.textContent = item.result.state === "ready" ? "READY" :
        item.result.state === "no-trade" ? "NO TRADE" : "REVIEWED";
      primary.appendChild(status);

      const meta = document.createElement("div");
      meta.className = "history-meta";
      const direction = item.direction === "bullish" ? "Bullish" :
        item.direction === "bearish" ? "Bearish" : "No bias";
      const setup = item.setupType === "continuation" ? "Continuation" : "Reversal";
      meta.textContent = `${direction} · ${setup} · ${formatDate(item.savedAt)}`;

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
    const today = localDateKey(new Date());
    const todayHistory = history.filter((item) => localDateKey(item.savedAt) === today);
    const readyToday = todayHistory.filter((item) => item.result.state === "ready").length;
    const session = currentSession();

    document.getElementById("todayCount").textContent = String(todayHistory.length);
    document.getElementById("readyCount").textContent = String(readyToday);
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

    renderHistory(history);
  }

  render();
})();

(function () {
  "use strict";

  const storage = window.TradingStorage;
  const logic = window.TradingLogic;
  const stepPanels = [...document.querySelectorAll(".step-panel")];
  const stepTabs = [...document.querySelectorAll(".step-tab")];
  let draft = storage.loadDraft() || storage.createDraft();
  let currentStep = Math.min(Math.max(Number(draft.currentStep) || 0, 0), stepPanels.length - 1);

  function initializeNewRequest() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") !== "1") return;
    if (!storage.hasMeaningfulDraft(draft) || window.confirm("เริ่มรายการใหม่และล้าง Draft ปัจจุบันหรือไม่?")) {
      storage.clearDraft();
      draft = storage.createDraft();
      currentStep = 0;
    }
    window.history.replaceState({}, "", "trade.html");
  }

  function save() {
    draft.currentStep = currentStep;
    draft = storage.saveDraft(draft);
    const saveState = document.getElementById("saveState");
    saveState.textContent = "บันทึกอัตโนมัติแล้ว";
  }

  function setCurrentStep(index) {
    currentStep = Math.min(Math.max(index, 0), stepPanels.length - 1);
    stepPanels.forEach(function (panel, panelIndex) {
      panel.dataset.active = String(panelIndex === currentStep);
    });
    stepTabs.forEach(function (tab, tabIndex) {
      tab.setAttribute("aria-selected", String(tabIndex === currentStep));
      tab.tabIndex = tabIndex === currentStep ? 0 : -1;
    });
    document.getElementById("backButton").disabled = currentStep === 0;
    document.getElementById("nextButton").hidden = currentStep === stepPanels.length - 1;
    document.getElementById("lifecycleActions").hidden = currentStep !== stepPanels.length - 1;
    save();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function syncControls() {
    document.querySelectorAll(".choice[data-field]").forEach(function (button) {
      const field = button.dataset.field;
      button.setAttribute("aria-pressed", String(draft[field] === button.dataset.value));
    });
    document.querySelectorAll(".choice[data-answer-key]").forEach(function (button) {
      const key = button.dataset.answerKey;
      button.setAttribute("aria-pressed", String(draft.answers[key] === button.dataset.value));
    });

    document.getElementById("instrument").value = draft.instrument;
    document.getElementById("session").value = draft.session;
    document.getElementById("notes").value = draft.notes;
    document.getElementById("entryPrice").value = draft.tradePlan.entry;
    document.getElementById("stopLossPrice").value = draft.tradePlan.stopLoss;
    document.getElementById("takeProfitPrice").value = draft.tradePlan.takeProfit;

    const structureLabel = document.getElementById("structureLabel");
    const structureHelp = document.getElementById("structureHelp");
    if (draft.setupType === "continuation") {
      structureLabel.textContent = "เกิด BOS ไปทางเดียวกับ Trade Direction แล้วหรือยัง?";
      structureHelp.textContent = "Continuation ใช้ BOS เพื่อยืนยันการไปต่อหลัง Pullback";
    } else {
      structureLabel.textContent = "เกิด MSS / CHOCH ไปทางเดียวกับ Trade Direction แล้วหรือยัง?";
      structureHelp.textContent = "Reversal ใช้ MSS หรือ CHOCH เพื่อยืนยันการเปลี่ยนทิศ";
    }
  }

  function renderEvaluation() {
    const evaluation = logic.evaluate(draft);
    const tradePlan = logic.evaluateTradePlan(draft);
    const statePill = document.getElementById("railStatePill");
    statePill.dataset.state = evaluation.state;
    statePill.querySelector(".pill-copy").textContent = evaluation.stateLabel;
    document.getElementById("railState").textContent = evaluation.stateLabel;
    document.getElementById("railNext").textContent = evaluation.nextAction;
    document.getElementById("railGrade").textContent = evaluation.grade;
    document.getElementById("railScore").textContent = `${evaluation.score} / 100`;
    document.getElementById("railProgress").style.width = `${evaluation.progress.percent}%`;
    document.getElementById("railProgressCopy").textContent = `${evaluation.progress.complete} / ${evaluation.progress.total}`;

    stepTabs.forEach(function (tab, index) {
      tab.dataset.complete = String(evaluation.steps[index].complete);
    });

    const blockerList = document.getElementById("blockerList");
    blockerList.replaceChildren();
    if (!evaluation.blockers.length) {
      const item = document.createElement("li");
      item.className = "rail-empty";
      item.textContent = "ยังไม่พบเงื่อนไขที่บังคับให้ยกเลิกแผน";
      blockerList.appendChild(item);
    } else {
      evaluation.blockers.forEach(function (blocker) {
        const item = document.createElement("li");
        item.textContent = blocker;
        blockerList.appendChild(item);
      });
    }

    const planStatus = document.getElementById("planStatus");
    planStatus.dataset.complete = String(tradePlan.complete);
    planStatus.dataset.valid = String(tradePlan.valid);
    planStatus.querySelector("span").textContent = tradePlan.message;

    const enteredButton = document.getElementById("enteredButton");
    enteredButton.disabled = evaluation.state !== "ready" || !tradePlan.valid;
    enteredButton.title = evaluation.state !== "ready" ?
      "Setup ต้องเป็น READY TO ENTER ก่อน" :
      !tradePlan.valid ? tradePlan.message : "บันทึกเป็น Open Position";

    return { evaluation, tradePlan };
  }

  function render() {
    syncControls();
    renderEvaluation();
    stepPanels.forEach(function (panel, index) {
      panel.dataset.active = String(index === currentStep);
    });
    stepTabs.forEach(function (tab, index) {
      tab.setAttribute("aria-selected", String(index === currentStep));
    });
    document.getElementById("backButton").disabled = currentStep === 0;
    document.getElementById("nextButton").hidden = currentStep === stepPanels.length - 1;
    document.getElementById("lifecycleActions").hidden = currentStep !== stepPanels.length - 1;
    save();
  }

  document.addEventListener("click", function (event) {
    const choice = event.target.closest(".choice");
    if (choice) {
      const value = choice.dataset.value;
      if (choice.dataset.field) {
        draft[choice.dataset.field] = value;
      } else if (choice.dataset.answerKey) {
        const key = choice.dataset.answerKey;
        draft.answers[key] = draft.answers[key] === value ? "" : value;
      }
      render();
      return;
    }

    const tab = event.target.closest(".step-tab");
    if (tab) setCurrentStep(Number(tab.dataset.step));
  });

  document.getElementById("instrument").addEventListener("change", function (event) {
    draft.instrument = event.target.value;
    save();
  });

  document.getElementById("session").addEventListener("change", function (event) {
    draft.session = event.target.value;
    save();
  });

  document.getElementById("notes").addEventListener("input", function (event) {
    draft.notes = event.target.value;
    save();
  });

  [
    ["entryPrice", "entry"],
    ["stopLossPrice", "stopLoss"],
    ["takeProfitPrice", "takeProfit"]
  ].forEach(function ([inputId, planKey]) {
    document.getElementById(inputId).addEventListener("input", function (event) {
      draft.tradePlan[planKey] = event.target.value;
      renderEvaluation();
      save();
    });
  });

  document.getElementById("backButton").addEventListener("click", function () {
    setCurrentStep(currentStep - 1);
  });

  document.getElementById("nextButton").addEventListener("click", function () {
    setCurrentStep(currentStep + 1);
  });

  document.getElementById("resetButton").addEventListener("click", function () {
    if (!window.confirm("ล้างข้อมูล Draft นี้และเริ่มใหม่หรือไม่?")) return;
    storage.clearDraft();
    draft = storage.createDraft();
    currentStep = 0;
    render();
  });

  document.getElementById("waitButton").addEventListener("click", function () {
    save();
    window.location.href = "index.html";
  });

  document.getElementById("skipButton").addEventListener("click", function () {
    const result = renderEvaluation();
    storage.saveAssessment(draft, result.evaluation, {
      decision: "skip",
      tradePlan: {
        ...draft.tradePlan,
        plannedRr: result.tradePlan.rr
      }
    });
    storage.clearDraft();
    window.location.href = "index.html";
  });

  document.getElementById("enteredButton").addEventListener("click", function () {
    const result = renderEvaluation();
    if (result.evaluation.state !== "ready" || !result.tradePlan.valid) return;
    storage.saveAssessment(draft, result.evaluation, {
      decision: "entered",
      tradePlan: {
        ...draft.tradePlan,
        plannedRr: result.tradePlan.rr
      }
    });
    storage.clearDraft();
    window.location.href = "index.html";
  });

  initializeNewRequest();
  render();
})();

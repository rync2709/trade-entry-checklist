(function () {
  "use strict";

  const storage = window.TradingStorage;
  const list = document.getElementById("journalList");
  const empty = document.getElementById("journalEmpty");
  const emptyTitle = document.getElementById("journalEmptyTitle");
  const emptyMessage = document.getElementById("journalEmptyMessage");
  const filters = [...document.querySelectorAll("[data-journal-filter]")];
  let activeFilter = "all";

  const emotionLabels = {
    calm: "Calm",
    neutral: "Neutral",
    fearful: "Fearful",
    angry: "Angry",
    overconfident: "Overconfident"
  };

  const mistakeLabels = {
    fomo: "FOMO",
    "late-entry": "Late entry",
    "no-htf": "No HTF context",
    "ignored-cisd": "Ignored CISD",
    "ignored-displacement": "Ignored displacement"
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(value) {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function getStatus(record) {
    if (record.lifecycle && record.lifecycle.status === "open") {
      return { label: "OPEN", state: "open" };
    }

    const outcome = record.lifecycle && record.lifecycle.outcome;
    if (outcome === "win") return { label: "WIN", state: "ready" };
    if (outcome === "loss") return { label: "LOSS", state: "no-trade" };
    if (outcome === "break-even") return { label: "BREAK EVEN", state: "waiting" };
    return { label: "CLOSED", state: "waiting" };
  }

  function formatDirection(value) {
    if (value === "bullish") return "Bullish";
    if (value === "bearish") return "Bearish";
    return "No direction";
  }

  function formatSetup(value) {
    if (value === "reversal") return "Reversal";
    if (value === "continuation") return "Continuation";
    return "No setup type";
  }

  function formatSession(value) {
    const labels = {
      asia: "Asia",
      london: "London",
      "new-york": "New York",
      auto: "Auto session"
    };
    return labels[value] || value || "No session";
  }

  function formatPlanValue(value) {
    return value === "" || value == null ? "--" : String(value);
  }

  function formatRr(value) {
    const rr = Number(value);
    return Number.isFinite(rr) && rr > 0 ? `1:${rr.toFixed(2)}` : "--";
  }

  function hasReview(journal) {
    return Boolean(journal.updatedAt);
  }

  function renderEmotionOptions(selected) {
    const options = ['<option value="">ยังไม่ระบุ</option>'];
    Object.entries(emotionLabels).forEach(function ([value, label]) {
      const isSelected = value === selected ? " selected" : "";
      options.push(`<option value="${value}"${isSelected}>${label}</option>`);
    });
    return options.join("");
  }

  function renderMistakeOptions(selected) {
    return Object.entries(mistakeLabels).map(function ([value, label]) {
      const pressed = selected.includes(value) ? "true" : "false";
      return `
        <button class="mistake-option" type="button" data-mistake="${value}" aria-pressed="${pressed}">
          ${label}
        </button>
      `;
    }).join("");
  }

  function renderCard(record) {
    const journal = storage.normalizeJournal(record.journal);
    const status = getStatus(record);
    const plan = record.tradePlan || {};
    const grade = record.result && record.result.grade ? record.result.grade : "--";
    const score = record.result && Number.isFinite(Number(record.result.score)) ?
      `${Number(record.result.score)} / 100` : "No score";
    const reviewState = hasReview(journal) ?
      `บันทึกล่าสุด ${formatDate(journal.updatedAt)}` : "ยังไม่ได้บันทึก Review";
    const note = record.notes ?
      `<p class="journal-note"><strong>Trade note:</strong> ${escapeHtml(record.notes)}</p>` : "";

    return `
      <article class="panel journal-card" data-journal-id="${escapeHtml(record.id)}">
        <header class="journal-card-header">
          <div>
            <div class="journal-title-row">
              <h3>${escapeHtml(record.instrument || "Unknown")}</h3>
              <span class="status-pill" data-state="${status.state}">
                <span class="status-dot"></span>
                ${status.label}
              </span>
            </div>
            <p class="journal-meta">
              ${formatDirection(record.direction)} · ${formatSetup(record.setupType)} ·
              ${escapeHtml(formatSession(record.session))} · ${formatDate(record.savedAt || record.createdAt)}
            </p>
          </div>
          <div class="journal-grade">
            <strong>${escapeHtml(grade)}</strong>
            <span>${escapeHtml(score)}</span>
          </div>
        </header>

        <div class="journal-plan" aria-label="Trade plan">
          <div><span>Entry</span><strong>${escapeHtml(formatPlanValue(plan.entry))}</strong></div>
          <div><span>Stop Loss</span><strong>${escapeHtml(formatPlanValue(plan.stopLoss))}</strong></div>
          <div><span>Take Profit</span><strong>${escapeHtml(formatPlanValue(plan.takeProfit))}</strong></div>
          <div><span>Planned RR</span><strong>${escapeHtml(formatRr(plan.plannedRr))}</strong></div>
        </div>

        ${note}

        <div class="journal-review">
          <div class="journal-form-grid">
            <div class="journal-field">
              <label>Emotion</label>
              <select data-journal-emotion aria-label="Emotion">
                ${renderEmotionOptions(journal.emotion)}
              </select>
            </div>
            <div class="journal-field">
              <label>TradingView link</label>
              <input
                type="url"
                inputmode="url"
                placeholder="https://www.tradingview.com/..."
                value="${escapeHtml(journal.tradingViewUrl)}"
                aria-label="TradingView link"
                data-journal-url
              >
            </div>
            <div class="journal-field journal-field-wide">
              <span>Mistakes</span>
              <div class="mistake-options">
                ${renderMistakeOptions(journal.mistakes)}
              </div>
            </div>
            <div class="journal-field journal-field-wide">
              <label>Lesson</label>
              <textarea
                maxlength="2000"
                placeholder="บทเรียนสั้น ๆ จาก Trade นี้"
                aria-label="Lesson"
                data-journal-lesson
              >${escapeHtml(journal.lesson)}</textarea>
            </div>
          </div>
          <div class="journal-actions">
            <span
              class="journal-save-state"
              data-journal-save-state
              data-state="${hasReview(journal) ? "saved" : "idle"}"
            >
              ${reviewState}
            </span>
            <button class="button button-primary" type="button" data-save-journal>
              <svg class="icon" aria-hidden="true"><use href="./assets/icons.svg#icon-save"></use></svg>
              บันทึก Review
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderMetrics(records) {
    document.getElementById("totalTrades").textContent = records.length;
    document.getElementById("openTrades").textContent = records.filter(function (record) {
      return record.lifecycle && record.lifecycle.status === "open";
    }).length;
    document.getElementById("closedTrades").textContent = records.filter(function (record) {
      return record.lifecycle && record.lifecycle.status === "closed";
    }).length;
    document.getElementById("reviewedTrades").textContent = records.filter(function (record) {
      return hasReview(storage.normalizeJournal(record.journal));
    }).length;
  }

  function render() {
    const records = storage.loadJournalTrades();
    const visible = records.filter(function (record) {
      return activeFilter === "all" ||
        (record.lifecycle && record.lifecycle.status === activeFilter);
    });

    renderMetrics(records);
    list.innerHTML = visible.map(renderCard).join("");
    empty.hidden = visible.length > 0;
    if (!visible.length && records.length && activeFilter !== "all") {
      emptyTitle.textContent = activeFilter === "open" ?
        "ไม่มี Open Trade" : "ไม่มี Closed Trade";
      emptyMessage.textContent = "ยังไม่มีรายการในสถานะนี้";
    } else {
      emptyTitle.textContent = "ยังไม่มี Trade ใน Journal";
      emptyMessage.textContent = "รายการที่เลือก `ENTERED` จาก New Trade Wizard จะปรากฏที่นี่";
    }
  }

  filters.forEach(function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.dataset.journalFilter;
      filters.forEach(function (item) {
        item.setAttribute("aria-pressed", String(item === button));
      });
      render();
    });
  });

  list.addEventListener("click", function (event) {
    const mistakeButton = event.target.closest("[data-mistake]");
    if (mistakeButton) {
      const pressed = mistakeButton.getAttribute("aria-pressed") === "true";
      mistakeButton.setAttribute("aria-pressed", String(!pressed));
      return;
    }

    const saveButton = event.target.closest("[data-save-journal]");
    if (!saveButton) return;

    const card = saveButton.closest("[data-journal-id]");
    const urlInput = card.querySelector("[data-journal-url]");
    const saveState = card.querySelector("[data-journal-save-state]");
    const tradingViewUrl = urlInput.value.trim();

    if (tradingViewUrl && !/^https?:\/\//i.test(tradingViewUrl)) {
      saveState.dataset.state = "error";
      saveState.textContent = "ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://";
      urlInput.focus();
      return;
    }

    const review = {
      emotion: card.querySelector("[data-journal-emotion]").value,
      tradingViewUrl,
      mistakes: [...card.querySelectorAll("[data-mistake][aria-pressed='true']")]
        .map(function (button) { return button.dataset.mistake; }),
      lesson: card.querySelector("[data-journal-lesson]").value
    };

    const updated = storage.saveJournalReview(card.dataset.journalId, review);
    if (!updated) {
      saveState.dataset.state = "error";
      saveState.textContent = "บันทึกไม่สำเร็จ";
      return;
    }

    saveState.dataset.state = "saved";
    saveState.textContent = "บันทึกแล้ว";
    renderMetrics(storage.loadJournalTrades());
  });

  render();
})();

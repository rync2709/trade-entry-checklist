(function () {
  "use strict";

  const storage = window.TradingStorage;
  const media = window.TradingMedia;
  const list = document.getElementById("journalList");
  const empty = document.getElementById("journalEmpty");
  const emptyTitle = document.getElementById("journalEmptyTitle");
  const emptyMessage = document.getElementById("journalEmptyMessage");
  const screenshotDialog = document.getElementById("screenshotDialog");
  const screenshotDialogImage = document.getElementById("screenshotDialogImage");
  const screenshotDialogTitle = document.getElementById("screenshotDialogTitle");
  const closeScreenshotDialog = document.getElementById("closeScreenshotDialog");
  const filters = [...document.querySelectorAll("[data-journal-filter]")];
  const screenshotUrls = new Map();
  let activeFilter = "all";
  let renderVersion = 0;

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

  function formatFileSize(value) {
    const bytes = Number(value);
    if (!Number.isFinite(bytes) || bytes <= 0) return "--";
    if (bytes < 1024 * 1024) return `${Math.max(Math.round(bytes / 1024), 1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatHoldingTime(record) {
    const lifecycle = record.lifecycle || {};
    const openedAt = new Date(lifecycle.openedAt);
    const closedAt = new Date(lifecycle.closedAt);
    if (
      Number.isNaN(openedAt.getTime()) ||
      Number.isNaN(closedAt.getTime()) ||
      closedAt <= openedAt
    ) return "Holding time --";

    const totalMinutes = Math.max(Math.round((closedAt - openedAt) / 60000), 1);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes || !parts.length) parts.push(`${minutes}m`);
    return `Held ${parts.join(" ")}`;
  }

  function formatRealizedRr(value) {
    if (value === null || value === undefined || value === "") return "--";
    const rr = Number(value);
    if (!Number.isFinite(rr)) return "--";
    const prefix = rr > 0 ? "+" : "";
    return `${prefix}${rr.toFixed(2)}R`;
  }

  function realizedRrState(value) {
    if (value === null || value === undefined || value === "") return "idle";
    const rr = Number(value);
    if (!Number.isFinite(rr)) return "idle";
    if (rr > 0) return "positive";
    if (rr < 0) return "negative";
    return "neutral";
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

  function renderCloseReview(record, journal) {
    if (!record.lifecycle || record.lifecycle.status !== "closed") return "";
    const closeReview = journal.closeReview;
    const realizedRr = closeReview.actualExit ?
      storage.calculateRealizedRr(record, closeReview.actualExit) : closeReview.realizedRr;
    const savedState = closeReview.updatedAt ?
      `บันทึกล่าสุด ${formatDate(closeReview.updatedAt)}` : "ยังไม่ได้บันทึกผลจริง";

    return `
      <section class="close-review journal-field-wide" data-close-review>
        <header class="close-review-header">
          <div>
            <span>Trade result</span>
            <strong>Post-trade execution</strong>
          </div>
          <span class="holding-time">${formatHoldingTime(record)}</span>
        </header>
        <div class="close-review-grid">
          <div class="journal-field">
            <label>Actual Exit</label>
            <input
              type="number"
              min="0"
              step="any"
              inputmode="decimal"
              placeholder="0.00"
              value="${escapeHtml(closeReview.actualExit)}"
              aria-label="Actual Exit"
              data-actual-exit
            >
          </div>
          <div class="realized-rr" data-realized-state="${realizedRrState(realizedRr)}">
            <span>Realized RR</span>
            <strong data-realized-rr>${formatRealizedRr(realizedRr)}</strong>
            <small>จาก Entry และ Stop Loss</small>
          </div>
          <div class="journal-field close-note-field">
            <label>Close Note</label>
            <textarea
              maxlength="2000"
              placeholder="เหตุผลที่ปิด Trade และสิ่งที่เกิดขึ้นจริง"
              aria-label="Close Note"
              data-close-note
            >${escapeHtml(closeReview.closeNote)}</textarea>
          </div>
        </div>
        <div class="close-review-actions">
          <span
            class="close-review-state"
            data-close-review-state
            data-state="${closeReview.updatedAt ? "saved" : "idle"}"
          >${savedState}</span>
          <button class="button" type="button" data-save-close-review>
            <svg class="icon" aria-hidden="true"><use href="./assets/icons.svg#icon-save"></use></svg>
            บันทึกผลจริง
          </button>
        </div>
      </section>
    `;
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
      <article
        class="panel journal-card"
        id="trade-${escapeHtml(record.id)}"
        data-journal-id="${escapeHtml(record.id)}"
      >
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
            ${renderCloseReview(record, journal)}
            <div class="journal-field journal-field-wide">
              <span>Screenshot</span>
              <div class="screenshot-control">
                <button
                  class="screenshot-preview"
                  type="button"
                  data-open-screenshot
                  title="เปิดดู Screenshot ขนาดเต็ม"
                  hidden
                >
                  <img alt="Trade Screenshot">
                </button>
                <div class="screenshot-toolbar">
                  <div class="screenshot-actions">
                    <label class="button screenshot-upload">
                      <svg class="icon" aria-hidden="true"><use href="./assets/icons.svg#icon-image"></use></svg>
                      <span data-screenshot-label>${journal.screenshot ? "เปลี่ยนรูป" : "เลือกรูป"}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        aria-label="เลือก Trade Screenshot"
                        data-screenshot-input
                      >
                    </label>
                    <button
                      class="button button-quiet button-danger"
                      type="button"
                      data-remove-screenshot
                      title="ลบ Screenshot"
                      hidden
                    >
                      <svg class="icon" aria-hidden="true"><use href="./assets/icons.svg#icon-x"></use></svg>
                      <span>ลบรูป</span>
                    </button>
                  </div>
                  <span class="screenshot-status" data-screenshot-status data-state="idle">
                    ${journal.screenshot ?
                      `${escapeHtml(journal.screenshot.name)} · ${formatFileSize(journal.screenshot.size)}` :
                      "PNG, JPG หรือ WEBP · ไม่เกิน 8 MB"}
                  </span>
                </div>
              </div>
            </div>
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

  function findCard(tradeId) {
    return [...list.querySelectorAll("[data-journal-id]")].find(function (card) {
      return card.dataset.journalId === tradeId;
    }) || null;
  }

  function revokeScreenshotUrl(tradeId) {
    const url = screenshotUrls.get(tradeId);
    if (url) URL.revokeObjectURL(url);
    screenshotUrls.delete(tradeId);
  }

  function revokeScreenshotUrls() {
    screenshotUrls.forEach(function (url) {
      URL.revokeObjectURL(url);
    });
    screenshotUrls.clear();
  }

  function setScreenshotStatus(card, message, state) {
    const status = card.querySelector("[data-screenshot-status]");
    status.textContent = message;
    status.dataset.state = state || "idle";
  }

  function setCloseReviewStatus(card, message, state) {
    const status = card.querySelector("[data-close-review-state]");
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state || "idle";
  }

  function updateRealizedRrPreview(card) {
    const input = card.querySelector("[data-actual-exit]");
    const output = card.querySelector("[data-realized-rr]");
    if (!input || !output) return null;

    const record = storage.loadJournalTrades().find(function (item) {
      return item.id === card.dataset.journalId;
    });
    const realizedRr = record ? storage.calculateRealizedRr(record, input.value.trim()) : null;
    const resultBox = output.closest(".realized-rr");
    output.textContent = input.value.trim() ? formatRealizedRr(realizedRr) : "--";
    resultBox.dataset.realizedState = input.value.trim() ?
      realizedRrState(realizedRr) : "idle";
    return realizedRr;
  }

  function showScreenshot(card, tradeId, entry) {
    revokeScreenshotUrl(tradeId);
    const url = URL.createObjectURL(entry.blob);
    screenshotUrls.set(tradeId, url);

    const preview = card.querySelector("[data-open-screenshot]");
    const image = preview.querySelector("img");
    image.src = url;
    image.alt = `${card.querySelector("h3").textContent} Trade Screenshot`;
    preview.hidden = false;
    card.querySelector("[data-remove-screenshot]").hidden = false;
    card.querySelector("[data-screenshot-label]").textContent = "เปลี่ยนรูป";
    setScreenshotStatus(
      card,
      `${entry.name || "screenshot"} · ${formatFileSize(entry.size)}`,
      "saved"
    );
  }

  function hideScreenshot(card, tradeId) {
    revokeScreenshotUrl(tradeId);
    const preview = card.querySelector("[data-open-screenshot]");
    preview.hidden = true;
    preview.querySelector("img").removeAttribute("src");
    card.querySelector("[data-remove-screenshot]").hidden = true;
    card.querySelector("[data-screenshot-label]").textContent = "เลือกรูป";
  }

  async function hydrateScreenshots(records, version) {
    const recordsWithScreenshots = records.filter(function (record) {
      return Boolean(storage.normalizeJournal(record.journal).screenshot);
    });

    await Promise.all(recordsWithScreenshots.map(async function (record) {
      const card = findCard(record.id);
      if (!card) return;

      try {
        const entry = await media.loadScreenshot(record.id);
        if (version !== renderVersion) return;
        const currentCard = findCard(record.id);
        if (!currentCard) return;

        if (entry) {
          showScreenshot(currentCard, record.id, entry);
        } else {
          setScreenshotStatus(currentCard, "ไม่พบไฟล์รูปในอุปกรณ์นี้", "error");
        }
      } catch (error) {
        if (version === renderVersion) {
          const currentCard = findCard(record.id);
          if (currentCard) {
            setScreenshotStatus(
              currentCard,
              error && error.message ? error.message : "โหลด Screenshot ไม่สำเร็จ",
              "error"
            );
          }
        }
      }
    }));
  }

  function render() {
    const version = ++renderVersion;
    const records = storage.loadJournalTrades();
    const visible = records.filter(function (record) {
      return activeFilter === "all" ||
        (record.lifecycle && record.lifecycle.status === activeFilter);
    });

    renderMetrics(records);
    revokeScreenshotUrls();
    if (screenshotDialog.open) screenshotDialog.close();
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
    if (window.location.hash.startsWith("#trade-")) {
      let targetId = window.location.hash.slice(1);
      try {
        targetId = decodeURIComponent(targetId);
      } catch (error) {
        targetId = window.location.hash.slice(1);
      }
      const target = document.getElementById(targetId);
      if (target) {
        window.requestAnimationFrame(function () {
          target.scrollIntoView({ block: "start" });
        });
      }
    }
    hydrateScreenshots(visible, version);
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

    const screenshotButton = event.target.closest("[data-open-screenshot]");
    if (screenshotButton) {
      const card = screenshotButton.closest("[data-journal-id]");
      const image = screenshotButton.querySelector("img");
      if (!image.src) return;
      screenshotDialogImage.src = image.src;
      screenshotDialogTitle.textContent = `${card.querySelector("h3").textContent} Screenshot`;
      if (!screenshotDialog.open) screenshotDialog.showModal();
      return;
    }

    const removeScreenshotButton = event.target.closest("[data-remove-screenshot]");
    if (removeScreenshotButton) {
      const card = removeScreenshotButton.closest("[data-journal-id]");
      if (!window.confirm("ลบ Screenshot ของ Trade นี้ใช่หรือไม่?")) return;

      removeScreenshotButton.disabled = true;
      setScreenshotStatus(card, "กำลังลบรูป...", "idle");
      media.deleteScreenshot(card.dataset.journalId)
        .then(function () {
          storage.saveJournalScreenshot(card.dataset.journalId, null);
          hideScreenshot(card, card.dataset.journalId);
          setScreenshotStatus(card, "ลบรูปแล้ว", "saved");
          const saveState = card.querySelector("[data-journal-save-state]");
          saveState.dataset.state = "saved";
          saveState.textContent = "บันทึกการลบรูปแล้ว";
          renderMetrics(storage.loadJournalTrades());
        })
        .catch(function (error) {
          setScreenshotStatus(
            card,
            error && error.message ? error.message : "ลบ Screenshot ไม่สำเร็จ",
            "error"
          );
        })
        .finally(function () {
          removeScreenshotButton.disabled = false;
        });
      return;
    }

    const closeReviewButton = event.target.closest("[data-save-close-review]");
    if (closeReviewButton) {
      const card = closeReviewButton.closest("[data-journal-id]");
      const actualExit = card.querySelector("[data-actual-exit]").value.trim();
      const closeNote = card.querySelector("[data-close-note]").value;
      const realizedRr = updateRealizedRrPreview(card);
      if (actualExit && realizedRr === null) {
        setCloseReviewStatus(card, "ตรวจ Actual Exit, Entry และ Stop Loss", "error");
        card.querySelector("[data-actual-exit]").focus();
        return;
      }

      const updated = storage.saveCloseReview(card.dataset.journalId, {
        actualExit,
        closeNote
      });
      if (!updated) {
        setCloseReviewStatus(card, "บันทึกผลจริงไม่สำเร็จ", "error");
        return;
      }

      setCloseReviewStatus(card, "บันทึกผลจริงแล้ว", "saved");
      const saveState = card.querySelector("[data-journal-save-state]");
      saveState.dataset.state = "saved";
      saveState.textContent = "บันทึกผลจริงแล้ว";
      renderMetrics(storage.loadJournalTrades());
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

  list.addEventListener("input", function (event) {
    const card = event.target.closest("[data-journal-id]");
    if (!card) return;
    if (event.target.matches("[data-actual-exit]")) updateRealizedRrPreview(card);
    if (event.target.matches("[data-actual-exit], [data-close-note]")) {
      setCloseReviewStatus(card, "มีการแก้ไขที่ยังไม่บันทึก", "idle");
    }
  });

  list.addEventListener("change", async function (event) {
    const input = event.target.closest("[data-screenshot-input]");
    if (!input || !input.files || !input.files[0]) return;

    const card = input.closest("[data-journal-id]");
    const file = input.files[0];
    const uploadLabel = input.closest(".screenshot-upload");
    input.disabled = true;
    uploadLabel.setAttribute("aria-busy", "true");
    setScreenshotStatus(card, "กำลังบันทึกรูป...", "idle");

    try {
      const metadata = await media.saveScreenshot(card.dataset.journalId, file);
      const updated = storage.saveJournalScreenshot(card.dataset.journalId, metadata);
      if (!updated) {
        await media.deleteScreenshot(card.dataset.journalId);
        throw new Error("ไม่พบ Trade ที่ต้องการบันทึกรูป");
      }
      const entry = await media.loadScreenshot(card.dataset.journalId);
      if (entry) showScreenshot(card, card.dataset.journalId, entry);

      const saveState = card.querySelector("[data-journal-save-state]");
      saveState.dataset.state = "saved";
      saveState.textContent = "บันทึกรูปแล้ว";
      renderMetrics(storage.loadJournalTrades());
    } catch (error) {
      setScreenshotStatus(
        card,
        error && error.message ? error.message : "บันทึก Screenshot ไม่สำเร็จ",
        "error"
      );
    } finally {
      input.value = "";
      input.disabled = false;
      uploadLabel.removeAttribute("aria-busy");
    }
  });

  closeScreenshotDialog.addEventListener("click", function () {
    screenshotDialog.close();
  });

  screenshotDialog.addEventListener("click", function (event) {
    if (event.target === screenshotDialog) screenshotDialog.close();
  });

  screenshotDialog.addEventListener("close", function () {
    screenshotDialogImage.removeAttribute("src");
  });

  window.addEventListener("beforeunload", revokeScreenshotUrls);

  render();
})();

(function () {
  "use strict";

  const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
  const BIAS_OPTIONS = [
    ["", "Not set"],
    ["bullish", "Bullish"],
    ["bearish", "Bearish"],
    ["neutral", "Neutral"]
  ];
  const STATUS_OPTIONS = [
    ["monitoring", "Monitoring"],
    ["waiting-htf", "Wait HTF"],
    ["waiting-poi", "Wait POI"],
    ["waiting-sweep", "Wait Sweep"],
    ["waiting-confirmation", "Wait Confirmation"],
    ["ready", "Ready"],
    ["no-trade", "No Trade"]
  ];
  const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS);

  function isStale(item, now) {
    if (!item || !item.updatedAt) return true;
    const updatedAt = Date.parse(item.updatedAt);
    const currentTime = now instanceof Date ? now.getTime() :
      Number.isFinite(Number(now)) ? Number(now) : Date.now();
    return !Number.isFinite(updatedAt) ||
      updatedAt > currentTime ||
      currentTime - updatedAt > STALE_AFTER_MS;
  }

  function statusGroup(status) {
    if (status === "ready") return "ready";
    if (status === "no-trade") return "no-trade";
    return "waiting";
  }

  function summarize(items, now) {
    const source = Array.isArray(items) ? items : [];
    const readyItems = source.filter((item) => item.status === "ready");
    const freshReadyItems = readyItems.filter((item) => !isStale(item, now));
    return {
      total: source.length,
      ready: readyItems.length,
      freshReady: freshReadyItems.length,
      waiting: source.filter((item) => statusGroup(item.status) === "waiting").length,
      noTrade: source.filter((item) => item.status === "no-trade").length,
      stale: source.filter((item) => isStale(item, now)).length,
      readySymbols: readyItems.map((item) => item.symbol),
      freshReadySymbols: freshReadyItems.map((item) => item.symbol)
    };
  }

  function filterItems(items, filter, now) {
    const source = Array.isArray(items) ? items : [];
    if (filter === "stale") return source.filter((item) => isStale(item, now));
    if (["ready", "waiting", "no-trade"].includes(filter)) {
      return source.filter((item) => statusGroup(item.status) === filter);
    }
    return source;
  }

  function formatRelativeTime(value, now) {
    const timestamp = Date.parse(value);
    const currentTime = now instanceof Date ? now.getTime() :
      Number.isFinite(Number(now)) ? Number(now) : Date.now();
    if (!Number.isFinite(timestamp)) return "ยังไม่เคยอัปเดต";
    const elapsed = Math.max(currentTime - timestamp, 0);
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return "อัปเดตเมื่อสักครู่";
    if (minutes < 60) return `อัปเดต ${minutes} นาทีที่แล้ว`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `อัปเดต ${hours} ชั่วโมงที่แล้ว`;
    const days = Math.floor(hours / 24);
    return `อัปเดต ${days} วันที่แล้ว`;
  }

  function statusPillState(status) {
    if (status === "ready") return "ready";
    if (status === "no-trade") return "no-trade";
    if (status === "waiting-confirmation" || status === "waiting-sweep") {
      return "developing";
    }
    return "waiting";
  }

  function createSelect(options, value, fieldName, symbol) {
    const select = document.createElement("select");
    select.name = fieldName;
    select.setAttribute("aria-label", `${fieldName === "bias" ? "HTF Bias" : "Setup Status"} ${symbol}`);
    options.forEach(function ([optionValue, label]) {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = label;
      option.selected = optionValue === value;
      select.appendChild(option);
    });
    return select;
  }

  function createField(label, control) {
    const field = document.createElement("label");
    field.className = "watchlist-field";
    const copy = document.createElement("span");
    copy.textContent = label;
    field.append(copy, control);
    return field;
  }

  function createTextControl(type, name, value, placeholder, symbol) {
    const control = document.createElement(type);
    control.name = name;
    control.value = value || "";
    control.maxLength = name === "reviewNote" ? 1000 : 500;
    control.placeholder = placeholder;
    control.setAttribute("aria-label", `${placeholder} ${symbol}`);
    if (type === "textarea") control.rows = 3;
    return control;
  }

  function initializePage() {
    const grid = document.getElementById("watchlistGrid");
    if (!grid) return;

    const storage = window.TradingStorage;
    let selectedFilter = "all";

    function renderStatus(summary) {
      const bar = document.getElementById("watchlistStatusBar");
      const copy = document.getElementById("watchlistStatusText");
      if (!summary.total) {
        bar.dataset.state = "waiting";
        copy.textContent = "ยังไม่มีสินทรัพย์ใน Watchlist";
      } else if (summary.freshReady) {
        bar.dataset.state = "ready";
        copy.textContent = `${summary.freshReady} Pair อยู่สถานะ READY และ Context ยังใหม่`;
      } else if (summary.stale) {
        bar.dataset.state = "developing";
        copy.textContent = `${summary.stale} จาก ${summary.total} Pair ต้องอัปเดต Context`;
      } else {
        bar.dataset.state = "waiting";
        copy.textContent = `${summary.waiting} Pair กำลังรอเงื่อนไข`;
      }
    }

    function renderCard(item) {
      const form = document.createElement("form");
      form.className = "watchlist-card";
      form.dataset.watchlistId = item.id;
      form.dataset.status = item.status;

      const header = document.createElement("div");
      header.className = "watchlist-card-header";
      const symbol = document.createElement("div");
      symbol.className = "watchlist-symbol";
      const symbolValue = document.createElement("strong");
      symbolValue.textContent = item.symbol;
      const name = document.createElement("span");
      name.textContent = item.name;
      const freshness = document.createElement("small");
      freshness.className = "watchlist-freshness";
      freshness.dataset.stale = String(isStale(item));
      freshness.textContent = isStale(item) ?
        `${formatRelativeTime(item.updatedAt)} · Needs update` :
        formatRelativeTime(item.updatedAt);
      symbol.append(symbolValue, name, freshness);

      const actions = document.createElement("div");
      actions.className = "watchlist-card-actions";
      const saveButton = document.createElement("button");
      saveButton.type = "submit";
      saveButton.className = "button button-primary watchlist-icon-button";
      saveButton.title = `บันทึก ${item.symbol}`;
      saveButton.innerHTML = `
        <svg class="icon" aria-hidden="true"><use href="./assets/icons.svg#icon-save"></use></svg>
        <span class="sr-only">บันทึก ${item.symbol}</span>
      `;
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "button button-quiet watchlist-icon-button watchlist-delete";
      deleteButton.dataset.removeWatchlist = item.id;
      deleteButton.title = `ลบ ${item.symbol}`;
      deleteButton.innerHTML = `
        <svg class="icon" aria-hidden="true"><use href="./assets/icons.svg#icon-trash"></use></svg>
        <span class="sr-only">ลบ ${item.symbol}</span>
      `;
      actions.append(saveButton, deleteButton);
      header.append(symbol, actions);

      const context = document.createElement("div");
      context.className = "watchlist-context-grid";
      const biasSelect = createSelect(BIAS_OPTIONS, item.bias, "bias", item.symbol);
      const statusSelect = createSelect(STATUS_OPTIONS, item.status, "status", item.symbol);
      context.append(
        createField("HTF Bias", biasSelect),
        createField("Setup Status", statusSelect)
      );

      const details = document.createElement("div");
      details.className = "watchlist-detail-grid";
      const zone = createTextControl(
        "input",
        "currentZone",
        item.currentZone,
        "Current Zone",
        item.symbol
      );
      const nextCondition = createTextControl(
        "input",
        "nextCondition",
        item.nextCondition,
        "Waiting For",
        item.symbol
      );
      details.append(
        createField("Current Zone", zone),
        createField("Waiting For", nextCondition)
      );

      const note = createTextControl(
        "textarea",
        "reviewNote",
        item.reviewNote,
        "Last Review Note",
        item.symbol
      );
      const noteField = createField("Last Review Note", note);
      noteField.classList.add("watchlist-note");

      const footer = document.createElement("div");
      footer.className = "watchlist-card-footer";
      const statusPill = document.createElement("span");
      statusPill.className = "status-pill";
      statusPill.dataset.state = statusPillState(item.status);
      statusPill.textContent = STATUS_LABELS[item.status] || "Monitoring";
      const saveState = document.createElement("span");
      saveState.dataset.cardSaveState = item.id;
      saveState.textContent = "บันทึกไว้ในอุปกรณ์นี้";
      footer.append(statusPill, saveState);

      form.append(header, context, details, noteField, footer);
      return form;
    }

    function render() {
      const items = storage.loadWatchlist();
      const summary = summarize(items);
      const visible = filterItems(items, selectedFilter);
      document.getElementById("watchlistTracked").textContent = String(summary.total);
      document.getElementById("watchlistReady").textContent = String(summary.ready);
      document.getElementById("watchlistWaiting").textContent = String(summary.waiting);
      document.getElementById("watchlistStale").textContent = String(summary.stale);
      renderStatus(summary);

      grid.replaceChildren();
      visible.forEach((item) => grid.appendChild(renderCard(item)));
      const empty = document.getElementById("watchlistEmpty");
      empty.hidden = visible.length > 0;
      document.getElementById("watchlistEmptyTitle").textContent = summary.total ?
        "ไม่มี Pair ตรงกับตัวกรอง" : "ยังไม่มี Pair ใน Watchlist";
      document.getElementById("watchlistEmptyMessage").textContent = summary.total ?
        "เลือกตัวกรองอื่นเพื่อดูรายการที่เหลือ" :
        "เพิ่ม Symbol ด้านบนเพื่อเริ่มติดตาม Context";
    }

    document.getElementById("watchlistAddForm").addEventListener("submit", function (event) {
      event.preventDefault();
      const input = document.getElementById("watchlistSymbol");
      const item = storage.addWatchlistItem(input.value);
      const announcement = document.getElementById("watchlistSaveAnnouncement");
      if (!item) {
        announcement.textContent = "Symbol ไม่ถูกต้องหรือมีอยู่ใน Watchlist แล้ว";
        return;
      }
      input.value = "";
      selectedFilter = "all";
      document.querySelectorAll("[data-watch-filter]").forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.dataset.watchFilter === "all"));
      });
      announcement.textContent = `เพิ่ม ${item.symbol} แล้ว`;
      render();
    });

    grid.addEventListener("input", function (event) {
      const form = event.target.closest("[data-watchlist-id]");
      if (!form) return;
      const state = form.querySelector("[data-card-save-state]");
      state.textContent = "มีการแก้ไขที่ยังไม่บันทึก";
      state.dataset.state = "unsaved";
    });
    grid.addEventListener("submit", function (event) {
      event.preventDefault();
      const form = event.target.closest("[data-watchlist-id]");
      if (!form) return;
      const updated = storage.saveWatchlistItem(form.dataset.watchlistId, {
        bias: form.elements.bias.value,
        status: form.elements.status.value,
        currentZone: form.elements.currentZone.value,
        nextCondition: form.elements.nextCondition.value,
        reviewNote: form.elements.reviewNote.value
      });
      if (!updated) return;
      document.getElementById("watchlistSaveAnnouncement").textContent =
        `บันทึก ${updated.symbol} แล้ว`;
      render();
    });
    grid.addEventListener("click", function (event) {
      const button = event.target.closest("[data-remove-watchlist]");
      if (!button) return;
      const item = storage.loadWatchlist().find((candidate) => candidate.id === button.dataset.removeWatchlist);
      if (!item || !window.confirm(`ลบ ${item.symbol} ออกจาก Watchlist หรือไม่?`)) return;
      storage.removeWatchlistItem(item.id);
      document.getElementById("watchlistSaveAnnouncement").textContent =
        `ลบ ${item.symbol} แล้ว`;
      render();
    });
    document.querySelectorAll("[data-watch-filter]").forEach(function (button) {
      button.addEventListener("click", function () {
        selectedFilter = button.dataset.watchFilter;
        document.querySelectorAll("[data-watch-filter]").forEach(function (candidate) {
          candidate.setAttribute("aria-pressed", String(candidate === button));
        });
        render();
      });
    });
    window.addEventListener("storage", render);
    render();
  }

  window.TradingWatchlist = {
    STALE_AFTER_MS,
    BIAS_OPTIONS,
    STATUS_OPTIONS,
    STATUS_LABELS,
    isStale,
    statusGroup,
    summarize,
    filterItems,
    formatRelativeTime,
    statusPillState
  };

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", initializePage);
  }
})();

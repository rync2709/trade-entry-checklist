(function () {
  "use strict";

  const DB_NAME = "tradingCompanionMediaV1";
  const STORE_NAME = "screenshots";
  const MAX_FILE_SIZE = 8 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  function createError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function openDatabase() {
    if (!window.indexedDB) {
      return Promise.reject(createError(
        "unsupported",
        "อุปกรณ์นี้ไม่รองรับการเก็บ Screenshot"
      ));
    }

    return new Promise(function (resolve, reject) {
      const request = window.indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = function () {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: "tradeId" });
        }
      };

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        reject(request.error || createError("database", "เปิดพื้นที่เก็บรูปไม่สำเร็จ"));
      };
    });
  }

  function runRequest(mode, operation) {
    return openDatabase().then(function (database) {
      return new Promise(function (resolve, reject) {
        const transaction = database.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        let request;
        let result;

        try {
          request = operation(store);
        } catch (error) {
          database.close();
          reject(error);
          return;
        }

        request.onsuccess = function () {
          result = request.result;
        };

        request.onerror = function () {
          reject(request.error || createError("database", "จัดการไฟล์รูปไม่สำเร็จ"));
        };

        transaction.oncomplete = function () {
          database.close();
          resolve(result);
        };

        transaction.onerror = function () {
          database.close();
          reject(transaction.error || createError("database", "จัดการไฟล์รูปไม่สำเร็จ"));
        };

        transaction.onabort = function () {
          database.close();
          reject(transaction.error || createError("database", "การบันทึกรูปถูกยกเลิก"));
        };
      });
    });
  }

  function validateScreenshot(file) {
    if (!file || typeof file !== "object") {
      throw createError("missing-file", "ไม่พบไฟล์รูป");
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw createError("invalid-type", "รองรับเฉพาะไฟล์ PNG, JPG และ WEBP");
    }
    if (!Number.isFinite(file.size) || file.size <= 0) {
      throw createError("empty-file", "ไฟล์รูปไม่มีข้อมูล");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw createError("file-too-large", "ไฟล์รูปต้องมีขนาดไม่เกิน 8 MB");
    }
  }

  function toMetadata(entry) {
    if (!entry) return null;
    return {
      name: entry.name,
      type: entry.type,
      size: entry.size,
      updatedAt: entry.updatedAt
    };
  }

  async function saveScreenshot(tradeId, file) {
    if (!tradeId) throw createError("missing-trade", "ไม่พบ Trade ที่ต้องการบันทึกรูป");
    validateScreenshot(file);

    const entry = {
      tradeId: String(tradeId),
      blob: file,
      name: typeof file.name === "string" && file.name ? file.name.slice(0, 180) : "screenshot",
      type: file.type,
      size: file.size,
      updatedAt: new Date().toISOString()
    };

    await runRequest("readwrite", function (store) {
      return store.put(entry);
    });
    return toMetadata(entry);
  }

  async function loadScreenshot(tradeId) {
    if (!tradeId) return null;
    const entry = await runRequest("readonly", function (store) {
      return store.get(String(tradeId));
    });
    if (!entry || !(entry.blob instanceof Blob)) return null;
    return {
      ...toMetadata(entry),
      blob: entry.blob
    };
  }

  async function deleteScreenshot(tradeId) {
    if (!tradeId) return false;
    await runRequest("readwrite", function (store) {
      return store.delete(String(tradeId));
    });
    return true;
  }

  window.TradingMedia = {
    DB_NAME,
    STORE_NAME,
    MAX_FILE_SIZE,
    ALLOWED_TYPES,
    validateScreenshot,
    saveScreenshot,
    loadScreenshot,
    deleteScreenshot
  };
})();

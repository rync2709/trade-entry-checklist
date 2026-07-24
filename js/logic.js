(function () {
  "use strict";

  const STEPS = [
    {
      id: "htf",
      label: "HTF",
      required: ["htfNarrative", "htfAligned", "priceLocation"]
    },
    {
      id: "poi",
      label: "POI",
      required: ["poiPresent", "poiReached", "poiValid", "notChasing"]
    },
    {
      id: "setup",
      label: "Setup",
      required: ["ltfMapped", "liquidityTarget"]
    },
    {
      id: "confirm",
      label: "Confirm",
      required: ["sweep", "structureShift", "cisd", "setupWindow"]
    },
    {
      id: "entry",
      label: "Entry",
      required: [
        "displacement",
        "displacementClean",
        "validFvg",
        "retrace",
        "entryTrigger",
        "slValid",
        "rrValid",
        "emotionalClear"
      ]
    }
  ];

  const NEXT_ACTIONS = [
    ["direction", "เลือกทิศทางของแผน"],
    ["htfNarrative", "ระบุ HTF Narrative ให้ชัดเจน"],
    ["htfAligned", "ตรวจสอบว่า 4H และ 1H สอดคล้องกัน"],
    ["priceLocation", "รอให้ราคาอยู่ในตำแหน่งที่สนับสนุนแผน"],
    ["poiPresent", "กำหนด HTF POI"],
    ["poiReached", "WAIT FOR HTF POI"],
    ["poiValid", "ตรวจสอบว่า POI ยังไม่ถูก Invalidate"],
    ["notChasing", "รอ Pullback และอย่าไล่ราคา"],
    ["setupType", "เลือก Setup Type: Reversal หรือ Continuation"],
    ["ltfMapped", "กำหนด LTF Structure"],
    ["liquidityTarget", "ระบุ Liquidity Target"],
    ["sweep", "WAIT FOR LIQUIDITY SWEEP"],
    ["structureShift", "WAIT FOR STRUCTURE CONFIRMATION"],
    ["cisd", "WAIT FOR CISD"],
    ["setupWindow", "ยืนยันว่าเหตุการณ์อยู่ใน Setup Window เดียวกัน"],
    ["displacement", "WAIT FOR DISPLACEMENT"],
    ["displacementClean", "ตรวจสอบ Follow-through ของ Displacement"],
    ["validFvg", "WAIT FOR VALID FVG"],
    ["retrace", "WAIT FOR RETRACE"],
    ["entryTrigger", "WAIT FOR ENTRY TRIGGER"],
    ["slValid", "กำหนด Stop Loss ที่จุด Invalidation"],
    ["rrValid", "ตรวจสอบ RR ขั้นต่ำ"],
    ["emotionalClear", "ทบทวนสภาวะอารมณ์ก่อนเข้าเทรด"]
  ];

  const BLOCKER_RULES = [
    ["direction", "neutral", "HTF ยังไม่มีทิศทางที่ชัดเจน"],
    ["htfAligned", "no", "4H และ 1H ขัดแย้งกัน"],
    ["priceLocation", "no", "ราคาอยู่กลาง Range หรือผิดตำแหน่ง"],
    ["poiValid", "no", "POI ถูก Invalidate แล้ว"],
    ["notChasing", "no", "กำลังไล่ราคาหลัง Move เกิดขึ้นแล้ว"],
    ["setupWindow", "no", "Confirmation ไม่ได้อยู่ใน Setup เดียวกัน"],
    ["displacementClean", "no", "Displacement ไม่มี Follow-through"],
    ["slValid", "no", "Stop Loss ไม่ได้อยู่ที่จุด Invalidation"],
    ["rrValid", "no", "RR ต่ำกว่าเกณฑ์ของแผน"],
    ["emotionalClear", "no", "มี FOMO, Revenge Trade หรือกำลังฝืนเข้าเทรด"]
  ];

  function answer(draft, key) {
    if (key === "direction") return draft.direction || "";
    if (key === "setupType") return draft.setupType || "";
    return (draft.answers && draft.answers[key]) || "";
  }

  function isYes(draft, key) {
    return answer(draft, key) === "yes";
  }

  function fraction(draft, keys) {
    if (!keys.length) return 0;
    const complete = keys.filter((key) => isYes(draft, key)).length;
    return complete / keys.length;
  }

  function calculateScore(draft) {
    const htfDirection = draft.direction && draft.direction !== "neutral" ? 1 : 0;
    const htfChecks = fraction(draft, ["htfNarrative", "htfAligned", "priceLocation"]);
    const htf = ((htfDirection + htfChecks * 3) / 4) * 20;
    const poi = fraction(draft, ["poiPresent", "poiReached", "poiValid", "notChasing"]) * 15;
    const liquidity = fraction(draft, ["liquidityTarget", "sweep"]) * 15;
    const structure = fraction(draft, ["ltfMapped", "structureShift", "setupWindow"]) * 15;
    const cisd = fraction(draft, ["cisd"]) * 15;
    const displacement = fraction(draft, ["displacement", "displacementClean"]) * 10;
    const fvg = fraction(draft, ["validFvg", "retrace"]) * 5;
    const risk = fraction(draft, ["entryTrigger", "slValid", "rrValid", "emotionalClear"]) * 5;
    return Math.round(htf + poi + liquidity + structure + cisd + displacement + fvg + risk);
  }

  function getBlockers(draft) {
    return BLOCKER_RULES
      .filter(([key, blockedValue]) => answer(draft, key) === blockedValue)
      .map(([, , message]) => message);
  }

  function isStepComplete(draft, index) {
    const step = STEPS[index];
    if (!step) return false;
    if (index === 0 && (!draft.direction || draft.direction === "neutral")) return false;
    if (index === 2 && !draft.setupType) return false;
    return step.required.every((key) => isYes(draft, key));
  }

  function getProgress(draft) {
    const conditionKeys = STEPS.flatMap((step) => step.required);
    const complete = conditionKeys.filter((key) => isYes(draft, key)).length +
      (draft.direction && draft.direction !== "neutral" ? 1 : 0) +
      (draft.setupType ? 1 : 0);
    const total = conditionKeys.length + 2;
    return {
      complete,
      total,
      percent: Math.round((complete / total) * 100)
    };
  }

  function getNextAction(draft, blockers) {
    if (blockers.length) return `NO TRADE: ${blockers[0]}`;
    for (const [key, message] of NEXT_ACTIONS) {
      if (key === "direction") {
        if (!draft.direction) return message;
      } else if (key === "setupType") {
        if (!draft.setupType) return message;
      } else if (!isYes(draft, key)) {
        return message;
      }
    }
    return "REVIEW RISK AND EXECUTE YOUR PLAN";
  }

  function getGrade(score, state) {
    if (state === "no-trade") return "NO TRADE";
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    return "--";
  }

  function evaluateTradePlan(draft) {
    const plan = draft.tradePlan || {};
    const entry = Number(plan.entry);
    const stopLoss = Number(plan.stopLoss);
    const takeProfit = Number(plan.takeProfit);
    const complete = [entry, stopLoss, takeProfit].every(Number.isFinite) &&
      entry > 0 && stopLoss > 0 && takeProfit > 0;

    if (!complete) {
      return {
        complete: false,
        valid: false,
        rr: null,
        message: "กรอก Entry, Stop Loss และ Take Profit ให้ครบ"
      };
    }

    const risk = Math.abs(entry - stopLoss);
    const reward = draft.direction === "bullish" ?
      takeProfit - entry :
      draft.direction === "bearish" ? entry - takeProfit : 0;
    const stopIsValid = draft.direction === "bullish" ?
      stopLoss < entry :
      draft.direction === "bearish" ? stopLoss > entry : false;
    const targetIsValid = reward > 0;
    const rr = risk > 0 && reward > 0 ? reward / risk : null;

    if (!stopIsValid || !targetIsValid || !rr) {
      return {
        complete: true,
        valid: false,
        rr: null,
        message: "ตำแหน่ง Entry, SL และ TP ไม่สอดคล้องกับ Trade Direction"
      };
    }

    return {
      complete: true,
      valid: true,
      rr: Math.round(rr * 100) / 100,
      message: `Planned RR 1:${(Math.round(rr * 100) / 100).toFixed(2)}`
    };
  }

  function evaluate(draft) {
    const score = calculateScore(draft);
    const blockers = getBlockers(draft);
    const progress = getProgress(draft);
    const allStepsComplete = STEPS.every((_, index) => isStepComplete(draft, index));
    let state = "waiting";

    if (blockers.length) {
      state = "no-trade";
    } else if (allStepsComplete) {
      state = "ready";
    } else if (progress.complete >= 5 || score >= 25) {
      state = "developing";
    }

    const grade = getGrade(score, state);
    return {
      state,
      stateLabel: {
        waiting: "WAITING FOR SETUP",
        developing: "SETUP DEVELOPING",
        ready: "READY TO ENTER",
        "no-trade": "NO TRADE"
      }[state],
      score,
      grade,
      blockers,
      progress,
      nextAction: getNextAction(draft, blockers),
      steps: STEPS.map((step, index) => ({
        ...step,
        complete: isStepComplete(draft, index)
      }))
    };
  }

  window.TradingLogic = {
    STEPS,
    evaluate,
    evaluateTradePlan,
    isStepComplete
  };
})();

# Trading OS Rulebook

Version: v0.1.2
Phase: 1 - Core Trading App

## Purpose

Trading OS is a decision support system for ICT/SMC trade setups. It is not a random buy/sell signal generator. The system validates whether a setup has enough context, confirmation, and risk quality before a trader considers execution.

The current Trade Entry Checklist is the first manual version of this rulebook.

## Core Philosophy

1. HTF context defines the trading idea.
2. POI defines where the idea is valid.
3. Liquidity and structure confirm whether price is reacting correctly.
4. CISD, displacement, and FVG refine execution timing.
5. No confirmation means no trade.
6. The system should reduce overtrading, not create more signals.

## Timeframe Model

| Timeframe | Role |
| --- | --- |
| 4H | Primary HTF narrative and major POI |
| 1H | Secondary HTF context and refinement |
| 15M | Execution context |
| 5M | Precision entry and trigger refinement |

15M and 5M should not override 4H or 1H bias. They are used to confirm or execute a setup already supported by HTF context.

## Trading Flow

```text
HTF Bias
-> HTF POI
-> Price reaches POI
-> LTF context
-> Liquidity event
-> MSS/CHOCH or BOS
-> CISD
-> Displacement
-> FVG / Entry Zone
-> Entry Decision
-> Risk Review
```

The order can be flexible inside the confirmation window, but all events must belong to the same setup idea.

## Trade States

| State | Meaning |
| --- | --- |
| NO TRADE | Context is invalid, missing, or too weak |
| WAITING FOR SETUP | HTF context may exist but setup is not active |
| SETUP DEVELOPING | Some confirmations are present but entry is not ready |
| READY TO ENTER | Core setup conditions are complete and risk is acceptable |

## Rule 1 - HTF Context

A valid setup starts with clear HTF narrative.

Required checks:

- 4H or 1H bias can be described clearly.
- Bullish, bearish, or neutral context is known.
- Price location supports the intended direction.
- There is a clear HTF POI such as FVG, OB, or liquidity area.

A setup without HTF context should remain in NO TRADE or WAITING FOR SETUP.

## Rule 2 - POI

A POI is valid only when price is close enough to the planned area and the area has not been invalidated.

Supported POI types:

- HTF FVG
- Order Block
- Breaker or mitigation area
- Liquidity area
- Premium/discount zone

Invalid POI conditions:

- Price has moved too far away from the POI.
- POI has been fully invalidated.
- Trade idea is being forced after the move already happened.

## Rule 3 - LTF Context

Before execution, the trader must identify the lower timeframe structure and classify the setup.

Setup types:

- Reversal: price reacts from a POI and shifts direction.
- Continuation: price keeps moving with HTF bias after a valid pullback.

LTF context should identify the prior structure, liquidity, and setup window.

## Rule 4 - Liquidity

Liquidity should support the trade direction.

Liquidity examples:

- Asia high or Asia low
- Previous day high or previous day low
- Equal highs or equal lows
- Internal liquidity
- External liquidity

A sweep or raid has more value when it occurs near the POI and inside the same setup window.

## Rule 5 - Structure Confirmation

The structure confirmation depends on setup type.

| Setup Type | Required Structure |
| --- | --- |
| Reversal | MSS or CHOCH toward trade direction |
| Continuation | BOS toward trade direction |

Structure signals away from the POI or outside the setup window should be treated as lower quality.

## Rule 6 - CISD

CISD is a key confirmation event. It should support the trade direction and appear inside the setup window.

A strong CISD should have:

- Context from HTF or POI.
- Liquidity or structure event nearby.
- Direction aligned with the trade idea.
- Follow-through or displacement after the shift.

CISD alone is not enough for A+ quality.

## Rule 7 - Displacement

Displacement confirms that price is moving with intent.

A valid displacement should:

- Move in the same direction as CISD and the trade idea.
- Show strong body or range expansion.
- Create follow-through beyond local structure.
- Avoid being only a news spike or isolated wick.

Weak displacement reduces setup quality.

## Rule 8 - FVG / Entry Zone

Only FVGs created by valid displacement should be considered for entry.

FVG status:

- Fresh: unfilled and valid.
- Partial Fill: mitigated but still usable if structure holds.
- Filled: no longer an ideal entry zone.
- Invalid: broken or no longer aligned with setup context.

The best entry zone is tied to the same confirmation window as the setup.

## Rule 9 - Entry Decision

A setup is ready only when the core entry checks are complete.

Required checks:

- Entry trigger appears on execution timeframe.
- Stop loss is placed where the setup is truly invalidated.
- Risk/reward passes the minimum plan requirement.
- Entry is not driven by FOMO, revenge trade, or forcing a trade.

## Rule 10 - Reversal Setup

A high quality reversal should include:

- HTF POI
- Liquidity sweep or raid
- MSS or CHOCH
- CISD
- Displacement
- Valid FVG or entry zone
- Acceptable RR

Missing one or more of these conditions reduces the grade.

## Rule 11 - Continuation Setup

A continuation setup can be valid when:

- HTF bias remains clear.
- Market has already shifted or trended in the intended direction.
- Price pulls back into a valid LTF POI or FVG.
- BOS or continuation structure supports the direction.
- Entry is not taken in the middle of a move without pullback.

## Rule 12 - Invalidation

The system should identify when not to trade.

Common invalidation reasons:

- Price is in the middle of a range.
- 4H and 1H context conflict.
- No clear liquidity target exists.
- POI is already invalidated.
- RR is below the minimum threshold.
- Setup events are too far apart and no longer part of one idea.

## Rule 13 - Confidence Score

The web app converts checklist quality into a score from 0 to 100 using the
versioned `score-v1` profile.

Initial grade model:

| Score | Grade | Action |
| ---: | :---: | --- |
| 90-100 | A+ | Execute only after final risk review |
| 80-89 | A | High confidence |
| 70-79 | B | Conservative or reduced size |
| 60-69 | C | Watchlist only |
| Below 60 | D | Skip |

The current weights are the first implementation baseline. A final grade is
shown only when the setup reaches READY TO ENTER. Before that point the score
shows setup maturity, while the grade remains pending. New trade records store
their score profile and category breakdown so the weights can be calibrated
against real outcomes before Pine Script automation.

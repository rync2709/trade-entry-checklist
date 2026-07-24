# Trading OS Indicator Specification

Version: v0.1.2
Phase: 1 - Core Trading App

## Purpose

This document converts the Trading OS rulebook into module-level requirements for future automation. The current checklist remains manual. Pine Script implementation starts only after the rules and module outputs are clear.

## Design Principles

- The indicator should support decisions, not blindly call buy or sell.
- Every signal must be explainable by a rulebook condition.
- Modules should produce states that can be shown in the web checklist and reused in Pine Script.
- Missing confirmation should return WAIT or NO TRADE, not force a signal.

## State Model

| State | Description |
| --- | --- |
| NO_TRADE | Invalid context or blocked setup |
| WAITING | Setup not active yet |
| DEVELOPING | Conditions are forming but incomplete |
| READY | Required conditions and risk checks are complete |

## Direction Model

| Direction | Description |
| --- | --- |
| BULLISH | Long-side idea |
| BEARISH | Short-side idea |
| NEUTRAL | No clear directional edge |

## Module 1 - HTF Bias

Input:

- 4H structure
- 1H structure
- Swing highs and lows
- Premium/discount context
- Recent displacement direction

Process:

- Identify whether 4H and 1H support bullish, bearish, or neutral context.
- Flag conflict when 4H and 1H are not aligned.
- Do not allow LTF signals to override HTF context.

Output:

- bias: BULLISH, BEARISH, or NEUTRAL
- confidence: low, medium, or high
- conflict: true or false

## Module 2 - HTF POI

Input:

- HTF FVG zones
- Order blocks
- Breaker or mitigation zones
- Liquidity areas
- Premium/discount zones
- Current price

Process:

- Detect whether price is inside or near a planned POI.
- Mark whether the POI is fresh, mitigated, or invalid.
- Check whether the POI supports the selected trade direction.

Output:

- poi_active: true or false
- poi_type: FVG, OB, BREAKER, LIQUIDITY, PREMIUM_DISCOUNT, or NONE
- poi_status: FRESH, PARTIAL, FILLED, INVALID, or NONE

## Module 3 - LTF Context

Input:

- Execution timeframe structure
- Selected setup mode: reversal or continuation
- Local swing points
- Current setup window

Process:

- Determine whether the setup is reversal or continuation.
- Identify local structure and relevant liquidity.
- Confirm the setup is happening inside one active context window.

Output:

- setup_type: REVERSAL or CONTINUATION
- ltf_context_valid: true or false
- setup_window_active: true or false

## Module 4 - Liquidity

Input:

- Asia high and low
- Previous day high and low
- Equal highs and equal lows
- Internal and external liquidity levels
- Current high and low

Process:

- Detect sweep or raid events.
- Classify liquidity as internal or external.
- Check whether the sweep supports trade direction.

Output:

- liquidity_swept: true or false
- liquidity_type: INTERNAL, EXTERNAL, SESSION, DAILY, EQUAL_LEVEL, or NONE
- sweep_direction: BULLISH, BEARISH, or NEUTRAL

## Module 5 - Structure

Input:

- LTF swing structure
- Prior highs and lows
- Setup type
- Current close

Process:

- For reversal, detect MSS or CHOCH toward trade direction.
- For continuation, detect BOS toward trade direction.
- Reject structure signals outside the setup window.

Output:

- structure_event: MSS, CHOCH, BOS, or NONE
- structure_direction: BULLISH, BEARISH, or NEUTRAL
- structure_valid: true or false

## Module 6 - CISD

Input:

- Candle open and close
- Prior candle ranges
- Local dealing range
- Structure and liquidity events

Process:

- Detect bullish or bearish CISD.
- Check proximity to sweep, POI, or structure event.
- Confirm alignment with trade direction.

Output:

- cisd_event: BULLISH, BEARISH, or NONE
- cisd_valid: true or false
- cisd_quality: weak, medium, or strong

## Module 7 - Displacement

Input:

- Candle body size
- Candle range
- ATR or average range
- Close relative to structure
- Follow-through candles

Process:

- Measure whether movement is stronger than recent average.
- Check whether displacement closes beyond relevant structure.
- Reject isolated wick or news-spike behavior when no follow-through exists.

Output:

- displacement_valid: true or false
- displacement_direction: BULLISH, BEARISH, or NEUTRAL
- displacement_quality: weak, medium, or strong

## Module 8 - FVG / Entry Zone

Input:

- Displacement candles
- Three-candle imbalance logic
- Retracement into imbalance
- Mitigation status

Process:

- Detect FVG created by valid displacement.
- Track fresh, partial, filled, or invalid status.
- Confirm whether price retraces into the entry zone.

Output:

- fvg_present: true or false
- fvg_status: FRESH, PARTIAL, FILLED, INVALID, or NONE
- entry_zone_active: true or false

## Module 9 - Risk / Entry Decision

Input:

- Entry trigger
- Stop loss level
- Invalidation level
- Target level
- Risk/reward ratio
- Trader checklist confirmation

Process:

- Confirm entry trigger on execution timeframe.
- Confirm SL represents true invalidation.
- Confirm RR passes minimum requirement.
- Block entries marked as emotional or forced.

Output:

- entry_ready: true or false
- rr_valid: true or false
- final_state: NO_TRADE, WAITING, DEVELOPING, or READY

## Module 10 - Score Engine

Input:

- Outputs from all prior modules
- Setup type
- Direction
- Risk checks

Process:

- Assign weights to each required condition.
- Penalize conflicts, invalidation, weak displacement, or missing confirmation.
- Convert numeric score into grade.

Initial scoring draft:

| Condition | Weight |
| --- | ---: |
| HTF context | 20 |
| POI | 15 |
| Liquidity | 15 |
| Structure | 15 |
| CISD | 15 |
| Displacement | 10 |
| FVG / Entry Zone | 5 |
| RR / Risk | 5 |

Current web profile: `score-v1`

The score is calculated continuously, but the grade remains pending until the
setup reaches READY. Every saved assessment includes the profile name and
category breakdown so future calibration does not mix records produced by
different formulas.

Output:

- score: 0 to 100
- grade: A+, A, B, C, or D
- final_state: NO_TRADE, WAITING, DEVELOPING, or READY

## Current Checklist Mapping

| Checklist Section | Future Module |
| --- | --- |
| HTF Context - 4H / 1H | HTF Bias, HTF POI |
| Price reaches POI | HTF POI |
| LTF Context | LTF Context |
| Confirmation Events | Liquidity, Structure, CISD |
| Displacement Confirmation | Displacement |
| FVG / Entry Zone | FVG / Entry Zone |
| Entry Decision | Risk / Entry Decision |
| Trade Notes | Journal / Review, future phase |

## Phase 0 Decision

No automation is implemented yet. This document defines the target behavior for future Pine Script and web-app refactors.

# Trading OS Master Roadmap

Version: v0.3.1
Status: Master product roadmap

## Product Direction

Trading OS will evolve from the current Trade Entry Checklist into a full trading companion app.

The main product track is the web app. Pine Script and TradingView integration are supporting tracks that should connect to the same rulebook and decision logic over time.

## Phase 0 - Foundation

Goal: prepare the project for long-term development.

Tasks:

- [x] Create GitHub repository
- [x] Set up GitHub Pages
- [x] Create installable PWA baseline
- [x] Create initial project structure
- [x] Add documentation structure
- [x] Add versioning and changelog
- [x] Define Trading OS as the product direction

Result:

- Existing checklist is online.
- Repository is ready for structured development.
- Phase 0 documents exist under `docs/`.

Current repository:

```text
Trading-Companion/
```

Future product name:

```text
Trading OS
```

## Phase 1 - Core Trading App

Goal: replace the manual checklist with a guided trading workflow.

Priority: highest.

Status: In progress.

First milestone:

- [x] Create the core dashboard.
- [x] Create the five-step New Trade Wizard.
- [x] Add automatic local draft saving.
- [x] Add initial smart states: WAITING, DEVELOPING, READY, and NO TRADE.
- [x] Add initial score, grade, and blocking-reason logic.
- [x] Preserve the original checklist as the Classic Checklist.
- [x] Update the PWA shell and offline cache for Phase 1 pages.
- [x] Add WAIT, SKIP, and ENTERED lifecycle decisions.
- [x] Add Entry, Stop Loss, Take Profit, and Planned RR.
- [x] Add open-position tracking and close outcomes.
- [x] Add the initial lifecycle record for the Phase 2 journal handoff.
- [x] Add an explainable category breakdown and score profile to saved records.
- [x] Add Phase 1 validation progress and post-SKIP verdicts.
- [ ] Calibrate scoring weights against real trade examples.
- [ ] Validate the workflow through repeated real-use sessions.

### Dashboard

Expected widgets:

- Today's trades
- Win rate
- Current session
- Open position
- A+ setup status

### New Trade Wizard

The app should guide a trader step by step:

```text
Step 1: HTF Narrative
-> Step 2: POI
-> Step 3: Reversal / Continuation
-> Step 4: Confirmation
-> Step 5: Entry
-> Execute
```

### Smart Status

The app should know which stage the setup is currently in and show the next required action.

Example flow:

```text
WAIT FOR HTF POI
-> WAIT FOR BOS
-> WAIT FOR CISD
-> WAIT FOR DISPLACEMENT
-> WAIT FOR FVG
-> WAIT FOR RETRACE
-> READY TO ENTER
```

### Grade

Supported setup grades:

- A+
- A
- B
- NO TRADE

### Journal

After entry, the trade should be stored in the journal.

Phase 1 target:

- The app can be used instead of the current static checklist.

## Phase 2 - Trade Journal

Goal: record trade context, trade quality, and mistakes.

Status: In progress.

First milestone:

- [x] Create a Journal page for assessments marked `ENTERED`.
- [x] Show Open and Closed trades in one history.
- [x] Add All, Open, and Closed filters.
- [x] Add Emotion, Mistakes, Lesson, and TradingView link fields.
- [x] Preserve compatibility with existing Phase 1 lifecycle records.
- [x] Keep journal data local to the current browser.
- [x] Add local Screenshot upload, preview, full-size view, replacement, and removal.
- [x] Add Actual Exit, automatic Realized RR, Close Note, and Holding Time.
- [ ] Validate post-trade review fields through repeated real use.

Journal fields:

- Screenshot
- TradingView link
- Emotion
- Mistake
- Lesson
- Actual Exit
- Realized RR
- Close Note
- Holding Time
- Pair
- Session
- Setup type

Emotion examples:

- Calm
- Neutral
- Angry
- Fearful
- Overconfident

Mistake examples:

- FOMO
- Late entry
- No HTF context
- Ignored CISD
- Ignored displacement

Pair examples:

- BTC
- ETH
- XAU
- NASDAQ

Session examples:

- Asia
- London
- New York

Setup examples:

- Reversal
- Continuation

## Phase 3 - Statistics

Goal: turn journal data into useful performance feedback.

Status: In progress.

First milestone:

- [x] Add 30-day, 90-day, and all-time statistics ranges.
- [x] Add Closed Trades, Win Rate, Average RR, Expectancy, Average Hold, and R Coverage.
- [x] Add an Equity Curve based on cumulative Realized R.
- [x] Add Win, Loss, and Break Even distribution.
- [x] Add Session and Setup performance breakdowns.
- [x] Keep incomplete Actual Exit data visible without treating it as zero R.
- [x] Add the monthly performance calendar.
- [ ] Validate statistics against a larger real-trade sample.

Dashboard metrics:

- Total trades
- Win rate
- Average RR
- Expectancy
- Average hold time

Charts:

- Equity curve
- Calendar view
- Win/loss distribution
- Session performance
- Setup performance

Calendar states:

- Winning day
- Losing day
- Break-even or no-trade day

## Phase 4 - Trade Database

Goal: make every past trade searchable and reusable as study material.

Search filters:

- Pair
- Setup type
- Session
- Grade
- Date range
- Mistake
- Result

Example searches:

- BTC reversal London A+
- XAU continuation New York
- Trades with FOMO mistakes

Expected result:

- The trader can quickly review all similar trades and study patterns.

## Phase 5 - Weekly Review

Goal: help the trader review performance every week.

Weekly review summary:

- Trades
- Wins
- Losses
- Win rate
- Average RR
- Expectancy

Mistake summary examples:

- Ignored HTF
- Late entry
- FOMO
- Ignored CISD
- Ignored displacement

Strength summary examples:

- Excellent patience
- Excellent risk management
- Strong setup filtering
- Good session discipline

Expected behavior:

- The app asks the trader to review the week.
- The review turns journal data into lessons and action points.

## Phase 6 - Session Planner

Goal: plan the trading day before the market opens.

Planned fields:

- Today's bias
- London plan
- New York plan
- Key POIs
- Liquidity targets
- News or no-trade warnings

Example:

```text
Today's Bias: Bullish
London Plan: Wait for pullback into HTF POI
New York Plan: Only trade after liquidity sweep and CISD
```

## Phase 7 - Watchlist

Goal: track multiple instruments and setup states.

Planned assets:

- BTC
- ETH
- SOL
- Gold
- NASDAQ

For each asset, show:

- HTF bias
- Current zone
- Waiting state
- Ready state
- Last review note

## Phase 8 - Advanced Tools

Goal: add practical trading calculators and utilities.

Planned tools:

- RR calculator
- Risk calculator
- Position size calculator
- Currency converter
- Session timer

## Phase 9 - AI Decision Assistant

Goal: create a guided assistant that challenges weak trade ideas.

Example interaction:

```text
Trader: Should I trade?
App: What is the HTF context?
App: Is price inside POI?
App: Is there CISD?
App: Is there displacement?
App: Is there a valid FVG?
```

Possible outputs:

- NO TRADE
- WAIT
- A
- A+
- READY

Important rule:

- AI should ask for missing context instead of giving random trade calls.

## Phase 10 - TradingView Integration

Goal: connect Trading OS with TradingView in ways that are realistic for a web app.

Supported scope:

- Import screenshots
- Open chart links
- Attach trade ideas
- Export journal as PDF
- Export journal as CSV

Constraint:

- Direct TradingView data access has platform limitations. Integration should be designed around supported workflows.

## Decision Engine

Goal: move beyond static checkboxes.

The app should understand the setup sequence:

```text
HTF
-> POI
-> Reversal / Continuation
-> MSS / BOS
-> CISD
-> Displacement
-> FVG
-> Retrace
```

Expected output:

- Current step
- Next step
- Blocking reason
- Setup grade
- Final trade state

Example:

```text
Next Step: WAIT FOR DISPLACEMENT
```

## Playbook Library

Goal: turn repeated trading experience into a personal knowledge base.

Planned playbooks:

- A+ Reversal
- A Continuation
- New York Open Sweep
- London Reversal
- Asian Liquidity Raid

Each playbook should include:

- Example image
- Rules
- Invalidation rules
- Checklist
- Winning examples
- Losing examples
- Lessons from personal trades

Expected long-term value:

- Trading OS becomes a knowledge base built from the trader's own experience, not just a checklist.

## Future Project Structure

Target structure for the larger app:

```text
Trading-Companion/
|-- index.html
|-- trade.html
|-- journal.html
|-- stats.html
|-- review.html
|-- settings.html
|-- css/
|   |-- style.css
|   |-- dashboard.css
|   `-- wizard.css
|-- js/
|   |-- app.js
|   |-- trade.js
|   |-- dashboard.js
|   |-- journal.js
|   |-- stats.js
|   |-- storage.js
|   |-- grade.js
|   `-- logic.js
|-- assets/
|-- icons/
|-- data/
|-- manifest.json
|-- sw.js
`-- README.md
```

This structure is a future target. It should not be forced into the current repository until Phase 1 begins.

## Parallel Track - Pine Script Indicator

The Pine Script indicator is still important, but it should support the web app instead of replacing it.

Planned modules:

- HTF Bias
- HTF POI
- Liquidity
- Structure: MSS, CHOCH, BOS
- CISD
- Displacement
- FVG / Entry Zone
- Score Engine
- Alert System

Expected outputs:

- Bias
- POI status
- Setup state
- Score
- Grade
- Entry readiness
- Alert events

## Version Targets

| Version | Target |
| --- | --- |
| v0.0.1-alpha | Phase 0 documentation baseline |
| v0.0.2-alpha | Master product roadmap |
| v0.1.0 | Core dashboard and new trade wizard draft |
| v0.1.1 | Trade lifecycle and open-position tracking |
| v0.2.0 | Decision engine and grading draft |
| v0.3.0 | Trade journal |
| v0.4.0 | Statistics dashboard |
| v0.5.0 | Trade database and filters |
| v0.6.0 | Weekly review |
| v0.7.0 | Session planner and watchlist |
| v0.8.0 | Advanced tools |
| v0.9.0 | AI decision assistant prototype |
| v1.0.0 | Trading OS MVP |

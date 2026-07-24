# Trading OS Master Roadmap

Version: v0.8.3
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
- [x] Add permanent deletion for saved NO TRADE and SKIP assessments.
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
- [x] Add permanent Trade deletion with confirmation and Screenshot cleanup.
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

Status: In progress.

First milestone:

- [x] Add a database for every assessment marked `ENTERED`.
- [x] Add token search across trade context and review text.
- [x] Add Pair, Setup, Session, Grade, Result, Mistake, and date-range filters.
- [x] Add newest, oldest, highest-R, and lowest-R sorting.
- [x] Add database result summaries and clear empty states.
- [x] Link each result to the matching Journal review.
- [ ] Validate search terms and filters against a larger real-trade sample.

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

Status: In progress.

First milestone:

- [x] Add Monday-to-Sunday review navigation using Asia/Bangkok close dates.
- [x] Add Closed Trades, Win Rate, Net R, Expectancy, Average RR, and R Coverage.
- [x] Add a seven-day result strip with explicit incomplete-R states.
- [x] Aggregate recorded Journal mistakes for the selected week.
- [x] Generate evidence-based Strengths and Focus Areas.
- [x] Save strengths, improvements, and next-week focus per week.
- [x] Add a current-week review reminder to the Dashboard.
- [x] Add a scalable mobile More menu for secondary product areas.
- [ ] Validate weekly insights against a larger real-trade sample.

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

Status: In progress.

First milestone:

- [x] Save a separate Session Plan for each Asia/Bangkok calendar date.
- [x] Add Bullish, Bearish, and Neutral daily bias.
- [x] Add HTF Narrative, Key POIs, and Liquidity Targets.
- [x] Add separate London and New York execution plans.
- [x] Add News Status, News Note, and No Trade Conditions.
- [x] Add an explainable seven-item readiness checklist.
- [x] Add PLAN EMPTY, PLAN DRAFT, and PLAN READY states.
- [x] Preview the relevant Session Plan using Bangkok time.
- [x] Add current-day plan status to the Dashboard.
- [ ] Validate the Session Planner through repeated pre-market use.

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

Status: In progress.

First milestone:

- [x] Start with Gold, Bitcoin, Ethereum, Solana, and Nasdaq.
- [x] Add, edit, and remove Watchlist symbols.
- [x] Track HTF Bias, Setup Status, Current Zone, Waiting For, and Last Review Note.
- [x] Filter Ready, Waiting, No Trade, and Needs Update states.
- [x] Warn when Context is missing or older than 24 hours.
- [x] Add fresh Watchlist status to the Dashboard.
- [x] Keep Watchlist data manual until a supported market-data integration is designed.
- [ ] Validate the Watchlist through repeated session preparation.

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

Status: In progress.

First milestone:

- [x] Add a direction-aware RR Calculator.
- [x] Show risk distance, reward distance, and break-even win rate.
- [x] Add Risk Amount and Position Size calculations.
- [x] Support configurable value per 1.0 price move.
- [x] Add a Currency Converter with automatic daily fiat reference rates.
- [x] Show the reference source and date with a manual-rate fallback.
- [x] Add currency swap and a Google verification link.
- [x] Add a fixed Asia/Bangkok Session Timer and next-session countdown.
- [x] Validate incomplete, invalid, and directionally incorrect inputs.
- [x] Keep all calculations local and warn about broker contract specifications.
- [ ] Validate calculator outputs against the instruments and broker contracts used in practice.

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
| v0.2.0 | Trade journal |
| v0.3.0 | Statistics dashboard |
| v0.4.0 | Trade database and filters |
| v0.5.0 | Weekly review |
| v0.6.0 | Session planner |
| v0.7.0 | Watchlist |
| v0.8.0 | Advanced tools |
| v0.8.1 | Automatic fiat reference rates |
| v0.8.2 | Journal trade deletion |
| v0.8.3 | NO TRADE and SKIP assessment deletion |
| v0.9.0 | AI decision assistant prototype |
| v1.0.0 | Trading OS MVP |

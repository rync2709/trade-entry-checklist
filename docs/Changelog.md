# Changelog

All notable changes to Trading OS will be documented in this file.

## v0.7.0 - 2026-07-24

### Added

- Added a manual context Watchlist for up to 30 symbols.
- Added Gold, Bitcoin, Ethereum, Solana, and Nasdaq as the initial Watchlist.
- Added HTF Bias, Setup Status, Current Zone, Waiting For, and Last Review Note.
- Added Ready, Waiting, No Trade, and Needs Update filters.
- Added a 24-hour context freshness warning.
- Added a Dashboard Watchlist summary that only promotes fresh READY context.
- Added Watchlist to desktop and mobile navigation.

### Changed

- Started Phase 7 while real-use validation continues for earlier phases.
- Updated the PWA cache for the Watchlist release.
- Clarified that Watchlist status is manual context, not live market data.

## v0.6.0 - 2026-07-24

### Added

- Added Daily Session Plans separated by Asia/Bangkok calendar date.
- Added Bullish, Bearish, and Neutral bias with HTF Narrative.
- Added Key POIs, Liquidity Targets, and separate London and New York plans.
- Added News Status, News Note, and No Trade Conditions.
- Added an explainable seven-item plan-readiness checklist.
- Added PLAN EMPTY, PLAN DRAFT, and PLAN READY states.
- Added a current-session plan preview and Dashboard reminder.
- Added Session Planner to desktop and mobile navigation.

### Changed

- Started Phase 6 while real-use validation continues for earlier phases.
- Updated the PWA cache for the Session Planner release.
- Expanded the tablet navigation breakpoint to keep the desktop header readable.
- Moved the Classic Checklist into a desktop More menu as the primary navigation grows.

## v0.5.0 - 2026-07-24

### Added

- Added Monday-to-Sunday Weekly Review navigation using Asia/Bangkok close dates.
- Added weekly Closed Trades, Win Rate, Net R, Expectancy, Average RR, and R Coverage.
- Added seven-day Winning, Losing, Break Even, and Needs R summaries.
- Added weekly mistake totals and evidence-based Strengths and Focus Areas.
- Added saved reflection fields for strengths, improvements, and next-week focus.
- Added a Dashboard reminder for open, due, and saved Weekly Reviews.
- Added a mobile More menu for Database, Weekly Review, and Classic Checklist.

### Changed

- Started Phase 5 while real-use validation continues for earlier phases.
- Updated primary desktop navigation and the PWA cache for Weekly Review.

## v0.4.0 - 2026-07-24

### Added

- Added the first searchable Trade Database for entered trades.
- Added token search across Pair, Setup, Session, Grade, Result, Mistake, and review text.
- Added structured filters for Pair, Setup, Session, Grade, Result, Mistake, and date range.
- Added newest, oldest, highest-R, and lowest-R sorting.
- Added direct links from Database results to matching Journal reviews.
- Added responsive desktop and mobile Database layouts.

### Changed

- Started Phase 4 while real-use validation continues for earlier phases.
- Added Database to primary desktop and mobile navigation.
- Updated Journal cards to support direct highlighted review links.
- Updated the PWA cache for the Database release.

## v0.3.1 - 2026-07-24

### Added

- Added the Monthly Performance Calendar with previous, next, and current-month controls.
- Added daily Winning, Losing, Break Even, and Needs R states.
- Added monthly Net R, Closed Trades, Active Days, and R Coverage.
- Added Asia/Bangkok date grouping for consistent close-date reporting.

### Changed

- Kept the calendar on a stable six-week layout across all months.
- Updated the PWA cache for the calendar release.

## v0.3.0 - 2026-07-24

### Added

- Added the first Statistics page with 30-day, 90-day, and all-time ranges.
- Added Closed Trades, Win Rate, Average RR, Expectancy, Average Hold, and R Coverage.
- Added an Equity Curve based on cumulative Realized R.
- Added Win, Loss, and Break Even distribution.
- Added Session and Setup performance breakdowns.
- Added Statistics navigation on desktop and mobile.

### Changed

- Started Phase 3 while Phase 1 and Phase 2 real-use validation continue.
- Updated the PWA cache to include Statistics assets for offline use.

## v0.2.2 - 2026-07-24

### Added

- Added Actual Exit and Close Note fields for Closed Trades.
- Added automatic Realized RR calculation for Bullish and Bearish positions.
- Added automatic Holding Time from lifecycle timestamps.
- Added positive, negative, and break-even RR states.

### Changed

- Extended Journal records with backward-compatible close-review metadata.
- Updated the PWA cache for the close-review release.

## v0.2.1 - 2026-07-24

### Added

- Added one local Screenshot attachment per entered Trade.
- Added Screenshot preview, full-size view, replacement, and removal controls.
- Added a dedicated IndexedDB media store with PNG, JPG, and WEBP validation.
- Added an 8 MB input limit and clear upload error states.

### Changed

- Extended Journal metadata without storing image data in localStorage.
- Updated the PWA cache to include the Screenshot storage module.

## v0.2.0 - 2026-07-24

### Added

- Added the first Trade Journal page for assessments marked `ENTERED`.
- Added All, Open, and Closed journal filters.
- Added Emotion, Mistakes, Lesson, and TradingView link review fields.
- Added journal summary counts for total, open, closed, and reviewed trades.
- Added Journal navigation on desktop and mobile.

### Changed

- Extended lifecycle records with backward-compatible journal metadata.
- Updated the PWA cache to include the Trade Journal.
- Started Phase 2 while Phase 1 validation continues collecting real-use outcomes.

## v0.1.3 - 2026-07-24

### Added

- Added Phase 1 validation progress with a 20-result evidence target.
- Added GOOD SKIP and MISSED MOVE verdicts for skipped assessments.
- Added closed-outcome, reviewed-skip, and pending-review counters.

### Changed

- Extended assessment records with optional validation metadata.
- Updated the PWA cache for the Phase 1.4 validation release.

## v0.1.2 - 2026-07-24

### Added

- Added an eight-category score breakdown to the final Wizard step.
- Added the `score-v1` profile to new assessment records for future calibration.
- Added category completion counts and earned points.

### Changed

- Grade remains pending until the setup reaches READY TO ENTER.
- Updated the PWA cache for the Phase 1.3 scoring release.

## v0.1.1 - 2026-07-24

### Added

- Added WAIT, SKIP, and ENTERED decisions to the final Wizard step.
- Added Entry, Stop Loss, Take Profit, and automatic Planned RR validation.
- Added Open Position tracking to the Dashboard.
- Added WIN, LOSS, and BREAK EVEN close outcomes.
- Added lifecycle data to assessment records for the future Trade Journal.

### Changed

- Updated Dashboard metrics to show entered trades and open positions.
- Extended local records without removing compatibility with v0.1.0 history.
- Updated the PWA cache for the Phase 1.2 lifecycle release.

## v0.1.0 - 2026-07-24

### Added

- Added the Trading Companion dashboard as the new app home.
- Added a guided five-step New Trade Wizard.
- Added the first Decision Engine for setup state, next action, score, grade, and blocking reasons.
- Added automatic draft saving and local assessment history.
- Added responsive desktop and mobile layouts.
- Added a Trading Companion app mark and reusable interface icons.

### Changed

- Updated the PWA name, theme, and offline asset cache for Phase 1.
- Moved the original Trade Entry Checklist to `checklist.html` and kept its existing local storage behavior.
- Updated the project status from Phase 0 complete to Phase 1 in progress.

## v0.0.2-alpha - 2026-07-24

### Changed

- Renamed the GitHub repository reference from `trade-entry-checklist` to `Trading-Companion`.
- Promoted the user-provided Trading OS product plan to the master roadmap.
- Reframed the roadmap around the web app as the main product track.
- Added phases for core trading app, journal, statistics, trade database, weekly review, session planner, watchlist, tools, AI assistant, and TradingView integration.
- Added Decision Engine and Playbook Library as core long-term roadmap items.
- Kept Pine Script as a parallel supporting track.

## v0.0.1-alpha - 2026-07-23

### Added

- Added Phase 0 documentation structure.
- Added `docs/Rulebook.md` as the first Trading OS rulebook.
- Added `docs/Indicator_Spec.md` to define future module behavior.
- Added `docs/Roadmap.md` to track planned development phases.
- Added `docs/Changelog.md` to track version history.
- Updated `README.md` to identify the project as Trading OS.

### Unchanged

- No changes to `index.html` checklist behavior.
- No changes to `manifest.json` PWA configuration.
- No changes to `sw.js` service worker caching behavior.
- No changes to local storage keys or checklist state logic.

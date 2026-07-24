# Changelog

All notable changes to Trading OS will be documented in this file.

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

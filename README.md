# Trading Companion

Trading Companion is the web application for the Trading OS decision framework. It is built from the original ICT/SMC Trade Entry Checklist.

Trading Companion now combines the guided decision workflow, Trade Journal, performance statistics, searchable Trade Database, Weekly Review, daily Session Planner, manual context Watchlist, and practical risk tools. Real-use validation continues across the earlier phases while Phase 8 is developed.

## Current Status

- Product name: Trading Companion
- Decision framework: Trading OS
- Repository name: Trading-Companion
- Phase: 8 - Advanced Tools (in progress)
- Phase 1 validation: collecting 20 real-use outcomes
- Version: v0.8.3
- Live app: https://rync2709.github.io/Trading-Companion/

## Phase 1 Milestone

The first Phase 1 milestone includes:

- Dashboard with active setup, current grade, session, and recent assessments
- Guided five-step New Trade Wizard
- Smart status: WAITING, DEVELOPING, READY, and NO TRADE
- First score and grade model based on the Phase 0 rulebook
- Explainable score breakdown with a versioned scoring profile
- Blocking reasons for invalid setup conditions
- Automatic local draft saving
- WAIT, SKIP, and ENTERED lifecycle decisions
- Entry, Stop Loss, Take Profit, and automatic Planned RR
- Open Position tracking with WIN, LOSS, and BREAK EVEN outcomes
- Initial lifecycle records for the future Trade Journal
- Phase 1 validation progress with closed outcomes and reviewed skips
- Permanent deletion for saved NO TRADE and SKIP assessments
- Classic Checklist preserved at `checklist.html`

## Phase 2 Milestone

The first Phase 2 milestone includes:

- Trade Journal for every assessment marked `ENTERED`
- All, Open, and Closed trade filters
- Emotion, mistake, lesson, and TradingView link fields
- Local Screenshot attachment with preview, full-size view, replacement, and removal
- Closed Trade review with Actual Exit, automatic Realized RR, Close Note, and Holding Time
- Permanent Trade deletion with confirmation and Screenshot cleanup
- Backward-compatible journal data for existing lifecycle records
- Local review progress summary

Phase 2 review fields will continue to be validated through real use.

## Phase 3 Milestone

The first Phase 3 milestone includes:

- Statistics page with 30-day, 90-day, and all-time ranges
- Closed Trades, Win Rate, Average RR, Expectancy, Average Hold, and R Coverage
- Equity Curve based on cumulative Realized R
- Monthly Performance Calendar using Asia/Bangkok close dates
- Daily Winning, Losing, Break Even, and Needs R states
- Win, Loss, and Break Even distribution
- Session and Setup performance breakdowns
- Clear separation between closed outcomes and trades with a recorded Actual Exit

## Phase 4 Milestone

The first Phase 4 milestone includes:

- Searchable database for every assessment marked `ENTERED`
- Token search across Pair, Setup, Session, Grade, Result, Mistake, and review text
- Structured filters for Pair, Setup, Session, Grade, Result, Mistake, and date range
- Newest, oldest, highest-R, and lowest-R sorting
- Database summaries for total, matching, closed, and reviewed trades
- Direct links from search results to the matching Journal review
- Responsive table and mobile result layout

## Phase 5 Milestone

The first Phase 5 milestone includes:

- Monday-to-Sunday Weekly Review using Asia/Bangkok close dates
- Closed Trades, Win Rate, Net R, Expectancy, Average RR, and R Coverage
- Seven-day result strip with Winning, Losing, Break Even, and Needs R states
- Mistake totals based on Trade Journal reviews
- Evidence-based Strengths and Focus Areas without assuming missing data
- Saved reflection fields for strengths, improvements, and next-week focus
- Dashboard reminder showing whether the current review is open, due, or saved
- Mobile More menu for Database, Weekly Review, and Classic Checklist

## Phase 6 Milestone

The first Phase 6 milestone includes:

- Daily Session Plans separated by Asia/Bangkok calendar date
- Bullish, Bearish, and Neutral daily bias
- HTF Narrative, Key POIs, and Liquidity Targets
- Separate London and New York execution plans
- News status, News Note, and No Trade Conditions
- Explainable seven-item plan-readiness checklist
- PLAN EMPTY, PLAN DRAFT, and PLAN READY states
- Current-session plan preview using Bangkok time
- Dashboard reminder linked to the current Daily Plan

## Phase 7 Milestone

The first Phase 7 milestone includes:

- Default Watchlist for Gold, Bitcoin, Ethereum, Solana, and Nasdaq
- Add, edit, and remove support for up to 30 symbols
- HTF Bias, Setup Status, Current Zone, Waiting For, and Last Review Note
- Ready, Waiting, No Trade, and Needs Update filters
- 24-hour context freshness warning
- Dashboard summary that only promotes fresh READY context
- Local manual context tracking without implying live market data

## Phase 8 Milestone

The first Phase 8 milestone includes:

- Direction-aware RR Calculator for Bullish and Bearish plans
- Risk distance, reward distance, and break-even win-rate outputs
- Risk Amount and Position Size Calculator
- Configurable value per 1.0 price move for different contract specifications
- Currency Converter with automatic daily fiat reference rates and manual fallback
- Frankfurter source date, currency swap, and Google verification link
- Fixed Bangkok Session Timer matching the existing Session Planner schedule
- Input validation and explicit broker contract-specification warning

## Repository Structure

```text
.
|-- index.html
|-- trade.html
|-- journal.html
|-- stats.html
|-- database.html
|-- weekly.html
|-- planner.html
|-- watchlist.html
|-- tools.html
|-- checklist.html
|-- manifest.json
|-- sw.js
|-- README.md
|-- assets/
|-- css/
|-- js/
`-- docs/
    |-- Rulebook.md
    |-- Indicator_Spec.md
    |-- Roadmap.md
    `-- Changelog.md
```

## Documents

- [Rulebook](docs/Rulebook.md): Trading rules and setup validation framework
- [Indicator Specification](docs/Indicator_Spec.md): Modules, inputs, process, and outputs for automation
- [Roadmap](docs/Roadmap.md): Development phases from Phase 0 to Trading OS v1
- [Changelog](docs/Changelog.md): Version history and project changes

## Data Note

Drafts, assessment history, Weekly Reviews, Daily Session Plans, Watchlist Context, and Screenshots are stored only in the browser on the current device. Screenshots use IndexedDB so image files do not consume the smaller checklist storage area. Watchlist status is entered manually and is not live market data. Advanced Tool inputs are calculated locally and are not saved. The Currency Converter requests only the selected fiat currency pair from Frankfurter; it does not send the entered amount. Trading Companion does not place orders and does not send trade data to a server.

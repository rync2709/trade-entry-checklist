# Trading Companion

Trading Companion is the web application for the Trading OS decision framework. It is built from the original ICT/SMC Trade Entry Checklist.

Trading Companion now combines the guided decision workflow, Trade Journal, performance statistics, and the first searchable Trade Database. Real-use validation continues across the earlier phases while Phase 4 is developed.

## Current Status

- Product name: Trading Companion
- Decision framework: Trading OS
- Repository name: Trading-Companion
- Phase: 4 - Trade Database (in progress)
- Phase 1 validation: collecting 20 real-use outcomes
- Version: v0.4.0
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
- Classic Checklist preserved at `checklist.html`

## Phase 2 Milestone

The first Phase 2 milestone includes:

- Trade Journal for every assessment marked `ENTERED`
- All, Open, and Closed trade filters
- Emotion, mistake, lesson, and TradingView link fields
- Local Screenshot attachment with preview, full-size view, replacement, and removal
- Closed Trade review with Actual Exit, automatic Realized RR, Close Note, and Holding Time
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

## Repository Structure

```text
.
|-- index.html
|-- trade.html
|-- journal.html
|-- stats.html
|-- database.html
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

Drafts, assessment history, and Screenshots are stored only in the browser on the current device. Screenshots use IndexedDB so image files do not consume the smaller checklist storage area. Trading Companion does not place orders and does not send trade data to a server.

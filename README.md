# Trading Companion

Trading Companion is the web application for the Trading OS decision framework. It is built from the original ICT/SMC Trade Entry Checklist.

Trading Companion now combines the Phase 1 guided decision workflow with the first Phase 2 Trade Journal. Phase 1 score validation continues while journal features are developed.

## Current Status

- Product name: Trading Companion
- Decision framework: Trading OS
- Repository name: Trading-Companion
- Phase: 2 - Trade Journal (in progress)
- Phase 1 validation: collecting 20 real-use outcomes
- Version: v0.2.1
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
- Backward-compatible journal data for existing lifecycle records
- Local review progress summary

Richer post-trade analysis remains planned.

## Repository Structure

```text
.
|-- index.html
|-- trade.html
|-- journal.html
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

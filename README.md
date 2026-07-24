# Trading Companion

Trading Companion is the web application for the Trading OS decision framework. It is built from the original ICT/SMC Trade Entry Checklist.

Phase 1 turns the original static checklist into a guided decision workspace with a dashboard, New Trade Wizard, smart setup status, setup grade, and local assessment history.

## Current Status

- Product name: Trading Companion
- Decision framework: Trading OS
- Repository name: Trading-Companion
- Phase: 1 - Core Trading App (in progress)
- Version: v0.1.2
- Live checklist: https://rync2709.github.io/Trading-Companion/

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
- Classic Checklist preserved at `checklist.html`

## Repository Structure

```text
.
|-- index.html
|-- trade.html
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

Drafts and assessment history are stored only in the browser on the current device. Trading Companion does not place orders and does not send trade data to a server.

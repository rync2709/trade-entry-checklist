# Trading OS

Trading OS is an ICT/SMC decision support project built from the existing Trade Entry Checklist.

The current web app remains the same lightweight checklist PWA. Phase 0 adds project documentation so the checklist logic can be turned into a rulebook, indicator specification, and future Pine Script modules without changing the current app behavior.

## Current Status

- Project name: Trading OS
- Repository name: Trading-Companion
- Phase: 0 - Design and Specification
- Version: v0.0.2-alpha
- Live checklist: https://rync2709.github.io/Trading-Companion/

## Phase 0 Scope

Phase 0 defines the trading system before changing the application logic.

- Create a Trading Rulebook from the current checklist
- Define indicator modules and expected outputs
- Map checklist decisions into a future scoring and alert model
- Keep the existing PWA and checklist behavior unchanged

## Repository Structure

```text
.
|-- index.html
|-- manifest.json
|-- sw.js
|-- README.md
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

## Behavior Note

This phase does not modify `index.html`, `manifest.json`, `sw.js`, local storage behavior, service worker caching, or checklist decision logic.

# Repository Modernization Plan

## Purpose

This document is the working plan for assessing, stabilizing, modernizing, and refactoring the `markdown-flashcards` repository. It is based on the current repository state as inspected on 2026-04-08.

The goal is not to rewrite everything at once. The goal is to move the repository from a functional personal project into a safer, more maintainable, better-tested, and more coherent codebase without losing delivery momentum.

## Executive Summary

The repository is in a workable state:

- `pnpm lint` passes
- `pnpm build` passes
- `pnpm build:extension` passes
- `pnpm docs:build` passes
- production dependencies do not currently report known vulnerabilities in `pnpm audit --prod`

However, the repository has several structural issues that should be addressed before adding meaningful new functionality:

1. The main app renders remote markdown as trusted HTML without sanitization.
2. The frontend architecture is still imperative DOM scripting despite modern tooling.
3. The main page is a large monolithic `index.html` with inline styles and CDN runtime dependencies.
4. Documentation, metadata, and release/versioning are inconsistent with the actual implementation.
5. CI does not protect the browser extension on normal pull requests.
6. There is no automated test suite.
7. Tooling is partially current, but key packages should be updated and the dev dependency graph needs review.

The most important recommendation is to prioritize security hardening and architectural cleanup before adding further product scope.

## Repository Snapshot

### Top-Level Structure

- `src/`: main web app logic
- `extension/`: NotebookLM extraction browser extension
- `docs/`: VitePress documentation site
- `.github/workflows/`: CI and packaging workflows
- `index.html`: main app shell
- `package.json`: workspace scripts and dependencies

### Major Subsystems

#### 1. Flashcard Web App

Current characteristics:

- Built with Vite and TypeScript
- Uses a single HTML entrypoint
- Uses imperative DOM manipulation instead of a component architecture
- Persists decks and progress in `localStorage`
- Fetches flashcard markdown from arbitrary URLs

Key files:

- `src/main.ts`
- `src/lib/state.ts`
- `src/lib/storage.ts`
- `src/lib/url.ts`
- `src/lib/markdown.ts`
- `src/components/*.ts`
- `index.html`

#### 2. NotebookLM Browser Extension

Current characteristics:

- Manifest v3 Chrome extension
- Extracts flashcard or quiz data from NotebookLM
- Can download exports locally or publish to GitHub Gist
- Stores settings and an encrypted PAT locally

Key files:

- `extension/manifest.json`
- `extension/popup.ts`
- `extension/contentScript.ts`
- `extension/dataExtractor.ts`
- `extension/formatters.ts`
- `extension/settings.ts`
- `extension/popup.html`

#### 3. Documentation Site

Current characteristics:

- Uses VitePress
- Covers both the flashcard app and the extension
- Is buildable and deployable
- Has some wording drift from the actual repo state

Key files:

- `docs/.vitepress/config.mts`
- `docs/index.md`
- `docs/markdown-flashcards/*`
- `docs/notebooklm-extractor/*`
- `docs/misc/*`

#### 4. CI / Release Workflows

Current characteristics:

- Main workflow lints and builds the app and docs
- GitHub Pages deployment exists
- Extension packaging exists as a separate manual workflow
- Workflow versions and conventions are not fully aligned

Key files:

- `.github/workflows/static.yml`
- `.github/workflows/package-extension.yml`

## Current Quality Assessment

### What Is Good

- The repository is small enough to refactor safely without major organizational overhead.
- TypeScript strictness is enabled and the code compiles cleanly.
- The extension code is reasonably modular.
- The docs site is already integrated into the project instead of being externalized.
- CI exists and is useful, even if incomplete.
- The product concept is coherent: extractor plus trainer plus documentation.

### What Is Weak

- The app runtime architecture does not match the maturity of the toolchain.
- The web app mixes content fetching, persistence, UI orchestration, state mutation, and browser prompts in one flow.
- The main UI relies on alerts/prompts/confirms rather than app-level components.
- Security posture is not strong enough for arbitrary remote markdown.
- Documentation and metadata are inconsistent.
- The repo is hard to verify because there are no tests.

### What Is Risky

- Unsanitized markdown rendering from remote user-supplied URLs
- CDN dependency loading in the app shell
- Low confidence when changing parser, URL transformation, or storage behavior due to no tests
- Possible future drift between extension packaging and extension manifest versioning

## Detailed Findings

### 1. Security

#### 1.1 Unsanitized Markdown Rendering

The app fetches markdown from arbitrary URLs and renders it with `marked.parse(...)` directly into `innerHTML`.

Implications:

- Cross-site scripting risk
- Malicious deck content can inject arbitrary HTML
- The issue is especially important because this app is designed to load public remote content

Required action:

- Introduce HTML sanitization
- Prefer a rendering pipeline that makes trust boundaries explicit
- Add tests around allowed and blocked markup

#### 1.2 CDN Runtime Dependencies in `index.html`

The main app currently depends on:

- Tailwind via CDN
- Marked via CDN
- MathJax via CDN
- Google Fonts
- external analytics script

Implications:

- Reproducibility is weaker
- Runtime availability depends on third parties
- Content Security Policy is harder to tighten
- Dependency versions are less explicit at runtime

Required action:

- Move runtime dependencies into the build where possible
- Evaluate whether MathJax should remain remote or become an optional/bundled dependency
- Make analytics opt-in or clearly documented

#### 1.3 Extension Security Positioning

The extension attempts to encrypt the GitHub PAT before storage. That is better than plaintext storage, but the current messaging should be careful not to overstate the protection model.

Implications:

- The security model is local-obfuscation plus session-derived key material, not a hardened secret vault
- UX copy should explain the security properties accurately

Required action:

- Review extension security copy
- Document the threat model clearly
- Reduce PAT persistence if the UX can tolerate it

### 2. Frontend Architecture

#### 2.1 The Main App Is Not a Real Component App

The app is still implemented as direct DOM manipulation against global mutable state instead of using a dedicated UI framework and component model.

Implications:

- Higher cognitive load for changes
- Harder testing
- UI state and domain state are entangled
- Rendering logic is distributed across files but not composed

Decision required:

- either adopt Svelte properly
- or intentionally remain framework-light and establish a minimal but explicit architecture

Recommendation:

Use Svelte properly for the app shell and interaction surfaces. This repository is small, client-only, and interaction-heavy, which makes Svelte a better fit than Vue for the main application surface. Keep VitePress for documentation rather than trying to unify app and docs under one framework immediately.

#### 2.2 Global Mutable State

`src/lib/state.ts` exposes shared mutable arrays and primitive values directly.

Implications:

- Mutation can happen from anywhere
- Side effects are not explicit
- State updates are easy to break during refactors

Required action:

- Introduce a dedicated store model
- centralize update paths
- separate persistence format from in-memory model

#### 2.3 Monolithic App Orchestration

`src/main.ts` does too much:

- DOM bootstrapping
- keyboard handling
- initialization
- deck loading
- persistence flow
- deck CRUD
- user prompts
- preload URL behavior

Implications:

- One large change surface
- Difficult unit testing
- High coupling between UI and data flow

Required action:

- Split into app boot, state/store, services, and UI components

### 3. UX and Accessibility

#### 3.1 Browser Prompt/Alert/Confirm UX

The web app relies heavily on native dialogs.

Implications:

- poor visual consistency
- weak accessibility control
- harder automated testing
- weak mobile UX

Required action:

- Replace with app-native dialogs, toasts, and inline validation

#### 3.2 Large Inline Styling Surface

The main app layout and markdown presentation live in a large inline `<style>` block in `index.html`.

Implications:

- weak reuse
- difficult theming
- hard to lint or evolve

Required action:

- extract styles into dedicated CSS files
- introduce design tokens or CSS custom properties
- decide whether Tailwind remains or is replaced with repo-managed styles

#### 3.3 Accessibility Review Needed

No dedicated a11y testing or patterns are evident.

Required action:

- audit keyboard support
- add semantic roles where needed
- ensure focus states and dialog behavior are correct
- test screen-reader-relevant flows

### 4. Testing and Verification

#### 4.1 No Tests

There are no test or spec files in the repository.

Implications:

- regressions will be found manually
- parser and storage migrations are risky to modify
- extension behavior cannot be validated confidently

Required action:

Create an automated test baseline with:

- unit tests for markdown parsing
- unit tests for URL transformation
- unit tests for storage migration behavior
- unit tests for extension formatting logic
- selected integration tests for app flows

#### 4.2 Missing End-to-End Validation

The app and extension have user-critical flows that would benefit from browser-level validation.

Required action:

- add Playwright for app flows
- consider lightweight extension integration checks if practical

### 5. Tooling and Dependencies

#### 5.1 Packages to Revisit

At inspection time:

- `vite` in repo: `7.2.2`
- npm latest `vite`: `8.0.7`
- `marked` in repo: `17.0.1`
- npm latest `marked`: `18.0.0`
- `vitepress` in repo: `2.0.0-alpha.14`
- npm latest stable `vitepress`: `1.6.4`
- `@types/chrome` in repo: `0.1.31`
- npm latest `@types/chrome`: `0.1.39`

#### 5.2 Dev Dependency Audit Issues

`pnpm audit --dev` reports vulnerabilities in the development dependency graph, including advisories affecting Vite and transitive packages.

Implications:

- local development attack surface is not ideal
- dependency hygiene is behind the current ecosystem

Required action:

- update Vite first
- regenerate lockfile
- reassess VitePress version strategy
- rerun audit and capture residual risk

### 6. Documentation and Metadata Drift

#### 6.1 README Drift

The root README still describes the app as vanilla HTML/CSS/JavaScript and mentions Tailwind at a high level without accurately describing the current architecture or extension/docs presence.

Required action:

- rewrite README to reflect the real repo

#### 6.2 Manifest / Product Copy Drift

The extension manifest description still says it downloads JSON, which is no longer a complete description.

Required action:

- align manifest description, extension README, docs, and product copy

#### 6.3 Changelog Discipline

The changelog claims semantic versioning but includes repeated `0.0.0` entries and version/date patterns that do not look like a maintained release process.

Required action:

- normalize version history
- document release rules

### 7. CI, Build, and Release Process

#### 7.1 Extension Is Not Protected in Normal CI

The main workflow lints and builds the app/docs, but extension build verification is not part of routine PR checks.

Required action:

- add extension build to the default CI workflow

#### 7.2 Workflow Inconsistency

The main workflow and extension packaging workflow use different action versions and pnpm setup versions.

Required action:

- standardize workflow conventions
- standardize Node/pnpm versions

#### 7.3 Release Automation Is Partial

The extension packaging flow creates releases from manual workflow input but is not clearly coupled to source-of-truth version updates.

Required action:

- define the release source of truth
- sync `package.json`, manifest version, changelog, and GitHub release

### 8. Repo Hygiene

#### 8.1 `.gitignore` and Lockfile Policy

`.gitignore` currently ignores `pnpm-lock.yaml`, but the lockfile is tracked.

Implications:

- contributor confusion
- ambiguous dependency policy

Required action:

- decide to track the lockfile intentionally
- update `.gitignore` to match reality

#### 8.2 Dead or Unused Code

Some files and patterns suggest cleanup opportunities, including importer-related code that is not clearly active in current app flow.

Required action:

- identify and remove dead code
- keep only exercised modules

## Target End State

The target state for this repository should be:

- secure-by-default for remote markdown input
- app architecture based on explicit components and state management
- no critical functionality hidden in monolithic HTML
- reproducible builds with pinned dependencies
- automated tests covering parsing, storage, and main workflows
- CI that validates app, docs, and extension on every PR
- docs and metadata that accurately describe the system
- repeatable release/versioning process

## Workstreams

## Workstream A: Security Hardening

### Goals

- eliminate markdown XSS risk
- reduce runtime supply-chain exposure
- clarify extension security guarantees

### Tasks

1. Add a sanitization layer after markdown parsing.
2. Add tests for sanitized and unsanitized content cases.
3. Replace CDN-provided Marked with a local import from npm.
4. Review whether Tailwind CDN usage should remain.
5. Review MathJax loading strategy.
6. Decide analytics policy and document it.
7. Review PAT handling and security messaging in the extension.

### Acceptance Criteria

- remote markdown cannot inject executable HTML/JS into the app
- markdown rendering behavior is covered by tests
- core app runtime does not depend on unpinned CDN script imports for critical behavior

## Workstream B: Frontend Refactor

### Goals

- move from imperative DOM scripting to a maintainable UI architecture
- reduce coupling between state, services, and rendering

### Recommended Direction

Refactor the flashcard app into Svelte with a small, explicit app structure:

- `src/App.svelte`
- `src/lib/components/DeckSelector.svelte`
- `src/lib/components/FlashcardView.svelte`
- `src/lib/components/FilterBar.svelte`
- `src/lib/components/ClassifyControls.svelte`
- `src/lib/components/Dialog.svelte`
- `src/lib/components/Toast.svelte`
- `stores/useDeckStore.ts`
- `services/storage.ts`
- `services/urlTransform.ts`
- `services/markdown.ts`

If Svelte is explicitly rejected, the fallback is:

- one store module
- one renderer layer
- zero direct cross-module DOM mutation
- no exported mutable globals

### Tasks

1. Choose architecture direction.
2. Define domain model and store API.
3. Move deck CRUD and initialization into services/store.
4. Replace browser prompts with app dialogs.
5. Migrate `index.html` to a thin shell.
6. Extract styles into dedicated assets.

### Acceptance Criteria

- no exported mutable state arrays/primitives as the primary state model
- `main.ts` becomes a thin bootstrap layer
- UI interactions are testable without manual DOM wiring

## Workstream C: UX and Accessibility

### Goals

- modernize the interaction model
- improve accessibility and mobile usability

### Tasks

1. Replace `alert/prompt/confirm` with app-native UI.
2. Introduce inline error states and success notifications.
3. Review keyboard behavior for conflicts and discoverability.
4. Add accessible dialog and focus management patterns.
5. Improve responsive behavior and layout resilience.

### Acceptance Criteria

- no critical user flow depends on native browser dialogs
- dialogs and notifications are keyboard accessible
- mobile usage is not degraded by prompt-driven interaction

## Workstream D: Test Infrastructure

### Goals

- establish a safety net for refactors

### Recommended Stack

- `vitest` for unit tests
- `@testing-library/*` if a component architecture is introduced
- `playwright` for browser-level validation

### Initial Test Targets

1. `src/lib/markdown.ts`
2. `src/lib/url.ts`
3. `src/lib/storage.ts`
4. `extension/formatters.ts`
5. key deck-management flows

### Acceptance Criteria

- test runner is part of CI
- key parsing/storage logic has automated coverage
- at least one browser-level smoke test exists for the app

## Workstream E: Dependency and Tooling Upgrades

### Goals

- close dev dependency audit findings where possible
- move to supported/stable tool versions

### Tasks

1. Upgrade `vite` to the latest compatible line.
2. Upgrade `marked` and adapt code as required.
3. Reassess `vitepress` alpha usage; prefer stable unless there is a blocking feature dependency.
4. Upgrade `@types/chrome`.
5. Regenerate lockfile intentionally.
6. Re-run `pnpm audit --prod` and `pnpm audit --dev`.

### Acceptance Criteria

- high-priority dev tooling advisories are reduced or documented
- build/lint/docs/extension still pass after upgrades

## Workstream F: CI and Release Engineering

### Goals

- make CI representative of the real repo
- standardize release process

### Tasks

1. Add extension build to default PR CI.
2. Add tests to CI once test infrastructure exists.
3. Standardize GitHub Actions versions.
4. Standardize Node and pnpm versions.
5. Define a release checklist:
   - changelog updated
   - manifest version updated
   - package metadata updated if needed
   - docs updated if user-visible behavior changed
6. Clarify whether releases are app releases, extension releases, or repo releases.

### Acceptance Criteria

- PRs cannot merge while app or extension build is broken
- release artifacts align with declared version metadata

## Workstream G: Documentation and Product Alignment

### Goals

- make the repository self-explanatory and accurate

### Tasks

1. Rewrite root README.
2. Align extension README with actual outputs and setup.
3. Update manifest description and docs wording.
4. Normalize changelog version history.
5. Document architecture and contributor workflow.

### Acceptance Criteria

- README accurately describes current architecture and usage
- docs do not contradict implementation
- changelog and release metadata follow one coherent scheme

## Proposed Implementation Phases

## Phase 0: Preparation

### Scope

- finalize this plan
- decide architecture direction
- define success criteria and non-goals

### Deliverables

- approved plan
- implementation order
- issue breakdown or milestone breakdown

## Phase 1: Security and Tooling Baseline

### Scope

- sanitize markdown
- remove or reduce critical CDN runtime coupling
- upgrade Vite and related packages
- clean lockfile policy

### Why First

This reduces the highest-risk exposure and prevents refactoring on top of known weak foundations.

### Deliverables

- secure markdown rendering
- updated dependency baseline
- documented dependency policy

## Phase 2: Test Baseline

### Scope

- add unit testing infrastructure
- cover parser, URL transform, storage migration, extension formatters

### Why Second

The architectural refactor should not begin without at least minimal verification.

### Deliverables

- test runner
- first unit test suite
- CI integration for tests

## Phase 3: App Architecture Refactor

### Scope

- move web app to Svelte or a deliberately structured state/render system
- reduce `main.ts`
- reduce `index.html` to shell responsibility

### Deliverables

- Svelte-based app
- explicit store and service layers
- replacement of browser-native dialogs

## Phase 4: UX, Accessibility, and Polish

### Scope

- improve deck management UI
- accessibility review
- mobile polish
- notifications and errors

### Deliverables

- consistent interactive UI
- keyboard and focus improvements
- fewer user-hostile native dialog flows

## Phase 5: CI, Docs, and Release Process

### Scope

- extension in PR CI
- workflow cleanup
- README/docs/changelog alignment
- release process standardization

### Deliverables

- stronger CI gate
- clearer contributor experience
- reliable release process

## Priority Matrix

### P0: Must Do First

- sanitize markdown rendering
- update Vite/tooling to resolve high-priority advisories where possible
- establish lockfile policy
- add extension build to standard CI

### P1: High Value, Next

- add unit tests
- replace native browser dialogs
- refactor state and app structure
- split monolithic `index.html`

### P2: Important but After Core Stabilization

- accessibility improvements
- release workflow normalization
- changelog normalization
- docs rewriting and contributor guidance

### P3: Nice to Have

- visual redesign iteration
- advanced study features
- richer analytics or telemetry controls
- import/export enhancements beyond the current scope

## Recommended Issue Breakdown

The work should be tracked in discrete issues roughly like this:

1. Secure markdown rendering with sanitization
2. Move markdown runtime dependencies from CDN to npm-managed imports
3. Upgrade Vite and rebaseline dev dependency audit
4. Fix `.gitignore` / lockfile policy
5. Add unit test infrastructure
6. Add tests for markdown parser
7. Add tests for URL transforms
8. Add tests for storage migration
9. Add tests for extension formatters
10. Add extension build to PR CI
11. Standardize GitHub Actions versions and Node/pnpm setup
12. Rewrite README and align repo metadata
13. Replace browser dialogs with app-native UI
14. Introduce app store / state layer
15. Componentize main app UI
16. Extract styles from `index.html`
17. Accessibility and mobile review
18. Normalize changelog and release workflow

## Verification Checklist

After the full plan is executed, all of the following should be true:

- `pnpm lint` passes
- `pnpm build` passes
- `pnpm build:extension` passes
- `pnpm docs:build` passes
- tests pass locally and in CI
- markdown rendering is sanitized
- main app no longer relies on browser-native prompts for core deck flows
- extension build runs in standard CI
- README and docs accurately describe the implementation
- release metadata and versioning are internally consistent

## Risks During Refactor

### Risk 1: Breaking User Data Migration

Storage migration logic already exists. Refactoring state/persistence without test coverage could break local decks or progress.

Mitigation:

- add storage tests before large refactors
- preserve migration compatibility

### Risk 2: Over-Refactoring a Small Project

It is possible to overshoot and introduce complexity beyond the project’s needs.

Mitigation:

- keep abstractions small
- prefer thin services and simple stores
- avoid premature plugin systems or enterprise patterns

### Risk 3: Dependency Upgrade Side Effects

Upgrading Vite, VitePress, Svelte tooling, and markdown tooling may change build/runtime behavior.

Mitigation:

- upgrade in small steps
- rerun all build commands after each upgrade
- land changes in isolated PRs

### Risk 4: Extension Fragility

The extension depends on NotebookLM DOM structures and frame behavior that may change externally.

Mitigation:

- isolate extraction logic
- add tests where possible for formatting behavior
- improve error handling and diagnostics

## Non-Goals

The following are not part of the immediate modernization target unless explicitly requested later:

- building a backend service
- adding accounts or cloud sync
- implementing a full spaced repetition algorithm
- supporting every markdown host/provider on the internet
- turning the repo into a multi-package monorepo

## Recommended Order of Execution

If work starts immediately, use this order:

1. Secure markdown rendering
2. Upgrade Vite and dependency baseline
3. Fix lockfile and repo hygiene policy
4. Add test infrastructure and first tests
5. Add extension build to standard CI
6. Refactor app architecture
7. Replace browser dialogs and polish UX
8. Align docs, README, changelog, and release process

## Definition of Done

This modernization effort should be considered complete when:

- the highest-risk security issue is closed
- the codebase can be changed with test-backed confidence
- the app architecture is explicit and maintainable
- CI validates the entire repository surface
- documentation and metadata match reality

## Final Recommendation

Do not start with visual polish or feature additions.

Start with:

- security
- dependency hygiene
- tests
- architecture

That order gives the best return on effort and reduces the chance of building more functionality on unstable foundations.

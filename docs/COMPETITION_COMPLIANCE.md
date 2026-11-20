# QUANTARA competition evidence and open decisions

**Official submission status: undetermined.** The supplied materials identify a fintech workshop and a project called QUANTARA. They do not identify a particular competition or organizer. The workshop has a concrete deliverable, so its requirements can be checked. Eligibility and formal acceptance need evidence from the organizer.

## Source audit

| Source | Sections inspected | Authority and finding |
| --- | --- | --- |
| `Codex_Fintech_Workshop_Realistic.pdf` (12 pages) | pp. 1–2 context and goal, 3–6 Codex setup and iteration, 7–10 product and quality, 11 deliverable, 12 facilitator checklist | Workshop guidance. Page 11 specifies the minimum workshop output. Page 5 provides an example prompt. Pages 1, 3, 6 and 8 contain illustrations. |
| Pasted project brief headed **MASTER PROJECT DIRECTIVE / QUANTARA — An Intelligent Mathematical Paper-Trading Ecosystem** | §§1–13 | User's original product specification for simulated execution, RIFT and the learning experience. |
| Pasted project brief headed **QUANTARA — COMPETITION-GRADE FINTECH INNOVATION** | Parts I–XII, Final Directive | User's expanded requirements for ORACLE, AHEAD, RIFT, ARENA, validation and submission preparation. Part I expressly distinguishes the workshop from official competition rules. |
| Project checkout | Tracked sources, README, package manifest, tests, deployment configuration, downloadable source and commit history | The starting revision was `ff0a0aa`. It contained a browser application with seven routes, a fictional price generator, accounting and quantitative modules, automated tests and a source archive. A Sites-managed Git remote held this revision. |
| Workspace attachments and project files | All three attached files, supplied project documentation and deliverable directories | No organizer-issued brief, rulebook, rubric, eligibility declaration, submission template or portal instructions were found. This audit covers the material available to the project. |

## Official requirements register

A formal requirement can only enter the implementation traceability matrix once an official source identifies it. Each item below is **unresolved**. The stated action specifies how to verify it when an authoritative document becomes available.

| Missing official item | Effect on the submission | Verification and owner action |
| --- | --- | --- |
| Competition identity, edition, track and problem statement | Exact problem alignment, intended beneficiary and mandatory output are unknown. | Obtain the organizer's statement and edition, cite the paragraph IDs, and crosswalk every clause to an implemented feature and an acceptance test. |
| Rulebook, evaluation rubric and permitted technologies | Scoring weights, AI/tool use, dependencies, hosting, external data and disclosure requirements are unknown. | Compare technology, data and assistance disclosures against the dated rules. Reconcile any conflict before submission. |
| Eligibility, team size, membership, prior work and IP | Entrant eligibility, reuse of an earlier release, ownership and required consents need confirmation. | Entrants verify their details and permissions against organizer terms. Inventory code, data, third-party dependencies and project history. |
| Submission portal, deadline, time zone and access | No verified end time, delivery address or judge access setting. | Verify these with the organizer, arrange permitted access and retain receipt after the entrant submits. |
| Required artifacts, format, naming, size, video duration and slide template | The workshop's two-minute demo is the only sourced duration. Presentation, video and package specifications remain open. | Obtain the official template and packaging instructions. Complete the template, validate the uploaded files and record its revision. |

## Workshop traceability

**Evidence levels.** “Tested” means the specified automated behavior was exercised. “Inspection” means a reviewer can find the implementation or documentation at the cited location. Subjective polish, beginner comprehension and assistive-technology usability need human evaluation. Product demo instructions are in [Demonstration](DEMONSTRATION.md).

| ID and exact workshop source | Requirement | QUANTARA implementation | Verification and status |
| --- | --- | --- | --- |
| W1 · pp. 2, 7, 9, 11 | Coherent, clickable investing prototype, original identity and at least four polished screens | QUANTARA mark, navigation and shared visual system. Command centre, Market intelligence, Trading terminal, Portfolio lab, RIFT laboratory, Strategy foundry and Trade autopsy exist in the starting release. | `dist/app.js`, `dist/mark.svg`, `dist/style.css`. Route behavior exercised by `qa/journey.mjs`. Independent assessment of polish remains open. |
| W2 · pp. 5, 7, 9–11 | Explore instruments, track a watchlist, inspect price history and understand a sample portfolio. At least three meaningful interactions | Search and filters update the explorer, watchlist stars persist, chart range changes the selected history, and confirmed trades change holdings. | `qa/journey.mjs` exercises search, watchlist, chart controls, order submission and portfolio views. Verify filter combinations and empty results manually. |
| W3 · pp. 5, 9–10 | Simulated buy/sell ticket with quantity validation and confirmation | The preview computes portfolio changes. The ledger validates quantity, available funds or stock, and executable prices before simulated fills. | `tests/core.test.js` covers invalid orders, conditional execution, fees, partial closes and conservation. `qa/journey.mjs` goes through both confirmation dialogs. Tested. |
| W4 · pp. 2, 5, 7, 10–11 | Fictional prices, balances, charts and orders. Identify simulation. Exclude real trading, payments, secrets and sensitive financial data | Deterministic fictional tape, virtual rupee ledger and simulation labels. No deposit, withdrawal or brokerage workflow. | Inspect `dist/market.js`, `dist/ledger.js`, the account initialization test and served UI. Review the exact packaged archive separately for secrets before release. |
| W5 · pp. 5–7, 9–11 | Understandable to first-time users, working navigation, desktop/mobile layouts, consistent components, empty/error states. Bonus for keyboard access, contrast and labels | Sidebar and mobile menu share route controls. Form controls, order rejection messages, confirmation dialogs, empty cards and an in-app guide explain the workflow. | DOM journeys at 390/1440 CSS pixels cover actions and navigation. Pixel layout, contrast, keyboard focus, loading feedback and actual device use require the visual/manual checks in the demo guide unless separately evidenced. |
| W6 · pp. 2, 6, 11 | Review changes, test the journey, prepare a short demo, explain design choices and mention simulated data | Package scripts, deterministic account and the timed demonstration link the source, tests and interaction sequence. | Run the README testing commands and rehearse [Demonstration](DEMONSTRATION.md). A live walkthrough is prepared. An organizer-specific recording or presentation still depends on delivery instructions. |

## Problem-statement mapping

The product brief asks whether observable information can become a testable hypothesis and inform a controlled paper trade. This is a provisional user-supplied problem statement. Formal track alignment remains open until the organizer supplies its statement.

| User brief sections | User decision and testable evidence |
| --- | --- |
| II–III · discover an event and identify the affected entity | Trace an observation to its fictional source, observation time and entity identifier. Disable the source and inspect what changes. Repeated mentions of the same source should leave the distinct-origin count unchanged. |
| IV · formalize and test a claim | Read the null, alternative, window, control and falsification criteria. Run the statistical engine. Inspect count, effect size, multiplicity adjustment, evidence cutoff and status before taking the result into an experiment. |
| V–VI · measure risk and execute an experiment | Resize a simulated order and compare current and projected tail exposure. Check that reviewing or cancelling an order leaves available cash and shares intact. A confirmed fill updates both. |
| VI–VII · review the decision and its alternatives | Close a trade, inspect the entry-time assessment alongside subsequent outcomes and compare it with staying in cash and with the shadow strategy. Changing later prices should leave the earlier assessment intact. |
| VIII–XII · validate and present a repeatable result | Use aligned temporal splits for any measured baseline comparison. Show measured sample counts and keep proposed evaluations identifiable. Reproduce the event-to-autopsy journey without accounts or live feeds. |

## Prior art and scope of the contribution

TradingView provides simulated order execution, position tracking and history. QuantConnect documents slippage models, backtest drawdown and out-of-sample evaluation. Those capabilities establish a baseline for the ARENA functionality. [TradingView paper trading](https://www.tradingview.com/support/solutions/43000516466-paper-trading-main-functionality/) · [QuantConnect backtest results](https://www.quantconnect.com/docs/v2/cloud-platform/backtesting/results) · [QuantConnect slippage](https://www.quantconnect.com/docs/v2/writing-algorithms/reality-modeling/slippage/key-concepts)

GDELT separates events from multiple mentions and records the time of each published mention. OpenFIGI illustrates why instrument identity needs explicit identifiers and disambiguating context. These are precedents for ORACLE's provenance and entity-resolution design. [GDELT event/mentions codebook](https://data.gdeltproject.org/documentation/GDELT-Event_Codebook-V2.0.pdf) · [OpenFIGI identifier mapping](https://www.openfigi.com/api/documentation)

Event studies estimate outcomes relative to a defined benchmark over a specified event window. Benjamini–Hochberg addresses multiplicity under assumptions about dependence. Correlated announcements, reused controls and overlapping windows can undermine statistical interpretation. [MacKinlay, *Event Studies in Economics and Finance*](https://www.bu.edu/econ/files/2011/01/MacKinlay-1996-Event-Studies-in-Economics-and-Finance.pdf) · [Benjamini and Hochberg](https://doi.org/10.1111/j.2517-6161.1995.tb02031.x)

QUANTARA integrates source provenance, hypothesis testing, risk preview and an entry-time record with the subsequent simulated trade and autopsy. A reproducible synthetic result establishes that this pipeline executes for the tested fixture. Real-market predictive value, uniqueness and improved learner decisions each require additional evidence.

## Risk register

| Potential violation or failure | Mitigation and verification |
| --- | --- |
| Submitting under the wrong problem, format, access mode or time limit | Obtain the organizer's materials and resolve the official register above before claiming readiness. |
| Representing fictional or restricted data as verified intelligence | Demonstrate with clearly marked fixtures. Any future live adapter needs explicit rights for access, storage and redistribution, with attribution and retention rules. Passive infrastructure changes alone do not establish a breach. |
| Inflating evidence strength through republication, wrong entity matches or contradictory sources | Inspect provenance families, entity links, attribution and contrary evidence. Treat the reliability score as a documented rubric. |
| Hindsight leakage or misleading statistical claims | Freeze entry-time context, apply observation cutoffs and require whole outcome windows before testing. Document multiple comparisons, limited independent events and sensitivity to confounding. |
| Implying investment returns, learned skill or a competition advantage from synthetic scores | Report estimands, sample sizes and simulation assumptions. Show the cash comparison and costs. Reserve comparative performance claims for controlled benchmark results. |
| Confusing an order preview with execution, or corrupting ledger state | Keep confirmation explicit. Run accounting, conditional-order, retry/conflict and persistence checks and inspect cash/share reconciliation after the demo. |
| Inaccessible private URL, unreadable mobile screens or unavailable external service | Rehearse in a clean browser using permitted judge access. Keep a local run available, test narrow and wide viewports, and use the deterministic demo sources. |

## Project acceptance evidence

The expanded brief's engineering requirements are additional project acceptance criteria. The rows below specify what a reviewer can reproduce and identify coverage gaps. A passed check for an existing module does not verify an added integration.

| Brief and topic | Source or artifact to inspect | Verification and outstanding scope |
| --- | --- | --- |
| III, IV, IX, XII · ingestion, entity attribution and evidence | `dist/oracle.js`, ORACLE terminal | Toggle each fixture connector. Inspect matched IDs, distinct origins, timestamps and contrary evidence. Validate failure handling and source configuration with `tests/intelligence.test.js`. Live-provider access and licensing require separate evidence. |
| IV, IX, XII · testable hypotheses, registry and evidence-based status | `dist/ahead.js`, `dist/research-ui.js`, Hypothesis laboratory | `tests/intelligence.test.js` and `qa/research-journey.mjs` exercise the deterministic workflow. Check fully observed windows, multiple testing, sample count and duplicate evidence handling. A third-party model requires its own integration and evaluation. |
| V.1–2, XII · regime, calibration and dependency graph | `dist/market.js`, RIFT laboratory | Existing filter tests check normalized probabilities and deterministic synthetic calibration. Inspect actual state definitions, graph method, window and anomaly rule in README. Synthetic calibration does not establish accuracy on real data. |
| V.3–4, XII · risk and RIFT index | `dist/quant.js`, RIFT laboratory | Core tests cover fractional expected shortfall, normalization, missing data, configurable weights and future-data isolation. Record any gap between a fixed-portfolio stress estimate and an optimizer that selects weights. |
| VI, VI.1, X, XII · order lifecycle, persistence and preview | `dist/ledger.js`, `dist/app.js`, Trading terminal and Portfolio lab | Core accounting and conditional-order tests and the desktop/mobile DOM journey pass on the initial checkout. Repeat them on the release archive. |
| VI.2–3, XII · historical knowledge, autopsy and fair shadow comparison | Entry snapshots, ledger, Trade autopsy and Shadow portfolio | Core tests cover the entry/retrospective separation, cash accounting and sequential shadow history. Check that the displayed trade retains its linked ORACLE research context with `qa/research-journey.mjs`. |
| VII, X–XII · screens, navigation and reproducible source-to-trade demo | `dist/app.js`, `dist/research-ui.js`, `qa/journey.mjs`, `qa/research-journey.mjs`, [demo script](DEMONSTRATION.md) | Confirm all requested views, test mobile and desktop interactions, and perform the manual visual and accessibility review. The timed script specifies the offline route. |
| VIII · baselines, prior art and empirical claims | Research notes above, README methodology and `docs/BENCHMARK.md` | Re-run the benchmark using the recorded seed and split. Check which metrics have ground truth, what compute measure was used and which comparisons remain proposed. A held-out fixture result does not establish real-market advantage. |
| IX–XII · build, architecture, methods and submission artifacts | README, modules, registered checks, documentation and downloadable source | Reproduce the documented startup/test commands from clean source. Confirm archive integrity, screenshots where available and release-level results. Follow the official register before producing or uploading formal submission materials. |

At the pre-change audit, all 14 engine tests passed and the existing DOM journey passed at 390 and 1440 pixels. These observations establish the baseline revision only. The release's README, test suite and benchmark identify subsequent implemented behavior and measurements. Official compliance, team eligibility and acceptance of the final delivery format remain unresolved.

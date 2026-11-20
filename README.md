# QUANTARA

Understand the mathematics behind every trade.

QUANTARA is a browser-based educational paper-trading terminal. The account opens with ₹10,00,000 in fictional cash. Eight fictional instruments, a simulated index and a session clock support reproducible experiments. The app stores its account on the current browser origin. It requires no account credentials, data feed or brokerage connection.

[Presentation package](presentation/) · [Editable PowerPoint](presentation/QUANTARA.pptx) · [PDF slides](presentation/QUANTARA.pdf)

The site opens with a presentation guide. Select **View presentation (PDF)** to read the slides in a new tab, **Download PowerPoint** for the editable file, or **Continue to workspace** to enter the simulator. The footer keeps the slides and GitHub documentation available on every screen.

## Research-to-trade demonstration

Open **ORACLE terminal**, inspect the supplier disruption affecting Vyra Systems and select **Propose hypothesis**. In the hypothesis laboratory, **Run statistical test** compares Vyra with its sector peer before and after comparable observations. **Open paper experiment** carries the frozen evidence into the order preview and closing Trade Autopsy. **Shadow portfolio** compares the user account with a predefined risk-aware strategy.

~~~mermaid
flowchart LR
 O[ORACLE sources] --> E[Attributed event and evidence]
 E --> H[AHEAD frozen hypothesis]
 H --> T[Matched study and registry]
 T --> A[ARENA order preview]
 R[RIFT regime and graph risk] --> A
 A --> L[Confirmed paper ledger]
 L --> U[Trade Autopsy]
 R --> S[Shadow portfolio]
 S --> C[Portfolio comparison]
 L --> C
~~~

[Competition compliance](docs/COMPETITION_COMPLIANCE.md) · [Two-minute demo](docs/DEMONSTRATION.md) · [Implementation status](docs/RELEASE_STATUS.md) · [Four-way benchmark](docs/BENCHMARK.md) · [Graph methods](docs/GRAPH_METHODS.md)

## Optional configured sources and language model

Run **npm start** with Node 24 to use the local gateway at http://127.0.0.1:8000. The hosted demo uses offline fixtures. Keep provider configuration exclusively in the server environment.

- Set QUANTARA_MODEL_URL to an authorized HTTPS chat-completion endpoint and QUANTARA_MODEL_NAME to a model identifier. QUANTARA_MODEL_KEY is optional. In ORACLE select **Use configured model**. The server sends the fictional event type, issuer, peer and design. Provider failure falls back to the fixed proposal.
- For CORPORATE, SOCIAL, INFRASTRUCTURE, LOGISTICS and MARKET configure QUANTARA_&lt;CHANNEL&gt;_URL and QUANTARA_&lt;CHANNEL&gt;_LICENSE with an authorized normalized fictional feed and its license. Locally use **Configure sources → Sync a configured source**. The hosted app also accepts local JSON. See the [sample batch](dist/sample-observations.json). Imported IDs and original-source IDs begin with local-. Timestamps use simulated sessions.
- Source requests cache successful responses for 60 seconds, combine concurrent reads, retry transient server errors once and observe rate-limit cooldowns. Source selections and imported records persist with the account.

## AHEAD and evidence interpretation

ORACLE extracts three event classes using a fictional entity directory and explicit classification rules. Each record has an original-source ID, attributed issuer, excerpt, event time, publication time and observation time. ERI groups shared origins before combining authority, attribution, publication lag, corroboration and contradiction. Extraction confidence and ERI are heuristic evidence indicators.

Each proposal freezes its eligible cases and source evidence. AHEAD compares five sessions before and after the first supporting observation against a fixed same-sector peer. Supplier cases measure mean absolute daily returns as a volatility proxy. The other two families measure mean daily returns. Up to 48 non-overlapping, mature cases are eligible. A two-sided sign-flip test enumerates assignments through 13 cases and uses 4,096 seeded permutations above that. Percentile intervals resample cases 2,000 times. Benjamini–Yekutieli adjusts across all three fixed families at that cutoff. Six cases are required for a decision. A significant opposite-signed effect rejects the proposal. Cross-cutoff searches and confounding limit inference. A later withdrawal retains the original test and trade snapshots.

## Run and test

Use Python 3 to serve the static application. From the project directory run:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. The application has no runtime package dependencies. For the engine tests use Node.js 24 or later. The interface journey tests also require the development dependencies.

```sh
npm test
npm ci
npm run test:ui
```

The deployed guide includes a downloadable copy of this project. Local state is isolated by browser, device and origin. Resetting the account requires confirmation inside Simulation guide.

## Try one complete decision

1. Open Market intelligence. Search for a symbol and use the star control to add it to the watchlist.
2. Select its name to open the terminal. Enter a quantity and inspect current and projected risk. Review and confirm the simulated buy.
3. Advance the session to roll prices forward by one fictional weekday. Pending orders are checked in submission order.
4. Sell part or all of the position. Trade autopsy displays the original assessment, execution costs and alternative outcomes.
5. Compare the actual account with the predefined shadow strategy in Portfolio lab. Run a Foundry experiment and inspect how evidence coverage affects the RIFT Index.

## Architecture and contracts

The initial repository audit found the supplied brief and workshop material, with no application source or build system. The new project uses native browser modules. The first milestone was a price tape and ledger, followed by risk calculations and frozen decision snapshots, then the seven screens and journey tests. This architecture keeps the workshop usable offline after downloading and serving the project.

| Module | Responsibility and interface |
| --- | --- |
| dist/market.js | makeTape(seed) creates a deterministic business-day price source. at(day) and window(end, count) return daily bars, index and posterior probabilities. A single shared tape supplies all local operations. |
| dist/ledger.js | account(), place(state, order), projected(state, order), cancel(state, id) and advance(state) implement the lifecycle. projected operates on a clone. The ledger records order IDs, submission dates, statuses, fill amounts and costs, proportional entry lots and closing reports. |
| dist/quant.js | Pure portfolio marks, risk functions, component scores, strategy backtests and block-bootstrap scenarios. Monetary returns are in rupees. Risk and return metrics are fractions before UI formatting. |
| dist/app.js | Navigation, forms, interactive charts, persistence and access to application screens. State mutations are made on a fresh copy, then committed as a single localStorage value. Web Locks serialize writes across tabs in supported browsers. Storage events refresh other tabs. |
| dist/ui.js and style.css | Reusable formatters, chart primitives, symbols and responsive presentation. |
| tests and qa | Deterministic unit tests plus end-to-end DOM interaction checks at 1440 px and 390 px. |

An order contains instrument index, side, type, whole-share quantity and an optional trigger price. An order can fill immediately or remain open. Open orders can fill, be cancelled or be rejected when a later executable close lacks sufficient holdings or cash. Executions use chronological submission order. Open orders do not reserve funds. The account currently supports long positions and cash. The fee-inclusive cost basis uses average cost. A partial close removes the same fraction from every entry lot and rounds the aggregate released basis to the nearest paisa.

## Methodology

**Fictional market.** A seeded generator emits a market factor with three latent Gaussian return states. Bullish, bearish and high-volatility states have daily mean/standard-deviation pairs of (0.22%, 0.50%), (−0.26%, 0.60%) and (0%, 1.70%). A persistent three-state transition matrix governs the regime. Each instrument adds common sector and individual shocks. The fictional QX Composite tracks the market factor. OHLC bars and weekday dates form a teaching market without exchange holidays, corporate actions or dividends. The fixed universe avoids selection on subsequent returns. It cannot reproduce real listing and delisting outcomes.

**Execution.** Orders execute at simulated daily closes. Market fills apply adverse slippage of 3 basis points and a 5-basis-point fee to the filled notional, rounded to paise. A limit order checks its executable price after slippage against the limit. Stop orders trigger on the close and then take the slipped close, so gaps can move the fill away from the trigger. Bar highs and lows do not trigger intraday orders. The impact preview of an untriggered order is conditional on a hypothetical immediate fill at its trigger reference price. Pending limit previews set the slipped fill to the execution limit. The preview marks all holdings in that instrument at the scenario reference close.

**Regime model.** The Bayesian filter predicts each state's prior from the previous posterior and transition matrix, then updates with the Gaussian likelihood of the observed index return. The laboratory reports a 120-session multiclass Brier score, counts of changes to the most probable state, and confidence-bin counts, mean probability and observed hits. Lower Brier is better. Four independent synthetic seeds, evaluated over 120 sessions ending on session 220, gave rounded Brier scores of 0.241, 0.230, 0.428 and 0.191 against 0.667 for a uniform forecast. These are matched-model synthetic checks. Real-market calibration remains unmeasured.

**Dependency network.** Rolling 45-session correlations supply weighted edges above 0.52. New trade previews use modularity communities. Archived entry clusters retain their recorded membership. The RIFT laboratory reports weighted degree, adjusted Rand stability and out-of-training Isolation Forest scores. Its allocation experiment uses graph density and state similarity to set scenario probability caps. See [graph methods](docs/GRAPH_METHODS.md).

**Risk.** The engine applies current marked asset weights to the trailing 120 aligned return observations. Cash earns zero. Annualized volatility uses the sample standard deviation times √252. Historical daily VaR uses the inverse empirical CDF at 95%. Expected shortfall averages exactly the worst 5% of probability mass with fractional boundary weight. Loss displays are floored at zero. For robust ES, alternative distributions live on the observed days with each probability capped at 2/N. The worst-case tail occupies the worst 0.05N/2 observations. Sorting solves this fixed-portfolio evaluation in O(N log N). Concentration is the sum of squared instrument weights relative to total equity. Drawdown uses the actual account's peak-to-trough equity loss, including the initial cash baseline. The selectable stress shock applies a common instantaneous price move to held assets.

**RIFT Intelligence Index.** The default preference weights are 20/25/25/20/10. Each component is clipped to [0,100]. Define E as total exposure, P as current bullish probability, w as the new instrument weight and c(x) as clipping to [0,100]. Regime alignment is c(100 × (1 − max(0, E − (0.25 + 0.60P)))). Resilience is c(100 × (1 − annualized volatility/0.40)). Robustness is c(100 × (1 − robust daily ES/0.06)). The decision score is 40% alignment, 30% robustness and 30% concentration quality. Concentration quality is c(100 × (1 − max(0,w − 0.20)/0.80)). Regime alignment and decision quality average the latest 20 filled buys' submission-time assessments. The strategy component uses the last completed experiment. Evidence-free components are omitted and the available weights are renormalized. The screen exposes coverage and sample size. Flat cash accounts have no exposure evidence. Scores are recorded per session under the weights effective at that time. A new experiment or weight change updates the current session. The scales and weights are illustrative preferences with overlapping risk exposures, and prediction of profitability has not been validated.

**Trade Autopsy.** On submission and fill, the ledger freezes the relevant risk, regime, allocation, cluster membership and quality information for buys. Conditional orders retain the submission assessment through execution. A sale reports proportional entry-cohort statistics, net realized P&L and fees. Only the retrospective calculations read later observed prices. Alternatives include a half-sized whole-share position, one-session delayed entry, previous-session exit and cash. Half sizing scales the actual net outcome by floor(q/2)/q. A delayed entry that would occur after the sale stays in cash. The early exit is bounded below by entry. Hypothetical timing changes use the same fee and slippage schedule, with fractional cohort attribution under average-cost accounting. Standalone alternatives hold the rest of the account fixed and do not simulate counterfactual budget constraints or downstream orders. Hindsight utility is P&L − 0.5 × max(0, −P&L). Regret is best alternative utility minus actual utility, in rupee-equivalent units.

**Strategy Foundry.** Long/cash momentum and mean-reversion rules compare the close with a trailing mean. Buy-and-hold provides a baseline. Signals are marked at today's close and earn the next close-to-close return. This assumes execution at the observed close and omits decision latency. Single-instrument strategy series apply an 8-basis-point proportional round of costs per change in exposure, plus a user cost increment, including final liquidation. The backtest uses 120 returns and sufficient warm-up observations. Circular five-day block bootstrap resamples the net strategy return series, producing 300 fixed-seed paths. It preserves local return dependence but does not reconstruct hypothetical OHLC paths or retrain a rule on them. The display includes the median and 5th/95th return quantiles, median and 95th drawdown, historical annualized zero-rate Sharpe, and positive-path frequency with a Wilson interval. The interval estimates Monte Carlo frequency uncertainty conditional on the observed series. Lookback sweeps use ±3 sessions. Strategy stability equals clipped 100 × positive-path frequency × (1 − min(1, return range across those lookbacks)). Comparisons retain the last 20 runs.

**Shadow portfolio.** At inception and every five sessions, the benchmark allocates 20% + 50% × bullish probability to risky assets in proportion to inverse 30-session volatility. It rounds to whole shares and pays the same execution costs as the user. Returns for regime-specific comparisons use the regime at the beginning of each interval. The shadow-minus-actual wealth gap measures the difference between whole-account paths. The trade-level regret figure uses its separate explicit utility definition.

## Implementation status

The release adds ORACLE, Hypothesis laboratory and Shadow portfolio to the previous seven views. The [implementation report](docs/RELEASE_STATUS.md) identifies tested features, access-dependent integrations, deferred work and verification limits. Formal submission requirements remain open in the [compliance register](docs/COMPETITION_COMPLIANCE.md).

## Further experiments

Compare the fixed-weight tail estimates across independent paths and regime changes. Evaluate thresholds and graph stability on held-out seeds. Check whether showing the pre-trade risk change improves sizing decisions in a controlled workshop exercise. Compare Foundry strategies out of sample before interpreting repeated parameter searches as evidence of an edge.
## Research context

TradingView documents practice orders, open positions, commissions and trading history. QuantConnect documents backtest equity curves, drawdown, slippage models and out-of-sample evaluation. A profitable paper trade alone gives little information about the quality of its entry or the risk it added. QUANTARA's design connects the risk preview, the entry-time assessment and the closing autopsy through one simulated ledger. These are product integration choices. Comparative educational benefits would require a user study. [TradingView paper trading](https://www.tradingview.com/support/solutions/43000516466-paper-trading-main-functionality/) · [QuantConnect backtest results](https://www.quantconnect.com/docs/v2/cloud-platform/backtesting/results) · [QuantConnect slippage models](https://www.quantconnect.com/docs/v2/writing-algorithms/reality-modeling/slippage/key-concepts)

### Quantitative design alternatives

- **Historical tail loss.** For a confidence level of 95%, expected shortfall averages the worst 5% of the empirical loss probability mass. With 50 days, average the two greatest losses and half the third, dividing the result by 2.5. This handles small samples and tied observations. Sparse tails leave significant estimation uncertainty. [Rockafellar and Uryasev, *Conditional Value-at-Risk for General Loss Distributions*](https://sites.math.washington.edu/~rtr/papers/rtr187-CVaR2.pdf)
- **Distributional ambiguity.** One finite-sample extension allows each of N observed scenarios probability up to κ/N, with κ ≥ 1 and probabilities summing to one. To maximize expected shortfall, place the largest admissible probabilities on the largest losses. The resulting 95% tail mean covers the worst 0.05N/κ observations, including fractional weight at the boundary. κ = 1 recovers the empirical estimate. Sorting costs O(N log N). The cap is a stress assumption unless independently calibrated. A finite support cannot introduce an unseen crash, so separate price-shock scenarios are useful.
- **Strategy resampling.** Sampling contiguous blocks preserves within-block serial dependence. Fixed block length makes the local dependence horizon explicit. An established alternative draws geometrically distributed lengths. Changing regimes, a short price history and parameter selection can all undermine inference. The 5th–95th percentile of simulated path returns describes a range of outcomes. A confidence interval needs a named estimand, such as the simulated positive-path probability, and an explicit construction. [Künsch on fixed-block bootstrap](https://doi.org/10.1214/aos/1176347265) · [Politis and Romano on stationary bootstrap](https://doi.org/10.1080/01621459.1994.10476870)
- **Regime validation.** For a synthetic market with recorded latent states, score each filtered probability vector against its simulated state. Average the squared differences across state indicators and compare that multiclass Brier score with a fixed prior. Group probabilities by confidence to compare estimated and observed frequencies, record the sample counts, and include paths generated using independent seeds. Brier score mixes reliability and discrimination. Small bins give imprecise estimates. If the simulator has no reference states, report posterior stability and explicitly mark calibration as unmeasured. [Probability calibration](https://scikit-learn.org/stable/modules/calibration.html)
- **Testing decision quality.** Freeze the price-history cutoff, market state, portfolio weights and prospective decision score at entry. Compare the trade with prespecified alternatives after it closes using identical execution assumptions. Audit for leakage by varying all future prices and requiring the entry score to stay identical. A composite score needs coverage disclosure because several components can share exposure to a single risk factor. Its proposed weights are educational preferences pending independent validation.

## Release checks and packaging

With Node 24, Python 3 and the development dependencies installed, run:

~~~sh
npm ci
npm test
npm run test:ui
npm run benchmark
npm run build
~~~

The build checks every browser module and generates a reproducible portable source ZIP under dist/. The ZIP includes the research scripts, tests, demonstration guide and compliance register. Local gateway integration tests start a short-lived loopback server on an ephemeral port.

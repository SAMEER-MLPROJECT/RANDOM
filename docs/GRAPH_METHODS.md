# RIFT research methods and replication

## Reading an initial session

For the fictional market at session 180, the five-state filter assigned 55.06% to bullish trend, 14.55% to bearish trend, 15.96% to mean reversion, 0.88% to high volatility and 13.55% to low volatility. Its predictive 90% return interval contained 108 of the previous 120 observed returns. NetworkX found seven communities among eight assets. An Isolation Forest flagged 15 of 28 pairs on that close. Those pairs share assets and a common market factor. One unusual market day can generate multiple flags.

The 60%-invested allocation study yielded the following daily loss estimates. All estimates reuse historical fictional data available at the close.

| Candidate | Empirical 95% ES | Worst-case 95% ES | Worst expected daily return | Objective |
| --- | ---: | ---: | ---: | ---: |
| Equal weight | 1.5652% | 1.5699% | −0.1180% | −0.5104% |
| Inverse volatility | 1.5621% | 1.5675% | −0.1183% | −0.5101% |
| Community balanced | 1.5796% | 1.5802% | −0.1174% | −0.5124% |

Inverse volatility ranked first among those three candidates by a small margin. The study excludes turnover, execution costs and parameter estimation error. A different session, allowable set or preference can change the ranking.

## Five-state Bayesian filter

The observation is the simple close-to-close return of the fictional market index. Each hidden state persists with probability 0.94 per session and transitions to each of the other four states with probability 0.015. Initial probabilities are uniform. Conditional emissions are normal.

| State | Conditional daily return mean | Daily standard deviation |
| --- | ---: | ---: |
| Bullish trend | 0.22% | 0.50% |
| Bearish trend | −0.26% | 0.60% |
| Mean reversion | −0.55 × previous return | 0.55% |
| High volatility | 0 | 1.70% |
| Low volatility | 0 | 0.25% |

The update multiplies the transition-predicted prior by the return likelihood and normalizes in log space. At each close, the pre-observation mixture CDF gives a probability integral transform. Values between 0.05 and 0.95 count towards central 90% predictive coverage. A trailing count captures recent return-interval behavior as the market changes. This statistic evaluates one-step returns. The original simulation contains only three latent-state labels, so five-way state accuracy cannot be measured on the displayed tape.

A separate matched-model experiment generates 20 independent 400-session paths with seeds 100–119. It skips the first 100 sessions of each path for state scoring. Across 6,000 labelled observations, multiclass Brier score was 0.3639 against 0.8000 for a uniform forecast. The top-state hit rate was 74.55%. Two nonoverlapping 120-session prediction intervals per path gave pooled return-interval coverage of 89.60%. These measurements check filter implementation under a known model. Parameters were specified for illustration and have not been fitted to real prices.

| Top-state confidence bin | Count | Average confidence | Observed hit rate |
| --- | ---: | ---: | ---: |
| 0–20% | 0 | — | — |
| 20–40% | 343 | 35.16% | 36.44% |
| 40–60% | 1,322 | 50.46% | 52.50% |
| 60–80% | 1,615 | 70.56% | 70.03% |
| 80–100% | 2,720 | 91.22% | 92.76% |

The original three-state posterior and stored trade snapshots remain interpretable under their original model. The five-state view is an additional research diagnostic.

## Financial communities and relationship anomalies

For each close, compute Pearson correlations from the latest 45 aligned daily asset returns. Build an undirected weighted graph on the fixed universe. Edges require positive correlation of at least 0.52. Louvain maximizes modularity heuristically with resolution 1 and random seed 21. Each community takes the index of its lowest-numbered member as its display label. Degree centrality is the sum of incident edge weights divided by seven, the maximum number of neighbors. Adjusted Rand index compares the current partition with the partition 45 sessions earlier. It is invariant to swapping community names. Small samples can cause abrupt partition changes near the edge threshold. [NetworkX Louvain](https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.community.louvain.louvain_communities.html) · [Adjusted Rand index](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.adjusted_rand_score.html)

The exporter uses the unchanged browser tape through Node and calculates each graph using its own date cutoff. It ships 456 NetworkX partitions spanning sessions 90–545. Outside that range the browser maximizes the same modularity objective by enumerating all partitions of eight assets. Different optimality and tie handling can change the partition at the method boundary. The displayed method identifies which solver produced the result.

A scikit-learn Isolation Forest uses current and previous nonoverlapping 45-session correlations, their signed difference and the Fisher-transformed difference scaled by √(2/42). Its 504 training pair windows are 28 pairs across 18 closes, every fifth session from 94 through 179. Training rows share assets and overlapping windows. The assay uses 32 trees, a subsample of 96, seed 92031 and a fixed five-percent training contamination assumption. Larger browser scores correspond to shorter isolation paths. The trained threshold and tree splits are frozen. The browser uses these trees only after session 179. A regression test compares all 28 day-180 scores with scikit-learn. The contamination assumption describes a training cutoff. The downstream daily flag rate can be much higher. Detection precision has not been established against labelled market anomalies. [Isolation Forest](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html)

## Regime- and graph-conditioned risk comparison

Three long-only allocations share a 60% invested budget by default. They are equal asset weight, inverse trailing 120-session volatility, and equal budget per financial community with inverse-volatility weights inside each community. The remaining allocation earns a zero cash return. Holding exposure fixed allows the study to compare risk allocation across assets. The comparison optimizes only over these three candidate portfolios.

Let N be the number of observed daily return scenarios, up to 120. Denote the five-state posterior on decision day by S. For historical scenario i, its starting-close posterior is Sᵢ. Give it an affinity proportional to 0.5 + Sᵢ·S, normalized to pᵢ. Define κ = 1 + probability of high volatility + current graph edge density. The feasible scenario probabilities sum to one, with bounds 0 ≤ qᵢ ≤ max(1/N, κpᵢ). The uniform historical law always fits. Similar states get more room for reweighting. Graph density and volatility belief control the breadth of the uncertainty set. These are explicit stress assumptions with no claim to empirical optimality.

The utility for each candidate is expected return minus 0.25 times the 95% ES of loss. Sort scenarios by candidate return from worst to best and fill probability mass up to each cap until total mass reaches one. This ordering simultaneously minimizes the mean return and maximizes loss ES by first-order stochastic dominance. Integrate exactly 5% mass, splitting the boundary scenario if needed. Select the candidate with the largest resulting worst-case utility. Each comparison takes O(N log N) time per candidate. It can redistribute only observed returns. The account's separate stress control can represent an unseen market shock.

## Replication

Runtime calculations and exported forest scores work offline. From the repository root, run:

```sh
node --test tests/graph.test.js
node research/graph-regimes.mjs
```

To regenerate the forest and NetworkX reference data, use Node 24 and a local Python 3.12 virtual environment:

```sh
python -m pip install -r research/graph-requirements.txt
python research/graph-models.py
node --test tests/graph.test.js
```

The generator uses the published fictional seed. It writes dist/graph-data.js and prints the initial community stability and count of anomaly flags.

# Four-condition QUANTARA benchmark

The price-only rule returned **18.53%** over the held-out fictional path. The integrated rule returned **16.17%** and correctly called **58.09%** of its positive forecasts. All five prespecified return comparisons had a Benjamini–Hochberg adjusted p-value of 0.703. This experiment provides insufficient evidence of a return advantage for any augmentation.

## Reproduce

From the repository root, run the command below with Node.js 24 or later. The script imports the shipped ORACLE registry, RIFT regime and graph models, price tape, expected-shortfall function and execution quote. It writes one JSON object with split metadata, model dimensions, execution metrics, contrasts, diagnostic worlds and timings. The experiment needs no network, model service, database or package installation. Financial and statistical outputs are deterministic. Runtime measurements depend on the machine and cache state.

```sh
node research/benchmark.mjs
```

## Frozen protocol

All four rules observed the same eight continuously listed fictional equities on seed 27041. Each training observation used a decision close from sessions 150–435, every five sessions. The last training outcome ended at close 440. Test decisions used sessions 445–740 every five sessions, through the final sale at 745. This produced 464 training and 480 test instrument-windows. Test windows share market conditions across instruments. The 300 test sessions form one continuous market path.

The research question was whether the extra inputs improve a forecast of a profitable five-session paper round trip. The binary label uses actual simulated buy and sell quotes for ten shares. Features, event observation cutoffs and rolling price windows end at or before each decision close. Each arm fits its own ridge logistic model on training rows only. The intercept is unpenalized. Inputs use training means and sample standard deviations. Each fit uses 140 full-batch steps, learning rate 0.35 and ridge coefficient 0.08.

| Arm | Information and transformation |
| --- | --- |
| A · Price | Twenty-session log price momentum. |
| B · Price and conventional risk | A plus the trailing 120-session sample return deviation and empirical 95% expected shortfall. |
| C · Price, news and sentiment | A plus three event-family channels and a signed public-discussion feature. Each corporate or social record contributes to its event-family count. A supporting earnings post has positive polarity and a supporting disruption or outage post has negative polarity. Disputing posts reverse the sign. The social channel averages observed stances per event. |
| D · ORACLE and RIFT | B plus the three event-family channels weighted once per event by its as-of ERI using all enabled source types, the public-discussion feature, five filtered regime probabilities, robust expected shortfall at twice the uniform scenario-probability cap, and 45-session thresholded weighted graph centrality. |

Event features use linearly decreasing weights over 18 sessions. Syndicated mentions can increase counts in C. D's ERI accounts for shared origins and disputes. Family labels, sentiment polarity and source authority come from the fictional fixture design. The market generator contains no programmed causal effect from these fixtures.

Each arm starts with ₹10,00,000. At every decision close it allocates at most 80% of marked cash, equally among the two highest probabilities of at least 0.50. One qualifying instrument receives the whole budget. Empty selections stay in cash. Trades use whole shares, 3 bps adverse slippage, 5 bps fees per side and ledger paise rounding. Positions are marked daily and fully liquidated at the fifth close, including when the same name is selected again. Cash pays zero interest. Close-price signal and execution assume zero decision latency.

## Held-out measurements

Directional precision counts positive forecasts among all 480 asset-windows before portfolio ranking. The observed positive base rate was 55.42%. ECE weights the absolute probability-versus-hit-rate gap in five equal-width bins. Brier scores use all observations. Daily ES averages the worst 5% of 300 net portfolio returns. Drawdown uses the daily marked path with the initial capital as an initial peak.

| Arm | Net return | Daily ES 95% | Max drawdown | Positive calls correct / total | Precision | Brier | ECE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 18.53% | 1.54% | 8.80% | 265 / 475 | 55.79% | 0.2499 | 3.72% |
| B | 15.69% | 1.48% | 12.15% | 259 / 465 | 55.70% | 0.2500 | 3.11% |
| C | 15.41% | 1.56% | 9.19% | 261 / 462 | 56.49% | 0.2499 | 4.59% |
| D | 16.17% | 1.52% | 10.35% | 237 / 408 | 58.09% | 0.2471 | 4.88% |

| Arm | Net return at cutoff 0.45 | Net return at cutoff 0.55 | Net return with 10 extra bps per side | Nominal simulated fees + slippage |
| --- | ---: | ---: | ---: | ---: |
| A | 18.53% | 16.50% | 7.63% | ₹82,024 |
| B | 15.69% | 14.73% | 5.09% | ₹80,830 |
| C | 15.41% | 16.55% | 4.82% | ₹83,246 |
| D | 16.17% | 10.91% | 5.60% | ₹80,880 |

## Statistical discovery and uncertainty

The family comprises five directional hypotheses that the first arm has greater mean five-session net return than the second. Contrasts pair the same test windows. Ten consecutive six-window blocks preserve contemporaneous dependence between arms and within-block time dependence. We enumerate all 1,024 common block-sign assignments against the one-sided zero-effect null, apply BH at 5%, and also bootstrap 2,000 joint block resamples for unadjusted 95% percentile intervals. Exchangeability of signs and approximately independent blocks are assumptions. Ten blocks give limited power, and the intervals can be unstable.

| Contrast | Mean excess return per 5 sessions (bps) | 95% block interval (bps) | One-sided p | BH-adjusted p |
| --- | ---: | ---: | ---: | ---: |
| B − A | −4.16 | [−21.79, 12.75] | 0.671 | 0.703 |
| C − A | −4.54 | [−19.27, 9.54] | 0.703 | 0.703 |
| D − A | −3.51 | [−19.72, 8.85] | 0.591 | 0.703 |
| D − B | 0.65 | [−17.50, 19.92] | 0.468 | 0.703 |
| D − C | 1.03 | [−25.48, 21.89] | 0.466 | 0.703 |

There were zero discoveries on the original path, so observed discovery precision has no denominator. To evaluate the testing procedure with known truth, the script creates 64 reproducible sign-randomized versions of the joint block contrasts. In the global-null condition, 2/64 worlds made discoveries and mean false discovery proportion was **3.13%**. In a separate positive control, each world adds a common **23.46 bps per five-session window** to D's conditional mean relative to the other rules. The shift equals one root-mean-square D–A block contrast. Three of the five hypotheses then have planted effects by construction.

| Diagnostic for hypothesis discovery | Global null | Planted D uplift |
| --- | ---: | ---: |
| Worlds making at least one discovery | 2 / 64 | 40 / 64 |
| Mean false discovery proportion over all worlds | 3.13% | 4.43% |
| Mean discovery precision among worlds making discoveries | 0.00% | 92.92% |
| Mean fraction of three planted hypotheses detected | N/A | 48.44% |

These diagnostics reuse one residual path and a finite selection of sign assignments. They characterize this test under its assumed perturbations. Causal precision and FDR for explanations of actual corporate events remain unmeasured.

## Computational cost

One process on Linux x64, Node v24.22.1 and an AMD EPYC 9V74 measured the following elapsed times. Inference covers feature extraction and prediction of 480 held-out rows with markets already generated. Total time also includes training, diagnostics of forecast quality, execution and the three perturbation portfolios. The separate family-level significance analysis is excluded from per-arm timing. Process CPU time includes user and system time. Sequential runs can share fixture caches and runtime warmup, so latency figures are illustrative.

| Arm | Input features | Fit + evaluation wall time | Held-out feature + inference wall time | Fit + evaluation process CPU |
| --- | ---: | ---: | ---: | ---: |
| A | 1 | 10.49 ms | 0.36 ms | 18.18 ms |
| B | 3 | 41.26 ms | 11.38 ms | 49.64 ms |
| C | 5 | 25.60 ms | 6.80 ms | 51.81 ms |
| D | 14 | 125.64 ms | 72.48 ms | 161.05 ms |

The constant positive base rate, price-only momentum, cyclical fixture cadence, overlapping economic risk factors and one selected path all limit interpretation. The benchmark tests feature sets under an explicit learned trading policy. The interactive AHEAD registry answers separate event-study hypotheses. A prospective study would need independently timestamped licensed events, frozen entity mappings, point-in-time membership, a dated preregistration and independent market periods before any claim of a real trading or discovery advantage.

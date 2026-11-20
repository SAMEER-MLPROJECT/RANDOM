# Demonstrating QUANTARA

**Audience:** a reviewer seeing the fictional market for the first time. **Goal:** follow one supplier disruption from evidence to a closed paper position and recover the information available when the order was placed.

Use a fresh browser profile or a separate origin for the demonstration. It starts with ₹10,00,000 in virtual cash. Leave the default fictional data sources enabled. The built-in hypothesis proposer and the statistical test run without external accounts. Rehearse once with the same starting state. The two-minute timing follows the workshop's page 11 guidance. The competition's recording requirements are unknown.

## Two-minute walkthrough

| Time | Action | Suggested narration |
| --- | --- | --- |
| 0:00–0:14 | On **Command centre**, point out the fictional data label and virtual cash. | “A paper trade can make money even if the evidence behind it was weak. QUANTARA lets us recover exactly what we knew when we took the risk.” |
| 0:14–0:29 | Open **ORACLE terminal**. Select a **Supplier disruption** event. Show the attributed entity, timestamp, source and evidence. | “This supplier disruption is fictional. ORACLE links the observation to its source, AHEAD turns it into a test, and RIFT shows the portfolio consequences before any shares change hands.” |
| 0:29–0:46 | Select **Propose hypothesis**. In **Hypothesis laboratory**, show the expected effect, control and observation window. | “The claim must name an outcome and what would count against it. Reprints of the same report share an origin.” |
| 0:46–1:02 | Select **Run statistical test**. Read the displayed status, count and effect estimate. | “These results use the completed observations available at this session. A small sample can leave the answer inconclusive. Either way, we can test our decision with virtual capital.” |
| 1:02–1:25 | Select **Open paper experiment**. Keep **Buy / Market** selected. Enter 5 shares, then 10. Point to the current and projected risk in **Decision impact preview**. Select **Review buy order**, check the estimate and select **Confirm paper buy**. | “The research follows this ticket. Doubling the shares changes portfolio exposure. The confirmation includes the simulated fill and fee.” |
| 1:25–1:43 | Select **Advance session** once. Choose **Sell / Market**, set quantity to 10, then **Review sell order** and **Confirm paper sell**. | “One simulated close has elapsed. We can now observe an outcome that was unavailable when the order was placed.” |
| 1:43–2:00 | Open **Trade autopsy** and show entry evidence, realized P&L, the alternative size and **Stay in cash**. | “The net result includes execution costs. These alternatives use hindsight. The saved entry assessment lets us evaluate the original choice using the information the user actually had.” |

## Technical walkthrough

Allow approximately eight minutes for a live technical review. The times are rehearsal targets.

1. **Source to entity · 1 minute.** In ORACLE, inspect publication and observation times, entity attribution, source origin and conflicting evidence. Change one source's enabled setting, observe the resulting evidence set, then restore it. Identify one relationship that is explicit in the fixture. Record the event and entity identifiers that will appear in the experiment.
2. **Hypothesis to test · 90 seconds.** Open the proposed claim, name the null and alternative, and read the control, window and confounders. Execute the test. Explain the displayed sample size, effect estimate, uncertainty and adjusted decision. State which assumptions the procedure makes about controls and independent observations. Use the actual result even when it weakens the story.
3. **Risk at decision time · 90 seconds.** Open the paper experiment. Compare two whole-share quantities. Read the projected cluster allocation, conditional value at risk and robust downside estimate. In **RIFT laboratory**, compare filtered regime probabilities and nominal versus robust expected shortfall. Check model coverage before interpreting RIFT Intelligence Index changes. Return to the linked hypothesis to reopen its paper ticket if needed.
4. **Fill, chronology and reconciliation · 90 seconds.** Submit and confirm a market buy. In the ledger, reconcile the drop in cash with the fill notional plus fees. Advance a single session. Sell the same quantity and compare realized P&L with the change from opening virtual wealth. Reload the page and inspect the orders again. Explain the difference between the time information became observable and the later time when the trade closed.
5. **Outcome comparisons · 1 minute.** In **Trade autopsy**, inspect the frozen research context and compare actual utility with staying in cash and half sizing. Open **Shadow portfolio** and compare the separate reference account across the same sessions. A benchmark comparison measures differences under its specified strategy, costs and exposure.
6. **Stress and reproducibility · 90 seconds.** In **Portfolio lab**, inspect the scenario control with a held position if demonstrating a nonzero stress loss. In **Strategy foundry**, run the same strategy twice with the same settings and compare the simulation summaries. Show the README methods, relevant automated test output and the benchmark's measured scope. Quantify uncertainty with the displayed sample and distinguish a simulated path range from uncertainty about a parameter estimate.

## Pre-submission checklist

- [ ] Obtain the competition name, edition, track, official problem statement, rulebook, eligibility/IP terms, rubric, due time and portal. Reconcile them with [the compliance register](COMPETITION_COMPLIANCE.md).
- [ ] Confirm required language, team details, filenames, accepted file types, maximum sizes, demonstration duration, AI-use disclosure and exact slide or application template.
- [ ] Install documented dependencies in a fresh checkout. Start the app per README. Run the documented engine and UI checks. Archive output with the actual release revision.
- [ ] Rehearse the ORACLE → AHEAD → RIFT preview → confirmed order → autopsy journey from a fresh account. Verify evidence lineage, sample cutoff, explicit simulation, fees and net P&L.
- [ ] Exercise desktop and narrow-screen routes in a real browser. Check focus and dialog dismissal using only a keyboard, chart and table overflow, readable contrast, error messages and focus restoration. Capture permitted screenshots of this revision.
- [ ] Test the judge's access path using an appropriately authorized account. Try the documented local fallback. Confirm whether the portal accepts a private URL, source archive, video or another artifact.
- [ ] Review the exact archive for secrets, browser data, licensed assets and unexpected files. Check that the included source, demo and measurements match the release. Attribute third-party components and record any use of historical work or AI assistance as required.
- [ ] Confirm all claims against evidence. Record any untested features or missing rules. Complete the organizer's template if provided and keep the submission receipt.

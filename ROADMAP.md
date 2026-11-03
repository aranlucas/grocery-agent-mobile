# Grocery Agent mobile feature roadmap

Updated 2026-10-26. Proposed sequence, not delivery dates. Success targets below are unvalidated pilot gates, not adoption or revenue results.

A household wants to finish the weekly shop from a phone, adapt the plan when something changes, and avoid buying the same item twice.

## Prioritized releases

| Order | Feature                                          | Useful scope                                                                                                                 | Release acceptance                                                                                                                     |
| ----- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Now   | An in-store list that survives poor connectivity | Keep check-offs and deliberate edits available during a connection loss, then reconcile them visibly with household changes. | Two shoppers can resume after an outage without lost edits or duplicated quantities; uncertain changes ask for resolution.             |
| Next  | Change one meal without rebuilding the week      | Show the ingredient/product delta when servings or a meal changes, preserving pantry deductions and manual exclusions.       | The shopper reviews only the affected items and can explain the new quantities before any cart operation.                              |
| Next  | A clear product/substitution decision            | Present unavailable/unmatched ingredients, estimated basket cost and individual substitution approvals in the phone flow.    | The user can resolve the queue, distinguish unknown prices from zero and confirm exact cart additions once.                            |
| Later | Repeat a good week                               | Reopen a successful plan with updated availability and a concise review of what changed.                                     | Saved preferences survive while stale prices and availability are refreshed; reusing a plan never replays an old checkout/cart action. |

## Measure before expanding

Pilot five weekly shops: planning time, unresolved matches, duplicate purchases, offline corrections and repeat use. Proposed gate: four households complete a reviewed list without help and the outage exercise loses no edits.

Collect the baseline before implementation. Use voluntary feedback and aggregate operational events without private content, credentials or account identifiers. If users do not return to the first workflow, revisit it before adding the later milestones.

## Dependencies and limits

Define which service owns each plan/list before connecting Shopping MCP, Pantry Pulse and Janella Cookbook; similar names do not establish shared storage or identity. Use explicit versioned handoffs. Keep purchases user-controlled and preserve the distinction between estimated and checkout totals.

Update this file with shipped user outcomes and observed pilot results.

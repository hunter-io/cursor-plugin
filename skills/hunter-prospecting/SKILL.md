---
name: hunter-prospecting
description: Runs end-to-end B2B prospecting by chaining company discovery, contact search, email verification, and enrichment. Use when the user wants to build a prospect list, find and qualify leads, or run a full prospecting pipeline.
---

# Prospecting

Chain Hunter tools into a complete prospecting workflow. Discover companies, find contacts, verify emails, and enrich -- all in one go.

## Examples

- `"Build me a list of marketing leads at SaaS companies in Germany"`
- `"I need 20 VPs of Sales at mid-size tech companies"`
- `"Find people to reach out to at companies using Salesforce in healthcare"`

## Workflow

For a quick starting point, you can call `Plan-Prospecting-Flow` with the user's goal to get a suggested end-to-end plan, then execute the steps below (or a refinement of it).

### Step 1: Identify Companies

Parse the user's request to determine the starting point:

- **Specific companies provided** (e.g., "Stripe, Notion, Figma") -- skip to Step 2.
- **Criteria provided** (e.g., "fintech startups in France") -- call `Find-Companies` with the criteria as the `query` parameter. If the user is targeting people by role (e.g. "CTOs at fintech startups"), still start from `Find-Companies`, then use `Domain-Search`'s seniority/department filters in Step 2 to pull just those people. (`Find-People` only counts contacts per company -- use it to size the batch, not to list people.)

Whenever more than one company will be searched, present the list and get approval before running Domain-Search, because each `Domain-Search` spends credits (1 per 10 results) and single-company calls have no built-in batch-consent gate:

> "I found [N] companies matching your criteria. Here are the results. Which should I search for contacts? Select specific companies or say 'proceed with all' — each Domain Search uses 1 credit per 10 results returned."

For long lists (>10), show the top results rather than all of them.

Before the first billable Domain Search — and again before bulk verification or bulk enrichment — call `Get-Usage` and read `remaining` on the credits bucket (`requests.credits.remaining` on current plans; `requests.searches.remaining` / `requests.verifications.remaining` on a legacy two-bucket plan). Do not compute `available - used`. If remaining is below the estimated cost, stop and tell the user; do not start a loop that will exhaust quota partway through.

### Step 2: Find Contacts

For each company, call `Domain-Search` with the company's `domain`. Use server-side filters:
- "CTOs" or "engineering leaders" -> `department: "it"`, `seniority: "executive"`
- "marketing team" -> `department: "marketing"`
- "executives" or "C-suite" -> `seniority: "executive"`
- "senior people" -> `seniority: "senior,executive"`

Those enums are broader than a specific title. After the call, post-filter returned `position` values so the list matches the requested role (keep related titles such as VP Sales / Sales Director for "Head of Sales"; drop CIOs when the user asked only for CTOs). Don't drop a row only because its exact title isn't an enum value.

If the user asked for a bounded count (e.g. "20 VPs of Sales"), stop the company Domain-Search loop once that many matching contacts are in hand. Do not search remaining companies just because they were approved.

Report progress for multi-company searches: "Searching stripe.com... found 15 contacts. Moving to notion.so..."

### Step 3: Verify Emails (Optional)

Before counting or verifying, drop addresses that must not go to `Email-Verifier`:

- Role/group addresses (`info@`, `support@`, `hello@`, etc.)
- Domain Search rows already `accept_all`, plus every row from a domain-level catch-all (`accept_all: true` on the search) that is not already a high-confidence `valid` — re-verify returns the same billed `accept_all`
- Domain Search rows already `invalid`
- Domain Search rows already `valid` with `confidence` ≥ 90 — Domain Search only emits a fresh status, so those are trusted

> Then confirm credit usage once on the leftover unresolved / low-confidence rows: "I found [N] remaining addresses across [M] companies. Verifying them will use up to [N × 0.5] credits at 0.5 each on current plans, or [N] verification credits on a legacy two-bucket plan. Proceed?"

Only verify after the user confirms. Call `Email-Verifier` only for those remaining contacts. Do not include skipped statuses in N.

If the user says "skip verification," present unverified results instead.

### Step 4: Enrich (Optional)

If the user asks for more company context, do **not** loop `Company-Enrichment` yet. Count the companies, then confirm once:

> "Enriching [N] companies will use up to [N × 0.2] credits on current plans (0.2 each; 1 each on a legacy two-bucket plan). Proceed?"

Only run after the user confirms. Call `Company-Enrichment` for each company's `domain`. Skip this step entirely if they did not ask for company context.

### Step 5: Save to Hunter Leads

After presenting results, offer to save contacts:

> "Would you like me to save these contacts to your Hunter leads? I can create a new list for them, or add them to an existing list you name."

If the user confirms:
1. If they named an existing list, call `List-Leads-Lists` (and `Get-Leads-List` if needed) and reuse that `leads_list_id` only when `type` is **static**. Dynamic/saved lists cannot receive manual memberships — create or pick a static list instead. Call `Create-Leads-List` only for a new list, or when the named list does not exist (e.g., "Fintech CTOs - France - 2026-04-08").
2. **Do not save `invalid` or `disposable` addresses** after verification — they will bounce. Skip them and report the count skipped.
3. **`accept_all` / `unknown`:** keep them out of the list unless the user explicitly says to save those too.
4. For each remaining contact, call `Create-Lead-If-Missing` with the contact's data and that `leads_list_id` — it adds new leads without overwriting existing ones. Note: an email that is already a lead is returned unchanged and is **not** added to the list, so report those contacts as already-existing / not added rather than implying the whole set is in the list.
5. Present the deep-link: "View your leads list: https://hunter.io/leads?leads_list_id={id}"

### Step 6: Present Results

Present a consolidated table grouped by company:

```
# Prospect List: [Description]

**Companies:** [count] | **Contacts:** [count] | **Verified:** [deliverable] deliverable, [risky] risky

## [Company Name] (domain.com)
**Industry** | **Size** | **Location**

| Name | Position | Email | Verified |
|------|----------|-------|----------|
| ... | ... | ... | valid / accept_all / invalid / unknown |

## Next Steps
1. Save contacts to a Hunter leads list (Create-Lead-If-Missing)
2. Add contacts to a sequence (`hunter-build-sequences`)
3. Verify stale or `unknown` addresses later. Do **not** re-run `Email-Verifier` on `accept_all` — catch-all will not change and is billed again.
4. Search for more companies with different criteria
```

## Credit Costs

- `Find-Companies` / `Find-People` — Free (no credits)
- `Domain-Search` — 1 credit per 10 emails returned (rounded up)
- `Email-Verifier` — 0.5 credits per email on current (unified) plans, or 1 verification credit on a legacy two-bucket plan (charged for valid, invalid, or accept_all)
- `Company-Enrichment` — 0.2 credits per domain on current (unified) plans, or 1 on a legacy two-bucket plan; only if data is found
- `Create-Lead-If-Missing`, `Create-Leads-List`, `Save-Company` — Free (no credits)

## Important Notes

- Always confirm before bulk verification **or** bulk enrichment
- If a company returns zero contacts, skip it and note it in the output
- If the user interrupts mid-workflow, present partial results gathered so far
- Prefer `Create-Lead-If-Missing` when saving found contacts so existing leads aren't overwritten

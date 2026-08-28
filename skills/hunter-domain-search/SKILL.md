---
name: hunter-domain-search
description: Finds all publicly available email addresses and contacts at a company domain. Use when the user asks who works at a company, wants to find contacts at a domain, or needs email addresses for an organization.
---

# Domain Search

Find all contacts and email addresses associated with a company domain.

## Examples

- `"Who works at figma.com?"`
- `"Find me contacts at Salesforce"`
- `"Show me the marketing team at hubspot.com"`
- `"List executives at acme.com"`

## Steps

1. **Parse the input.** Extract the `domain`.
   - "stripe.com" -> use directly
   - "Stripe" or "stripe" -> infer domain as "stripe.com"
   - If unsure about the domain, ask the user to confirm.

   **Free pre-check first (optional).** If the user wants to size how many **contacts/emails** Hunter has for a domain before paying, call `Email-Count` *before* `Domain-Search`. It's free and takes a `domain` plus an optional `personal`/`generic` `type`. It returns email totals only — not company headcount (use `hunter-company-enrichment` for employee counts) — and can't filter the count by role or department (only the paid `Domain-Search` filters by seniority/department).

If the request names **more than one domain**, do not loop `Domain-Search` yet. Prefer `hunter-prospecting` for the full pipeline. If staying in this skill: count the domains, call `Get-Usage`, read `remaining` (`requests.credits.remaining` on current plans; `requests.searches.remaining` on a legacy two-bucket plan), do not compute `available - used`, and confirm once. Each Domain Search costs 1 credit per 10 emails returned (rounded up). Estimate **ceil(limit / 10) credits per domain** (default `limit` is 10 → 1 credit; `limit` 100 → 10 credits). Optionally call free `Email-Count` per domain for a tighter number. Stop if remaining cannot cover the estimate. A single domain can be searched immediately.

2. **Choose the tool.** Default is `Domain-Search` (full-fidelity: found plus pattern-generated addresses). If the user asks only for **published / found / sourced-from-the-web** addresses, call `Domain-Search-Found` instead — that tool never returns inferred addresses. Then apply the same filters:
   - `type`: `personal` or `generic`
   - `seniority`: comma-separated from `junior`, `senior`, `executive`
   - `department`: comma-separated from `executive`, `it`, `finance`, `management`, `sales`, `legal`, `support`, `hr`, `marketing`, `communication`, `education`, `design`, `health`, `operations`, `product`, `research`, `consulting`, `administrative`, `procurement`
   - `required_field`: `full_name`, `position`, or `phone_number` — only return results where this field has a value
   - `limit`: 1-100 (default 10)
   - `offset`: for pagination

   **Mapping user requests to filters:**
   - "marketing team" -> `department: "marketing"`
   - "executives" / "C-suite" / "leadership" -> `seniority: "executive"`
   - "engineering" / "developers" -> `department: "it"`
   - "senior people" -> `seniority: "senior,executive"`
   - No filter specified -> show the top contacts by confidence score

3. **If the tool returns an `error` envelope** (auth, quota, rate limit, validation, 5xx), surface that error. Do not say the company is missing from Hunter.

4. **Present the results:**

```
# Contacts at Stripe (stripe.com)

**Found:** 247 contacts | **Showing:** 10

If the payload has domain-level `accept_all: true`, say so above the table: this is a catch-all domain — statuses below are still shown, but do not re-verify those rows.

| Name | Position | Email | Confidence | Verification |
|------|----------|-------|------------|--------------|
| Patrick Collison | CEO | patrick@stripe.com | 97% | valid |
| John Collison | President | john@stripe.com | 95% | accept_all |
| ... | ... | ... | ... | ... |

## Next Actions
1. Show more contacts (use offset to paginate)
2. Filter by department (e.g., "show me the marketing team")
3. Verify email addresses that have no `verification.status`, or whose status is stale/`unknown` (0.5 credits each; skip role/group addresses). Skip `Email-Verifier` when Domain Search already returned a fresh `valid`, `accept_all`, or `invalid`.
4. Save contacts as leads (Create-Lead-If-Missing — adds without overwriting existing leads)
5. Enrich Stripe with company details (Company-Enrichment)
```

5. **If the user asks for more,** present the next batch of results.

6. **If the call succeeded with zero emails,** suggest:
   - Check the domain spelling
   - The company may be too new or too small for our database
   - Try `Find-Companies` to find similar companies

## Credit Cost

Costs 1 credit per 10 emails returned (rounded up) — only charged if emails are found.

## Success Criteria

At least one email returned. Name and position are optional (generic addresses such as `info@` often have none).

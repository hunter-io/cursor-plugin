---
name: hunter-person-enrichment
description: Retrieves detailed information about a person from their email address, including name, position, company, and social profiles. Use when the user asks about a person, wants to enrich a contact, or needs more details about someone whose email they have.
---

# Person Enrichment

Get a detailed profile of a person from their email address.

## Examples

- `"What do you know about john@acme.com?"`
- `"Who is sarah@notion.so?"`
- `"Enrich this contact: marc@salesforce.com"`
- `"Get me details on hello@figma.com"`

## Steps

1. **Parse the input.** Extract the `email` address.

2. **If there is more than one email,** count them, call `Get-Usage`, and read `remaining` (`requests.credits.remaining` on current plans; `requests.searches.remaining` on a legacy two-bucket plan). Do not compute `available - used`. Confirm once: "Enriching [N] people will use up to [N × 0.2] credits on current plans (0.2 each; 1 each on a legacy two-bucket plan). Proceed?" If remaining cannot cover the estimate, stop. A single email can be enriched immediately.

3. **Call `Person-Enrichment`** with the `email` (only after approval when bulk). To retrieve both the person and their company in a single call, use `Combined-Enrichment` instead.

4. **If the tool returns an `error` envelope** (auth, quota, rate limit, validation, 5xx), surface that error. Do not say Hunter has no data for the email.

5. **Present the person profile:**

```
# Person: Jane Smith (jane@stripe.com)

| Field | Value |
|-------|-------|
| **Name** | Jane Smith |
| **Position** | VP of Engineering |
| **Company** | Stripe |
| **Location** | San Francisco, CA |
| **LinkedIn** | linkedin.com/in/janesmith |
| **Twitter** | @janesmith |

## Next Actions
1. Verify this email address (`Email-Verifier`)
2. Save as a lead (`Create-Lead-If-Missing` — adds without overwriting an existing lead)
3. Find more contacts at stripe.com (`Domain-Search`)
4. Enrich Stripe with company details (`Company-Enrichment`)
```

Omit any field the tool left null. A billed success can return only the email, with no name or title.

6. **If the call succeeded and there is no person object,** respond: "No data available for [email]. Try enriching their company domain instead, or use Domain Search to find other contacts at this company."

## Credit Cost

Costs 0.2 credits on current (unified) plans, or 1 credit on a legacy two-bucket plan — only charged if data is found.

## Success Criteria

Person payload returned. Render only fields that are present — name and position are optional.

---
name: hunter-company-enrichment
description: Retrieves detailed company information including industry, size, location, and description from a domain name. Use when the user asks about a company, wants company details, or says "tell me about [company]".
---

# Company Enrichment

Get a detailed profile of any company from its domain name.

## Examples

- `"Tell me about acme.com"`
- `"What does notion.so do?"`
- `"Company info for figma.com"`
- `"Look up HubSpot"`

## Steps

1. **Parse the input.** Extract the `domain`.
   - "stripe.com" -> use directly
   - "Stripe" -> infer domain as "stripe.com"

2. **If there is more than one domain,** count them, call `Get-Usage`, and read `remaining` (`requests.credits.remaining` on current plans; `requests.searches.remaining` on a legacy two-bucket plan). Do not compute `available - used`. Confirm once: "Enriching [N] companies will use up to [N × 0.2] credits on current plans (0.2 each; 1 each on a legacy two-bucket plan). Proceed?" If remaining cannot cover the estimate, stop. A single domain can be enriched immediately.

3. **Call `Company-Enrichment`** with the `domain` (only after approval when bulk). To retrieve both a company profile and a contact's details for an email in one call, use `Combined-Enrichment` instead.

4. **If the tool returns an `error` envelope** (auth, quota, rate limit, validation, 5xx), surface that error. Do not say Hunter has no company data.

5. **Present the company profile:**

```
# Company: Stripe (stripe.com)

| Field | Value |
|-------|-------|
| **Industry** | Financial Technology |
| **Size** | 5,000-10,000 employees |
| **Founded** | 2010 |
| **Headquarters** | San Francisco, CA |
| **Type** | Private |

## Description
Stripe builds economic infrastructure for the internet, enabling businesses to accept payments and manage their businesses online.

## Social Profiles
- LinkedIn: linkedin.com/company/stripe
- Twitter: @stripe

## Next Actions
1. Find contacts at stripe.com (Domain-Search)
2. Search for similar companies with Find-Companies
3. Find a specific person's email at Stripe (Email-Finder)
4. Save this company to your leads (Save-Company)
```

Omit any field the tool left null. A billed success can return a company object without industry or size.

6. **If the call succeeded and there is no company object,** respond: "No company data available for [domain]. Try checking the spelling, or use Find-Companies to search for companies by name."

## Credit Cost

Costs 0.2 credits on current (unified) plans, or 1 credit on a legacy two-bucket plan — only charged if data is found.

## Success Criteria

Company object returned. Render only fields that are present — industry and size are optional.

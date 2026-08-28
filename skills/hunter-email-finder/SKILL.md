---
name: hunter-email-finder
description: Finds a professional email address from a person's name and company domain. Use when the user asks to find someone's email, look up a contact's email address, or needs to reach a specific person at a company.
---

# Email Finder

Find the most likely email address for a person at a company using their name and domain. Call the Hunter MCP tool `Email-Finder`.

## Examples

- "What's John Doe's email at acme.com?"
- "Find the email for Sarah Chen at Figma"
- "How can I reach Marc Benioff at Salesforce?"
- "Find Jane Smith at stripe.com"

## Steps

1. **Parse the input.** Extract the person's `full_name` and the company `domain`.
   - "Jane Smith at Stripe" → `full_name`: "Jane Smith", `domain`: "stripe.com"
   - If the user provides a company name instead of a domain, infer the likely domain (e.g. "Stripe" → "stripe.com")
   - If only a role is given (e.g. "the CTO of Notion"), `Email-Finder` still needs a name. Prefer `Domain-Search` with department/seniority filters and use any returned email directly — do not follow that with `Email-Finder` (it spends another credit and may pick a different person). Ask for the person's name only when the user specifically wants `Email-Finder`.

2. **If there is more than one named person,** count them, call `Get-Usage`, and read `remaining` (`requests.credits.remaining` on current plans; `requests.searches.remaining` on a legacy two-bucket plan). Do not compute `available - used`. Confirm once: "Finding [N] emails will use up to [N] credits (1 each if found). Proceed?" If remaining cannot cover N, stop. A single person can be looked up immediately.

3. **Call `Email-Finder`** with `full_name` and `domain` (only after approval when bulk).

4. **Present the result:**

```
# Email Found: Jane Smith @ Stripe

| Field | Value |
|-------|-------|
| **Email** | jane.smith@stripe.com |
| **Score** | 92 |
| **Domain** | stripe.com |
| **Verification** | valid |

## Sources
- stripe.com/team (last seen: 2026-02-15)
- LinkedIn profile (last seen: 2026-01-20)

Omit the Sources section when `sources` is missing or empty. Do not invent sources.

## Next Actions
1. Verify this email address (Email-Verifier) — only if `verification.status` is missing, stale, or `unknown`. Skip Email-Verifier when status is already `valid` or `accept_all` (re-verifying catch-all charges again and returns the same result; use the cautionary accept_all recommendation instead).
2. Find more contacts at stripe.com
```

5. **If the tool returns an `error` envelope** (auth, rate limit, 5xx), surface that error. Do not say you couldn't find the email.

6. **If the call succeeded and `email` is null,** suggest alternatives:
   - "I couldn't find an email for [name] at [domain]. Would you like me to search all contacts at [domain] instead? That might help find the right person."
   - Suggest checking the spelling of the name or trying a different domain variation.

## Credit Cost

Costs 1 credit — only charged if an email is found.

## Success Criteria

Email address returned with a score. Include sources only when the tool provides them.

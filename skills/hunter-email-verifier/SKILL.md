---
name: hunter-email-verifier
description: Verifies whether an email address is deliverable by checking DNS and SMTP records. Use when the user wants to check if an email is valid, verify an email address, or assess deliverability before sending.
---

# Email Verifier

Check whether an email address is deliverable before you send to it. Call the Hunter MCP tool `Email-Verifier`.

## Examples

- "Is john@acme.com a valid email?"
- "Check if sarah@notion.so is deliverable"
- "Verify these emails: a@x.com, b@y.com, c@z.com"
- "Can I send to jane@stripe.com?"

## Steps

1. **Parse the input.** Extract the `email` address(es).

2. **Skip role/group addresses** such as `info@`, `support@`, `hello@`, `sales@`, `admin@`, `contact@`. Do not call `Email-Verifier` for them — deliverability is not meaningful and the result is typically `accept_all` (a billed outcome). Tell the user it is a shared inbox, not a personal mailbox.

3. **If there is more than one remaining address,** count them and ask once for approval before calling the tool. Example: "I'll verify 12 addresses (up to 6 credits at 0.5 each on current plans, or 12 verification credits on a legacy two-bucket plan). Proceed?" Do not start the loop until the user confirms. A single address can be verified immediately. Before a bulk run, call `Get-Usage` and read `remaining`. On current plans use `requests.credits.remaining` and estimate N × 0.5. On a legacy two-bucket plan use `requests.verifications.remaining` and estimate N × 1. Do not compute `available - used`. If remaining cannot cover the estimate, stop and tell the user — do not start a loop that will fail partway through.

4. **Call `Email-Verifier`** for each approved email.

5. **If the tool returns an `error` envelope** (auth, quota, rate limit, validation, 5xx), surface that error and its retry/quota guidance. Do not invent a deliverability status.

6. **If `data` is empty or `status` is missing** and `meta.message` says verification is still in progress, tell the user to retry in a few seconds. Do not treat that as invalid.

7. **Present the result with an actionable recommendation:**

```
# Verification: jane@stripe.com

| Check | Result |
|-------|--------|
| **Status** | valid |
| **Score** | 91 |
| **MX Records** | Valid |
| **SMTP Check** | Valid |
| **Accept All** | No |
| **Disposable** | No |

## Recommendation
Safe to send. This email address is deliverable with high confidence.

## Next Actions
1. Find more contacts at stripe.com
2. Enrich this contact with personal details
```

8. **Interpret flags and `status` in this order** (do not stop at `webmail` before deliverability):
   - **`disposable: true`** → "Do not send. This is a disposable/temporary email address. Hunter treats it as failed; it may stop working at any time."
   - **`invalid`** → "Do not send. This address is likely invalid and will bounce."
   - **`accept_all`** → "Proceed with caution. This is a catch-all domain: the mail server accepts every address, so Hunter did not verify this specific mailbox. Delivery is not guaranteed."
   - **`unknown`** → "Unable to determine deliverability. The mail server didn't respond clearly — consider sending a low-priority test first."
   - **`valid` and `webmail: true`** → "This is a personal webmail address (Gmail, Outlook, Yahoo, etc.). It can receive mail, but it is not a company inbox — don't treat it as a work contact." Billed as a valid result (0.5 credits).
   - **`valid`** (any score) → Safe to send at every score. Score only changes confidence: 80+ is high confidence; below 80 is still deliverable, with lower confidence.

9. **For multiple emails,** after approval, verify each separately and present a summary:

```
# Verification Summary

| Email | Status | Score | Recommendation |
|-------|--------|-------|----------------|
| jane@stripe.com | valid | 91 | Safe to send |
| john@acme.com | accept_all | 62 | Proceed with caution |
| test@fake.com | invalid | 12 | Do not send |

**Results:** 1 valid, 1 accept_all, 1 invalid
```

## Credit Cost

Costs 0.5 credits per email on current (unified) plans, or 1 verification credit on a legacy two-bucket plan — only charged for valid, invalid, or accept_all results. `webmail: true` is billed as valid. `unknown`, in-progress retries, errors, and skipped role addresses are not billed.

## Success Criteria

Verification status returned with a clear, actionable recommendation the user can act on immediately.

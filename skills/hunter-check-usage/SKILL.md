---
name: hunter-check-usage
description: Reports the Hunter account's plan, remaining credits, and usage. Use when the user asks how many credits they have left, what plan they're on, or how much of their quota they've used.
---

# Check Usage

Read-only view of the account's plan, credits, and usage. No credits consumed, no changes made.

## Examples

- `"What plan am I on?"`
- `"How many credits have I used this month?"`
- `"Show my account details"`

## Steps

1. **Read the account** → `Get-Account-Details` for plan and reset date; `Get-Usage` for credit consumption and what's remaining. Neither tool returns a team name — don't show one.

2. **Present a clear summary — show what's REMAINING, not the allowance.** Prefer the `remaining` field on each bucket the tool returns (`requests.credits.remaining` on current single-bucket plans; `requests.searches.remaining` / `requests.verifications.remaining` on a legacy two-bucket plan). Do not compute `available - used` — `available` already includes pack remainder, so subtracting `used` undercounts when a pack is partly spent.

```
# Account Usage

| | Used | Remaining | Resets |
|--|------|-----------|--------|
| **Credits** | 320 | 180 | 2026-08-01 |

**Plan:** Starter
```

3. **If the user is close to a limit,** flag it: "You've used 90% of your monthly credits — they reset on [date]."

## Credit Cost

Free — reading account details and usage consumes no credits.

## Important Notes

- Read-only. This skill never creates API keys, changes the plan, or edits account settings — those stay in the Hunter dashboard.
- Handy as a pre-check before running bulk verification or enrichment.

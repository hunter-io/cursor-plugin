---
name: hunter-build-sequences
description: Builds and runs email outreach sequences end to end — create a sequence, add follow-up steps and message templates, add recipients from your leads, then start, pause, resume, or check its stats. Use when the user wants to set up outreach, build an email sequence, add recipients, launch a drip, or check sequence performance.
---

# Build Sequences

Create, configure, and run Hunter email sequences from chat: create the sequence, add follow-up steps and message templates, add recipients, launch, and read stats. **One current limitation:** the sequence's introduction email (step 0) has no API yet, so its subject and body must be written once in the Hunter dashboard before the sequence can start.

## Examples

- `"Create a sequence called Q2 Outreach with a follow-up after 3 days"`
- `"Add the leads from my SaaS list to the Q2 Outreach sequence"`
- `"Start the Q2 Outreach sequence"`
- `"Pause my running sequence"`
- `"How is the Product Launch sequence performing?"`

## Workflow

### Step 1: Identify or create the sequence

- Existing sequence named or given by ID → call `Get-Sequence` to load its live `status`, sender, settings, and recipient count before acting (start/resume/archive/add-recipients should rely on this, not stale list rows). To browse, call `List-Sequences`. That list returns only `started` / `paused` / `archived` booleans — **not** a `status` field. Derive a coarse state: archived if `archived`; else paused if `paused`; else started if `started`; else draft. Do not invent `running`. For a detailed lifecycle (`draft`, `planned`, `active`, `paused`, `completed`, `preparing`, `error`, `archived`), call `Get-Sequence`.
- New sequence → call `Create-Sequence` with a descriptive name. Then configure it (Steps 2–3).

```
# Your Sequences

| ID | Name | State | Recipients |
|----|------|--------|------------|
| 123 | Q2 Outreach | draft | 0 |
| 456 | Product Launch | started | 150 |
```

### Step 2: Configure steps and templates

- **Message templates** — `Create-Message-Template` (requires a `name` and `body`; `subject` optional), reusable across sequences. `List-Message-Templates` to reuse an existing one (`Get-Message-Template` to inspect); `Update-Message-Template` to edit.
- **Follow-up steps** — `Create-Sequence-Follow-Up` to add each step (delay + template). `List-Sequence-Follow-Ups` to review the cadence (`Get-Sequence-Follow-Up` for one step); `Delete-Sequence-Follow-Up` removes a step, but **only the last step** can be deleted — to change an earlier one, delete from the end back down to it and recreate the rest (confirm first). A sequence holds at most **6 steps total** — the step-0 introduction plus up to 5 follow-ups — so longer drips aren't possible.

Use `{{first_name}}`-style merge fields in templates, but each merge field must carry a **fallback value** — `Create-Sequence-Follow-Up` rejects bare variables, so ask for or generate fallback text for every variable. Follow-up steps (1 and up) are authored here, but the **introduction email (step 0)** cannot be filled via the API yet — its subject and body must be written in the Hunter dashboard before the sequence can start.

### Step 3: Add recipients

Pull recipients from a leads list (`List-Leads` with `leads_list_id` — page through **all** results with `offset`, 100 per page, so leads past the first page aren't dropped), from specific emails/lead IDs, or from a prior search. **Do not add `invalid` or `disposable` addresses** — they can still be queued for send because `Add-Sequence-Recipients` does not inspect Hunter verification status. Skip them and report the count. Keep `accept_all` / `unknown` out unless the user explicitly overrides. Then call `Add-Sequence-Recipients` with the sequence ID and only the remaining emails or lead IDs. Max 50 per call — batch larger lists automatically and report progress ("Adding batch 1 of 3…"). Use `List-Sequence-Recipients` to see who is already in.

### Step 4: Pre-flight and start

Before calling `Start-Sequence`, verify the launch preconditions and surface any gap instead of letting the start fail:

- **Every follow-up step** has a resolved subject and a non-blank body, not only the introduction. Call `List-Sequence-Follow-Ups` and inspect **all** rows (page if needed). `Start-Sequence` validates every step; a missing/imported template can leave a later step blank even when step 0 is filled. If any step is blank, fix it (or write step 0 in the dashboard) before requesting launch confirmation. `Get-Sequence` only reports step counts, not contents.
- The sequence has a **sender attached** — the sender is a per-sequence field set via `email_account_ids` on `Create-Sequence` / `Update-Sequence`, not merely "some connected account." Use `List-Email-Accounts` / `Get-Email-Account` to inspect the attached account's live `sending_status`. Accept `active` or `warming` (`warming` can send at reduced volume). `paused` means disconnected — reconnect or attach a different account. `Start-Sequence` rejects disconnected accounts. Do not request launch confirmation while the sender is `paused`.
- The sequence has **at least one recipient**. `Get-Sequence` exposes the recipient count; `Start-Sequence` rejects an empty recipient list with "Recipients need to be present." If the count is 0, send the user to Step 3 to add recipients and do not request launch confirmation yet.
- The **schedule** on `Get-Sequence` may have null `days`, `time_start`, or `time_end` — that means the sequence **inherits the owner’s valid defaults**. Do not treat those raw nulls as empty/invalid or block `Start-Sequence`. Fail preflight only when `days` is present and empty, both times are present and `time_start` is not before `time_end`, or `start_at` is present and in the past. A past `start_at` or an inverted explicit window still fails start; fix those on the draft via `Update-Sequence`.

If a precondition is missing, say exactly what to fix. Once clear, call `Start-Sequence`.

### Step 5: Run controls and stats

- `Pause-Sequence` / `Resume-Sequence` to hold or continue.
- `Archive-Sequence` to retire a finished sequence.
- `Get-Sequence-Stats` for sent / open / reply / bounce numbers.
- `Update-Sequence` to rename or adjust settings — but once a sequence has **started**, only the name (and unsubscribe-link toggle) stay editable; sender, schedule, BCC, and tracking lock on start, so set those while it's still a draft.

```
# Sequence: Q2 Outreach

**Status:** active | **Recipients:** 120
**Sent:** 118 | **Opened:** 74 (63%) | **Replied:** 19 (16%) | **Bounced:** 2

View: https://hunter.io/sequences/{sequence_id}
```

## Guardrails

Confirm before any destructive, irreversible, or email-sending action — state the operation, the affected count, and the target, then wait for an explicit "yes":

- `Delete-Sequence` — only **draft** sequences can be deleted; a started or archived sequence returns an error (archive/stop it instead). For a draft: "This permanently deletes the '[name]' sequence. Confirm?"
- `Archive-Sequence` — stops a running sequence and can't be undone through the API: "This archives '[name]' and can't be reversed. Confirm?"
- `Remove-Sequence-Recipients` — echo how many recipients and from which sequence; max 50 per call, so batch larger removals in groups of 50 and report progress.
- `Delete-Message-Template`, `Delete-Sequence-Follow-Up` — name what is being removed.
- `Update-Message-Template` — overwrites a saved template's fields with no way to recover the old version; confirm before editing a reusable team template.

**Anything that can send email — confirm first.** `Start-Sequence`, `Resume-Sequence`, and `Add-Sequence-Recipients` on an already-started sequence all schedule real outbound email (Resume and Add-Recipients need no separate start call). Always confirm the recipient count and sending account before any of them.

## Credit Cost

Free — creating, configuring, and running sequences does not consume credits. (Finding and verifying the recipient emails beforehand does.)

## Important Notes

- A sequence cannot start until the step-0 introduction email (subject + body, authored in the Hunter dashboard — no API yet), an **active or warming** sending account, a valid schedule, and at least one recipient are all in place. Check before calling `Start-Sequence`.
- Max 50 recipients per `Add-Sequence-Recipients` call — batch larger lists.
- Message templates are reusable across sequences — prefer reusing over recreating.
- `List-Email-Account-Sequences` shows which sequences a given sending account is running.

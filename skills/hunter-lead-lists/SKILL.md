---
name: hunter-lead-lists
description: Creates and organizes Hunter leads lists — build a list from contacts or a search, populate it, merge lists, favorite them, and group them into folders. Use when the user wants to build a lead list, save search results to Hunter, organize contacts into lists, or tidy up their lists and folders.
---

# Lead Lists

Create leads lists, populate them with contacts, and organize them into folders.

## Examples

- `"Save these contacts to a new list called Q2 Outreach"`
- `"Build a list from the domain search results"`
- `"Merge my two fintech lists"`
- `"Favorite my Q2 Outreach list"`

## Workflow

### Step 1: Determine the source

- **From a previous search** — use contacts already found via Domain Search. (Discover returns companies/counts, not contacts with emails, so route Discover results through Domain Search first to get saveable contacts.)
- **From specific emails/contacts** — the user provides addresses directly.
- **From a new search** — run `hunter-discover` / `hunter-domain-search` first, then save results.

### Step 2: Create or pick the list

To reuse an existing list, `List-Leads-Lists` to browse and `Get-Leads-List` to read one. Only a **static** list can receive manual memberships (`type: static`). If the named list is dynamic/saved, do not pass its id to `Create-Lead-If-Missing` — the lead will not land in that list. Create or pick a static list instead. For a new list, call `Create-Leads-List` with a descriptive name. If the user gives none, suggest one from context (e.g., "Fintech CTOs - France - 2026-07-16").

Present the deep-link: "List created: https://hunter.io/leads?leads_list_id={id}"

### Step 3: Add leads

When the source is Domain Search (or another result that already carries verification status), do not dump every row into the list:

- Save `valid` rows with `confidence` ≥ 90 directly — do not re-verify.
- Do not save `invalid` or `disposable`.
- Do not save `accept_all` / domain catch-all / `unknown` unless the user explicitly overrides.
- For rows with no status or low-confidence `valid`, count them, then call `Get-Usage` and read `remaining`. On current plans use `requests.credits.remaining` and estimate N × 0.5; on a legacy two-bucket plan use `requests.verifications.remaining` and estimate N × 1. Do not compute `available - used`. If remaining cannot cover the estimate, stop and tell the user. Otherwise confirm once ("Verifying [N] unresolved addresses will use up to [N × 0.5] credits on current plans, or [N] verification credits on a legacy plan. Proceed?"), then call `Email-Verifier` only on those. Save a row only when the result is `valid`. Do not re-verify `accept_all`.

Then, for each contact you are actually saving, call `Create-Lead-If-Missing` with the contact's data and the list `leads_list_id` — it adds new leads but never overwrites an existing lead's fields, so sparse search data can't clobber contacts the user already maintains. Note: for an email that is **already** a lead, `Create-Lead-If-Missing` returns the existing record unchanged and does **not** add it to the new list — report those as already-existing / not added rather than counting them as added. (`Create-Or-Update-Lead` *would* add them to the list but overwrites their fields; use it only when the user explicitly wants that.) `Lead-Exists` checks first if unsure. Include every supported present field (`email`, `first_name`, `last_name`, `position`, `company`, `linkedin_url`, `phone_number`, `twitter`). Report progress ("Adding lead 5 of 20…").

### Step 4: Organize

- **Merge** two lists → `Merge-Leads-Lists` (destructive — it moves all leads to the destination and permanently deletes the source list; confirm first, see Guardrails). Both lists must be **static** and the source non-empty — dynamic/saved lists are rejected.
- **Favorite / unfavorite** → `Favorite-Leads-List` / `Unfavorite-Leads-List`.
- **Folders** → `List-Leads-List-Folders`, `Create-Leads-List-Folder`, `Update-Leads-List-Folder` (create and rename folders). Note: the API has no way to move an existing list into a folder — that's a Hunter-dashboard action.
- **Rename** a list → `Update-Leads-List` (accepts the list `id` and a new `name` only).

### Step 5: Present summary

```
# List Created: [List Name]

**Leads added:** [count] | **Duplicates skipped:** [count]

View in Hunter: https://hunter.io/leads?leads_list_id={id}

## Next Steps
1. Add more leads to this list
2. Add these leads to a sequence (`hunter-build-sequences`)
3. Push the list to your CRM (`hunter-push-to-crm`)
4. Search for more contacts (`hunter-discover` / `hunter-domain-search`)
```

## Guardrails

Confirm before destructive actions — state what will be affected, then wait for a "yes":

- `Delete-Leads-List` — "This deletes the '[name]' list (the leads themselves stay in your account); if it's a static list that a dynamic/saved list depends on, those dependent lists are deleted too. Confirm?"
- `Merge-Leads-Lists` — moving leads permanently deletes the source list and can't be undone: "This merges '[source]' into '[dest]' and deletes '[source]'. Confirm?"
- `Delete-Leads-List-Folder` — clarify whether lists inside move out or are affected, and confirm.

## Credit Cost

Free — `Create-Leads-List`, `Create-Lead-If-Missing`, merges, and folder operations do not consume credits. Domain Search / Email Finder spend credits if the leads come from a new search. If unresolved rows are verified first, that spend is extra: 0.5 credits each on current plans, or 1 verification credit each on a legacy two-bucket plan.

## Important Notes

- Use `Create-Lead-If-Missing` when saving search results so you never overwrite an existing lead; reserve `Create-Or-Update-Lead` for when the user intends to update existing leads.
- Lists can be merged later with `Merge-Leads-Lists` — but the merge deletes the source list, so confirm first.
- `List-Leads` returns up to 100 leads per page — use `offset` to paginate through larger lists.

# Hunter for Cursor

Find and verify professional email addresses, search contacts by domain, enrich company and person data, discover companies and people, organize leads and lists, run outreach sequences, and push to your CRM -- all through natural language in Cursor.

The plugin connects to Hunter's hosted MCP server (`https://mcp.hunter.io/mcp`) and ships the same **13 job-named skills** as the Claude plugin (`/hunter:email-finder` there is `hunter-email-finder` here). Cursor does not namespace skills with the plugin name, so every skill id is `hunter-` plus the Claude slug.

This is the package we will submit to the Cursor marketplace. Listing at `cursor.com/marketplace/hunter` is a separate publish step.

## Installation

Cursor loads plugins from `~/.cursor/plugins/local` until the marketplace listing exists:

```sh
mkdir -p ~/.cursor/plugins/local
ln -s /absolute/path/to/hunter/services/cursor-plugin ~/.cursor/plugins/local/hunter
```

Reload the window (**Developer: Reload Window**), then open **Customize** and confirm MCP server **hunter** and the 13 `hunter-*` skills are listed.

## Authentication

Cursor talks to Hunter with an API key (`X-API-Key`). Claude and ChatGPT use OAuth; Cursor does not yet.

1. Create a free Hunter account at [hunter.io/users/sign_up](https://hunter.io/users/sign_up) if you do not have one. The Free plan includes 50 credits a month — a search uses 1 credit and a verification 0.5.
2. Create an API key at [hunter.io/api-keys](https://hunter.io/api-keys).
3. After installing the plugin, open **Customize → Plugins → Hunter → Configure** and paste the key into **Hunter API key**.

Never put the key in git. The plugin only declares the variable name (`HUNTER_API_KEY`).

## Skills

Hunter provides 13 skills that trigger automatically based on your requests:

| Skill | What it does | Try saying... |
|-------|-------------|---------------|
| `hunter-email-finder` | Find someone's email from their name and company | "Find Jane Smith's email at Stripe" |
| `hunter-email-verifier` | Check if an email is deliverable | "Is jane@stripe.com valid?" |
| `hunter-domain-search` | List all contacts at a company | "Who works at notion.com?" |
| `hunter-company-enrichment` | Get company details from a domain | "Tell me about acme.com" |
| `hunter-person-enrichment` | Get person details from an email | "What do you know about jane@stripe.com?" |
| `hunter-discover` | Find companies by criteria and size their contacts (free) | "Fintech startups in France, 50-200 employees" |
| `hunter-prospecting` | Full end-to-end pipeline | "Build a prospect list of CTOs at fintech startups" |
| `hunter-build-sequences` | Create and run email outreach sequences | "Set up a 3-step sequence for my leads and start it" |
| `hunter-manage-leads` | Create, tag, and organize leads | "Tag these contacts 'priority'" |
| `hunter-lead-lists` | Build and organize leads lists | "Save these to a Q2 Outreach list" |
| `hunter-company-lists` | Save and organize target accounts | "Save these companies to Target Accounts" |
| `hunter-push-to-crm` | Sync leads to your connected CRM | "Push my Q2 leads to HubSpot" |
| `hunter-check-usage` | See your plan and remaining credits | "How many credits do I have left?" |

`mcp.json` already exposes the full hosted MCP server. Skills tell the agent **which job to run** and how to interpret results.

## Example Workflows

### Sales Rep Researching a Target Account

> "Tell me about stripe.com, then find their VP of Sales and verify the email."

Cursor will chain Company Enrichment -> Domain Search, then Email Verifier only if the returned status is unresolved (not already `valid` / `accept_all` / `invalid`). Do not follow Domain Search with Email Finder for a role such as VP of Sales — Domain Search already returns the email.

### Founder Building an Outbound List

> "Find fintech startups in France with 50-200 employees, then get the CTOs' email addresses."

Cursor will use Discover to find companies, Domain Search to find contacts, and filter for CTOs.

### Marketer Finding Contacts for a Campaign

> "Find marketing leaders at SaaS companies in Germany. Verify all their emails."

Cursor will chain Discover -> Domain Search -> Email Verifier, confirming credit usage before verification.

### SDR Launching Outreach

> "Add my fintech CTO list to a new sequence with a 3-day follow-up, then start it."

Cursor will use Build Sequences to create the sequence, add a follow-up step and message template, and add recipients from your list. Because the introduction email (step 0) has no API yet, it points you to the Hunter dashboard to write it, then starts the sequence once it's authored -- confirming before any email goes out.

## How finding emails works

The **`hunter-email-finder`** skill calls the MCP tool `Email-Finder` with `full_name` and `domain`.

- "Jane Smith at Stripe" → `full_name`: Jane Smith, `domain`: stripe.com
- If you only have a job title ("the CTO of Notion"), use Domain Search with department/seniority filters and take the returned email. Do not chain Email Finder after that.
- Costs 1 credit, charged only if an email is found.

## How verifying emails works

The **`hunter-email-verifier`** skill calls the MCP tool `Email-Verifier` with the email address.

| Status | Recommendation |
|---|---|
| `valid` | Safe to send (any score; 80+ is high confidence) |
| `webmail: true` | Personal provider; usually `status: valid`. Can receive mail; not a company inbox. Billed as valid (0.5) |
| `accept_all` | Catch-all server; the mailbox itself was not SMTP-checked |
| `unknown` | Mail server was unclear |
| `invalid` | Do not send |
| `disposable` | Do not send; temporary address |
| empty `data` / in-progress `meta.message` | Retry in a few seconds |

Do not verify role/group addresses (`info@`, `support@`, `hello@`, etc.). Costs 0.5 credits per email, charged only for valid, invalid, or accept_all results.

## How discovering companies works

**`hunter-discover`** is free. `Find-Companies` returns matching companies. `Find-People` returns **counts** of personal vs generic emails per company — not named people. To list actual contacts, use **`hunter-domain-search`** (paid) or **`hunter-prospecting`**.

## Credits

| Operation | Credit cost |
|-----------|------------|
| Domain Search | 1 credit per 10 results (rounded up; only if emails are found) |
| Email Finder | 1 credit (only if an email is found) |
| Email Verifier | 0.5 credits (valid, invalid, or accept_all) |
| Company / Person / Combined Enrichment | 0.2 credits on current plans (1 on a legacy two-bucket plan; only if data is found) |
| **Discover** (`Find-Companies` / `Find-People`) | **Free** |
| **Email Count** | **Free** |
| **Leads, lists, sequences, CRM push, saved searches, usage** | **Free** |

Cursor will always confirm before running operations that consume credits in bulk, and before any destructive action (deleting leads or lists, or pushing to your CRM).

## Publish

Submit the plugin at [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish). Cursor reviews every listing. The public git URL is [`hunter-io/cursor-plugin`](https://github.com/hunter-io/cursor-plugin).

On every push to `master` that touches this folder, `.github/workflows/plugin-sync.yml` mirrors `services/cursor-plugin/` onto that public repo (same job as Claude → [`hunter-io/claude-plugin`](https://github.com/hunter-io/claude-plugin) and ChatGPT → [`hunter-io/chatgpt-mcp`](https://github.com/hunter-io/chatgpt-mcp)). Edit here; do not push to the public repo by hand.

Follow-ups (Linear HUN-22532 remaining done-when):

- Official marketplace listing
- OAuth install if Cursor adds HTTP MCP OAuth for this server

## Links

- [Public git mirror](https://github.com/hunter-io/cursor-plugin)
- [Hunter.io](https://hunter.io)
- [API keys](https://hunter.io/api-keys)
- [API documentation](https://hunter.io/api-documentation)
- [Support](https://hunter.io/support)
- [Cursor plugin docs](https://cursor.com/docs/plugins)

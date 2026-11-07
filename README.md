# Hunter for Cursor

Hunter MCP connects Cursor to your Hunter account through the Model Context Protocol (MCP). Ask in plain language, and the Cursor agent can find companies and people, find and verify email addresses, and enrich contacts. It can also organize leads and lists, run email sequences, and push leads to your CRM.

This plugin connects Cursor to the hosted Hunter MCP server. It ships the same **13 job-named skills** as the Claude plugin (`/hunter:email-finder` there is `hunter-email-finder` here). Cursor does not namespace skills with the plugin name, so every skill id is `hunter-` plus the Claude skill name.

- **Endpoint:** `https://mcp.hunter.io/mcp`
- **Transport:** Streamable HTTP
- **Authentication:** API key, sent in the `X-API-Key` header
- **Plans:** every Hunter plan, including Free. The credits and limits of your plan apply.

## Install

### From the Cursor marketplace

1. Open [Hunter in the Cursor marketplace](https://cursor.com/marketplace/cursor/hunter).
2. Install the plugin.
3. Add your Hunter API key, as the Authentication section below shows.

### Without the plugin

You can add the MCP server by hand. You get the Hunter tools, but not the skills.

Add Hunter to your user-level `~/.cursor/mcp.json`, under `mcpServers`:

```json
{
  "mcpServers": {
    "hunter": {
      "url": "https://mcp.hunter.io/mcp",
      "headers": { "X-API-Key": "${env:HUNTER_API_KEY}" }
    }
  }
}
```

Cursor reads the key from the `HUNTER_API_KEY` environment variable. Set this variable in the environment that starts Cursor. Then reload Cursor.

### Local install for development

Cursor loads local plugins from `~/.cursor/plugins/local`:

```sh
git clone https://github.com/hunter-io/cursor-plugin.git
mkdir -p ~/.cursor/plugins/local
ln -s "$PWD/cursor-plugin" ~/.cursor/plugins/local/hunter
```

Reload the window (**Developer: Reload Window**). Then open **Customize** and make sure that the MCP server **hunter** and the 13 `hunter-*` skills show.

## Authentication

Cursor connects to Hunter with an API key.

1. If you do not have a Hunter account, [sign up for free](https://hunter.io/users/sign_up).
2. Create an API key at [hunter.io/api-keys](https://hunter.io/api-keys).
3. After you install the plugin, open **Customize → Plugins → Hunter → Configure**.
4. Paste the key into **Hunter API key**.

The plugin declares only the variable name, `HUNTER_API_KEY`. Never put the key in git.

## Skills

Hunter provides 13 skills that start automatically when your request matches them:

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

`mcp.json` already exposes the full hosted MCP server. The skills tell the agent which job to run and how to read the results.

For a role such as VP of Sales, the skills use Domain Search with department and seniority filters, and take the email that it returns. Do not follow Domain Search with Email Finder for the same person. Domain Search already returns the email.

`hunter-discover` is free. `Find-People` returns counts of emails per company, not named people. To list the contacts, use `hunter-domain-search` or `hunter-prospecting`.

## Tools

The agent picks the tools from your request. You do not call them by name.

Hunter asks you to confirm before it starts a sequence, pushes leads to a CRM, or deletes a sequence. It also asks before it adds recipients to a sequence that is already in progress.

Data Platform plans have no Discover or Sequences tools. `Find-Similar-Companies` is not on the Free plan.

<!-- BEGIN GENERATED: mcp-tools:remote. Generated from the Hunter MCP server; do not edit by hand. -->

The Data column says what a tool does:

- **Reads**: changes nothing in your account.
- **Paid lookup**: looks data up for credits and saves nothing.
- **Paid, saves leads**: looks data up for credits. If the team has automatic lead saving (on by default, off on Data Platform plans), it also saves the result as a lead.
- **Writes**: changes your account.
- **Irreversible**: makes a change that cannot be undone, such as deleting data, sending emails, or pushing leads to a CRM.

### Discover

Search Hunter's company database from criteria or from a seed company. Count the contacts at each company, or list their job titles for free. Save a search and run it again later.

Try: "Find fintech companies in France with 50 to 200 employees."

| Tool | Title | Credits | Data |
|---|---|---|---|
| `Create-Saved-Search` | Create Saved Search | Free | Writes |
| `Delete-Saved-Search` | Delete Saved Search | Free | Irreversible |
| `Find-Companies` | Find Companies | Free | Reads |
| `Find-People` | Count People at Companies | Free | Reads |
| `Find-Similar-Companies` | Find Similar Companies | Free | Reads |
| `Get-Saved-Search` | Get Saved Search | Free | Reads |
| `List-Job-Titles` | List Job Titles (Free) | Free | Reads |
| `List-Saved-Searches` | List Saved Searches | Free | Reads |

### Contact data

Get the email addresses at one domain or at up to 50 domains in one call, find the email address of one person, check deliverability, and count the addresses for a domain. To pick people by job title, list them for free, then get the email addresses of the ones you choose.

Try: "Find the email address of the head of marketing at notion.com and check that it is deliverable."

| Tool | Title | Credits | Data |
|---|---|---|---|
| `Bulk-Domain-Search` | Bulk Domain Search | 1 credit per 10 emails returned for each company, rounded up | Paid lookup |
| `Domain-Search` | Domain Search | 1 credit per 10 emails returned, rounded up | Paid lookup |
| `Domain-Search-Found` | Domain Search (Found Emails Only) | 1 credit per 10 emails returned, rounded up | Paid lookup |
| `Email-Count` | Email Count | Free | Reads |
| `Email-Finder` | Email Finder | 1 credit | Paid, saves leads |
| `Email-Verifier` | Email Verifier | 0.5 credit | Paid, saves leads |
| `Preview-People` | Preview People (Free) | Free | Reads |
| `Reveal-Emails` | Reveal Emails (1 Credit Each) | 1 credit per email | Paid lookup |

### Enrichment

Get profile data for a person (from an email address) or for a company (from a domain), or both in one call.

Try: "Tell me about stripe.com."

| Tool | Title | Credits | Data |
|---|---|---|---|
| `Combined-Enrichment` | Combined Enrichment | 0.2 credit, with at least 1 credit left to start | Paid lookup |
| `Company-Enrichment` | Company Enrichment | 0.2 credit, with at least 1 credit left to start | Paid lookup |
| `Person-Enrichment` | Person Enrichment | 0.2 credit, with at least 1 credit left to start | Paid lookup |

### Leads

Read, create, update, and delete leads. Find a lead by email address. Save a company to your account by its domain.

Try: "Save these contacts as leads without overwriting existing ones."

| Tool | Title | Credits | Data |
|---|---|---|---|
| `Create-Lead` | Create Lead | Free | Writes |
| `Create-Lead-If-Missing` | Create Lead if Missing | Free | Writes |
| `Create-Or-Update-Lead` | Create or Update Lead | Free | Irreversible |
| `Delete-Lead` | Delete Lead | Free | Irreversible |
| `Get-Lead` | Get Lead | Free | Reads |
| `Lead-Exists` | Check if Lead Exists | Free | Reads |
| `List-Leads` | List Leads | Free | Reads |
| `Save-Company` | Save Company | Free | Writes |
| `Update-Lead` | Update Lead | Free | Irreversible |

### Leads lists

Manage leads lists, merge two lists, mark favorites, and put lists in folders.

Try: "Create a leads list called Q4 Outreach and add these contacts to it."

| Tool | Title | Credits | Data |
|---|---|---|---|
| `Create-Leads-List` | Create Leads List | Free | Writes |
| `Create-Leads-List-Folder` | Create Leads List Folder | Free | Writes |
| `Delete-Leads-List` | Delete Leads List | Free | Irreversible |
| `Delete-Leads-List-Folder` | Delete Leads List Folder | Free | Irreversible |
| `Favorite-Leads-List` | Favorite Leads List | Free | Writes |
| `Get-Leads-List` | Get Leads List | Free | Reads |
| `List-Leads-List-Folders` | List Leads List Folders | Free | Reads |
| `List-Leads-Lists` | List Leads Lists | Free | Reads |
| `Merge-Leads-Lists` | Merge Leads Lists | Free | Irreversible |
| `Unfavorite-Leads-List` | Unfavorite Leads List | Free | Writes |
| `Update-Leads-List` | Update Leads List | Free | Irreversible |
| `Update-Leads-List-Folder` | Update Leads List Folder | Free | Irreversible |

### Tags and custom attributes

Manage lead tags and apply them to leads. Manage the custom attributes that leads can have.

Try: "Tag these leads as priority."

| Tool | Title | Credits | Data |
|---|---|---|---|
| `Add-Tag-To-Lead` | Add Tag to Lead | Free | Writes |
| `Create-Custom-Attribute` | Create Custom Attribute | Free | Writes |
| `Create-Lead-Tag` | Create Lead Tag | Free | Writes |
| `Delete-Custom-Attribute` | Delete Custom Attribute | Free | Irreversible |
| `Delete-Lead-Tag` | Delete Lead Tag | Free | Irreversible |
| `Get-Custom-Attribute` | Get Custom Attribute | Free | Reads |
| `List-Custom-Attributes` | List Custom Attributes | Free | Reads |
| `List-Lead-Tags` | List Lead Tags | Free | Reads |
| `Remove-Tag-From-Lead` | Remove Tag from Lead | Free | Writes |
| `Update-Custom-Attribute` | Update Custom Attribute | Free | Irreversible |
| `Update-Lead-Tag` | Update Lead Tag | Free | Irreversible |

### Company lists

Manage static and dynamic company lists, add and remove companies, mark favorites, and put lists in folders.

Try: "Save these companies to a Target Accounts list."

| Tool | Title | Credits | Data |
|---|---|---|---|
| `Add-Company-To-List` | Add Company to List | Free | Writes |
| `Create-Company-List` | Create Company List | Free | Writes |
| `Create-Company-List-Folder` | Create Company List Folder | Free | Writes |
| `Delete-Company-List` | Delete Company List | Free | Irreversible |
| `Delete-Company-List-Folder` | Delete Company List Folder | Free | Irreversible |
| `Favorite-Company-List` | Favorite Company List | Free | Writes |
| `Get-Company-List` | Get Company List | Free | Reads |
| `List-Company-List-Folders` | List Company List Folders | Free | Reads |
| `List-Company-Lists` | List Company Lists | Free | Reads |
| `Remove-Company-From-List` | Remove Company from List | Free | Writes |
| `Unfavorite-Company-List` | Unfavorite Company List | Free | Writes |
| `Update-Company-List` | Update Company List | Free | Irreversible |
| `Update-Company-List-Folder` | Update Company List Folder | Free | Irreversible |

### Bulk operations

Move, copy, or delete many leads or companies in one call.

Try: "Move every lead from the Q3 list to the Q4 list."

| Tool | Title | Credits | Data |
|---|---|---|---|
| `Bulk-Copy-Companies` | Bulk Copy Companies | Free | Irreversible |
| `Bulk-Delete-Companies` | Bulk Delete Companies | Free | Irreversible |
| `Bulk-Delete-Leads` | Bulk Delete Leads | Free | Irreversible |
| `Bulk-Move-Companies` | Bulk Move Companies | Free | Irreversible |
| `Bulk-Move-Leads` | Bulk Move Leads | Free | Irreversible |

### Sequences

Create and configure email outreach sequences. Start, pause, resume, and archive them. Get open, click, and reply statistics.

Try: "Create a 3-step sequence for my Q4 Outreach list, then start it."

| Tool | Title | Credits | Data |
|---|---|---|---|
| `Archive-Sequence` | Archive Sequence | Free | Irreversible |
| `Create-Sequence` | Create Sequence | Free | Writes |
| `Delete-Sequence` | Delete Sequence | Free | Irreversible |
| `Get-Sequence` | Get Sequence | Free | Reads |
| `Get-Sequence-Stats` | Get Sequence Stats | Free | Reads |
| `List-Sequences` | List Sequences | Free | Reads |
| `Pause-Sequence` | Pause Sequence | Free | Writes |
| `Resume-Sequence` | Resume Sequence | Free | Irreversible |
| `Start-Sequence` | Start Sequence | Free | Irreversible |
| `Update-Sequence` | Update Sequence | Free | Irreversible |

### Sequence steps and recipients

Write the email steps of a sequence, including A/B test variants. Add recipients to a sequence and remove them.

Try: "Add a follow-up email 3 days after the first one."

| Tool | Title | Credits | Data |
|---|---|---|---|
| `Add-Sequence-Recipients` | Add Sequence Recipients | Free | Irreversible |
| `Create-Sequence-Follow-Up` | Create Sequence Follow-Up | Free | Writes |
| `Delete-Sequence-Follow-Up` | Delete Sequence Follow-Up | Free | Irreversible |
| `Get-Sequence-Follow-Up` | Get Sequence Follow-Up | Free | Reads |
| `List-Sequence-Follow-Ups` | List Sequence Follow-Ups | Free | Reads |
| `List-Sequence-Recipients` | List Sequence Recipients | Free | Reads |
| `Remove-Sequence-Recipients` | Remove Sequence Recipients | Free | Irreversible |
| `Update-Sequence-Follow-Up` | Update Sequence Follow-Up | Free | Irreversible |

### Message templates

Manage reusable email templates.

Try: "Save this email as a reusable template."

| Tool | Title | Credits | Data |
|---|---|---|---|
| `Create-Message-Template` | Create Message Template | Free | Writes |
| `Delete-Message-Template` | Delete Message Template | Free | Irreversible |
| `Get-Message-Template` | Get Message Template | Free | Reads |
| `List-Message-Templates` | List Message Templates | Free | Reads |
| `Update-Message-Template` | Update Message Template | Free | Irreversible |

### Email accounts

Read the sending inboxes connected to Hunter and the sequences that each inbox sends.

Try: "Which of my inboxes can send sequences?"

| Tool | Title | Credits | Data |
|---|---|---|---|
| `Get-Email-Account` | Get Email Account | Free | Reads |
| `List-Email-Account-Sequences` | List Sequences for Email Account | Free | Reads |
| `List-Email-Accounts` | List Email Accounts | Free | Reads |

### Integrations

Read connected apps and their field mappings. Push leads to a connected CRM. Read and update webhooks.

Try: "Push my Q4 Outreach list to HubSpot."

| Tool | Title | Credits | Data |
|---|---|---|---|
| `Get-Connected-App` | Get Connected App | Free | Reads |
| `List-Connected-Apps` | List Connected Apps | Free | Reads |
| `List-Webhooks` | List Webhooks | Free | Reads |
| `Push-Leads-To-CRM` | Push Leads to CRM | Free | Irreversible |
| `Update-Webhook` | Update Webhook | Free | Irreversible |

### Briefing and signals

Say what is new in the account: signal events, this week's opportunities, and credits. Read the events, the opportunities and their people or companies, and the Monitored Signals.

Try: "What is new in my Hunter account this week?"

| Tool | Title | Credits | Data |
|---|---|---|---|
| `Get-Briefing` | Get Briefing | Free | Reads |
| `Get-Opportunity-Results` | Get Opportunity Results | Free | Reads |
| `List-Monitored-Signals` | List Monitored Signals | Free | Reads |
| `List-Opportunities` | List Opportunities | Free | Reads |
| `List-Signals` | List Signals | Free | Reads |

### Account and API keys

Read the plan, team, and credit usage. Manage the API keys of the connected user.

Try: "How many credits do I have left?"

| Tool | Title | Credits | Data |
|---|---|---|---|
| `Create-API-Key` | Create API Key | Free | Irreversible |
| `Delete-API-Key` | Delete API Key | Free | Irreversible |
| `Get-Account-Details` | Get Account Details | Free | Reads |
| `Get-Usage` | Get Quota Usage | Free | Reads |
| `List-API-Keys` | List API Keys | Free | Reads |

### Planning and feedback

Turn a prospecting request into an ordered tool plan. Report a problem with the API or the tools to Hunter.

Try: "Plan a prospecting flow for CTOs at fintech startups in Europe."

| Tool | Title | Credits | Data |
|---|---|---|---|
| `Plan-Prospecting-Flow` | Plan Prospecting Flow | Free | Reads |
| `Report-API-Feedback` | Report API Feedback | Free | Writes |

<!-- END GENERATED: mcp-tools:remote -->

## Credits

Hunter MCP uses the same credits as the Hunter web app and API. The Free plan includes 50 credits a month.

<!-- BEGIN GENERATED: mcp-credits:remote. Generated from the Hunter MCP server; do not edit by hand. -->

| Tool | Plans with one credit pool | Older plans with separate searches and verifications | Charged when |
|---|---|---|---|
| `Bulk-Domain-Search` | 1 credit per 10 emails returned for each company, rounded up | 1 search per 10 emails returned for each company, rounded up | Emails are found |
| `Combined-Enrichment` | 0.2 credit, with at least 1 credit left to start | 1 search | Data is found |
| `Company-Enrichment` | 0.2 credit, with at least 1 credit left to start | 1 search | Data is found |
| `Domain-Search` | 1 credit per 10 emails returned, rounded up | 1 search per 10 emails returned, rounded up | Emails are found |
| `Domain-Search-Found` | 1 credit per 10 emails returned, rounded up | 1 search per 10 emails returned, rounded up | Emails are found |
| `Email-Finder` | 1 credit | 1 search | An email is found |
| `Email-Verifier` | 0.5 credit | 1 verification | The result is valid, invalid or accept_all |
| `Person-Enrichment` | 0.2 credit, with at least 1 credit left to start | 1 search | Data is found |
| `Reveal-Emails` | 1 credit per email | 1 search per email | An email is revealed for the first time in the billing period |

Every other tool is free.

<!-- END GENERATED: mcp-credits:remote -->

## Troubleshooting

- **Cursor finds no MCP server.** The server URL is wrong. It is usually a hunter.io page address, such as `https://hunter.io/api-documentation`. Replace it with `https://mcp.hunter.io/mcp`.
- **A tool returns `401`.** The API key is missing or wrong. Make sure that the key in **Hunter API key**, or in `HUNTER_API_KEY`, matches a key at [hunter.io/api-keys](https://hunter.io/api-keys).
- **The Hunter tools do not show.** Reload the window (**Developer: Reload Window**). Then start a new chat.
- **A tool returns `quota_exceeded`.** You have no credits left, and a retry does not help. Credits renew at the start of the next billing period.

## Links

- [Hunter in the Cursor marketplace](https://cursor.com/marketplace/cursor/hunter)
- [Public repository](https://github.com/hunter-io/cursor-plugin)
- [Hunter MCP setup for every client](https://hunter.io/mcp)
- [Hunter MCP developer reference](https://hunter.io/api-documentation/v2#mcp)
- [API keys](https://hunter.io/api-keys)
- [Support](https://hunter.io/contact)
- [Cursor plugin docs](https://cursor.com/docs/plugins)

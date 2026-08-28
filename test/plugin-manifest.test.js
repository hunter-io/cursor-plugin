const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.join(__dirname, "..")

const CLAUDE_SKILL_SLUGS = [
  "build-sequences",
  "check-usage",
  "company-enrichment",
  "company-lists",
  "discover",
  "domain-search",
  "email-finder",
  "email-verifier",
  "lead-lists",
  "manage-leads",
  "person-enrichment",
  "prospecting",
  "push-to-crm",
]

const SKILL_DIRS = CLAUDE_SKILL_SLUGS.map((slug) => `hunter-${slug}`)

const PRIMARY_TOOLS = {
  "hunter-build-sequences": ["Create-Sequence"],
  "hunter-check-usage": ["Get-Account-Details", "Get-Usage"],
  "hunter-company-enrichment": ["Company-Enrichment"],
  "hunter-company-lists": ["Save-Company"],
  "hunter-discover": ["Find-Companies", "Find-People"],
  "hunter-domain-search": ["Domain-Search", "Domain-Search-Found"],
  "hunter-email-finder": ["Email-Finder"],
  "hunter-email-verifier": ["Email-Verifier"],
  "hunter-lead-lists": ["Create-Leads-List"],
  "hunter-manage-leads": ["Create-Lead-If-Missing"],
  "hunter-person-enrichment": ["Person-Enrichment"],
  "hunter-prospecting": ["Find-Companies", "Domain-Search", "Email-Verifier"],
  "hunter-push-to-crm": ["Push-Leads-To-CRM"],
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"))
}

function readText(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8")
}

function skillPath(dir) {
  return `skills/${dir}/SKILL.md`
}

test("Cursor plugin manifest names hunter and declares the API key variable", () => {
  const manifest = readJson(".cursor-plugin/plugin.json")
  assert.equal(manifest.name, "hunter")
  assert.match(manifest.name, /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/)
  assert.equal(manifest.logo, "assets/logo.svg")
  assert.equal(manifest.variables.required.includes("HUNTER_API_KEY"), true)
  assert.equal(manifest.variables.properties.HUNTER_API_KEY.type, "string")
})

test("mcp.json points at mcp.hunter.io and interpolates X-API-Key", () => {
  const mcp = readJson("mcp.json")
  const hunter = mcp.mcpServers.hunter
  assert.equal(hunter.url, "https://mcp.hunter.io/mcp")
  assert.equal(hunter.headers["X-API-Key"], "${HUNTER_API_KEY}")
})

test("ships the 13 hunter-prefixed job-named skills covering the MCP surface", () => {
  const dirs = fs
    .readdirSync(path.join(ROOT, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  assert.deepEqual(dirs, [...SKILL_DIRS].sort())

  for (const dir of SKILL_DIRS) {
    assert.match(dir, /^hunter-[a-z0-9]+(?:-[a-z0-9]+)*$/)
    const text = readText(skillPath(dir))
    assert.match(text, new RegExp(`^---\\nname: ${dir}\\n`, "m"))
    assert.doesNotMatch(text, /user-invocable/)
    assert.doesNotMatch(text, /argument-hint/)
    assert.doesNotMatch(text, /\/hunter:/)
    assert.doesNotMatch(text, /Campaign-/)
    for (const tool of PRIMARY_TOOLS[dir]) {
      assert.match(text, new RegExp(tool))
    }
  }
})

test("skills explain Email-Finder and Email-Verifier", () => {
  const finder = readText("skills/hunter-email-finder/SKILL.md")
  const verifier = readText("skills/hunter-email-verifier/SKILL.md")

  assert.match(finder, /description: Finds a professional email/)
  assert.match(finder, /full_name/)
  assert.match(finder, /domain/)
  assert.match(finder, /Omit the Sources section/)
  assert.match(finder, /`error` envelope/)
  assert.match(finder, /Skip Email-Verifier when status is already `valid` or `accept_all`/)
  assert.match(finder, /use any returned email directly/)
  assert.match(finder, /Finding \[N\] emails/)
  assert.match(finder, /Get-Usage/)

  assert.match(verifier, /description: Verifies whether an email/)
  assert.match(verifier, /accept_all/)
  assert.match(verifier, /Safe to send at every score/)
  assert.match(verifier, /Do not send\. This is a disposable/)
  assert.match(verifier, /Do not send/)
  assert.match(verifier, /ask once for approval/)
  assert.match(verifier, /up to 6 credits at 0.5 each/)
  assert.match(verifier, /did not verify this specific mailbox/)
  assert.match(verifier, /If the tool returns an `error` envelope/)
  assert.match(verifier, /Interpret flags and `status` in this order/)
  assert.match(verifier, /`valid` and `webmail: true`/)
  assert.match(verifier, /Billed as a valid result/)
  assert.match(verifier, /meta\.message/)
  assert.match(verifier, /Skip role\/group addresses/)
  assert.match(verifier, /Costs 0.5 credits per email/)
  assert.match(verifier, /Get-Usage/)
  assert.match(verifier, /Do not compute `available - used`/)
  assert.match(verifier, /estimate N × 1/)
  assert.doesNotMatch(verifier, /even though SMTP checks pass/)
})

test("find-companies, domain-search, and prospect use hosted MCP names and unified credits", () => {
  const discover = readText("skills/hunter-discover/SKILL.md")
  const domainSearch = readText("skills/hunter-domain-search/SKILL.md")
  const prospecting = readText("skills/hunter-prospecting/SKILL.md")
  const usage = readText("skills/hunter-check-usage/SKILL.md")
  const companyEnrichment = readText("skills/hunter-company-enrichment/SKILL.md")
  const personEnrichment = readText("skills/hunter-person-enrichment/SKILL.md")
  assert.match(companyEnrichment, /`error` envelope/)
  assert.match(personEnrichment, /`error` envelope/)
  assert.match(companyEnrichment, /industry and size are optional/)
  assert.match(personEnrichment, /name and position are optional/)
  assert.match(companyEnrichment, /Enriching \[N\] companies/)
  assert.match(personEnrichment, /Enriching \[N\] people/)
  assert.match(companyEnrichment, /Get-Usage/)
  assert.match(personEnrichment, /Get-Usage/)
  const companyLists = readText("skills/hunter-company-lists/SKILL.md")
  const pushToCrm = readText("skills/hunter-push-to-crm/SKILL.md")
  assert.match(companyLists, /Bulk-Delete-Companies` accepts any team-owned list/)
  assert.match(pushToCrm, /lead-syncing CRM providers/)
  assert.match(pushToCrm, /Paginate with `offset`\/`limit`/)
  assert.match(domainSearch, /ceil\(limit \/ 10\)/)

  assert.match(discover, /does \*\*not\*\* return individual people/)
  assert.match(discover, /Find-People` accepts `limit`\/`offset`/)
  assert.match(discover, /`error` envelope/)
  assert.match(discover, /If the call succeeded and zero companies were returned/)
  assert.match(domainSearch, /Domain-Search-Found/)
  assert.match(domainSearch, /`error` envelope/)
  assert.match(domainSearch, /Skip `Email-Verifier` when Domain Search already returned/)
  assert.match(domainSearch, /Name and position are optional/)
  assert.match(domainSearch, /Costs 1 credit per 10 emails/)
  assert.match(domainSearch, /\| Verification \|/)
  assert.match(domainSearch, /accept_all: true/)
  assert.match(domainSearch, /more than one domain/)
  assert.match(domainSearch, /Get-Usage/)
  assert.doesNotMatch(domainSearch, /1 verification credit/)
  assert.match(prospecting, /0\.5 credits per email/)
  assert.match(prospecting, /Enriching \[N\] companies/)
  assert.match(prospecting, /0\.2 credits per domain on current/)
  assert.match(prospecting, /Do not save `invalid` or `disposable`/)
  assert.match(prospecting, /Do \*\*not\*\* re-run `Email-Verifier` on `accept_all`/)
  assert.match(prospecting, /Get-Usage/)
  assert.match(prospecting, /Do not compute `available - used`/)
  assert.match(prospecting, /already `accept_all`/)
  assert.match(prospecting, /already `valid` with `confidence` ≥ 90/)
  assert.match(prospecting, /List-Leads-Lists/)
  assert.match(prospecting, /post-filter returned `position`/)
  assert.match(prospecting, /stop the company Domain-Search loop/)
  assert.match(prospecting, /1 verification credit on a legacy/)
  const sequences = readText("skills/hunter-build-sequences/SKILL.md")
  const leadLists = readText("skills/hunter-lead-lists/SKILL.md")
  assert.match(sequences, /at least one recipient/)
  assert.match(sequences, /Recipients need to be present/)
  assert.match(sequences, /sending_status/)
  assert.match(sequences, /inherits the owner/)
  assert.match(sequences, /Accept `active` or `warming`/)
  assert.match(sequences, /Do not invent `running`/)
  assert.doesNotMatch(sequences, /\*\*Status:\*\* running/)
  assert.match(leadLists, /Do not save `invalid` or `disposable`/)
  assert.match(leadLists, /Do not re-verify `accept_all`/)
  assert.match(leadLists, /Get-Usage/)
  assert.match(leadLists, /phone_number/)
  assert.match(leadLists, /`twitter`/)
  assert.match(sequences, /Do not add `invalid` or `disposable`/)
  assert.match(sequences, /Every follow-up step/)
  assert.match(leadLists, /type: static/)
  assert.match(prospecting, /type` is \*\*static\*\*/)
  const manageLeads = readText("skills/hunter-manage-leads/SKILL.md")
  assert.match(manageLeads, /duplicated_entry/)
  assert.match(manageLeads, /company_industry/)
  assert.doesNotMatch(manageLeads, /forces a new record/)
  assert.match(usage, /Prefer the `remaining` field/)
  assert.match(usage, /Do not compute `available - used`/)
  assert.doesNotMatch(usage, /\*\*Searches\*\*/)
  assert.doesNotMatch(usage, /\*\*Verifications\*\*/)
})

test("plugin files do not embed secrets", () => {
  const files = [
    "mcp.json",
    ".cursor-plugin/plugin.json",
    "plugin.json",
    "README.md",
    ...SKILL_DIRS.map(skillPath),
  ]
  for (const rel of files) {
    const text = readText(rel)
    assert.doesNotMatch(text, /hunter_[A-Za-z0-9]{8,}/)
    assert.doesNotMatch(text, /sk-[A-Za-z0-9]{10,}/)
  }
})

test("README uses unified credits and lists hunter-prefixed skills", () => {
  const readme = readText("README.md")
  assert.match(readme, /50 credits a month/)
  assert.match(readme, /verification 0\.5/)
  assert.match(readme, /0\.5 credits \(valid, invalid, or accept_all\)/)
  assert.match(readme, /13 job-named skills/)
  assert.match(readme, /\/hunter:email-finder/)
  assert.match(readme, /`hunter-email-finder`/)
  assert.match(readme, /`hunter-discover`/)
  assert.match(readme, /`hunter-prospecting`/)
  assert.match(readme, /`hunter-email-verifier`/)
  assert.match(readme, /0\.2 credits on current plans/)
  assert.match(readme, /Do not follow Domain Search with Email Finder/)
  assert.doesNotMatch(readme, /1–2 credits each/)
  assert.doesNotMatch(readme, /More job-named skills/)
})

test("logo asset exists", () => {
  assert.equal(fs.existsSync(path.join(ROOT, "assets/logo.svg")), true)
})

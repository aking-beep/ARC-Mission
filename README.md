# ARC Mission

**Technology for a greater purpose.** A working prototype of a sustainability and
transformation platform for nonprofits: an organization enters its income, costs,
reserves and people, and gets a plain-language picture of where it stands, what funding
it can go after, and what to fix first.

> **Status: prototype, unvalidated.** No nonprofit has used this yet. It is an
> [ARC Labs](https://github.com/aking-beep/arc-labs) experiment
> ([`exp-2026-0007-arc-mission`](https://github.com/aking-beep/arc-labs/blob/HEAD/incubator/validating/exp-2026-0007-arc-mission.md),
> owner aking, review due 2026-12-12) that lives in its own repository. It has not
> graduated: the Labs record still decides whether it continues. The name is a working
> one, pending trademark and domain checks.

ARC Mission is a product born in ARC Labs and delivered with ARC Transformation Group's
hands-on help. The platform finds the work; ARC's nonprofit practice helps do it; the
platform shows what changed. What it is meant to become is in
[`docs/BRIEF.md`](docs/BRIEF.md).

## Run it

```bash
open index.html
```

Choose "Explore a sample organization" to see every module filled in, or "Start with
your organization" to enter real numbers.

```bash
node test.js
```

31 checks on the model and catalog. No build, no server, no install. Figures an
organization enters never leave the browser. Keep every file in the same folder.

## Deploy and connect

`vercel.json` deploys the folder as-is (no build step, clean URLs, so `/apply` works);
`.vercelignore` keeps tests and docs off the site. Everything that sends data is
configured in **`config.js`**, and every value there is empty by default — empty means off:

| Setting | What it turns on |
| --- | --- |
| `FORM_ENDPOINT` | `apply.html` cohort applications, posted to Formspree or a Google Apps Script web app that writes to a Sheet |
| `SIGNUP_ENDPOINT`, `SIGNUP_EMAIL_FIELD`, `SIGNUP_TAG` | The email signup on both pages, sent with `tag=mission` (Kit: use `email_address` and also set the tag on the Kit form) |
| `POSTHOG_KEY`, `POSTHOG_HOST` | PostHog, with autocapture and session recording off. Only the named events in `site.js` are sent, never what anyone types |

Until an endpoint is set, the page says it is not connected and sends nothing.

## Hypothesis

A nonprofit leader shown a plain-language picture of their organization's financial
vulnerabilities, operational drag and funding options will act on at least one finding
within a quarter. The experiment stops if fewer than 2 of the first 5 nonprofits act on
a finding within 90 days, or if leaders cannot complete the intake unaided.

## What is in it

| Module | What works |
| --- | --- |
| 01 Mission Intelligence | Health score across six areas, ranked risks and opportunities, each with a reason and a next step |
| 02 Mission Simulator | Lose the largest funder, add funding, hire, automate admin hours — 24-month cash, runway and people served |
| 03 Mission Funding | **Eligible now:** 16 real technology programs filtered by registration, kind of organization and country, with what each gives, how to claim it and the official link. **Find grants:** links into real grant databases for the organization's country, pre-filled with its cause where the site allows. **Get ready:** the documents funders ask for. **Pipeline:** opportunities with deadlines and days left. **Application kit:** reusable answers assembled from the organization's own figures, and a prompt for the AI assistant it already uses |
| 04 Mission Reach | 13-item checklist across findability, accessibility, giving and storytelling, with the three fixes to do first. **Quick win:** Google Ad Grants readiness checklist, also placed first on the roadmap |
| 05 Mission Outcomes | Indicators with start, now and target, each marked measured or estimate; a printable one-page report. **Before and after:** per-nonprofit results (baseline, after, both dates, how it was measured, permission to publish) with a case-study preview that appears only when `permission_to_publish` is true |
| Transformation | **Assessment:** digital maturity across the eight practice areas. **Admin work:** a task inventory with the hours that could come back. **90-day roadmap:** next steps from every module, quick wins first, each marked "do it yourself" or "ARC can help", with status. **Get help:** a brief the organization can copy and send to ARC |

All the arithmetic lives in `model.js` as pure functions. Every threshold is in the
`RULES` object at the top of that file so it can be argued with in one place.

## The catalog goes stale

`catalog.js` holds the technology programs and grant databases. Every fact in it was read
on the provider's own page on the `checked` date in that file (2026-11-21), and details
that could not be confirmed there were left out. These programs change terms often —
Microsoft ended two free grants in July 2025, Zoom left TechSoup in May 2025 — so
**re-check every entry before putting this in front of a nonprofit**, and update
`checked`. Known gaps: country availability is not modelled for most programs (they are
shown everywhere), exclusions beyond schools, healthcare, government and faith bodies are
in the note text only, and Stripe's nonprofit rate was left out because its official page
could not be read.

## What is instrumented

The record's signal is whether a nonprofit **acts on a finding**. Each finding has a
"We'll act on this" button that stores the date. It is stored only in that browser, so
collecting it means asking the organization for their export file (Organization → Export)
at the 90-day follow-up. Nothing is sent anywhere.

## Estimates and measurements

ARC's honesty rule: a number is shown as **measured** only when someone counted it, and
for before-and-after results, says how. Everything else carries an *Estimate* label:
Simulator projections, hours that could come back, the weighted pipeline, unmeasured
outcome indicators (also in the application kit's text), and case studies. The rule
lives in `evidenceLabel` and `resultRecord` in `model.js`.

## What is faked

- **The sample organization.** Harbor Light Youth Center is fictional; every figure is
  invented.
- **The thresholds.** Six months of reserves, 25% from one source, 15% admin load and the
  rest are rules of thumb chosen for the prototype. They are not sector benchmarks and
  have not been reviewed by anyone who runs a nonprofit's finances.
- **The health score weights.** Chosen by judgement, not derived from data.
- **Grant discovery.** There are still no grant listings inside the tool. "Find grants"
  links out to real databases; pre-filled searches exist only for Grants.gov, ProPublica
  and the UK's Find a grant, the three whose search links were confirmed to work.
- **Eligibility.** "Likely qualify" is a three-question filter. Each provider decides.
- **The application kit.** Templates, not writing. Sentences are assembled from the
  organization's own inputs; nothing is generated. The AI prompt is only a prompt — the
  tool calls no model.
- **The hours that could come back.** A fixed share per kind of task (60% of data entry,
  50% of scheduling and so on). Planning assumptions, not measurements.
- **The maturity statements and roadmap ordering.** Chosen by judgement.
- **"Get help".** Produces text to copy, and links to `apply.html`. The application form
  sends nothing until `FORM_ENDPOINT` is set.
- **The Ad Grants checklist.** Not yet checked against Google's pages (they could not be
  reached when it was written), so it leaves out exact thresholds and says so on screen.
  Read Google's Ad Grants help pages and set `checked` in `catalog.js` before use.
- **Capacity.** The Simulator assumes people served moves in proportion to program
  spending, and that income and costs arrive evenly through the year.
- **Reach.** Self-assessed. Nothing actually inspects the organization's website.
- **Persistence.** `localStorage` in one browser. No accounts, no sync, no backup beyond
  the export file.
- **Intelligence.** No model is called. Findings are fixed rules applied to the inputs.

## Verified

`node test.js` covers the model and catalog: totals, score weighting and re-weighting
when data is missing, finding order, the month cash runs out, hires and automation,
pipeline weighting, reach scoring, outcome progress, catalog completeness, eligibility
rules, grant-search links, maturity, the automation plan, roadmap phasing and status,
readiness, deadlines and the application kit. The page was driven in headless Chromium
at desktop and phone widths through every module and sub-section, edits, a reload, data saved by the earlier version and an erase, with no
console errors, no network requests and no horizontal overflow.

Not covered: the external links were not clicked through from the page, no test with a real nonprofit, no screen-reader pass, no accessibility audit
beyond labelled controls, focus styles and text alternatives on charts, and the import
path is only shape-checked.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The whole interface, one page |
| `apply.html` | Cohort application form |
| `config.js` | Form, signup and PostHog settings: the one place to configure what leaves the browser |
| `site.js` | PostHog loader, named events, email signup, form posting |
| `vercel.json` | Static deployment settings |
| `model.js` | All the arithmetic, as pure functions; thresholds in `RULES` at the top |
| `catalog.js` | Technology programs and grant databases, with the date they were checked |
| `test.js` | The checks, run with `node test.js` |
| `docs/BRIEF.md` | Positioning, modules, the transformation practice, targets |
| `NOTES.md` | Dated log of surprises |

## Relationship to ARC Labs

The experiment record, its evidence targets and its review date stay in
[`arc-labs`](https://github.com/aking-beep/arc-labs); this repository holds the code and
the brief. Labs lists ARC Mission in its portfolio (`portfolio/products.yaml`, type
`labs-mission`) and on its site under "Mission & Social Impact".

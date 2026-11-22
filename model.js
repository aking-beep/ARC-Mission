/*
 * ARC Mission — the model. Pure functions, no DOM, no network.
 * Loaded by index.html in the browser and by test.js in Node.
 *
 * Every threshold in here is a stated rule of thumb, not a sector benchmark.
 * They are collected in RULES so they can be argued with in one place.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory()
  else root.ArcMission = factory()
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

  const RULES = {
    reserveMonthsHealthy: 6, // months of expenses held in unrestricted reserves
    reserveMonthsFragile: 3,
    largestSourceHealthy: 0.25, // share of revenue from the single largest source
    largestSourceFragile: 0.5,
    largestSourceCritical: 0.7,
    marginHealthy: 0.05, // surplus as a share of revenue
    marginCritical: -0.1,
    recurringHealthy: 0.6, // share of revenue expected to repeat next year
    adminLoadHealthy: 0.15, // admin hours as a share of all paid hours
    adminLoadCritical: 0.5,
    hoursPerFte: 40,
  }

  const WEIGHTS = { reserves: 25, diversification: 20, margin: 15, recurring: 15, admin: 10, reach: 15 }

  const SOURCE_TYPES = ['Grant', 'Government', 'Individual giving', 'Corporate', 'Events', 'Earned income', 'Other']

  const REACH_ITEMS = [
    { id: 'found-search', group: 'Findability', weight: 3, text: 'Searching the organization’s name returns its own website first', fix: 'Claim the organization’s search and map listings and make sure the name, address and mission match everywhere.' },
    { id: 'found-mission', group: 'Findability', weight: 3, text: 'The home page says who you serve and what you do in the first screen', fix: 'Rewrite the top of the home page as one sentence: who you serve, what you do, where.' },
    { id: 'found-contact', group: 'Findability', weight: 2, text: 'Someone needing help can find how to get it in one click', fix: 'Add a “Get help” link to the main navigation that leads straight to eligibility and contact details.' },
    { id: 'access-mobile', group: 'Accessibility', weight: 3, text: 'The website is usable on a phone without zooming', fix: 'Test every main page on a phone; fix anything that needs pinching or sideways scrolling.' },
    { id: 'access-contrast', group: 'Accessibility', weight: 2, text: 'Text contrast and font size have been checked against WCAG AA', fix: 'Run a free contrast checker over the main pages and fix failing text and buttons.' },
    { id: 'access-alt', group: 'Accessibility', weight: 2, text: 'Images carry alt text and videos carry captions', fix: 'Add alt text to images and captions to videos, starting with the home and donate pages.' },
    { id: 'access-language', group: 'Accessibility', weight: 2, text: 'Content is available in the main languages of the people you serve', fix: 'Translate the “Get help” and contact pages into the most-used community language first.' },
    { id: 'give-clicks', group: 'Giving journey', weight: 3, text: 'A donation can be completed in three steps or fewer from the home page', fix: 'Count the clicks from home page to a completed gift, then remove every step that is not required.' },
    { id: 'give-monthly', group: 'Giving journey', weight: 3, text: 'Monthly giving is offered on the donation form', fix: 'Add a monthly option to the donation form and state what a monthly gift makes possible.' },
    { id: 'give-thanks', group: 'Giving journey', weight: 2, text: 'Every donor gets a thank-you and receipt within a day', fix: 'Set up an automatic receipt and a personal thank-you within 24 hours of a gift.' },
    { id: 'story-impact', group: 'Storytelling', weight: 3, text: 'Results from the last 12 months are published with numbers', fix: 'Publish three numbers from the last year and one story behind each. Mission Outcomes can generate them.' },
    { id: 'story-voice', group: 'Storytelling', weight: 2, text: 'Stories are told with the consent and in the words of the people served', fix: 'Adopt a written consent step for stories and photos, and invite people to tell their own.' },
    { id: 'story-list', group: 'Storytelling', weight: 2, text: 'Supporters hear from you at least quarterly by email', fix: 'Start a quarterly email: one result, one story, one way to help.' },
  ]

  function blankOrg() {
    return {
      version: 1,
      name: '',
      mission: '',
      currency: '$',
      registered: true,
      revenue: [],
      expenses: { program: 0, admin: 0, fundraising: 0 },
      reserves: 0,
      staffFte: 0,
      volunteers: 0,
      adminHoursPerWeek: 0,
      peopleServed: 0,
      reach: {},
      pipeline: [],
      outcomes: [],
      actions: {},
      country: 'United States',
      orgKind: 'Community nonprofit',
      causeArea: '',
      location: '',
      needStatement: '',
      askPurpose: '',
      askAmount: 0,
      maturity: {},
      tasks: [],
      plan: {},
      readiness: {},
      claimed: {},
      sample: false,
    }
  }

  /** A fictional organization. Every figure is invented for demonstration. */
  function sampleOrg() {
    return Object.assign(blankOrg(), {
      name: 'Harbor Light Youth Center',
      mission: 'After-school mentoring, meals and study support for young people aged 11–18.',
      sample: true,
      revenue: [
        { source: 'City youth services contract', type: 'Government', amount: 210000, recurring: true },
        { source: 'Family foundation grant', type: 'Grant', amount: 60000, recurring: false },
        { source: 'Individual donors', type: 'Individual giving', amount: 48000, recurring: true },
        { source: 'Spring benefit dinner', type: 'Events', amount: 27000, recurring: true },
        { source: 'Local business sponsors', type: 'Corporate', amount: 15000, recurring: false },
      ],
      expenses: { program: 262000, admin: 61000, fundraising: 29000 },
      reserves: 54000,
      staffFte: 5,
      volunteers: 22,
      adminHoursPerWeek: 62,
      peopleServed: 340,
      reach: { 'found-search': true, 'found-mission': true, 'access-mobile': true, 'give-thanks': true, 'story-voice': true },
      causeArea: 'Youth development',
      location: 'Baltimore, Maryland',
      needStatement: 'One in three young people in our neighborhood has nowhere safe to go between the end of school and the time a parent gets home.',
      askPurpose: 'extend opening hours to five evenings a week and add a second study mentor',
      askAmount: 40000,
      maturity: { 'strategy-1': true, 'experience-1': true, 'finance-1': true, 'finance-2': true, 'data-1': false, 'governance-1': true },
      tasks: [
        { name: 'Retyping paper sign-in sheets into the spreadsheet', hoursPerWeek: 9, kind: 'Data entry' },
        { name: 'Booking volunteers and sending reminders', hoursPerWeek: 7, kind: 'Scheduling' },
        { name: 'Monthly report for the city contract', hoursPerWeek: 6, kind: 'Reporting' },
        { name: 'Donation receipts and thank-you letters', hoursPerWeek: 4, kind: 'Receipts and thank-yous' },
      ],
      readiness: { registration: true, governing: true, board: true, budget: true },
      pipeline: [
        { name: 'Community foundation — capacity grant', amount: 40000, stage: 'Applied', probability: 40, deadline: '2027-01-15' },
        { name: 'Regional bank — sponsorship', amount: 10000, stage: 'In conversation', probability: 50, deadline: '' },
      ],
      outcomes: [
        { name: 'Young people attending weekly', unit: 'people', baseline: 120, current: 164, target: 200 },
        { name: 'Homework sessions delivered', unit: 'sessions', baseline: 900, current: 1310, target: 1500 },
        { name: 'Participants moving up a grade on time', unit: '%', baseline: 81, current: 88, target: 92 },
      ],
    })
  }

  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)
  const clamp01 = (v) => Math.max(0, Math.min(1, v))
  /** 1 at `good`, 0 at `bad`, linear between, whichever direction they run. */
  const scale = (v, bad, good) => clamp01((v - bad) / (good - bad))

  function metrics(org) {
    const sources = (org.revenue || []).map((r) => ({ ...r, amount: num(r.amount) })).filter((r) => r.amount > 0)
    const revenue = sources.reduce((s, r) => s + r.amount, 0)
    const e = org.expenses || {}
    const program = num(e.program)
    const admin = num(e.admin)
    const fundraising = num(e.fundraising)
    const expenses = program + admin + fundraising
    const largest = sources.reduce((a, r) => (!a || r.amount > a.amount ? r : a), null)
    const recurring = sources.filter((r) => r.recurring).reduce((s, r) => s + r.amount, 0)
    const paidHours = num(org.staffFte) * RULES.hoursPerFte
    return {
      revenue,
      expenses,
      program,
      admin,
      fundraising,
      surplus: revenue - expenses,
      margin: revenue > 0 ? (revenue - expenses) / revenue : null,
      runwayMonths: expenses > 0 ? num(org.reserves) / (expenses / 12) : null,
      largest,
      largestShare: revenue > 0 && largest ? largest.amount / revenue : null,
      recurringShare: revenue > 0 ? recurring / revenue : null,
      programShare: expenses > 0 ? program / expenses : null,
      adminLoad: paidHours > 0 ? num(org.adminHoursPerWeek) / paidHours : null,
      costPerPerson: num(org.peopleServed) > 0 && expenses > 0 ? expenses / num(org.peopleServed) : null,
      sourceCount: sources.length,
    }
  }

  function reachScore(org) {
    const done = org.reach || {}
    const total = REACH_ITEMS.reduce((s, i) => s + i.weight, 0)
    const got = REACH_ITEMS.filter((i) => done[i.id]).reduce((s, i) => s + i.weight, 0)
    const answered = Object.keys(done).length > 0
    const groups = {}
    for (const i of REACH_ITEMS) {
      const g = (groups[i.group] = groups[i.group] || { total: 0, got: 0 })
      g.total += i.weight
      if (done[i.id]) g.got += i.weight
    }
    const fixes = REACH_ITEMS.filter((i) => !done[i.id]).sort((a, b) => b.weight - a.weight)
    return { score: Math.round((got / total) * 100), answered, groups, fixes }
  }

  /** Composite 0–100. Parts with no data are left out and the rest re-weighted. */
  function health(org) {
    const m = metrics(org)
    const reach = reachScore(org)
    const parts = [
      { id: 'reserves', label: 'Reserves', value: m.runwayMonths, score: m.runwayMonths === null ? null : scale(m.runwayMonths, 0, RULES.reserveMonthsHealthy) },
      { id: 'diversification', label: 'Funding mix', value: m.largestShare, score: m.largestShare === null ? null : scale(m.largestShare, RULES.largestSourceCritical, RULES.largestSourceHealthy) },
      { id: 'margin', label: 'Operating margin', value: m.margin, score: m.margin === null || m.expenses === 0 ? null : scale(m.margin, RULES.marginCritical, RULES.marginHealthy) },
      { id: 'recurring', label: 'Repeatable income', value: m.recurringShare, score: m.recurringShare === null ? null : scale(m.recurringShare, 0, RULES.recurringHealthy) },
      { id: 'admin', label: 'Administrative load', value: m.adminLoad, score: m.adminLoad === null ? null : scale(m.adminLoad, RULES.adminLoadCritical, RULES.adminLoadHealthy) },
      { id: 'reach', label: 'Digital reach', value: reach.score / 100, score: reach.answered ? reach.score / 100 : null },
    ].map((p) => ({ ...p, weight: WEIGHTS[p.id], score: p.score === null ? null : Math.round(p.score * 100) }))
    const known = parts.filter((p) => p.score !== null)
    const weight = known.reduce((s, p) => s + p.weight, 0)
    const score = weight ? Math.round(known.reduce((s, p) => s + p.score * p.weight, 0) / weight) : null
    const band = score === null ? 'unknown' : score >= 75 ? 'resilient' : score >= 50 ? 'stable' : score >= 30 ? 'fragile' : 'at risk'
    return { score, band, parts, complete: known.length === parts.length }
  }

  const pct = (v) => Math.round(v * 100) + '%'
  const oneDp = (v) => (Math.round(v * 10) / 10).toString()

  /** Ranked, plain-language findings. severity 3 = act now, 1 = worth knowing. */
  function findings(org) {
    const m = metrics(org)
    const reach = reachScore(org)
    const out = []
    const add = (f) => out.push(f)

    if (m.runwayMonths !== null && m.runwayMonths < RULES.reserveMonthsHealthy) {
      const fragile = m.runwayMonths < RULES.reserveMonthsFragile
      add({
        id: 'low-reserves', kind: 'risk', severity: fragile ? 3 : 2, module: 'simulator',
        title: `Reserves cover ${oneDp(m.runwayMonths)} months of costs`,
        why: `If income stopped tomorrow, services could continue for about ${oneDp(m.runwayMonths)} months. A common rule of thumb is ${RULES.reserveMonthsFragile}–${RULES.reserveMonthsHealthy} months.`,
        next: 'Set a reserves target with the board and model how fast a small annual surplus would reach it.',
      })
    }
    if (m.largestShare !== null && m.largestShare > RULES.largestSourceHealthy && m.largest) {
      const sev = m.largestShare >= RULES.largestSourceCritical ? 3 : m.largestShare >= RULES.largestSourceFragile ? 3 : 2
      add({
        id: 'concentration', kind: 'risk', severity: sev, module: 'simulator',
        title: `${pct(m.largestShare)} of income comes from one source`,
        why: `“${m.largest.source || 'The largest source'}” provides ${pct(m.largestShare)} of all income. Losing or shrinking it would change what the organization can deliver.`,
        next: 'Model the loss in the Simulator, then use Mission Funding to build a second and third source.',
      })
    }
    if (m.margin !== null && m.expenses > 0 && m.margin < 0) {
      add({
        id: 'deficit', kind: 'risk', severity: m.margin < RULES.marginCritical ? 3 : 2, module: 'simulator',
        title: `Spending is ahead of income by ${pct(-m.margin)}`,
        why: 'The organization is drawing on reserves to operate. That can be a deliberate choice for a year; it cannot be a habit.',
        next: 'Use the Simulator to find the combination of new income and cost changes that brings the year back to break-even.',
      })
    }
    if (m.recurringShare !== null && m.recurringShare < RULES.recurringHealthy) {
      add({
        id: 'low-recurring', kind: 'risk', severity: m.recurringShare < 0.3 ? 2 : 1, module: 'funding',
        title: `Only ${pct(m.recurringShare)} of income is expected to repeat`,
        why: 'Each year starts with most of the budget still to be raised, which pulls leadership time from the mission into fundraising.',
        next: 'Prioritise multi-year grants and a monthly giving program — see Mission Funding.',
      })
    }
    if (m.adminLoad !== null && m.adminLoad > RULES.adminLoadHealthy) {
      const hours = Math.round(num(org.adminHoursPerWeek))
      add({
        id: 'admin-load', kind: 'opportunity', severity: m.adminLoad >= 0.3 ? 2 : 1, module: 'simulator',
        title: `${hours} staff hours a week go to administration`,
        why: `That is ${pct(m.adminLoad)} of all paid time. Scheduling, data entry, reporting and receipts are the work most often automated.`,
        next: 'List the five most repeated admin tasks and model returning a quarter of those hours in the Simulator.',
      })
    }
    if (m.sourceCount > 0 && !(org.revenue || []).some((r) => r.type === 'Individual giving' && num(r.amount) > 0)) {
      add({
        id: 'no-individual', kind: 'opportunity', severity: 1, module: 'funding',
        title: 'No income from individual donors yet',
        why: 'Individual giving is the most flexible income an organization can have: it is unrestricted and it does not depend on one decision-maker.',
        next: 'Start with the people already closest to the work — volunteers, families, alumni.',
      })
    }
    if (reach.answered && reach.score < 70) {
      add({
        id: 'reach', kind: 'opportunity', severity: reach.score < 40 ? 2 : 1, module: 'reach',
        title: `Digital reach scores ${reach.score} out of 100`,
        why: 'People who need the service, and people who would fund it, are meeting friction before they reach you.',
        next: reach.fixes.length ? reach.fixes[0].fix : 'Review the Mission Reach checklist.',
      })
    }
    if ((org.outcomes || []).length === 0 && m.expenses > 0) {
      add({
        id: 'no-outcomes', kind: 'opportunity', severity: 1, module: 'outcomes',
        title: 'No outcomes are being tracked yet',
        why: 'Funders increasingly ask for evidence. Three well-chosen indicators are enough to tell a credible story.',
        next: 'Add up to three indicators in Mission Outcomes and record where each one stands today.',
      })
    }
    if (m.runwayMonths !== null && m.runwayMonths >= RULES.reserveMonthsHealthy && m.margin !== null && m.margin >= 0) {
      add({
        id: 'capacity-to-invest', kind: 'opportunity', severity: 1, module: 'simulator',
        title: 'There is room to invest',
        why: `Reserves cover ${oneDp(m.runwayMonths)} months and the year is in surplus. That is a position from which to grow deliberately.`,
        next: 'Model one investment — a hire, a system, a new program — and see what it does to runway and reach.',
      })
    }
    return out.sort((a, b) => b.severity - a.severity || (a.kind === 'risk' ? -1 : 1))
  }

  const DEFAULT_SCENARIO = {
    loseLargest: false,
    revenueChangePct: 0,
    newFunding: 0,
    includePipeline: false,
    expenseChangePct: 0,
    newHires: 0,
    costPerHire: 50000,
    hoursAutomated: 0,
    toolCost: 0,
  }

  function pipelineTotals(org) {
    const items = (org.pipeline || []).filter((p) => p.stage !== 'Declined')
    const open = items.filter((p) => p.stage !== 'Won')
    return {
      total: open.reduce((s, p) => s + num(p.amount), 0),
      weighted: open.reduce((s, p) => s + (num(p.amount) * clamp01(num(p.probability) / 100)), 0),
      won: items.filter((p) => p.stage === 'Won').reduce((s, p) => s + num(p.amount), 0),
      count: open.length,
    }
  }

  /** Month-by-month cash for the baseline year repeated, and for a scenario. */
  function simulate(org, scenarioIn, months) {
    const s = Object.assign({}, DEFAULT_SCENARIO, scenarioIn || {})
    const n = months || 24
    const m = metrics(org)
    let revenue = m.revenue
    if (s.loseLargest && m.largest) revenue -= m.largest.amount
    revenue = revenue * (1 + num(s.revenueChangePct) / 100) + num(s.newFunding)
    if (s.includePipeline) revenue += pipelineTotals(org).weighted
    const hireCost = num(s.newHires) * num(s.costPerHire)
    const expenses = m.expenses * (1 + num(s.expenseChangePct) / 100) + hireCost + num(s.toolCost)
    const programBase = m.program
    const programScen = m.program * (1 + num(s.expenseChangePct) / 100) + hireCost
    const run = (rev, exp) => {
      const cash = [num(org.reserves)]
      for (let i = 1; i <= n; i++) cash.push(cash[i - 1] + (rev - exp) / 12)
      const zero = cash.findIndex((c) => c < 0)
      return { cash, zeroMonth: zero === -1 ? null : zero }
    }
    const base = run(m.revenue, m.expenses)
    const scen = run(revenue, expenses)
    const hoursFreed = Math.min(num(s.hoursAutomated), num(org.adminHoursPerWeek))
    return {
      months: n,
      baseline: { ...base, revenue: m.revenue, expenses: m.expenses, net: m.revenue - m.expenses },
      scenario: { ...scen, revenue, expenses, net: revenue - expenses },
      // Capacity is assumed to move in proportion to program spending. Stated, not proven.
      peopleServed: programBase > 0 ? Math.round(num(org.peopleServed) * (programScen / programBase)) : num(org.peopleServed),
      hoursFreedPerYear: Math.round(hoursFreed * 52),
    }
  }

  /**
   * Kinds of funding and resource, ranked by how well they fit this organization.
   * These are categories to pursue, not live listings. Named programs are examples
   * that existed when this was written; terms and eligibility change.
   */
  function fundingMatches(org) {
    const m = metrics(org)
    const has = (type) => (org.revenue || []).some((r) => r.type === type && num(r.amount) > 0)
    const list = [
      {
        id: 'tech-donations', name: 'Technology donations and discounts',
        what: 'Free or discounted software, cloud credits and hardware for registered nonprofits.',
        examples: 'TechSoup, Google for Nonprofits, Microsoft nonprofit offers, cloud provider nonprofit credits, Canva and Slack nonprofit plans.',
        fit: org.registered ? 3 : 0,
        why: org.registered ? 'Registered nonprofits usually qualify, and the saving goes straight to the bottom line.' : 'These programs generally require registered charitable status.',
      },
      {
        id: 'monthly-giving', name: 'Monthly giving program',
        what: 'Small recurring gifts from individuals, collected automatically.',
        examples: 'A monthly option on the donation form, with a named giving circle.',
        fit: (m.recurringShare !== null && m.recurringShare < RULES.recurringHealthy ? 2 : 1) + (has('Individual giving') ? 1 : 0),
        why: has('Individual giving') ? 'You already have individual donors; converting a share to monthly gifts makes income predictable.' : 'It builds repeatable, unrestricted income from scratch.',
      },
      {
        id: 'general-operating', name: 'General operating and multi-year grants',
        what: 'Unrestricted or multi-year funding from foundations.',
        examples: 'Community foundations and family foundations in your region.',
        fit: (m.largestShare !== null && m.largestShare > RULES.largestSourceFragile ? 3 : 2) - (has('Grant') ? 0 : 0),
        why: m.largestShare !== null && m.largestShare > RULES.largestSourceFragile ? 'Income is concentrated in one source; a second institutional funder is the fastest way to reduce that risk.' : 'Unrestricted grants strengthen reserves and core costs.',
      },
      {
        id: 'capacity-building', name: 'Capacity-building grants',
        what: 'Grants that pay for systems, training and technology rather than programs.',
        examples: 'Foundation capacity-building funds; funder-run technical assistance programs.',
        fit: m.adminLoad !== null && m.adminLoad > RULES.adminLoadHealthy ? 3 : 1,
        why: m.adminLoad !== null && m.adminLoad > RULES.adminLoadHealthy ? 'Administrative load is high; this is the funding designed to pay for fixing it.' : 'Useful when a specific system or skill is the bottleneck.',
      },
      {
        id: 'pro-bono', name: 'Pro bono professional services',
        what: 'Donated time from lawyers, accountants, designers and technologists.',
        examples: 'Skills-based volunteering platforms, local bar and accounting associations, corporate volunteer programs.',
        fit: num(org.staffFte) <= 10 ? 2 : 1,
        why: 'A small team cannot hold every specialism in-house; borrowed expertise fills the gap without adding payroll.',
      },
      {
        id: 'corporate', name: 'Corporate sponsorship and employee matching',
        what: 'Sponsorships, workplace giving and employer matching of staff donations.',
        examples: 'Local employers, banks and retailers; matching-gift programs your donors’ employers already run.',
        fit: has('Corporate') ? 2 : has('Individual giving') ? 2 : 1,
        why: has('Individual giving') ? 'Some of your existing donors work for employers that would match their gift if asked.' : 'Local businesses fund local causes they can see.',
      },
      {
        id: 'government', name: 'Government grants and contracts',
        what: 'Public funding for services delivered on behalf of local or national government.',
        examples: 'Municipal and regional service contracts; national grant portals.',
        fit: has('Government') ? 1 : 2,
        why: has('Government') ? 'You already hold public funding; adding more would deepen concentration unless it is a different agency.' : 'Often the largest and most stable source, at the cost of heavier reporting.',
      },
      {
        id: 'earned', name: 'Earned income',
        what: 'Fees, training, products or services sold in support of the mission.',
        examples: 'Sliding-scale fees, training for other organizations, social enterprise.',
        fit: has('Earned income') ? 1 : 1,
        why: 'Unrestricted and within your control, but only worth pursuing where it does not distract from the mission.',
      },
    ]
    return list.filter((f) => f.fit > 0).sort((a, b) => b.fit - a.fit)
  }

  function outcomeProgress(o) {
    const b = num(o.baseline), c = num(o.current), t = num(o.target)
    const change = c - b
    const changePct = b !== 0 ? change / Math.abs(b) : null
    const toTarget = t !== b ? clamp01((c - b) / (t - b)) : null
    return { change, changePct, toTarget, improved: t >= b ? c > b : c < b }
  }

  // ── Digital transformation ──────────────────────────────────────────────
  // Each area has three statements, basic to advanced. Level = how many are true.
  // An unmet statement carries the step that would make it true.
  const S = (text, title, how, effort, impact, help) => ({ text, title, how, effort, impact, help })
  const MATURITY_AREAS = [
    { id: 'strategy', name: 'Digital strategy', statements: [
      S('We have a written list of the systems we use and who owns each', 'List every system and its owner', 'One page: each tool, what it is for, what it costs, who has admin access.', 'S', 2, 'self'),
      S('Technology has a line in the budget and someone accountable for it', 'Give technology a budget line and an owner', 'Name one person accountable and move every software cost under one budget heading.', 'S', 2, 'self'),
      S('We have a 12-month technology plan the board has seen', 'Write a 12-month technology roadmap', 'Three priorities, their cost, and what each returns to the mission. This page is a first draft of it.', 'M', 3, 'arc'),
    ] },
    { id: 'experience', name: 'Digital experience', statements: [
      S('Our website was updated in the last three months', 'Refresh the website’s core pages', 'Update home, get-help, donate and contact pages so each is current and says one thing clearly.', 'S', 2, 'self'),
      S('Staff can update the website without a developer', 'Move the website to a system staff can edit', 'Rebuild on a platform where a staff member can change text, images and events themselves.', 'L', 3, 'arc'),
      S('We look at website and donation analytics at least quarterly', 'Review website and giving analytics quarterly', 'Privacy-respecting analytics on the site and donation form, with a 30-minute review each quarter.', 'M', 2, 'arc'),
    ] },
    { id: 'ai', name: 'AI adoption', statements: [
      S('Staff know which AI tools they may use for work', 'Agree which AI tools staff may use', 'A short approved list, so people stop guessing or using personal accounts.', 'S', 2, 'self'),
      S('We have a written rule on what must never go into an AI tool', 'Write a one-page AI and data rule', 'Names, case notes, health and financial details of the people you serve stay out. Put it in writing.', 'S', 3, 'arc'),
      S('We use AI for at least one routine task, with a person checking the output', 'Put AI to work on one routine task', 'Pick one: first drafts of grant reports, meeting notes, or translating notices. A person always reviews.', 'M', 3, 'arc'),
    ] },
    { id: 'automation', name: 'Process automation', statements: [
      S('Donation receipts and thank-yous send automatically', 'Automate receipts and thank-yous', 'Turn on automatic receipts in the donation platform and add a thank-you email within a day.', 'S', 3, 'self'),
      S('Forms feed our records without anyone retyping', 'Connect forms straight to your records', 'Replace paper and emailed forms with online ones that write directly into the system of record.', 'M', 3, 'arc'),
      S('Recurring reports are generated, not assembled by hand', 'Generate recurring reports automatically', 'Build each funder and board report once as a saved report, then refresh it instead of rebuilding it.', 'M', 3, 'arc'),
    ] },
    { id: 'data', name: 'Data and insight', statements: [
      S('Supporter and participant records live in one system, not scattered spreadsheets', 'Bring records into one system', 'Choose a single system of record and migrate the spreadsheets into it. Nonprofit licences are often donated.', 'L', 3, 'arc'),
      S('We can produce last year’s key numbers in under an hour', 'Define your key numbers', 'Agree the five numbers that describe the year and where each one comes from.', 'S', 2, 'self'),
      S('Leadership reviews a dashboard or report every month', 'Set up a monthly leadership dashboard', 'One page: people served, money in, money out, runway. Reviewed monthly.', 'M', 2, 'arc'),
    ] },
    { id: 'finance', name: 'Financial intelligence', statements: [
      S('Books are kept in accounting software and reconciled monthly', 'Move the books into accounting software', 'Cloud accounting with a bank feed, reconciled every month.', 'M', 3, 'arc'),
      S('We see a budget-against-actual report each month', 'Run a monthly budget-against-actual report', 'A standing report comparing each budget line with what was actually spent.', 'S', 2, 'self'),
      S('We forecast cash at least six months ahead', 'Forecast cash six months ahead', 'Start from the Simulator here, then keep a rolling forecast updated monthly.', 'S', 3, 'self'),
    ] },
    { id: 'governance', name: 'Technology governance', statements: [
      S('Every account uses multi-factor authentication', 'Turn on multi-factor authentication everywhere', 'Email, banking, donor system and social accounts first. It blocks the most common way small organizations are breached.', 'S', 3, 'self'),
      S('Files are backed up automatically and we have tested restoring them', 'Set up tested, automatic backups', 'Automatic backup of shared files and the system of record, with one restore actually tried.', 'M', 3, 'arc'),
      S('We have a privacy policy for the people we serve, and leavers lose access the same day', 'Adopt a privacy policy and a leaver checklist', 'Say what you collect and why, and remove access on a person’s last day.', 'M', 2, 'arc'),
    ] },
  ]

  function maturity(org) {
    const done = org.maturity || {}
    const areas = MATURITY_AREAS.map((a) => {
      const flags = a.statements.map((_, i) => !!done[a.id + '-' + (i + 1)])
      const level = flags.filter(Boolean).length
      const nextIndex = flags.indexOf(false)
      return { id: a.id, name: a.name, level, max: a.statements.length, next: nextIndex === -1 ? null : { ...a.statements[nextIndex], id: a.id + '-' + (nextIndex + 1), area: a.name } }
    })
    const r = reachScore(org)
    areas.push({ id: 'awareness', name: 'Digital awareness', level: r.answered ? Math.round((r.score / 100) * 3) : 0, max: 3, next: null, fromReach: true })
    const total = areas.reduce((s, a) => s + a.level, 0)
    const max = areas.reduce((s, a) => s + a.max, 0)
    const answered = Object.keys(done).length > 0
    return { areas, score: Math.round((total / max) * 100), answered }
  }

  // Share of a task's hours assumed recoverable. Planning assumptions, not measurements.
  const TASK_KINDS = {
    'Data entry': { share: 0.6, approach: 'Online forms that write straight into your records' },
    'Scheduling': { share: 0.5, approach: 'Self-service booking with automatic reminders' },
    'Receipts and thank-yous': { share: 0.8, approach: 'Automatic receipts and thank-you emails from the donation platform' },
    'Reporting': { share: 0.5, approach: 'Saved reports refreshed from the system of record' },
    'Email and follow-up': { share: 0.3, approach: 'Templates and scheduled sequences' },
    'Finance admin': { share: 0.4, approach: 'Bank feeds and rules in accounting software' },
    'Other': { share: 0.2, approach: 'Map the steps first; some will turn out to be one of the above' },
  }

  function automationPlan(org) {
    const rows = (org.tasks || []).filter((t) => num(t.hoursPerWeek) > 0).map((t, index) => {
      const k = TASK_KINDS[t.kind] || TASK_KINDS.Other
      return { index, name: t.name, kind: t.kind, hoursPerWeek: num(t.hoursPerWeek), recoverable: Math.round(num(t.hoursPerWeek) * k.share * 10) / 10, share: k.share, approach: k.approach }
    }).sort((a, b) => b.recoverable - a.recoverable)
    const hours = rows.reduce((s, r) => s + r.hoursPerWeek, 0)
    const recoverable = Math.round(rows.reduce((s, r) => s + r.recoverable, 0) * 10) / 10
    return { rows, hours, recoverable, perYear: Math.round(recoverable * 52) }
  }

  const PHASES = [['S', 'First 30 days'], ['M', 'By 60 days'], ['L', 'By 90 days']]

  /** One prioritised plan drawn from every module. Status lives in org.plan[id]. */
  function roadmap(org, eligibleCount) {
    const items = []
    for (const a of maturity(org).areas) if (a.next) items.push({ id: 'm-' + a.next.id, area: a.name, title: a.next.title, how: a.next.how, effort: a.next.effort, impact: a.next.impact, help: a.next.help })
    for (const f of reachScore(org).fixes.slice(0, 3)) items.push({ id: 'r-' + f.id, area: 'Digital awareness', title: f.fix.split('. ')[0].replace(/\.$/, ''), how: 'Not true yet: ' + f.text.replace(/^./, (c) => c.toLowerCase()) + '.', effort: f.weight >= 3 ? 'S' : 'M', impact: f.weight, help: 'self', goal: true })
    for (const r of automationPlan(org).rows.slice(0, 2)) items.push({ id: 't-' + r.index, area: 'Process automation', title: `Automate “${r.name || r.kind}”`, how: `${r.approach}. Assumed to return about ${r.recoverable} of ${r.hoursPerWeek} hours a week.`, effort: 'M', impact: r.recoverable >= 4 ? 3 : 2, help: 'arc' })
    if (eligibleCount > 0) items.push({ id: 'claim-tech', area: 'Funding', title: `Claim the ${eligibleCount} technology program${eligibleCount === 1 ? '' : 's'} you likely qualify for`, how: 'Start with the validator registration; one approval unlocks several programs. See Funding → Eligible now.', effort: 'S', impact: 3, help: 'self' })
    const plan = org.plan || {}
    const withStatus = items.map((i) => ({ ...i, status: plan[i.id] || 'todo' }))
    const phases = PHASES.map(([effort, label]) => ({ label, items: withStatus.filter((i) => i.effort === effort).sort((a, b) => b.impact - a.impact).slice(0, 6) }))
    const all = phases.flatMap((p) => p.items)
    return { phases, total: all.length, done: all.filter((i) => i.status === 'done').length, arc: all.filter((i) => i.help === 'arc' && i.status !== 'done') }
  }

  // ── Funding ─────────────────────────────────────────────────────────────
  const ORG_KINDS = ['Community nonprofit', 'School or academic institution', 'Hospital or healthcare provider', 'Government body', 'Faith congregation']
  const COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'Australia', 'European Union', 'Other']
  const CAUSES = ['Youth development', 'Education', 'Health', 'Mental health', 'Housing and homelessness', 'Food security', 'Environment', 'Arts and culture', 'Disability', 'Older people', 'Refugees and migration', 'Animal welfare', 'Community development', 'Human rights']

  /**
   * Split a program catalog into likely-eligible and not, with the reason.
   * A program: { id, requiresRegistered, excludesKinds: [], countries: null | [] }.
   * "Likely" is the honest word: each provider makes the final decision.
   */
  function eligiblePrograms(org, programs) {
    const eligible = [], notEligible = []
    for (const p of programs || []) {
      let reason = null
      if (p.requiresRegistered && !org.registered) reason = 'Requires registered nonprofit or charity status.'
      else if ((p.excludesKinds || []).includes(org.orgKind)) reason = `Not open to: ${org.orgKind.toLowerCase()}.`
      else if (p.countries && !p.countries.includes(org.country)) reason = `Not listed as available in: ${org.country}.`
      if (reason) notEligible.push({ ...p, reason }); else eligible.push({ ...p, claimed: !!(org.claimed || {})[p.id] })
    }
    return { eligible, notEligible }
  }

  /** Pre-filled searches on real grant databases. source.search uses {q} for the keywords. */
  function grantSearches(org, sources) {
    const cause = (org.causeArea || '').trim()
    const place = (org.location || '').trim()
    const q = cause
    return (sources || []).filter((s) => !s.countries || s.countries.includes(org.country)).map((s) => ({
      ...s,
      keywords: q,
      href: s.search && q ? s.search.replace('{q}', encodeURIComponent(q)) : s.url,
      prefilled: !!(s.search && q),
      place,
    }))
  }

  const READINESS_ITEMS = [
    { id: 'registration', text: 'Proof of registration', detail: 'Your charity or tax-exempt registration number and the letter or certificate confirming it.' },
    { id: 'governing', text: 'Governing document', detail: 'Constitution, articles or bylaws, signed and dated.' },
    { id: 'board', text: 'Current list of board members or trustees', detail: 'Names, roles and affiliations. Many funders expect at least two members who are not related to each other.' },
    { id: 'accounts', text: 'Most recent annual accounts or tax filing', detail: 'In the US, your latest Form 990 and financial statements; elsewhere, the annual accounts your regulator requires.' },
    { id: 'budget', text: 'This year’s budget', detail: 'Income and costs for the organization, plus a budget for the specific project.' },
    { id: 'bank', text: 'Bank account in the organization’s name', detail: 'Funders will not pay into a personal account. A statement from the last three months is often requested.' },
    { id: 'policies', text: 'Core policies', detail: 'Safeguarding where you work with children or adults at risk, equality, and data protection.' },
    { id: 'evidence', text: 'Evidence of impact', detail: 'Numbers and one or two stories from the last year. Mission Outcomes produces these.' },
    { id: 'case', text: 'A one-paragraph case for support', detail: 'The need, what you do about it, and what a gift makes possible. The Application kit drafts it.' },
  ]

  function readiness(org) {
    const done = org.readiness || {}
    const missing = READINESS_ITEMS.filter((i) => !done[i.id])
    return { score: Math.round(((READINESS_ITEMS.length - missing.length) / READINESS_ITEMS.length) * 100), missing, ready: missing.length === 0 }
  }

  /** Open pipeline items with a deadline, soonest first. `today` is 'YYYY-MM-DD'. */
  function deadlines(org, today) {
    const t = Date.parse(today + 'T00:00:00Z')
    return (org.pipeline || []).filter((p) => p.deadline && p.stage !== 'Won' && p.stage !== 'Declined' && !Number.isNaN(Date.parse(p.deadline + 'T00:00:00Z')))
      .map((p) => ({ ...p, days: Math.round((Date.parse(p.deadline + 'T00:00:00Z') - t) / 86400000) }))
      .sort((a, b) => a.days - b.days)
  }

  const cur = (org, v) => (org.currency || '$') + Math.round(num(v)).toLocaleString('en-US')

  /**
   * Reusable application answers assembled from what has already been entered.
   * Templates, not generated prose: every sentence is traceable to an input.
   */
  function applicationKit(org) {
    const m = metrics(org)
    const name = org.name || 'Our organization'
    const where = org.location ? ` in ${org.location}` : ''
    const sections = []
    const about = [`${name} is a ${org.registered ? 'registered ' : ''}nonprofit${where}.`]
    if (org.mission) about.push(/[.!?]$/.test(org.mission.trim()) ? org.mission.trim() : org.mission.trim() + '.')
    if (num(org.peopleServed) > 0) about.push(`Each year we serve ${num(org.peopleServed).toLocaleString('en-US')} people.`)
    const team = [num(org.staffFte) > 0 ? `${num(org.staffFte)} staff` : '', num(org.volunteers) > 0 ? `${num(org.volunteers)} regular volunteers` : ''].filter(Boolean)
    if (team.length) about.push(`The work is delivered by ${team.join(' and ')}.`)
    sections.push({ id: 'about', title: 'About the organization', text: about.join(' ') })
    sections.push({ id: 'need', title: 'The need', text: org.needStatement || '', missing: org.needStatement ? null : 'Add a need statement below — one or two sentences on the problem, with a number if you have one.' })
    const outs = (org.outcomes || []).filter((o) => o.name)
    if (outs.length) {
      sections.push({ id: 'impact', title: 'Evidence of impact', text: outs.map((o) => {
        const p = outcomeProgress(o)
        const unit = o.unit === '%' ? '%' : ''
        return `${o.name}: ${p.improved ? 'improved' : 'moved'} from ${o.baseline}${unit} to ${o.current}${unit}${num(o.target) ? `, against a target of ${o.target}${unit}` : ''}.`
      }).join(' ') })
    } else sections.push({ id: 'impact', title: 'Evidence of impact', text: '', missing: 'Add indicators in Mission Outcomes and this section writes itself.' })
    if (m.expenses > 0) {
      const bits = [`Our annual budget is ${cur(org, m.expenses)}, of which ${Math.round(m.programShare * 100)}% goes directly to programs.`]
      if (m.revenue > 0) bits.push(`Income of ${cur(org, m.revenue)} comes from ${m.sourceCount} source${m.sourceCount === 1 ? '' : 's'}.`)
      if (m.costPerPerson) bits.push(`That is ${cur(org, m.costPerPerson)} per person served.`)
      sections.push({ id: 'budget', title: 'Budget summary', text: bits.join(' ') })
      const sus = []
      if (m.runwayMonths !== null) sus.push(`We hold unrestricted reserves equal to ${Math.round(m.runwayMonths * 10) / 10} months of operating costs.`)
      if (m.recurringShare !== null) sus.push(`${Math.round(m.recurringShare * 100)}% of our income is expected to repeat next year.`)
      if (m.largestShare !== null && m.largestShare > RULES.largestSourceHealthy) sus.push(`Our largest single funder provides ${Math.round(m.largestShare * 100)}% of income, and widening that base is a stated priority${pipelineTotals(org).count ? `: we are currently pursuing ${cur(org, pipelineTotals(org).total)} from ${pipelineTotals(org).count} other source${pipelineTotals(org).count === 1 ? '' : 's'}` : ''}.`)
      sections.push({ id: 'sustainability', title: 'Sustainability', text: sus.join(' ') })
    }
    if (num(org.askAmount) > 0 || org.askPurpose) {
      sections.push({ id: 'ask', title: 'The request', text: `We are requesting ${num(org.askAmount) > 0 ? cur(org, org.askAmount) : 'support'}${org.askPurpose ? ` to ${org.askPurpose.replace(/\.$/, '')}` : ''}.` })
    } else sections.push({ id: 'ask', title: 'The request', text: '', missing: 'Add the amount and what it would pay for below.' })
    return sections
  }

  /** A prompt a nonprofit can paste into the AI assistant it already uses. */
  function aiPrompt(org, funderQuestion) {
    const kit = applicationKit(org).filter((s) => s.text)
    return [
      'You are helping a small nonprofit draft a grant application answer.',
      'Use ONLY the facts below. Do not invent numbers, outcomes, partners or quotes. If a fact needed for the answer is missing, say what is missing instead of filling the gap.',
      'Write in plain, warm, specific language. No jargon.',
      '',
      'FACTS',
      ...kit.map((s) => `${s.title}: ${s.text}`),
      '',
      'QUESTION FROM THE FUNDER',
      funderQuestion || '[paste the funder’s question and word limit here]',
    ].join('\n')
  }

  /** A short brief the organization can send when asking ARC for help. */
  function helpBrief(org, eligibleCount) {
    const m = metrics(org)
    const r = roadmap(org, eligibleCount)
    const f = findings(org).slice(0, 3)
    const lines = [`${org.name || 'Our organization'} — request for transformation support`, '']
    if (org.mission) lines.push(org.mission)
    const facts = [m.expenses > 0 ? `annual budget ${cur(org, m.expenses)}` : '', num(org.staffFte) > 0 ? `${num(org.staffFte)} staff` : '', num(org.peopleServed) > 0 ? `${num(org.peopleServed).toLocaleString('en-US')} people served a year` : ''].filter(Boolean)
    if (facts.length) lines.push(facts.join(' · ').replace(/^./, (c) => c.toUpperCase()))
    lines.push('', `Digital maturity: ${maturity(org).score} out of 100.`)
    if (f.length) lines.push('', 'What our assessment flagged:', ...f.map((x) => `- ${x.title}`))
    if (r.arc.length) lines.push('', 'Where we would like help:', ...r.arc.map((x) => `- ${x.title} (${x.area})`))
    const a = automationPlan(org)
    if (a.rows.length) lines.push('', `Administrative work we have listed: ${a.hours} hours a week across ${a.rows.length} task${a.rows.length === 1 ? '' : 's'}.`)
    return lines.join('\n')
  }

  return {
    MATURITY_AREAS, TASK_KINDS, ORG_KINDS, COUNTRIES, CAUSES, READINESS_ITEMS,
    maturity, automationPlan, roadmap, eligiblePrograms, grantSearches, readiness, deadlines, applicationKit, aiPrompt, helpBrief,
    RULES, WEIGHTS, SOURCE_TYPES, REACH_ITEMS, DEFAULT_SCENARIO,
    blankOrg, sampleOrg, metrics, reachScore, health, findings,
    simulate, pipelineTotals, fundingMatches, outcomeProgress,
  }
})

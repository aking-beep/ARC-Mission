// node test.js — no dependencies.
const assert = require('node:assert/strict')
const M = require('./model.js')

let n = 0
const test = (name, fn) => { fn(); n++; console.log('  PASS ' + name) }
const near = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} !~ ${b}`)

const org = M.sampleOrg()

test('blank organization produces no score and no crash', () => {
  const b = M.blankOrg()
  assert.equal(M.health(b).score, null)
  assert.deepEqual(M.findings(b), [])
  assert.equal(M.metrics(b).runwayMonths, null)
  assert.equal(M.simulate(b).scenario.zeroMonth, null)
})

test('metrics add up for the sample organization', () => {
  const m = M.metrics(org)
  assert.equal(m.revenue, 360000)
  assert.equal(m.expenses, 352000)
  assert.equal(m.surplus, 8000)
  near(m.runwayMonths, 54000 / (352000 / 12))
  near(m.largestShare, 210000 / 360000)
  near(m.recurringShare, 285000 / 360000)
  near(m.adminLoad, 62 / 200)
})

test('health is a weighted 0–100 score with every part present', () => {
  const h = M.health(org)
  assert.ok(h.score >= 0 && h.score <= 100)
  assert.equal(h.parts.length, 6)
  assert.ok(h.complete)
  assert.equal(h.parts.reduce((s, p) => s + p.weight, 0), 100)
})

test('missing parts are left out and the rest re-weighted', () => {
  const o = M.blankOrg()
  o.revenue = [{ source: 'A', type: 'Grant', amount: 100, recurring: true }]
  const h = M.health(o)
  assert.equal(h.complete, false)
  assert.equal(h.parts.find((p) => p.id === 'reserves').score, null)
  assert.ok(h.score !== null)
})

test('stronger reserves never lower the score', () => {
  const richer = { ...org, reserves: org.reserves * 4 }
  assert.ok(M.health(richer).score >= M.health(org).score)
})

test('findings flag concentration and thin reserves, most severe first', () => {
  const f = M.findings(org)
  const ids = f.map((x) => x.id)
  assert.ok(ids.includes('concentration'))
  assert.ok(ids.includes('low-reserves'))
  assert.ok(ids.includes('admin-load'))
  for (let i = 1; i < f.length; i++) assert.ok(f[i - 1].severity >= f[i].severity)
  assert.ok(f.every((x) => x.title && x.why && x.next && x.module))
})

test('a healthy organization gets the invest finding, not the risk ones', () => {
  const o = M.sampleOrg()
  o.reserves = 400000
  o.revenue = [
    { source: 'A', type: 'Grant', amount: 100000, recurring: true },
    { source: 'B', type: 'Individual giving', amount: 100000, recurring: true },
    { source: 'C', type: 'Corporate', amount: 100000, recurring: true },
    { source: 'D', type: 'Government', amount: 100000, recurring: true },
  ]
  const ids = M.findings(o).map((x) => x.id)
  assert.ok(ids.includes('capacity-to-invest'))
  assert.ok(!ids.includes('concentration') && !ids.includes('low-reserves') && !ids.includes('deficit'))
})

test('baseline simulation matches arithmetic', () => {
  const s = M.simulate(org, {}, 24)
  assert.equal(s.baseline.cash.length, 25)
  near(s.baseline.cash[12], 54000 + 8000)
  assert.equal(s.baseline.zeroMonth, null)
  assert.deepEqual(s.baseline.cash, s.scenario.cash)
})

test('losing the largest funder runs cash out on the computed month', () => {
  const s = M.simulate(org, { loseLargest: true }, 24)
  assert.equal(s.scenario.revenue, 150000)
  const monthly = (150000 - 352000) / 12
  assert.equal(s.scenario.zeroMonth, Math.floor(54000 / -monthly) + 1)
  assert.ok(s.scenario.cash[s.scenario.zeroMonth] < 0)
  assert.ok(s.scenario.cash[s.scenario.zeroMonth - 1] >= 0)
})

test('hires raise cost and capacity; automation frees hours up to the admin total', () => {
  const s = M.simulate(org, { newHires: 1, costPerHire: 52400, hoursAutomated: 500, toolCost: 3000 })
  assert.equal(s.scenario.expenses, 352000 + 52400 + 3000)
  assert.equal(s.peopleServed, Math.round(340 * ((262000 + 52400) / 262000)))
  assert.equal(s.hoursFreedPerYear, 62 * 52)
})

test('pipeline is weighted by probability and only counted when asked', () => {
  const p = M.pipelineTotals(org)
  assert.equal(p.total, 50000)
  assert.equal(p.weighted, 40000 * 0.4 + 10000 * 0.5)
  assert.equal(M.simulate(org, {}).scenario.revenue, 360000)
  assert.equal(M.simulate(org, { includePipeline: true }).scenario.revenue, 360000 + p.weighted)
  const o = M.sampleOrg()
  o.pipeline[0].stage = 'Declined'
  assert.equal(M.pipelineTotals(o).total, 10000)
})

test('reach score is the weighted share of checked items', () => {
  assert.equal(M.reachScore(M.blankOrg()).score, 0)
  assert.equal(M.reachScore(M.blankOrg()).answered, false)
  const all = M.blankOrg()
  M.REACH_ITEMS.forEach((i) => (all.reach[i.id] = true))
  assert.equal(M.reachScore(all).score, 100)
  assert.equal(M.reachScore(all).fixes.length, 0)
  const r = M.reachScore(org)
  assert.ok(r.score > 0 && r.score < 100)
  assert.ok(r.fixes[0].weight >= r.fixes[r.fixes.length - 1].weight)
})

test('funding matches are ranked and respond to the organization', () => {
  const f = M.fundingMatches(org)
  for (let i = 1; i < f.length; i++) assert.ok(f[i - 1].fit >= f[i].fit)
  assert.ok(f.some((x) => x.id === 'tech-donations'))
  const unregistered = { ...org, registered: false }
  assert.ok(!M.fundingMatches(unregistered).some((x) => x.id === 'tech-donations'))
})

test('outcome progress handles rising and falling targets', () => {
  const up = M.outcomeProgress({ baseline: 100, current: 150, target: 200 })
  assert.equal(up.toTarget, 0.5)
  assert.equal(up.improved, true)
  const down = M.outcomeProgress({ baseline: 40, current: 30, target: 20 })
  assert.equal(down.toTarget, 0.5)
  assert.equal(down.improved, true)
  assert.equal(M.outcomeProgress({ baseline: 0, current: 5, target: 0 }).toTarget, null)
})

const C = require('./catalog.js')

test('catalog entries are complete and link to https pages', () => {
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(C.checked))
  const ids = new Set()
  for (const p of C.PROGRAMS) {
    assert.ok(p.id && p.name && p.provider && p.offer && p.steps.length >= 2, p.id)
    assert.ok(p.url.startsWith('https://'), p.id)
    assert.ok(p.excludesKinds.every((k) => M.ORG_KINDS.includes(k)), p.id)
    assert.ok(!ids.has(p.id)); ids.add(p.id)
  }
  for (const s of C.SOURCES) {
    assert.ok(s.name && s.covers && s.url.startsWith('https://'), s.name)
    if (s.search) assert.ok(s.search.includes('{q}') && s.search.startsWith('https://'), s.name)
    if (s.countries) assert.ok(s.countries.every((c) => M.COUNTRIES.includes(c)), s.name)
  }
})

test('eligibility respects registration, kind of organization and country', () => {
  const all = M.eligiblePrograms(org, C.PROGRAMS)
  assert.equal(all.eligible.length + all.notEligible.length, C.PROGRAMS.length)
  assert.equal(all.notEligible.length, 0)
  const un = M.eligiblePrograms({ ...org, registered: false }, C.PROGRAMS)
  assert.equal(un.eligible.length, 0)
  assert.ok(un.notEligible.every((p) => p.reason))
  const school = M.eligiblePrograms({ ...org, orgKind: 'School or academic institution' }, C.PROGRAMS)
  assert.ok(!school.eligible.some((p) => p.id === 'google'))
  assert.ok(school.eligible.some((p) => p.id === 'salesforce'))
  const uk = M.eligiblePrograms({ ...org, country: 'United Kingdom' }, C.PROGRAMS)
  assert.ok(!uk.eligible.some((p) => p.id === 'paypal'))
  const claimed = M.eligiblePrograms({ ...org, claimed: { canva: true } }, C.PROGRAMS)
  assert.equal(claimed.eligible.find((p) => p.id === 'canva').claimed, true)
})

test('grant searches are filtered by country and pre-filled only with a cause', () => {
  const us = M.grantSearches(org, C.SOURCES)
  assert.ok(us.some((s) => s.name === 'Grants.gov') && !us.some((s) => s.name === 'Find a grant'))
  assert.equal(us.find((s) => s.name === 'Grants.gov').href, 'https://simpler.grants.gov/search?query=Youth%20development')
  const none = M.grantSearches({ ...org, causeArea: '' }, C.SOURCES)
  assert.ok(none.every((s) => !s.prefilled && s.href === s.url))
  const uk = M.grantSearches({ ...org, country: 'United Kingdom' }, C.SOURCES)
  assert.ok(uk.some((s) => s.name === 'Find a grant') && uk.some((s) => s.name === 'Candid'))
})

test('maturity counts true statements and names the next step per area', () => {
  const blank = M.maturity(M.blankOrg())
  assert.equal(blank.score, 0)
  assert.equal(blank.areas.length, 8)
  const m = M.maturity(org)
  assert.equal(m.areas.find((a) => a.id === 'finance').level, 2)
  assert.equal(m.areas.find((a) => a.id === 'finance').next.id, 'finance-3')
  const full = M.blankOrg()
  M.MATURITY_AREAS.forEach((a) => a.statements.forEach((_, i) => (full.maturity[a.id + '-' + (i + 1)] = true)))
  M.REACH_ITEMS.forEach((i) => (full.reach[i.id] = true))
  assert.equal(M.maturity(full).score, 100)
})

test('automation plan applies the stated share and sorts by hours returned', () => {
  const a = M.automationPlan(org)
  assert.equal(a.hours, 26)
  near(a.recoverable, 9 * 0.6 + 7 * 0.5 + 6 * 0.5 + 4 * 0.8, 0.11)
  assert.equal(a.perYear, Math.round(a.recoverable * 52))
  for (let i = 1; i < a.rows.length; i++) assert.ok(a.rows[i - 1].recoverable >= a.rows[i].recoverable)
  assert.equal(M.automationPlan(M.blankOrg()).recoverable, 0)
})

test('roadmap phases by effort, tracks status, and lists where ARC can help', () => {
  const r = M.roadmap(org, 3)
  assert.deepEqual(r.phases.map((p) => p.label), ['First 30 days', 'By 60 days', 'By 90 days'])
  const all = r.phases.flatMap((p) => p.items)
  assert.equal(new Set(all.map((i) => i.id)).size, all.length)
  assert.ok(all.some((i) => i.id === 'claim-tech'))
  assert.ok(!M.roadmap(org, 0).phases.flatMap((p) => p.items).some((i) => i.id === 'claim-tech'))
  assert.ok(r.arc.length > 0 && r.arc.every((i) => i.help === 'arc'))
  const first = all[0].id
  const done = M.roadmap({ ...org, plan: { [first]: 'done' } }, 3)
  assert.equal(done.done, 1)
  assert.equal(M.roadmap(M.blankOrg(), 0).done, 0)
})

test('readiness and deadlines', () => {
  assert.equal(M.readiness(M.blankOrg()).score, 0)
  assert.equal(M.readiness(org).missing.length, M.READINESS_ITEMS.length - 4)
  const d = M.deadlines(org, '2026-11-21')
  assert.equal(d.length, 1)
  assert.equal(d[0].days, 55)
  assert.equal(M.deadlines(org, '2027-01-20')[0].days, -5)
})

test('application kit only states what was entered', () => {
  const kit = M.applicationKit(org)
  const byId = Object.fromEntries(kit.map((s) => [s.id, s]))
  assert.ok(byId.about.text.includes('Harbor Light Youth Center') && byId.about.text.includes('340'))
  assert.ok(byId.budget.text.includes('$352,000') && byId.budget.text.includes('74%'))
  assert.ok(byId.ask.text.includes('$40,000'))
  assert.ok(byId.impact.text.includes('from 120 to 164'))
  const blank = M.applicationKit(M.blankOrg())
  assert.ok(blank.find((s) => s.id === 'need').missing && blank.find((s) => s.id === 'ask').missing)
  assert.ok(!blank.some((s) => s.id === 'budget'))
  assert.ok(!/undefined|NaN|null/.test(blank.concat(kit).map((s) => s.text).join(' ')))
  const prompt = M.aiPrompt(org, 'Describe your impact in 100 words.')
  assert.ok(prompt.includes('Do not invent') && prompt.includes('Describe your impact in 100 words.') && prompt.includes('$352,000'))
  assert.ok(!/undefined|NaN/.test(M.helpBrief(org, 3) + M.helpBrief(M.blankOrg(), 0)))
})

// ── Results: before and after ─────────────────────────────────────────
const R = (o) => Object.assign(M.blankResult(), { metric: 'Hours a week retyping forms', unit: 'hours', baseline: 9, baselineDate: '2026-09-01', after: 3, afterDate: '2026-11-30' }, o)

test('a result is an estimate unless measured with a stated method', () => {
  assert.equal(M.resultRecord(R()).label, 'Estimate')
  assert.equal(M.resultRecord(R({ measured: true })).label, 'Estimate')
  assert.ok(M.resultRecord(R({ measured: true })).warnings.some((w) => /how it was measured/i.test(w)))
  assert.equal(M.resultRecord(R({ measured: true, method: 'Timesheet log, 4 weeks each' })).label, 'Measured')
  assert.equal(M.resultRecord(R({ measured: 'yes', method: 'x' })).label, 'Estimate')
  assert.equal(M.evidenceLabel({ measured: true }), 'Measured')
  assert.equal(M.evidenceLabel({}), 'Estimate')
})

test('a result computes change and days only when complete', () => {
  const r = M.resultRecord(R())
  assert.ok(r.complete)
  assert.equal(r.change, -6)
  near(r.changePct, -6 / 9)
  assert.equal(r.days, 90)
  const zero = M.resultRecord(R({ baseline: 0, after: 5 }))
  assert.ok(zero.complete)
  assert.equal(zero.change, 5)
  assert.equal(zero.changePct, null)
})

test('incomplete or impossible results are flagged, never crash', () => {
  const blank = M.resultRecord(M.blankResult())
  assert.equal(blank.complete, false)
  assert.equal(blank.problems.length, 5)
  assert.equal(blank.change, null)
  assert.equal(blank.baseline, null)
  assert.equal(M.resultRecord(undefined).complete, false)
  assert.equal(M.resultRecord(R({ after: '' })).complete, false)
  assert.equal(M.resultRecord(R({ after: 'abc' })).complete, false)
  assert.equal(M.resultRecord(R({ afterDate: '2026-13-45' })).complete, false)
  const backwards = M.resultRecord(R({ afterDate: '2026-08-01' }))
  assert.equal(backwards.complete, false)
  assert.ok(backwards.problems.some((p) => /earlier/.test(p)))
})

test('a case study exists only when permission_to_publish is exactly true', () => {
  const org = { name: 'Test Org', results: [] }
  assert.equal(M.caseStudy(org, R()), null)
  assert.equal(M.caseStudy(org, R({ permission_to_publish: false })), null)
  assert.equal(M.caseStudy(org, R({ permission_to_publish: 'true' })), null)
  assert.equal(M.caseStudy(org, R({ permission_to_publish: 1 })), null)
  assert.equal(M.caseStudy(org, R({ permission_to_publish: true, after: null })), null, 'incomplete records never publish')
  const c = M.caseStudy(org, R({ permission_to_publish: true, permissionDate: '2026-12-01' }))
  assert.ok(c)
  assert.equal(c.permissionDate, '2026-12-01')
  assert.ok(M.resultRecord(R({ permission_to_publish: true })).warnings.some((w) => /date permission/i.test(w)))
})

test('case studies label estimates in the text itself', () => {
  const org = { name: 'Test Org' }
  const e = M.caseStudy(org, R({ permission_to_publish: true, work: 'Paper forms replaced with an online form' }))
  assert.equal(e.label, 'Estimate')
  assert.ok(e.headline.endsWith('(estimate)'))
  assert.ok(e.body.includes('This figure is an estimate. It was not measured.'))
  assert.ok(e.body.includes('from 9 hours to 3 hours') && e.body.includes('about 3 months') && e.body.includes('Test Org'))
  assert.ok(e.body.includes('What changed: Paper forms replaced with an online form.'))
  const m = M.caseStudy(org, R({ permission_to_publish: true, measured: true, method: 'Timesheet log' }))
  assert.equal(m.label, 'Measured')
  assert.ok(!/estimate/i.test(m.headline + m.body))
  assert.ok(m.body.includes('How it was measured: Timesheet log.'))
  assert.ok(!/undefined|NaN|null/.test(e.body + m.body + e.headline))
})

test('results summary counts and the sample publishes only what it may', () => {
  const s = M.results(org)
  assert.equal(s.rows.length, 2)
  assert.equal(s.complete, 2)
  assert.equal(s.measured, 1)
  assert.equal(s.publishable, 1)
  const cases = M.caseStudies(org)
  assert.equal(cases.length, 1)
  assert.equal(cases[0].label, 'Estimate')
  assert.deepEqual(M.caseStudies(M.blankOrg()), [])
  assert.deepEqual(M.results(M.blankOrg()), { rows: [], complete: 0, measured: 0, publishable: 0 })
})

test('unmeasured outcomes are labelled as estimates in the application kit', () => {
  const kit = Object.fromEntries(M.applicationKit(org).map((s) => [s.id, s]))
  assert.ok(kit.impact.text.includes('(estimate)'))
  const o = M.sampleOrg()
  o.outcomes = o.outcomes.map((x) => ({ ...x, measured: true }))
  assert.ok(!M.applicationKit(o).find((s) => s.id === 'impact').text.includes('(estimate)'))
})

// ── Quick wins: Google Ad Grants readiness ──────────────────────────────
test('the Ad Grants quick win is in the catalog, complete, and marked unverified', () => {
  const q = C.QUICK_WINS.find((x) => x.id === 'ad-grants')
  assert.ok(q && q.programId === 'google' && C.PROGRAMS.some((p) => p.id === q.programId))
  assert.ok(q.url.startsWith('https://') && q.items.length >= 6 && q.effort === 'S')
  assert.equal(new Set(q.items.map((i) => i.id)).size, q.items.length)
  assert.ok(q.items.every((i) => i.text && i.stage))
  assert.ok(q.checked === null || /^\d{4}-\d{2}-\d{2}$/.test(q.checked))
  assert.equal(M.quickWins(org, C)[0].verified, !!q.checked)
})

test('Ad Grants readiness follows Google eligibility and ticks, and feeds the roadmap', () => {
  const [w] = M.quickWins(org, C)
  assert.ok(w.eligible && w.done === 0 && !w.ready && w.next.id === w.items[0].id)
  const r = M.roadmap(org, 3, M.quickWins(org, C))
  const item = r.phases[0].items.find((i) => i.id === 'q-ad-grants')
  assert.ok(item && item.quickWin && r.phases[0].label === 'First 30 days')
  assert.equal(r.phases[0].items[0].id, 'q-ad-grants')
  assert.ok(r.phases[0].items.some((i) => i.id === 'claim-tech'), 'a quick win does not push other steps out')
  const school = M.quickWins({ ...org, orgKind: 'School or academic institution' }, C)[0]
  assert.ok(!school.eligible && school.reason)
  assert.ok(!M.roadmap({ ...org, orgKind: 'School or academic institution' }, 3, [school]).phases.flatMap((p) => p.items).some((i) => i.id === 'q-ad-grants'))
  const ticks = Object.fromEntries(w.items.map((i) => [i.id, true]))
  const ready = M.quickWins({ ...org, quickWins: { 'ad-grants': ticks } }, C)[0]
  assert.ok(ready.ready && ready.score === 100 && ready.next === null)
  assert.ok(!M.roadmap(org, 3, [ready]).phases.flatMap((p) => p.items).some((i) => i.id === 'q-ad-grants'))
  assert.deepEqual(M.quickWins(M.blankOrg(), {}), [])
})

console.log(`\n${n} tests passed`)

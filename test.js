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

console.log(`\n${n} tests passed`)

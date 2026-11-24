/*
 * ARC Mission — the catalog. Data that goes stale lives here and nowhere else.
 *
 * Every fact below was read on the provider's own page on the `checked` date.
 * Details that could not be confirmed there were left out rather than guessed.
 * Re-check before each release: these programs change terms often.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory()
  else root.ArcMissionCatalog = factory()
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'
  const SCHOOL = 'School or academic institution', HEALTH = 'Hospital or healthcare provider', GOV = 'Government body', FAITH = 'Faith congregation'

  const PROGRAMS = [
    {
      id: 'google', provider: 'Google', name: 'Google for Nonprofits',
      offer: 'Google Workspace for Nonprofits at no charge, and Ad Grants of up to $10,000 a month in Search advertising.',
      note: 'Verified by Goodstack. In the US requires 501(c)(3) status. Available in a published list of countries.',
      requiresRegistered: true, excludesKinds: [GOV, HEALTH, SCHOOL], countries: null,
      steps: ['Request a Google for Nonprofits account', 'Complete Goodstack verification', 'Activate Workspace and Ad Grants separately — Workspace needs a working website on your domain'],
      url: 'https://www.google.com/nonprofits/eligibility/',
    },
    {
      id: 'microsoft', provider: 'Microsoft', name: 'Microsoft nonprofit offers',
      offer: 'Microsoft 365 Business Basic free for up to 300 users, Business Premium at 75% off, and $2,000 a year in Azure credits.',
      note: 'The free Business Premium and Office 365 E1 grants ended on 1 July 2025. Advocacy, political, sports and membership bodies are also excluded.',
      requiresRegistered: true, excludesKinds: [GOV, HEALTH, SCHOOL], countries: null,
      steps: ['Register on the Microsoft nonprofit portal', 'Confirm eligibility', 'Claim offers in the Microsoft 365 admin center'],
      url: 'https://www.microsoft.com/en-us/nonprofits/eligibility',
    },
    {
      id: 'techsoup', provider: 'TechSoup', name: 'TechSoup validation and marketplace',
      offer: 'Donated and discounted software and hardware for an admin fee. Its validation is also what several other programs here rely on.',
      note: 'The US site accepts 501(c)(3) public charities and libraries. Other countries use TechSoup Global Network partner sites.',
      requiresRegistered: true, excludesKinds: [GOV], countries: null,
      steps: ['Sign up at TechSoup', 'Add your organization with its registration number', 'Wait for qualification review, typically two business days'],
      url: 'https://support.techsoup.org/hc/en-us/articles/360055217213-How-to-Join-TechSoup-U-S',
    },
    {
      id: 'aws', provider: 'Amazon Web Services', name: 'AWS Nonprofit Credit Program',
      offer: 'Up to $5,000 in AWS promotional credit, once per fiscal year (1 July – 30 June).',
      note: 'Requested through TechSoup or its partner NGOs. Any budget size.',
      requiresRegistered: true, excludesKinds: [SCHOOL], countries: null,
      steps: ['Request the credit through TechSoup', 'Receive your code', 'Redeem it in the AWS Billing console'],
      url: 'https://aws.amazon.com/government-education/nonprofits/nonprofit-credit-program/',
    },
    {
      id: 'canva', provider: 'Canva', name: 'Canva for Nonprofits',
      offer: 'Canva Pro features free for one team of up to 50 people.',
      note: 'Verified by Goodstack. Grant-making foundations, membership bodies and political organizations are excluded.',
      requiresRegistered: true, excludesKinds: [GOV, SCHOOL], countries: null,
      steps: ['Create a Canva account', 'Fill in the nonprofit application', 'Complete Goodstack verification'],
      url: 'https://www.canva.com/canva-for-nonprofits/',
    },
    {
      id: 'slack', provider: 'Slack', name: 'Slack for Nonprofits',
      offer: 'Slack Pro free for workspaces of up to 250 members, and 85% off above that.',
      note: 'Reviewed by TechSoup. Private foundations and political organizations are excluded.',
      requiresRegistered: true, excludesKinds: [GOV, HEALTH, SCHOOL, FAITH], countries: null,
      steps: ['Create a Slack workspace', 'Have the workspace owner submit the nonprofit application', 'Discount is applied within three days of approval'],
      url: 'https://slack.com/help/articles/204368833-Apply-for-the-Slack-for-Nonprofits-discount',
    },
    {
      id: 'github', provider: 'GitHub', name: 'GitHub for Nonprofits',
      offer: 'The GitHub Team plan free for unlimited users, or 25% off Enterprise Cloud.',
      note: 'Must be non-governmental, non-academic, non-commercial and non-political.',
      requiresRegistered: true, excludesKinds: [GOV, SCHOOL], countries: null,
      steps: ['Open the GitHub nonprofit portal', 'Authorize your GitHub organization as an owner', 'Submit the validation form with documents and choose a plan'],
      url: 'https://github.com/solutions/industry/nonprofits',
    },
    {
      id: 'salesforce', provider: 'Salesforce', name: 'Salesforce Power of Us',
      offer: 'Ten donated Enterprise Edition licenses that do not expire, plus discounts on more.',
      note: 'One donation per registered organization. Fiscally sponsored organizations are accepted.',
      requiresRegistered: true, excludesKinds: [], countries: null,
      steps: ['Create a Trailblazer ID', 'Apply in the Power of Us portal', 'Choose a product after approval, usually within three business days'],
      url: 'https://www.salesforce.com/company/power-of-us/',
    },
    {
      id: 'zoom', provider: 'Zoom', name: 'Zoom Cares nonprofit discount',
      offer: '50% off annual Zoom Workplace Pro and Business plans, and the Webinar and Large Meeting add-ons.',
      note: 'Verified by Goodstack. Operating budget must be $10 million or less. No longer offered through TechSoup.',
      requiresRegistered: true, excludesKinds: [GOV, HEALTH, SCHOOL], countries: null,
      steps: ['Apply on the Zoom Cares page', 'Complete Goodstack verification', 'Buy an annual plan at the discounted rate'],
      url: 'https://www.zoom.com/en/zoom-cares/',
    },
    {
      id: 'atlassian', provider: 'Atlassian', name: 'Atlassian Social Impact License',
      offer: 'Jira, Confluence and Loom free for up to 25 users, and 75% off other cloud apps.',
      note: 'Verified by Goodstack. Must be non-governmental and non-political.',
      requiresRegistered: true, excludesKinds: [GOV], countries: null,
      steps: ['Apply on the Atlassian nonprofits page', 'Complete Goodstack verification', 'Apply the license to your site'],
      url: 'https://www.atlassian.com/teams/nonprofits',
    },
    {
      id: 'notion', provider: 'Notion', name: 'Notion for Nonprofits',
      offer: '50% off the Notion Business plan, for up to three workspaces.',
      note: 'Open to civil society organizations worldwide.',
      requiresRegistered: true, excludesKinds: [], countries: null,
      steps: ['Submit the form with your Workspace ID and documents', 'Wait 3–7 business days', 'Upgrade at the discounted rate'],
      url: 'https://www.notion.com/nonprofits',
    },
    {
      id: 'airtable', provider: 'Airtable', name: 'Airtable nonprofit plan',
      offer: '50% off the Airtable Team plan.',
      note: 'Private foundations and political organizations are excluded. Reviewed in about two business days.',
      requiresRegistered: true, excludesKinds: [GOV, HEALTH, FAITH], countries: null,
      steps: ['Create an Airtable workspace', 'Submit the nonprofit application with proof of registration', 'Upgrade once approved'],
      url: 'https://support.airtable.com/articles/4920135568-applying-for-non-profit-education-and-student-airtable-plans',
    },
    {
      id: 'asana', provider: 'Asana', name: 'Asana for Nonprofits',
      offer: '50% off Asana Starter or Advanced.',
      note: 'Schools are routed to a separate education program.',
      requiresRegistered: true, excludesKinds: [HEALTH, SCHOOL], countries: null,
      steps: ['Choose your number of users', 'Verify your nonprofit status', 'Upgrade at the discounted rate'],
      url: 'https://asana.com/nonprofits',
    },
    {
      id: 'okta', provider: 'Okta', name: 'Okta for Good',
      offer: '50 free Workforce Identity licenses for single sign-on and multi-factor authentication, and 50% off more.',
      note: 'Verified by Goodstack.',
      requiresRegistered: true, excludesKinds: [GOV, HEALTH, SCHOOL], countries: null,
      steps: ['Apply on the Okta nonprofits page', 'Complete Goodstack verification', 'Activate your licenses'],
      url: 'https://www.okta.com/industries/nonprofits/',
    },
    {
      id: 'twilio', provider: 'Twilio', name: 'Twilio.org Impact Access',
      offer: 'Bonus free usage and a discount on SMS and voice: 25% in the US and Canada, 10% elsewhere.',
      note: 'WhatsApp and SendGrid are not discounted. Political organizations and social enterprises are excluded.',
      requiresRegistered: true, excludesKinds: [GOV], countries: null,
      steps: ['Open the Twilio Console', 'Choose your country and organization type', 'Enter your organization details and upgrade the account'],
      url: 'https://help.twilio.com/articles/4443965939995',
    },
    {
      id: 'paypal', provider: 'PayPal', name: 'PayPal charity rate',
      offer: 'A lower fee on donations for confirmed charities: 1.99% plus a fixed fee, against the standard 2.89% plus a fixed fee (US rates).',
      note: 'Requires an application and pre-approval.',
      requiresRegistered: true, excludesKinds: [GOV], countries: ['United States'],
      steps: ['Open a PayPal Business account', 'Apply for confirmed charity status', 'The charity rate applies once approved'],
      url: 'https://www.paypal.com/us/business/paypal-business-fees',
    },
  ]

  // `search` uses {q}. It is set only where a pre-filled search was confirmed to load.
  const SOURCES = [
    { name: 'Grants.gov', region: 'United States · federal', free: true, countries: ['United States'], covers: 'Every open US federal grant opportunity.', search: 'https://simpler.grants.gov/search?query={q}', url: 'https://simpler.grants.gov/search' },
    { name: 'ProPublica Nonprofit Explorer', region: 'United States · funder research', free: true, countries: ['United States'], covers: 'Tax filings for US foundations and nonprofits. Look up a foundation to see exactly who it funded and how much.', tip: 'Search for foundations in {place}, open their latest filing, and read the grants list.', search: 'https://projects.propublica.org/nonprofits/search?q={q}', url: 'https://projects.propublica.org/nonprofits/' },
    { name: 'Community foundation locator', region: 'United States · local', free: true, countries: ['United States'], covers: 'Find the community foundation that serves your area. They are often the most approachable first institutional funder.', tip: 'Look for the foundation covering {place}.', url: 'https://www.cof.org/page/community-foundation-locator' },
    { name: 'Find a grant', region: 'United Kingdom · government', free: true, countries: ['United Kingdom'], covers: 'Open UK government grants.', search: 'https://www.find-government-grants.service.gov.uk/grants?searchTerm={q}', url: 'https://www.find-government-grants.service.gov.uk/grants' },
    { name: '360Giving GrantNav', region: 'United Kingdom · funder research', free: true, countries: ['United Kingdom'], covers: 'Over a million grants already awarded by UK funders. Search your cause to see who funds work like yours.', url: 'https://grantnav.threesixtygiving.org/' },
    { name: 'UK Community Foundations', region: 'United Kingdom · local', free: true, countries: ['United Kingdom'], covers: 'Find your local community foundation.', tip: 'Look for the foundation covering {place}.', url: 'https://www.ukcommunityfoundations.org/our-network' },
    { name: 'GrantConnect', region: 'Australia · federal', free: true, countries: ['Australia'], covers: 'Australian Government grant opportunities. Registration is needed to download documents.', url: 'https://www.grants.gov.au/' },
    { name: 'Grants and Contributions', region: 'Canada · funder research', free: true, countries: ['Canada'], covers: 'Federal grants already awarded, not open calls. Useful for seeing which departments fund your kind of work.', url: 'https://search.open.canada.ca/grants/' },
    { name: 'EU Funding & Tenders', region: 'European Union', free: true, countries: ['European Union'], covers: 'Open calls for proposals across EU programmes.', url: 'https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/calls-for-proposals' },
    { name: 'Candid', region: 'Foundations · worldwide', free: false, countries: null, covers: 'The largest database of foundations and their grants. A limited free tier; the full directory is a paid subscription.', url: 'https://candid.org/find-funding' },
    { name: 'Instrumentl', region: 'United States · grant discovery', free: false, countries: ['United States'], covers: 'Paid service that matches grants to your organization and tracks deadlines. Offers a free trial.', url: 'https://www.instrumentl.com/pricing' },
  ]

  // Quick wins: short checklists that end in something an organization can claim.
  // `checked` is the date the items were read on the provider's own pages.
  // It is null when they have not been: the UI then says so on screen.
  //
  // NOT YET VERIFIED (2026-11-23): Google's Ad Grants pages could not be reached
  // when this was written, so the items below are stated from general knowledge
  // of the program and deliberately leave out exact thresholds. Read
  // https://support.google.com/grants/ before showing this to a nonprofit, then
  // set `checked`.
  const QUICK_WINS = [
    {
      id: 'ad-grants', programId: 'google', title: 'Get ready for Google Ad Grants',
      area: 'Digital awareness', effort: 'S', impact: 3, help: 'self',
      offer: 'Google Search advertising at no cost, through Google for Nonprofits. The size of the grant is on the Google for Nonprofits entry under Funding → Eligible now.',
      checked: null,
      url: 'https://www.google.com/grants/',
      items: [
        { id: 'gfn', stage: 'Before you apply', text: 'The organization has an approved Google for Nonprofits account' },
        { id: 'domain', stage: 'Before you apply', text: 'The website is on the organization’s own domain, not a social media page or a free page on someone else’s site' },
        { id: 'https', stage: 'Before you apply', text: 'Every page loads securely over HTTPS' },
        { id: 'content', stage: 'Before you apply', text: 'The website clearly states the mission and describes the programs in detail' },
        { id: 'noncommercial', stage: 'Before you apply', text: 'The website is not mainly selling products or showing other people’s ads' },
        { id: 'goal', stage: 'Before you apply', text: 'One action you want visitors to take is chosen: donate, volunteer, sign up or get help' },
        { id: 'tracking', stage: 'Once the account is live', text: 'Conversion tracking is set up for that action' },
        { id: 'structure', stage: 'Once the account is live', text: 'Campaigns are organised into ad groups by theme, each with more than one ad, plus sitelinks' },
        { id: 'review', stage: 'Once the account is live', text: 'Someone reviews the account every month against Google’s click-through and keyword-quality rules' },
        { id: 'owner', stage: 'Once the account is live', text: 'One named person owns the account and will answer Google’s yearly program survey' },
      ],
    },
  ]

  return { checked: '2026-11-21', PROGRAMS, SOURCES, QUICK_WINS }
})

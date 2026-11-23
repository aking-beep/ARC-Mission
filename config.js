/*
 * ARC Mission — the one place to configure what leaves the browser.
 *
 * Every value is empty by default. Empty means off: no form is sent, no
 * analytics script loads, and the page says so instead of pretending.
 * None of these are secrets — they are public endpoints and a public
 * project key, visible to anyone who views the page source.
 */
window.ARC_MISSION_CONFIG = {
  // Cohort applications (apply.html). A Formspree form URL
  // (https://formspree.io/f/xxxxxxx) or a Google Apps Script web app URL that
  // appends to a Google Sheet. Fields are sent as a normal form POST.
  FORM_ENDPOINT: '',

  // Page-level email signup. Any endpoint that accepts a form POST: a Kit form
  // (https://app.kit.com/forms/<id>/subscriptions), a Formspree form, or an
  // automation that adds to Beehiiv.
  SIGNUP_ENDPOINT: '',
  // Kit expects `email_address`; Formspree and most others take `email`.
  SIGNUP_EMAIL_FIELD: 'email',
  // Sent with every signup as `tag`. In Kit, also apply this tag on the form
  // itself, since Kit does not read tags from a public form POST.
  SIGNUP_TAG: 'mission',

  // PostHog. The project API key (starts phc_) and the region host.
  // Only named events are sent (see site.js); never what anyone types.
  POSTHOG_KEY: '',
  POSTHOG_HOST: 'https://us.i.posthog.com',
}

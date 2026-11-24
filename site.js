/*
 * ARC Mission — what the page is allowed to send, and nothing more.
 * Reads config.js. With every value empty (the default) this file sends nothing.
 *
 * - Analytics: PostHog loads only when POSTHOG_KEY is set. Autocapture and
 *   session recording are off; only the named events below are sent, with
 *   short fixed properties. Figures an organization enters are never sent.
 * - Signup: fills any element with data-signup with an email form tagged
 *   SIGNUP_TAG and posts it to SIGNUP_ENDPOINT.
 * - ArcSite.post(): the one function that posts a form, used by apply.html too.
 */
(function () {
  'use strict'
  const cfg = window.ARC_MISSION_CONFIG || {}

  // Events and the properties each may carry. Anything else is dropped.
  const EVENTS = {
    tab_viewed: ['tab'],
    sample_opened: [],
    own_org_started: [],
    finding_acted: ['finding'],
    apply_viewed: [],
    apply_submitted: ['staff_size', 'time_drain'],
    signup_submitted: ['page'],
  }

  const analyticsOn = !!cfg.POSTHOG_KEY
  if (analyticsOn) {
    // PostHog's standard loader stub: queues calls until array.js arrives.
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    window.posthog.init(cfg.POSTHOG_KEY, {
      api_host: cfg.POSTHOG_HOST || 'https://us.i.posthog.com',
      autocapture: false,
      capture_pageview: true,
      capture_pageleave: false,
      disable_session_recording: true,
      persistence: 'localStorage',
      respect_dnt: true,
    })
    window.posthog.register({ product: 'arc-mission' })
  }

  function track(name, props) {
    if (!analyticsOn || !window.posthog || !EVENTS[name]) return
    const clean = {}
    for (const k of EVENTS[name]) if (props && props[k] != null) clean[k] = String(props[k]).slice(0, 60)
    window.posthog.capture(name, clean)
  }

  /**
   * POST a FormData to an endpoint. Resolves { ok, message }.
   * If the endpoint refuses a script request (CORS), falls back to a plain
   * form submission in a new tab, which every form service accepts.
   */
  function post(endpoint, data) {
    if (!endpoint) return Promise.resolve({ ok: false, offline: true, message: 'Not connected yet.' })
    return fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? { ok: true } : { ok: false, message: 'The form service returned an error (' + res.status + '). Please try again.' }))
      .catch(() => {
        const f = document.createElement('form')
        f.method = 'POST'; f.action = endpoint; f.target = '_blank'; f.hidden = true
        for (const [k, v] of data.entries()) { const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; f.appendChild(i) }
        document.body.appendChild(f); f.submit(); f.remove()
        return { ok: true, viaTab: true }
      })
  }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

  function mountSignup(el) {
    const page = el.dataset.signup || 'page'
    const id = 'signup-email-' + page
    el.innerHTML = `
      <form class="signup" novalidate>
        <label for="${id}"><strong>Get ARC Mission updates</strong> <span class="small dim">Occasional email on new tools and cohort openings. Unsubscribe any time.</span></label>
        <div class="row" style="margin-top:8px">
          <input type="email" id="${id}" required autocomplete="email" placeholder="you@organization.org" style="flex:1 1 220px;max-width:340px">
          <button class="btn" type="submit">Sign up</button>
        </div>
        <p class="small signup-msg" role="status" aria-live="polite" style="margin-top:6px"></p>
      </form>`
    const form = el.querySelector('form'), input = form.querySelector('input'), msg = form.querySelector('.signup-msg')
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      if (!input.checkValidity()) { msg.textContent = 'Enter a valid email address.'; input.focus(); return }
      if (!cfg.SIGNUP_ENDPOINT) { msg.textContent = 'Signup is not connected yet, so nothing was sent.'; return }
      const data = new FormData()
      data.append(cfg.SIGNUP_EMAIL_FIELD || 'email', input.value.trim())
      data.append('tag', cfg.SIGNUP_TAG || 'mission')
      data.append('source', 'arc-mission:' + page)
      msg.textContent = 'Sending…'
      post(cfg.SIGNUP_ENDPOINT, data).then((r) => {
        msg.textContent = r.ok ? (r.viaTab ? 'Sent — confirm in the tab that opened.' : 'Thanks — check your inbox to confirm.') : r.message
        if (r.ok) { form.reset(); track('signup_submitted', { page }) }
      })
    })
  }

  function privacyNote() {
    document.querySelectorAll('[data-privacy]').forEach((el) => {
      el.textContent = analyticsOn
        ? 'Figures you enter stay on this device. We count visits and which sections are opened, never what you type.'
        : 'Figures you enter stay on this device. This page sends nothing unless you submit a form.'
    })
  }

  window.ArcSite = { config: cfg, analyticsOn, track, post, esc }
  const ready = () => { document.querySelectorAll('[data-signup]').forEach(mountSignup); privacyNote() }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready)
  else ready()
})()

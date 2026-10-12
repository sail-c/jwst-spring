const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

export function renderPortal(options = {}) {
  const { field = "cosmos", product = { title: "Team PSF" }, mode = "login", ready = false, message = "", errorCode = "", identity = null, siteUrl = "https://sail-c.github.io/jwst-spring/", adminEmail = "" } = options;
  const title = escapeHtml(product.title);
  const psfUrl = escapeHtml(siteUrl + "data_release/psf/" + field + ".html");
  const loginUrl = "/login?field=" + encodeURIComponent(field);
  let content;
  if (mode === "downloads") {
    content = '<section class="card"><div class="card-icon" aria-hidden="true">↓</div><div class="card-body"><h2>' + title + ' files</h2><p>Open the team download folder on Synology.</p><p class="note">The Synology download password is required.</p></div><a class="primary" href="/team/psf/' + field + '/download" target="_blank" rel="noopener noreferrer">Download PSF files <span aria-hidden="true">↗</span></a></section>';
  } else if (mode === "denied") {
    content = '<section class="card denied" role="alertdialog" aria-labelledby="denied-title" aria-describedby="denied-description"><div><h2 id="denied-title">Access denied</h2><p id="denied-description">This resource is restricted to approved team members. Please contact the administrator.</p><div class="actions"><a class="primary" href="' + loginUrl + '&amp;switch=1">Use another GitHub account</a><a class="secondary" href="' + psfUrl + '">Back to PSF</a></div></div></section>';
  } else {
    const notice = message || (!ready ? "Team sign-in is not available yet. Please contact the administrator." : "");
    content = '<section class="card login"><div><h2>' + (errorCode ? "Sign-in unsuccessful" : "Sign in to access team downloads") + '</h2><p>Your GitHub account must be on the team&#39;s approved member list.</p>' +
      (notice ? '<div class="notice' + (errorCode ? ' error-notice' : '') + '" role="alert"><p>' + escapeHtml(notice) + '</p>' + (errorCode ? '<p class="diagnostic">Diagnostic: <code>' + escapeHtml(errorCode) + '</code></p>' : '') + '</div>' : '') +
      (ready ? '<a class="primary" href="' + loginUrl + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z"></path></svg>Sign in with GitHub</a>' : '') + '</div></section>';
  }
  const account = identity && mode === "downloads" ? '<div class="account"><span>Signed in as <strong>' + escapeHtml(identity.login) + '</strong></span><form method="post" action="/logout"><input type="hidden" name="csrf" value="' + escapeHtml(identity.csrf) + '"><button class="text-button">Sign out</button></form></div>' : "";
  const contact = adminEmail ? '<p class="contact">Need access? <a href="mailto:' + escapeHtml(adminEmail) + '">Contact the administrator</a>.</p>' : "";
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>' + title + ' Downloads · JWST-SPRING</title><link rel="stylesheet" href="/portal.css"></head><body><header class="header"><a class="brand" href="' + escapeHtml(siteUrl) + '"><span aria-hidden="true">✦</span> JWST-SPRING</a>' + account + '</header><main><a class="back" href="' + psfUrl + '">← Back to ' + title + '</a><div class="heading"><h1>' + title + ' Downloads</h1><span class="badge"><span aria-hidden="true">🔒</span> Private team only</span></div><p class="intro">PSF products for approved JWST-SPRING team members.</p>' + content + contact + '</main><footer>© 2026 JWST-SPRING Team</footer></body></html>';
}

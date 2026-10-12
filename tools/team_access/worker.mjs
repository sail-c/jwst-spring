import { renderPortal } from "./portal.mjs";

const encoder = new TextEncoder();
const SESSION_SECONDS = 4 * 3600;
const LOGIN_SECONDS = 600;
const SIGN_IN_ERRORS = Object.freeze({
  session: "The sign-in cookie is missing, invalid or expired. Start again in the same browser tab and allow cookies for this site.",
  state: "This authorization belongs to a different sign-in attempt. Start again using one browser tab.",
  cancelled: "GitHub sign-in was not completed. Please try again.",
  credentials: "GitHub rejected the application's login credentials. Please contact the administrator.",
  callback: "The GitHub callback address does not match the application settings. Please contact the administrator.",
  code: "The GitHub authorization code has expired or was already used. Start a new sign-in attempt.",
  email: "Please verify your primary email address on GitHub, then sign in again.",
  token_network: "The login service could not reach GitHub to finish authorization. Please try again.",
  token_http: "GitHub could not complete the authorization request. Please try again later.",
  token_response: "GitHub returned an unexpected authorization response. Please contact the administrator.",
  profile_network: "The login service could not reach the GitHub account API. Please try again.",
  profile_http: "GitHub could not verify your account. Please try again later.",
  profile_response: "GitHub returned an unexpected account response. Please contact the administrator.",
  session_create: "The login service could not save your sign-in session. Please contact the administrator."
});
class SignInFailure extends Error {
  constructor(code) { super("Sign-in failed"); this.code = code; }
}
async function githubResponse(fetchRemote, address, options, stage) {
  let response;
  try { response = await fetchRemote(address, options); }
  catch { throw new SignInFailure(stage + "_network"); }
  // Workers rejects redirect: "error"; manual mode prevents credential-bearing redirects.
  if (!response.ok) throw new SignInFailure(stage + "_http");
  try { return await response.json(); }
  catch { throw new SignInFailure(stage + "_response"); }
}

function base64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decode64(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid encoding");
  return Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), character => character.charCodeAt(0));
}
function randomToken() {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}
async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
async function signSession(payload, secret) {
  const content = base64url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(content));
  return content + "." + base64url(signature);
}
async function readSession(request, configuration, now) {
  const cookies = (request.headers.get("Cookie") || "").split(";").map(item => item.trim());
  const value = cookies.find(item => item.startsWith(configuration.cookieName + "="))?.slice(configuration.cookieName.length + 1);
  if (!value || value.length > 4096) return null;
  try {
    const parts = value.split(".");
    if (parts.length !== 2 || !await crypto.subtle.verify("HMAC", await hmacKey(configuration.secret), decode64(parts[1]), encoder.encode(parts[0]))) return null;
    const session = JSON.parse(new TextDecoder().decode(decode64(parts[0])));
    if (!Number.isFinite(session.issued) || !Number.isFinite(session.expires) || session.issued > now || session.expires <= now) return null;
    const maximum = session.kind === "identity" ? SESSION_SECONDS : session.kind === "oauth" ? LOGIN_SECONDS : 0;
    if (!maximum || session.expires - session.issued > maximum) return null;
    return session;
  } catch {
    return null;
  }
}
function sessionCookie(value, configuration, maxAge) {
  return configuration.cookieName + "=" + value + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" + maxAge + (configuration.secure ? "; Secure" : "");
}
function constantTimeEqual(first, second) {
  if (typeof first !== "string" || typeof second !== "string") return false;
  let result = first.length ^ second.length;
  for (let index = 0; index < Math.max(first.length, second.length); index++) result |= (first.charCodeAt(index) || 0) ^ (second.charCodeAt(index) || 0);
  return result === 0;
}
function trustedUrl(value, allowPath = false) {
  const url = new URL(value);
  const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) || url.username || url.password || url.search || url.hash || (!allowPath && url.pathname !== "/")) throw new Error("Invalid service address");
  return url;
}
function readConfiguration(env) {
  const base = trustedUrl(env.PUBLIC_BASE_URL);
  const site = trustedUrl(env.PUBLIC_SITE_URL || "https://sail-c.github.io/jwst-spring/", true);
  if (typeof env.SESSION_SECRET !== "string" || env.SESSION_SECRET.length < 32) throw new Error("Missing session secret");
  const users = JSON.parse(env.ALLOWED_USERS_JSON).users;
  if (!Array.isArray(users)) throw new Error("Invalid member list");
  const members = new Set();
  for (const user of users) {
    if (!Number.isSafeInteger(user.id) || user.id <= 0 || members.has(user.id)) throw new Error("Invalid member ID");
    members.add(user.id);
  }
  const products = JSON.parse(env.PRODUCTS_JSON);
  if (!products || typeof products !== "object" || Array.isArray(products)) throw new Error("Invalid products");
  for (const [field, product] of Object.entries(products)) {
    if (!/^[a-z][a-z0-9-]{0,30}$/.test(field) || typeof product?.title !== "string" || product.title.length > 100) throw new Error("Invalid product");
    const destination = new URL(product.download_url);
    if (destination.protocol !== "https:" || destination.hostname !== "gofile.me" || destination.username || destination.password) throw new Error("Invalid Synology target");
  }
  return {
    base: base.origin, site: site.href.replace(/\/?$/, "/"), members, products,
    secret: env.SESSION_SECRET, secure: base.protocol === "https:",
    cookieName: base.protocol === "https:" ? "__Host-spring_team" : "spring_team_dev",
    clientId: env.GITHUB_CLIENT_ID || "", clientSecret: env.GITHUB_CLIENT_SECRET || "",
    adminEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.ADMIN_EMAIL || "") ? env.ADMIN_EMAIL : ""
  };
}
function protectResponse(response, secure) {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Content-Security-Policy", "default-src 'self'; style-src 'self'; img-src 'self'; script-src 'none'; connect-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
  if (secure) response.headers.set("Strict-Transport-Security", "max-age=31536000");
  return response;
}
function redirect(location, status = 302, cookie = null) {
  const headers = { Location: location };
  if (cookie) headers["Set-Cookie"] = cookie;
  return new Response(null, { status, headers });
}
function htmlResponse(content, status, cookie = null) {
  const headers = { "Content-Type": "text/html; charset=utf-8" };
  if (cookie) headers["Set-Cookie"] = cookie;
  return new Response(content, { status, headers });
}

export async function handleRequest(request, env, css = "", dependencies = {}) {
  const fetchRemote = dependencies.fetch || fetch;
  const now = Math.floor((dependencies.now || Date.now)() / 1000);
  const url = new URL(request.url);
  if (url.pathname === "/portal.css" && request.method === "GET") {
    return protectResponse(new Response(css, { headers: { "Content-Type": "text/css; charset=utf-8" } }), url.protocol === "https:");
  }
  let configuration;
  try {
    configuration = readConfiguration(env);
  } catch {
    return protectResponse(htmlResponse(renderPortal({ mode: "unavailable" }), 503), url.protocol === "https:");
  }
  const cfg = configuration;
  const respond = response => protectResponse(response, cfg.secure);
  if (url.origin !== cfg.base) return respond(new Response("Invalid host", { status: 400 }));
  const ready = Boolean(cfg.clientId && cfg.clientSecret);
  const show = (field, mode = "login", status = 200, message = "", identity = null, cookie = null, errorCode = "") => htmlResponse(renderPortal({
    field, product: cfg.products[field], mode, ready, message, identity, errorCode,
    siteUrl: cfg.site, adminEmail: cfg.adminEmail
  }), status, cookie);
  const existing = await readSession(request, cfg, now);
  const identity = existing?.kind === "identity" && Number.isSafeInteger(existing.id) && typeof existing.login === "string" ? existing : null;
  const approved = Boolean(identity && cfg.members.has(identity.id));
  const clearCookie = () => sessionCookie("", cfg, 0);
  const getProduct = field => Object.hasOwn(cfg.products, field) ? cfg.products[field] : null;
  const portalPath = field => "/team/psf/" + field + "/";

  if (request.method === "GET" && url.pathname === "/") return respond(redirect(portalPath("cosmos")));
  const match = /^\/team\/psf\/([a-z][a-z0-9-]{0,30})\/(download)?$/.exec(url.pathname);
  if (request.method === "GET" && match) {
    const field = match[1];
    if (!getProduct(field)) return respond(new Response("Not found", { status: 404 }));
    if (!identity) {
      const errorCode = url.searchParams.get("signin") || "";
      const message = Object.hasOwn(SIGN_IN_ERRORS, errorCode) ? SIGN_IN_ERRORS[errorCode] : "";
      return respond(match[2] ? redirect(portalPath(field)) : show(field, "login", ready ? 200 : 503, message, null, null, message ? errorCode : ""));
    }
    if (!approved) return respond(show(field, "denied", 403));
    return respond(match[2] ? redirect(getProduct(field).download_url) : show(field, "downloads", 200, "", identity));
  }
  if (request.method === "GET" && url.pathname === "/login") {
    const field = url.searchParams.get("field") || "cosmos";
    if (!getProduct(field)) return respond(new Response("Not found", { status: 404 }));
    if (!ready) return respond(show(field, "login", 503, "Team sign-in is not available yet. Please contact the administrator."));
    const verifier = randomToken();
    const state = randomToken();
    const challenge = base64url(await crypto.subtle.digest("SHA-256", encoder.encode(verifier)));
    const pending = { kind: "oauth", state, verifier, field, issued: now, expires: now + LOGIN_SECONDS };
    const query = new URLSearchParams({
      client_id: cfg.clientId, redirect_uri: cfg.base + "/auth/github/callback",
      scope: "", state, code_challenge: challenge, code_challenge_method: "S256", allow_signup: "false"
    });
    if (url.searchParams.get("switch") === "1") query.set("prompt", "select_account");
    const cookie = sessionCookie(await signSession(pending, cfg.secret), cfg, LOGIN_SECONDS);
    return respond(redirect("https://github.com/login/oauth/authorize?" + query, 302, cookie));
  }
  if (request.method === "GET" && url.pathname === "/auth/github/callback") {
    const pending = existing?.kind === "oauth" ? existing : null;
    const field = pending && getProduct(pending.field) ? pending.field : "cosmos";
    const fail = errorCode => {
      // Only fixed diagnostic categories leave this handler, never upstream bodies or OAuth parameters.
      const response = redirect(portalPath(field) + "?signin=" + errorCode, 303, clearCookie());
      response.headers.set("X-Spring-Auth-Status", errorCode);
      return respond(response);
    };
    if (!pending) return fail("session");
    if (!constantTimeEqual(url.searchParams.get("state"), pending.state)) return fail("state");
    const code = url.searchParams.get("code");
    if (!code || url.searchParams.has("error")) return fail("cancelled");
    try {
      const tokenResult = await githubResponse(fetchRemote, "https://github.com/login/oauth/access_token", {
        method: "POST", redirect: "manual", signal: AbortSignal.timeout(15000),
        headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "JWST-SPRING-team-access" },
        body: new URLSearchParams({
          client_id: cfg.clientId, client_secret: cfg.clientSecret, redirect_uri: cfg.base + "/auth/github/callback",
          code_verifier: pending.verifier, code
        })
      }, "token");
      const oauthErrors = {
        incorrect_client_credentials: "credentials", redirect_uri_mismatch: "callback",
        bad_verification_code: "code", unverified_user_email: "email"
      };
      if (typeof tokenResult?.error === "string") {
        throw new SignInFailure(Object.hasOwn(oauthErrors, tokenResult.error) ? oauthErrors[tokenResult.error] : "token_response");
      }
      const token = tokenResult?.access_token;
      if (typeof token !== "string" || !token) throw new SignInFailure("token_response");
      const profile = await githubResponse(fetchRemote, "https://api.github.com/user", {
        redirect: "manual", signal: AbortSignal.timeout(15000),
        headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "User-Agent": "JWST-SPRING-team-access", "X-GitHub-Api-Version": "2022-11-28" }
      }, "profile");
      if (!Number.isSafeInteger(profile?.id) || profile.id <= 0 || typeof profile.login !== "string" || !/^[A-Za-z0-9-]{1,39}$/.test(profile.login)) throw new SignInFailure("profile_response");
      if (!cfg.members.has(profile.id)) return respond(show(field, "denied", 403, "", null, clearCookie()));
      // The GitHub token is discarded after checking identity; cookies contain no access token.
      const session = { kind: "identity", id: profile.id, login: profile.login, csrf: randomToken(), issued: now, expires: now + SESSION_SECONDS };
      return respond(redirect(portalPath(field), 302, sessionCookie(await signSession(session, cfg.secret), cfg, SESSION_SECONDS)));
    } catch (error) {
      return fail(error instanceof SignInFailure && Object.hasOwn(SIGN_IN_ERRORS, error.code) ? error.code : "session_create");
    }
  }
  if (request.method === "POST" && url.pathname === "/logout") {
    if (!identity || request.headers.get("Origin") !== cfg.base || Number(request.headers.get("Content-Length") || 0) > 16384) return respond(new Response("Forbidden", { status: 403 }));
    const body = await request.text();
    if (body.length > 16384 || !constantTimeEqual(new URLSearchParams(body).get("csrf"), identity.csrf)) return respond(new Response("Forbidden", { status: 403 }));
    return respond(redirect(portalPath("cosmos"), 303, clearCookie()));
  }
  return respond(new Response("Not found", { status: 404 }));
}

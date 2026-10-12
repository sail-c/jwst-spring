import test from "node:test";
import assert from "node:assert/strict";
import { handleRequest } from "./worker.mjs";
import { renderPortal } from "./portal.mjs";

const BASE = "https://team.example.org";
const NOW = Date.parse("2026-10-11T10:00:00Z");
const SHARE = "https://gofile.me/test/private-cosmos";
function environment(changes = {}) {
  return {
    PUBLIC_BASE_URL: BASE, PUBLIC_SITE_URL: "https://sail-c.github.io/jwst-spring/",
    SESSION_SECRET: "test-only-session-secret-with-at-least-32-characters",
    GITHUB_CLIENT_ID: "test-client", GITHUB_CLIENT_SECRET: "test-client-secret",
    ALLOWED_USERS_JSON: JSON.stringify({ users: [{ id: 73995538, login: "sail-c" }] }),
    PRODUCTS_JSON: JSON.stringify({ cosmos: { title: "COSMOS PSF", download_url: SHARE } }),
    ...changes
  };
}
function request(path, cookie = "", options = {}) {
  return new Request(BASE + path, { ...options, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(options.headers || {}) } });
}
function cookieOf(response) {
  return response.headers.get("Set-Cookie")?.split(";")[0] || "";
}
function payloadOf(cookie) {
  return JSON.parse(Buffer.from(cookie.slice(cookie.indexOf("=") + 1).split(".")[0], "base64url").toString("utf8"));
}
async function responseFor(path, env = environment(), cookie = "", extra = {}) {
  return handleRequest(request(path, cookie, extra.requestOptions), env, "body{margin:0}", { now: () => NOW, fetch: async () => { throw new Error("Unexpected network request"); }, ...extra });
}
async function startLogin(env = environment(), field = "cosmos") {
  const response = await responseFor("/login?field=" + encodeURIComponent(field), env);
  return { response, cookie: cookieOf(response), state: new URL(response.headers.get("Location")).searchParams.get("state") };
}
async function login(env = environment(), profile = { id: 73995538, login: "sail-c" }, field = "cosmos") {
  const started = await startLogin(env, field);
  const calls = [];
  const response = await responseFor("/auth/github/callback?state=" + started.state + "&code=test-code", env, started.cookie, {
    fetch: async (url, options) => {
      calls.push({ url, options });
      return Response.json(calls.length === 1 ? { access_token: "test-token-never-store" } : profile);
    }
  });
  return { response, cookie: cookieOf(response), calls, started };
}

test("anonymous visitors cannot see or directly obtain the Synology link", async () => {
  const response = await responseFor("/team/psf/cosmos/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Sign in with GitHub/);
  assert.doesNotMatch(html, /gofile\.me/);
  const download = await responseFor("/team/psf/cosmos/download");
  assert.equal(download.headers.get("Location"), "/team/psf/cosmos/");
});
test("OAuth requests basic identity only, with state, PKCE and secure cookies", async () => {
  const { response, cookie } = await startLogin();
  const url = new URL(response.headers.get("Location"));
  assert.equal(url.origin, "https://github.com");
  assert.equal(url.searchParams.get("scope"), "");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("redirect_uri"), BASE + "/auth/github/callback");
  assert.ok(url.searchParams.get("state").length >= 32);
  assert.match(response.headers.get("Set-Cookie"), /^__Host-spring_team=/);
  assert.match(response.headers.get("Set-Cookie"), /HttpOnly; SameSite=Lax/);
  assert.match(response.headers.get("Set-Cookie"), /; Secure/);
  assert.equal(payloadOf(cookie).kind, "oauth");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});
test("approved GitHub identity gets a session without exposing API tokens", async () => {
  const { response, cookie, calls, started } = await login();
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("Location"), "/team/psf/cosmos/");
  assert.equal(calls[0].options.body.get("code_verifier"), payloadOf(started.cookie).verifier);
  assert.equal(calls[0].options.redirect, "manual");
  assert.equal(calls[1].options.redirect, "manual");
  assert.equal(calls[1].options.headers.Authorization, "Bearer test-token-never-store");
  assert.equal(payloadOf(cookie).id, 73995538);
  assert.doesNotMatch(JSON.stringify(payloadOf(cookie)), /test-token|client-secret/);
  const portal = await responseFor("/team/psf/cosmos/", environment(), cookie);
  assert.equal(portal.status, 200);
  assert.match(await portal.text(), /Download PSF files/);
});
test("download rechecks the member ID and redirects to the exact configured share", async () => {
  const { cookie } = await login();
  const response = await responseFor("/team/psf/cosmos/download", environment(), cookie);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("Location"), SHARE);
});
test("renaming an approved account preserves access by fixed GitHub ID", async () => {
  const { response } = await login(environment(), { id: 73995538, login: "renamed-member" });
  assert.equal(response.status, 302);
});
test("another ID with the same username cannot gain access", async () => {
  const { response } = await login(environment(), { id: 99999, login: "sail-c" });
  assert.equal(response.status, 403);
  assert.match(await response.text(), /Access denied/);
  assert.equal(cookieOf(response), "__Host-spring_team=");
});
test("removing a member revokes an existing signed session", async () => {
  const { cookie } = await login();
  const env = environment({ ALLOWED_USERS_JSON: '{"users":[]}' });
  for (const path of ["/team/psf/cosmos/", "/team/psf/cosmos/download"]) {
    const response = await responseFor(path, env, cookie);
    assert.equal(response.status, 403);
    assert.doesNotMatch(await response.text(), /gofile\.me/);
  }
});
test("invalid OAuth state never contacts GitHub", async () => {
  const { cookie } = await startLogin();
  const response = await responseFor("/auth/github/callback?state=wrong&code=irrelevant", environment(), cookie);
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("X-Spring-Auth-Status"), "state");
  assert.match(response.headers.get("Set-Cookie"), /Max-Age=0/);
});
test("expired OAuth state never contacts GitHub", async () => {
  const { cookie, state } = await startLogin();
  const response = await responseFor("/auth/github/callback?state=" + state + "&code=test", environment(), cookie, { now: () => NOW + 601000 });
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("X-Spring-Auth-Status"), "session");
});
test("cancelled GitHub authorization is handled without a token request", async () => {
  const { cookie, state } = await startLogin();
  const response = await responseFor("/auth/github/callback?state=" + state + "&error=access_denied", environment(), cookie);
  assert.equal(response.status, 303);
  const page = await responseFor(response.headers.get("Location"));
  assert.match(await page.text(), /not completed/);
});
test("OAuth network failures do not leak response bodies or credentials", async () => {
  const { cookie, state } = await startLogin();
  const response = await responseFor("/auth/github/callback?state=" + state + "&code=test", environment(), cookie, {
    fetch: async () => { throw new Error("sensitive-secret-from-upstream"); }
  });
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("X-Spring-Auth-Status"), "token_network");
  const page = await responseFor(response.headers.get("Location"));
  assert.doesNotMatch(await page.text(), /sensitive-secret|gofile\.me|test-client-secret/);
});
test("a forged session cannot bypass authentication", async () => {
  const { cookie } = await login();
  const value = cookie.slice(cookie.indexOf("=") + 1);
  const parts = value.split(".");
  const forgedPayload = { ...payloadOf(cookie), id: 99999 };
  const forged = "__Host-spring_team=" + Buffer.from(JSON.stringify(forgedPayload)).toString("base64url") + "." + parts[1];
  const response = await responseFor("/team/psf/cosmos/download", environment(), forged);
  assert.equal(response.headers.get("Location"), "/team/psf/cosmos/");
});
test("identity sessions expire after four hours", async () => {
  const { cookie } = await login();
  const response = await responseFor("/team/psf/cosmos/download", environment(), cookie, { now: () => NOW + 14401000 });
  assert.equal(response.headers.get("Location"), "/team/psf/cosmos/");
});
test("broken or ambiguous member lists fail closed", async () => {
  for (const members of ["bad json", '{"users":[{"id":"73995538"}]}', '{"users":[{"id":73995538},{"id":73995538}]}']) {
    const response = await responseFor("/team/psf/cosmos/download", environment({ ALLOWED_USERS_JSON: members }));
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /gofile\.me/);
  }
});
test("missing OAuth credentials shows an honest unavailable state", async () => {
  const response = await responseFor("/team/psf/cosmos/", environment({ GITHUB_CLIENT_SECRET: "" }));
  assert.equal(response.status, 503);
  const html = await response.text();
  assert.match(html, /not available yet/);
  assert.doesNotMatch(html, /Sign in with GitHub|gofile\.me/);
});
test("host, base address, session secret and download destination are validated", async () => {
  const wrongHost = await handleRequest(new Request("https://attacker.example/team/psf/cosmos/"), environment());
  assert.equal(wrongHost.status, 400);
  for (const changes of [
    { PUBLIC_BASE_URL: "http://public.example.org" }, { PUBLIC_BASE_URL: BASE + "/extra" },
    { SESSION_SECRET: "short" }, { PRODUCTS_JSON: '{"cosmos":{"title":"COSMOS","download_url":"https://attacker.example/"}}' }
  ]) assert.equal((await responseFor("/team/psf/cosmos/", environment(changes))).status, 503);
});
test("unknown fields and unsupported methods cannot redirect", async () => {
  assert.equal((await responseFor("/team/psf/missing/download")).status, 404);
  assert.equal((await responseFor("/login?field=missing")).status, 404);
  assert.equal((await responseFor("/team/psf/cosmos/download", environment(), "", { requestOptions: { method: "POST" } })).status, 404);
});
test("logout requires the session CSRF token and same origin", async () => {
  const { cookie } = await login();
  const csrf = payloadOf(cookie).csrf;
  const bad = await responseFor("/logout", environment(), cookie, { requestOptions: { method: "POST", headers: { Origin: BASE }, body: "csrf=wrong" } });
  assert.equal(bad.status, 403);
  const crossOrigin = await responseFor("/logout", environment(), cookie, { requestOptions: { method: "POST", headers: { Origin: "https://attacker.example" }, body: "csrf=" + csrf } });
  assert.equal(crossOrigin.status, 403);
  const good = await responseFor("/logout", environment(), cookie, { requestOptions: { method: "POST", headers: { Origin: BASE }, body: "csrf=" + csrf } });
  assert.equal(good.status, 303);
  assert.match(good.headers.get("Set-Cookie"), /Max-Age=0/);
});
test("portal escapes displayed values and serves external CSS with a restrictive CSP", async () => {
  const html = renderPortal({ mode: "downloads", identity: { login: "<script>oops</script>", csrf: '" onload="bad' } });
  assert.doesNotMatch(html, /<script>|onload="bad/);
  assert.match(html, /&lt;script&gt;/);
  const response = await responseFor("/portal.css");
  assert.equal(response.headers.get("Content-Type"), "text/css; charset=utf-8");
  assert.equal(response.headers.get("X-Frame-Options"), "DENY");
  assert.match(response.headers.get("Content-Security-Policy"), /script-src 'none'/);
  assert.match(response.headers.get("Strict-Transport-Security"), /max-age/);
});

test("switching accounts forces the GitHub account picker", async () => {
  const response = await responseFor("/login?field=cosmos&switch=1");
  assert.equal(new URL(response.headers.get("Location")).searchParams.get("prompt"), "select_account");
  const denied = renderPortal({ mode: "denied", ready: true });
  assert.match(denied, /&amp;switch=1/);
});


test("GitHub OAuth errors produce safe, actionable diagnostics without repeating authorization codes", async () => {
  for (const [upstreamError, expected] of [
    ["incorrect_client_credentials", "credentials"], ["redirect_uri_mismatch", "callback"],
    ["bad_verification_code", "code"], ["unverified_user_email", "email"],
    ["sensitive-upstream-unknown", "token_response"]
  ]) {
    const { cookie, state } = await startLogin();
    const response = await responseFor("/auth/github/callback?state=" + state + "&code=private-code", environment(), cookie, {
      fetch: async () => Response.json({ error: upstreamError, error_description: "secret-body-private-code" })
    });
    assert.equal(response.status, 303);
    assert.equal(response.headers.get("X-Spring-Auth-Status"), expected);
    const location = response.headers.get("Location");
    assert.equal(location, "/team/psf/cosmos/?signin=" + expected);
    assert.doesNotMatch(location, /private-code|state=/);
    const page = await responseFor(location);
    const html = await page.text();
    assert.match(html, /Sign-in unsuccessful/);
    assert.match(html, new RegExp("Diagnostic: <code>" + expected));
    assert.doesNotMatch(html, /secret-body|private-code|sensitive-upstream|gofile\.me/);
  }
});

test("token and profile failure stages remain distinguishable without leaking upstream data", async () => {
  for (const [stage, responseFactory, expected] of [
    ["token", () => new Response("private-error-body", { status: 403 }), "token_http"],
    ["token", () => new Response("private-error-body"), "token_response"],
    ["token", () => Response.json(null), "token_response"],
    ["profile", () => { throw new Error("private-network-detail"); }, "profile_network"],
    ["profile", () => new Response("private-error-body", { status: 401 }), "profile_http"],
    ["profile", () => Response.json(null), "profile_response"]
  ]) {
    const { cookie, state } = await startLogin();
    let calls = 0;
    const response = await responseFor("/auth/github/callback?state=" + state + "&code=private-code", environment(), cookie, {
      fetch: async () => ++calls === 1 && stage === "profile" ? Response.json({ access_token: "private-token" }) : responseFactory()
    });
    assert.equal(response.status, 303);
    assert.equal(response.headers.get("X-Spring-Auth-Status"), expected);
    const page = await responseFor(response.headers.get("Location"));
    assert.doesNotMatch(await page.text(), /private-error-body|private-network-detail|private-token|private-code/);
  }
});

test("missing cookies have an explicit diagnosis and unknown query messages are ignored", async () => {
  const callback = await responseFor("/auth/github/callback?state=private-state&code=private-code");
  assert.equal(callback.headers.get("X-Spring-Auth-Status"), "session");
  const page = await responseFor(callback.headers.get("Location"));
  assert.match(await page.text(), /cookie is missing, invalid or expired/);
  const unknown = await responseFor("/team/psf/cosmos/?signin=constructor");
  assert.doesNotMatch(await unknown.text(), /Sign-in unsuccessful|Diagnostic:/);
});


test("GitHub redirects are rejected without following them or forwarding credentials", async () => {
  for (const stage of ["token", "profile"]) {
    const { cookie, state } = await startLogin();
    let calls = 0;
    const response = await responseFor("/auth/github/callback?state=" + state + "&code=test", environment(), cookie, {
      fetch: async (address, options) => {
        assert.equal(options.redirect, "manual");
        return ++calls === 1 && stage === "profile" ? Response.json({ access_token: "private-token" }) : new Response(null, {
          status: 307, headers: { Location: "https://other.example/" }
        });
      }
    });
    assert.equal(response.headers.get("X-Spring-Auth-Status"), stage + "_http");
    assert.equal(calls, stage === "token" ? 1 : 2);
  }
});


const FIELD_TITLES = { cosmos: "COSMOS", egs: "EGS", "goods-n": "GOODS-N", "goods-s": "GOODS-S", uds: "UDS" };
function allFieldEnvironment(changes = {}) {
  const products = Object.fromEntries(Object.entries(FIELD_TITLES).map(([field, title]) => [field, {
    title: title + " PSF", download_url: "https://gofile.me/test/private-" + field
  }]));
  return environment({ PRODUCTS_JSON: JSON.stringify(products), ...changes });
}

test("all five field login flows return to their own PSF portal", async () => {
  const env = allFieldEnvironment();
  for (const [field, title] of Object.entries(FIELD_TITLES)) {
    const anonymous = await responseFor("/team/psf/" + field + "/", env);
    const html = await anonymous.text();
    assert.equal(anonymous.status, 200);
    assert.match(html, new RegExp(title + " PSF Downloads"));
    assert.ok(html.includes('href="/login?field=' + field + '"'));
    assert.ok(html.includes('href="https://sail-c.github.io/jwst-spring/data_release/psf/' + field + '.html"'));
    assert.doesNotMatch(html, /gofile\.me/);
    const { response, cookie } = await login(env, { id: 73995538, login: "sail-c" }, field);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("Location"), "/team/psf/" + field + "/");
    const download = await responseFor("/team/psf/" + field + "/download", env, cookie);
    assert.equal(download.headers.get("Location"), "https://gofile.me/test/private-" + field);
  }
});

test("one approved session works across five fields and revoked members cannot download any field", async () => {
  const env = allFieldEnvironment();
  const { cookie } = await login(env);
  for (const field of Object.keys(FIELD_TITLES)) {
    const portal = await responseFor("/team/psf/" + field + "/", env, cookie);
    assert.match(await portal.text(), /Download PSF files/);
    const anonymous = await responseFor("/team/psf/" + field + "/download", env);
    assert.equal(anonymous.headers.get("Location"), "/team/psf/" + field + "/");
    const revoked = await responseFor("/team/psf/" + field + "/download", allFieldEnvironment({ ALLOWED_USERS_JSON: '{"users":[]}' }), cookie);
    assert.equal(revoked.status, 403);
    assert.doesNotMatch(await revoked.text(), /gofile\.me/);
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const miniflarePath = require.resolve("miniflare", { paths: [dirname(require.resolve("wrangler/package.json"))] });
const { Miniflare, convertV4MiniflareOptions } = await import(pathToFileURL(miniflarePath).href);
const BASE = "https://team.example.org";
const ROOT = dirname(fileURLToPath(import.meta.url));

test("Workers runtime rejects the old redirect mode and completes the fixed OAuth flow", async () => {
  const runtime = new Miniflare(convertV4MiniflareOptions({
    compatibilityDate: "2026-10-01",
    modulesRoot: ROOT,
    modules: [
      { type: "ESModule", path: "runtime-entry.mjs", contents: `
        import { handleRequest } from "./worker.mjs";
        export default { async fetch(request, env) {
          if (new URL(request.url).pathname === "/runtime-check") {
            let oldModeRejected = false;
            try { new Request("https://github.com/", { redirect: "error" }); }
            catch (error) { oldModeRejected = error instanceof TypeError; }
            return Response.json({ oldModeRejected, newMode: new Request("https://github.com/", { redirect: "manual" }).redirect });
          }
          return handleRequest(request, env, "", { fetch: async (address, options) => {
            // Native Workers validation, with no outgoing network requests or real credentials.
            const outbound = new Request(address, options);
            if (outbound.redirect !== "manual") throw new Error("Unexpected redirect mode");
            return Response.json(options.method === "POST" ? { access_token: "runtime-test-token" } : { id: 73995538, login: "sail-c" });
          } });
        } };
      ` },
      ...["worker.mjs", "portal.mjs"].map(path => ({ type: "ESModule", path, contents: readFileSync(new URL(path, import.meta.url), "utf8") }))
    ],
    bindings: {
      PUBLIC_BASE_URL: BASE, PUBLIC_SITE_URL: "https://sail-c.github.io/jwst-spring/",
      SESSION_SECRET: "runtime-test-only-session-secret-longer-than-32-characters",
      GITHUB_CLIENT_ID: "runtime-test-client", GITHUB_CLIENT_SECRET: "runtime-test-secret",
      ALLOWED_USERS_JSON: JSON.stringify({ users: [{ id: 73995538, login: "sail-c" }] }),
      PRODUCTS_JSON: JSON.stringify({ cosmos: { title: "COSMOS PSF", download_url: "https://gofile.me/runtime-test-only" } })
    }
  }));
  try {
    const check = await runtime.dispatchFetch(BASE + "/runtime-check");
    assert.deepEqual(await check.json(), { oldModeRejected: true, newMode: "manual" });
    const started = await runtime.dispatchFetch(BASE + "/login?field=cosmos", { redirect: "manual" });
    assert.equal(started.status, 302);
    const state = new URL(started.headers.get("Location")).searchParams.get("state");
    const callback = await runtime.dispatchFetch(BASE + "/auth/github/callback?state=" + state + "&code=runtime-test-code", {
      redirect: "manual", headers: { Cookie: started.headers.get("Set-Cookie").split(";")[0] }
    });
    assert.equal(callback.status, 302);
    assert.equal(callback.headers.get("Location"), "/team/psf/cosmos/");
    const cookie = callback.headers.get("Set-Cookie").split(";")[0];
    const portal = await runtime.dispatchFetch(BASE + "/team/psf/cosmos/", { headers: { Cookie: cookie } });
    assert.match(await portal.text(), /Download PSF files/);
    const download = await runtime.dispatchFetch(BASE + "/team/psf/cosmos/download", { redirect: "manual", headers: { Cookie: cookie } });
    assert.equal(download.headers.get("Location"), "https://gofile.me/runtime-test-only");
  } finally { await runtime.dispose(); }
});

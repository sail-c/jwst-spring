document.addEventListener("DOMContentLoaded", async () => {
  const entries = document.querySelectorAll("[data-team-field]");
  if (!entries.length) return;
  const script = Array.from(document.scripts).find((item) => item.src && new URL(item.src).pathname.endsWith("/team-access.js"));
  if (!script) return;
  try {
    const response = await fetch(new URL("team-access.json", script.src), { cache: "no-cache" });
    if (!response.ok) return;
    const configuration = await response.json();
    if (!configuration.portal_base_url) return;
    const base = new URL(configuration.portal_base_url);
    const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(base.hostname);
    if ((base.protocol !== "https:" && !(base.protocol === "http:" && loopback)) || base.username || base.password || base.pathname !== "/" || base.search || base.hash) return;
    entries.forEach((entry) => {
      const field = entry.dataset.teamField;
      if (!["cosmos", "egs", "goods-n", "goods-s", "uds"].includes(field)) return;
      const product = entry.dataset.teamProduct || "psf";
      if (!["psf", "nircam", "miri"].includes(product)) return;
      const path = product === "psf" ? "team/psf/" + field + "/" : "team/imaging/" + product + "/" + field + "/";
      entry.href = new URL(path, base.href.replace(/\/?$/, "/")).href;
      if (entry.hasAttribute("data-team-continue")) {
        entry.hidden = false;
        document.querySelector("[data-team-pending]")?.setAttribute("hidden", "");
      }
    });
  } catch {
    // Keep the default link if the portal configuration cannot be loaded.
  }
});

// Worker CPU probe (ADR-NB-028): N requests to the render-heavy routes, counts Error 1102
// ("Worker exceeded resource limits") and other 5xx.
//   node scripts/load-probe.mjs [--n=150] [--concurrency=10] [--base=https://nova-editor.maximi.workers.dev]
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d;
const BASE = arg("base", process.env.BASE_URL ?? "https://nova-editor.maximi.workers.dev");
const N = Number(arg("n", 150));
const CONCURRENCY = Number(arg("concurrency", 10));
const ROUTES = ["/", "/login", "/signup", "/pricing", "/projects", "/canvas", "/builder/00000000-0000-0000-0000-000000000000", "/preview/00000000-0000-0000-0000-000000000000"];

const results = [];
let next = 0;
async function worker() {
  while (next < N) {
    const i = next++;
    const route = ROUTES[i % ROUTES.length];
    const t0 = Date.now();
    try {
      const r = await fetch(BASE + route, { redirect: "manual", headers: { "cache-control": "no-cache" } });
      const body = r.status >= 500 ? await r.text() : "";
      results.push({ route, status: r.status, ms: Date.now() - t0, is1102: /1102|exceeded resource limits/i.test(body) });
    } catch (e) {
      results.push({ route, status: 0, ms: Date.now() - t0, is1102: false, error: String(e) });
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const by = {};
for (const r of results) {
  const b = (by[r.route] ??= { n: 0, e1102: 0, e5xx: 0, ms: [] });
  b.n++; b.ms.push(r.ms);
  if (r.is1102) b.e1102++; else if (r.status >= 500 || r.status === 0) b.e5xx++;
}
const p = (a, q) => [...a].sort((x, y) => x - y)[Math.floor((a.length - 1) * q)];
console.log(`${BASE} — ${N} requests, concurrency ${CONCURRENCY}, ${new Date().toISOString()}`);
for (const [route, b] of Object.entries(by)) console.log(`${route.padEnd(52)} n=${b.n} 1102=${b.e1102} other5xx=${b.e5xx} p50=${p(b.ms, 0.5)}ms p95=${p(b.ms, 0.95)}ms`);
const e1102 = results.filter((r) => r.is1102).length;
const e5xx = results.filter((r) => !r.is1102 && (r.status >= 500 || r.status === 0)).length;
console.log(`TOTAL 1102: ${e1102}/${N} (${((100 * e1102) / N).toFixed(1)}%), other 5xx/network: ${e5xx}`);
process.exitCode = e1102 + e5xx > 0 ? 1 : 0;

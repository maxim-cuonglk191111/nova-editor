import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Serve build-time prerendered pages straight from Workers static assets instead
// of re-rendering them on every request. Without an incremental cache OpenNext
// renders prerendered routes per request, which on Workers Free (10 ms CPU)
// caused intermittent Error 1102. Read-only cache: fits pages without ISR.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});

# Nuxt 5 / Nitro 3 prerender build failure (`#nitro/virtual/storage`)

> Reported in https://github.com/nuxt/nuxt/issues/35247

## Problem Statement

Building the Nuxt 5 (nightly) app fails during the **prerender** step with an
unresolved import error coming from Nitro's own generated storage module:

```
[UNRESOLVED_IMPORT] Could not resolve '.../@nuxt/nitro-server-nightly/dist/runtime/utils/cache-driver.js' in #nitro/virtual/storage
```

The failure is triggered solely by having at least one prerendered route. The
minimal reproduction is a single route rule:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // Commenting out this line makes the build succeed.
    '/rendering-modes/pre-rendered-page': { prerender: true },
  },
});
```

`prerender: true` (and likewise `isr` / `swr`) is what activates Nitro's
prerenderer build (`_nitro/nitro-prerenderer`). That build bundles Nitro's own
runtime app, which imports `#nitro/virtual/storage`. The generated virtual
module statically imports the `node-server` preset's `cache-driver.js` by
**absolute path**, and the prerenderer (running rolldown under a different
preset) cannot resolve it.

In Nitro 2 (rollup) this was a benign warning (`treating it as an external
dependency`) and the build continued. In Nitro 3 (rolldown) the same unresolved
import is now a **fatal error**, so the build fails.

## Potential Culprit

Nitro 3 beta (`nitro@3.0.x-beta`) + Nuxt 5 nightly.

The broken import lives in Nitro's own generated `#nitro/virtual/storage`
module and is pulled into the prerenderer bundle by Nitro internals. The import
chain from the build error contains only Nitro files:

```
'#nitro/virtual/storage' is imported by:
  - nitro/dist/runtime/internal/storage.mjs
  - nitro/dist/runtime/internal/app.mjs
  - nitro/dist/presets/_nitro/runtime/nitro-prerenderer.mjs
```

## Reproduction Steps

```bash
pnpm install
pnpm run reprex:build
```


## Similar Issues

- nuxt/nuxt#27424 — `cache-driver.js` imported by `virtual:#internal/nitro/virtual/storage` could not be resolved (Nitro 2: warning only)
- nuxt/nuxt#26622 — same `cache-driver.js` unresolved-import warning during `generate`/`build`
- nuxt/content#3772 — Nuxt v5 / Nitro v3: `UNRESOLVED_IMPORT` for runtime imports during build
- nitrojs/nitro#3861 — renamed internal virtual namespaces (`#nitro-internal-virtual/*` → `#nitro/virtual/*`)

## Build Log

```bash
> nuxt build

┌  Building Nuxt for production...
│
●  Nuxt 5.0.0-29671715.0154df87 (with Nitro 3.0.260522-beta, Vite 8.0.16 and Vue 3.5.35)
│
●  Nitro preset: node-server
ℹ vite v8.0.16 building client environment for production...                                                                                        2:39:02 PM
✓ 137 modules transformed.
computing gzip size...
ℹ node_modules/.cache/nuxt/.nuxt/dist/client/manifest.json                  3.41 kB │ gzip:  0.53 kB                                                2:39:03 PM
node_modules/.cache/nuxt/.nuxt/dist/client/_nuxt/error-500.B_jOH5Og.css   1.90 kB │ gzip:  0.72 kB
node_modules/.cache/nuxt/.nuxt/dist/client/_nuxt/error-404.BLf5qzKh.css   2.42 kB │ gzip:  0.85 kB
node_modules/.cache/nuxt/.nuxt/dist/client/_nuxt/d05_zk2f.js              0.16 kB │ gzip:  0.15 kB
node_modules/.cache/nuxt/.nuxt/dist/client/_nuxt/DUFDEfph.js              0.22 kB │ gzip:  0.19 kB
node_modules/.cache/nuxt/.nuxt/dist/client/_nuxt/BaDJIABW.js              3.40 kB │ gzip:  1.53 kB
node_modules/.cache/nuxt/.nuxt/dist/client/_nuxt/BTXdFNo4.js              8.94 kB │ gzip:  3.61 kB
node_modules/.cache/nuxt/.nuxt/dist/client/_nuxt/BRGWtgFQ.js             71.79 kB │ gzip: 27.97 kB
node_modules/.cache/nuxt/.nuxt/dist/client/_nuxt/BmVLhdlb.js             98.09 kB │ gzip: 35.88 kB

ℹ ✓ built in 460ms                                                                                                                                  2:39:03 PM
ℹ vite v8.0.16 building ssr environment for production...                                                                                           2:39:03 PM
✓ 130 modules transformed.
ℹ node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/error-404-styles.DJ3lyBzf.mjs           0.08 kB                                                  2:39:03 PM
node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/error-500-styles.DCmE4ndZ.mjs           0.08 kB
node_modules/.cache/nuxt/.nuxt/dist/server/styles.mjs                                    0.63 kB
node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/pre-rendered-page-94WlHwWX.js           0.95 kB │ map:     0.22 kB
node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/pages-BsKliYC7.js                       1.29 kB │ map:     0.27 kB
node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/island-renderer-FluHnBuO.js             1.62 kB │ map:     2.60 kB
node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/error-500-styles-1.mjs-DAM8MPEQ.js      2.43 kB │ map:     5.32 kB
node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/error-404-styles-1.mjs-B81go4Lj.js      2.95 kB │ map:     5.97 kB
node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/error-500-DuJul_T0.js                   5.05 kB │ map:    10.86 kB
node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/nuxt-0uJ_DGi9.js                        7.04 kB │ map:    16.53 kB
node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/useApi-s_02lHjl-BsF55NwB.js            11.98 kB │ map:    25.32 kB
node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/error-404-Y7ufTibk.js                  13.75 kB │ map:    25.36 kB
node_modules/.cache/nuxt/.nuxt/dist/server/server.mjs                                  265.29 kB │ map:   620.35 kB
node_modules/.cache/nuxt/.nuxt/dist/server/_nuxt/vue-BDfHa63H.js                     1,093.39 kB │ map: 1,932.06 kB

ℹ ✓ built in 299ms                                                                                                                                  2:39:03 PM
ℹ Initializing prerenderer                                                                                                                    nitro 2:39:03 PM

 ERROR  Build failed with 1 error:                                                                                                                   2:39:03 PM

[UNRESOLVED_IMPORT] Could not resolve '/[...path...]/_reprex/nuxt-nitro-storage/node_modules/.pnpm/@nuxt+nitro-server-nightly@5.0.0-29671715.0154df87_chokidar@5.0.0_crossws@0.4.5_srvx@0._e08496516e5d768beffac369d9fb3eda/node_modules/@nuxt/nitro-server-nightly/dist/runtime/utils/cache-driver.js' in #nitro/virtual/storage
   ╭─[ #nitro/virtual/storage:6:366 ]
   │
 6 │ import _47[...path...]_47_reprex_47nuxt_45nitro_45storage_47node_modules_47_46pnpm_47_64nuxt_43nitro_45server_45nightly_645_460_460_4529671715_460154df87_chokidar_645_460_460_crossws_640_464_465_srvx_640_46_e08496516e5d768beffac369d9fb3eda_47node_modules_47_64nuxt_47nitro_45server_45nightly_47dist_47runtime_47utils_47cache_45driver_46js from "/[...path...]/_reprex/nuxt-nitro-storage/node_modules/.pnpm/@nuxt+nitro-server-nightly@5.0.0-29671715.0154df87_chokidar@5.0.0_crossws@0.4.5_srvx@0._e08496516e5d768beffac369d9fb3eda/node_modules/@nuxt/nitro-server-nightly/dist/runtime/utils/cache-driver.js";
   │                                                                                                                                                                                                                                                                                                                                                                              ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┬───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────  
   │                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ╰───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── Module not found.
   │ 
   │ Help: '#nitro/virtual/storage' is imported by the following path:
   │         - #nitro/virtual/storage
   │         - node_modules/.pnpm/nitro@3.0.260522-beta_chokidar@5.0.0_dotenv@17.4.2_giget@3.2.0_jiti@2.7.0_lru-cache@11._e70ce6b4403f249fdc341f336d81bcf1/node_modules/nitro/dist/runtime/internal/storage.mjs
   │         - node_modules/.pnpm/nitro@3.0.260522-beta_chokidar@5.0.0_dotenv@17.4.2_giget@3.2.0_jiti@2.7.0_lru-cache@11._e70ce6b4403f249fdc341f336d81bcf1/node_modules/nitro/dist/runtime/internal/cache.mjs
   │         - node_modules/.pnpm/nitro@3.0.260522-beta_chokidar@5.0.0_dotenv@17.4.2_giget@3.2.0_jiti@2.7.0_lru-cache@11._e70ce6b4403f249fdc341f336d81bcf1/node_modules/nitro/dist/runtime/internal/route-rules.mjs
   │         - #nitro/virtual/routing
   │         - node_modules/.pnpm/nitro@3.0.260522-beta_chokidar@5.0.0_dotenv@17.4.2_giget@3.2.0_jiti@2.7.0_lru-cache@11._e70ce6b4403f249fdc341f336d81bcf1/node_modules/nitro/dist/runtime/internal/app.mjs
   │         - node_modules/.pnpm/nitro@3.0.260522-beta_chokidar@5.0.0_dotenv@17.4.2_giget@3.2.0_jiti@2.7.0_lru-cache@11._e70ce6b4403f249fdc341f336d81bcf1/node_modules/nitro/dist/runtime/app.mjs
   │         - node_modules/.pnpm/nitro@3.0.260522-beta_chokidar@5.0.0_dotenv@17.4.2_giget@3.2.0_jiti@2.7.0_lru-cache@11._e70ce6b4403f249fdc341f336d81bcf1/node_modules/nitro/dist/presets/_nitro/runtime/nitro-prerenderer.mjs
───╯


    at aggregateBindingErrorsIntoJsError (node_modules/.pnpm/rolldown@1.0.3/node_modules/rolldown/dist/shared/error-BuvQYXuZ.mjs:48:18)
    at unwrapBindingResult (node_modules/.pnpm/rolldown@1.0.3/node_modules/rolldown/dist/shared/error-BuvQYXuZ.mjs:18:128)
    at #build (node_modules/.pnpm/rolldown@1.0.3/node_modules/rolldown/dist/shared/rolldown-build-CrPk_lZe.mjs:3246:34)
    at async buildProduction (node_modules/.pnpm/nitro@3.0.260522-beta_chokidar@5.0.0_dotenv@17.4.2_giget@3.2.0_jiti@2.7.0_lru-cache@11._e70ce6b4403f249fdc341f336d81bcf1/node_modules/nitro/dist/_build/rolldown.mjs:141:12)                                                                                                     
    at async prerender (node_modules/.pnpm/nitro@3.0.260522-beta_chokidar@5.0.0_dotenv@17.4.2_giget@3.2.0_jiti@2.7.0_lru-cache@11._e70ce6b4403f249fdc341f336d81bcf1/node_modules/nitro/dist/_chunks/nitro.mjs:1006:2)                                                                                                             
    at async Array.<anonymous> (node_modules/.pnpm/@nuxt+nitro-server-nightly@5.0.0-29671715.0154df87_chokidar@5.0.0_crossws@0.4.5_srvx@0._e08496516e5d768beffac369d9fb3eda/node_modules/@nuxt/nitro-server-nightly/dist/index.mjs:933:4)                                                                                         
    at async build (node_modules/.pnpm/nuxt-nightly@5.0.0-29671715.0154df87_@parcel+watcher@2.5.6_@vue+compiler-sfc@3.5.35_cro_bca51a45529b17f0667efda4fccab298/node_modules/nuxt-nightly/dist/index.mjs:7563:2)                                                                                                                  
    at async Object.run (node_modules/.pnpm/@nuxt+cli-nightly@3.36.0-20260525-053458-f869c61_@nuxt+schema-nightly@5.0.0-29671715.0154df87_magicast@0.5.3/node_modules/@nuxt/cli-nightly/dist/build-DWst0L5A.mjs:92:4)                                                                                                             
    at async runCommand (node_modules/.pnpm/citty@0.2.2/node_modules/citty/dist/index.mjs:228:47)
    at async runCommand (node_modules/.pnpm/citty@0.2.2/node_modules/citty/dist/index.mjs:217:5)
    at async runMain (node_modules/.pnpm/citty@0.2.2/node_modules/citty/dist/index.mjs:394:10) 
```

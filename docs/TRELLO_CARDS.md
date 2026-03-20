# Trello Cards — AI LLM UI Plugin

---

## Board: `AI LLM UI Plugin`

---

### List: 📋 Phase 0 — Scaffolding (Week 1)

| Card Title | Labels | Members | Est. |
|------------|--------|---------|------|
| `[0.1] Init Angular 20 project + ngx-build-plus` | `setup` | Dev A, Dev B | 1d |
| `[0.2] Install dependencies + configure angular.json` | `setup` | Dev A | 0.5d |
| `[0.3] Platform connector: APP_INITIALIZER, auth interceptor, environments` | `setup`, `critical` | Dev B | 1.5d |
| `[0.4] i18n: custom translate loader + en/uk JSON files` | `setup` | Dev A | 0.5d |
| `[0.5] TypeScript models & enums from Swagger` | `models` | Dev B | 1d |
| `[0.6] EndpointService — dynamic API URL construction` | `services` | Dev A | 1d |
| `[0.7] AppRoutingModule + lazy-loaded stub modules` | `setup` | Dev B | 0.5d |
| `[M0] ✅ Milestone: project builds & boots on platform` | `milestone` | Dev A, Dev B | — |

---

### List: 📋 Phase 1 — LLM Registry (Week 2)

| Card Title | Labels | Members | Est. |
|------------|--------|---------|------|
| `[1.1] LlmRegistryApiService — 7 endpoints` | `services`, `backend` | Dev B | 1.5d |
| `[1.2] Registry list page: datatable, filters, action buttons` | `ui`, `feature` | Dev A | 2d |
| `[1.3] Create/Edit model modal — reactive form + JSON fields` | `ui`, `feature` | Dev A | 1.5d |
| `[1.4] Edit flow verification + status transitions` | `qa` | Dev B | 1d |
| `[1.5] Validate model, delete model, upload ZIP` | `feature` | Dev B | 1d |
| `[1.6] Error handling, empty states, UX polish` | `ux`, `polish` | Dev A | 0.5d |
| `[M1] ✅ Milestone: full CRUD registry works E2E` | `milestone` | Dev A, Dev B | — |

---

### List: 📋 Phase 2 — Chat Playground (Week 3)

| Card Title | Labels | Members | Est. |
|------------|--------|---------|------|
| `[2.1] ChatApiService — SSE streaming + non-stream fallback` | `services`, `critical` | Dev B | 2d |
| `[2.2] Chat UI: message list, input, model selector` | `ui`, `feature` | Dev A | 2d |
| `[2.3] Integrate streaming: live token display + auto-scroll` | `feature` | Dev B | 1d |
| `[2.4] Generation params panel: temperature, top_k, max_tokens` | `ui` | Dev A | 1.5d |
| `[2.5] UX: clear history, copy response, system prompt` | `ux`, `polish` | Dev A, Dev B | 1d |
| `[M2] ✅ Milestone: chat playground with streaming works` | `milestone` | Dev A, Dev B | — |

---

### List: 📋 Phase 3 — Collections (Week 4)

| Card Title | Labels | Members | Est. |
|------------|--------|---------|------|
| `[3.1] CollectionApiService — CRUD + paginated list` | `services` | Dev B | 1d |
| `[3.2] Collection list page: table with pagination` | `ui`, `feature` | Dev A | 1.5d |
| `[3.3] Create collection wizard (stepper: info → chunking → vector search)` | `ui`, `feature` | Dev A | 2d |
| `[3.4] Collection detail page: stats, edit, delete` | `feature` | Dev B | 1.5d |
| `[3.5] Navigation: collection list → detail → documents` | `routing` | Dev A, Dev B | 0.5d |
| `[M3] ✅ Milestone: collection management complete` | `milestone` | Dev A, Dev B | — |

---

### List: 📋 Phase 4 — Documents & Chunks (Week 5–6)

| Card Title | Labels | Members | Est. |
|------------|--------|---------|------|
| `[4.1] DocumentApiService + ChunkApiService — all endpoints` | `services` | Dev B | 2d |
| `[4.2] Document list: paginated table, search, tag filter, sort` | `ui`, `feature` | Dev A | 2d |
| `[4.3] Create document form: title, content, tags, metadata` | `ui`, `feature` | Dev A | 1.5d |
| `[4.4] File upload as document (FormData + progress)` | `feature` | Dev B | 1d |
| `[4.5] Batch document creation — JSON / multi-file` | `feature` | Dev B | 1.5d |
| `[4.6] Document detail page + chunk viewer` | `ui`, `feature` | Dev A | 1.5d |
| `[4.7] Edit / delete document` | `feature` | Dev A | 1d |
| `[4.8] Chunk CRUD: create, edit, delete individual chunks` | `feature` | Dev B | 1.5d |
| `[M4] ✅ Milestone: document & chunk management complete` | `milestone` | Dev A, Dev B | — |

---

### List: 📋 Phase 5 — Search & Vector (Week 7)

| Card Title | Labels | Members | Est. |
|------------|--------|---------|------|
| `[5.1] SearchApiService — semantic search endpoint` | `services` | Dev B | 0.5d |
| `[5.2] Search UI: collection picker, query input, params panel` | `ui`, `feature` | Dev A | 1.5d |
| `[5.3] Search results: score cards, content preview, doc link` | `ui`, `feature` | Dev A | 1.5d |
| `[5.4] VectorApiService — table info, search, create endpoints` | `services` | Dev B | 1d |
| `[5.5] Vector DB basic UI: table list, search form (optional)` | `feature`, `optional` | Dev B | 1.5d |
| `[5.6] Cross-module navigation: search → document detail` | `routing` | Dev A, Dev B | 0.5d |
| `[M5] ✅ Milestone: semantic search works` | `milestone` | Dev A, Dev B | — |

---

### List: 📋 Phase 6 — Finalization (Week 8)

| Card Title | Labels | Members | Est. |
|------------|--------|---------|------|
| `[6.1] Top-level navigation (MDTabs) across all modules` | `ui` | Dev A | 0.5d |
| `[6.2] Complete i18n: all labels in en + uk` | `i18n` | Dev A | 1d |
| `[6.3] Global error interceptor + toastr for all API errors` | `ux` | Dev B | 1d |
| `[6.4] Build plugin + test publish to MEF.DEV platform` | `deploy`, `critical` | Dev A, Dev B | 1.5d |
| `[6.5] Code review + refactoring` | `quality` | Dev A, Dev B | 1d |
| `[6.6] Write README.md` | `docs` | Dev A | 0.5d |
| `[6.7] Bug fix buffer` | `bugfix` | Dev A, Dev B | 0.5d |
| `[M6] ✅ Milestone: plugin production-ready` | `milestone` | Dev A, Dev B | — |

---

## Labels

| Label | Color | Meaning |
|-------|-------|---------|
| `setup` | 🔵 blue | Project infrastructure |
| `services` | 🟣 purple | API services / data layer |
| `ui` | 🟢 green | UI components / templates |
| `feature` | 🟡 yellow | Business feature |
| `ux` | 🟠 orange | UX / polish |
| `critical` | 🔴 red | Critical path — blocks others |
| `optional` | ⚪ grey | Can be cut if behind schedule |
| `milestone` | ⭐ gold | Phase completion gate |
| `qa` | 🟤 brown | Testing / verification |
| `routing` | 🔵 blue | Navigation / routing |
| `i18n` | 🟣 purple | Localization |
| `deploy` | 🔴 red | Build / publish |
| `docs` | ⚪ grey | Documentation |
| `bugfix` | 🟠 orange | Bug fixes |
| `quality` | 🟢 green | Code quality |
| `backend` | 🟣 purple | Backend integration |
| `models` | 🔵 blue | TypeScript interfaces |
| `polish` | 🟠 orange | Final polish |

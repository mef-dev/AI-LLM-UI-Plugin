# AI LLM UI Plugin — Vision & Calendar Plan

> UI plugin for the MEF.DEV platform implementing the interface for the LargeLanguageModel backend module (backend plugin `ai` v0.4.0.3).

---

## 1. Project Vision

### 1.1 Goal

Build a fully functional **Portal**-type UI plugin for the MEF.DEV platform that provides a convenient graphical interface for interacting with the `LargeLanguageModel` backend service. The plugin enables users to manage LLM models, document collections, chats, and vector databases through a web interface — without direct API calls.

### 1.2 Target Audience

- **MEF.DEV platform administrators** — managing the LLM model registry
- **Developers** — testing chat models, working with RAG documents
- **Data analysts** — uploading and searching documents, managing collections

### 1.3 Technology Stack

> Based on the production reference project `MEF.DEV_BPMN_Flow_Designer` (bpmn-designer v1.4.230).

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Angular | ~20.3.16 |
| Platform connector | @natec/mef-dev-platform-connector | ^17.0.5 |
| UI Kit | @natec/mef-dev-ui-kit | ^20.1.26 |
| Build tool | ngx-build-plus | (matching Angular 20) |
| Localization | @ngx-translate/core | ^17.0.0 |
| Translation loader | @ngx-translate/http-loader | ^7.0.0 |
| CDK | @angular/cdk | ^20.2.9 |
| Data tables | @swimlane/ngx-datatable | ^22.0.0 |
| Notifications | ngx-toastr | ^19.1.0 |
| Spinner | ngx-spinner | ^16.0.2 |
| CSS Framework | Bootstrap | ^5 |
| Icons | Font Awesome | ^4.7.0 |
| TypeScript | TypeScript | ^5.8.3 |
| RxJS | rxjs | ~7.8.1 |
| Package type | Portal (Frontend + Backend) | — |

### 1.4 Plugin Architecture

```
ai-llm-ui/
├── src/
│   ├── app/
│   │   ├── app.module.ts                  # Root module (AppModule)
│   │   ├── app.component.ts               # Root component, selector: ai-llm-ui
│   │   ├── app.initializer.ts             # APP_INITIALIZER factory
│   │   ├── app-routing.module.ts          # Routes with lazy loading
│   │   ├── not-found.component.ts         # 404 fallback
│   │   ├── intercept/
│   │   │   └── custom-translate-loader.helper.ts
│   │   ├── models/                        # TypeScript interfaces (from Swagger)
│   │   │   ├── llm-registry.models.ts
│   │   │   ├── chat.models.ts
│   │   │   ├── collection.models.ts
│   │   │   ├── document.models.ts
│   │   │   ├── search.models.ts
│   │   │   ├── vector.models.ts
│   │   │   └── enums.ts
│   │   ├── modules/
│   │   │   ├── llm-registry/              # LLM model registry (CRUD)
│   │   │   │   ├── components/
│   │   │   │   ├── services/
│   │   │   │   │   ├── llm-registry-api.service.ts
│   │   │   │   │   └── llm-registry-endpoint.service.ts
│   │   │   │   └── llm-registry.module.ts
│   │   │   ├── chat/                      # Chat playground with LLM
│   │   │   │   ├── components/
│   │   │   │   ├── services/
│   │   │   │   │   ├── chat-api.service.ts
│   │   │   │   │   └── chat-endpoint.service.ts
│   │   │   │   └── chat.module.ts
│   │   │   ├── collections/               # Document collection management
│   │   │   │   ├── components/
│   │   │   │   ├── services/
│   │   │   │   └── collections.module.ts
│   │   │   ├── documents/                 # Documents & chunks
│   │   │   │   ├── components/
│   │   │   │   ├── services/
│   │   │   │   └── documents.module.ts
│   │   │   ├── search/                    # Semantic search
│   │   │   │   ├── components/
│   │   │   │   ├── services/
│   │   │   │   └── search.module.ts
│   │   │   ├── vector/                    # Vector DB (low-level, optional)
│   │   │   │   ├── components/
│   │   │   │   ├── services/
│   │   │   │   └── vector.module.ts
│   │   │   └── shared/                    # Shared components, pipes, directives
│   │   │       └── shared.module.ts
│   ├── assets/
│   │   └── i18n/                          # Localization files (uk.json, en.json)
│   ├── environments/
│   │   ├── environment.ts                 # Dev: apiUrl, bauth, alias
│   │   ├── environment.prod.ts            # Prod: version only
│   │   └── version.ts                     # Auto-generated version
│   ├── index.html                         # <ai-llm-ui> root selector
│   ├── main.ts                            # Bootstrap + BootController
│   ├── polyfills.ts
│   ├── styles.scss
│   └── version.json
├── docs/                                  # Swagger, API documentation
│   ├── ai_LargeLanguageModel_0.4.0.3.json
│   ├── API_DOCUMENTATION.md
│   └── VISION_AND_PLAN.md
├── angular.json
├── metadata.json                          # MEF.DEV plugin metadata
├── package.json
├── tsconfig.json
├── tsconfig.app.json
└── tsconfig.spec.json
```

### 1.5 MEF.DEV Platform Integration Patterns

> All patterns below are taken from the production `bpmn-designer` project and must be followed exactly.

#### AppModule Setup

```typescript
// src/app/app.module.ts — reference pattern from bpmn-designer
@NgModule({
    declarations: [AppComponent],
    bootstrap: [AppComponent],
    imports: [
        CommonModule,
        BrowserModule,
        BrowserAnimationsModule,
        ToastrModule.forRoot(),
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useClass: CustomLoader,
                deps: [HttpClient],
            },
        }),
        AppRoutingModule,
        PortalModule,
        NgxSpinnerModule.forRoot({ type: 'ball-scale-multiple' }),
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            deps: [HttpClient, TranslateService],
            useFactory: init,
            multi: true,
        },
        {
            provide: APP_BASE_HREF,
            useFactory: PlatformHelper.getAppBasePath,
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: MefDevAuthInterceptor,
            multi: true,
        },
        {
            provide: OverlayContainer,
            useClass: CustomOverlayContainer,
        },
        provideHttpClient(withInterceptorsFromDi()),
    ],
})
export class AppModule {}
```

#### APP_INITIALIZER Pattern

```typescript
// src/app/app.initializer.ts — reference pattern from bpmn-designer
export function init(httpClient: HttpClient, translate: TranslateService) {
    return () =>
        forkJoin([loadPluginData(httpClient), loadTranslations(translate)]);
}

function loadPluginData(httpClient: HttpClient) {
    return PlatformHelper.loadPlatformOptions().pipe(
        map((data: UiProfileViewModel) => data),
        catchError((err) => {
            if (environment.production) throw err;
            return PlatformHelper.setOptions({
                httpClient: httpClient as any,
                alias: (environment as any).alias ?? 'ai',
                apiUrl: (environment as any).apiUrl ?? 'https://sandbox.mef.dev',
                pluginName: 'ai-llm-ui',
                headers: {
                    Authorization: `Basic ${btoa((environment as any).bauth)}`,
                },
            });
        }),
    );
}
```

#### Routing Pattern (Lazy Loading)

```typescript
// src/app/app-routing.module.ts — reference pattern from bpmn-designer
const routes: Routes = [
    {
        path: '',
        children: [
            { path: '', redirectTo: 'registry', pathMatch: 'full' },
            {
                path: 'registry',
                loadChildren: () =>
                    import('./modules/llm-registry/llm-registry.module')
                        .then((m) => m.LlmRegistryModule),
            },
            {
                path: 'chat',
                loadChildren: () =>
                    import('./modules/chat/chat.module')
                        .then((m) => m.ChatModule),
            },
            // ... other lazy modules
        ],
    },
];
```

#### Endpoint Service Pattern

```typescript
// reference pattern from bpmn-designer's endpoint.service.ts
@Injectable({ providedIn: 'root' })
export class EndpointService {
    private get pluginData() {
        return PlatformHelper.PluginDataSync;
    }

    get baseUrl(): string {
        return `${this.pluginData.apiUrl}/api/v2/${this.pluginData.alias}`;
    }

    get llmUrl(): string { return `${this.baseUrl}/llm`; }
    get chatUrl(): string { return `${this.baseUrl}/chat`; }
    get documentUrl(): string { return `${this.baseUrl}/document`; }
    get vectorUrl(): string { return `${this.baseUrl}/vector`; }
    get embeddingsUrl(): string { return `${this.baseUrl}/embeddings`; }
}
```

#### Custom Translation Loader

```typescript
// src/app/intercept/custom-translate-loader.helper.ts — reference pattern
export class CustomLoader implements TranslateLoader {
    constructor(private httpClient: HttpClient) {}

    getTranslation(langCountry: string): Observable<any> {
        if (!langCountry) langCountry = 'en';
        return this.httpClient.get(
            PlatformHelper.getAssetUrl() + '/i18n/' + langCountry + '.json'
        );
    }
}
```

#### Environment Configuration

```typescript
// src/environments/environment.ts — dev fallback
export const environment = {
    production: false,
    version: PLUGIN_VERSION.version,
    apiUrl: 'http://devserv.natec.com:9000',
    bauth: '',
    alias: 'ai',
};
```

### 1.6 Functional Modules

The plugin consists of **6 functional modules** mapping to the backend API groups:

#### Module 1: LLM Registry (Model Registry) — **Priority 1**
- Paginated model list table with status badges (DRAFT / VALIDATED / DISABLED)
- Create new model (form: model_name, display_name, device, access_mode, url, api_key, headers, capabilities, config)
- Edit existing model
- Validate model (check availability)
- Delete model (with confirmation)
- Upload model ZIP archive
- Filters by status and model name

**Backend endpoints:** `GET/POST/PUT/DELETE api/v2/ai/llm`, `POST /{id}/validate`, `POST /{id}/upload`

#### Module 2: Chat Playground — **Priority 2**
- Chat interface with streaming response (SSE / EventSource)
- Model selection dropdown (from registry, only VALIDATED models)
- Generation parameter settings panel (temperature, top_k, top_p, max_tokens, etc.)
- Message history within session
- Role display (system / user / assistant)
- System prompt input
- Clear history / copy responses

**Backend endpoints:** `POST api/v2/ai/chat/completions`

#### Module 3: Collections (Document Collections)
- Paginated collection list
- Create collection (name, description, model, chunk_length, chunk_overlap, vector_search settings)
- Collection detail view (documents_count, chunks_count statistics)
- Edit and delete collection

**Backend endpoints:** `GET/POST/PUT/DELETE api/v2/ai/document/collection`

#### Module 4: Documents & Chunks
- Document list within a collection (pagination, search, tag filtering, sorting)
- Create document (title, content, source, tags, metadata)
- Batch document creation
- File upload as document
- Document detail view with chunk viewer
- Edit / delete document
- CRUD for individual chunks

**Backend endpoints:** `api/v2/ai/document/{collection}/documents/*`, `*/chunks/*`

#### Module 5: Semantic Search
- Collection selector for search scope
- Search query input
- Parameter settings (top_k, metric, score_mode, min_score, tags)
- Results display with relevance scores
- Content highlighting in chunk results

**Backend endpoints:** `POST api/v2/ai/document/{collection}/search`

#### Module 6: Vector DB — optional / admin
- Vector table management
- SQL query execution
- Table structure create / update
- Document upload to tables
- Vector search

**Backend endpoints:** `api/v2/ai/vector/*`

### 1.7 UI/UX Requirements

- Use `@natec/mef-dev-ui-kit` components (V2 Material Design):
  - `MDTabsModule` — top-level navigation between modules
  - `MDCardModule` — model/collection/document cards
  - `MDModalModule` — create/edit dialogs
  - `MDSelectModule` — dropdowns (models, statuses, metrics)
  - `MDCheckBoxModule`, `MDSwitchModule` — parameter toggles
  - `MDSteppperModule` — step-by-step collection creation
  - `MDCollapseModule` — collapsible details/configurations
  - `MefDevPageLayoutsModule` — page templates (table, manage)
  - `MefDevFilteredFieldModule` — filter and search fields
  - `MefDevProgressModule` — loading indicators
- `@swimlane/ngx-datatable` for data tables (same as bpmn-designer)
- `ngx-toastr` for notifications (same as bpmn-designer)
- `ngx-spinner` for global loading states (same as bpmn-designer)
- Responsive design (mobile adaptation)
- i18n support (en, uk)
- Reactive Forms for all input forms

### 1.8 TypeScript Configuration

> Matching the `bpmn-designer` tsconfig exactly:

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "esnext",
        "moduleResolution": "bundler",
        "lib": ["ES2022", "dom"],
        "strict": true,
        "strictNullChecks": false,
        "noImplicitAny": false,
        "paths": {
            "@app-module/*": ["src/app/*"],
            "@llm-module/*": ["src/app/modules/llm-registry/*"],
            "@chat-module/*": ["src/app/modules/chat/*"]
        }
    }
}
```

---

## 2. Calendar Plan

> **Total duration:** 8 weeks (40 working days)
> **Team:** 2 trainee-level developers (Dev A, Dev B)
> **Work model:** Parallel work on independent tasks; pair programming for complex tasks

### Phase 0: Project Scaffolding (Week 1, Days 1–5)

Both developers work together (pair programming) to establish the project foundation.

| # | Task | Assignee | Days | Deliverable |
|---|------|----------|------|-------------|
| 0.1 | Initialize Angular 20 project, configure `angular.json` (ngx-build-plus builder, styles, assets), `tsconfig.json` matching bpmn-designer | Dev A + B | 1 | Working scaffold that builds |
| 0.2 | Install dependencies: `@natec/mef-dev-platform-connector`, `@natec/mef-dev-ui-kit`, `ngx-toastr`, `ngx-spinner`, Bootstrap, Font Awesome, `@swimlane/ngx-datatable`, `@ngx-translate` | Dev A | 0.5 | All dependencies installed |
| 0.3 | Set up platform connector: `APP_INITIALIZER` with `loadPlatformOptions`, `APP_BASE_HREF`, `MefDevAuthInterceptor`, `CustomOverlayContainer`, environment fallback (dev / prod) | Dev B | 1.5 | Plugin boots locally and on platform |
| 0.4 | Set up i18n: `@ngx-translate` with `CustomLoader` using `PlatformHelper.getAssetUrl()`, create `en.json` / `uk.json` skeleton | Dev A | 0.5 | Localization works |
| 0.5 | Generate TypeScript model interfaces from Swagger / API documentation (all request/response types, enums) | Dev B | 1 | All interfaces in `models/` |
| 0.6 | Create `EndpointService` (dynamic URL construction via `PlatformHelper.PluginDataSync`) + skeleton API services for all 6 modules | Dev A | 1 | EndpointService + service stubs |
| 0.7 | Set up routing (`AppRoutingModule`): lazy-loaded feature modules, `not-found` component, `index.html` with `<ai-llm-ui>` selector, `main.ts` bootstrap with `BootController` | Dev B | 0.5 | Routing + lazy loading works |

**Milestone: Project scaffolded, services ready, builds successfully, boots on platform**

---

### Phase 1: LLM Registry Module (Week 2, Days 6–10)

Primary: Dev A — UI components. Secondary: Dev B — API service, model upload.

| # | Task | Assignee | Days | Deliverable |
|---|------|----------|------|-------------|
| 1.1 | `LlmRegistryApiService`: implement all endpoints (`GET /llm`, `GET /llm/{id}`, `POST /llm`, `PUT /llm/{id}`, `DELETE /llm/{id}`, `POST /{id}/validate`, `POST /{id}/upload`) | Dev B | 1.5 | Fully functional API service |
| 1.2 | Registry list page: paginated table (ngx-datatable), status badges (DRAFT=yellow, VALIDATED=green, DISABLED=red), filter by status (MDSelect) and model name (MefDevFilteredField) | Dev A | 2 | Working model list |
| 1.3 | Create model modal (MDModal + Reactive Form): fields for model_name, display_name, device (MDSelect), access_mode (MDSelect), url, api_key, headers (JSON editor), capabilities, config | Dev A | 1.5 | Model creation via UI |
| 1.4 | Edit model modal (reuse create form, pre-fill values) + status change (MDSelect) | Dev B | 1 | Edit works |
| 1.5 | Validate model action (button + toast result), Delete model (confirmation dialog), Upload ZIP (file input + FormData) | Dev B | 1 | Full CRUD + validate + upload |
| 1.6 | Error handling for registry: toastr notifications on API errors, loading spinner | Dev A | 0.5 | UX polish |

**Milestone: Full LLM model management working end-to-end**

---

### Phase 2: Chat Playground (Week 3, Days 11–15)

Primary: Dev B — streaming logic. Secondary: Dev A — UI components.

| # | Task | Assignee | Days | Deliverable |
|---|------|----------|------|-------------|
| 2.1 | `ChatApiService`: implement `POST /chat/completions` with SSE streaming support (EventSource / fetch with ReadableStream) + non-streaming fallback | Dev B | 2 | Streaming API service |
| 2.2 | Chat UI: message list component (user/assistant/system bubbles), input textarea with send button, model selector dropdown (loads VALIDATED models from registry) | Dev A | 2 | Basic chat interface |
| 2.3 | Integrate streaming: display tokens as they arrive, auto-scroll, typing indicator | Dev B | 1 | Real-time streaming works |
| 2.4 | Generation parameters panel (MDCollapse): temperature, top_k, top_p, max_tokens, repetition_penalty sliders/inputs, system prompt textarea | Dev A | 1.5 | Parameter tuning UI |
| 2.5 | UX improvements: clear history button, copy response to clipboard, message timestamps, error display | Dev A + B | 1 | Chat playground complete |

**Milestone: Fully functional chat playground with streaming, model selection, and parameter tuning**

---

### Phase 3: Collections (Week 4, Days 16–20)

Dev A and Dev B work in parallel.

| # | Task | Assignee | Days | Deliverable |
|---|------|----------|------|-------------|
| 3.1 | `CollectionApiService`: implement all collection endpoints (CRUD + list with pagination) | Dev B | 1 | Collection API service |
| 3.2 | Collection list page: paginated table, columns (name, model, chunk_length, documents_count, created_at) | Dev A | 1.5 | Collection table |
| 3.3 | Create collection dialog (MDStepper): Step 1 — basic info (name, description, model), Step 2 — chunking settings (chunk_length, chunk_overlap), Step 3 — vector_search config (algorithms, profiles) | Dev A | 2 | Step-by-step creation |
| 3.4 | Collection detail page: statistics (documents_count, chunks_count), edit description/settings, delete with confirmation | Dev B | 1.5 | Detail page |
| 3.5 | Navigation: collection list → collection detail → documents in collection | Dev A + B | 0.5 | Module linking |

**Milestone: Collection management ready, navigation to documents**

---

### Phase 4: Documents & Chunks (Week 5–6, Days 21–30)

Largest module — both developers work in parallel, Dev A on documents, Dev B on chunks and special features.

| # | Task | Assignee | Days | Deliverable |
|---|------|----------|------|-------------|
| 4.1 | `DocumentApiService` + `ChunkApiService`: implement all document/chunk endpoints (CRUD, batch, file upload, search, pagination) | Dev B | 2 | API services |
| 4.2 | Document list page: paginated table within a collection context, search by title, filter by tags (MefDevFilteredField), sort by column | Dev A | 2 | Document table |
| 4.3 | Create document form (MDModal): title, content (textarea), source, tags (chips input), metadata (JSON editor) | Dev A | 1.5 | Document creation |
| 4.4 | File upload as document (FormData, file input, progress indicator) | Dev B | 1 | File upload |
| 4.5 | Batch document creation: JSON paste or multi-file upload interface | Dev B | 1.5 | Batch import |
| 4.6 | Document detail page: full content view, chunk list (MDCollapse for each chunk with content preview) | Dev A | 1.5 | Detail + chunks view |
| 4.7 | Edit / delete document (reuse form, pre-fill) | Dev A | 1 | Document CRUD complete |
| 4.8 | Chunk CRUD: create new chunk, edit chunk content/metadata, delete chunk | Dev B | 1.5 | Chunk management |

**Milestone: Full document and chunk management**

---

### Phase 5: Semantic Search + Vector DB (Week 7, Days 31–35)

| # | Task | Assignee | Days | Deliverable |
|---|------|----------|------|-------------|
| 5.1 | `SearchApiService`: implement `POST /{collection}/search` | Dev B | 0.5 | Search API service |
| 5.2 | Search interface: collection selector (MDSelect), query input, parameter panel (top_k, metric, score_mode, min_score, tags filter) | Dev A | 1.5 | Search form |
| 5.3 | Search results display: cards with relevance score (progress bar), document title, chunk content preview, link to full document | Dev A | 1.5 | Results display |
| 5.4 | `VectorApiService`: implement key vector endpoints (table info, search, create) | Dev B | 1 | Vector API service |
| 5.5 | Vector DB basic interface (optional): table list, vector search form, results table | Dev B | 1.5 | Low-level vector UI |
| 5.6 | Cross-module navigation: search results → document detail, collection → search | Dev A + B | 0.5 | Module linking |

**Milestone: Semantic search working, Vector DB basic UI**

---

### Phase 6: Finalization & Polish (Week 8, Days 36–40)

| # | Task | Assignee | Days | Deliverable |
|---|------|----------|------|-------------|
| 6.1 | Top-level navigation (MDTabs) across all modules, home/landing page with module overview | Dev A | 0.5 | Cohesive UI |
| 6.2 | Complete localization: translate all component labels, messages, tooltips to en + uk | Dev A | 1 | i18n complete |
| 6.3 | Global error handling: HTTP error interceptor, toastr notifications for all API errors, ErrorResponse parsing | Dev B | 1 | Error handling |
| 6.4 | Build plugin: `ng build --output-hashing none --single-bundle`, test publish to MEF.DEV platform, verify all modules work under platform context | Dev A + B | 1.5 | Plugin works on platform |
| 6.5 | Code review, refactoring, remove dead code, ensure consistent patterns | Dev A + B | 1 | Code quality |
| 6.6 | Write README.md: installation, development, build, publish instructions | Dev A | 0.5 | Documentation |
| 6.7 | Bug fix buffer + final regression testing | Dev A + B | 1 | Stable release |

**Milestone: Plugin production-ready**

---

## 3. Summary Gantt Chart

```
Week       1         2         3         4         5         6         7         8
         |---------|---------|---------|---------|---------|---------|---------|---------|
Phase 0  [===A+B===]
Phase 1             [===A+B===]
Phase 2                       [===A+B===]
Phase 3                                 [===A+B===]
Phase 4                                           [=========A+B=========]
Phase 5                                                                 [===A+B===]
Phase 6                                                                           [===A+B===]
```

| Phase | Name | Weeks | Working Days | Priority Focus |
|-------|------|-------|:------------:|----------------|
| 0 | Project Scaffolding | Week 1 | 5 | Foundation for everything |
| 1 | **LLM Registry** | Week 2 | 5 | **Core module — first deliverable** |
| 2 | **Chat Playground** | Week 3 | 5 | **Minimal playground — second deliverable** |
| 3 | Collections | Week 4 | 5 | RAG foundation |
| 4 | Documents & Chunks | Week 5–6 | 10 | Largest module |
| 5 | Semantic Search + Vector | Week 7 | 5 | Search + optional admin |
| 6 | Finalization | Week 8 | 5 | Polish + platform deploy |
| **Total** | | **8 weeks** | **40 days** | |

### Team Workload Distribution

| Developer | Primary Responsibility | Focus Areas |
|-----------|----------------------|-------------|
| **Dev A** | UI components, forms, layout | Tables, modals, steppers, localization, responsive design |
| **Dev B** | API services, data layer, complex logic | HTTP services, streaming (SSE), file uploads, error handling |

---

## 4. Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|:-----------:|:------:|------------|
| Trainee developers unfamiliar with Angular / MEF.DEV platform | High | High | Week 1 pair programming; bpmn-designer as reference project; code review checkpoints at each milestone |
| SSE streaming does not work through platform proxy | Medium | High | Implement non-streaming fallback from day 1; test on platform as early as Week 3 |
| Backend API changes during development | Low | Medium | Swagger as single source of truth; version services |
| platform.mef.dev documentation unavailable | High | Medium | Use bpmn-designer + tutorial-ui-plugin as primary reference implementations |
| Vector DB module complexity | Medium | Low | Module is optional; implement last; can be cut if behind schedule |
| Angular 20 / UI Kit version incompatibility | Low | High | Use exact same versions as bpmn-designer (proven production stack) |

---

## 5. Definition of Done

- [ ] Plugin builds via `ng build --output-hashing none --single-bundle` without errors
- [ ] Plugin publishes to MEF.DEV platform successfully
- [ ] All 6 API groups have a corresponding UI module
- [ ] Forms use Reactive Forms with validation
- [ ] UI built on `@natec/mef-dev-ui-kit` components
- [ ] Localization works (en, uk)
- [ ] Streaming chat works on the platform
- [ ] API errors are handled and displayed to the user via toastr
- [ ] Responsive layout for primary modules
- [ ] Code follows patterns from bpmn-designer reference project

---

## 6. Reference Materials

| Resource | URL / Path |
|----------|------------|
| Backend Swagger | `docs/ai_LargeLanguageModel_0.4.0.3.json` |
| Backend API documentation | `docs/API_DOCUMENTATION.md` |
| Tutorial UI plugin (example) | https://github.com/mef-dev/tutorial-ui-plugin |
| MEF.DEV developer guide | https://platform.mef.dev/dev_guides/first_ui_plugin |
| UI Kit (npm) | https://www.npmjs.com/package/@natec/mef-dev-ui-kit |
| UI Kit demo | https://platform.mef.dev/ui_kit_demo/app/home |
| Reference project (bpmn-designer) | `C:\Users\Vladi40k\source\repos\abc\MEF.DEV_BPMN_Flow_Designer` |

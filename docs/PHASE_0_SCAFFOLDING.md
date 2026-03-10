# Phase 0 — Project Scaffolding

> **Duration:** Week 1 (Days 1–5)
> **Team:** Dev A + Dev B (pair programming for most tasks)
> **Goal:** A working Angular 20 plugin that boots locally and on MEF.DEV platform, with all infrastructure ready.
> **Reference project:** `MEF.DEV_BPMN_Flow_Designer` — study its structure before starting.

---

## Task 0.1 — Initialize Angular 20 Project (Dev A + B, 1 day)

Create a new Angular 20 project with SCSS and routing.

**Key points:**
- Root selector: `ai-llm-ui` (used in `app.component.ts`, `index.html`)
- Builder: `ngx-build-plus:browser` (not the default Angular builder)
- Create `src/polyfills.ts` with zone.js import
- Create `src/boot-controller.ts` — singleton with RxJS Subject for app reboot (see bpmn-designer reference)

**`src/main.ts` pattern:**

```typescript
const init = () => {
    platformBrowserDynamic().bootstrapModule(AppModule)
        .then(() => { clearLoader(); (<any>window).appBootstrap?.(); })
        .catch(err => { clearLoader(); console.error('NG Bootstrap Error =>', err); });
};
init();
// Re-init on reboot
BootController.getbootControl().watchReboot().subscribe(() => init());
```

**`src/index.html`** — include a CSS-only spinner in `#global-loader` div above `<ai-llm-ui>` (see bpmn-designer for the exact pattern).

**Verification:** `ng serve` builds and renders the root component.

---

## Task 0.2 — Install Dependencies (Dev A, 0.5 day)

### Production

```bash
npm i @natec/mef-dev-platform-connector@^17.0.5 @natec/mef-dev-ui-kit@^20.1.26
npm i @angular/cdk@^20.2.9 @ngx-translate/core@^17.0.0 @ngx-translate/http-loader@^7.0.0
npm i @swimlane/ngx-datatable@^22.0.0 ngx-toastr@^19.1.0 ngx-spinner@^16.0.2
npm i bootstrap@^5.3.2 font-awesome@^4.7.0
```

### Dev

```bash
npm i -D ngx-build-plus
```

### `angular.json` — key config

- Builder: `ngx-build-plus:browser`
- Styles array must include: `font-awesome.css`, `ngx-toastr/toastr.css`, `ngx-spinner` animation CSS, `src/styles.scss`
- Assets: `favicon.ico`, `assets/`, `version.json`, `metadata.json`
- Plugin build script: `ng build --output-hashing none --single-bundle`

Study the bpmn-designer `angular.json` for the full structure.

**Verification:** `ng build` passes with no errors.

---

## Task 0.3 — Platform Connector Setup (Dev B, 1.5 days)

This is the most critical task. The plugin must work both standalone (dev) and inside the MEF.DEV platform.

### Environment files

Create `environment.ts` (dev) and `environment.prod.ts` (prod):

```typescript
// environment.ts — dev fallback
export const environment = {
    production: false,
    version: PLUGIN_VERSION.version,
    apiUrl: 'http://devserv.natec.com:9000',
    bauth: '',
    alias: 'ai',
};
```

Production only has `production: true` and `version`.

### APP_INITIALIZER

Create `src/app/app.initializer.ts`. It must:

1. Call `PlatformHelper.loadPlatformOptions()`
2. On error (standalone mode) — fallback to `PlatformHelper.setOptions(...)` with env values
3. Load translations via `TranslateService`
4. Return `forkJoin` of both

**Key pattern:**

```typescript
export function init(httpClient: HttpClient, translate: TranslateService) {
    return () => forkJoin([loadPluginData(httpClient), loadTranslations(translate)]);
}
```

The `loadPluginData` function should call `PlatformHelper.loadPlatformOptions()` and catch errors with a fallback using `PlatformHelper.setOptions({ alias: 'ai', pluginName: 'ai-llm-ui', ... })`.

### AppModule providers

```typescript
providers: [
    { provide: APP_INITIALIZER, deps: [HttpClient, TranslateService], useFactory: init, multi: true },
    { provide: APP_BASE_HREF, useFactory: PlatformHelper.getAppBasePath },
    { provide: HTTP_INTERCEPTORS, useClass: MefDevAuthInterceptor, multi: true },
    { provide: OverlayContainer, useClass: CustomOverlayContainer },
    provideHttpClient(withInterceptorsFromDi()),
]
```

### CustomOverlayContainer

CDK overlay container must render inside `<ai-llm-ui>`, not `<body>`. Create a class extending `OverlayContainer` that overrides `_createContainer()` — attach the container element to `document.getElementsByTagName('ai-llm-ui')[0]`.

### AppModule imports

```typescript
imports: [
    CommonModule, BrowserModule, BrowserAnimationsModule,
    ToastrModule.forRoot(),
    TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: CustomLoader, deps: [HttpClient] } }),
    AppRoutingModule, PortalModule,
    NgxSpinnerModule.forRoot({ type: 'ball-scale-multiple' }),
]
```

**Verification:** Console shows `✅ Platform data loaded` (on platform) or `⚠️ fallback` (local dev). No errors.

---

## Task 0.4 — i18n Setup (Dev A, 0.5 day)

### Custom translation loader

Create `src/app/intercept/custom-translate-loader.helper.ts` implementing `TranslateLoader`. It must use `PlatformHelper.getAssetUrl()` to resolve the path to `/i18n/{lang}.json` — this is critical because assets are in a different location when running inside the platform.

### Translation files

Create `src/assets/i18n/en.json` and `src/assets/i18n/uk.json` with a basic structure:

- `common.*` — shared labels (save, cancel, delete, edit, create, search, loading, no_data, status, etc.)
- `nav.*` — navigation labels (registry, chat, collections, documents, search, vector)
- `registry.*` — registry-specific labels (model_name, display_name, device, access_mode, validate, etc.)
- `chat.*` — chat-specific labels (send, type_message, system_prompt, parameters, etc.)

Start with English, fill Ukrainian translations later.

**Verification:** Labels render in English. Switching `localStorage.language` to `'uk'` → Ukrainian labels.

---

## Task 0.5 — TypeScript Models (Dev B, 1 day)

Generate all TypeScript interfaces and enums from the Swagger (`docs/ai_LargeLanguageModel_0.4.0.3.json`) and API documentation (`docs/API_DOCUMENTATION.md`).

### File structure

```
src/app/models/
├── index.ts              # barrel export
├── enums.ts              # DeviceEnum, LlmStatusEnum, AccessModeEnum, VectorDbProviderEnum
├── common.models.ts      # ErrorResponse, ActionResultResponse, EmbeddingsRequest
├── llm-registry.models.ts # LLMRegistryLocator, LlmCreateRequest, LlmUpdateRequest
├── chat.models.ts        # ChatMessage, ChatCompletionsRequest
├── collection.models.ts  # CollectionCreateRequest, CollectionResponse, CollectionListResponse, etc.
├── document.models.ts    # Document CRUD models, Chunk models, BatchCreate models
├── search.models.ts      # DocumentSearchRequest, SearchResult, DocumentSearchResponse
└── vector.models.ts      # Vector table/search/upload/delete models
```

### Guidelines

- Use the API_DOCUMENTATION.md as the primary source — it has clearer field descriptions
- All optional fields should use `?` (e.g., `display_name?: string`)
- Use `Record<string, any>` for dynamic JSON objects (headers, capabilities, config, metadata)
- Enums should be numeric to match backend values (DRAFT=0, VALIDATED=1, DISABLED=2, etc.)
- Create a barrel `index.ts` that re-exports everything

**Verification:** Project compiles. All models match the API documentation.

---

## Task 0.6 — Endpoint Service (Dev A, 1 day)

### Create `src/app/services/endpoint.service.ts`

A singleton service (`providedIn: 'root'`) that constructs API URLs dynamically using `PlatformHelper.PluginDataSync`:

```typescript
get baseUrl(): string {
    return `${this.pluginData.apiUrl}/api/v2/${this.pluginData.alias}`;
}
```

Provide getters for each API group: `llmUrl`, `chatUrl`, `documentUrl`, `vectorUrl`, `embeddingsUrl`, `migrationUrl`.

**Verification:** Inject into any component, log `endpointService.baseUrl` — correct URL appears.

---

## Task 0.7 — Routing + Stub Modules (Dev B, 0.5 day)

### AppRoutingModule

All routes must be inside `children` of the root `path: ''` (MEF.DEV platform requirement). Use lazy loading for each feature module:

```typescript
const routes: Routes = [
    {
        path: '',
        children: [
            { path: '', redirectTo: 'registry', pathMatch: 'full' },
            { path: 'registry', loadChildren: () => import('./modules/llm-registry/...') },
            { path: 'chat', loadChildren: () => import('./modules/chat/...') },
            { path: 'collections', loadChildren: () => import('./modules/collections/...') },
            { path: 'documents', loadChildren: () => import('./modules/documents/...') },
            { path: 'search', loadChildren: () => import('./modules/search/...') },
            { path: 'vector', loadChildren: () => import('./modules/vector/...') },
            { path: 'not-found', component: NotFoundComponent },
        ],
    },
];
```

### Stub modules

Create minimal placeholder modules for each route (module + container component with "Coming Soon" text) so the build does not fail. Each module should have its own `RouterModule.forChild(routes)`.

### `src/styles.scss`

Key pattern from bpmn-designer — scope Bootstrap and UI Kit inside the root selector:

```scss
@use 'node_modules/@natec/mef-dev-ui-kit/src/lib/styles/vars.scss' as c;
@import 'node_modules/@natec/mef-dev-ui-kit/src/lib/styles/global.scss';

ai-llm-ui {
    @import 'node_modules/bootstrap/scss/bootstrap.scss';
    @import 'node_modules/@natec/mef-dev-ui-kit/src/lib/styles/core.scss';
    // ... your global styles
}
```

### `tsconfig.json`

Copy from bpmn-designer. Key additions — path aliases:

```json
"paths": {
    "@app-module/*": ["src/app/*"],
    "@llm-module/*": ["src/app/modules/llm-registry/*"],
    "@chat-module/*": ["src/app/modules/chat/*"]
}
```

**Verification:**
- `ng serve` → navigates to `/registry` → shows placeholder
- Each route works
- `ng build --output-hashing none --single-bundle` passes

---

## Phase 0 Checklist

| # | Task | Owner | Done |
|---|------|-------|------|
| 0.1 | Angular 20 project, main.ts, index.html, boot-controller | A + B | ☐ |
| 0.2 | Dependencies installed, angular.json configured | A | ☐ |
| 0.3 | Platform connector: initializer, interceptor, overlay, environments | B | ☐ |
| 0.4 | i18n: custom loader, en.json, uk.json | A | ☐ |
| 0.5 | All TypeScript models from Swagger/API docs | B | ☐ |
| 0.6 | EndpointService | A | ☐ |
| 0.7 | Routing, stub modules, styles, tsconfig | B | ☐ |
| **BUILD** | `ng build --output-hashing none --single-bundle` passes | Both | ☐ |
| **SERVE** | `ng serve` → boots, shows placeholder page | Both | ☐ |

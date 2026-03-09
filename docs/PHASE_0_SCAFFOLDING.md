# Phase 0 — Project Scaffolding

> **Duration:** Week 1 (Days 1–5)
> **Team:** Dev A + Dev B (pair programming for most tasks)
> **Goal:** A working Angular 20 plugin that boots locally and on MEF.DEV platform, with all infrastructure ready.

---

## Prerequisites

Before starting, make sure you have installed:
- Node.js (LTS)
- `@angular/cli` (v20)
- Access to the MEF.DEV platform (devserv.natec.com)
- Reference project: `MEF.DEV_BPMN_Flow_Designer`

---

## Task 0.1 — Initialize Angular 20 Project (Dev A + B, 1 day)

### Steps

1. Create Angular 20 project:

```bash
ng new ai-llm-ui --style=scss --routing=true --skip-tests=true
```

2. Rename the root selector to `ai-llm-ui` in:
   - `src/app/app.component.ts` → `selector: 'ai-llm-ui'`
   - `src/index.html` → `<ai-llm-ui></ai-llm-ui>`

3. Create `src/polyfills.ts`:

```typescript
import 'zone.js';
```

4. Create `src/boot-controller.ts`:

```typescript
import { Subject } from 'rxjs';

export class BootController {
    private static instance: BootController;
    private _reboot: Subject<boolean> = new Subject();
    private reboot$ = this._reboot.asObservable();

    static getbootControl() {
        if (!BootController.instance) {
            BootController.instance = new BootController();
        }
        return BootController.instance;
    }

    public watchReboot() {
        return this.reboot$;
    }

    public restart() {
        this._reboot.next(true);
    }
}
```

5. Replace `src/main.ts` with:

```typescript
import { ApplicationRef, enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { BootController } from './boot-controller';
import { environment } from './environments/environment';

if (environment.production) {
    enableProdMode();
}

const init = () => {
    platformBrowserDynamic()
        .bootstrapModule(AppModule)
        .then((moduleRef) => {
            const appRef = moduleRef.injector.get(ApplicationRef);
            clearLoader();
            (<any>window).appBootstrap && (<any>window).appBootstrap();
        })
        .catch((err) => {
            clearLoader();
            console.error('NG Bootstrap Error =>', err);
        });
};

init();

function clearLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.remove();
    }
}

const boot = BootController.getbootControl()
    .watchReboot()
    .subscribe(() => init());
```

6. Replace `src/index.html` with:

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <title>AI LLM UI</title>
        <base href="/" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href="favicon.ico" />
    </head>
    <body>
        <style>
            #global-loader {
                position: fixed;
                inset: 0;
                background: white;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .spinner {
                width: 48px;
                height: 48px;
                border: 5px solid #ccc;
                border-top-color: #1976d2;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
        <div id="global-loader">
            <div class="spinner"></div>
        </div>
        <ai-llm-ui></ai-llm-ui>
    </body>
</html>
```

### Verification
- `ng serve` — project builds and shows in browser
- Root selector `<ai-llm-ui>` renders

---

## Task 0.2 — Install Dependencies (Dev A, 0.5 day)

### Install production dependencies

```bash
npm install @natec/mef-dev-platform-connector@^17.0.5
npm install @natec/mef-dev-ui-kit@^20.1.26
npm install @angular/cdk@^20.2.9
npm install @ngx-translate/core@^17.0.0
npm install @ngx-translate/http-loader@^7.0.0
npm install ngx-toastr@^19.1.0
npm install ngx-spinner@^16.0.2
npm install bootstrap@^5.3.2
npm install font-awesome@^4.7.0
npm install rxjs@~7.8.1
```

### Install dev dependencies

```bash
npm install --save-dev ngx-build-plus
```

### Update `angular.json`

Replace the builder and configure styles/assets (key sections):

```json
{
    "projects": {
        "ai-llm-ui": {
            "architect": {
                "build": {
                    "builder": "ngx-build-plus:browser",
                    "options": {
                        "outputPath": "dist/ai-llm-ui",
                        "index": "src/index.html",
                        "main": "src/main.ts",
                        "polyfills": "src/polyfills.ts",
                        "tsConfig": "tsconfig.app.json",
                        "assets": [
                            "src/favicon.ico",
                            "src/assets",
                            "src/version.json",
                            "src/metadata.json"
                        ],
                        "styles": [
                            "node_modules/font-awesome/css/font-awesome.css",
                            "node_modules/ngx-toastr/toastr.css",
                            "node_modules/ngx-spinner/animations/ball-scale-multiple.css",
                            "src/styles.scss"
                        ],
                        "scripts": []
                    },
                    "configurations": {
                        "production": {
                            "fileReplacements": [
                                {
                                    "replace": "src/environments/environment.ts",
                                    "with": "src/environments/environment.prod.ts"
                                }
                            ],
                            "outputHashing": "all",
                            "budgets": [
                                {
                                    "type": "initial",
                                    "maximumWarning": "500kb",
                                    "maximumError": "10mb"
                                }
                            ]
                        },
                        "development": {
                            "optimization": false,
                            "sourceMap": true,
                            "namedChunks": true
                        }
                    },
                    "defaultConfiguration": "production"
                },
                "serve": {
                    "builder": "ngx-build-plus:dev-server",
                    "configurations": {
                        "production": {
                            "buildTarget": "ai-llm-ui:build:production"
                        },
                        "development": {
                            "buildTarget": "ai-llm-ui:build:development"
                        }
                    },
                    "defaultConfiguration": "development"
                }
            }
        }
    }
}
```

### Update `package.json` scripts

```json
{
    "scripts": {
        "start": "ng serve",
        "build": "ng build",
        "build:plugin": "ng build --output-hashing none --single-bundle",
        "publish": "mef-dev-publish"
    }
}
```

### Verification
- `npm install` — no errors
- `ng build` — builds successfully

---

## Task 0.3 — Platform Connector Setup (Dev B, 1.5 days)

### Create environment files

**`src/environments/version.ts`:**

```typescript
export const PLUGIN_VERSION = {
    version: '0.1.0',
};
```

**`src/environments/environment.ts`** (development):

```typescript
import { PLUGIN_VERSION } from './version';

export const environment = {
    production: false,
    version: PLUGIN_VERSION.version,
    apiUrl: 'http://devserv.natec.com:9000',
    bauth: '',
    alias: 'ai',
};
```

**`src/environments/environment.prod.ts`** (production):

```typescript
import { PLUGIN_VERSION } from './version';

export const environment = {
    production: true,
    version: PLUGIN_VERSION.version,
};
```

**`src/version.json`:**

```json
{
    "version": "0.1.0"
}
```

### Create `src/app/app.initializer.ts`

```typescript
import { TranslateService } from '@ngx-translate/core';
import { catchError, forkJoin, map } from 'rxjs';
import { PlatformHelper, UiProfileViewModel } from '@natec/mef-dev-platform-connector';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

export function init(httpClient: HttpClient, translate: TranslateService) {
    return () =>
        forkJoin([
            loadPluginData(httpClient),
            loadTranslations(translate),
        ]);
}

function loadPluginData(httpClient: HttpClient) {
    return PlatformHelper.loadPlatformOptions().pipe(
        map((data: UiProfileViewModel) => {
            console.warn('✅ Platform data loaded');
            return data;
        }),
        catchError((err) => {
            console.warn('⚠️ Platform data not detected, using fallback');
            if (environment.production) {
                throw err;
            }
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

function loadTranslations(translate: TranslateService) {
    translate.setDefaultLang(localStorage.getItem('language') ?? 'en');
    return translate.get('test');
}
```

### Create Custom Overlay Container

Add to `src/app/app.module.ts` (or separate file):

```typescript
import { Injectable } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

@Injectable()
export class CustomOverlayContainer extends OverlayContainer {
    protected override _createContainer(): void {
        const container = document.createElement('div');
        container.classList.add('cdk-overlay-container');
        const host = document.getElementsByTagName('ai-llm-ui')[0];
        (host || document.body).appendChild(container);
        this._containerElement = container;
    }
}
```

### Create `src/app/app.component.ts`

```typescript
import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'ai-llm-ui',
    template: `
        <router-outlet></router-outlet>
        <ngx-spinner type="ball-scale-multiple"></ngx-spinner>
    `,
    styles: [
        `
            :host {
                display: block;
                height: 100%;
                min-height: 400px;
                overflow: hidden;
            }
        `,
    ],
    standalone: false,
})
export class AppComponent {
    constructor(private titleService: Title) {
        this.titleService.setTitle('AI LLM UI');
    }
}
```

### Create `src/app/app.module.ts`

```typescript
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { HttpClient, HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrModule } from 'ngx-toastr';
import { NgxSpinnerModule } from 'ngx-spinner';
import { OverlayContainer } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { MefDevAuthInterceptor, PlatformHelper } from '@natec/mef-dev-platform-connector';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CustomLoader } from './intercept/custom-translate-loader.helper';
import { CustomOverlayContainer } from './custom-overlay-container';
import { init } from './app.initializer';

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

### Verification
- `ng serve` — console shows `✅ Platform data loaded` or `⚠️ Platform data not detected, using fallback`
- No errors in browser console
- App boots and shows router-outlet

---

## Task 0.4 — i18n Setup (Dev A, 0.5 day)

### Create `src/app/intercept/custom-translate-loader.helper.ts`

```typescript
import { TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlatformHelper } from '@natec/mef-dev-platform-connector';

export class CustomLoader implements TranslateLoader {
    constructor(private httpClient: HttpClient) {}

    getTranslation(langCountry: string): Observable<any> {
        if (!langCountry) langCountry = 'en';
        return this.httpClient.get(
            PlatformHelper.getAssetUrl() + '/i18n/' + langCountry + '.json',
        );
    }
}
```

### Create translation files

**`src/assets/i18n/en.json`:**

```json
{
    "test": "test",
    "common": {
        "save": "Save",
        "cancel": "Cancel",
        "delete": "Delete",
        "edit": "Edit",
        "create": "Create",
        "close": "Close",
        "confirm": "Confirm",
        "search": "Search",
        "loading": "Loading...",
        "no_data": "No data",
        "actions": "Actions",
        "status": "Status",
        "name": "Name",
        "description": "Description",
        "created_at": "Created",
        "updated_at": "Updated",
        "yes": "Yes",
        "no": "No",
        "back": "Back",
        "next": "Next",
        "upload": "Upload",
        "download": "Download"
    },
    "nav": {
        "registry": "Model Registry",
        "chat": "Chat Playground",
        "collections": "Collections",
        "documents": "Documents",
        "search": "Semantic Search",
        "vector": "Vector DB"
    },
    "registry": {
        "title": "LLM Model Registry",
        "model_name": "Model Name",
        "display_name": "Display Name",
        "device": "Device",
        "access_mode": "Access Mode",
        "url": "URL",
        "api_key": "API Key",
        "version": "Version",
        "capabilities": "Capabilities",
        "config": "Config",
        "headers": "Headers",
        "validate": "Validate",
        "upload_model": "Upload Model",
        "create_model": "Register New Model",
        "edit_model": "Edit Model",
        "delete_confirm": "Are you sure you want to delete this model?",
        "validation_success": "Model validated successfully",
        "validation_failed": "Model validation failed"
    },
    "chat": {
        "title": "Chat Playground",
        "send": "Send",
        "type_message": "Type your message...",
        "system_prompt": "System Prompt",
        "clear_history": "Clear History",
        "select_model": "Select Model",
        "parameters": "Parameters",
        "temperature": "Temperature",
        "max_tokens": "Max Tokens",
        "streaming": "Streaming"
    }
}
```

**`src/assets/i18n/uk.json`:**

```json
{
    "test": "test",
    "common": {
        "save": "Зберегти",
        "cancel": "Скасувати",
        "delete": "Видалити",
        "edit": "Редагувати",
        "create": "Створити",
        "close": "Закрити",
        "confirm": "Підтвердити",
        "search": "Пошук",
        "loading": "Завантаження...",
        "no_data": "Немає даних",
        "actions": "Дії",
        "status": "Статус",
        "name": "Назва",
        "description": "Опис",
        "created_at": "Створено",
        "updated_at": "Оновлено",
        "yes": "Так",
        "no": "Ні",
        "back": "Назад",
        "next": "Далі",
        "upload": "Завантажити",
        "download": "Скачати"
    },
    "nav": {
        "registry": "Реєстр Моделей",
        "chat": "Чат",
        "collections": "Колекції",
        "documents": "Документи",
        "search": "Семантичний Пошук",
        "vector": "Векторна БД"
    },
    "registry": {
        "title": "Реєстр LLM Моделей",
        "model_name": "Назва моделі",
        "display_name": "Відображувана назва",
        "device": "Пристрій",
        "access_mode": "Режим доступу",
        "url": "URL",
        "api_key": "API Ключ",
        "version": "Версія",
        "capabilities": "Можливості",
        "config": "Конфігурація",
        "headers": "Заголовки",
        "validate": "Валідувати",
        "upload_model": "Завантажити модель",
        "create_model": "Зареєструвати модель",
        "edit_model": "Редагувати модель",
        "delete_confirm": "Ви впевнені, що хочете видалити цю модель?",
        "validation_success": "Модель успішно валідована",
        "validation_failed": "Валідація моделі не пройшла"
    },
    "chat": {
        "title": "Чат",
        "send": "Надіслати",
        "type_message": "Введіть повідомлення...",
        "system_prompt": "Системний промпт",
        "clear_history": "Очистити історію",
        "select_model": "Обрати модель",
        "parameters": "Параметри",
        "temperature": "Температура",
        "max_tokens": "Макс. токенів",
        "streaming": "Потокова передача"
    }
}
```

### Verification
- App shows English labels by default
- Switching `localStorage.setItem('language', 'uk')` + reload → Ukrainian labels

---

## Task 0.5 — TypeScript Models from API (Dev B, 1 day)

### Create `src/app/models/enums.ts`

```typescript
export enum DeviceEnum {
    CPU = 1,
    CUDA = 2,
}

export enum LlmStatusEnum {
    DRAFT = 0,
    VALIDATED = 1,
    DISABLED = 2,
}

export enum AccessModeEnum {
    Direct = 1,
    InternalService = 2,
    ExternalService = 3,
}

export enum VectorDbProviderEnum {
    Pgvector = 1,
}
```

### Create `src/app/models/llm-registry.models.ts`

```typescript
import { AccessModeEnum, DeviceEnum, LlmStatusEnum } from './enums';

export interface LLMRegistryLocator {
    '@type'?: string;
    model_id: string;
    model_name: string;
    display_name?: string;
    access_mode?: AccessModeEnum;
    is_required?: boolean;
    url?: string;
    api_key?: string;
    device?: DeviceEnum;
    headers?: Record<string, string>;
    version?: string;
    status?: LlmStatusEnum;
    capabilities?: Record<string, any>;
    config?: Record<string, any>;
    tenantId?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface LlmCreateRequest {
    model_name: string;
    display_name?: string;
    device?: DeviceEnum;
    access_mode?: AccessModeEnum;
    is_required?: boolean;
    url?: string;
    api_key?: string;
    headers?: Record<string, string>;
    version?: string;
    capabilities?: Record<string, any>;
    config?: Record<string, any>;
}

export interface LlmUpdateRequest {
    model_name?: string;
    display_name?: string;
    device?: DeviceEnum;
    access_mode?: AccessModeEnum;
    is_required?: boolean;
    url?: string;
    api_key?: string;
    headers?: Record<string, string>;
    version?: string;
    status?: LlmStatusEnum;
    capabilities?: Record<string, any>;
    config?: Record<string, any>;
}
```

### Create `src/app/models/chat.models.ts`

```typescript
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatCompletionsRequest {
    model?: string;
    messages: ChatMessage[];
    stream?: boolean;
    tag?: string;
    stream_interval?: number;
    diversity_penalty?: number;
    do_sample?: boolean;
    early_stopping?: boolean;
    length_penalty?: number;
    max_tokens?: number;
    min_length?: number;
    no_repeat_ngram_size?: number;
    num_beams?: number;
    num_return_sequences?: number;
    past_present_share_buffer?: boolean;
    repetition_penalty?: number;
    temperature?: number;
    top_k?: number;
    top_p?: number;
}
```

### Create `src/app/models/collection.models.ts`

```typescript
import { VectorDbProviderEnum } from './enums';

export interface HnswParameters {
    m?: number;
    ef_construction?: number;
    ef_search?: number;
    metric?: string;
}

export interface VectorSearchAlgorithm {
    name: string;
    kind: string;
    hnsw_parameters?: HnswParameters;
}

export interface VectorSearchProfile {
    name: string;
    algorithm: string;
}

export interface VectorCreateSearchDto {
    algorithms?: VectorSearchAlgorithm[];
    profiles?: VectorSearchProfile[];
}

export interface CollectionCreateRequest {
    name: string;
    description?: string;
    model: string;
    chunk_length?: number;
    chunk_overlap?: number;
    provider?: VectorDbProviderEnum;
    vector_search?: VectorCreateSearchDto;
}

export interface CollectionUpdateRequest {
    description?: string;
    chunk_length?: number;
    chunk_overlap?: number;
}

export interface CollectionResponse {
    name: string;
    description?: string;
    model: string;
    chunk_length: number;
    chunk_overlap: number;
    provider: string;
    created_at: string;
}

export interface CollectionDetailResponse extends CollectionResponse {
    documents_count: number;
    chunks_count: number;
    vector_search?: VectorCreateSearchDto;
}

export interface CollectionListResponse {
    items: CollectionResponse[];
    total_count: number;
    page: number;
    page_size: number;
}
```

### Create `src/app/models/document.models.ts`

```typescript
export interface DocumentCreateRequest {
    title: string;
    content: string;
    source?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    chunk_length?: number;
    chunk_overlap?: number;
}

export interface DocumentBatchCreateRequest {
    documents: DocumentCreateRequest[];
    chunk_length?: number;
    chunk_overlap?: number;
}

export interface DocumentUpdateRequest {
    title?: string;
    content?: string;
    source?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    chunk_length?: number;
    chunk_overlap?: number;
}

export interface DocumentCreateResponse {
    document_id: string;
    title: string;
    chunks_count: number;
    source?: string;
    created_at: string;
}

export interface DocumentListItem {
    document_id: string;
    title: string;
    source?: string;
    tags?: string[];
    chunks_count: number;
    created_at: string;
}

export interface DocumentListResponse {
    items: DocumentListItem[];
    total_count: number;
    page: number;
    page_size: number;
}

export interface ChunkResponse {
    id: number;
    document_id: string;
    chunk_index: number;
    content: string;
    metadata?: Record<string, any>;
}

export interface DocumentDetailResponse {
    document_id: string;
    title: string;
    content: string;
    chunks: ChunkResponse[];
    source?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    chunks_count: number;
    created_at: string;
}

export interface ChunkCreateRequest {
    content: string;
    chunk_index?: number;
    metadata?: Record<string, any>;
}

export interface ChunkUpdateRequest {
    content?: string;
    metadata?: Record<string, any>;
}

export interface ChunkListResponse {
    items: ChunkResponse[];
    total_count: number;
    document_id: string;
}

export interface DocumentBatchCreateResponse {
    total_documents: number;
    success_count: number;
    failed_count: number;
    results: {
        title: string;
        document_id?: string;
        chunks_count?: number;
        success: boolean;
        error?: string;
    }[];
}
```

### Create `src/app/models/search.models.ts`

```typescript
export interface DocumentSearchRequest {
    query: string;
    top_k?: number;
    metric?: string;
    score_mode?: string;
    tags?: string[];
    min_score?: number;
    include_content?: boolean;
    include_metadata?: boolean;
    select?: string;
    search_fields?: string;
    decorators?: Record<string, any>;
}

export interface SearchResult {
    document_id: string;
    title: string;
    chunk_id: number;
    chunk_index: number;
    content: string;
    score: number;
    metadata?: Record<string, any>;
}

export interface DocumentSearchResponse {
    results: SearchResult[];
    total_results: number;
    query: string;
}
```

### Create `src/app/models/vector.models.ts`

```typescript
import { VectorDbProviderEnum } from './enums';

export interface VectorGetTableRequest {
    provider: VectorDbProviderEnum;
}

export interface VectorGetRequest {
    provider: VectorDbProviderEnum;
    select: string;
    embedding: string;
}

export interface VectorDatabaseRequest {
    provider: VectorDbProviderEnum;
    database_name: string;
    description: string;
}

export interface VectorExecuteRequest {
    provider: VectorDbProviderEnum;
    database_name: string;
    query: string;
}

export interface FieldViewModel {
    name: string;
    type: string;
    key?: boolean;
    dimensions?: number;
    auto_increment?: boolean;
    vector_search_profile?: string;
}

export interface VectorCreateRequest {
    provider: VectorDbProviderEnum;
    name: string;
    fields: FieldViewModel[];
    vector_search?: {
        algorithms: { name: string; kind: string; hnsw_parameters?: any }[];
        profiles: { name: string; algorithm: string }[];
    };
}

export interface VectorUploadDocumentRequest {
    provider: VectorDbProviderEnum;
    model: string;
    value: Record<string, any>[];
    chunk_length?: number;
}

export interface VectorQueryViewModel {
    vector: number[];
    fields: string;
    k?: number;
    metric?: string;
    decorators?: Record<string, any>;
}

export interface VectorSearchRequest {
    provider: VectorDbProviderEnum;
    model?: string;
    search: string;
    select: string;
    search_fields: string;
    embedding: string;
    vector_queries?: VectorQueryViewModel[];
}

export interface VectorDeleteRequest {
    provider: VectorDbProviderEnum;
    delete_field: string;
    value: any;
}
```

### Create `src/app/models/common.models.ts`

```typescript
export interface ErrorResponse {
    status: number;
    code: number;
    message: string;
    type: string;
}

export interface ActionResultResponse {
    result: boolean;
}

export interface EmbeddingsRequest {
    model?: string;
    input: string | string[];
    chunk_length?: number;
}
```

### Create barrel export `src/app/models/index.ts`

```typescript
export * from './enums';
export * from './common.models';
export * from './llm-registry.models';
export * from './chat.models';
export * from './collection.models';
export * from './document.models';
export * from './search.models';
export * from './vector.models';
```

### Verification
- Project compiles with no TypeScript errors
- All interfaces match the Swagger / API documentation

---

## Task 0.6 — Endpoint Service + API Service Stubs (Dev A, 1 day)

### Create `src/app/services/endpoint.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { PlatformHelper } from '@natec/mef-dev-platform-connector';

@Injectable({ providedIn: 'root' })
export class EndpointService {
    private get pluginData() {
        return PlatformHelper.PluginDataSync;
    }

    get baseUrl(): string {
        return `${this.pluginData.apiUrl}/api/v2/${this.pluginData.alias}`;
    }

    get llmUrl(): string {
        return `${this.baseUrl}/llm`;
    }

    get chatUrl(): string {
        return `${this.baseUrl}/chat`;
    }

    get documentUrl(): string {
        return `${this.baseUrl}/document`;
    }

    get vectorUrl(): string {
        return `${this.baseUrl}/vector`;
    }

    get embeddingsUrl(): string {
        return `${this.baseUrl}/embeddings`;
    }

    get migrationUrl(): string {
        return `${this.baseUrl}/llm-db`;
    }
}
```

### Create API service stubs

Each module will have its own service inside its module folder (filled in during later phases).
For now, only create the shared endpoint service above.

### Verification
- Inject `EndpointService` into `AppComponent` temporarily, log `endpointService.baseUrl` — should output the correct URL

---

## Task 0.7 — Routing + Not Found (Dev B, 0.5 day)

### Create `src/app/not-found.component.ts`

```typescript
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    template: `
        <div class="position-relative title-container body-1 d-flex flex-column">
            <div class="body-1">Page not found</div>
            <button class="btn btn-success mt-2" (click)="goToHome()">Back to home</button>
        </div>
    `,
    styles: [
        `
            .title-container {
                top: 50%;
                text-align: center;
                transform: translateY(-50%);
                & > * {
                    align-self: center;
                }
            }
        `,
    ],
    standalone: false,
})
export class NotFoundComponent {
    constructor(private router: Router) {}

    goToHome() {
        this.router.navigate(['']);
    }
}
```

Add `NotFoundComponent` to `AppModule` declarations.

### Create `src/app/app-routing.module.ts`

```typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './not-found.component';

const routes: Routes = [
    {
        path: '',
        children: [
            {
                path: '',
                redirectTo: 'registry',
                pathMatch: 'full',
            },
            {
                path: 'registry',
                loadChildren: () =>
                    import('./modules/llm-registry/llm-registry.module').then(
                        (m) => m.LlmRegistryModule,
                    ),
            },
            {
                path: 'chat',
                loadChildren: () =>
                    import('./modules/chat/chat.module').then(
                        (m) => m.ChatModule,
                    ),
            },
            {
                path: 'collections',
                loadChildren: () =>
                    import('./modules/collections/collections.module').then(
                        (m) => m.CollectionsModule,
                    ),
            },
            {
                path: 'documents',
                loadChildren: () =>
                    import('./modules/documents/documents.module').then(
                        (m) => m.DocumentsModule,
                    ),
            },
            {
                path: 'search',
                loadChildren: () =>
                    import('./modules/search/search.module').then(
                        (m) => m.SearchModule,
                    ),
            },
            {
                path: 'vector',
                loadChildren: () =>
                    import('./modules/vector/vector.module').then(
                        (m) => m.VectorModule,
                    ),
            },
            {
                path: 'not-found',
                component: NotFoundComponent,
            },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
```

### Create stub modules for lazy loading

For each module, create a minimal placeholder so the build does not fail:

**`src/app/modules/llm-registry/llm-registry.module.ts`:**

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LlmRegistryContainerComponent } from './components/llm-registry-container.component';

const routes: Routes = [
    { path: '', component: LlmRegistryContainerComponent },
];

@NgModule({
    declarations: [LlmRegistryContainerComponent],
    imports: [CommonModule, RouterModule.forChild(routes)],
})
export class LlmRegistryModule {}
```

**`src/app/modules/llm-registry/components/llm-registry-container.component.ts`:**

```typescript
import { Component } from '@angular/core';

@Component({
    selector: 'app-llm-registry-container',
    template: `<h2>LLM Registry — Coming Soon</h2>`,
    standalone: false,
})
export class LlmRegistryContainerComponent {}
```

Repeat the same pattern for: `chat`, `collections`, `documents`, `search`, `vector`.

### Create `src/styles.scss`

```scss
@use 'node_modules/@natec/mef-dev-ui-kit/src/lib/styles/vars.scss' as c;
@import 'node_modules/@natec/mef-dev-ui-kit/src/lib/styles/global.scss';

html,
body {
    margin: 0;
    height: 100%;
    overflow: hidden;
}

ai-llm-ui {
    @import 'node_modules/bootstrap/scss/bootstrap.scss';
    @import 'node_modules/@natec/mef-dev-ui-kit/src/lib/styles/core.scss';

    height: 100% !important;
    min-height: 400px;
    display: block;
    overflow: hidden;

    .ngx-datatable .datatable-header {
        overflow: hidden !important;
    }
}
```

### Create `tsconfig.json`

```json
{
    "compileOnSave": false,
    "compilerOptions": {
        "strictNullChecks": false,
        "resolveJsonModule": true,
        "esModuleInterop": true,
        "allowJs": true,
        "noImplicitAny": false,
        "useDefineForClassFields": false,
        "useUnknownInCatchVariables": false,
        "strictPropertyInitialization": false,
        "baseUrl": "./",
        "outDir": "./dist/out-tsc",
        "forceConsistentCasingInFileNames": true,
        "strict": true,
        "noImplicitOverride": true,
        "noPropertyAccessFromIndexSignature": true,
        "noImplicitReturns": true,
        "skipLibCheck": true,
        "paths": {
            "@app-module/*": ["src/app/*"],
            "@llm-module/*": ["src/app/modules/llm-registry/*"],
            "@chat-module/*": ["src/app/modules/chat/*"]
        },
        "noFallthroughCasesInSwitch": true,
        "sourceMap": true,
        "declaration": false,
        "experimentalDecorators": true,
        "moduleResolution": "bundler",
        "importHelpers": true,
        "target": "ES2022",
        "module": "esnext",
        "lib": ["ES2022", "dom"]
    },
    "angularCompilerOptions": {
        "enableI18nLegacyMessageIdFormat": false,
        "strictInjectionParameters": true,
        "strictInputAccessModifiers": true,
        "strictTemplates": true
    }
}
```

### Create `tsconfig.app.json`

```json
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "outDir": "./out-tsc/app",
        "types": []
    },
    "files": ["src/main.ts", "src/polyfills.ts"],
    "include": ["src/**/*.d.ts"]
}
```

### Verification
- `ng serve` — app boots, navigates to `/registry` by default
- Each route shows placeholder text ("Coming Soon")
- `/not-found` shows the 404 component
- `ng build --output-hashing none --single-bundle` — builds successfully

---

## Phase 0 Checklist

| # | Task | Status |
|---|------|--------|
| 0.1 | Angular 20 project initialized, main.ts, index.html, boot-controller | ☐ |
| 0.2 | All dependencies installed, angular.json configured with ngx-build-plus | ☐ |
| 0.3 | Platform connector: APP_INITIALIZER, MefDevAuthInterceptor, environments, CustomOverlayContainer | ☐ |
| 0.4 | i18n: CustomLoader, en.json, uk.json | ☐ |
| 0.5 | All TypeScript models/interfaces from Swagger | ☐ |
| 0.6 | EndpointService with dynamic URL construction | ☐ |
| 0.7 | AppRoutingModule with lazy loading, stub modules for all 6 features, styles.scss, tsconfig | ☐ |
| **BUILD** | `ng build --output-hashing none --single-bundle` passes | ☐ |
| **SERVE** | `ng serve` boots, shows "LLM Registry — Coming Soon" | ☐ |

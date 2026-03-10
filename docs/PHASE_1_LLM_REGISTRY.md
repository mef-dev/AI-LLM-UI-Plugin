# Phase 1 — LLM Registry Module

> **Duration:** Week 2 (Days 6–10)
> **Team:** Dev A (UI components), Dev B (API service, upload, validation)
> **Goal:** Full CRUD for LLM model management with filtering, validation, and file upload.
> **Prerequisite:** Phase 0 completed — project scaffolded, models ready, endpoint service working.

---

## Backend API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/llm` | List models (`?status=0&modelName=llama`) |
| `GET` | `/llm/{id}` | Get model by ID |
| `POST` | `/llm` | Register new model |
| `PUT` | `/llm/{id}` | Update model |
| `DELETE` | `/llm/{id}` | Delete model |
| `POST` | `/llm/{id}/validate` | Validate model reachability |
| `POST` | `/llm/{id}/upload` | Upload ZIP archive (FormData) |

Full details: `docs/API_DOCUMENTATION.md` → Section 3.

---

## Task 1.1 — LlmRegistryApiService (Dev B, 1.5 days)

Create `src/app/modules/llm-registry/services/llm-registry-api.service.ts`.

Injectable service (`providedIn: 'root'`) that wraps all 7 endpoints. Inject `HttpClient` and `EndpointService`.

### Methods to implement

| Method | HTTP | URL | Notes |
|--------|------|-----|-------|
| `getModels(status?, modelName?)` | GET | `llmUrl` | Use `HttpParams` for optional query params |
| `getModelById(id)` | GET | `llmUrl/{id}` | |
| `createModel(request)` | POST | `llmUrl` | Body: `LlmCreateRequest` |
| `updateModel(id, request)` | PUT | `llmUrl/{id}` | Body: `LlmUpdateRequest` |
| `deleteModel(id)` | DELETE | `llmUrl/{id}` | |
| `validateModel(id)` | POST | `llmUrl/{id}/validate` | Empty body `{}` |
| `uploadModel(id, file, device?, version?)` | POST | `llmUrl/{id}/upload` | Use `FormData` |

### Upload hint

```typescript
const formData = new FormData();
formData.append('file', file, file.name);
if (device !== undefined) formData.append('device', device.toString());
if (version) formData.append('version', version);
return this.http.post(`${url}/${id}/upload`, formData);
```

### Verification

Inject service into the container component, call `getModels()` in `ngOnInit()`, log the result. Should return an array (possibly empty) from the backend.

---

## Task 1.2 — Registry List Page (Dev A, 2 days)

### Module setup

Update `LlmRegistryModule` to import everything you need:
- `FormsModule`, `ReactiveFormsModule`
- `TranslateModule`
- `NgxDatatableModule`
- UI Kit modules as needed (`MDCardModule`, `MDSelectModule`, `MefDevFilteredFieldModule`, etc.)

### Container component

`LlmRegistryContainerComponent` orchestrates the page:
- Title + "Register New Model" button
- `<app-llm-registry-list>` — the table
- Conditional rendering of Create/Edit modal and Upload modal
- Communication via `@Output()` events from list → container → modals

### List component

`LlmRegistryListComponent` — the main data table.

**Key features:**
- Use `@swimlane/ngx-datatable` for the table (same as bpmn-designer)
- Columns: Model Name (+ display_name subtitle), Status (badge), Device, Access Mode, URL, Version, Actions
- Status badges: DRAFT = yellow/warning, VALIDATED = green/success, DISABLED = red/danger
- Filters above the table: status dropdown + name text input
- Action buttons per row: Edit, Validate, Upload, Delete
- Call `loadModels()` on init and after any filter change

**Actions:**
- Edit → emit event to container → open modal
- Validate → call `llmApi.validateModel(id)` → show toastr result → reload list
- Upload → emit event to container → open upload modal
- Delete → `confirm()` dialog → call `llmApi.deleteModel(id)` → toastr → reload

**Empty state:** When no models — show a centered message with icon.

**Loading:** Use `NgxSpinnerService` — show before API call, hide in `finalize()`.

---

## Task 1.3 — Create / Edit Model Form (Dev A, 1.5 days)

`LlmRegistryFormComponent` — a modal dialog with a reactive form.

### Inputs / Outputs

```typescript
@Input() model: LLMRegistryLocator | null = null;  // null = create, object = edit
@Output() saved = new EventEmitter<void>();
@Output() closed = new EventEmitter<void>();
```

### Form fields

| Field | Control Type | Validation | Notes |
|-------|-------------|------------|-------|
| `model_name` | text input | **required** | e.g. `meta-llama/Llama-3.1-8B-Instruct` |
| `display_name` | text input | optional | Friendly name |
| `device` | select | — | Options: CPU, CUDA |
| `access_mode` | select | — | Options: Direct, Internal, External |
| `url` | text input | optional | Model endpoint URL |
| `api_key` | password input | optional | |
| `version` | text input | optional | |
| `is_required` | checkbox | — | |
| `status` | select | — | **Edit mode only**. Options: DRAFT, VALIDATED, DISABLED |
| `headers` | textarea (JSON) | valid JSON | `Record<string, string>` |
| `capabilities` | textarea (JSON) | valid JSON | `Record<string, any>` |
| `config` | textarea (JSON) | valid JSON | `Record<string, any>` |

### Behavior

- **Create mode:** `model` is null → empty form → on submit call `createModel()`
- **Edit mode:** `model` is provided → patch form with values → on submit call `updateModel()`
- JSON fields (`headers`, `capabilities`, `config`): keep as separate string variables, parse with `JSON.parse()` on submit. Show toastr if invalid JSON.
- On success → emit `saved`, container closes modal and refreshes list
- On error → show toastr with error message from server

### Modal pattern

Use Bootstrap modal markup (`modal-backdrop` + `modal d-block`) or `MDModalModule` from UI Kit — your choice. The bpmn-designer uses both approaches.

---

## Task 1.4 — Edit Model + Status Change (Dev B, 1 day)

The edit flow reuses the form component from Task 1.3. Dev B's responsibility:

- Verify that clicking Edit on a list row opens the form pre-filled with model data
- Verify status dropdown appears only in edit mode
- Test all status transitions (DRAFT→VALIDATED, VALIDATED→DISABLED, etc.)
- Verify the list refreshes after save

---

## Task 1.5 — Validate, Delete, Upload ZIP (Dev B, 1 day)

### Validate & Delete

Already wired in the list component (Task 1.2). Verify they work end-to-end.

### Upload component

`LlmRegistryUploadComponent` — a modal dialog for uploading a ZIP archive.

**Inputs / Outputs:**

```typescript
@Input() model!: LLMRegistryLocator;   // which model to upload to
@Output() uploaded = new EventEmitter<void>();
@Output() closed = new EventEmitter<void>();
```

**UI:**
- Title showing model name
- File input (`accept=".zip"`) — show file name and size after selection
- Device select (CPU / CUDA)
- Version text input
- Upload button (disabled until file selected)

**On upload:** Call `llmApi.uploadModel(id, file, device, version)`. Show spinner during upload, toastr on result.

---

## Task 1.6 — Error Handling & UX Polish (Dev A, 0.5 day)

### Checklist

- [ ] All API errors → `toastr.error()` with server message (`err?.error?.message`)
- [ ] Spinner during all API calls (`show()` before, `hide()` in `finalize()`)
- [ ] Empty state when no models
- [ ] Form validation: required fields highlighted when touched
- [ ] JSON fields: parse error shown via toastr
- [ ] Confirm before delete
- [ ] List auto-refreshes after any CRUD operation

---

## File Structure After Phase 1

```
src/app/modules/llm-registry/
├── llm-registry.module.ts
├── components/
│   ├── llm-registry-container.component.ts
│   ├── llm-registry-list/
│   │   ├── llm-registry-list.component.ts
│   │   └── llm-registry-list.component.html
│   ├── llm-registry-form/
│   │   ├── llm-registry-form.component.ts
│   │   └── llm-registry-form.component.html
│   └── llm-registry-upload/
│       └── llm-registry-upload.component.ts
└── services/
    └── llm-registry-api.service.ts
```

---

## Phase 1 Checklist

| # | Task | Owner | Done |
|---|------|-------|------|
| 1.1 | `LlmRegistryApiService` — all 7 endpoints | Dev B | ☐ |
| 1.2 | Registry list page — table, filters, action buttons | Dev A | ☐ |
| 1.3 | Create / Edit model modal with reactive form | Dev A | ☐ |
| 1.4 | Edit flow + status change — verified | Dev B | ☐ |
| 1.5 | Validate, delete, upload ZIP | Dev B | ☐ |
| 1.6 | Error handling, empty states, polish | Dev A | ☐ |
| **E2E** | Full flow: create → list → edit → validate → upload → delete | Both | ☐ |

---

## Testing Scenarios

1. **Create:** Fill form → Save → model appears with DRAFT status
2. **Edit:** Change display_name → Save → list updated
3. **Status change:** Set VALIDATED → badge turns green
4. **Validate:** Click → success/error toast
5. **Upload ZIP:** Select file → Upload → success toast
6. **Delete:** Confirm → model removed
7. **Filter by status:** Select "VALIDATED" → only matching models shown
8. **Filter by name:** Type "llama" → filtered results
9. **Empty state:** No models → "No data" message
10. **Error handling:** Break API → any action → error toast

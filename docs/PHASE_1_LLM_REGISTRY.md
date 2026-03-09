# Phase 1 — LLM Registry Module

> **Duration:** Week 2 (Days 6–10)
> **Team:** Dev A (UI components), Dev B (API service, upload, validation)
> **Goal:** Full CRUD for LLM model management with filtering, validation, and file upload.
> **Prerequisite:** Phase 0 completed — project scaffolded, models ready, endpoint service working.

---

## Backend API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/llm` | List models (optional: `?status=DRAFT&modelName=llama`) |
| `GET` | `/llm/{id}` | Get model by ID |
| `POST` | `/llm` | Create new model |
| `PUT` | `/llm/{id}` | Update model |
| `DELETE` | `/llm/{id}` | Delete model |
| `POST` | `/llm/{id}/validate` | Validate model (check reachability) |
| `POST` | `/llm/{id}/upload` | Upload ZIP archive (FormData: file, device, version) |

**Base URL:** Constructed by `EndpointService.llmUrl` → `{apiUrl}/api/v2/{alias}/llm`

---

## Task 1.1 — LlmRegistryApiService (Dev B, 1.5 days)

### Create `src/app/modules/llm-registry/services/llm-registry-api.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EndpointService } from '@app-module/services/endpoint.service';
import {
    LLMRegistryLocator,
    LlmCreateRequest,
    LlmUpdateRequest,
    LlmStatusEnum,
} from '@app-module/models';

@Injectable({ providedIn: 'root' })
export class LlmRegistryApiService {
    constructor(
        private http: HttpClient,
        private endpoints: EndpointService,
    ) {}

    /**
     * GET /llm — List registered models.
     * @param status Optional filter by LlmStatusEnum
     * @param modelName Optional filter by model name (substring)
     */
    getModels(status?: LlmStatusEnum, modelName?: string): Observable<LLMRegistryLocator[]> {
        let params = new HttpParams();
        if (status !== undefined && status !== null) {
            params = params.set('status', status.toString());
        }
        if (modelName) {
            params = params.set('modelName', modelName);
        }
        return this.http.get<LLMRegistryLocator[]>(this.endpoints.llmUrl, { params });
    }

    /**
     * GET /llm/{id} — Get model details by ID.
     */
    getModelById(id: string): Observable<LLMRegistryLocator> {
        return this.http.get<LLMRegistryLocator>(`${this.endpoints.llmUrl}/${id}`);
    }

    /**
     * POST /llm — Register a new LLM model.
     */
    createModel(request: LlmCreateRequest): Observable<LLMRegistryLocator> {
        return this.http.post<LLMRegistryLocator>(this.endpoints.llmUrl, request);
    }

    /**
     * PUT /llm/{id} — Update an existing model.
     */
    updateModel(id: string, request: LlmUpdateRequest): Observable<LLMRegistryLocator> {
        return this.http.put<LLMRegistryLocator>(`${this.endpoints.llmUrl}/${id}`, request);
    }

    /**
     * DELETE /llm/{id} — Delete a model.
     */
    deleteModel(id: string): Observable<any> {
        return this.http.delete(`${this.endpoints.llmUrl}/${id}`);
    }

    /**
     * POST /llm/{id}/validate — Validate model (check if reachable).
     */
    validateModel(id: string): Observable<any> {
        return this.http.post(`${this.endpoints.llmUrl}/${id}/validate`, {});
    }

    /**
     * POST /llm/{id}/upload — Upload model ZIP archive.
     * @param id Model ID
     * @param file ZIP file
     * @param device Optional target device (cpu / cuda)
     * @param version Optional model version
     */
    uploadModel(id: string, file: File, device?: number, version?: string): Observable<any> {
        const formData = new FormData();
        formData.append('file', file, file.name);
        if (device !== undefined) {
            formData.append('device', device.toString());
        }
        if (version) {
            formData.append('version', version);
        }
        return this.http.post(`${this.endpoints.llmUrl}/${id}/upload`, formData);
    }
}
```

### Verification
- Inject service into `LlmRegistryContainerComponent`
- Call `getModels()` in `ngOnInit`, log result
- Should return array from backend (or error if no models registered yet)

---

## Task 1.2 — Registry List Page (Dev A, 2 days)

### Update `src/app/modules/llm-registry/llm-registry.module.ts`

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxSpinnerModule } from 'ngx-spinner';

// UI Kit imports
import {
    MDCardModule,
    MDModalModule,
    MDSelectModule,
    MDSwitchModule,
    MDCollapseModule,
    MefDevFilteredFieldModule,
    MefDevProgressModule,
} from '@natec/mef-dev-ui-kit';

import { LlmRegistryContainerComponent } from './components/llm-registry-container.component';
import { LlmRegistryListComponent } from './components/llm-registry-list/llm-registry-list.component';
import { LlmRegistryFormComponent } from './components/llm-registry-form/llm-registry-form.component';
import { LlmRegistryUploadComponent } from './components/llm-registry-upload/llm-registry-upload.component';

const routes: Routes = [
    { path: '', component: LlmRegistryContainerComponent },
];

@NgModule({
    declarations: [
        LlmRegistryContainerComponent,
        LlmRegistryListComponent,
        LlmRegistryFormComponent,
        LlmRegistryUploadComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule.forChild(routes),
        TranslateModule,
        NgxDatatableModule,
        NgxSpinnerModule,
        // UI Kit
        MDCardModule,
        MDModalModule,
        MDSelectModule,
        MDSwitchModule,
        MDCollapseModule,
        MefDevFilteredFieldModule,
        MefDevProgressModule,
    ],
})
export class LlmRegistryModule {}
```

### Update container component

**`src/app/modules/llm-registry/components/llm-registry-container.component.ts`:**

```typescript
import { Component } from '@angular/core';

@Component({
    selector: 'app-llm-registry-container',
    template: `
        <div class="registry-container p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2>{{ 'registry.title' | translate }}</h2>
                <button class="btn btn-primary" (click)="showCreateModal = true">
                    <i class="fa fa-plus me-1"></i>
                    {{ 'registry.create_model' | translate }}
                </button>
            </div>

            <app-llm-registry-list
                (editModel)="onEditModel($event)"
                (uploadModel)="onUploadModel($event)">
            </app-llm-registry-list>

            <!-- Create / Edit Modal -->
            <app-llm-registry-form
                *ngIf="showCreateModal || editingModel"
                [model]="editingModel"
                (saved)="onModelSaved()"
                (closed)="onFormClosed()">
            </app-llm-registry-form>

            <!-- Upload Modal -->
            <app-llm-registry-upload
                *ngIf="uploadingModel"
                [model]="uploadingModel"
                (uploaded)="onUploadComplete()"
                (closed)="uploadingModel = null">
            </app-llm-registry-upload>
        </div>
    `,
    standalone: false,
})
export class LlmRegistryContainerComponent {
    showCreateModal = false;
    editingModel: any = null;
    uploadingModel: any = null;

    onEditModel(model: any) {
        this.editingModel = model;
    }

    onUploadModel(model: any) {
        this.uploadingModel = model;
    }

    onModelSaved() {
        this.showCreateModal = false;
        this.editingModel = null;
        // List component will reload via a shared subject or @ViewChild
    }

    onFormClosed() {
        this.showCreateModal = false;
        this.editingModel = null;
    }

    onUploadComplete() {
        this.uploadingModel = null;
    }
}
```

### Create list component

**`src/app/modules/llm-registry/components/llm-registry-list/llm-registry-list.component.ts`:**

```typescript
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { LlmRegistryApiService } from '../../services/llm-registry-api.service';
import { LLMRegistryLocator, LlmStatusEnum } from '@app-module/models';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-llm-registry-list',
    templateUrl: './llm-registry-list.component.html',
    standalone: false,
})
export class LlmRegistryListComponent implements OnInit {
    @Output() editModel = new EventEmitter<LLMRegistryLocator>();
    @Output() uploadModel = new EventEmitter<LLMRegistryLocator>();

    models: LLMRegistryLocator[] = [];
    filteredModels: LLMRegistryLocator[] = [];

    // Filters
    statusFilter: LlmStatusEnum | null = null;
    nameFilter: string = '';

    // Enum reference for template
    LlmStatusEnum = LlmStatusEnum;

    statusOptions = [
        { value: null, label: 'All' },
        { value: LlmStatusEnum.DRAFT, label: 'DRAFT' },
        { value: LlmStatusEnum.VALIDATED, label: 'VALIDATED' },
        { value: LlmStatusEnum.DISABLED, label: 'DISABLED' },
    ];

    constructor(
        private llmApi: LlmRegistryApiService,
        private toastr: ToastrService,
        private translate: TranslateService,
        private spinner: NgxSpinnerService,
    ) {}

    ngOnInit(): void {
        this.loadModels();
    }

    loadModels(): void {
        this.spinner.show();
        this.llmApi
            .getModels(
                this.statusFilter ?? undefined,
                this.nameFilter || undefined,
            )
            .pipe(finalize(() => this.spinner.hide()))
            .subscribe({
                next: (data) => {
                    this.models = data;
                    this.applyFilters();
                },
                error: (err) => {
                    this.toastr.error(
                        err?.error?.message || 'Failed to load models',
                        'Error',
                    );
                },
            });
    }

    applyFilters(): void {
        this.filteredModels = this.models;
        // Client-side filtering is optional here since the API supports query params.
        // But useful for instant filtering without extra API calls.
    }

    onStatusFilterChange(status: any): void {
        this.statusFilter = status;
        this.loadModels();
    }

    onNameFilterChange(name: string): void {
        this.nameFilter = name;
        this.loadModels();
    }

    onEdit(model: LLMRegistryLocator): void {
        this.editModel.emit(model);
    }

    onUpload(model: LLMRegistryLocator): void {
        this.uploadModel.emit(model);
    }

    onValidate(model: LLMRegistryLocator): void {
        this.spinner.show();
        this.llmApi
            .validateModel(model.model_id)
            .pipe(finalize(() => this.spinner.hide()))
            .subscribe({
                next: () => {
                    this.toastr.success(
                        this.translate.instant('registry.validation_success'),
                    );
                    this.loadModels(); // Reload to get updated status
                },
                error: (err) => {
                    this.toastr.error(
                        err?.error?.message ||
                            this.translate.instant('registry.validation_failed'),
                        'Validation Error',
                    );
                },
            });
    }

    onDelete(model: LLMRegistryLocator): void {
        // Confirmation is handled in the template with a simple confirm()
        // In production, replace with MDModal confirmation dialog
        if (!confirm(this.translate.instant('registry.delete_confirm'))) {
            return;
        }

        this.spinner.show();
        this.llmApi
            .deleteModel(model.model_id)
            .pipe(finalize(() => this.spinner.hide()))
            .subscribe({
                next: () => {
                    this.toastr.success('Model deleted');
                    this.loadModels();
                },
                error: (err) => {
                    this.toastr.error(
                        err?.error?.message || 'Failed to delete model',
                        'Error',
                    );
                },
            });
    }

    getStatusBadgeClass(status?: LlmStatusEnum): string {
        switch (status) {
            case LlmStatusEnum.DRAFT:
                return 'badge bg-warning text-dark';
            case LlmStatusEnum.VALIDATED:
                return 'badge bg-success';
            case LlmStatusEnum.DISABLED:
                return 'badge bg-danger';
            default:
                return 'badge bg-secondary';
        }
    }

    getStatusLabel(status?: LlmStatusEnum): string {
        switch (status) {
            case LlmStatusEnum.DRAFT:
                return 'DRAFT';
            case LlmStatusEnum.VALIDATED:
                return 'VALIDATED';
            case LlmStatusEnum.DISABLED:
                return 'DISABLED';
            default:
                return 'UNKNOWN';
        }
    }
}
```

**`src/app/modules/llm-registry/components/llm-registry-list/llm-registry-list.component.html`:**

```html
<div class="mb-3 d-flex gap-3 align-items-end">
    <!-- Status Filter -->
    <div class="filter-group">
        <label class="form-label">{{ 'common.status' | translate }}</label>
        <select class="form-select form-select-sm"
                (change)="onStatusFilterChange($event.target.value === 'null' ? null : +$event.target.value)">
            <option *ngFor="let opt of statusOptions" [value]="opt.value">
                {{ opt.label }}
            </option>
        </select>
    </div>

    <!-- Name Filter -->
    <div class="filter-group">
        <label class="form-label">{{ 'registry.model_name' | translate }}</label>
        <input type="text"
               class="form-control form-control-sm"
               [placeholder]="'common.search' | translate"
               (input)="onNameFilterChange($event.target.value)" />
    </div>

    <!-- Refresh -->
    <button class="btn btn-outline-secondary btn-sm" (click)="loadModels()">
        <i class="fa fa-refresh"></i>
    </button>
</div>

<!-- Data Table -->
<ngx-datatable
    class="material"
    [rows]="filteredModels"
    [columns]="columns"
    [columnMode]="'force'"
    [headerHeight]="40"
    [rowHeight]="'auto'"
    [footerHeight]="40"
    [scrollbarH]="true">

    <!-- Model Name -->
    <ngx-datatable-column name="Model Name" prop="model_name" [width]="200">
        <ng-template let-row="row" ngx-datatable-cell-template>
            <strong>{{ row.model_name }}</strong>
            <div *ngIf="row.display_name" class="text-muted small">
                {{ row.display_name }}
            </div>
        </ng-template>
    </ngx-datatable-column>

    <!-- Status -->
    <ngx-datatable-column name="Status" prop="status" [width]="120">
        <ng-template let-row="row" ngx-datatable-cell-template>
            <span [class]="getStatusBadgeClass(row.status)">
                {{ getStatusLabel(row.status) }}
            </span>
        </ng-template>
    </ngx-datatable-column>

    <!-- Device -->
    <ngx-datatable-column name="Device" prop="device" [width]="80">
        <ng-template let-row="row" ngx-datatable-cell-template>
            {{ row.device === 1 ? 'CPU' : row.device === 2 ? 'CUDA' : '—' }}
        </ng-template>
    </ngx-datatable-column>

    <!-- Access Mode -->
    <ngx-datatable-column name="Access" prop="access_mode" [width]="130">
        <ng-template let-row="row" ngx-datatable-cell-template>
            {{ row.access_mode === 1 ? 'Direct' :
               row.access_mode === 2 ? 'Internal' :
               row.access_mode === 3 ? 'External' : '—' }}
        </ng-template>
    </ngx-datatable-column>

    <!-- URL -->
    <ngx-datatable-column name="URL" prop="url" [width]="250">
        <ng-template let-row="row" ngx-datatable-cell-template>
            <span class="text-truncate d-inline-block" style="max-width: 230px"
                  [title]="row.url">
                {{ row.url || '—' }}
            </span>
        </ng-template>
    </ngx-datatable-column>

    <!-- Version -->
    <ngx-datatable-column name="Version" prop="version" [width]="100">
        <ng-template let-row="row" ngx-datatable-cell-template>
            {{ row.version || '—' }}
        </ng-template>
    </ngx-datatable-column>

    <!-- Actions -->
    <ngx-datatable-column name="Actions" [width]="240" [sortable]="false">
        <ng-template let-row="row" ngx-datatable-cell-template>
            <div class="d-flex gap-1">
                <button class="btn btn-outline-primary btn-sm"
                        (click)="onEdit(row)"
                        [title]="'common.edit' | translate">
                    <i class="fa fa-pencil"></i>
                </button>
                <button class="btn btn-outline-success btn-sm"
                        (click)="onValidate(row)"
                        [title]="'registry.validate' | translate">
                    <i class="fa fa-check-circle"></i>
                </button>
                <button class="btn btn-outline-info btn-sm"
                        (click)="onUpload(row)"
                        [title]="'registry.upload_model' | translate">
                    <i class="fa fa-upload"></i>
                </button>
                <button class="btn btn-outline-danger btn-sm"
                        (click)="onDelete(row)"
                        [title]="'common.delete' | translate">
                    <i class="fa fa-trash"></i>
                </button>
            </div>
        </ng-template>
    </ngx-datatable-column>
</ngx-datatable>
```

### Verification
- Navigate to `/registry`
- Table loads and displays models from backend
- Status badges show correct colors
- Filter by status and name works
- Refresh button reloads data

---

## Task 1.3 — Create / Edit Model Form (Dev A, 1.5 days)

### Create form component

**`src/app/modules/llm-registry/components/llm-registry-form/llm-registry-form.component.ts`:**

```typescript
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LlmRegistryApiService } from '../../services/llm-registry-api.service';
import {
    LLMRegistryLocator,
    LlmCreateRequest,
    LlmUpdateRequest,
    DeviceEnum,
    AccessModeEnum,
    LlmStatusEnum,
} from '@app-module/models';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-llm-registry-form',
    templateUrl: './llm-registry-form.component.html',
    standalone: false,
})
export class LlmRegistryFormComponent implements OnInit {
    /** Pass existing model for edit mode, null for create mode */
    @Input() model: LLMRegistryLocator | null = null;
    @Output() saved = new EventEmitter<void>();
    @Output() closed = new EventEmitter<void>();

    form!: FormGroup;
    isEditMode = false;

    deviceOptions = [
        { value: DeviceEnum.CPU, label: 'CPU' },
        { value: DeviceEnum.CUDA, label: 'CUDA (GPU)' },
    ];

    accessModeOptions = [
        { value: AccessModeEnum.Direct, label: 'Direct' },
        { value: AccessModeEnum.InternalService, label: 'Internal Service' },
        { value: AccessModeEnum.ExternalService, label: 'External Service' },
    ];

    statusOptions = [
        { value: LlmStatusEnum.DRAFT, label: 'DRAFT' },
        { value: LlmStatusEnum.VALIDATED, label: 'VALIDATED' },
        { value: LlmStatusEnum.DISABLED, label: 'DISABLED' },
    ];

    // For JSON editor fields
    headersJson = '';
    capabilitiesJson = '';
    configJson = '';

    constructor(
        private fb: FormBuilder,
        private llmApi: LlmRegistryApiService,
        private toastr: ToastrService,
        private spinner: NgxSpinnerService,
    ) {}

    ngOnInit(): void {
        this.isEditMode = !!this.model;
        this.buildForm();

        if (this.model) {
            this.patchForm(this.model);
        }
    }

    private buildForm(): void {
        this.form = this.fb.group({
            model_name: ['', Validators.required],
            display_name: [''],
            device: [DeviceEnum.CPU],
            access_mode: [AccessModeEnum.Direct],
            is_required: [false],
            url: [''],
            api_key: [''],
            version: [''],
            status: [LlmStatusEnum.DRAFT],
        });
    }

    private patchForm(model: LLMRegistryLocator): void {
        this.form.patchValue({
            model_name: model.model_name,
            display_name: model.display_name || '',
            device: model.device || DeviceEnum.CPU,
            access_mode: model.access_mode || AccessModeEnum.Direct,
            is_required: model.is_required || false,
            url: model.url || '',
            api_key: model.api_key || '',
            version: model.version || '',
            status: model.status ?? LlmStatusEnum.DRAFT,
        });
        this.headersJson = model.headers ? JSON.stringify(model.headers, null, 2) : '';
        this.capabilitiesJson = model.capabilities ? JSON.stringify(model.capabilities, null, 2) : '';
        this.configJson = model.config ? JSON.stringify(model.config, null, 2) : '';
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const formValue = this.form.getRawValue();

        // Parse JSON fields
        let headers: Record<string, string> | undefined;
        let capabilities: Record<string, any> | undefined;
        let config: Record<string, any> | undefined;

        try {
            headers = this.headersJson ? JSON.parse(this.headersJson) : undefined;
        } catch {
            this.toastr.error('Invalid JSON in Headers field');
            return;
        }
        try {
            capabilities = this.capabilitiesJson ? JSON.parse(this.capabilitiesJson) : undefined;
        } catch {
            this.toastr.error('Invalid JSON in Capabilities field');
            return;
        }
        try {
            config = this.configJson ? JSON.parse(this.configJson) : undefined;
        } catch {
            this.toastr.error('Invalid JSON in Config field');
            return;
        }

        this.spinner.show();

        if (this.isEditMode && this.model) {
            const request: LlmUpdateRequest = {
                ...formValue,
                headers,
                capabilities,
                config,
            };
            this.llmApi
                .updateModel(this.model.model_id, request)
                .pipe(finalize(() => this.spinner.hide()))
                .subscribe({
                    next: () => {
                        this.toastr.success('Model updated');
                        this.saved.emit();
                    },
                    error: (err) =>
                        this.toastr.error(err?.error?.message || 'Update failed'),
                });
        } else {
            const request: LlmCreateRequest = {
                model_name: formValue.model_name,
                display_name: formValue.display_name || undefined,
                device: formValue.device,
                access_mode: formValue.access_mode,
                is_required: formValue.is_required,
                url: formValue.url || undefined,
                api_key: formValue.api_key || undefined,
                version: formValue.version || undefined,
                headers,
                capabilities,
                config,
            };
            this.llmApi
                .createModel(request)
                .pipe(finalize(() => this.spinner.hide()))
                .subscribe({
                    next: () => {
                        this.toastr.success('Model created');
                        this.saved.emit();
                    },
                    error: (err) =>
                        this.toastr.error(err?.error?.message || 'Create failed'),
                });
        }
    }

    onClose(): void {
        this.closed.emit();
    }
}
```

**`src/app/modules/llm-registry/components/llm-registry-form/llm-registry-form.component.html`:**

```html
<div class="modal-backdrop fade show" (click)="onClose()"></div>
<div class="modal d-block">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">
                    {{ (isEditMode ? 'registry.edit_model' : 'registry.create_model') | translate }}
                </h5>
                <button type="button" class="btn-close" (click)="onClose()"></button>
            </div>

            <div class="modal-body">
                <form [formGroup]="form" (ngSubmit)="onSubmit()">
                    <!-- Model Name -->
                    <div class="mb-3">
                        <label class="form-label">{{ 'registry.model_name' | translate }} *</label>
                        <input type="text" class="form-control" formControlName="model_name"
                               placeholder="meta-llama/Llama-3.1-8B-Instruct">
                        <div *ngIf="form.get('model_name')?.touched && form.get('model_name')?.invalid"
                             class="text-danger small mt-1">
                            Model name is required
                        </div>
                    </div>

                    <!-- Display Name -->
                    <div class="mb-3">
                        <label class="form-label">{{ 'registry.display_name' | translate }}</label>
                        <input type="text" class="form-control" formControlName="display_name"
                               placeholder="Llama 3.1 8B">
                    </div>

                    <div class="row">
                        <!-- Device -->
                        <div class="col-md-4 mb-3">
                            <label class="form-label">{{ 'registry.device' | translate }}</label>
                            <select class="form-select" formControlName="device">
                                <option *ngFor="let opt of deviceOptions" [ngValue]="opt.value">
                                    {{ opt.label }}
                                </option>
                            </select>
                        </div>

                        <!-- Access Mode -->
                        <div class="col-md-4 mb-3">
                            <label class="form-label">{{ 'registry.access_mode' | translate }}</label>
                            <select class="form-select" formControlName="access_mode">
                                <option *ngFor="let opt of accessModeOptions" [ngValue]="opt.value">
                                    {{ opt.label }}
                                </option>
                            </select>
                        </div>

                        <!-- Status (edit only) -->
                        <div class="col-md-4 mb-3" *ngIf="isEditMode">
                            <label class="form-label">{{ 'common.status' | translate }}</label>
                            <select class="form-select" formControlName="status">
                                <option *ngFor="let opt of statusOptions" [ngValue]="opt.value">
                                    {{ opt.label }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <!-- URL -->
                    <div class="mb-3">
                        <label class="form-label">{{ 'registry.url' | translate }}</label>
                        <input type="text" class="form-control" formControlName="url"
                               placeholder="https://api.example.com/v1">
                    </div>

                    <!-- API Key -->
                    <div class="mb-3">
                        <label class="form-label">{{ 'registry.api_key' | translate }}</label>
                        <input type="password" class="form-control" formControlName="api_key"
                               placeholder="sk-...">
                    </div>

                    <!-- Version -->
                    <div class="mb-3">
                        <label class="form-label">{{ 'registry.version' | translate }}</label>
                        <input type="text" class="form-control" formControlName="version"
                               placeholder="1.0.0">
                    </div>

                    <!-- Is Required -->
                    <div class="mb-3 form-check">
                        <input type="checkbox" class="form-check-input" formControlName="is_required"
                               id="isRequired">
                        <label class="form-check-label" for="isRequired">Is Required</label>
                    </div>

                    <!-- Headers (JSON) -->
                    <div class="mb-3">
                        <label class="form-label">{{ 'registry.headers' | translate }} (JSON)</label>
                        <textarea class="form-control font-monospace" rows="3"
                                  [(ngModel)]="headersJson" [ngModelOptions]="{standalone: true}"
                                  placeholder='{"Authorization": "Bearer ..."}'></textarea>
                    </div>

                    <!-- Capabilities (JSON) -->
                    <div class="mb-3">
                        <label class="form-label">{{ 'registry.capabilities' | translate }} (JSON)</label>
                        <textarea class="form-control font-monospace" rows="3"
                                  [(ngModel)]="capabilitiesJson" [ngModelOptions]="{standalone: true}"
                                  placeholder='{"chat": true, "embeddings": false}'></textarea>
                    </div>

                    <!-- Config (JSON) -->
                    <div class="mb-3">
                        <label class="form-label">{{ 'registry.config' | translate }} (JSON)</label>
                        <textarea class="form-control font-monospace" rows="3"
                                  [(ngModel)]="configJson" [ngModelOptions]="{standalone: true}"
                                  placeholder='{"max_context": 4096}'></textarea>
                    </div>
                </form>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" (click)="onClose()">
                    {{ 'common.cancel' | translate }}
                </button>
                <button class="btn btn-primary" (click)="onSubmit()" [disabled]="form.invalid">
                    {{ 'common.save' | translate }}
                </button>
            </div>
        </div>
    </div>
</div>
```

### Verification
- Click "Register New Model" → modal opens
- Fill in model_name (required), other fields optional
- Click Save → model appears in list
- Click Edit on existing model → form pre-filled → Save updates the model

---

## Task 1.4 — Edit Model + Status Change (Dev B, 1 day)

This is covered by Task 1.3 — the same form component handles both create and edit modes.

**Additional tasks for Dev B:**

- Verify that status change via the edit form's dropdown works correctly
- Test all status transitions: DRAFT → VALIDATED, VALIDATED → DISABLED, etc.
- Ensure the list refreshes after each save

---

## Task 1.5 — Validate, Delete, Upload ZIP (Dev B, 1 day)

### Validate and Delete
Already implemented in `LlmRegistryListComponent` (Task 1.2).

### Create upload component

**`src/app/modules/llm-registry/components/llm-registry-upload/llm-registry-upload.component.ts`:**

```typescript
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LlmRegistryApiService } from '../../services/llm-registry-api.service';
import { LLMRegistryLocator, DeviceEnum } from '@app-module/models';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-llm-registry-upload',
    template: `
        <div class="modal-backdrop fade show" (click)="onClose()"></div>
        <div class="modal d-block">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            {{ 'registry.upload_model' | translate }}: {{ model.model_name }}
                        </h5>
                        <button type="button" class="btn-close" (click)="onClose()"></button>
                    </div>
                    <div class="modal-body">
                        <!-- File input -->
                        <div class="mb-3">
                            <label class="form-label">ZIP Archive *</label>
                            <input type="file" class="form-control"
                                   accept=".zip"
                                   (change)="onFileSelected($event)" />
                            <div class="text-muted small mt-1" *ngIf="selectedFile">
                                {{ selectedFile.name }} ({{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB)
                            </div>
                        </div>

                        <!-- Device -->
                        <div class="mb-3">
                            <label class="form-label">Target Device</label>
                            <select class="form-select" [(ngModel)]="device">
                                <option [ngValue]="1">CPU</option>
                                <option [ngValue]="2">CUDA (GPU)</option>
                            </select>
                        </div>

                        <!-- Version -->
                        <div class="mb-3">
                            <label class="form-label">Version</label>
                            <input type="text" class="form-control"
                                   [(ngModel)]="version" placeholder="1.0.0" />
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" (click)="onClose()">
                            {{ 'common.cancel' | translate }}
                        </button>
                        <button class="btn btn-primary"
                                (click)="onUpload()"
                                [disabled]="!selectedFile">
                            <i class="fa fa-upload me-1"></i>
                            {{ 'common.upload' | translate }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    standalone: false,
})
export class LlmRegistryUploadComponent {
    @Input() model!: LLMRegistryLocator;
    @Output() uploaded = new EventEmitter<void>();
    @Output() closed = new EventEmitter<void>();

    selectedFile: File | null = null;
    device: DeviceEnum = DeviceEnum.CPU;
    version: string = '';

    constructor(
        private llmApi: LlmRegistryApiService,
        private toastr: ToastrService,
        private spinner: NgxSpinnerService,
    ) {}

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
        }
    }

    onUpload(): void {
        if (!this.selectedFile) return;

        this.spinner.show();
        this.llmApi
            .uploadModel(
                this.model.model_id,
                this.selectedFile,
                this.device,
                this.version || undefined,
            )
            .pipe(finalize(() => this.spinner.hide()))
            .subscribe({
                next: () => {
                    this.toastr.success('Model uploaded successfully');
                    this.uploaded.emit();
                },
                error: (err) => {
                    this.toastr.error(
                        err?.error?.message || 'Upload failed',
                        'Upload Error',
                    );
                },
            });
    }

    onClose(): void {
        this.closed.emit();
    }
}
```

### Verification
- Click Upload icon on a model → modal opens
- Select a .zip file → file name and size shown
- Click Upload → success toast → modal closes
- Validate button → success/error toast, model status may change

---

## Task 1.6 — Error Handling & UX Polish (Dev A, 0.5 day)

### Checklist

- [ ] All API errors display via `toastr.error()` with the server message
- [ ] Spinner shows during all API calls (already done via `NgxSpinnerService`)
- [ ] Empty state: when no models exist, show a message "No models registered yet"
- [ ] Loading state: spinner visible while fetching
- [ ] Form validation: required fields highlighted red when touched
- [ ] JSON fields: show parse error if invalid JSON entered
- [ ] Confirm before delete (native `confirm()` is fine for now)
- [ ] After any CRUD operation, list auto-refreshes

### Add empty state to list template

Add before the `<ngx-datatable>`:

```html
<div *ngIf="filteredModels.length === 0" class="text-center text-muted py-5">
    <i class="fa fa-database fa-3x mb-3 d-block"></i>
    {{ 'common.no_data' | translate }}
</div>
```

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
│       └── llm-registry-upload.component.ts  (inline template)
└── services/
    └── llm-registry-api.service.ts
```

---

## Phase 1 Checklist

| # | Task | Owner | Status |
|---|------|-------|--------|
| 1.1 | `LlmRegistryApiService` — all 7 endpoints implemented | Dev B | ☐ |
| 1.2 | Registry list page — table, filters, action buttons | Dev A | ☐ |
| 1.3 | Create model modal — form with validation | Dev A | ☐ |
| 1.4 | Edit model modal — reuse form, pre-fill, status change | Dev B | ☐ |
| 1.5 | Validate, delete, upload ZIP | Dev B | ☐ |
| 1.6 | Error handling, empty states, loading indicators | Dev A | ☐ |
| **E2E** | Create model → appears in list → edit → validate → upload → delete | Both | ☐ |

---

## Testing Scenarios

1. **Create model:** Fill form → Save → model appears in list with DRAFT status
2. **Edit model:** Click Edit → change display_name → Save → list updated
3. **Change status:** Edit → set VALIDATED → Save → badge turns green
4. **Validate:** Click Validate → success toast (or error if URL unreachable)
5. **Upload ZIP:** Click Upload → select file → Upload → success toast
6. **Delete:** Click Delete → confirm → model removed from list
7. **Filter by status:** Select "VALIDATED" → only validated models shown
8. **Filter by name:** Type "llama" → only matching models shown
9. **Empty state:** Delete all models → "No data" message shown
10. **Error handling:** Disconnect network → any action → error toast with message

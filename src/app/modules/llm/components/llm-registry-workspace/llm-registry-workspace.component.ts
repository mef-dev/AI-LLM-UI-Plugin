import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import {
  JsonRecord,
  LlmAccessMode,
  LlmCreateRequest,
  LlmDevice,
  LlmListFilters,
  LlmRegistryLocator,
  LlmStatus,
  LlmUpdateRequest,
} from '../../models/llm-registry.models';
import {
  LlmRegistryFormValue,
  LlmRegistryUploadValue,
} from '../../models/llm-registry-form.models';
import { LlmFakeApiService } from '../../services/llm-fake-api.service';

@Component({
  selector: 'app-llm-registry-workspace',
  standalone: false,
  templateUrl: './llm-registry-workspace.component.html',
  styleUrls: ['./llm-registry-workspace.component.scss']
})
export class LlmRegistryWorkspaceComponent implements OnInit {
  readonly statuses: LlmStatus[] = ['DRAFT', 'VALIDATED', 'DISABLED'];
  readonly devices: LlmDevice[] = ['cpu', 'cuda'];
  readonly accessModes: LlmAccessMode[] = ['direct', 'internal_service', 'external_service'];

  readonly filters: LlmListFilters = {
    status: '',
    modelName: '',
  };

  models: LlmRegistryLocator[] = [];
  selectedModel: LlmRegistryLocator | null = null;
  uploadModelTarget: LlmRegistryLocator | null = null;
  editingModelId: string | null = null;
  loading = false;
  errorMessage = '';
  saveMessage = '';
  uploadMessage = '';
  selectedUploadFile: File | null = null;

  form: LlmRegistryFormValue = this.createEmptyForm();
  uploadForm: LlmRegistryUploadValue = this.createEmptyUploadForm();

  constructor(private readonly llmApi: LlmFakeApiService) {}

  ngOnInit(): void {
    this.loadModels();
  }

  loadModels(): void {
    this.loading = true;
    this.errorMessage = '';

    this.llmApi
      .getModels(this.filters)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (models) => {
          this.models = models;

          if (!models.length) {
            this.selectedModel = null;
            return;
          }

          const selectedStillExists = this.selectedModel
            ? models.some((item) => item.model_id === this.selectedModel?.model_id)
            : false;

          const nextId = selectedStillExists ? this.selectedModel?.model_id : models[0].model_id;
          this.selectModel(nextId!);
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
        },
      });
  }

  selectModel(id: string): void {
    this.llmApi.getModelById(id).subscribe({
      next: (model) => {
        this.selectedModel = model;
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
      },
    });
  }

  resetFilters(): void {
    this.filters.status = '';
    this.filters.modelName = '';
    this.loadModels();
  }

  startCreate(): void {
    this.editingModelId = null;
    this.saveMessage = '';
    this.form = this.createEmptyForm();
  }

  startEdit(model: LlmRegistryLocator): void {
    this.editingModelId = model.model_id;
    this.saveMessage = '';
    this.form = {
      model_name: model.model_name,
      display_name: model.display_name ?? '',
      device: model.device ?? '',
      access_mode: model.access_mode,
      is_required: model.is_required,
      url: model.url ?? '',
      api_key: model.api_key ?? '',
      version: model.version ?? '',
      status: model.status,
      headersJson: this.stringifyJson(model.headers),
      capabilitiesJson: this.stringifyJson(model.capabilities),
      configJson: this.stringifyJson(model.config),
    };
  }

  resetEditor(): void {
    if (this.selectedModel) {
      this.startEdit(this.selectedModel);
      return;
    }

    this.startCreate();
  }

  startUpload(model: LlmRegistryLocator): void {
    this.uploadModelTarget = model;
    this.uploadMessage = '';
    this.selectedUploadFile = null;
    this.uploadForm = {
      device: model.device ?? '',
      version: model.version ?? '',
    };
  }

  setUploadFile(file: File | null): void {
    this.selectedUploadFile = file;
  }

  resetUpload(): void {
    if (this.selectedModel) {
      this.startUpload(this.selectedModel);
      return;
    }

    this.uploadModelTarget = null;
    this.uploadMessage = '';
    this.selectedUploadFile = null;
    this.uploadForm = this.createEmptyUploadForm();
  }

  submitUpload(): void {
    this.errorMessage = '';
    this.uploadMessage = '';

    if (!this.uploadModelTarget) {
      this.errorMessage = 'Select a model before uploading.';
      return;
    }

    if (!this.selectedUploadFile) {
      this.errorMessage = 'Select a ZIP file first.';
      return;
    }

    this.llmApi
      .uploadModel(
        this.uploadModelTarget.model_id,
        this.selectedUploadFile.name,
        this.normalizeEnum(this.uploadForm.device),
        this.normalizeText(this.uploadForm.version)
      )
      .subscribe({
        next: (uploaded) => {
          this.selectedModel = uploaded;
          this.uploadModelTarget = uploaded;
          this.uploadMessage = `${uploaded.display_name || uploaded.model_name} received mocked archive ${this.selectedUploadFile?.name}.`;
          this.startEdit(uploaded);
          this.loadModels();
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
        },
      });
  }

  validateSelected(model: LlmRegistryLocator): void {
    this.llmApi.validateModel(model.model_id).subscribe({
      next: (validated) => {
        this.selectedModel = validated;
        this.saveMessage = `${validated.display_name || validated.model_name} was validated by the fake service.`;
        this.loadModels();
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
      },
    });
  }

  deleteSelected(model: LlmRegistryLocator): void {
    const confirmed = confirm(`Delete mocked model ${model.display_name || model.model_name}?`);
    if (!confirmed) {
      return;
    }

    this.llmApi.deleteModel(model.model_id).subscribe({
      next: () => {
        this.saveMessage = `${model.display_name || model.model_name} was removed from the fake registry.`;
        this.selectedModel = null;
        if (this.editingModelId === model.model_id) {
          this.startCreate();
        }
        this.loadModels();
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
      },
    });
  }

  submitForm(): void {
    this.errorMessage = '';
    this.saveMessage = '';

    if (!this.form.model_name.trim()) {
      this.errorMessage = 'Model name is required.';
      return;
    }

    const parsedFields = this.parseJsonFields();
    if (!parsedFields) {
      return;
    }

    const basePayload: LlmCreateRequest = {
      model_name: this.form.model_name.trim(),
      display_name: this.normalizeText(this.form.display_name),
      device: this.normalizeEnum(this.form.device),
      access_mode: this.form.access_mode,
      is_required: this.form.is_required,
      url: this.normalizeText(this.form.url),
      api_key: this.normalizeText(this.form.api_key),
      version: this.normalizeText(this.form.version),
      headers: parsedFields.headers,
      capabilities: parsedFields.capabilities,
      config: parsedFields.config,
    };

    if (!this.editingModelId) {
      this.llmApi.createModel(basePayload).subscribe({
        next: (created) => {
          this.saveMessage = `${created.display_name || created.model_name} was created in the fake registry.`;
          this.selectedModel = created;
          this.startEdit(created);
          this.loadModels();
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
        },
      });
      return;
    }

    const updatePayload: LlmUpdateRequest = {
      ...basePayload,
      status: this.form.status,
    };

    this.llmApi.updateModel(this.editingModelId, updatePayload).subscribe({
      next: (updated) => {
        this.saveMessage = `${updated.display_name || updated.model_name} was updated in the fake registry.`;
        this.selectedModel = updated;
        this.startEdit(updated);
        this.loadModels();
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
      },
    });
  }

  formatJson(value: unknown): string {
    return this.stringifyJson(value);
  }

  private parseJsonFields():
    | { headers: Record<string, string>; capabilities: JsonRecord; config: JsonRecord }
    | null {
    try {
      return {
        headers: this.parseJsonValue<Record<string, string>>(this.form.headersJson),
        capabilities: this.parseJsonValue<JsonRecord>(this.form.capabilitiesJson),
        config: this.parseJsonValue<JsonRecord>(this.form.configJson),
      };
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Invalid JSON field.';
      return null;
    }
  }

  private parseJsonValue<T>(value: string): T {
    if (!value.trim()) {
      return {} as T;
    }

    return JSON.parse(value) as T;
  }

  private stringifyJson(value: unknown): string {
    return JSON.stringify(value ?? {}, null, 2);
  }

  private normalizeText(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  private normalizeEnum<T extends string>(value: T | ''): T | undefined {
    return value || undefined;
  }

  private createEmptyForm(): LlmRegistryFormValue {
    return {
      model_name: '',
      display_name: '',
      device: '' as LlmDevice | '',
      access_mode: 'direct' as LlmAccessMode,
      is_required: false,
      url: '',
      api_key: '',
      version: '',
      status: 'DRAFT' as LlmStatus,
      headersJson: '{\n  "Authorization": "Bearer demo-token"\n}',
      capabilitiesJson: '{\n  "chat": true,\n  "embeddings": false\n}',
      configJson: '{\n  "max_context": 4096\n}',
    };
  }

  private createEmptyUploadForm(): LlmRegistryUploadValue {
    return {
      device: '',
      version: '',
    };
  }
}

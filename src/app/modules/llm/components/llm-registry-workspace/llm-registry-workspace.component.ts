import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
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
  LlmValidationResponse,
} from '../../models/llm-registry.models';
import {
  LlmRegistryFormValue,
  LlmRegistryUploadValue,
} from '../../models/llm-registry-form.models';
import { LlmApiService } from '../../services/llm-api.service';

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
  formVisible = false;
  uploadVisible = false;
  loading = false;
  errorMessage = '';
  saveMessage = '';
  saveMessageVisible = false;
  uploadMessage = '';
  selectedUploadFile: File | null = null;
  private saveMessageHideTimeoutId: number | null = null;
  private saveMessageClearTimeoutId: number | null = null;

  form: LlmRegistryFormValue = this.createEmptyForm();
  uploadForm: LlmRegistryUploadValue = this.createEmptyUploadForm();

  constructor(
    private readonly llmApi: LlmApiService,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  ngOnInit(): void {
    this.loadModels();
  }

  ngOnDestroy(): void {
    this.clearSaveMessage();
    this.updateBackgroundScrollLock(false);
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

          const nextModel = selectedStillExists
            ? models.find((item) => item.model_id === this.selectedModel?.model_id) ?? models[0]
            : models[0];
          this.selectModel(nextModel);
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
        },
      });
  }

  selectModel(model: LlmRegistryLocator): void {
    this.selectedModel = model;
  }

  resetFilters(): void {
    this.filters.status = '';
    this.filters.modelName = '';
    this.loadModels();
  }

  startCreate(): void {
    this.errorMessage = '';
    this.editingModelId = null;
    this.clearSaveMessage();
    this.form = this.createEmptyForm();
    this.setUploadVisible(false);
    this.setFormVisible(true);
  }

  startEdit(model: LlmRegistryLocator): void {
    this.errorMessage = '';
    this.editingModelId = model.model_id;
    this.clearSaveMessage();
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
    this.setUploadVisible(false);
    this.setFormVisible(true);
  }

  resetEditor(): void {
    if (this.selectedModel) {
      this.startEdit(this.selectedModel);
      return;
    }

    this.startCreate();
  }

  startUpload(model: LlmRegistryLocator): void {
    this.errorMessage = '';
    this.uploadModelTarget = model;
    this.uploadMessage = '';
    this.selectedUploadFile = null;
    this.uploadForm = {
      device: model.device ?? '',
      version: model.version ?? '',
    };
    this.setFormVisible(false);
    this.setUploadVisible(true);
  }

  closeEditor(): void {
    this.errorMessage = '';
    this.setFormVisible(false);
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

  closeUpload(): void {
    this.errorMessage = '';
    this.setUploadVisible(false);
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

    this.errorMessage =
      'Archive upload is disabled for this demo. LLM list/create/update/delete/validate are connected to the real API.';
  }

  validateSelected(model: LlmRegistryLocator): void {
    this.llmApi.validateModel(model.model_id).subscribe({
      next: (validated: LlmValidationResponse) => {
        this.selectedModel = {
          ...model,
          status: validated.status as LlmStatus,
        };
        this.setSaveMessage(
          `${model.display_name || model.model_name} validation returned ${validated.status}.`
        );
        this.loadModels();
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
      },
    });
  }

  deleteSelected(model: LlmRegistryLocator): void {
    const confirmed = confirm(`Delete model ${model.display_name || model.model_name}?`);
    if (!confirmed) {
      return;
    }

    this.errorMessage = '';

    this.llmApi.deleteModel(model.model_id).subscribe({
      next: () => {
        const deletedModelId = model.model_id;

        this.setSaveMessage(`${model.display_name || model.model_name} was removed from the registry.`);
        this.selectedModel = null;

        if (this.editingModelId === deletedModelId) {
          this.setFormVisible(false);
          this.editingModelId = null;
          this.form = this.createEmptyForm();
        }

        if (this.uploadModelTarget?.model_id === deletedModelId) {
          this.setUploadVisible(false);
          this.uploadModelTarget = null;
          this.selectedUploadFile = null;
          this.uploadForm = this.createEmptyUploadForm();
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
    this.clearSaveMessage();

    if (!this.form.model_name.trim()) {
      this.errorMessage = 'Model name is required.';
      return;
    }

    if (!this.form.device) {
      this.errorMessage = 'Device is required.';
      return;
    }

    if (!this.form.url.trim()) {
      this.errorMessage = 'URL is required.';
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
          this.setSaveMessage(`${created.display_name || created.model_name} was created in the registry.`);
          this.selectedModel = created;
          this.setFormVisible(false);
          this.editingModelId = created.model_id;
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
        this.setSaveMessage(`${updated.display_name || updated.model_name} was updated in the registry.`);
        this.selectedModel = updated;
        this.setFormVisible(false);
        this.editingModelId = updated.model_id;
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

  private setSaveMessage(message: string): void {
    this.clearSaveMessage();
    this.saveMessage = message;
    this.saveMessageVisible = true;
    this.saveMessageHideTimeoutId = window.setTimeout(() => {
      this.saveMessageVisible = false;
      this.saveMessageHideTimeoutId = null;
      this.saveMessageClearTimeoutId = window.setTimeout(() => {
        this.saveMessage = '';
        this.saveMessageClearTimeoutId = null;
      }, 260);
    }, 3600);
  }

  private clearSaveMessage(): void {
    if (this.saveMessageHideTimeoutId !== null) {
      window.clearTimeout(this.saveMessageHideTimeoutId);
      this.saveMessageHideTimeoutId = null;
    }

    if (this.saveMessageClearTimeoutId !== null) {
      window.clearTimeout(this.saveMessageClearTimeoutId);
      this.saveMessageClearTimeoutId = null;
    }

    this.saveMessageVisible = false;
    this.saveMessage = '';
  }

  private setFormVisible(visible: boolean): void {
    this.formVisible = visible;
    this.updateBackgroundScrollLock(this.formVisible || this.uploadVisible);
  }

  private setUploadVisible(visible: boolean): void {
    this.uploadVisible = visible;
    this.updateBackgroundScrollLock(this.formVisible || this.uploadVisible);
  }

  private updateBackgroundScrollLock(locked: boolean): void {
    const method = locked ? 'add' : 'remove';

    this.document.body?.classList[method]('modal-scroll-locked');
    this.document.documentElement?.classList[method]('modal-scroll-locked');
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
      headersJson: '{}',
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

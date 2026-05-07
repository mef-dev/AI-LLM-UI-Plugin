import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ModulePageConfig } from '../../../../shared/models/module-page.models';
import { VectorSearchRequest, VectorTableField, VectorTableSchema } from '../../models/vector-api.models';
import { VectorApiService } from '../../services/vector-api.service';

@Component({
  selector: 'app-vector-workspace',
  standalone: false,
  templateUrl: './vector-workspace.component.html',
  styleUrls: ['./vector-workspace.component.scss']
})
export class VectorWorkspaceComponent implements OnInit, OnDestroy {
  readonly queryPlaceholder = 'How do I deploy the service?';
  readonly tablePlaceholder = 'bruno-vector-test';
  readonly modelPlaceholder = 'BAAI/bge-m3';
  readonly stableFlowHint =
    'This page is focused on the stable table-based flows already confirmed on stage: schema lookup, semantic upload, and semantic search via `vectorQueries`.';
  readonly rawVectorHint =
    'Raw numeric vector array upload/search is intentionally not surfaced here yet because stage still fails on backend serialization (`JArray` -> pgvector/Npgsql).';
  readonly providerOptions = ['pgvector', 'Pgvector'];
  readonly searchModeOptions = [
    { value: 'semantic', label: 'Semantic search' },
    { value: 'field', label: 'Field text search' },
  ] as const;
  readonly llmDbConfig: ModulePageConfig = {
    name: 'LLM data and history',
    eyebrow: 'LLM database',
    badgeLabel: 'Planned workflow',
    badgeTone: 'warning',
    subtitle: 'Bring saved sessions, prompt presets, and generated outputs into one durable workspace.',
    purpose:
      'Use this as the deeper storage and traceability layer behind vector and retrieval workflows, rather than a separate top-level destination.',
    overviewTitle: 'What this extension is for',
    actionsTitle: 'Future workflows',
    sections: [
      {
        title: 'Persistent conversation history',
        text: 'Store and reopen previous chat sessions, prompts, and responses so users can continue work across visits.'
      },
      {
        title: 'Saved AI artifacts',
        text: 'Keep prompt templates, model selections, structured outputs, and document-linked results in one place.'
      },
      {
        title: 'Operational traceability',
        text: 'A stored record makes it easier to review what was generated, when it happened, and which model or workflow produced it.'
      }
    ],
    actions: [
      {
        label: 'Session library',
        description: 'Browse previous conversations, saved prompts, and generated artifacts from a searchable history view.'
      },
      {
        label: 'Record details',
        description: 'Inspect a stored entry with timestamps, model metadata, and the related source content or response payload.'
      },
      {
        label: 'Storage health',
        description: 'Surface sync status, refresh controls, and backend connection state so stored data feels dependable.'
      }
    ]
  };

  tableName = '';
  query = '';
  provider = 'pgvector';
  model = 'BAAI/bge-m3';
  searchMode: 'semantic' | 'field' = 'semantic';
  limit = 5;
  metric = 'cosine';
  select = 'id, title, content, distance';
  searchFields = '';
  vectorField = '';
  schema: VectorTableSchema | null = null;
  schemaLoading = false;
  searchLoading = false;
  errorMessage = '';
  successMessage = '';
  results: Array<Record<string, unknown>> = [];
  llmDbVisible = false;

  constructor(
    private readonly vectorApi: VectorApiService,
    private readonly renderer: Renderer2,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  ngOnInit(): void {
    this.tableName = this.tablePlaceholder;
    this.refreshSchema();
  }

  ngOnDestroy(): void {
    this.unlockBackgroundScroll();
  }

  refreshSchema(): void {
    const tableName = this.tableName.trim();
    if (!tableName) {
      this.errorMessage = 'Vector table name is required before loading schema.';
      return;
    }

    this.schemaLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.vectorApi.getTableSchema(tableName, this.provider).subscribe({
      next: (schema) => {
        this.schemaLoading = false;
        this.schema = schema;
        this.applySchemaDefaults(schema.fields);
        this.successMessage = `Loaded schema for "${schema.name}".`;
      },
      error: (error: Error) => {
        this.schemaLoading = false;
        this.schema = null;
        this.errorMessage = error.message;
      },
    });
  }

  runSearch(): void {
    const tableName = this.tableName.trim();
    const query = this.query.trim();

    if (!tableName) {
      this.errorMessage = 'Vector table name is required before searching.';
      return;
    }

    if (!query) {
      this.errorMessage = 'Search query is required.';
      return;
    }

    if (this.searchMode === 'semantic' && !this.activeVectorField) {
      this.errorMessage = 'Load schema first so the UI can detect the vector field for semantic search.';
      return;
    }

    this.searchLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.results = [];

    this.vectorApi.searchTable(tableName, this.requestPayload).subscribe({
      next: (results) => {
        this.searchLoading = false;
        this.results = results;
        this.successMessage = `Vector search completed with ${results.length} result(s).`;
      },
      error: (error: Error) => {
        this.searchLoading = false;
        this.errorMessage = error.message;
      },
    });
  }

  get requestJson(): string {
    return JSON.stringify(this.requestPayload, null, 2);
  }

  openLlmDbOverview(): void {
    this.llmDbVisible = true;
    this.updateBackgroundScrollLock();
  }

  closeLlmDbOverview(): void {
    this.llmDbVisible = false;
    this.updateBackgroundScrollLock();
  }

  get activeVectorField(): string {
    return this.vectorField.trim() || this.detectedVectorField || '';
  }

  get detectedVectorField(): string {
    return this.schema?.fields.find((field) => field.type.toLowerCase() === 'vector')?.name || '';
  }

  get detectedSearchField(): string {
    if (this.searchFields.trim()) {
      return this.searchFields.trim();
    }

    return (
      this.schema?.fields.find((field) => field.type.toLowerCase() === 'string' && field.name !== this.detectedVectorField)?.name ||
      'title'
    );
  }

  get requestPayload(): VectorSearchRequest {
    if (this.searchMode === 'field') {
      return {
        provider: this.provider,
        ...(this.model.trim() ? { model: this.model.trim() } : {}),
        search: this.query.trim() || this.queryPlaceholder,
        select: this.select.trim() || '*',
        searchFields: this.detectedSearchField,
      };
    }

    return {
      provider: this.provider,
      model: this.model.trim() || this.modelPlaceholder,
      select: this.select.trim() || 'id, title, content, distance',
      vectorQueries: [
        {
          vector: this.query.trim() || this.queryPlaceholder,
          K: String(this.limit),
          fields: this.activeVectorField || 'embedding_text',
          metric: this.metric,
        },
      ],
    };
  }

  getFieldPreview(result: Record<string, unknown>): string {
    const candidateKeys = ['content', 'chunk', 'title', 'name', 'source'];
    for (const key of candidateKeys) {
      const value = result[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return 'Review the raw payload below for the returned vector row.';
  }

  getResultTitle(result: Record<string, unknown>, index: number): string {
    const candidateKeys = ['title', 'name', 'id'];
    for (const key of candidateKeys) {
      const value = result[key];
      if ((typeof value === 'string' || typeof value === 'number') && String(value).trim()) {
        return String(value);
      }
    }

    return `Result ${index + 1}`;
  }

  getResultMeta(result: Record<string, unknown>): string {
    const distance = result['distance'];
    const source = result['source'];
    const parts: string[] = [];

    if (typeof distance === 'number' && Number.isFinite(distance)) {
      parts.push(`distance ${distance.toFixed(4)}`);
    }

    if (typeof source === 'string' && source.trim()) {
      parts.push(source);
    }

    return parts.join(' · ') || 'Returned row';
  }

  private applySchemaDefaults(fields: VectorTableField[]): void {
    const vectorField = fields.find((field) => field.type.toLowerCase() === 'vector')?.name || '';
    const firstStringField =
      fields.find((field) => field.type.toLowerCase() === 'string' && field.name !== vectorField)?.name || '';

    if (vectorField && !this.vectorField.trim()) {
      this.vectorField = vectorField;
    }

    if (firstStringField && !this.searchFields.trim()) {
      this.searchFields = firstStringField;
    }
  }

  private updateBackgroundScrollLock(): void {
    if (this.llmDbVisible) {
      this.renderer.addClass(this.document.documentElement, 'modal-scroll-locked');
      this.renderer.addClass(this.document.body, 'modal-scroll-locked');
      return;
    }

    this.unlockBackgroundScroll();
  }

  private unlockBackgroundScroll(): void {
    this.renderer.removeClass(this.document.documentElement, 'modal-scroll-locked');
    this.renderer.removeClass(this.document.body, 'modal-scroll-locked');
  }
}

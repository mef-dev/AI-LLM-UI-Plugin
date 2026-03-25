import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  LlmCreateRequest,
  LlmListFilters,
  LlmRegistryLocator,
  LlmUpdateRequest,
} from '../models/llm-registry.models';

@Injectable({ providedIn: 'root' })
export class LlmFakeApiService {
  private readonly responseDelayMs = 180;

  private models: LlmRegistryLocator[] = [
    {
      '@type': 'LLMRegistryLocator',
      model_id: '0f6d9bb1-5b83-4f72-8f51-6a2fe10df001',
      model_name: 'meta-llama/Llama-3.1-8B-Instruct',
      display_name: 'Llama 3.1 8B Instruct',
      access_mode: 'direct',
      is_required: true,
      url: 'http://ai-runtime.internal/llm/llama-3-1-8b',
      api_key: 'sk-demo-llama',
      headers: { Authorization: 'Bearer runtime-token' },
      version: '1.8.0',
      device: 'cuda',
      status: 'VALIDATED',
      capabilities: { chat: true, embeddings: false, tools: true },
      config: { max_context: 8192, temperature_default: 0.7 },
      tenantId: 7,
      createdAt: '2026-03-10T08:00:00Z',
      updatedAt: '2026-03-23T15:20:00Z',
    },
    {
      '@type': 'LLMRegistryLocator',
      model_id: '0f6d9bb1-5b83-4f72-8f51-6a2fe10df002',
      model_name: 'openai/gpt-4.1-mini',
      display_name: 'GPT 4.1 Mini Gateway',
      access_mode: 'external_service',
      is_required: false,
      url: 'https://gateway.internal.example/llm/openai',
      api_key: 'sk-demo-openai',
      headers: { 'X-Tenant': 'mef-dev-stage' },
      version: '2026.03',
      device: 'cpu',
      status: 'DRAFT',
      capabilities: { chat: true, json_mode: true, streaming: true },
      config: { max_context: 128000, timeout_ms: 30000 },
      tenantId: 7,
      createdAt: '2026-03-14T10:45:00Z',
      updatedAt: '2026-03-22T11:00:00Z',
    },
    {
      '@type': 'LLMRegistryLocator',
      model_id: '0f6d9bb1-5b83-4f72-8f51-6a2fe10df003',
      model_name: 'natec/internal-support-agent',
      display_name: 'Internal Support Agent',
      access_mode: 'internal_service',
      is_required: false,
      url: 'http://support-ai.internal/service/chat',
      api_key: 'sk-demo-support',
      headers: { 'X-Service': 'support-ai' },
      version: '0.9.4',
      device: 'cuda',
      status: 'DISABLED',
      capabilities: { chat: true, retrieval: true, tools: false },
      config: { max_context: 16384, system_profile: 'support' },
      tenantId: 7,
      createdAt: '2026-03-01T09:30:00Z',
      updatedAt: '2026-03-18T12:10:00Z',
    },
  ];

  getModels(filters: LlmListFilters = {}): Observable<LlmRegistryLocator[]> {
    const normalizedQuery = (filters.modelName ?? '').trim().toLowerCase();
    const items = this.models.filter((item) => {
      const matchesStatus = !filters.status || item.status === filters.status;
      const matchesName =
        !normalizedQuery ||
        item.model_name.toLowerCase().includes(normalizedQuery) ||
        (item.display_name ?? '').toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesName;
    });

    return this.respond(items);
  }

  getModelById(id: string): Observable<LlmRegistryLocator> {
    const model = this.models.find((item) => item.model_id === id);
    if (!model) {
      return this.fail(`LLM model with id ${id} was not found.`);
    }

    return this.respond(model);
  }

  createModel(request: LlmCreateRequest): Observable<LlmRegistryLocator> {
    const now = new Date().toISOString();
    const created: LlmRegistryLocator = {
      '@type': 'LLMRegistryLocator',
      model_id: this.generateId(),
      model_name: request.model_name,
      display_name: request.display_name,
      access_mode: request.access_mode ?? 'direct',
      is_required: request.is_required ?? false,
      url: request.url,
      api_key: request.api_key,
      headers: request.headers ?? {},
      version: request.version,
      device: request.device,
      status: 'DRAFT',
      capabilities: request.capabilities ?? {},
      config: request.config ?? {},
      tenantId: 7,
      createdAt: now,
      updatedAt: now,
    };

    this.models = [created, ...this.models];
    return this.respond(created);
  }

  updateModel(id: string, request: LlmUpdateRequest): Observable<LlmRegistryLocator> {
    const index = this.models.findIndex((item) => item.model_id === id);
    if (index === -1) {
      return this.fail(`LLM model with id ${id} was not found.`);
    }

    const current = this.models[index];
    const updated: LlmRegistryLocator = {
      ...current,
      ...request,
      updatedAt: new Date().toISOString(),
    };

    this.models = this.models.map((item, itemIndex) => (itemIndex === index ? updated : item));
    return this.respond(updated);
  }

  deleteModel(id: string): Observable<void> {
    const exists = this.models.some((item) => item.model_id === id);
    if (!exists) {
      return this.fail(`LLM model with id ${id} was not found.`);
    }

    this.models = this.models.filter((item) => item.model_id !== id);
    return of(void 0).pipe(delay(this.responseDelayMs));
  }

  validateModel(id: string): Observable<LlmRegistryLocator> {
    const model = this.models.find((item) => item.model_id === id);
    if (!model) {
      return this.fail(`LLM model with id ${id} was not found.`);
    }

    const validated: LlmRegistryLocator = {
      ...model,
      status: 'VALIDATED',
      updatedAt: new Date().toISOString(),
    };

    this.models = this.models.map((item) => (item.model_id === id ? validated : item));
    return this.respond(validated);
  }

  private respond<T>(value: T): Observable<T> {
    return of(this.clone(value)).pipe(delay(this.responseDelayMs));
  }

  private fail(message: string): Observable<never> {
    return throwError(() => new Error(message));
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `mock-${Date.now()}`;
  }
}

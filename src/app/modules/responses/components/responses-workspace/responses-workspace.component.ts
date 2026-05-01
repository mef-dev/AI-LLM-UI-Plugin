import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LlmRegistryLocator } from '../../../llm/models/llm-registry.models';
import { LlmApiService } from '../../../llm/services/llm-api.service';
import {
  ResponsesReasoningEffort,
  ResponsesRequest,
  ResponsesResponse,
  ResponsesStreamEvent,
} from '../../models/responses.models';
import { ResponsesApiService } from '../../services/responses-api.service';

@Component({
  selector: 'app-responses-workspace',
  standalone: false,
  templateUrl: './responses-workspace.component.html',
  styleUrls: ['./responses-workspace.component.scss'],
})
export class ResponsesWorkspaceComponent implements OnInit, OnDestroy {
  private static readonly modelsCacheKey = 'responsesWorkspace.cachedModels';
  readonly defaultDeveloperInstruction = 'You are an AI assistant that helps internal MEF.DEV users.';
  readonly defaultUserPrompt = 'Explain in two short sentences what response streaming is and why it helps developers.';
  private readonly emptyStreamMessage = 'The stream finished, but no text output was parsed.';
  allModels: LlmRegistryLocator[] = [];
  availableModels: LlmRegistryLocator[] = [];
  request: ResponsesRequest = this.createInitialRequest();
  response: ResponsesResponse | null = null;
  loading = false;
  errorMessage = '';
  warningMessage = '';
  successMessage = '';
  streamingContent = '';
  streamingEnabled = false;
  hasExplicitResponsesModels = false;
  streamEventTypes: string[] = [];
  private activeRequest: Subscription | null = null;
  private latestStreamResponse: ResponsesResponse | null = null;

  developerInstruction = this.defaultDeveloperInstruction;
  userPrompt = this.defaultUserPrompt;
  readonly reasoningEfforts: ResponsesReasoningEffort[] = ['low', 'medium', 'high'];

  constructor(
    private readonly responsesApi: ResponsesApiService,
    private readonly llmApi: LlmApiService
  ) {}

  ngOnInit(): void {
    this.restoreCachedModels();

    this.llmApi.getModels().subscribe({
      next: (models) => {
        this.applyModelList(models, false);

        if (!models.length) {
          this.errorMessage =
            'No registered models are currently available. Add or validate a model first.';
        }
      },
      error: (error: Error) => {
        const restoredFromCache = this.restoreCachedModels();

        if (restoredFromCache) {
          this.warningMessage =
            'The live model registry could not be refreshed just now, so this page is using the last successful model list from your browser cache. You can still test Responses, but refresh the Models page later to re-check the live registry.';
          this.errorMessage = '';
          return;
        }

        this.errorMessage = this.toFriendlyErrorMessage(error.message);
      },
    });
  }

  ngOnDestroy(): void {
    this.activeRequest?.unsubscribe();
  }

  sendResponse(): void {
    if (!this.request.model) {
      this.errorMessage =
        'Choose a model before sending a request.';
      return;
    }

    const modelCompatibilityWarning = this.getSelectedModelCompatibilityWarning();
    if (modelCompatibilityWarning) {
      this.warningMessage = modelCompatibilityWarning;
    }

    this.activeRequest?.unsubscribe();
    this.activeRequest = null;
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.response = null;
    this.streamingContent = '';
    this.streamingEnabled = this.request.stream;
    this.streamEventTypes = [];
    this.latestStreamResponse = null;

    const preparedRequest: ResponsesRequest = {
      ...this.request,
      input: [
        {
          role: 'developer',
          content: [{ type: 'input_text', text: this.developerInstruction.trim() }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: this.userPrompt.trim() }],
        },
      ],
    };

    this.request = preparedRequest;

    if (preparedRequest.stream) {
      this.activeRequest = this.responsesApi.createResponseStream(preparedRequest).subscribe({
        next: (event: ResponsesStreamEvent) => {
          if (event.rawType && !this.streamEventTypes.includes(event.rawType)) {
            this.streamEventTypes = [...this.streamEventTypes, event.rawType];
          }

          if (event.kind === 'delta') {
            this.streamingContent += event.delta || '';
            return;
          }

          if (event.kind === 'response') {
            this.latestStreamResponse = event.response ?? null;
          }
        },
        complete: () => {
          this.finishStreamResponse(this.buildStreamResponse());
        },
        error: (error: Error) => {
          this.loading = false;
          this.errorMessage = this.toFriendlyErrorMessage(error.message);
          this.streamingEnabled = false;
        },
      });

      return;
    }

    this.activeRequest = this.responsesApi.createResponse(preparedRequest).subscribe({
      next: (response) => {
        this.finishResponse(response, 'Responses API reply generated successfully.');
      },
      error: (error: Error) => {
        this.loading = false;
        this.errorMessage = this.toFriendlyErrorMessage(error.message);
        this.streamingEnabled = false;
      },
    });
  }

  reset(): void {
    this.activeRequest?.unsubscribe();
    this.activeRequest = null;
    const nextRequest = this.createInitialRequest();
    nextRequest.stream = this.request.stream;
    nextRequest.model = this.pickPreferredModel(nextRequest.stream);
    this.request = nextRequest;
    this.response = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.developerInstruction = this.defaultDeveloperInstruction;
    this.userPrompt = this.defaultUserPrompt;
    this.loading = false;
    this.streamingContent = '';
    this.streamingEnabled = false;
    this.streamEventTypes = [];
    this.latestStreamResponse = null;
  }

  get outputText(): string {
    if (!this.response) {
      return '';
    }

    if (typeof this.response.output_text === 'string' && this.response.output_text.trim()) {
      return this.response.output_text;
    }

    const content = this.response.output
      ?.flatMap((item) => item.content ?? [])
      .map((part) => this.extractTextValue(part?.text))
      .join('');

    return content?.trim() || 'No output text was returned.';
  }

  get previewOutputText(): string {
    if (this.streamingContent) {
      return this.streamingContent;
    }

    if (
      this.request.stream &&
      this.response &&
      !this.extractOutputText(this.response) &&
      this.streamEventTypes.length
    ) {
      return `No visible output text was parsed from the stream. Events received: ${this.streamEventTypes.join(', ')}.`;
    }

    return this.outputText;
  }

  get streamEventSummary(): string {
    return this.streamEventTypes.length ? this.streamEventTypes.join(', ') : 'No stream events captured.';
  }

  get streamDebugJson(): string {
    if (!this.latestStreamResponse) {
      return 'No final response payload was captured from the stream.';
    }

    return JSON.stringify(this.latestStreamResponse, null, 2);
  }

  get responseStatus(): string {
    if (this.loading && this.streamingEnabled) {
      return 'streaming';
    }

    return this.response?.status || 'completed';
  }

  private createInitialRequest(model = 'azure/gpt-5-mini'): ResponsesRequest {
    return {
      model,
      stream: true,
      max_output_tokens: 120,
      reasoning: {
        effort: 'low',
      },
      input: [],
      text: {
        format: {
          type: 'text',
        },
      },
    };
  }

  onStreamModeChanged(): void {
    this.request.model = this.pickPreferredModel(this.request.stream);
  }

  get usingModelFallback(): boolean {
    return !this.hasExplicitResponsesModels && this.allModels.length > 0;
  }

  get selectedModel(): LlmRegistryLocator | null {
    return this.availableModels.find((model) => model.model_name === this.request.model) ?? null;
  }

  private toFriendlyErrorMessage(message: string): string {
    if (message === 'Load failed') {
      return 'The Responses page could not load the live model registry on this refresh. The stage `/llm` endpoint may have had a temporary browser/network failure. Refresh once more or open the Models page to confirm the registry is reachable.';
    }

    if (message.includes('A second operation was started on this context instance')) {
      return 'The stage `/responses` backend is currently failing internally with a database concurrency error. Your Responses model registration looks okay; this is a server-side issue that needs fixing on the API before the page can return text reliably.';
    }

    if (message.includes("does not support 'capabilities.responses'")) {
      return 'The selected model is not registered for the Responses API yet. To make this work, update that model in the Models page with `capabilities.responses: true`, or register a dedicated `azure/gpt-5-mini/responses` model entry for streaming.';
    }

    if (message.includes('Unsupported data type') && message.includes('/chat/completions')) {
      return 'The stage backend accepted the Responses request, but the selected model is registered with a `chat/completions` upstream. The UI is no longer blocking this test; the remaining fix is to update the model registry URL to a `responses` upstream or handle this mapping in the API.';
    }

    return message;
  }

  private getSelectedModelCompatibilityWarning(): string | null {
    const model = this.selectedModel;

    if (!model?.url) {
      return null;
    }

    const normalizedUrl = model.url.toLowerCase();
    const pointsToChatCompletions = normalizedUrl.includes('/chat/completions');
    const pointsToResponses = normalizedUrl.includes('/responses');

    if (pointsToChatCompletions && !pointsToResponses) {
      return 'This model is registered with a `chat/completions` upstream. The request will still be sent to the stage `/responses` endpoint so you can see the real backend result, but the model registry may need a `responses` URL for a successful reply.';
    }

    return null;
  }

  private finishResponse(response: ResponsesResponse, successMessage: string): void {
    this.response = response;
    this.loading = false;
    this.successMessage = successMessage;
    this.streamingEnabled = false;
  }

  private finishStreamResponse(response: ResponsesResponse): void {
    this.response = response;
    this.loading = false;
    this.streamingEnabled = false;

    const outputText = this.extractOutputText(response);
    if (outputText && outputText !== this.emptyStreamMessage) {
      this.successMessage = 'Responses API reply streamed successfully.';
      return;
    }

    this.successMessage = '';
    this.warningMessage = this.buildStreamWarningMessage();
  }

  private buildStreamResponse(): ResponsesResponse {
    const response = this.latestStreamResponse ?? {};
    const eventSummary = this.streamEventTypes.length
      ? ` Events received: ${this.streamEventTypes.join(', ')}.`
      : '';
    const outputText =
      this.extractOutputText(response) ||
      this.streamingContent ||
      `${this.emptyStreamMessage}${eventSummary} Check the stream debug payload below; if events arrived but output is empty, the stage backend or upstream model returned no visible text.`;

    return {
      id: response.id || `response-stream-${Date.now()}`,
      model: response.model || this.request.model,
      status: response.status || 'completed',
      output: response.output,
      output_text: outputText,
      usage: response.usage,
    };
  }

  private buildStreamWarningMessage(): string {
    if (this.streamingContent) {
      return '';
    }

    if (this.streamEventTypes.length) {
      return `The stream finished, but no visible output text was parsed. Events received: ${this.streamEventTypes.join(', ')}. Check the stream debug payload below.`;
    }

    return 'The stream finished without visible output text or stream events. The request reached stage, but the backend/upstream model did not return usable response content.';
  }

  private extractOutputText(response: ResponsesResponse | null): string {
    if (!response) {
      return '';
    }

    if (typeof response.output_text === 'string' && response.output_text.trim()) {
      return response.output_text;
    }

    const content = response.output
      ?.flatMap((item) => item.content ?? [])
      .map((part) => this.extractTextValue(part?.text))
      .join('');

    return content?.trim() || '';
  }

  private extractTextValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return '';
    }

    const record = value as Record<string, unknown>;

    if (typeof record['value'] === 'string') {
      return record['value'];
    }

    if (typeof record['text'] === 'string') {
      return record['text'];
    }

    if (typeof record['content'] === 'string') {
      return record['content'];
    }

    return '';
  }

  private supportsResponses(model: LlmRegistryLocator): boolean {
    if (model.model_name.toLowerCase().includes('/responses')) {
      return true;
    }

    return this.readCapabilityFlag(model.capabilities?.['responses']) || this.readCapabilityFlag(model.capabilities?.['response']);
  }

  private readCapabilityFlag(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    const enabled = (value as Record<string, unknown>)['enabled'];
    return enabled === true || enabled === 'true';
  }

  private pickPreferredModel(streamMode: boolean): string {
    const exactMatch = streamMode
      ? this.availableModels.find((model) => model.model_name === 'azure/gpt-5-mini/responses')
      : this.availableModels.find((model) => model.model_name === 'azure/gpt-5-mini');

    if (exactMatch) {
      return exactMatch.model_name;
    }

    const fallback = streamMode
      ? this.availableModels.find((model) => model.model_name.toLowerCase().includes('/responses'))
      : this.availableModels.find((model) => !model.model_name.toLowerCase().includes('/responses'));

    return fallback?.model_name ?? this.availableModels[0]?.model_name ?? '';
  }

  private applyModelList(models: LlmRegistryLocator[], fromCache: boolean): void {
    this.allModels = models;
    const explicitlySupportedModels = models.filter((model) => this.supportsResponses(model));
    this.hasExplicitResponsesModels = explicitlySupportedModels.length > 0;

    if (explicitlySupportedModels.length) {
      this.availableModels = explicitlySupportedModels;
      if (!fromCache) {
        this.warningMessage = '';
      }
    } else if (models.length) {
      this.availableModels = models;
      this.warningMessage = fromCache
        ? 'Using cached model data. No models in that cached list were explicitly marked with Responses capability, so this page is showing all cached models as a fallback.'
        : 'No models are explicitly marked with Responses capability in the registry yet. This page is showing all registered models as a fallback, but actual `/responses` calls may still fail until a model is registered with `capabilities.responses: true`.';
    } else {
      this.availableModels = [];
      if (!fromCache) {
        this.warningMessage = '';
      }
    }

    this.request.model = this.pickPreferredModel(this.request.stream);

    if (!fromCache) {
      this.cacheModels(models);
    }
  }

  private restoreCachedModels(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const raw = window.localStorage.getItem(ResponsesWorkspaceComponent.modelsCacheKey);
      if (!raw) {
        return false;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return false;
      }

      this.applyModelList(parsed as LlmRegistryLocator[], true);
      return parsed.length > 0;
    } catch {
      return false;
    }
  }

  private cacheModels(models: LlmRegistryLocator[]): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(ResponsesWorkspaceComponent.modelsCacheKey, JSON.stringify(models));
    } catch {
      // Ignore browser storage issues and keep the page usable.
    }
  }
}

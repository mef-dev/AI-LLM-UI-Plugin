import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  ChatCompletionResponse,
  ChatCompletionStreamEvent,
  ChatCompletionsRequest,
  ChatMessageRole,
} from '../../models/chat-completions.models';
import { ChatApiService } from '../../services/chat-api.service';
import { LlmRegistryLocator } from '../../../llm/models/llm-registry.models';
import { LlmApiService } from '../../../llm/services/llm-api.service';

@Component({
  selector: 'app-chat-playground',
  standalone: false,
  templateUrl: './chat-playground.component.html',
  styleUrls: ['./chat-playground.component.scss']
})
export class ChatPlaygroundComponent implements OnInit, OnDestroy {
  readonly roles: ChatMessageRole[] = ['system', 'user', 'assistant'];

  request: ChatCompletionsRequest = this.createInitialRequest();
  response: ChatCompletionResponse | null = null;
  availableModels: LlmRegistryLocator[] = [];
  loading = false;
  errorMessage = '';
  statusMessage = '';
  successMessage = '';
  streamingContent = '';
  streamingEnabled = false;
  private activeRequest: Subscription | null = null;
  private latestStreamPayload: Partial<ChatCompletionResponse> | null = null;

  constructor(
    private readonly chatApi: ChatApiService,
    private readonly llmApi: LlmApiService
  ) {}

  ngOnInit(): void {
    this.llmApi.getModels().subscribe({
      next: (models) => {
        this.availableModels = models;

        const currentModelExists = models.some((model) => model.model_name === this.request.model);
        if (!currentModelExists) {
          const preferredModel =
            models.find((model) => model.model_name === 'azure/gpt-5-mini')?.model_name ??
            models[0]?.model_name ??
            'azure/gpt-5-mini';
          this.request.model = preferredModel;
        }
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
      },
    });
  }

  ngOnDestroy(): void {
    this.activeRequest?.unsubscribe();
  }

  addUserMessage(): void {
    this.request.messages = [...this.request.messages, { role: 'user', content: '' }];
  }

  removeMessage(index: number): void {
    if (this.request.messages.length === 1) {
      return;
    }

    this.request.messages = this.request.messages.filter((_, messageIndex) => messageIndex !== index);
  }

  resetConversation(): void {
    this.activeRequest?.unsubscribe();
    this.activeRequest = null;
    this.request = this.createInitialRequest(this.request.model || this.availableModels[0]?.model_name || '');
    this.response = null;
    this.loading = false;
    this.errorMessage = '';
    this.statusMessage = '';
    this.successMessage = '';
    this.streamingContent = '';
    this.streamingEnabled = false;
    this.latestStreamPayload = null;
  }

  sendCompletion(): void {
    this.runCompletion(false);
  }

  sendStreamCompletion(): void {
    this.runCompletion(true);
  }

  cancelActiveRequest(): void {
    if (!this.loading) {
      return;
    }

    this.activeRequest?.unsubscribe();
    this.activeRequest = null;
    this.loading = false;
    this.streamingEnabled = false;
    this.statusMessage = 'Generation stopped.';
    this.successMessage = '';
    this.errorMessage = '';
  }

  private runCompletion(stream: boolean): void {
    this.activeRequest?.unsubscribe();
    this.activeRequest = null;
    this.loading = true;
    this.errorMessage = '';
    this.statusMessage = '';
    this.successMessage = '';
    this.response = null;
    this.streamingContent = '';
    this.request.stream = stream;
    this.streamingEnabled = stream;
    this.latestStreamPayload = null;

    if (stream) {
      this.activeRequest = this.chatApi.createCompletionStream(this.request).subscribe({
        next: (event: ChatCompletionStreamEvent) => {
          if (event.type === 'delta') {
            this.streamingContent += event.delta || '';
            return;
          }

          if (event.type === 'response') {
            this.latestStreamPayload = event.response ?? null;
          }
        },
        complete: () => {
          const finalResponse = this.buildStreamResponse();
          this.finishResponse(
            finalResponse,
            this.streamingContent ? 'Assistant reply streamed successfully.' : 'Streaming completed.'
          );
        },
        error: (error: Error) => {
          this.loading = false;
          this.errorMessage = error.message;
          this.statusMessage = '';
          this.streamingEnabled = false;
        },
      });
      return;
    }

    this.activeRequest = this.chatApi.createCompletion(this.request).subscribe({
      next: (response: ChatCompletionResponse) => {
        this.finishResponse(response, 'Assistant reply generated successfully.');
      },
      error: (error: Error) => {
        this.loading = false;
        this.errorMessage = error.message;
        this.statusMessage = '';
        this.streamingEnabled = false;
      },
    });
  }

  formatJson(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }

  private createInitialRequest(model = 'azure/gpt-5-mini'): ChatCompletionsRequest {
    return {
      model,
      messages: [
        {
          role: 'system',
          content: 'Be brief and helpful.',
        },
        {
          role: 'user',
          content: 'Explain quantum computing in simple terms.',
        },
      ],
      stream: false,
      stream_interval: 1,
      tag: 'demo-streaming',
      max_tokens: 120,
      temperature: 1,
      top_p: 1,
    };
  }

  private finishResponse(response: ChatCompletionResponse, successMessage: string): void {
    this.response = response;
    this.loading = false;
    this.statusMessage = '';
    this.successMessage = successMessage;
    this.streamingEnabled = false;

    const assistantMessage = response.choices[0]?.message;
    if (assistantMessage) {
      const alreadyAppended =
        this.request.messages[this.request.messages.length - 1]?.role === 'assistant' &&
        this.request.messages[this.request.messages.length - 1]?.content === assistantMessage.content;

      if (!alreadyAppended) {
        this.request.messages = [...this.request.messages, assistantMessage];
      }
    }

    this.streamingContent = '';
  }

  private buildStreamResponse(): ChatCompletionResponse {
    const payload = this.latestStreamPayload ?? {};
    const finalMessage =
      (payload.choices?.[0]?.message?.content as string | undefined) ||
      this.streamingContent ||
      'Stream completed without visible assistant text.';

    return {
      id: payload.id || `stream-${Date.now()}`,
      object: 'chat.completion',
      created: payload.created || Math.floor(Date.now() / 1000),
      model: payload.model || this.request.model || 'streaming-model',
      tag: (payload.tag as string | null | undefined) ?? null,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: finalMessage,
          },
          finish_reason: 'stop',
        },
      ],
      usage: payload.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  }

}

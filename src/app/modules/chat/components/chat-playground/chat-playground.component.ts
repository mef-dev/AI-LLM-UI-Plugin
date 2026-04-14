import { Component, OnInit } from '@angular/core';
import {
  ChatCompletionResponse,
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
export class ChatPlaygroundComponent implements OnInit {
  readonly roles: ChatMessageRole[] = ['system', 'user', 'assistant'];

  request: ChatCompletionsRequest = this.createInitialRequest();
  response: ChatCompletionResponse | null = null;
  availableModels: LlmRegistryLocator[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

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
    this.request = this.createInitialRequest(this.request.model || this.availableModels[0]?.model_name || '');
    this.response = null;
    this.loading = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  sendCompletion(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.chatApi.createCompletion(this.request).subscribe({
      next: (response) => {
        this.response = response;
        this.loading = false;
        this.successMessage = 'Assistant reply generated successfully.';
        const assistantMessage = response.choices[0]?.message;
        if (assistantMessage) {
          this.request.messages = [...this.request.messages, assistantMessage];
        }
      },
      error: (error: Error) => {
        this.loading = false;
        this.errorMessage = error.message;
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
          content: 'Say hello in one sentence.',
        },
      ],
      stream: false,
      max_tokens: 120,
      temperature: 1,
      top_p: 1,
    };
  }
}

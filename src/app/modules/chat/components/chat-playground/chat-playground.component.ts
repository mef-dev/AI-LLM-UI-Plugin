import { Component } from '@angular/core';
import {
  ChatCompletionResponse,
  ChatCompletionsRequest,
  ChatMessageRole,
} from '../../models/chat-completions.models';
import { ChatFakeApiService } from '../../services/chat-fake-api.service';

@Component({
  selector: 'app-chat-playground',
  standalone: false,
  templateUrl: './chat-playground.component.html',
  styleUrls: ['./chat-playground.component.scss']
})
export class ChatPlaygroundComponent {
  readonly roles: ChatMessageRole[] = ['system', 'user', 'assistant'];

  request: ChatCompletionsRequest = this.createInitialRequest();
  response: ChatCompletionResponse | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private readonly chatApi: ChatFakeApiService) {}

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
    this.request = this.createInitialRequest();
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
        this.successMessage = 'Mock completion returned successfully.';
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

  private createInitialRequest(): ChatCompletionsRequest {
    return {
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant for internal MEF.DEV users.',
        },
        {
          role: 'user',
          content: 'Explain what this AI LLM UI plugin should help platform users do.',
        },
      ],
      stream: true,
      tag: 'demo-chat-run',
      stream_interval: 0.1,
      diversity_penalty: 0,
      do_sample: true,
      early_stopping: false,
      length_penalty: 1,
      max_tokens: 512,
      min_length: 0,
      no_repeat_ngram_size: 0,
      num_beams: 1,
      num_return_sequences: 1,
      past_present_share_buffer: false,
      repetition_penalty: 1,
      temperature: 0.7,
      top_k: 50,
      top_p: 0.9,
    };
  }
}

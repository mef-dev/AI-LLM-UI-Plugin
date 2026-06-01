import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  ChatCompletionResponse,
  ChatCompletionsRequest,
  ChatCompletionsRequestMessage,
} from '../models/chat-completions.models';

@Injectable({ providedIn: 'root' })
export class ChatFakeApiService {
  private readonly responseDelayMs = 320;

  createCompletion(request: ChatCompletionsRequest): Observable<ChatCompletionResponse> {
    const trimmedMessages = request.messages.filter((message) => message.content.trim().length > 0);

    if (!trimmedMessages.length) {
      return throwError(() => new Error('Chat completion requires at least one non-empty message.'));
    }

    const lastUserMessage = [...trimmedMessages].reverse().find((message) => message.role === 'user');
    const systemMessage = trimmedMessages.find((message) => message.role === 'system');
    const assistantMessage = this.buildAssistantMessage(lastUserMessage, systemMessage, request);
    const promptTokens = trimmedMessages.reduce((total, message) => total + this.countTokens(message.content), 0);
    const completionTokens = this.countTokens(assistantMessage.content);

    const response: ChatCompletionResponse = {
      id: this.generateCompletionId(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model || 'meta-llama/Llama-3.1-8B-Instruct',
      tag: request.tag ?? null,
      choices: [
        {
          index: 0,
          message: assistantMessage,
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
    };

    return of(response).pipe(delay(this.responseDelayMs));
  }

  private buildAssistantMessage(
    lastUserMessage: ChatCompletionsRequestMessage | undefined,
    systemMessage: ChatCompletionsRequestMessage | undefined,
    request: ChatCompletionsRequest
  ): ChatCompletionsRequestMessage {
    const userPrompt = lastUserMessage?.content.trim() || 'No user prompt was provided.';
    const systemPrompt = systemMessage?.content.trim();
    const behaviorLine = systemPrompt
      ? `System guidance: ${systemPrompt}`
      : 'System guidance: no system message was provided.';

    return {
      role: 'assistant',
      content: [
        `Fake completion generated for model ${request.model || 'meta-llama/Llama-3.1-8B-Instruct'}.`,
        behaviorLine,
        `User request summary: ${userPrompt}`,
        `Generation settings: temperature=${request.temperature ?? 0.7}, top_p=${request.top_p ?? 0.9}, max_tokens=${request.max_tokens ?? 1024}.`,
        'This is mocked output meant to exercise the same request/response flow as the future real API integration.',
      ].join('\n\n'),
    };
  }

  private countTokens(value: string): number {
    return Math.max(1, Math.ceil(value.trim().length / 4));
  }

  private generateCompletionId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `chatcmpl-${crypto.randomUUID()}`;
    }

    return `chatcmpl-${Date.now()}`;
  }
}

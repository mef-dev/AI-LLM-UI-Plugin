import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import { EndpointService } from 'src/app/core/services/endpoint.service';
import {
  ChatCompletionResponse,
  ChatCompletionStreamEvent,
  ChatCompletionsRequest,
} from '../models/chat-completions.models';

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  constructor(private readonly endpointService: EndpointService) {}

  createCompletion(request: ChatCompletionsRequest): Observable<ChatCompletionResponse> {
    const payload = this.buildPayload({ ...request, stream: true });

    return new Observable<ChatCompletionResponse>((observer) => {
      const controller = new AbortController();
      let streamedContent = '';
      let latestPayload: Partial<ChatCompletionResponse> & Record<string, unknown> = {};

      this.consumeEventStream(
        payload,
        {
          next: (event) => {
            if (event.type === 'delta') {
              streamedContent += event.delta || '';
              return;
            }

            if (event.type === 'response') {
              latestPayload = event.response ?? latestPayload;
            }
          },
          error: (error) => observer.error(error),
          complete: () => {
            observer.next(this.buildAggregatedStreamResponse(latestPayload, streamedContent, payload.model));
            observer.complete();
          },
        },
        controller.signal
      ).catch((error) => {
        observer.error(error instanceof Error ? error : new Error('Chat request failed.'));
      });

      return () => controller.abort();
    });
  }

  createCompletionStream(request: ChatCompletionsRequest): Observable<ChatCompletionStreamEvent> {
    const payload = this.buildPayload({ ...request, stream: true });

    return new Observable<ChatCompletionStreamEvent>((observer) => {
      const controller = new AbortController();

      this.consumeEventStream(payload, observer, controller.signal).catch((error) => {
        observer.error(error instanceof Error ? error : new Error('Streaming chat request failed.'));
      });

      return () => controller.abort();
    });
  }

  private get completionsUrl(): string {
    return `${this.endpointService.baseUrl}/chat/completions`;
  }

  private get streamingRequestHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    };

    if (environment.bauth) {
      headers['Authorization'] = `Basic ${btoa(environment.bauth)}`;
    }

    return headers;
  }

  private async consumeEventStream(
    payload: ChatCompletionsRequest,
    observer: { next: (value: ChatCompletionStreamEvent) => void; error: (error: Error) => void; complete: () => void },
    signal: AbortSignal
  ): Promise<void> {
    const response = await fetch(this.completionsUrl, {
      method: 'POST',
      headers: this.streamingRequestHeaders,
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      throw await this.buildFetchError(response);
    }

    if (!response.body) {
      throw new Error('Streaming response body was empty.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      buffer = this.processStreamBuffer(buffer, observer, done);

      if (done) {
        break;
      }
    }

    observer.complete();
  }

  private processStreamBuffer(
    buffer: string,
    observer: { next: (value: ChatCompletionStreamEvent) => void },
    flushRemainder = false
  ): string {
    let normalizedBuffer = buffer.replace(/\r\n/g, '\n');
    let currentIndex = normalizedBuffer.indexOf('data:');

    if (currentIndex === -1) {
      return flushRemainder ? '' : normalizedBuffer;
    }

    while (currentIndex !== -1) {
      const nextIndex = normalizedBuffer.indexOf('data:', currentIndex + 5);

      if (nextIndex === -1) {
        if (!flushRemainder) {
          return normalizedBuffer.slice(currentIndex);
        }

        this.handleEventBlock(normalizedBuffer.slice(currentIndex), observer);
        return '';
      }

      this.handleEventBlock(normalizedBuffer.slice(currentIndex, nextIndex), observer);
      normalizedBuffer = normalizedBuffer.slice(nextIndex);
      currentIndex = normalizedBuffer.indexOf('data:');
    }

    return normalizedBuffer;
  }

  private handleEventBlock(
    eventBlock: string,
    observer: { next: (value: ChatCompletionStreamEvent) => void }
  ): void {
    const data = eventBlock
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .join('\n');

    if (!data || data === '[DONE]') {
      return;
    }

    try {
      const payload = JSON.parse(data) as Partial<ChatCompletionResponse> & Record<string, unknown>;
      const delta = this.extractStreamDelta(payload);

      if (delta) {
        observer.next({ type: 'delta', delta });
      }

      observer.next({ type: 'response', response: payload });
    } catch {
      // Ignore malformed partial chunks and keep waiting for the next SSE event.
    }
  }

  private extractStreamDelta(payload: Partial<ChatCompletionResponse> & Record<string, unknown>): string {
    const choices = Array.isArray(payload.choices) ? payload.choices : [];
    const firstChoice = choices[0] as
      | {
          delta?: { content?: string | Array<{ text?: string }> };
          message?: { content?: string };
        }
      | undefined;

    const deltaContent = firstChoice?.delta?.content;
    if (typeof deltaContent === 'string' && deltaContent) {
      return deltaContent;
    }

    if (Array.isArray(deltaContent)) {
      return deltaContent
        .map((item) => (typeof item?.text === 'string' ? item.text : ''))
        .join('');
    }

    return '';
  }

  private async buildFetchError(response: Response): Promise<Error> {
    const text = await response.text();

    if (text.trim()) {
      try {
        const payload = JSON.parse(text) as Record<string, unknown>;
        const message =
          (typeof payload['message'] === 'string' && payload['message']) ||
          (typeof payload['title'] === 'string' && payload['title']) ||
          (typeof payload['detail'] === 'string' && payload['detail']) ||
          (typeof payload['error'] === 'string' && payload['error']) ||
          text;

        return new Error(message);
      } catch {
        return new Error(text);
      }
    }

    return new Error(`Streaming chat request failed with status ${response.status}.`);
  }

  private buildAggregatedStreamResponse(
    payload: Partial<ChatCompletionResponse> & Record<string, unknown>,
    streamedContent: string,
    fallbackModel?: string
  ): ChatCompletionResponse {
    const existingMessage = payload.choices?.[0]?.message;
    const content =
      existingMessage?.content ||
      streamedContent ||
      'Stream completed without visible assistant text.';

    return {
      id: payload.id || `stream-${Date.now()}`,
      object: 'chat.completion',
      created: payload.created || Math.floor(Date.now() / 1000),
      model: payload.model || fallbackModel || 'streaming-model',
      tag: (payload.tag as string | null | undefined) ?? null,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content,
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

  private buildPayload(request: ChatCompletionsRequest): ChatCompletionsRequest {
    const trimmedMessages = this.buildStageCompatibleMessages(request);

    const payload: ChatCompletionsRequest = {
      model: request.model,
      messages: trimmedMessages,
    };

    this.assignIfPresent(payload, request, 'tag');
    this.assignIfPresent(payload, request, 'stream');
    this.assignIfPresent(payload, request, 'stream_interval');

    return payload;
  }

  private buildStageCompatibleMessages(request: ChatCompletionsRequest): ChatCompletionsRequest['messages'] {
    const trimmedMessages = request.messages
      .map((message) => ({
        role: message.role,
        content: message.content.trim(),
      }))
      .filter((message) => message.content.length > 0);

    const systemInstructions = trimmedMessages
      .filter((message) => message.role === 'system')
      .map((message) => message.content);
    const conversationMessages = trimmedMessages.filter((message) => message.role !== 'system');

    if (!systemInstructions.length) {
      return conversationMessages;
    }

    const instructionText = `System instruction:\n${systemInstructions.join('\n\n')}`;
    const firstUserMessageIndex = conversationMessages.findIndex((message) => message.role === 'user');

    if (firstUserMessageIndex === -1) {
      return [
        {
          role: 'user',
          content: instructionText,
        },
        ...conversationMessages,
      ];
    }

    return conversationMessages.map((message, index) =>
      index === firstUserMessageIndex
        ? {
            ...message,
            content: `${instructionText}\n\nUser message:\n${message.content}`,
          }
        : message
    );
  }

  private assignIfPresent<K extends keyof ChatCompletionsRequest>(
    payload: ChatCompletionsRequest,
    request: ChatCompletionsRequest,
    key: K
  ): void {
    if (request[key] !== undefined && request[key] !== null) {
      payload[key] = request[key];
    }
  }
}

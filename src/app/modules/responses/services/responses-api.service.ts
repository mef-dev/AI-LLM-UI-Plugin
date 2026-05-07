import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

import { EndpointService } from '../../../core/services/endpoint.service';
import { ResponsesRequest, ResponsesResponse, ResponsesStreamEvent } from '../models/responses.models';

@Injectable({ providedIn: 'root' })
export class ResponsesApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly endpointService: EndpointService
  ) {}

  createResponse(request: ResponsesRequest): Observable<ResponsesResponse> {
    return this.http
      .post<ResponsesResponse>(this.responsesUrl, request, {
        headers: this.requestHeaders,
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  createResponseStream(request: ResponsesRequest): Observable<ResponsesStreamEvent> {
    const payload = {
      ...request,
      stream: true,
    };

    return new Observable<ResponsesStreamEvent>((observer) => {
      const controller = new AbortController();

      this.consumeEventStream(payload, observer, controller.signal).catch((error) => {
        observer.error(error instanceof Error ? error : new Error('Responses streaming request failed.'));
      });

      return () => controller.abort();
    });
  }

  private get responsesUrl(): string {
    return `${this.endpointService.baseUrl}/responses`;
  }

  private get requestHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });

    if (environment.bauth) {
      headers = headers.set('Authorization', `Basic ${btoa(environment.bauth)}`);
    }

    return headers;
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

  private handleError(error: HttpErrorResponse): Observable<never> {
    const payload = error.error;

    if (payload && typeof payload === 'object') {
      const message =
        (payload.message as string | undefined) ||
        (payload.title as string | undefined) ||
        (payload.detail as string | undefined) ||
        error.message;

      return throwError(() => new Error(message));
    }

    if (typeof payload === 'string' && payload.trim()) {
      return throwError(() => new Error(payload));
    }

    return throwError(() => new Error(error.message || 'Responses request failed.'));
  }

  private async consumeEventStream(
    payload: ResponsesRequest,
    observer: { next: (value: ResponsesStreamEvent) => void; error: (error: Error) => void; complete: () => void },
    signal: AbortSignal
  ): Promise<void> {
    const response = await fetch(this.responsesUrl, {
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

    const contentType = response.headers.get('content-type')?.toLowerCase() || '';
    if (!contentType.includes('text/event-stream')) {
      const fallbackPayload = await response.text();
      this.handleNonSseResponse(fallbackPayload, observer);
      observer.complete();
      return;
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

  private handleNonSseResponse(
    rawBody: string,
    observer: { next: (value: ResponsesStreamEvent) => void; error: (error: Error) => void }
  ): void {
    const trimmed = rawBody.trim();
    if (!trimmed) {
      return;
    }

    try {
      const payload = JSON.parse(trimmed) as Record<string, unknown>;

      if (this.looksLikeErrorPayload(payload)) {
        observer.error(new Error(this.extractErrorMessage(payload)));
        return;
      }

      const response = this.extractResponse(payload, typeof payload['type'] === 'string' ? payload['type'] : 'response.json');
      if (response) {
        observer.next({
          kind: 'response',
          rawType: 'response.json',
          response,
        });
      }
    } catch {
      observer.error(new Error(trimmed));
    }
  }

  private processStreamBuffer(
    buffer: string,
    observer: { next: (value: ResponsesStreamEvent) => void; error: (error: Error) => void },
    flushRemainder = false
  ): string {
    let normalizedBuffer = buffer.replace(/\r\n/g, '\n');
    let separatorIndex = normalizedBuffer.indexOf('\n\n');

    while (separatorIndex !== -1) {
      const eventBlock = normalizedBuffer.slice(0, separatorIndex).trim();
      normalizedBuffer = normalizedBuffer.slice(separatorIndex + 2);

      if (eventBlock) {
        this.handleEventBlock(eventBlock, observer);
      }

      separatorIndex = normalizedBuffer.indexOf('\n\n');
    }

    if (flushRemainder && normalizedBuffer.trim()) {
      this.handleEventBlock(normalizedBuffer.trim(), observer);
      return '';
    }

    return normalizedBuffer;
  }

  private handleEventBlock(
    eventBlock: string,
    observer: { next: (value: ResponsesStreamEvent) => void; error: (error: Error) => void }
  ): void {
    const lines = eventBlock.split('\n');
    const dataLines: string[] = [];
    let eventName = '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith(':')) {
        continue;
      }

      if (trimmed.startsWith('event:')) {
        eventName = trimmed.slice(6).trim();
        continue;
      }

      if (trimmed.startsWith('data:')) {
        dataLines.push(trimmed.slice(5).trim());
      }
    }

    const data = dataLines.length ? dataLines.join('\n') : eventBlock;

    if (!data || data === '[DONE]') {
      return;
    }

    try {
      const payload = JSON.parse(data) as Record<string, unknown>;
      const rawType = typeof payload['type'] === 'string' ? payload['type'] : eventName;

      if (rawType === 'error') {
        observer.error(new Error(this.extractErrorMessage(payload)));
        return;
      }

      if (this.looksLikeErrorPayload(payload)) {
        observer.error(new Error(this.extractErrorMessage(payload)));
        return;
      }

      const delta = this.extractOutputTextDelta(payload, rawType);
      if (delta) {
        observer.next({
          kind: 'delta',
          rawType,
          delta,
        });
      }

      const response = this.extractResponse(payload, rawType);
      if (response) {
        observer.next({
          kind: 'response',
          rawType,
          response,
        });
      }
    } catch {
      // Ignore malformed partial events and keep waiting for the next SSE chunk.
    }
  }

  private extractOutputTextDelta(payload: Record<string, unknown>, rawType: string): string {
    if (rawType === 'response.output_text.delta') {
      const directDelta = this.extractTextValue(payload['delta']);
      if (directDelta) {
        return directDelta;
      }
    }

    const part = this.readRecord(payload['part']);
    const partText = this.extractTextFromContentRecord(part);
    if (partText) {
      return partText;
    }

    const item = this.readRecord(payload['item']);
    const itemText = this.extractTextFromItem(item);
    if (itemText) {
      return itemText;
    }

    return '';
  }

  private extractResponse(payload: Record<string, unknown>, rawType: string): ResponsesResponse | null {
    const embeddedResponse = this.readRecord(payload['response']);
    if (embeddedResponse) {
      return this.normalizeResponse(embeddedResponse);
    }

    if (rawType === 'response.output_text.done' && typeof payload['text'] === 'string') {
      return {
        output_text: payload['text'],
      };
    }

    const part = this.readRecord(payload['part']);
    const partText = this.extractTextFromContentRecord(part);
    if (partText) {
      return {
        output_text: partText,
      };
    }

    const item = this.readRecord(payload['item']);
    const itemText = this.extractTextFromItem(item);
    if (itemText) {
      return {
        output_text: itemText,
      };
    }

    if (!rawType.startsWith('response.')) {
      return null;
    }

    if (!this.looksLikeResponse(payload)) {
      return null;
    }

    return this.normalizeResponse(payload);
  }

  private normalizeResponse(payload: Record<string, unknown>): ResponsesResponse {
    return {
      id: typeof payload['id'] === 'string' ? payload['id'] : undefined,
      model: typeof payload['model'] === 'string' ? payload['model'] : undefined,
      status: typeof payload['status'] === 'string' ? payload['status'] : undefined,
      output_text: typeof payload['output_text'] === 'string' ? payload['output_text'] : undefined,
      output: Array.isArray(payload['output']) ? (payload['output'] as ResponsesResponse['output']) : undefined,
      usage: this.readRecord(payload['usage']) as ResponsesResponse['usage'],
    };
  }

  private looksLikeResponse(payload: Record<string, unknown>): boolean {
    return (
      typeof payload['id'] === 'string' ||
      typeof payload['model'] === 'string' ||
      typeof payload['status'] === 'string' ||
      typeof payload['output_text'] === 'string' ||
      Array.isArray(payload['output'])
    );
  }

  private extractErrorMessage(payload: Record<string, unknown>): string {
    const embeddedError = this.readRecord(payload['error']);
    const embeddedMessage = embeddedError && typeof embeddedError['message'] === 'string' ? embeddedError['message'] : '';
    const payloadMessage = typeof payload['message'] === 'string' ? payload['message'] : '';

    return embeddedMessage || payloadMessage || 'Responses streaming request failed.';
  }

  private looksLikeErrorPayload(payload: Record<string, unknown>): boolean {
    const status = payload['status'];
    return (
      (typeof status === 'number' && status >= 400) ||
      (typeof status === 'string' && Number(status) >= 400) ||
      (typeof payload['code'] === 'string' && typeof payload['message'] === 'string')
    );
  }

  private readRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private extractTextFromItem(item: Record<string, unknown> | null): string {
    if (!item) {
      return '';
    }

    const directText = this.extractTextFromContentRecord(item);
    if (directText) {
      return directText;
    }

    const content = Array.isArray(item['content']) ? item['content'] : [];
    return content
      .map((entry) => this.extractTextFromContentRecord(this.readRecord(entry)))
      .filter(Boolean)
      .join('');
  }

  private extractTextFromContentRecord(record: Record<string, unknown> | null): string {
    if (!record) {
      return '';
    }

    const type = typeof record['type'] === 'string' ? record['type'] : '';
    const text = this.extractTextValue(record['text']);
    const delta = this.extractTextValue(record['delta']);
    const summary = this.extractTextValue(record['summary']);

    const value = text || delta || summary;

    if (!value) {
      return '';
    }

    if (!type || type === 'text' || type === 'output_text' || type === 'summary_text') {
      return value;
    }

    return '';
  }

  private extractTextValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    const record = this.readRecord(value);
    if (!record) {
      return '';
    }

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

    return new Error(`Responses streaming request failed with status ${response.status}.`);
  }
}

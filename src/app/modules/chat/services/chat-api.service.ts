import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { EndpointService } from 'src/app/core/services/endpoint.service';
import { ChatCompletionResponse, ChatCompletionsRequest } from '../models/chat-completions.models';

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly endpointService: EndpointService
  ) {}

  createCompletion(request: ChatCompletionsRequest): Observable<ChatCompletionResponse> {
    const payload = this.buildPayload(request);

    return this.http
      .post<ChatCompletionResponse>(this.completionsUrl, payload, { headers: this.requestHeaders })
      .pipe(catchError((error) => this.handleError(error)));
  }

  private get completionsUrl(): string {
    return `${this.endpointService.baseUrl}/chat/completions`;
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

    return throwError(() => new Error(error.message || 'Chat request failed.'));
  }

  private buildPayload(request: ChatCompletionsRequest): ChatCompletionsRequest {
    const trimmedMessages = request.messages
      .map((message) => ({
        role: message.role,
        content: message.content.trim(),
      }))
      .filter((message) => message.content.length > 0);

    const payload: ChatCompletionsRequest = {
      model: request.model,
      messages: trimmedMessages,
    };

    if (
      request.temperature !== undefined &&
      request.temperature !== null &&
      request.temperature === 1
    ) {
      payload.temperature = request.temperature;
    }

    if (request.top_p !== undefined && request.top_p !== null) {
      payload.top_p = request.top_p;
    }

    if (request.max_tokens !== undefined && request.max_tokens !== null) {
      payload.max_completion_tokens = request.max_tokens;
    }

    if (request.stream !== undefined && request.stream !== null) {
      payload.stream = request.stream;
    }

    return payload;
  }
}

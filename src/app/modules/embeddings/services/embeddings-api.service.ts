import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { EndpointService } from 'src/app/core/services/endpoint.service';
import { EmbeddingsRequest, EmbeddingsResponse } from '../models/embeddings.models';

@Injectable({ providedIn: 'root' })
export class EmbeddingsApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly endpointService: EndpointService
  ) {}

  generateEmbeddings(request: EmbeddingsRequest): Observable<EmbeddingsResponse> {
    return this.http
      .post<EmbeddingsResponse>(this.embeddingsUrl, request, { headers: this.requestHeaders })
      .pipe(catchError((error) => this.handleError(error)));
  }

  private get embeddingsUrl(): string {
    return `${this.endpointService.baseUrl}/embeddings`;
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

    return throwError(() => new Error(error.message || 'Embeddings request failed.'));
  }
}

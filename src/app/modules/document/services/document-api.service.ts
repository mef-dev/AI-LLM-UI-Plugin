import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { EndpointService } from 'src/app/core/services/endpoint.service';
import {
  DocumentCollectionCreateRequest,
  DocumentCreateRequest,
  DocumentSearchRequest,
  DocumentSearchResponseEnvelope,
  DocumentSearchResult,
} from '../models/document-api.models';

@Injectable({ providedIn: 'root' })
export class DocumentApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly endpointService: EndpointService
  ) {}

  createCollection(request: DocumentCollectionCreateRequest): Observable<unknown> {
    return this.http
      .post<unknown>(`${this.documentUrl}/collection`, request, { headers: this.requestHeaders })
      .pipe(catchError((error) => this.handleError(error)));
  }

  createDocument(collectionName: string, request: DocumentCreateRequest): Observable<unknown> {
    return this.http
      .post<unknown>(`${this.documentUrl}/${encodeURIComponent(collectionName)}/documents`, request, {
        headers: this.requestHeaders,
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  searchCollection(
    collectionName: string,
    request: DocumentSearchRequest
  ): Observable<DocumentSearchResult[]> {
    return this.http
      .post<DocumentSearchResult[] | DocumentSearchResponseEnvelope>(
        `${this.documentUrl}/${encodeURIComponent(collectionName)}/search`,
        request,
        {
          headers: this.requestHeaders,
        }
      )
      .pipe(
        map((response) => this.normalizeSearchResults(response)),
        catchError((error) => this.handleError(error))
      );
  }

  private get documentUrl(): string {
    return `${this.endpointService.baseUrl}/document`;
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

    return throwError(() => new Error(error.message || 'Document request failed.'));
  }

  private normalizeSearchResults(
    response: DocumentSearchResult[] | DocumentSearchResponseEnvelope | null | undefined
  ): DocumentSearchResult[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (!response || typeof response !== 'object') {
      return [];
    }

    if (Array.isArray(response.results)) {
      return response.results;
    }

    if (Array.isArray(response.items)) {
      return response.items;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  }
}

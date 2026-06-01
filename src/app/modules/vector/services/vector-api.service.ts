import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { EndpointService } from '../../../core/services/endpoint.service';
import {
  VectorSearchRequest,
  VectorSearchResponse,
  VectorTableField,
  VectorTableSchema,
} from '../models/vector-api.models';

@Injectable({ providedIn: 'root' })
export class VectorApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly endpointService: EndpointService
  ) {}

  getTableSchema(tableName: string, provider: string): Observable<VectorTableSchema> {
    return this.http
      .post<VectorTableSchema | Record<string, unknown>>(
        `${this.vectorUrl}/${encodeURIComponent(tableName)}/table`,
        { provider },
        { headers: this.requestHeaders }
      )
      .pipe(
        map((response) => this.normalizeTableSchema(response)),
        catchError((error) => this.handleError(error))
      );
  }

  searchTable(tableName: string, request: VectorSearchRequest): Observable<Array<Record<string, unknown>>> {
    return this.http
      .post<VectorSearchResponse | Array<Record<string, unknown>>>(
        `${this.vectorUrl}/${encodeURIComponent(tableName)}/search`,
        request,
        { headers: this.requestHeaders }
      )
      .pipe(
        map((response) => this.normalizeSearchResults(response)),
        catchError((error) => this.handleError(error))
      );
  }

  private get vectorUrl(): string {
    return `${this.endpointService.baseUrl}/vector`;
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

  private normalizeTableSchema(response: VectorTableSchema | Record<string, unknown>): VectorTableSchema {
    const payload = (response ?? {}) as Record<string, unknown>;
    const rawFields = Array.isArray(payload['fields']) ? (payload['fields'] as Record<string, unknown>[]) : [];

    return {
      name: this.readString(payload['name']) || 'Unknown table',
      fields: rawFields.map((field) => this.normalizeField(field)),
      vectorSearch:
        payload['vectorSearch'] && typeof payload['vectorSearch'] === 'object'
          ? (payload['vectorSearch'] as VectorTableSchema['vectorSearch'])
          : undefined,
    };
  }

  private normalizeField(field: Record<string, unknown>): VectorTableField {
    return {
      name: this.readString(field['name']) || 'unnamed_field',
      type: this.readString(field['type']) || 'Unknown',
      dimensions: this.readNumber(field['dimensions']) ?? undefined,
      key: typeof field['key'] === 'boolean' ? field['key'] : undefined,
      autoIncrement: typeof field['autoIncrement'] === 'boolean' ? field['autoIncrement'] : undefined,
      vectorSearchProfile: this.readString(field['vectorSearchProfile']) || undefined,
    };
  }

  private normalizeSearchResults(
    response: VectorSearchResponse | Array<Record<string, unknown>> | null | undefined
  ): Array<Record<string, unknown>> {
    if (Array.isArray(response)) {
      return response;
    }

    if (!response || typeof response !== 'object') {
      return [];
    }

    return Array.isArray(response.value) ? response.value : [];
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 0) {
      return throwError(() => new Error('The vector request could not reach the API. Check network, CORS, certificate, or stage availability.'));
    }

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

    return throwError(() => new Error(error.message || 'Vector request failed.'));
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value : null;
  }

  private readNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }
}

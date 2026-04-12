import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { EndpointService } from 'src/app/core/services/endpoint.service';
import {
  LlmCreateRequest,
  LlmListFilters,
  LlmRegistryLocator,
  LlmUpdateRequest,
  LlmValidationResponse,
} from '../models/llm-registry.models';

@Injectable({ providedIn: 'root' })
export class LlmApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly endpointService: EndpointService
  ) {}

  getModels(filters: LlmListFilters = {}): Observable<LlmRegistryLocator[]> {
    return this.http
      .get<LlmRegistryLocator[]>(this.registryUrl, { headers: this.requestHeaders })
      .pipe(
        map((items) => this.applyFilters(items, filters)),
        catchError((error) => this.handleError(error))
      );
  }

  getModelById(id: string): Observable<LlmRegistryLocator> {
    return this.http
      .get<LlmRegistryLocator>(`${this.registryUrl}/${id}`, { headers: this.requestHeaders })
      .pipe(catchError((error) => this.handleError(error)));
  }

  createModel(request: LlmCreateRequest): Observable<LlmRegistryLocator> {
    return this.http
      .post<LlmRegistryLocator>(this.registryUrl, request, { headers: this.requestHeaders })
      .pipe(catchError((error) => this.handleError(error)));
  }

  updateModel(id: string, request: LlmUpdateRequest): Observable<LlmRegistryLocator> {
    return this.http
      .put<LlmRegistryLocator>(`${this.registryUrl}/${id}`, request, { headers: this.requestHeaders })
      .pipe(catchError((error) => this.handleError(error)));
  }

  deleteModel(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.registryUrl}/${id}`, { headers: this.requestHeaders })
      .pipe(catchError((error) => this.handleError(error)));
  }

  validateModel(id: string): Observable<LlmValidationResponse> {
    return this.http
      .post<LlmValidationResponse>(`${this.registryUrl}/${id}/validate`, null, {
        headers: this.requestHeaders,
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  private get registryUrl(): string {
    return `${this.endpointService.baseUrl}/llm`;
  }

  private get requestHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      Accept: 'application/json',
    });

    if (environment.bauth) {
      headers = headers.set('Authorization', `Basic ${btoa(environment.bauth)}`);
    }

    return headers;
  }

  private applyFilters(items: LlmRegistryLocator[], filters: LlmListFilters): LlmRegistryLocator[] {
    const normalizedQuery = (filters.modelName ?? '').trim().toLowerCase();

    return items.filter((item) => {
      const matchesStatus = !filters.status || item.status === filters.status;
      const matchesName =
        !normalizedQuery ||
        item.model_name.toLowerCase().includes(normalizedQuery) ||
        (item.display_name ?? '').toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesName;
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const payload = error.error;

    if (payload && typeof payload === 'object') {
      const message =
        (payload.message as string | undefined) ||
        (payload.title as string | undefined) ||
        error.message;

      return throwError(() => new Error(message));
    }

    if (typeof payload === 'string' && payload.trim()) {
      return throwError(() => new Error(payload));
    }

    return throwError(() => new Error(error.message || 'Request failed.'));
  }
}

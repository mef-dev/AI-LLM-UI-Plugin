import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { EndpointService } from 'src/app/core/services/endpoint.service';
import {
  DocumentCollectionCreateRequest,
  DocumentCollectionDetail,
  DocumentCollectionListItem,
  DocumentCollectionListResponse,
  DocumentCollectionUpdateRequest,
  DocumentDetail,
  DocumentCreateRequest,
  DocumentListItem,
  DocumentListResponse,
  DocumentSearchRequest,
  DocumentSearchResponseEnvelope,
  DocumentSearchResult,
  DocumentUploadRequest,
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

  listCollections(page = 1, pageSize = 20): Observable<DocumentCollectionListResponse> {
    return this.http
      .get<DocumentCollectionListResponse>(`${this.documentUrl}/collection`, {
        headers: this.requestHeaders,
        params: {
          page,
          pageSize,
        },
      })
      .pipe(
        map((response) => this.normalizeCollectionList(response)),
        catchError((error) => this.handleError(error))
      );
  }

  getCollection(name: string): Observable<DocumentCollectionDetail> {
    return this.http
      .get<DocumentCollectionDetail>(`${this.documentUrl}/collection/${encodeURIComponent(name)}`, {
        headers: this.requestHeaders,
      })
      .pipe(
        map((response) => this.normalizeCollectionDetail(response)),
        catchError((error) => this.handleError(error))
      );
  }

  updateCollection(name: string, request: DocumentCollectionUpdateRequest): Observable<unknown> {
    return this.http
      .put<unknown>(`${this.documentUrl}/collection/${encodeURIComponent(name)}`, request, {
        headers: this.requestHeaders,
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  deleteCollection(name: string): Observable<void> {
    return this.http
      .delete<void>(`${this.documentUrl}/collection/${encodeURIComponent(name)}`, {
        headers: this.requestHeaders,
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  createDocument(collectionName: string, request: DocumentCreateRequest): Observable<unknown> {
    return this.http
      .post<unknown>(`${this.documentUrl}/${encodeURIComponent(collectionName)}/documents`, request, {
        headers: this.requestHeaders,
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  listDocuments(
    collectionName: string,
    options: {
      page?: number;
      pageSize?: number;
      search?: string;
      tags?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Observable<DocumentListResponse> {
    return this.http
      .get<DocumentListResponse>(`${this.documentUrl}/${encodeURIComponent(collectionName)}/documents`, {
        headers: this.requestHeaders,
        params: {
          page: options.page ?? 1,
          pageSize: options.pageSize ?? 50,
          search: options.search ?? '',
          tags: options.tags ?? '',
          sortBy: options.sortBy ?? 'created_at',
          sortOrder: options.sortOrder ?? 'desc',
        },
      })
      .pipe(
        map((response) => this.normalizeDocumentList(response)),
        catchError((error) => this.handleError(error))
      );
  }

  getDocument(collectionName: string, documentId: string): Observable<DocumentDetail> {
    return this.http
      .get<DocumentDetail>(
        `${this.documentUrl}/${encodeURIComponent(collectionName)}/documents/${encodeURIComponent(documentId)}`,
        {
          headers: this.requestHeaders,
        }
      )
      .pipe(
        map((response) => this.normalizeDocumentDetail(response)),
        catchError((error) => this.handleError(error))
      );
  }

  deleteDocument(collectionName: string, documentId: string): Observable<void> {
    return this.http
      .delete<void>(
        `${this.documentUrl}/${encodeURIComponent(collectionName)}/documents/${encodeURIComponent(documentId)}`,
        {
          headers: this.requestHeaders,
        }
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  uploadDocument(
    collectionName: string,
    file: File,
    request: DocumentUploadRequest
  ): Observable<unknown> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    if (request.title?.trim()) {
      formData.append('title', request.title.trim());
    }

    if (request.tags?.length) {
      formData.append('tags', JSON.stringify(request.tags));
    }

    if (request.metadata && Object.keys(request.metadata).length) {
      formData.append('metadata', JSON.stringify(request.metadata));
    }

    formData.append('chunk_length', String(request.chunk_length));
    formData.append('chunk_overlap', String(request.chunk_overlap));

    return this.http
      .post<unknown>(
        `${this.documentUrl}/${encodeURIComponent(collectionName)}/documents/upload`,
        formData,
        {
          headers: this.uploadHeaders,
        }
      )
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

  private get uploadHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      Accept: 'application/json',
    });

    if (environment.bauth) {
      headers = headers.set('Authorization', `Basic ${btoa(environment.bauth)}`);
    }

    return headers;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 0) {
      return throwError(
        () =>
          new Error(
            'The browser could not complete the upload request. This is usually a network, CORS, certificate, or blocked preflight issue rather than a normal API validation error.'
          )
      );
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

  private normalizeCollectionList(
    response: DocumentCollectionListResponse | null | undefined
  ): DocumentCollectionListResponse {
    const items = Array.isArray(response?.items)
      ? response?.items.map((item) => this.normalizeCollectionDetail(item))
      : [];

    return {
      items,
      total_count: response?.total_count ?? items.length,
      page: response?.page ?? 1,
      page_size: response?.page_size ?? items.length,
    };
  }

  private normalizeCollectionDetail(
    response: Partial<DocumentCollectionDetail> | null | undefined
  ): DocumentCollectionDetail {
    const item = (response ?? {}) as Record<string, unknown>;

    return {
      name: this.readString(item['name']) || this.readString(item['Name']) || '',
      description: this.readString(item['description']) || this.readString(item['Description']) || undefined,
      model: this.readString(item['model']) || this.readString(item['Model']) || undefined,
      provider: this.readString(item['provider']) || this.readString(item['Provider']) || undefined,
      chunk_length:
        this.readNumber(item['chunk_length']) ?? this.readNumber(item['chunkLength']) ?? this.readNumber(item['ChunkLength']) ?? undefined,
      chunk_overlap:
        this.readNumber(item['chunk_overlap']) ?? this.readNumber(item['chunkOverlap']) ?? this.readNumber(item['ChunkOverlap']) ?? undefined,
      documents_count:
        this.readNumber(item['documents_count']) ?? this.readNumber(item['documentsCount']) ?? this.readNumber(item['DocumentsCount']) ?? undefined,
      chunks_count:
        this.readNumber(item['chunks_count']) ?? this.readNumber(item['chunksCount']) ?? this.readNumber(item['ChunksCount']) ?? undefined,
      created_at: this.readString(item['created_at']) || this.readString(item['createdAt']) || undefined,
      updated_at: this.readString(item['updated_at']) || this.readString(item['updatedAt']) || undefined,
    };
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value : null;
  }

  private readNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private normalizeDocumentList(response: DocumentListResponse | null | undefined): DocumentListResponse {
    const items = Array.isArray(response?.items)
      ? response.items.map((item) => this.normalizeDocumentListItem(item))
      : [];

    return {
      items,
      total_count: response?.total_count ?? items.length,
      page: response?.page ?? 1,
      page_size: response?.page_size ?? items.length,
    };
  }

  private normalizeDocumentListItem(response: Partial<DocumentListItem> | null | undefined): DocumentListItem {
    const item = (response ?? {}) as Record<string, unknown>;

    return {
      document_id:
        this.readString(item['document_id']) || this.readString(item['documentId']) || this.readString(item['DocumentId']) || '',
      title: this.readString(item['title']) || this.readString(item['Title']) || 'Untitled document',
      source: this.readString(item['source']) || this.readString(item['Source']) || undefined,
      tags: Array.isArray(item['tags'])
        ? (item['tags'] as unknown[]).filter((tag): tag is string => typeof tag === 'string' && !!tag.trim())
        : undefined,
      chunks_count:
        this.readNumber(item['chunks_count']) ?? this.readNumber(item['chunksCount']) ?? this.readNumber(item['ChunksCount']) ?? undefined,
      created_at: this.readString(item['created_at']) || this.readString(item['createdAt']) || undefined,
    };
  }

  private normalizeDocumentDetail(response: Partial<DocumentDetail> | null | undefined): DocumentDetail {
    const item = (response ?? {}) as Record<string, unknown>;
    const chunks = Array.isArray(item['chunks'])
      ? (item['chunks'] as Record<string, unknown>[]).map((chunk) => ({
          id: this.readNumber(chunk['id']) ?? 0,
          document_id:
            this.readString(chunk['document_id']) || this.readString(chunk['documentId']) || '',
          chunk_index:
            this.readNumber(chunk['chunk_index']) ?? this.readNumber(chunk['chunkIndex']) ?? 0,
          content: this.readString(chunk['content']) || '',
          metadata:
            chunk['metadata'] && typeof chunk['metadata'] === 'object' && !Array.isArray(chunk['metadata'])
              ? (chunk['metadata'] as Record<string, unknown>)
              : undefined,
        }))
      : [];

    return {
      document_id:
        this.readString(item['document_id']) || this.readString(item['documentId']) || this.readString(item['DocumentId']) || '',
      title: this.readString(item['title']) || this.readString(item['Title']) || 'Untitled document',
      content: this.readString(item['content']) || this.readString(item['Content']) || '',
      chunks,
      source: this.readString(item['source']) || this.readString(item['Source']) || undefined,
      tags: Array.isArray(item['tags'])
        ? (item['tags'] as unknown[]).filter((tag): tag is string => typeof tag === 'string' && !!tag.trim())
        : undefined,
      metadata:
        item['metadata'] && typeof item['metadata'] === 'object' && !Array.isArray(item['metadata'])
          ? (item['metadata'] as Record<string, unknown>)
          : undefined,
      chunks_count:
        this.readNumber(item['chunks_count']) ?? this.readNumber(item['chunksCount']) ?? this.readNumber(item['ChunksCount']) ?? undefined,
      created_at: this.readString(item['created_at']) || this.readString(item['createdAt']) || undefined,
    };
  }
}

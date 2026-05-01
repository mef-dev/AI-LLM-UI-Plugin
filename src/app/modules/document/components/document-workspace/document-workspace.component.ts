import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, Renderer2 } from '@angular/core';
import {
  DocumentCollectionCreateRequest,
  DocumentCollectionDetail,
  DocumentCollectionListItem,
  DocumentCreateRequest,
  DocumentDetail,
  DocumentListItem,
  DocumentSearchRequest,
  DocumentSearchResult,
  DocumentCollectionUpdateRequest,
  DocumentUploadRequest,
} from '../../models/document-api.models';
import { DocumentApiService } from '../../services/document-api.service';

@Component({
  selector: 'app-document-workspace',
  standalone: false,
  templateUrl: './document-workspace.component.html',
  styleUrls: ['./document-workspace.component.scss']
})
export class DocumentWorkspaceComponent {
  collectionName = 'my-collection';
  collectionDescription = 'Knowledge base with multilingual BGE-M3 embeddings';
  model = 'BAAI/bge-m3';
  chunkLength = 256;
  chunkOverlap = 50;
  provider = 'Pgvector';

  documentTitle = 'Getting Started Guide';
  documentContent =
    'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.';
  documentSource = 'https://docs.example.com/getting-started';
  documentTags = 'guide, onboarding';
  documentMetadata = '{\n  "author": "John Doe",\n  "category": "documentation"\n}';
  uploadTitle = 'Uploaded guide';
  uploadTags = 'uploaded, pdf';
  uploadMetadata = '{\n  "source_type": "file_upload"\n}';
  selectedUploadFile: File | null = null;
  selectedUploadFileName = '';

  searchQuery = 'there are many variations of passages of Lorem Ipsum available';
  topK = 5;
  minScore = 0.7;
  includeContent = true;
  includeMetadata = true;
  metric = 'cosine';
  scoreMode = 'similarity';

  loadingAction: 'collection' | 'document' | 'upload' | 'search' | null = null;
  errorMessage = '';
  successMessage = '';
  searchResults: DocumentSearchResult[] = [];
  createdCollection = false;
  createdDocumentSummary: string | null = null;
  activeCollectionName = '';
  collectionsModalVisible = false;
  collectionsLoading = false;
  collectionDetailsLoading = false;
  collectionSaveLoading = false;
  collectionDeleteLoading = false;
  collectionsErrorMessage = '';
  collectionModalMessage = '';
  existingCollections: DocumentCollectionListItem[] = [];
  selectedManagedCollection: DocumentCollectionDetail | null = null;
  managedCollectionDescription = '';
  managedCollectionChunkLength = 512;
  managedCollectionChunkOverlap = 50;
  collectionDocumentsLoading = false;
  collectionDocumentsErrorMessage = '';
  collectionDocuments: DocumentListItem[] = [];
  selectedDocument: DocumentDetail | null = null;
  documentPreviewLoading = false;
  documentDeleteLoading = false;
  documentViewerVisible = false;
  documentBrowserVisible = false;
  documentBrowserCollection: DocumentCollectionDetail | null = null;
  documentSortBy: 'title' | 'created_at' | 'chunks_count' = 'created_at';
  documentSortOrder: 'asc' | 'desc' = 'desc';

  constructor(
    private readonly documentApi: DocumentApiService,
    private readonly renderer: Renderer2,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  ngOnDestroy(): void {
    this.unlockBackgroundScroll();
  }

  createCollection(): void {
    const collectionName = this.collectionName.trim();

    if (!collectionName) {
      this.errorMessage = 'Collection name is required before creating a collection.';
      return;
    }

    const sanitizedName = this.sanitizeName(collectionName);
    const request: DocumentCollectionCreateRequest = {
      name: collectionName,
      description: this.collectionDescription.trim(),
      model: this.model,
      chunk_length: this.chunkLength,
      chunk_overlap: this.chunkOverlap,
      provider: this.provider,
      vector_search: {
        algorithms: [
          {
            name: `${sanitizedName}_hnsw`,
            kind: 'hnsw',
            hnsw_parameters: {
              m: 16,
              ef_construction: 200,
              ef_search: 100,
              metric: this.metric,
            },
          },
        ],
        profiles: [
          {
            name: `${sanitizedName}_default_profile`,
            algorithm: `${sanitizedName}_hnsw`,
          },
        ],
      },
    };

    this.loadingAction = 'collection';
    this.clearMessages();

    this.documentApi.createCollection(request).subscribe({
      next: () => {
        this.loadingAction = null;
        this.createdCollection = true;
        this.activeCollectionName = collectionName;
        this.successMessage = `Collection "${collectionName}" created successfully.`;
      },
      error: (error: Error) => {
        this.loadingAction = null;
        this.errorMessage = error.message;
      },
    });
  }

  createDocument(): void {
    const collectionName = this.activeCollectionName || this.collectionName.trim();

    if (!collectionName) {
      this.errorMessage = 'Enter or create a collection first.';
      return;
    }

    if (!this.documentTitle.trim() || !this.documentContent.trim()) {
      this.errorMessage = 'Document title and content are required before adding a document.';
      return;
    }

    const metadata = this.parseMetadata();
    if (metadata === null) {
      return;
    }

    const request: DocumentCreateRequest = {
      title: this.documentTitle.trim(),
      content: this.documentContent.trim(),
      source: this.documentSource.trim() || undefined,
      tags: this.documentTags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      metadata,
      chunk_length: this.chunkLength,
      chunk_overlap: this.chunkOverlap,
    };

    this.loadingAction = 'document';
    this.clearMessages();

    this.documentApi.createDocument(collectionName, request).subscribe({
      next: () => {
        this.loadingAction = null;
        this.createdDocumentSummary = `Document "${request.title}" was added to ${collectionName}.`;
        this.successMessage = this.createdDocumentSummary;
      },
      error: (error: Error) => {
        this.loadingAction = null;
        this.errorMessage = error.message;
      },
    });
  }

  uploadDocument(): void {
    const collectionName = this.activeCollectionName || this.collectionName.trim();

    if (!collectionName) {
      this.errorMessage = 'Enter or create a collection first.';
      return;
    }

    if (!this.selectedUploadFile) {
      this.errorMessage = 'Choose a file before uploading.';
      return;
    }

    const metadata = this.parseUploadMetadata();
    if (metadata === null) {
      return;
    }

    const request: DocumentUploadRequest = {
      title: this.uploadTitle.trim() || this.selectedUploadFile.name,
      tags: this.uploadTags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      metadata,
      chunk_length: this.chunkLength,
      chunk_overlap: this.chunkOverlap,
    };

    this.loadingAction = 'upload';
    this.clearMessages();

    this.documentApi.uploadDocument(collectionName, this.selectedUploadFile, request).subscribe({
      next: () => {
        this.loadingAction = null;
        this.createdDocumentSummary = `File "${this.selectedUploadFile?.name}" was uploaded to ${collectionName}.`;
        this.successMessage = this.createdDocumentSummary;
      },
      error: (error: Error) => {
        this.loadingAction = null;
        this.errorMessage = error.message;
      },
    });
  }

  searchCollection(): void {
    const collectionName = this.activeCollectionName || this.collectionName.trim();

    if (!collectionName) {
      this.errorMessage = 'Enter or create a collection before searching.';
      return;
    }

    if (!this.searchQuery.trim()) {
      this.errorMessage = 'Search query is required.';
      return;
    }

    const request: DocumentSearchRequest = {
      query: this.searchQuery.trim(),
      top_k: this.topK,
      metric: this.metric,
      score_mode: this.scoreMode,
      min_score: this.minScore,
      include_content: this.includeContent,
      include_metadata: this.includeMetadata,
    };

    this.loadingAction = 'search';
    this.clearMessages();

    this.documentApi.searchCollection(collectionName, request).subscribe({
      next: (results) => {
        this.loadingAction = null;
        this.searchResults = results;
        this.successMessage = `Search completed with ${results.length} result(s).`;
      },
      error: (error: Error) => {
        this.loadingAction = null;
        this.errorMessage = error.message;
        this.searchResults = [];
      },
    });
  }

  get isCreatingCollection(): boolean {
    return this.loadingAction === 'collection';
  }

  get isCreatingDocument(): boolean {
    return this.loadingAction === 'document';
  }

  get isSearching(): boolean {
    return this.loadingAction === 'search';
  }

  get isUploadingDocument(): boolean {
    return this.loadingAction === 'upload';
  }

  get hasActiveCollection(): boolean {
    return !!this.activeCollectionName;
  }

  useCurrentCollectionName(): void {
    const collectionName = this.collectionName.trim();

    if (!collectionName) {
      this.errorMessage = 'Enter a collection name first.';
      return;
    }

    this.activeCollectionName = collectionName;
    this.createdCollection = false;
    this.successMessage = `Working with collection "${collectionName}".`;
    this.errorMessage = '';
  }

  clearSearchResults(): void {
    this.searchResults = [];
    this.successMessage = '';
    this.errorMessage = '';
  }

  openCollectionsModal(): void {
    this.collectionsModalVisible = true;
    this.collectionsErrorMessage = '';
    this.collectionModalMessage = '';
    this.updateBackgroundScrollLock();
    this.loadCollections();
  }

  closeCollectionsModal(): void {
    this.collectionsModalVisible = false;
    this.collectionsLoading = false;
    this.collectionDetailsLoading = false;
    this.collectionSaveLoading = false;
    this.collectionDeleteLoading = false;
    this.collectionsErrorMessage = '';
    this.collectionModalMessage = '';
    this.updateBackgroundScrollLock();
  }

  loadCollections(): void {
    this.collectionsLoading = true;
    this.collectionsErrorMessage = '';

    this.documentApi.listCollections().subscribe({
      next: (response) => {
        this.collectionsLoading = false;
        this.existingCollections = response.items ?? [];

        if (!this.existingCollections.length) {
          this.selectedManagedCollection = null;
          return;
        }

        const preferredCollectionName =
          this.selectedManagedCollection?.name || this.activeCollectionName || this.existingCollections[0]?.name;

        if (preferredCollectionName) {
          this.selectManagedCollection(preferredCollectionName);
        }
      },
      error: (error: Error) => {
        this.collectionsLoading = false;
        this.collectionsErrorMessage = error.message;
      },
    });
  }

  selectManagedCollection(name: string): void {
    this.collectionDetailsLoading = true;
    this.collectionsErrorMessage = '';
    this.collectionModalMessage = '';

    this.documentApi.getCollection(name).subscribe({
      next: (collection) => {
        this.collectionDetailsLoading = false;
        this.selectedManagedCollection = collection;
        this.managedCollectionDescription = collection.description ?? '';
        this.managedCollectionChunkLength = collection.chunk_length ?? 512;
        this.managedCollectionChunkOverlap = collection.chunk_overlap ?? 50;
      },
      error: (error: Error) => {
        this.collectionDetailsLoading = false;
        this.collectionsErrorMessage = error.message;
      },
    });
  }

  useManagedCollection(name: string): void {
    this.activeCollectionName = name;
    this.collectionName = name;
    this.collectionsModalVisible = false;
    this.successMessage = `Working with collection "${name}".`;
    this.errorMessage = '';
    this.updateBackgroundScrollLock();
  }

  getManagedCollectionDocumentsCount(collection: DocumentCollectionListItem): number {
    if (collection.name === this.selectedManagedCollection?.name) {
      return this.selectedManagedCollection.documents_count ?? collection.documents_count ?? 0;
    }

    return collection.documents_count ?? 0;
  }

  getManagedCollectionChunksCount(collection: DocumentCollectionListItem): number {
    if (collection.name === this.selectedManagedCollection?.name) {
      return this.selectedManagedCollection.chunks_count ?? collection.chunks_count ?? 0;
    }

    return collection.chunks_count ?? 0;
  }

  saveManagedCollection(): void {
    if (!this.selectedManagedCollection?.name) {
      return;
    }

    const request: DocumentCollectionUpdateRequest = {
      description: this.managedCollectionDescription.trim(),
      chunk_length: this.managedCollectionChunkLength,
      chunk_overlap: this.managedCollectionChunkOverlap,
    };

    this.collectionSaveLoading = true;
    this.collectionsErrorMessage = '';
    this.collectionModalMessage = '';

    this.documentApi.updateCollection(this.selectedManagedCollection.name, request).subscribe({
      next: () => {
        this.collectionSaveLoading = false;
        this.collectionModalMessage = `Collection "${this.selectedManagedCollection?.name}" updated.`;
        this.loadCollections();
      },
      error: (error: Error) => {
        this.collectionSaveLoading = false;
        this.collectionsErrorMessage = error.message;
      },
    });
  }

  deleteManagedCollection(): void {
    const collectionName = this.selectedManagedCollection?.name;

    if (!collectionName) {
      return;
    }

    const confirmed = window.confirm(
      `Delete collection "${collectionName}"? This will remove its documents and chunks too.`
    );

    if (!confirmed) {
      return;
    }

    this.collectionDeleteLoading = true;
    this.collectionsErrorMessage = '';
    this.collectionModalMessage = '';

    this.documentApi.deleteCollection(collectionName).subscribe({
      next: () => {
        this.collectionDeleteLoading = false;
        this.collectionModalMessage = `Collection "${collectionName}" deleted.`;
        this.existingCollections = this.existingCollections.filter((collection) => collection.name !== collectionName);
        this.selectedManagedCollection = null;

        if (this.activeCollectionName === collectionName) {
          this.activeCollectionName = '';
        }

        if (this.collectionName === collectionName) {
          this.collectionName = '';
        }

        if (this.existingCollections[0]?.name) {
          this.selectManagedCollection(this.existingCollections[0].name);
        }
      },
      error: (error: Error) => {
        this.collectionDeleteLoading = false;
        this.collectionsErrorMessage = error.message;
      },
    });
  }

  onUploadFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.selectedUploadFile = file;
    this.selectedUploadFileName = file?.name ?? '';

    if (file && !this.uploadTitle.trim()) {
      this.uploadTitle = file.name;
    }
  }

  getDocumentMetadataValue(
    result: DocumentSearchResult,
    key: 'author' | 'category'
  ): string | null {
    const documentMetadata = result.metadata?.['document'];

    if (!documentMetadata || typeof documentMetadata !== 'object' || Array.isArray(documentMetadata)) {
      return null;
    }

    const value = (documentMetadata as Record<string, unknown>)[key];
    return typeof value === 'string' && value.trim() ? value : null;
  }

  setDocumentSort(sortBy: 'title' | 'created_at' | 'chunks_count'): void {
    if (this.documentSortBy === sortBy) {
      this.documentSortOrder = this.documentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.documentSortBy = sortBy;
      this.documentSortOrder = sortBy === 'title' ? 'asc' : 'desc';
    }

    if (this.documentBrowserCollection?.name) {
      this.loadCollectionDocuments(this.documentBrowserCollection.name);
    }
  }

  selectDocument(documentId: string): void {
    const collectionName = this.documentBrowserCollection?.name;

    if (!collectionName || !documentId) {
      return;
    }

    this.documentPreviewLoading = true;
    this.collectionDocumentsErrorMessage = '';

    this.documentApi.getDocument(collectionName, documentId).subscribe({
      next: (document) => {
        this.documentPreviewLoading = false;
        this.selectedDocument = document;
      },
      error: (error: Error) => {
        this.documentPreviewLoading = false;
        this.collectionDocumentsErrorMessage = error.message;
      },
    });
  }

  openDocumentViewer(): void {
    if (!this.selectedDocument) {
      return;
    }

    this.documentViewerVisible = true;
    this.updateBackgroundScrollLock();
  }

  closeDocumentViewer(): void {
    this.documentViewerVisible = false;
    this.updateBackgroundScrollLock();
  }

  openDocumentBrowser(collectionName = this.activeCollectionName || this.selectedManagedCollection?.name || ''): void {
    if (!collectionName) {
      this.errorMessage = 'Choose or create a collection first.';
      return;
    }

    this.documentBrowserVisible = true;
    this.collectionDocumentsErrorMessage = '';
    this.updateBackgroundScrollLock();

    this.documentApi.getCollection(collectionName).subscribe({
      next: (collection) => {
        this.documentBrowserCollection = collection;
        this.loadCollectionDocuments(collection.name);
      },
      error: (error: Error) => {
        this.collectionDocumentsErrorMessage = error.message;
      },
    });
  }

  closeDocumentBrowser(): void {
    this.documentBrowserVisible = false;
    this.collectionDocumentsLoading = false;
    this.documentPreviewLoading = false;
    this.documentDeleteLoading = false;
    this.collectionDocumentsErrorMessage = '';
    this.collectionDocuments = [];
    this.selectedDocument = null;
    this.documentBrowserCollection = null;
    this.updateBackgroundScrollLock();
  }

  deleteSelectedDocument(): void {
    const collectionName = this.documentBrowserCollection?.name;
    const documentId = this.selectedDocument?.document_id;
    const title = this.selectedDocument?.title || 'this document';

    if (!collectionName || !documentId) {
      return;
    }

    const confirmed = window.confirm(`Delete "${title}" from "${collectionName}"?`);
    if (!confirmed) {
      return;
    }

    this.documentDeleteLoading = true;
    this.collectionDocumentsErrorMessage = '';

    this.documentApi.deleteDocument(collectionName, documentId).subscribe({
      next: () => {
        const deletedChunksCount = this.selectedDocument?.chunks_count ?? 0;
        this.documentDeleteLoading = false;
        this.collectionDocuments = this.collectionDocuments.filter((document) => document.document_id !== documentId);
        this.selectedDocument = null;
        this.documentBrowserCollection = this.documentBrowserCollection
          ? {
              ...this.documentBrowserCollection,
              documents_count: Math.max((this.documentBrowserCollection.documents_count ?? 1) - 1, 0),
              chunks_count: Math.max(
                (this.documentBrowserCollection.chunks_count ?? 0) - deletedChunksCount,
                0
              ),
            }
          : null;
        this.selectedManagedCollection =
          this.selectedManagedCollection?.name === collectionName && this.documentBrowserCollection
            ? { ...this.documentBrowserCollection }
            : this.selectedManagedCollection;
        this.existingCollections = this.existingCollections.map((collection) =>
          collection.name === collectionName
            ? {
                ...collection,
                documents_count: Math.max((collection.documents_count ?? 1) - 1, 0),
                chunks_count: Math.max((collection.chunks_count ?? 0) - deletedChunksCount, 0),
              }
            : collection
        );

        if (this.collectionDocuments[0]?.document_id) {
          this.selectDocument(this.collectionDocuments[0].document_id);
        }
      },
      error: (error: Error) => {
        this.documentDeleteLoading = false;
        this.collectionDocumentsErrorMessage = error.message;
      },
    });
  }

  get isDocumentSortActiveByTitle(): boolean {
    return this.documentSortBy === 'title';
  }

  get isDocumentSortActiveByCreated(): boolean {
    return this.documentSortBy === 'created_at';
  }

  get isDocumentSortActiveByChunks(): boolean {
    return this.documentSortBy === 'chunks_count';
  }

  getDocumentSortIndicator(sortBy: 'title' | 'created_at' | 'chunks_count'): string {
    if (this.documentSortBy !== sortBy) {
      return '↕';
    }

    return this.documentSortOrder === 'asc' ? '↑' : '↓';
  }

  isDocumentSelected(document: DocumentListItem): boolean {
    return document.document_id === this.selectedDocument?.document_id;
  }

  get documentBrowserTitle(): string {
    return this.documentBrowserCollection?.name || 'Collection browser';
  }

  getSelectedDocumentPreview(): string {
    const content = this.selectedDocument?.content?.trim();

    if (!content) {
      return 'No document content was returned for preview.';
    }

    return content.length > 600 ? `${content.slice(0, 600).trim()}…` : content;
  }

  private loadCollectionDocuments(collectionName: string): void {
    this.collectionDocumentsLoading = true;
    this.collectionDocumentsErrorMessage = '';
    this.collectionDocuments = [];
    this.selectedDocument = null;

    this.documentApi
      .listDocuments(collectionName, {
        sortBy: this.documentSortBy,
        sortOrder: this.documentSortOrder,
      })
      .subscribe({
        next: (response) => {
          this.collectionDocumentsLoading = false;
          this.collectionDocuments = response.items ?? [];

          if (this.collectionDocuments[0]?.document_id) {
            this.selectDocument(this.collectionDocuments[0].document_id);
          }
        },
        error: (error: Error) => {
          this.collectionDocumentsLoading = false;
          this.collectionDocumentsErrorMessage = error.message;
        },
      });
  }

  private parseMetadata(): Record<string, unknown> | undefined | null {
    const trimmed = this.documentMetadata.trim();

    if (!trimmed) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(trimmed);

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        this.errorMessage = 'Document metadata must be a JSON object.';
        return null;
      }

      return parsed as Record<string, unknown>;
    } catch {
      this.errorMessage = 'Document metadata must be valid JSON.';
      return null;
    }
  }

  private parseUploadMetadata(): Record<string, unknown> | undefined | null {
    const trimmed = this.uploadMetadata.trim();

    if (!trimmed) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(trimmed);

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        this.errorMessage = 'Upload metadata must be a JSON object.';
        return null;
      }

      return parsed as Record<string, unknown>;
    } catch {
      this.errorMessage = 'Upload metadata must be valid JSON.';
      return null;
    }
  }

  private sanitizeName(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'default';
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private updateBackgroundScrollLock(): void {
    const shouldLock = this.collectionsModalVisible || this.documentBrowserVisible || this.documentViewerVisible;

    if (shouldLock) {
      this.renderer.setStyle(this.document.documentElement, 'overflow', 'hidden');
      this.renderer.setStyle(this.document.body, 'overflow', 'hidden');
      return;
    }

    this.unlockBackgroundScroll();
  }

  private unlockBackgroundScroll(): void {
    this.renderer.removeStyle(this.document.body, 'overflow');
    this.renderer.removeStyle(this.document.documentElement, 'overflow');
  }
}

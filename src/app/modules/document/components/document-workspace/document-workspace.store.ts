import { DOCUMENT } from '@angular/common';
import { ElementRef, Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import {
  DocumentCollectionCreateRequest,
  DocumentCollectionDetail,
  DocumentCollectionListItem,
  DocumentCollectionUpdateRequest,
  DocumentCreateRequest,
  DocumentDetail,
  DocumentListItem,
  DocumentSearchRequest,
  DocumentSearchResult,
  DocumentUploadRequest,
} from '../../models/document-api.models';
import { DocumentApiService } from '../../services/document-api.service';

@Injectable()
export class DocumentWorkspaceStore {
  private static readonly defaultCollectionName = 'my-collection';
  private static readonly defaultCollectionDescription = 'Knowledge base with multilingual BGE-M3 embeddings';
  private static readonly defaultModel = 'BAAI/bge-m3';
  private static readonly defaultChunkLength = 256;
  private static readonly defaultChunkOverlap = 50;
  private static readonly defaultProvider = 'Pgvector';
  private static readonly uploadMessageDismissMs = 15000;

  readonly createNewCollectionOption = '__create_new_collection__';
  readonly collectionModelChoices = ['BAAI/bge-m3', 'gte-base'];
  readonly providerChoices = ['Pgvector', 'pgvector'];
  readonly metricChoices = ['cosine', 'euclidean', 'dotProduct'];
  readonly scoreModeChoices = ['similarity', 'distance'];
  readonly fieldHelp = {
    topK: 'Maximum number of matching results to return from the retrieval request.',
    minScore: 'Minimum score threshold required before a result is shown.',
    metric: 'Distance or similarity metric used when comparing vectors during retrieval.',
    scoreMode: 'Controls whether the backend returns similarity-style scores or distance-style scores.',
    includeContent: 'Include the matched chunk text in the search results payload.',
    includeMetadata: 'Include saved metadata in the search results payload.',
  } as const;
  readonly searchQueryPlaceholder = 'there are many variations of passages of Lorem Ipsum available';

  collectionName = '';
  collectionDescription = '';
  model = DocumentWorkspaceStore.defaultModel;
  chunkLength = DocumentWorkspaceStore.defaultChunkLength;
  chunkOverlap = DocumentWorkspaceStore.defaultChunkOverlap;
  provider = DocumentWorkspaceStore.defaultProvider;

  documentTitle = '';
  documentContent = '';
  documentSource = '';
  documentTags = '';
  documentMetadata = '';
  uploadTitle = '';
  uploadTags = '';
  uploadMetadata = '';
  selectedUploadFile: File | null = null;
  selectedUploadFileName = '';

  searchQuery = '';
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
  selectedCollectionOption = this.createNewCollectionOption;
  collectionSelectorLoading = false;
  collectionPresetLoading = false;
  collectionsModalVisible = false;
  collectionsModalClosing = false;
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
  documentViewerClosing = false;
  documentBrowserVisible = false;
  documentBrowserClosing = false;
  documentBrowserCollection: DocumentCollectionDetail | null = null;
  documentSortBy: 'title' | 'created_at' | 'chunks_count' = 'created_at';
  documentSortOrder: 'asc' | 'desc' = 'desc';

  private readonly renderer: Renderer2;
  private statusViewport?: ElementRef<HTMLElement>;
  private modalCloseTimerId: number | null = null;
  private messageTimerId: number | null = null;

  constructor(
    private readonly documentApi: DocumentApiService,
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private readonly document: Document
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  init(): void {
    this.refreshCollectionOptions();
  }

  destroy(): void {
    if (this.modalCloseTimerId !== null) {
      window.clearTimeout(this.modalCloseTimerId);
      this.modalCloseTimerId = null;
    }

    if (this.messageTimerId !== null) {
      window.clearTimeout(this.messageTimerId);
      this.messageTimerId = null;
    }

    this.unlockBackgroundScroll();
  }

  setStatusViewport(statusViewport?: ElementRef<HTMLElement>): void {
    this.statusViewport = statusViewport;
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
      chunkLength: this.chunkLength,
      chunkOverlap: this.chunkOverlap,
      provider: this.provider,
      vectorSearch: {
        algorithms: [
          {
            name: `${sanitizedName}_hnsw`,
            kind: 'hnsw',
            hnswParameters: {
              m: 16,
              efConstruction: 200,
              efSearch: 100,
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
        this.syncCollectionSelector(collectionName);
        this.refreshCollectionOptions(collectionName);
        this.successMessage = `Collection "${collectionName}" created successfully.`;
      },
      error: (error: Error) => {
        this.loadingAction = null;
        this.showUploadMessage('error', error.message);
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
      chunkLength: this.chunkLength,
      chunkOverlap: this.chunkOverlap,
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
      chunkLength: this.chunkLength,
      chunkOverlap: this.chunkOverlap,
    };

    this.loadingAction = 'upload';
    this.clearMessages();

    this.documentApi.uploadDocument(collectionName, this.selectedUploadFile, request).subscribe({
      next: () => {
        this.loadingAction = null;
        this.createdDocumentSummary = `File "${this.selectedUploadFile?.name}" was uploaded to ${collectionName}.`;
        this.showUploadMessage('success', this.createdDocumentSummary);
      },
      error: (error: Error) => {
        this.loadingAction = null;
        this.showUploadMessage('error', error.message);
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
      topK: this.topK,
      metric: this.metric,
      scoreMode: this.scoreMode,
      tags: [],
      minScore: this.minScore,
      includeContent: this.includeContent,
      includeMetadata: this.includeMetadata,
      select: null,
      searchFields: null,
      decorators: {},
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

  get collectionModelOptions(): string[] {
    return this.withCurrentOption(this.collectionModelChoices, this.model);
  }

  get providerOptions(): string[] {
    return this.withCurrentOption(this.providerChoices, this.provider);
  }

  get metricOptions(): string[] {
    return this.withCurrentOption(this.metricChoices, this.metric);
  }

  get scoreModeOptions(): string[] {
    return this.withCurrentOption(this.scoreModeChoices, this.scoreMode);
  }

  refreshCollectionOptions(preferredCollectionName = this.selectedCollectionOption): void {
    this.collectionSelectorLoading = true;

    this.documentApi.listCollections().subscribe({
      next: (response) => {
        this.collectionSelectorLoading = false;
        this.existingCollections = response.items ?? [];
        this.syncCollectionSelector(preferredCollectionName);
      },
      error: (error: Error) => {
        this.collectionSelectorLoading = false;
        this.errorMessage = error.message;
      },
    });
  }

  onCollectionPresetChange(name: string): void {
    if (name === this.createNewCollectionOption) {
      this.startNewCollectionDraft();
      return;
    }

    this.collectionPresetLoading = true;
    this.clearMessages();

    this.documentApi.getCollection(name).subscribe({
      next: (collection) => {
        this.collectionPresetLoading = false;
        this.applyCollectionPreset(collection);
      },
      error: (error: Error) => {
        this.collectionPresetLoading = false;
        this.errorMessage = error.message;
      },
    });
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
    if (!this.collectionsModalVisible) {
      return;
    }

    this.collectionsModalClosing = true;
    this.scheduleModalClose(() => {
      this.collectionsModalVisible = false;
      this.collectionsModalClosing = false;
      this.collectionsLoading = false;
      this.collectionDetailsLoading = false;
      this.collectionSaveLoading = false;
      this.collectionDeleteLoading = false;
      this.collectionsErrorMessage = '';
      this.collectionModalMessage = '';
      this.updateBackgroundScrollLock();
    });
  }

  loadCollections(): void {
    this.collectionsLoading = true;
    this.collectionsErrorMessage = '';

    this.documentApi.listCollections().subscribe({
      next: (response) => {
        this.collectionsLoading = false;
        this.existingCollections = response.items ?? [];
        this.syncCollectionSelector();

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
    if (this.selectedManagedCollection?.name === name) {
      this.applyCollectionPreset(this.selectedManagedCollection);
    } else {
      this.activeCollectionName = name;
      this.collectionName = name;
      this.syncCollectionSelector(name);
    }

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
      chunkLength: this.managedCollectionChunkLength,
      chunkOverlap: this.managedCollectionChunkOverlap,
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

        this.syncCollectionSelector();
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

  getDocumentMetadataValue(result: DocumentSearchResult, key: 'author' | 'category'): string | null {
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
    if (!this.documentViewerVisible) {
      return;
    }

    this.documentViewerClosing = true;
    this.scheduleModalClose(() => {
      this.documentViewerVisible = false;
      this.documentViewerClosing = false;
      this.updateBackgroundScrollLock();
    });
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
    if (!this.documentBrowserVisible) {
      return;
    }

    this.documentBrowserClosing = true;
    this.scheduleModalClose(() => {
      this.documentBrowserVisible = false;
      this.documentBrowserClosing = false;
      this.collectionDocumentsLoading = false;
      this.documentPreviewLoading = false;
      this.documentDeleteLoading = false;
      this.collectionDocumentsErrorMessage = '';
      this.collectionDocuments = [];
      this.selectedDocument = null;
      this.documentBrowserCollection = null;
      this.updateBackgroundScrollLock();
    });
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

  private startNewCollectionDraft(): void {
    this.selectedCollectionOption = this.createNewCollectionOption;
    this.activeCollectionName = '';
    this.createdCollection = false;
    this.collectionName = '';
    this.collectionDescription = '';
    this.model = DocumentWorkspaceStore.defaultModel;
    this.chunkLength = DocumentWorkspaceStore.defaultChunkLength;
    this.chunkOverlap = DocumentWorkspaceStore.defaultChunkOverlap;
    this.provider = DocumentWorkspaceStore.defaultProvider;
    this.clearMessages();
  }

  private applyCollectionPreset(collection: DocumentCollectionListItem | DocumentCollectionDetail): void {
    this.collectionName = collection.name;
    this.collectionDescription = collection.description ?? '';
    this.model = collection.model?.trim() || DocumentWorkspaceStore.defaultModel;
    this.chunkLength = collection.chunk_length ?? DocumentWorkspaceStore.defaultChunkLength;
    this.chunkOverlap = collection.chunk_overlap ?? DocumentWorkspaceStore.defaultChunkOverlap;
    this.provider = collection.provider?.trim() || DocumentWorkspaceStore.defaultProvider;
    this.activeCollectionName = collection.name;
    this.createdCollection = false;
    this.syncCollectionSelector(collection.name);
  }

  private syncCollectionSelector(preferredCollectionName = this.selectedCollectionOption): void {
    const candidateNames = [
      preferredCollectionName,
      this.activeCollectionName,
      this.collectionName.trim(),
      this.selectedCollectionOption,
    ]
      .map((name) => (name === this.createNewCollectionOption ? '' : name.trim()))
      .filter(Boolean);

    const selectedName = candidateNames.find((name) =>
      this.existingCollections.some((collection) => collection.name === name)
    );

    this.selectedCollectionOption = selectedName || this.createNewCollectionOption;
  }

  private withCurrentOption(options: string[], currentValue: string): string[] {
    const trimmedValue = currentValue.trim();

    if (!trimmedValue || options.includes(trimmedValue)) {
      return options;
    }

    return [trimmedValue, ...options];
  }

  private clearMessages(): void {
    this.clearMessageTimer();
    this.errorMessage = '';
    this.successMessage = '';
  }

  private showUploadMessage(type: 'success' | 'error', message: string): void {
    this.clearMessageTimer();
    this.errorMessage = type === 'error' ? message : '';
    this.successMessage = type === 'success' ? message : '';

    window.setTimeout(() => {
      this.statusViewport?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });

    this.messageTimerId = window.setTimeout(() => {
      this.errorMessage = '';
      this.successMessage = '';
      this.messageTimerId = null;
    }, DocumentWorkspaceStore.uploadMessageDismissMs);
  }

  private clearMessageTimer(): void {
    if (this.messageTimerId === null) {
      return;
    }

    window.clearTimeout(this.messageTimerId);
    this.messageTimerId = null;
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

  private scheduleModalClose(callback: () => void): void {
    if (this.modalCloseTimerId !== null) {
      window.clearTimeout(this.modalCloseTimerId);
    }

    this.modalCloseTimerId = window.setTimeout(() => {
      callback();
      this.modalCloseTimerId = null;
    }, 220);
  }
}

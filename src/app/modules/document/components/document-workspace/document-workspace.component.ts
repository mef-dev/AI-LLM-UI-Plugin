import { Component } from '@angular/core';
import {
  DocumentCollectionCreateRequest,
  DocumentCreateRequest,
  DocumentSearchRequest,
  DocumentSearchResult,
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

  searchQuery = 'there are many variations of passages of Lorem Ipsum available';
  topK = 5;
  minScore = 0.7;
  includeContent = true;
  includeMetadata = true;
  metric = 'cosine';
  scoreMode = 'similarity';

  loadingAction: 'collection' | 'document' | 'search' | null = null;
  errorMessage = '';
  successMessage = '';
  searchResults: DocumentSearchResult[] = [];
  createdCollection = false;
  createdDocumentSummary: string | null = null;
  activeCollectionName = '';

  constructor(private readonly documentApi: DocumentApiService) {}

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

  private sanitizeName(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'default';
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}

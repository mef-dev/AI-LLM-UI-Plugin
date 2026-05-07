export interface DocumentVectorSearchAlgorithm {
  name: string;
  kind: string;
  hnswParameters?: {
    m: number;
    efConstruction: number;
    efSearch: number;
    metric: string;
  };
}

export interface DocumentVectorSearchProfile {
  name: string;
  algorithm: string;
}

export interface DocumentCollectionCreateRequest {
  name: string;
  description: string;
  model: string;
  chunkLength: number;
  chunkOverlap: number;
  provider: string;
  vectorSearch: {
    algorithms: DocumentVectorSearchAlgorithm[];
    profiles: DocumentVectorSearchProfile[];
  };
}

export interface DocumentCollectionUpdateRequest {
  description?: string;
  chunkLength?: number;
  chunkOverlap?: number;
}

export interface DocumentCollectionListItem {
  name: string;
  description?: string;
  model?: string;
  provider?: string;
  chunk_length?: number;
  chunk_overlap?: number;
  documents_count?: number;
  chunks_count?: number;
  created_at?: string;
}

export interface DocumentCollectionListResponse {
  items?: DocumentCollectionListItem[];
  total_count?: number;
  page?: number;
  page_size?: number;
}

export interface DocumentCollectionDetail {
  name: string;
  description?: string;
  model?: string;
  provider?: string;
  chunk_length?: number;
  chunk_overlap?: number;
  documents_count?: number;
  chunks_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentCreateRequest {
  title: string;
  content: string;
  source?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  chunkLength: number;
  chunkOverlap: number;
}

export interface DocumentListItem {
  document_id: string;
  title: string;
  source?: string;
  tags?: string[];
  chunks_count?: number;
  created_at?: string;
}

export interface DocumentListResponse {
  items?: DocumentListItem[];
  total_count?: number;
  page?: number;
  page_size?: number;
}

export interface DocumentChunkDetail {
  id: number;
  document_id: string;
  chunk_index: number;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface DocumentDetail {
  document_id: string;
  title: string;
  content: string;
  chunks?: DocumentChunkDetail[];
  source?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  chunks_count?: number;
  created_at?: string;
}

export interface DocumentUploadRequest {
  title?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  chunkLength: number;
  chunkOverlap: number;
}

export interface DocumentSearchRequest {
  query: string;
  topK: number;
  metric?: string;
  scoreMode?: string;
  tags?: string[];
  minScore?: number;
  includeContent?: boolean;
  includeMetadata?: boolean;
  select?: string | null;
  searchFields?: string | null;
  decorators?: Record<string, unknown>;
}

export interface DocumentSearchResult {
  documentId: string;
  title: string;
  chunkId: number;
  chunkIndex: number;
  content?: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface DocumentSearchResponseEnvelope {
  results?: DocumentSearchResult[];
  items?: DocumentSearchResult[];
  data?: DocumentSearchResult[];
}

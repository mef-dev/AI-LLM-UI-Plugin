export interface VectorTableField {
  name: string;
  type: string;
  dimensions?: number;
  key?: boolean;
  autoIncrement?: boolean;
  vectorSearchProfile?: string;
}

export interface VectorTableSchema {
  name: string;
  fields: VectorTableField[];
  vectorSearch?: {
    algorithms?: Array<Record<string, unknown>>;
    profiles?: Array<Record<string, unknown>>;
  };
}

export interface VectorSemanticQuery {
  vector: string;
  K: string;
  fields: string;
  metric: string;
}

export interface VectorSearchRequest {
  provider: string;
  model?: string;
  search?: string;
  select?: string;
  searchFields?: string;
  vectorQueries?: VectorSemanticQuery[];
}

export interface VectorSearchResponse {
  value?: Array<Record<string, unknown>>;
}

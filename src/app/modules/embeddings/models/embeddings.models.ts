export interface EmbeddingsRequest {
  model: string;
  input: string | string[];
  chunk_length?: number;
}

export interface EmbeddingItem {
  object?: string;
  index: number;
  embedding: number[];
}

export interface EmbeddingsUsage {
  prompt_tokens?: number;
  total_tokens?: number;
}

export interface EmbeddingsResponse {
  object?: string;
  model?: string;
  data: EmbeddingItem[];
  usage?: EmbeddingsUsage;
}

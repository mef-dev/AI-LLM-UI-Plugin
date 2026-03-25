# LargeLanguageModel API Documentation

> Full description of all endpoints, request and response models of the LargeLanguageModel module.
> Supplement to Swagger.

---

## Table of Contents

1. [Chat API](#1-chat-api)
2. [Embeddings API](#2-embeddings-api)
3. [LLM Registry API](#3-llm-registry-api)
4. [Document RAG API](#4-document-rag-api)
5. [Vector API](#5-vector-api)
6. [Database Migration API](#6-database-migration-api)
7. [Enums](#7-enums)

---

## 1. Chat API

**Base URL:** `api/v2/ai/chat`

### POST `/completions`

Generate a chat model response (chat completions). Supports streaming.

**Request Body:** `ChatCompletionsRequestViewModel`

```json
{
  "model": "meta-llama/Llama-3.1-8B-Instruct",
  "messages": [
    {
      "role": "system | user | assistant",
      "content": "string"
    }
  ],
  "stream": true,
  "tag": "string | null",
  "stream_interval": 0.1,
  "diversity_penalty": 0.0,
  "do_sample": true,
  "early_stopping": false,
  "length_penalty": 1.0,
  "max_tokens": 1024,
  "min_length": 0,
  "no_repeat_ngram_size": 0,
  "num_beams": 1,
  "num_return_sequences": 1,
  "past_present_share_buffer": false,
  "repetition_penalty": 1.0,
  "temperature": 0.7,
  "top_k": 50,
  "top_p": 0.9
}
```

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `model` | string | No | Model ID. Default: `meta-llama/Llama-3.1-8B-Instruct` |
| `messages` | array | Yes | List of conversation messages |
| `messages[].role` | string | Yes | Author role: `system`, `user`, `assistant` |
| `messages[].content` | string | Yes | Message text |
| `stream` | bool? | No | Stream the response |
| `tag` | string? | No | Tag for request identification |
| `stream_interval` | double? | No | Streaming interval. Default: `0.1` |
| `diversity_penalty` | double? | No | Diversity penalty |
| `do_sample` | bool? | No | Whether to use sampling |
| `early_stopping` | bool? | No | Early stopping of generation |
| `length_penalty` | double? | No | Length penalty |
| `max_tokens` | int? | No | Maximum number of tokens |
| `min_length` | int? | No | Minimum response length |
| `no_repeat_ngram_size` | int? | No | N-gram size to avoid repetitions |
| `num_beams` | int? | No | Number of beams for beam search |
| `num_return_sequences` | int? | No | Number of returned sequences |
| `past_present_share_buffer` | bool? | No | Shared past/present buffer |
| `repetition_penalty` | double? | No | Repetition penalty |
| `temperature` | double? | No | Generation temperature |
| `top_k` | int? | No | Top-K sampling |
| `top_p` | double? | No | Top-P (nucleus) sampling |

**Response:** `IActionResult` (JsonResult with model response or SSE stream)

---

## 2. Embeddings API

**Base URL:** `api/v2/ai/embeddings`

### POST `/`

Generate embeddings for input text.

**Request Body:** `EmbeddingsRequestViewModel`

```json
{
  "model": "gte-base",
  "input": "Your text string goes here",
  "chunk_length": 512
}
```

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `model` | string | No | Model ID. Default: `gte-base` |
| `input` | string \| string[] | Yes | Text or array of texts for embedding |
| `chunk_length` | int? | No | Chunk length for text splitting |

**Response:** JSON with an array of embedding vectors

---

## 3. LLM Registry API

**Base URL:** `api/v2/ai/llm`

Management of the LLM model registry (tenant-scoped).

---

### GET `/`

Get the list of registered models.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| `status` | LlmStatusEnum? | No | Filter by status: `DRAFT`, `VALIDATED`, `DISABLED` |
| `modelName` | string? | No | Filter by model name |

**Response:** `List<LLMRegistryLocator>`

```json
[
  {
    "@type": "LLMRegistryLocator",
    "model_id": "guid",
    "model_name": "string",
    "display_name": "string",
    "access_mode": "direct | internal_service | external_service",
    "is_required": false,
    "url": "string",
    "api_key": "****",
    "device": "cpu | cuda",
    "headers": { "key": "value" },
    "version": "string",
    "status": "DRAFT | VALIDATED | DISABLED",
    "capabilities": {},
    "config": {},
    "tenantId": 0,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

---

### GET `/{id}`

Get model details by ID.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | Guid | Model ID |

**Response:** `LLMRegistryLocator` (see above)

---

### POST `/`

Register a new LLM model.

**Request Body:** `LlmCreateRequest`

```json
{
  "model_name": "string (required)",
  "display_name": "string",
  "device": "cpu | cuda",
  "access_mode": "direct | internal_service | external_service",
  "is_required": false,
  "url": "string",
  "api_key": "string",
  "headers": { "Authorization": "Bearer ..." },
  "version": "string",
  "capabilities": { "chat": true, "embeddings": false },
  "config": { "max_context": 4096 }
}
```

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `model_name` | string | Yes | System model name |
| `display_name` | string? | No | Display name |
| `device` | DeviceEnum? | No | Device: `cpu` (1), `cuda` (2) |
| `access_mode` | AccessModeEnum? | No | Access mode. Default: `direct` |
| `is_required` | bool? | No | Whether the model is required. Default: `false` |
| `url` | string? | No | Model endpoint URL |
| `api_key` | string? | No | API key for access |
| `headers` | Dictionary<string, string>? | No | Additional HTTP headers |
| `version` | string? | No | Model version |
| `capabilities` | Dictionary<string, object?>? | No | Model capabilities (JSON) |
| `config` | Dictionary<string, object?>? | No | Model configuration (JSON) |

**Response:** `LLMRegistryLocator`

---

### PUT `/{id}`

Update an existing LLM model.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | Guid | Model ID |

**Request Body:** `LlmUpdateRequest`

```json
{
  "model_name": "string",
  "display_name": "string",
  "device": "cpu | cuda",
  "access_mode": "direct | internal_service | external_service",
  "is_required": false,
  "url": "string",
  "api_key": "string",
  "headers": { "key": "value" },
  "version": "string",
  "status": "DRAFT | VALIDATED | DISABLED",
  "capabilities": {},
  "config": {}
}
```

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `model_name` | string? | No | System model name |
| `display_name` | string? | No | Display name |
| `device` | DeviceEnum? | No | Device |
| `access_mode` | AccessModeEnum? | No | Access mode |
| `is_required` | bool? | No | Whether required |
| `url` | string? | No | Endpoint URL |
| `api_key` | string? | No | API key |
| `headers` | Dictionary<string, string>? | No | HTTP headers |
| `version` | string? | No | Version |
| `status` | LlmStatusEnum? | No | New status |
| `capabilities` | Dictionary<string, object?>? | No | Capabilities |
| `config` | Dictionary<string, object?>? | No | Configuration |

**Response:** `LLMRegistryLocator`

---

### POST `/{id}/validate`

Validate a registered model (check availability).

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | Guid | Model ID |

**Response:** OK or validation error

---

### DELETE `/{id}`

Delete a registered model.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | Guid | Model ID |

**Response:** OK

---

### POST `/{id}/upload`

Upload a model file (ZIP archive) to the server.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | Guid | Model ID |

**Form Data:**

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `file` | IFormFile | Yes | ZIP archive with model files |
| `device` | DeviceEnum? | No | Target device: `cpu`, `cuda` |
| `version` | string? | No | Model version |

**Response:** OK or error

---

## 4. Document RAG API

**Base URL:** `api/v2/ai/document`

Full API for document management with Retrieval-Augmented Generation (RAG) support.

---

### 4.1 Collections

#### POST `/collection`

Create a new document collection.

**Request Body:** `CollectionCreateRequest`

```json
{
  "name": "string (required)",
  "description": "string",
  "model": "string (required)",
  "chunk_length": 512,
  "chunk_overlap": 50,
  "provider": "Pgvector",
  "vector_search": {
    "algorithms": [
      {
        "name": "string",
        "kind": "string",
        "hnsw_parameters": {
          "m": 16,
          "ef_construction": 200,
          "ef_search": 100,
          "metric": "cosine"
        }
      }
    ],
    "profiles": [
      {
        "name": "string",
        "algorithm": "string"
      }
    ]
  }
}
```

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `name` | string | Yes | Unique collection name (max 256) |
| `description` | string? | No | Collection description (max 2048) |
| `model` | string | Yes | Embedding model name (max 256) |
| `chunk_length` | int? | No | Chunk length. Default: `512` |
| `chunk_overlap` | int? | No | Chunk overlap. Default: `50` |
| `provider` | VectorDbProviderEnum? | No | Provider. Default: `Pgvector` |
| `vector_search` | VectorCreateSearchDto? | No | Vector search settings |

**Response:** `CollectionResponse`

```json
{
  "name": "string",
  "description": "string",
  "model": "string",
  "chunk_length": 512,
  "chunk_overlap": 50,
  "provider": "Pgvector",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

#### GET `/collection`

Get a list of collections (with pagination).

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|:--------:|---------|-------------|
| `page` | int | No | 1 | Page number |
| `pageSize` | int | No | 20 | Page size |

**Response:** `CollectionListResponse`

```json
{
  "items": [
    {
      "name": "string",
      "description": "string",
      "model": "string",
      "chunk_length": 512,
      "chunk_overlap": 50,
      "provider": "Pgvector",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total_count": 100,
  "page": 1,
  "page_size": 20
}
```

---

#### GET `/collection/{name}`

Get collection details with document and chunk counts.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Collection name |

**Response:** `CollectionDetailResponse`

```json
{
  "name": "string",
  "description": "string",
  "model": "string",
  "chunk_length": 512,
  "chunk_overlap": 50,
  "provider": "Pgvector",
  "created_at": "2024-01-01T00:00:00Z",
  "documents_count": 42,
  "chunks_count": 1250,
  "vector_search": { ... }
}
```

---

#### PUT `/collection/{name}`

Update a collection.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Collection name |

**Request Body:** `CollectionUpdateRequest`

```json
{
  "description": "string",
  "chunk_length": 1024,
  "chunk_overlap": 100
}
```

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `description` | string? | No | New description |
| `chunk_length` | int? | No | New chunk length |
| `chunk_overlap` | int? | No | New overlap |

**Response:** `CollectionResponse`

---

#### DELETE `/collection/{name}`

Delete a collection with all its documents and chunks.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Collection name |

**Response:** `ActionResultResponse`

```json
{
  "result": true
}
```

---

### 4.2 Documents

#### POST `/{collection}/documents`

Create a document in a collection. Automatically splits into chunks and generates embeddings.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `collection` | string | Collection name |

**Request Body:** `DocumentCreateRequest`

```json
{
  "title": "string (required)",
  "content": "string (required)",
  "source": "string",
  "tags": ["tag1", "tag2"],
  "metadata": { "key": "value" },
  "chunk_length": 512,
  "chunk_overlap": 50
}
```

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `title` | string | Yes | Document title (max 1024) |
| `content` | string | Yes | Document content |
| `source` | string? | No | Document source (max 2048) |
| `tags` | List\<string\>? | No | Tags for filtering |
| `metadata` | Dictionary\<string, object\>? | No | Arbitrary metadata |
| `chunk_length` | int? | No | Override chunk length |
| `chunk_overlap` | int? | No | Override overlap |

**Response:** `DocumentCreateResponse`

```json
{
  "document_id": "guid",
  "title": "string",
  "chunks_count": 5,
  "source": "string",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

#### GET `/{collection}/documents`

Get a list of documents in a collection.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `collection` | string | Collection name |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| `page` | int | No | Page number |
| `pageSize` | int | No | Page size |
| `search` | string? | No | Search by title |
| `tags` | string? | No | Filter by tags (comma-separated) |
| `sortBy` | string? | No | Sort field |
| `sortOrder` | string? | No | Direction: `asc` or `desc` |

**Response:** `DocumentListResponse`

```json
{
  "items": [
    {
      "document_id": "guid",
      "title": "string",
      "source": "string",
      "tags": ["tag1"],
      "chunks_count": 5,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total_count": 100,
  "page": 1,
  "page_size": 20
}
```

---

#### POST `/{collection}/documents/batch`

Batch document creation.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `collection` | string | Collection name |

**Request Body:** `DocumentBatchCreateRequest`

```json
{
  "documents": [
    {
      "title": "Doc 1",
      "content": "Content 1",
      "source": "source",
      "tags": ["tag"],
      "metadata": {}
    },
    {
      "title": "Doc 2",
      "content": "Content 2"
    }
  ],
  "chunk_length": 512,
  "chunk_overlap": 50
}
```

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `documents` | List\<DocumentCreateRequest\> | Yes | Array of documents |
| `chunk_length` | int? | No | Shared chunk length |
| `chunk_overlap` | int? | No | Shared overlap |

**Response:** `DocumentBatchCreateResponse`

```json
{
  "total_documents": 2,
  "success_count": 2,
  "failed_count": 0,
  "results": [
    {
      "title": "Doc 1",
      "document_id": "guid",
      "chunks_count": 3,
      "success": true,
      "error": null
    },
    {
      "title": "Doc 2",
      "document_id": "guid",
      "chunks_count": 2,
      "success": true,
      "error": null
    }
  ]
}
```

---

#### POST `/{collection}/documents/upload`

Upload a document from a file.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `collection` | string | Collection name |

**Form Data:** `DocumentFileUploadRequest`

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `file` | IFormFile | Yes | Document file |
| `title` | string? | No | Title (otherwise — file name) |
| `tags` | string? | No | Tags (JSON string) |
| `metadata` | string? | No | Metadata (JSON string) |
| `chunk_length` | int? | No | Chunk length |
| `chunk_overlap` | int? | No | Chunk overlap |

**Response:** `DocumentCreateResponse`

---

#### GET `/{collection}/documents/{documentId}`

Get document details with chunks.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `collection` | string | Collection name |
| `documentId` | Guid | Document ID |

**Response:** `DocumentDetailResponse`

```json
{
  "document_id": "guid",
  "title": "string",
  "content": "string",
  "chunks": [
    {
      "id": 1,
      "document_id": "guid",
      "chunk_index": 0,
      "content": "string",
      "metadata": {}
    }
  ],
  "source": "string",
  "tags": ["tag1"],
  "metadata": { "key": "value" },
  "chunks_count": 5,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

#### PUT `/{collection}/documents/{documentId}`

Update a document. Regenerates chunks and embeddings if content is changed.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `collection` | string | Collection name |
| `documentId` | Guid | Document ID |

**Request Body:** `DocumentUpdateRequest`

```json
{
  "title": "string",
  "content": "string",
  "source": "string",
  "tags": ["tag1", "tag2"],
  "metadata": { "key": "value" },
  "chunk_length": 1024,
  "chunk_overlap": 100
}
```

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `title` | string? | No | New title |
| `content` | string? | No | New content |
| `source` | string? | No | New source |
| `tags` | List\<string\>? | No | New tags |
| `metadata` | Dictionary\<string, object\>? | No | New metadata |
| `chunk_length` | int? | No | New chunk length |
| `chunk_overlap` | int? | No | New overlap |

**Response:** `DocumentCreateResponse`

---

#### DELETE `/{collection}/documents/{documentId}`

Delete a document with all its chunks.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `collection` | string | Collection name |
| `documentId` | Guid | Document ID |

**Response:** `ActionResultResponse`

```json
{ "result": true }
```

---

### 4.3 Chunks

#### GET `/{collection}/documents/{documentId}/chunks`

Get all chunks of a document.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `collection` | string | Collection name |
| `documentId` | Guid | Document ID |

**Response:** `ChunkListResponse`

```json
{
  "items": [
    {
      "id": 1,
      "document_id": "guid",
      "chunk_index": 0,
      "content": "string",
      "metadata": {}
    }
  ],
  "total_count": 5,
  "document_id": "guid"
}
```

---

#### POST `/{collection}/documents/{documentId}/chunks`

Create a new chunk for a document.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `collection` | string | Collection name |
| `documentId` | Guid | Document ID |

**Request Body:** `ChunkCreateRequest`

```json
{
  "content": "string (required)",
  "chunk_index": 0,
  "metadata": { "key": "value" }
}
```

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `content` | string | Yes | Chunk content |
| `chunk_index` | int? | No | Chunk index |
| `metadata` | Dictionary\<string, object\>? | No | Chunk metadata |

**Response:** `ChunkResponse`

```json
{
  "id": 1,
  "document_id": "guid",
  "chunk_index": 0,
  "content": "string",
  "metadata": {}
}
```

---

#### GET `/{collection}/documents/{documentId}/chunks/{chunkId}`

Get a specific chunk.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `collection` | string | Collection name |
| `documentId` | Guid | Document ID |
| `chunkId` | long | Chunk ID |

**Response:** `ChunkResponse`

---

#### PUT `/{collection}/documents/{documentId}/chunks/{chunkId}`

Update a chunk.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `collection` | string | Collection name |
| `documentId` | Guid | Document ID |
| `chunkId` | long | Chunk ID |

**Request Body:** `ChunkUpdateRequest`

```json
{
  "content": "string",
  "metadata": { "key": "value" }
}
```

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `content` | string? | No | New content |
| `metadata` | Dictionary\<string, object\>? | No | New metadata |

**Response:** `ChunkResponse`

---

#### DELETE `/{collection}/documents/{documentId}/chunks/{chunkId}`

Delete a chunk.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `collection` | string | Collection name |
| `documentId` | Guid | Document ID |
| `chunkId` | long | Chunk ID |

**Response:** `ActionResultResponse`

---

### 4.4 Search

#### POST `/{collection}/search`

Semantic search across a document collection.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `collection` | string | Collection name |

**Request Body:** `DocumentSearchRequest`

```json
{
  "query": "string (required)",
  "top_k": 5,
  "metric": "cosine",
  "score_mode": "similarity",
  "tags": ["tag1"],
  "min_score": 0.7,
  "include_content": true,
  "include_metadata": true,
  "select": "string",
  "search_fields": "string",
  "decorators": { "key": "value" }
}
```

| Field | Type | Required | Default | Description |
|-------|------|:--------:|---------|-------------|
| `query` | string | Yes | — | Search query |
| `top_k` | int? | No | `5` | Number of results |
| `metric` | string? | No | `cosine` | Distance metric |
| `score_mode` | string? | No | `similarity` | Score mode |
| `tags` | List\<string\>? | No | — | Filter by tags |
| `min_score` | double? | No | — | Minimum relevance threshold |
| `include_content` | bool? | No | `true` | Include chunk content |
| `include_metadata` | bool? | No | `true` | Include metadata |
| `select` | string? | No | — | Select fields |
| `search_fields` | string? | No | — | Search fields |
| `decorators` | Dictionary\<string, object\>? | No | — | Query decorators |

**Response:** `DocumentSearchResponse`

```json
{
  "results": [
    {
      "document_id": "guid",
      "title": "string",
      "chunk_id": 1,
      "chunk_index": 0,
      "content": "string",
      "score": 0.95,
      "metadata": { "key": "value" }
    }
  ],
  "total_results": 5,
  "query": "string"
}
```

---

## 5. Vector API

**Base URL:** `api/v2/ai/vector`

Low-level API for working with vector databases.

---

### POST `/{name}/table`

Get table structure.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Table name |

**Request Body:** `VectorGetTableRequestViewModel`

```json
{
  "provider": "Pgvector"
}
```

---

### POST `/{name}/get`

Get data from a table.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Table name |

**Request Body:** `VectorGetRequestViewModel`

```json
{
  "provider": "Pgvector",
  "select": "id, content, embedding",
  "embedding": "field_name"
}
```

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `provider` | VectorDbProviderEnum | Yes | DB provider |
| `select` | string | Yes | SQL select expression |
| `embedding` | string | Yes | Embedding field |

---

### POST `/db`

Create a new vector database.

**Request Body:** `VectorDatabaseRequestViewModel`

```json
{
  "provider": "Pgvector",
  "database_name": "string",
  "description": "string"
}
```

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `provider` | VectorDbProviderEnum | Yes | DB provider |
| `database_name` | string | Yes | Database name |
| `description` | string | Yes | Description |

---

### POST `/execute`

Execute a SQL query (non-query).

**Request Body:** `VectorExecuteRequestViewModel`

```json
{
  "provider": "Pgvector",
  "database_name": "string",
  "query": "CREATE INDEX ..."
}
```

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `provider` | VectorDbProviderEnum | Yes | DB provider |
| `database_name` | string | Yes | Database name |
| `query` | string | Yes | SQL query |

---

### POST `/execute-reader`

Execute a SQL query with data return.

**Request Body:** `VectorExecuteRequestViewModel` (identical to `/execute`)

---

### POST `/create`

Create a new vector table.

**Request Body:** `VectorCreateRequestViewModel`

```json
{
  "provider": "Pgvector",
  "name": "my_vectors",
  "fields": [
    {
      "name": "id",
      "type": "bigint",
      "key": true,
      "auto_increment": true
    },
    {
      "name": "content",
      "type": "text"
    },
    {
      "name": "embedding",
      "type": "vector",
      "dimensions": 768,
      "vector_search_profile": "my_profile"
    }
  ],
  "vector_search": {
    "algorithms": [
      {
        "name": "my_hnsw",
        "kind": "hnsw",
        "hnsw_parameters": {
          "m": 16,
          "ef_construction": 200,
          "ef_search": 100,
          "metric": "cosine"
        }
      }
    ],
    "profiles": [
      {
        "name": "my_profile",
        "algorithm": "my_hnsw"
      }
    ]
  }
}
```

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `provider` | VectorDbProviderEnum | Yes | DB provider |
| `name` | string | Yes | Table name |
| `fields` | List\<FieldViewModel\> | Yes | Field definitions |
| `vector_search` | VectorCreateSearchViewModel? | No | Search settings |

**FieldViewModel:**

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `name` | string | Yes | Field name |
| `type` | string | Yes | Type: `bigint`, `text`, `vector`, `jsonb`, etc. |
| `key` | bool? | No | Primary key |
| `dimensions` | int? | No | Vector dimensions (for `vector` type) |
| `auto_increment` | bool? | No | Auto-increment |
| `vector_search_profile` | string? | No | Search profile |

---

### PUT `/{name}/update`

Update vector table structure.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Table name |

**Request Body:** `VectorCreateRequestViewModel` (identical to `/create`)

---

### POST `/{name}/upload`

Upload documents to a vector table.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Table name |

**Request Body:** `VectorUploadDocumentRequestViewModel`

```json
{
  "provider": "Pgvector",
  "model": "BAAI/bge-m3",
  "value": [
    {
      "content": "text to embed",
      "metadata": { "key": "value" }
    }
  ],
  "chunk_length": 512
}
```

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `provider` | VectorDbProviderEnum | Yes | DB provider |
| `model` | string | Yes | Embedding model |
| `value` | List\<Dictionary\<string, object\>\> | Yes | Array of documents |
| `chunk_length` | int? | No | Chunk length |

---

### POST `/{name}/search`

Vector search in a table.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Table name |

**Request Body:** `VectorSearchRequestViewModel`

```json
{
  "provider": "Pgvector",
  "model": "BAAI/bge-m3",
  "search": "query text",
  "select": "id, content",
  "search_fields": "content",
  "embedding": "embedding_field",
  "vector_queries": [
    {
      "vector": [0.1, 0.2, 0.3],
      "fields": "embedding",
      "k": 10,
      "metric": "cosine",
      "decorators": {}
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `provider` | VectorDbProviderEnum | Yes | DB provider |
| `model` | string | No | Embedding model. Default: `BAAI/bge-m3` |
| `search` | string | Yes | Search text |
| `select` | string | Yes | Fields to select |
| `search_fields` | string | Yes | Fields to search |
| `embedding` | string | Yes | Embedding field |
| `vector_queries` | List\<VectorQueryViewModel\>? | No | Additional vector queries |

**VectorQueryViewModel:**

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `vector` | object | Yes | Search vector (array of numbers) |
| `fields` | string | Yes | Fields for comparison |
| `k` | int? | No | Number of nearest neighbors |
| `metric` | string | No | Distance metric |
| `decorators` | Dictionary\<string, object\>? | No | Query decorators |

---

### DELETE `/{name}/delete`

Delete records from a table by condition.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Table name |

**Request Body:** `VectorDeleteRequestViewModel`

```json
{
  "provider": "Pgvector",
  "delete_field": "id",
  "value": 42
}
```

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `provider` | VectorDbProviderEnum | Yes | DB provider |
| `delete_field` | string | Yes | Field to filter by |
| `value` | object | Yes | Value for deletion |

---

### DELETE `/{name}/drop`

Drop a table completely.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Table name |

**Request Body:** `VectorDeleteRequestViewModel` (identical to `/delete`)

---

## 6. Database Migration API

**Base URL:** `api/v2/ai/llm-db`

### GET `/migrate`

Run database migrations manually.

**Response:** OK

---

## 7. Enums

### DeviceEnum

| Value | Code | Description |
|-------|:----:|-------------|
| `cpu` | 1 | CPU computation |
| `cuda` | 2 | GPU (NVIDIA CUDA) |

### LlmStatusEnum

| Value | Code | Description |
|-------|:----:|-------------|
| `DRAFT` | 0 | Draft (new model) |
| `VALIDATED` | 1 | Validated (verified) |
| `DISABLED` | 2 | Disabled |

### AccessModeEnum

| Value | Code | Description |
|-------|:----:|-------------|
| `direct` | 1 | Direct access |
| `internal_service` | 2 | Via internal service |
| `external_service` | 3 | Via external service |

### VectorDbProviderEnum

| Value | Code | Description |
|-------|:----:|-------------|
| `Pgvector` | 1 | PostgreSQL with pgvector |

---

## Common Error Responses

All endpoints may return an `ErrorResponse`:

```json
{
  "status": 400,
  "code": 0,
  "message": "Error description",
  "type": "ValidationError"
}
```

| HTTP Status | Description |
|:-----------:|-------------|
| 400 | Bad Request — invalid request |
| 404 | Not Found — resource not found |
| 409 | Conflict — conflict (e.g., duplicate name) |
| 500 | Internal Server Error |

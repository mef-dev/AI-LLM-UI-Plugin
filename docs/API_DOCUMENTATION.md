# LargeLanguageModel API Documentation

> Повний опис всіх ендпоінтів, моделей запитів та відповідей модуля LargeLanguageModel.
> Доповнення до Swagger.

---

## Зміст

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

Генерація відповіді чат-моделі (chat completions). Підтримує streaming.

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

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `model` | string | Ні | ID моделі. Default: `meta-llama/Llama-3.1-8B-Instruct` |
| `messages` | array | Так | Список повідомлень розмови |
| `messages[].role` | string | Так | Роль автора: `system`, `user`, `assistant` |
| `messages[].content` | string | Так | Текст повідомлення |
| `stream` | bool? | Ні | Потокова передача відповіді |
| `tag` | string? | Ні | Тег для ідентифікації запиту |
| `stream_interval` | double? | Ні | Інтервал стрімінгу. Default: `0.1` |
| `diversity_penalty` | double? | Ні | Штраф за різноманітність |
| `do_sample` | bool? | Ні | Чи використовувати семплінг |
| `early_stopping` | bool? | Ні | Раннє припинення генерації |
| `length_penalty` | double? | Ні | Штраф за довжину |
| `max_tokens` | int? | Ні | Максимальна кількість токенів |
| `min_length` | int? | Ні | Мінімальна довжина відповіді |
| `no_repeat_ngram_size` | int? | Ні | Розмір n-gram для уникнення повторів |
| `num_beams` | int? | Ні | Кількість beams для beam search |
| `num_return_sequences` | int? | Ні | Кількість повернутих послідовностей |
| `past_present_share_buffer` | bool? | Ні | Спільний буфер past/present |
| `repetition_penalty` | double? | Ні | Штраф за повторення |
| `temperature` | double? | Ні | Температура генерації |
| `top_k` | int? | Ні | Top-K семплінг |
| `top_p` | double? | Ні | Top-P (nucleus) семплінг |

**Response:** `IActionResult` (JsonResult з відповіддю моделі або SSE stream)

---

## 2. Embeddings API

**Base URL:** `api/v2/ai/embeddings`

### POST `/`

Генерація ембедінгів для вхідного тексту.

**Request Body:** `EmbeddingsRequestViewModel`

```json
{
  "model": "gte-base",
  "input": "Your text string goes here",
  "chunk_length": 512
}
```

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `model` | string | Ні | ID моделі. Default: `gte-base` |
| `input` | string \| string[] | Так | Текст або масив текстів для ембедінгу |
| `chunk_length` | int? | Ні | Довжина чанка для розбиття тексту |

**Response:** JSON з масивом ембедінг-векторів

---

## 3. LLM Registry API

**Base URL:** `api/v2/ai/llm`

Управління реєстром LLM моделей (tenant-scoped).

---

### GET `/`

Отримати список зареєстрованих моделей.

**Query Parameters:**

| Параметр | Тип | Обов'язкове | Опис |
|----------|-----|:-----------:|------|
| `status` | LlmStatusEnum? | Ні | Фільтр по статусу: `DRAFT`, `VALIDATED`, `DISABLED` |
| `modelName` | string? | Ні | Фільтр по назві моделі |

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

Отримати деталі моделі за ID.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `id` | Guid | ID моделі |

**Response:** `LLMRegistryLocator` (див. вище)

---

### POST `/`

Зареєструвати нову LLM модель.

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

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `model_name` | string | Так | Системна назва моделі |
| `display_name` | string? | Ні | Відображувана назва |
| `device` | DeviceEnum? | Ні | Пристрій: `cpu` (1), `cuda` (2) |
| `access_mode` | AccessModeEnum? | Ні | Режим доступу. Default: `direct` |
| `is_required` | bool? | Ні | Чи обов'язкова модель. Default: `false` |
| `url` | string? | Ні | URL ендпоінта моделі |
| `api_key` | string? | Ні | API ключ для доступу |
| `headers` | Dictionary<string, string>? | Ні | Додаткові HTTP заголовки |
| `version` | string? | Ні | Версія моделі |
| `capabilities` | Dictionary<string, object?>? | Ні | Можливості моделі (JSON) |
| `config` | Dictionary<string, object?>? | Ні | Конфігурація моделі (JSON) |

**Response:** `LLMRegistryLocator`

---

### PUT `/{id}`

Оновити існуючу LLM модель.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `id` | Guid | ID моделі |

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

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `model_name` | string? | Ні | Системна назва моделі |
| `display_name` | string? | Ні | Відображувана назва |
| `device` | DeviceEnum? | Ні | Пристрій |
| `access_mode` | AccessModeEnum? | Ні | Режим доступу |
| `is_required` | bool? | Ні | Чи обов'язкова |
| `url` | string? | Ні | URL ендпоінта |
| `api_key` | string? | Ні | API ключ |
| `headers` | Dictionary<string, string>? | Ні | HTTP заголовки |
| `version` | string? | Ні | Версія |
| `status` | LlmStatusEnum? | Ні | Новий статус |
| `capabilities` | Dictionary<string, object?>? | Ні | Можливості |
| `config` | Dictionary<string, object?>? | Ні | Конфігурація |

**Response:** `LLMRegistryLocator`

---

### POST `/{id}/validate`

Валідація зареєстрованої моделі (перевірка доступності).

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `id` | Guid | ID моделі |

**Response:** OK або помилка валідації

---

### DELETE `/{id}`

Видалити зареєстровану модель.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `id` | Guid | ID моделі |

**Response:** OK

---

### POST `/{id}/upload`

Завантажити файл моделі (ZIP-архів) на сервер.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `id` | Guid | ID моделі |

**Form Data:**

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `file` | IFormFile | Так | ZIP-архів з файлами моделі |
| `device` | DeviceEnum? | Ні | Цільовий пристрій: `cpu`, `cuda` |
| `version` | string? | Ні | Версія моделі |

**Response:** OK або помилка

---

## 4. Document RAG API

**Base URL:** `api/v2/ai/document`

Повний API для управління документами з підтримкою Retrieval-Augmented Generation (RAG).

---

### 4.1 Collections (Колекції)

#### POST `/collection`

Створити нову колекцію документів.

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

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `name` | string | Так | Унікальна назва колекції (max 256) |
| `description` | string? | Ні | Опис колекції (max 2048) |
| `model` | string | Так | Назва моделі для ембедінгів (max 256) |
| `chunk_length` | int? | Ні | Довжина чанка. Default: `512` |
| `chunk_overlap` | int? | Ні | Перекриття чанків. Default: `50` |
| `provider` | VectorDbProviderEnum? | Ні | Провайдер. Default: `Pgvector` |
| `vector_search` | VectorCreateSearchDto? | Ні | Налаштування векторного пошуку |

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

Отримати список колекцій (з пагінацією).

**Query Parameters:**

| Параметр | Тип | Обов'язкове | Default | Опис |
|----------|-----|:-----------:|---------|------|
| `page` | int | Ні | 1 | Номер сторінки |
| `pageSize` | int | Ні | 20 | Розмір сторінки |

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

Отримати деталі колекції з кількістю документів та чанків.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `name` | string | Назва колекції |

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

Оновити колекцію.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `name` | string | Назва колекції |

**Request Body:** `CollectionUpdateRequest`

```json
{
  "description": "string",
  "chunk_length": 1024,
  "chunk_overlap": 100
}
```

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `description` | string? | Ні | Новий опис |
| `chunk_length` | int? | Ні | Нова довжина чанка |
| `chunk_overlap` | int? | Ні | Нове перекриття |

**Response:** `CollectionResponse`

---

#### DELETE `/collection/{name}`

Видалити колекцію з усіма документами та чанками.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `name` | string | Назва колекції |

**Response:** `ActionResultResponse`

```json
{
  "result": true
}
```

---

### 4.2 Documents (Документи)

#### POST `/{collection}/documents`

Створити документ у колекції. Автоматично розбиває на чанки та генерує ембедінги.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `collection` | string | Назва колекції |

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

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `title` | string | Так | Заголовок документа (max 1024) |
| `content` | string | Так | Вміст документа |
| `source` | string? | Ні | Джерело документа (max 2048) |
| `tags` | List\<string\>? | Ні | Теги для фільтрації |
| `metadata` | Dictionary\<string, object\>? | Ні | Довільні метадані |
| `chunk_length` | int? | Ні | Перевизначити довжину чанка |
| `chunk_overlap` | int? | Ні | Перевизначити перекриття |

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

Отримати список документів у колекції.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `collection` | string | Назва колекції |

**Query Parameters:**

| Параметр | Тип | Обов'язкове | Опис |
|----------|-----|:-----------:|------|
| `page` | int | Ні | Номер сторінки |
| `pageSize` | int | Ні | Розмір сторінки |
| `search` | string? | Ні | Пошук по заголовку |
| `tags` | string? | Ні | Фільтр по тегах (comma-separated) |
| `sortBy` | string? | Ні | Поле для сортування |
| `sortOrder` | string? | Ні | Напрямок: `asc` або `desc` |

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

Пакетне створення документів.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `collection` | string | Назва колекції |

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

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `documents` | List\<DocumentCreateRequest\> | Так | Масив документів |
| `chunk_length` | int? | Ні | Спільна довжина чанка |
| `chunk_overlap` | int? | Ні | Спільне перекриття |

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

Завантажити документ з файлу.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `collection` | string | Назва колекції |

**Form Data:** `DocumentFileUploadRequest`

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `file` | IFormFile | Так | Файл документа |
| `title` | string? | Ні | Заголовок (інакше — ім'я файлу) |
| `tags` | string? | Ні | Теги (JSON string) |
| `metadata` | string? | Ні | Метадані (JSON string) |
| `chunk_length` | int? | Ні | Довжина чанка |
| `chunk_overlap` | int? | Ні | Перекриття чанків |

**Response:** `DocumentCreateResponse`

---

#### GET `/{collection}/documents/{documentId}`

Отримати деталі документа з чанками.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `collection` | string | Назва колекції |
| `documentId` | Guid | ID документа |

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

Оновити документ. Перегенерує чанки та ембедінги якщо змінено контент.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `collection` | string | Назва колекції |
| `documentId` | Guid | ID документа |

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

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `title` | string? | Ні | Новий заголовок |
| `content` | string? | Ні | Новий вміст |
| `source` | string? | Ні | Нове джерело |
| `tags` | List\<string\>? | Ні | Нові теги |
| `metadata` | Dictionary\<string, object\>? | Ні | Нові метадані |
| `chunk_length` | int? | Ні | Нова довжина чанка |
| `chunk_overlap` | int? | Ні | Нове перекриття |

**Response:** `DocumentCreateResponse`

---

#### DELETE `/{collection}/documents/{documentId}`

Видалити документ з усіма чанками.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `collection` | string | Назва колекції |
| `documentId` | Guid | ID документа |

**Response:** `ActionResultResponse`

```json
{ "result": true }
```

---

### 4.3 Chunks (Чанки)

#### GET `/{collection}/documents/{documentId}/chunks`

Отримати всі чанки документа.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `collection` | string | Назва колекції |
| `documentId` | Guid | ID документа |

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

Створити новий чанк для документа.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `collection` | string | Назва колекції |
| `documentId` | Guid | ID документа |

**Request Body:** `ChunkCreateRequest`

```json
{
  "content": "string (required)",
  "chunk_index": 0,
  "metadata": { "key": "value" }
}
```

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `content` | string | Так | Вміст чанка |
| `chunk_index` | int? | Ні | Індекс чанка |
| `metadata` | Dictionary\<string, object\>? | Ні | Метадані чанка |

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

Отримати конкретний чанк.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `collection` | string | Назва колекції |
| `documentId` | Guid | ID документа |
| `chunkId` | long | ID чанка |

**Response:** `ChunkResponse`

---

#### PUT `/{collection}/documents/{documentId}/chunks/{chunkId}`

Оновити чанк.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `collection` | string | Назва колекції |
| `documentId` | Guid | ID документа |
| `chunkId` | long | ID чанка |

**Request Body:** `ChunkUpdateRequest`

```json
{
  "content": "string",
  "metadata": { "key": "value" }
}
```

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `content` | string? | Ні | Новий вміст |
| `metadata` | Dictionary\<string, object\>? | Ні | Нові метадані |

**Response:** `ChunkResponse`

---

#### DELETE `/{collection}/documents/{documentId}/chunks/{chunkId}`

Видалити чанк.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `collection` | string | Назва колекції |
| `documentId` | Guid | ID документа |
| `chunkId` | long | ID чанка |

**Response:** `ActionResultResponse`

---

### 4.4 Search (Пошук)

#### POST `/{collection}/search`

Семантичний пошук по колекції документів.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `collection` | string | Назва колекції |

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

| Поле | Тип | Обов'язкове | Default | Опис |
|------|-----|:-----------:|---------|------|
| `query` | string | Так | — | Пошуковий запит |
| `top_k` | int? | Ні | `5` | Кількість результатів |
| `metric` | string? | Ні | `cosine` | Метрика відстані |
| `score_mode` | string? | Ні | `similarity` | Режим оцінки |
| `tags` | List\<string\>? | Ні | — | Фільтр по тегах |
| `min_score` | double? | Ні | — | Мінімальний поріг релевантності |
| `include_content` | bool? | Ні | `true` | Включати вміст чанків |
| `include_metadata` | bool? | Ні | `true` | Включати метадані |
| `select` | string? | Ні | — | Вибіркові поля |
| `search_fields` | string? | Ні | — | Поля пошуку |
| `decorators` | Dictionary\<string, object\>? | Ні | — | Декоратори запиту |

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

Низькорівневий API для роботи з векторними базами даних.

---

### POST `/{name}/table`

Отримати структуру таблиці.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `name` | string | Назва таблиці |

**Request Body:** `VectorGetTableRequestViewModel`

```json
{
  "provider": "Pgvector"
}
```

---

### POST `/{name}/get`

Отримати дані з таблиці.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `name` | string | Назва таблиці |

**Request Body:** `VectorGetRequestViewModel`

```json
{
  "provider": "Pgvector",
  "select": "id, content, embedding",
  "embedding": "field_name"
}
```

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `provider` | VectorDbProviderEnum | Так | Провайдер БД |
| `select` | string | Так | SQL select вираз |
| `embedding` | string | Так | Поле ембедінгу |

---

### POST `/db`

Створити нову векторну базу даних.

**Request Body:** `VectorDatabaseRequestViewModel`

```json
{
  "provider": "Pgvector",
  "database_name": "string",
  "description": "string"
}
```

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `provider` | VectorDbProviderEnum | Так | Провайдер БД |
| `database_name` | string | Так | Назва бази даних |
| `description` | string | Так | Опис |

---

### POST `/execute`

Виконати SQL запит (non-query).

**Request Body:** `VectorExecuteRequestViewModel`

```json
{
  "provider": "Pgvector",
  "database_name": "string",
  "query": "CREATE INDEX ..."
}
```

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `provider` | VectorDbProviderEnum | Так | Провайдер БД |
| `database_name` | string | Так | Назва БД |
| `query` | string | Так | SQL запит |

---

### POST `/execute-reader`

Виконати SQL запит з поверненням даних.

**Request Body:** `VectorExecuteRequestViewModel` (ідентичний `/execute`)

---

### POST `/create`

Створити нову векторну таблицю.

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

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `provider` | VectorDbProviderEnum | Так | Провайдер БД |
| `name` | string | Так | Назва таблиці |
| `fields` | List\<FieldViewModel\> | Так | Визначення полів |
| `vector_search` | VectorCreateSearchViewModel? | Ні | Налаштування пошуку |

**FieldViewModel:**

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `name` | string | Так | Назва поля |
| `type` | string | Так | Тип: `bigint`, `text`, `vector`, `jsonb`, тощо |
| `key` | bool? | Ні | Первинний ключ |
| `dimensions` | int? | Ні | Розмірність вектора (для типу `vector`) |
| `auto_increment` | bool? | Ні | Авто-інкремент |
| `vector_search_profile` | string? | Ні | Профіль пошуку |

---

### PUT `/{name}/update`

Оновити структуру векторної таблиці.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `name` | string | Назва таблиці |

**Request Body:** `VectorCreateRequestViewModel` (ідентичний `/create`)

---

### POST `/{name}/upload`

Завантажити документи у векторну таблицю.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `name` | string | Назва таблиці |

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

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `provider` | VectorDbProviderEnum | Так | Провайдер БД |
| `model` | string | Так | Модель для ембедінгів |
| `value` | List\<Dictionary\<string, object\>\> | Так | Масив документів |
| `chunk_length` | int? | Ні | Довжина чанка |

---

### POST `/{name}/search`

Векторний пошук у таблиці.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `name` | string | Назва таблиці |

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

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `provider` | VectorDbProviderEnum | Так | Провайдер БД |
| `model` | string | Ні | Модель для ембедінгів. Default: `BAAI/bge-m3` |
| `search` | string | Так | Текст пошуку |
| `select` | string | Так | Поля для вибірки |
| `search_fields` | string | Так | Поля для пошуку |
| `embedding` | string | Так | Поле ембедінгу |
| `vector_queries` | List\<VectorQueryViewModel\>? | Ні | Додаткові векторні запити |

**VectorQueryViewModel:**

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `vector` | object | Так | Вектор для пошуку (масив чисел) |
| `fields` | string | Так | Поля для порівняння |
| `k` | int? | Ні | Кількість найближчих сусідів |
| `metric` | string | Ні | Метрика відстані |
| `decorators` | Dictionary\<string, object\>? | Ні | Декоратори запиту |

---

### DELETE `/{name}/delete`

Видалити записи з таблиці за умовою.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `name` | string | Назва таблиці |

**Request Body:** `VectorDeleteRequestViewModel`

```json
{
  "provider": "Pgvector",
  "delete_field": "id",
  "value": 42
}
```

| Поле | Тип | Обов'язкове | Опис |
|------|-----|:-----------:|------|
| `provider` | VectorDbProviderEnum | Так | Провайдер БД |
| `delete_field` | string | Так | Поле для фільтрації |
| `value` | object | Так | Значення для видалення |

---

### DELETE `/{name}/drop`

Видалити (DROP) таблицю повністю.

**Route Parameters:**

| Параметр | Тип | Опис |
|----------|-----|------|
| `name` | string | Назва таблиці |

**Request Body:** `VectorDeleteRequestViewModel` (ідентичний `/delete`)

---

## 6. Database Migration API

**Base URL:** `api/v2/ai/llm-db`

### GET `/migrate`

Запустити міграції бази даних вручну.

**Response:** OK

---

## 7. Enums

### DeviceEnum

| Значення | Код | Опис |
|----------|:---:|------|
| `cpu` | 1 | CPU обчислення |
| `cuda` | 2 | GPU (NVIDIA CUDA) |

### LlmStatusEnum

| Значення | Код | Опис |
|----------|:---:|------|
| `DRAFT` | 0 | Чернетка (нова модель) |
| `VALIDATED` | 1 | Валідована (перевірена) |
| `DISABLED` | 2 | Вимкнена |

### AccessModeEnum

| Значення | Код | Опис |
|----------|:---:|------|
| `direct` | 1 | Прямий доступ |
| `internal_service` | 2 | Через внутрішній сервіс |
| `external_service` | 3 | Через зовнішній сервіс |

### VectorDbProviderEnum

| Значення | Код | Опис |
|----------|:---:|------|
| `Pgvector` | 1 | PostgreSQL з pgvector |

---

## Загальні відповіді помилок

Усі ендпоінти можуть повернути `ErrorResponse`:

```json
{
  "status": 400,
  "code": 0,
  "message": "Error description",
  "type": "ValidationError"
}
```

| HTTP Status | Опис |
|:-----------:|------|
| 400 | Bad Request — невалідний запит |
| 404 | Not Found — ресурс не знайдено |
| 409 | Conflict — конфлікт (наприклад, дублікат назви) |
| 500 | Internal Server Error |

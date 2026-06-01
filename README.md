# AI LLM UI Plugin

AI LLM UI Plugin is an Angular-based MEF.DEV UI plugin for working with the `ai` backend module.
It provides an internal AI workbench where users can manage model connections, test chat and response APIs, create searchable document knowledge, inspect embeddings, and verify vector search behavior.

The plugin is built with:

- Angular
- TypeScript
- `@natec/mef-dev-ui-kit`
- `@natec/mef-dev-platform-connector`
- MEF.DEV plugin metadata and routing

## Purpose

The goal of this plugin is to make AI backend functionality easier to test and understand from a user interface.
Instead of calling every endpoint manually from tools such as Postman or Swagger, users can work through guided pages inside the MEF.DEV platform.

The plugin is useful for:

- testing registered LLM models
- comparing Chat Completions and Responses API behavior
- adding knowledge into document collections
- testing semantic document search
- generating and inspecting embeddings
- validating low-level vector table search
- helping developers debug request and response payloads

## Main Features

### Models

The Models page manages the LLM registry.

Users can:

- view registered AI models
- inspect model details
- create new model registrations
- update existing model settings
- validate models against the backend
- delete models that are no longer needed

Models act as reusable AI connections. Once a model is registered, other pages such as Chat and Responses can use it without repeating the same configuration.

### Chat

The Chat page is used for quick conversational testing.

Users can:

- select a registered model
- write a system instruction
- write a user message
- configure request settings such as temperature and token limits
- enable or test streaming behavior where supported
- send a Chat Completions request
- inspect the returned assistant response
- review useful response metadata such as model and token usage

This page is best for simple prompt testing and conversation-style AI interaction.

### Responses

The Responses page provides a more structured AI request workflow.

Users can:

- select a model
- enter a developer instruction
- enter a user request
- configure output length
- configure reasoning effort where supported
- send a request to the Responses API
- inspect the returned text and raw response data

Chat is the more conversational interface, while Responses is the more controlled request interface.

### Documents

The Documents page is used to create searchable knowledge collections.

Users can:

- create or select a collection
- define the collection model, provider, chunk length, and chunk overlap
- add knowledge directly as text
- upload supported text-like files where the backend upload path is available
- store document content in the backend
- split long content into chunks
- generate embeddings for stored chunks
- search the collection by meaning
- inspect returned document search results

A collection works like a knowledge base. Content is stored once, processed by the backend, and later searched with natural language questions.

### Embeddings

The Embeddings page exposes the technical step behind semantic search.

Users can:

- enter text input
- choose an embedding model
- send an embedding request
- inspect the returned vector
- check vector dimensions and raw response details

An embedding is a numerical representation of text meaning. Embeddings make it possible to compare text by meaning instead of only exact words.

### Vector Search

The Vector Search page is a lower-level developer tool for testing vector tables directly.

Users can:

- enter a vector table name
- load the table schema
- inspect available fields
- choose a search mode
- enter a semantic query
- choose returned fields
- set result limits
- choose the vector field and metric
- run a vector search request
- inspect returned rows and raw JSON payloads

This page is mainly intended for developers and testers. It helps verify that the database-level vector search layer works correctly.

## Typical Workflow

1. Register or select an AI model on the Models page.
2. Test the model through Chat or Responses.
3. Create a document collection on the Documents page.
4. Add knowledge as text or supported files.
5. Let the backend split the content into chunks and generate embeddings.
6. Search the collection with natural language questions.
7. Use the Embeddings page to inspect raw vector generation.
8. Use the Vector Search page to test lower-level vector table search directly.

## Project Structure

```text
src/app
├── container
│   └── plugin-shell
├── core
│   ├── navigation
│   └── services
├── modules
│   ├── chat
│   ├── document
│   ├── embeddings
│   ├── llm
│   ├── responses
│   └── vector
└── shared
```

The app is separated into feature modules so each page can keep its own components, models, and services.

## Local Development

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm start
```

Open:

```text
http://localhost:4200
```

## Build

Build the MEF.DEV plugin artifact:

```bash
npm run build:plugin
```

The production artifact is generated in:

```text
dist/ai-llm-ui
```

## MEF.DEV Plugin Metadata

`metadata.json` contains the plugin menu route configuration used during publication to the MEF.DEV platform.

Current plugin routes include:

- Chat
- LLM DB / Vector
- Document
- Embeddings
- LLM / Models
- Vector

## Configuration

Runtime backend connection values are configured in:

```text
src/environments/environment.ts
```

Before committing or publishing this project publicly, do not store real credentials in this file.
Use empty values, local-only configuration, or a secure runtime configuration method.

Example:

```ts
export const environment = {
  production: false,
  version: PLUGIN_VERSION.version,
  alias: 'ai',
  apiUrl: 'https://stage-api.mef.dev',
  bauth: ''
};
```

## Publish To MEF.DEV

Build the plugin first:

```bash
npm run build:plugin
```

Then publish with the MEF.DEV publish command used by the project:

```bash
npm run publish -- apiUrl=https://stage-api.mef.dev
```

If authentication is required, provide it through the approved project workflow and avoid committing credentials to source control.

## Current Notes

- Text-based document ingestion and semantic search are the most stable document demo path.
- File upload UI is present, but the backend upload path may require environment-specific validation.
- Raw numeric vector upload/search is not the primary UI path because the stable flow uses table-based semantic search.
- Vector Search requires an existing backend vector table with uploaded rows before it can return results.

## License

This project follows the license and distribution rules of the MEF.DEV organization repository where it is published.

import { Component } from '@angular/core';
import { ModulePageConfig } from './module-page.component';

@Component({
  selector: 'app-vector-page',
  standalone: false,
  template: '<app-module-page [config]="config"></app-module-page>'
})
export class VectorPageComponent {
  readonly config: ModulePageConfig = {
    name: 'vector',
    subtitle: 'The search layer that compares embeddings and returns the nearest matching content.',
    purpose: 'Vector modules are usually used for semantic search and retrieval, especially in RAG systems where the app needs relevant document chunks before calling the LLM.',
    sections: [
      {
        title: 'Main idea',
        text: 'A vector store keeps embedding values and supports nearest-neighbor search for similar content.'
      },
      {
        title: 'Typical workflow',
        text: 'Index chunks, embed a query, compare vectors, and return the most relevant matches with scores.'
      },
      {
        title: 'User-facing result',
        text: 'The page can present retrieved snippets, relevance scores, and source references before generation.'
      }
    ],
    actions: [
      { label: 'Similarity search', description: 'Show a simple search form that can later call the vector endpoint.' },
      { label: 'Results table', description: 'Reserve space for matches, scores, and linked document references.' },
      { label: 'RAG bridge', description: 'Explain or connect how vector retrieval feeds context into the chat or LLM pages.' }
    ]
  };
}

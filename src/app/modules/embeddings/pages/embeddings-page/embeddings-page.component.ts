import { Component } from '@angular/core';
import { ModulePageConfig } from '../../../../shared/components/module-page/module-page.component';

@Component({
  selector: 'app-embeddings-page',
  standalone: false,
  template: '<app-module-page [config]="config"></app-module-page>'
})
export class EmbeddingsPageComponent {
  readonly config: ModulePageConfig = {
    name: 'embeddings',
    subtitle: 'The module that converts text into numeric vectors so meaning can be compared mathematically.',
    purpose: 'Embeddings power semantic search, document retrieval, clustering, and recommendation features. They are a foundation for retrieval-augmented generation systems.',
    sections: [
      {
        title: 'Main idea',
        text: 'An embedding is a vector representation of text where similar texts end up close to each other.'
      },
      {
        title: 'Typical use',
        text: 'Convert a user question and stored document chunks into vectors, then compare them by similarity.'
      },
      {
        title: 'Why it matters',
        text: 'Embeddings let the app retrieve relevant information even when the words are not an exact match.'
      }
    ],
    actions: [
      { label: 'Generate vectors', description: 'Expose a simple action to request embeddings for sample text or uploaded content.' },
      { label: 'Preview payloads', description: 'Show the source text and metadata around the generated embeddings.' },
      { label: 'Retrieval hook', description: 'Prepare this page to connect with vector search results later.' }
    ]
  };
}

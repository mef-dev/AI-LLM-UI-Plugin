import { Component } from '@angular/core';

interface EmbeddingPreview {
  model: string;
  dimensions: number;
  chunkStrategy: string;
  vector: number[];
  textLength: number;
  normalized: boolean;
}

@Component({
  selector: 'app-embeddings-workspace',
  standalone: false,
  templateUrl: './embeddings-workspace.component.html',
  styleUrls: ['./embeddings-workspace.component.scss']
})
export class EmbeddingsWorkspaceComponent {
  readonly models = [
    'text-embedding-3-large',
    'text-embedding-3-small',
    'natec/internal-embedding-v1',
  ];

  sourceText =
    'Customers reported unstable invoice totals after a tariff update. We need to search related release notes and support knowledge before escalation.';
  chunkLabel = 'billing-release-notes';
  chunkStrategy = 'sentence_window';
  selectedModel = this.models[0];
  normalized = true;
  successMessage = '';

  preview = this.generatePreview();

  generateEmbedding(): void {
    this.preview = this.generatePreview();
    this.successMessage = 'Mock embedding regenerated from the current text and settings.';
  }

  get previewJson(): string {
    return JSON.stringify(
      {
        model: this.preview.model,
        chunk_label: this.chunkLabel,
        chunk_strategy: this.preview.chunkStrategy,
        normalized: this.preview.normalized,
        dimensions: this.preview.dimensions,
        text_length: this.preview.textLength,
        embedding: this.preview.vector,
      },
      null,
      2
    );
  }

  private generatePreview(): EmbeddingPreview {
    const base = Array.from({ length: 12 }, (_, index) => {
      const seed = this.sourceText.charCodeAt(index % Math.max(this.sourceText.length, 1)) || 65;
      const value = (((seed * (index + 7)) % 97) / 97) * 2 - 1;
      return Number(value.toFixed(4));
    });

    return {
      model: this.selectedModel,
      dimensions: 1536,
      chunkStrategy: this.chunkStrategy,
      vector: base,
      textLength: this.sourceText.trim().length,
      normalized: this.normalized,
    };
  }
}

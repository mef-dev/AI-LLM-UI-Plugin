import { Component } from '@angular/core';

type EmbeddingInputMode = 'single' | 'batch';
type ChunkStrategy = 'sentence_window' | 'paragraph' | 'document';

interface EmbeddingPreview {
  model: string;
  dimensions: number;
  chunkStrategy: ChunkStrategy;
  vector: number[];
  textLength: number;
  normalized: boolean;
  inputMode: EmbeddingInputMode;
  itemCount: number;
  chunkCount: number;
  chunkPreviews: string[];
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

  readonly inputModes: EmbeddingInputMode[] = ['single', 'batch'];
  readonly chunkStrategies: ChunkStrategy[] = ['sentence_window', 'paragraph', 'document'];
  readonly modelDimensions: Record<string, number> = {
    'text-embedding-3-large': 3072,
    'text-embedding-3-small': 1536,
    'natec/internal-embedding-v1': 1024,
  };

  inputMode: EmbeddingInputMode = 'single';
  sourceText =
    'Customers reported unstable invoice totals after a tariff update. We need to search related release notes and support knowledge before escalation.';
  batchSourceText = [
    'Invoice totals changed after the tariff update and finance needs related release notes.',
    'Support asked for the latest escalation procedure for billing mismatches.',
    'Operations wants a searchable summary of pricing-rule incidents from the last quarter.',
  ].join('\n');
  chunkLabel = 'billing-release-notes';
  chunkStrategy: ChunkStrategy = 'sentence_window';
  selectedModel = this.models[0];
  normalized = true;
  successMessage = '';

  preview = this.generatePreview();

  setInputMode(mode: EmbeddingInputMode): void {
    this.inputMode = mode;
    this.syncPreview();
  }

  generateEmbedding(): void {
    this.preview = this.generatePreview();
    this.successMessage = 'Preview regenerated from the current embeddings setup.';
  }

  syncPreview(): void {
    this.preview = this.generatePreview();
    this.successMessage = '';
  }

  get parsedInputs(): string[] {
    return this.inputMode === 'single'
      ? [this.sourceText.trim()].filter(Boolean)
      : this.batchSourceText
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean);
  }

  get sampleVector(): number[] {
    return this.preview.vector.slice(0, 8);
  }

  get previewJson(): string {
    return JSON.stringify(
      {
        input: this.inputMode === 'single' ? this.parsedInputs[0] || '' : this.parsedInputs,
        model: this.preview.model,
        chunk_label: this.chunkLabel,
        chunk_strategy: this.preview.chunkStrategy,
        normalized: this.preview.normalized,
        dimensions: this.preview.dimensions,
        item_count: this.preview.itemCount,
        chunk_count: this.preview.chunkCount,
        text_length: this.preview.textLength,
        embedding_preview: this.preview.vector,
      },
      null,
      2
    );
  }

  private generatePreview(): EmbeddingPreview {
    const inputs = this.parsedInputs;
    const combinedText = inputs.join(' ');
    const chunkPreviews = this.buildChunks(inputs);
    const base = Array.from({ length: 12 }, (_, index) => {
      const seed = combinedText.charCodeAt(index % Math.max(combinedText.length, 1)) || 65;
      const value = (((seed * (index + 7)) % 97) / 97) * 2 - 1;
      return Number(value.toFixed(4));
    });

    return {
      model: this.selectedModel,
      dimensions: this.modelDimensions[this.selectedModel] ?? 1536,
      chunkStrategy: this.chunkStrategy,
      vector: base,
      textLength: combinedText.trim().length,
      normalized: this.normalized,
      inputMode: this.inputMode,
      itemCount: inputs.length,
      chunkCount: chunkPreviews.length,
      chunkPreviews,
    };
  }

  private buildChunks(inputs: string[]): string[] {
    if (!inputs.length) {
      return [];
    }

    switch (this.chunkStrategy) {
      case 'document':
        return inputs.map((input) => this.truncateChunk(input));
      case 'paragraph':
        return inputs.flatMap((input) =>
          input
            .split(/\n{2,}/)
            .map((chunk) => chunk.trim())
            .filter(Boolean)
            .map((chunk) => this.truncateChunk(chunk))
        );
      case 'sentence_window':
      default:
        return inputs.flatMap((input) => {
          const sentences = input
            .split(/(?<=[.!?])\s+/)
            .map((chunk) => chunk.trim())
            .filter(Boolean);

          if (sentences.length <= 1) {
            return [this.truncateChunk(input)];
          }

          return sentences.map((sentence, index) =>
            this.truncateChunk(
              index === 0 ? sentence : `${sentences[index - 1]} ${sentence}`
            )
          );
        });
    }
  }

  private truncateChunk(value: string): string {
    const compact = value.replace(/\s+/g, ' ').trim();
    return compact.length > 140 ? `${compact.slice(0, 137)}...` : compact;
  }
}

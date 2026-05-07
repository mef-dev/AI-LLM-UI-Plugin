import { Component } from '@angular/core';
import { EmbeddingsApiService } from '../../services/embeddings-api.service';
import { EmbeddingsRequest, EmbeddingsResponse } from '../../models/embeddings.models';

type EmbeddingInputMode = 'single' | 'batch';

interface EmbeddingPreview {
  model: string;
  dimensions: number;
  textLength: number;
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
  readonly models = ['BAAI/bge-m3'];

  readonly inputModes: EmbeddingInputMode[] = ['single', 'batch'];

  inputMode: EmbeddingInputMode = 'single';
  readonly sourceTextPlaceholder =
    'Customers reported unstable invoice totals after a tariff update. We need to search related release notes and support knowledge before escalation.';
  readonly batchSourceTextPlaceholder = [
    'Invoice totals changed after the tariff update and finance needs related release notes.',
    'Support asked for the latest escalation procedure for billing mismatches.',
    'Operations wants a searchable summary of pricing-rule incidents from the last quarter.',
  ].join('\n');

  sourceText =
    'Customers reported unstable invoice totals after a tariff update. We need to search related release notes and support knowledge before escalation.';
  batchSourceText = '';
  selectedModel = 'BAAI/bge-m3';
  chunkLength = 512;
  response: EmbeddingsResponse | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';

  preview = this.generatePreview();

  constructor(private readonly embeddingsApi: EmbeddingsApiService) {}

  setInputMode(mode: EmbeddingInputMode): void {
    this.inputMode = mode;
    this.syncPreview();
  }

  generateEmbedding(): void {
    const inputs = this.parsedInputs;

    if (!inputs.length) {
      this.errorMessage = 'Add source text before generating embeddings.';
      this.successMessage = '';
      this.response = null;
      return;
    }

    const request: EmbeddingsRequest = {
      model: this.selectedModel,
      input: this.inputMode === 'single' ? inputs[0] : inputs,
      chunk_length: this.chunkLength,
    };

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.embeddingsApi.generateEmbeddings(request).subscribe({
      next: (response) => {
        this.response = response;
        this.preview = this.generatePreview(response);
        this.loading = false;
        this.successMessage = 'Embeddings generated successfully.';
      },
      error: (error: Error) => {
        this.loading = false;
        this.errorMessage = error.message;
        this.response = null;
      },
    });
  }

  syncPreview(): void {
    this.preview = this.generatePreview();
    this.response = null;
    this.errorMessage = '';
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
    return this.response?.data[0]?.embedding.slice(0, 8) ?? [];
  }

  get requestJson(): string {
    return JSON.stringify(
      {
        input: this.inputMode === 'single' ? this.parsedInputs[0] || '' : this.parsedInputs,
        model: this.preview.model,
        chunk_length: this.chunkLength,
      },
      null,
      2
    );
  }

  get responseJson(): string {
    if (!this.response) {
      return '';
    }

    const summarizedData = this.response.data.map((item, index) => ({
      index: item.index ?? index,
      dimensions: item.embedding?.length ?? 0,
      firstValues: item.embedding?.slice(0, 12) ?? [],
    }));

    return JSON.stringify(
      {
        ...this.response,
        data: summarizedData,
      },
      null,
      2
    );
  }

  get requestItemSummary(): string {
    return this.inputMode === 'single' ? '1 text item' : `${this.parsedInputs.length} text items`;
  }

  get inputLengthSummary(): string {
    return `${this.preview.textLength} characters`;
  }

  get responseStatusLabel(): string {
    if (this.loading) {
      return 'generating';
    }

    return this.response ? 'ready' : 'idle';
  }

  get firstVectorPreview(): string {
    if (!this.response?.data[0]?.embedding?.length) {
      return 'No vector returned yet.';
    }

    return JSON.stringify(this.response.data[0].embedding.slice(0, 12));
  }

  get diagnosticsVectorPreview(): string {
    if (!this.response?.data[0]?.embedding?.length) {
      return 'No embedding returned yet.';
    }

    const values = this.response.data[0].embedding;
    const preview = values.slice(0, 24);

    return `${JSON.stringify(preview, null, 2)}\n\n... ${Math.max(values.length - preview.length, 0)} more values omitted`;
  }

  private generatePreview(response?: EmbeddingsResponse | null): EmbeddingPreview {
    const inputs = this.parsedInputs;
    const combinedText = inputs.join(' ');
    const chunkPreviews = this.buildChunks(inputs, this.chunkLength);
    const firstEmbedding = response?.data[0]?.embedding;

    return {
      model: this.selectedModel,
      dimensions: firstEmbedding?.length ?? 0,
      textLength: combinedText.trim().length,
      inputMode: this.inputMode,
      itemCount: inputs.length,
      chunkCount: chunkPreviews.length,
      chunkPreviews,
    };
  }

  private buildChunks(inputs: string[], chunkLength: number): string[] {
    if (!inputs.length) {
      return [];
    }

    return inputs.flatMap((input) => {
      const compact = input.replace(/\s+/g, ' ').trim();

      if (!compact) {
        return [];
      }

      if (compact.length <= chunkLength) {
        return [this.truncateChunk(compact)];
      }

      const chunks: string[] = [];
      for (let start = 0; start < compact.length; start += chunkLength) {
        chunks.push(this.truncateChunk(compact.slice(start, start + chunkLength)));
      }
      return chunks;
    });
  }

  private truncateChunk(value: string): string {
    const compact = value.replace(/\s+/g, ' ').trim();
    return compact.length > 140 ? `${compact.slice(0, 137)}...` : compact;
  }
}

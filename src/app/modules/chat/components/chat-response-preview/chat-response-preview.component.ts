import { Component, Input } from '@angular/core';
import { ChatCompletionResponse, ChatCompletionsRequest } from '../../models/chat-completions.models';

@Component({
  selector: 'app-chat-response-preview',
  standalone: false,
  templateUrl: './chat-response-preview.component.html',
  styleUrls: ['./chat-response-preview.component.scss']
})
export class ChatResponsePreviewComponent {
  @Input() response: ChatCompletionResponse | null = null;
  @Input() request: ChatCompletionsRequest | null = null;
  @Input() loading = false;
  @Input() statusMessage = '';
  @Input() successMessage = '';
  @Input() streamingContent = '';
  @Input() streamingEnabled = false;
  copiedTarget: 'request' | 'response' | null = null;

  get previewMessage(): string {
    if (this.streamingEnabled && this.streamingContent) {
      return this.streamingContent;
    }

    return this.response?.choices[0]?.message.content || '';
  }

  formatJson(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }

  async copyJson(value: unknown, target: 'request' | 'response'): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(this.formatJson(value));
    this.copiedTarget = target;
    setTimeout(() => {
      if (this.copiedTarget === target) {
        this.copiedTarget = null;
      }
    }, 1600);
  }
}

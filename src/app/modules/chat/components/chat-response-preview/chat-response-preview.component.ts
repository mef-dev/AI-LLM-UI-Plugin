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
  @Input() successMessage = '';
  copiedTarget: 'request' | 'response' | null = null;

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

  formatJsonHtml(value: unknown): string {
    const json = JSON.stringify(value, null, 2);
    const escaped = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const highlighted = escaped.replace(
      /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?/g,
      (match, stringToken, keySuffix) => {
        if (keySuffix) {
          return `<span class="json-key">${stringToken}</span><span class="json-punctuation">:</span>`;
        }

        if (stringToken) {
          return `<span class="json-string">${stringToken}</span>`;
        }

        if (match === 'true' || match === 'false') {
          return `<span class="json-boolean">${match}</span>`;
        }

        if (match === 'null') {
          return `<span class="json-null">${match}</span>`;
        }

        return `<span class="json-number">${match}</span>`;
      }
    );

    return highlighted
      .replace(/([{}[\]])/g, '<span class="json-bracket">$1</span>')
      .replace(/,/g, '<span class="json-comma">,</span>')
      .split('\n')
      .map((line, index) => {
        const indent = (line.match(/^ */)?.[0].length ?? 0) / 2;
        return `<span class="json-line" style="--indent:${indent}"><span class="json-line-number">${index + 1}</span><span class="json-line-code">${line || ' '}</span></span>`;
      })
      .join('');
  }
}

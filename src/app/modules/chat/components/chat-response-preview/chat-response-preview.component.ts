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

  formatJson(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }
}

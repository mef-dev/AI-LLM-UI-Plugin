import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChatCompletionResponse, ChatCompletionsRequestMessage } from '../../models/chat-completions.models';

@Component({
  selector: 'app-chat-messages-editor',
  standalone: false,
  templateUrl: './chat-messages-editor.component.html',
  styleUrls: ['./chat-messages-editor.component.scss']
})
export class ChatMessagesEditorComponent {
  @Input({ required: true }) messages: ChatCompletionsRequestMessage[] = [];
  @Input() response: ChatCompletionResponse | null = null;
  @Input() errorMessage = '';
  @Input() loading = false;
  @Input() statusMessage = '';
  @Input() successMessage = '';
  @Input() streamingEnabled = false;
  @Input() streamingContent = '';

  @Output() send = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  get assistantMessage(): string {
    if (this.streamingEnabled && this.streamingContent) {
      return this.streamingContent;
    }

    return this.response?.choices[0]?.message.content || '';
  }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChatCompletionsRequestMessage, ChatMessageRole } from '../../models/chat-completions.models';

@Component({
  selector: 'app-chat-messages-editor',
  standalone: false,
  templateUrl: './chat-messages-editor.component.html',
  styleUrls: ['./chat-messages-editor.component.scss']
})
export class ChatMessagesEditorComponent {
  @Input({ required: true }) messages: ChatCompletionsRequestMessage[] = [];
  @Input({ required: true }) roles: ChatMessageRole[] = [];
  @Input() errorMessage = '';
  @Input() loading = false;
  @Input() streamingEnabled = false;
  @Input() streamingContent = '';

  @Output() addUserMessage = new EventEmitter<void>();
  @Output() removeMessage = new EventEmitter<number>();
  @Output() send = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}

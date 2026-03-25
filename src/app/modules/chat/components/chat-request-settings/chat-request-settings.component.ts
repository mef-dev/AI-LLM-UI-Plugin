import { Component, Input } from '@angular/core';
import { ChatCompletionsRequest } from '../../models/chat-completions.models';

@Component({
  selector: 'app-chat-request-settings',
  standalone: false,
  templateUrl: './chat-request-settings.component.html',
  styleUrls: ['./chat-request-settings.component.scss']
})
export class ChatRequestSettingsComponent {
  @Input({ required: true }) request!: ChatCompletionsRequest;
}

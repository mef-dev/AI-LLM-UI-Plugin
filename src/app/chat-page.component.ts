import { Component } from '@angular/core';
import { ModulePageConfig } from './module-page.component';

@Component({
  selector: 'app-chat-page',
  standalone: false,
  template: '<app-module-page [config]="config"></app-module-page>'
})
export class ChatPageComponent {
  readonly config: ModulePageConfig = {
    name: 'chat',
    subtitle: 'The chat-completion loop where user messages are sent to the model and answers come back to the UI.',
    purpose: 'This page represents the part of the application that handles prompt input, message history, assistant output, and the repeated request-response cycle often described as a chat loop.',
    sections: [
      {
        title: 'Main idea',
        text: 'Chat pages collect user input, send message arrays to the backend, and render the next assistant response.'
      },
      {
        title: 'Typical inputs',
        text: 'A prompt box, model settings, system instructions, and previous conversation messages.'
      },
      {
        title: 'Expected output',
        text: 'A structured response that can be shown as assistant text, streaming tokens, or tool-call results.'
      }
    ],
    actions: [
      { label: 'Prompt form', description: 'Create a message input and submit button for chat-completion requests.' },
      { label: 'History panel', description: 'Keep the previous user and assistant messages visible to show the loop clearly.' },
      { label: 'Response states', description: 'Handle loading, success, and error states so the chat flow feels complete.' }
    ]
  };
}

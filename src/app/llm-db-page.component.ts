import { Component } from '@angular/core';
import { ModulePageConfig } from './module-page.component';

@Component({
  selector: 'app-llm-db-page',
  standalone: false,
  template: '<app-module-page [config]="config"></app-module-page>'
})
export class LlmDbPageComponent {
  readonly config: ModulePageConfig = {
    name: 'llm-db',
    subtitle: 'The storage-oriented part of the system for keeping model-related records, sessions, or saved outputs.',
    purpose: 'This module usually sits between frontend actions and persistent data, helping the app save chat history, prompt templates, generated answers, or configuration tied to LLM usage.',
    sections: [
      {
        title: 'Main idea',
        text: 'Store and retrieve information related to LLM features so users can continue work across sessions.'
      },
      {
        title: 'Typical records',
        text: 'Chats, prompt presets, model selections, response logs, or document references linked to AI results.'
      },
      {
        title: 'Why it matters',
        text: 'Without persistence, every chat starts from zero and the application loses traceability.'
      }
    ],
    actions: [
      { label: 'Saved sessions', description: 'Show a list of previous conversations or generated artifacts from the database.' },
      { label: 'Detail view', description: 'Allow the user to inspect a stored entry with timestamps and metadata.' },
      { label: 'Sync controls', description: 'Add actions to refresh, reload, or reconnect stored data from the backend.' }
    ]
  };
}

import { Component } from '@angular/core';
import { ModulePageLayoutConfig } from '../../../../shared/layouts/module-page-layout/module-page-layout.models';

@Component({
  selector: 'app-llm-db-page',
  standalone: false,
  templateUrl: './llm-db-page.component.html',
  styleUrls: ['./llm-db-page.component.scss'],
})
export class LlmDbPageComponent {
  readonly config: ModulePageLayoutConfig = {
    name: 'LLM data and history',
    eyebrow: 'LLM database',
    badgeLabel: 'Planned workflow',
    badgeTone: 'warning',
    subtitle: 'Bring saved sessions, prompt presets, and generated outputs into one durable workspace.',
    purpose:
      'This module is meant to sit between the interactive AI pages and long-term storage so teams can revisit previous work instead of starting from zero each time.',
    overviewTitle: 'What this module is for',
    actionsTitle: 'Future workflows',
    sections: [
      {
        title: 'Persistent conversation history',
        text: 'Store and reopen previous chat sessions, prompts, and responses so users can continue work across visits.'
      },
      {
        title: 'Saved AI artifacts',
        text: 'Keep prompt templates, model selections, structured outputs, and document-linked results in one place.'
      },
      {
        title: 'Operational traceability',
        text: 'A stored record makes it easier to review what was generated, when it happened, and which model or workflow produced it.'
      }
    ],
    actions: [
      {
        label: 'Session library',
        description: 'Browse previous conversations, saved prompts, and generated artifacts from a searchable history view.'
      },
      {
        label: 'Record details',
        description: 'Inspect a stored entry with timestamps, model metadata, and the related source content or response payload.'
      },
      {
        label: 'Storage health',
        description: 'Surface sync status, refresh controls, and backend connection state so stored data feels dependable.'
      }
    ]
  };
}

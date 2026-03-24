import { Component } from '@angular/core';
import { ModulePageConfig } from './module-page.component';

@Component({
  selector: 'app-llm-page',
  standalone: false,
  template: '<app-module-page [config]="config"></app-module-page>'
})
export class LlmPageComponent {
  readonly config: ModulePageConfig = {
    name: 'llm',
    subtitle: 'The core model-facing page for prompts, completions, parameters, and generated answers.',
    purpose: 'This module represents direct interaction with the language model itself, separate from document management or vector search support features.',
    sections: [
      {
        title: 'Main idea',
        text: 'Send instructions or prompts to the model and receive generated text, classifications, summaries, or structured output.'
      },
      {
        title: 'Common parameters',
        text: 'Model name, temperature, top-p, max tokens, system message, and output format settings.'
      },
      {
        title: 'Frontend responsibility',
        text: 'Make those model controls understandable so users can test behavior without reading backend code.'
      }
    ],
    actions: [
      { label: 'Prompt workspace', description: 'Provide an area where a user can test direct LLM prompts and inspect responses.' },
      { label: 'Parameter controls', description: 'Add inputs for model settings like temperature or token limits.' },
      { label: 'Output panel', description: 'Render responses in a readable way with room for future structured results.' }
    ]
  };
}

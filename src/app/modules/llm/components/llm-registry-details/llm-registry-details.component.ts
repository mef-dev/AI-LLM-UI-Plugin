import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LlmRegistryLocator } from '../../models/llm-registry.models';

@Component({
  selector: 'app-llm-registry-details',
  standalone: false,
  templateUrl: './llm-registry-details.component.html',
  styleUrls: ['./llm-registry-details.component.scss']
})
export class LlmRegistryDetailsComponent {
  @Input() model: LlmRegistryLocator | null = null;

  @Output() edit = new EventEmitter<LlmRegistryLocator>();
  @Output() validate = new EventEmitter<LlmRegistryLocator>();
  @Output() delete = new EventEmitter<LlmRegistryLocator>();

  formatJson(value: unknown): string {
    return JSON.stringify(value ?? {}, null, 2);
  }
}

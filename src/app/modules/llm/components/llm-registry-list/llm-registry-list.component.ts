import { Component, EventEmitter, Input, Output } from '@angular/core';
import { formatLlmAccessMode, LlmRegistryLocator } from '../../models/llm-registry.models';

@Component({
  selector: 'app-llm-registry-list',
  standalone: false,
  templateUrl: './llm-registry-list.component.html',
  styleUrls: ['./llm-registry-list.component.scss']
})
export class LlmRegistryListComponent {
  formatAccessMode(value?: string | null): string {
    return formatLlmAccessMode(value);
  }

  @Input() models: LlmRegistryLocator[] = [];
  @Input() loading = false;
  @Input() errorMessage = '';
  @Input() selectedModelId: string | null = null;

  @Output() selected = new EventEmitter<LlmRegistryLocator>();
  @Output() create = new EventEmitter<void>();

  selectModel(model: LlmRegistryLocator): void {
    this.selected.emit(model);
  }

  startCreate(): void {
    this.create.emit();
  }
}

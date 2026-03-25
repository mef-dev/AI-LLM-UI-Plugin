import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LlmRegistryLocator } from '../../models/llm-registry.models';

@Component({
  selector: 'app-llm-registry-list',
  standalone: false,
  templateUrl: './llm-registry-list.component.html',
  styleUrls: ['./llm-registry-list.component.scss']
})
export class LlmRegistryListComponent {
  @Input() models: LlmRegistryLocator[] = [];
  @Input() loading = false;
  @Input() errorMessage = '';
  @Input() selectedModelId: string | null = null;

  @Output() selected = new EventEmitter<string>();

  selectModel(id: string): void {
    this.selected.emit(id);
  }
}

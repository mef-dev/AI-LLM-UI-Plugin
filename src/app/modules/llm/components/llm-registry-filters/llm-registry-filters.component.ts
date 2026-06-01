import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LlmListFilters, LlmStatus } from '../../models/llm-registry.models';

@Component({
  selector: 'app-llm-registry-filters',
  standalone: false,
  templateUrl: './llm-registry-filters.component.html',
  styleUrls: ['./llm-registry-filters.component.scss']
})
export class LlmRegistryFiltersComponent {
  @Input({ required: true }) filters!: LlmListFilters;
  @Input({ required: true }) statuses: LlmStatus[] = [];

  @Output() filtersChanged = new EventEmitter<void>();
}

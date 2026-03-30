import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LlmAccessMode, LlmDevice, LlmStatus } from '../../models/llm-registry.models';
import { LlmRegistryFormValue } from '../../models/llm-registry-form.models';

@Component({
  selector: 'app-llm-registry-form',
  standalone: false,
  templateUrl: './llm-registry-form.component.html',
  styleUrls: ['./llm-registry-form.component.scss']
})
export class LlmRegistryFormComponent {
  @Input({ required: true }) form!: LlmRegistryFormValue;
  @Input({ required: true }) editingModelId: string | null = null;
  @Input({ required: true }) statuses: LlmStatus[] = [];
  @Input({ required: true }) devices: LlmDevice[] = [];
  @Input({ required: true }) accessModes: LlmAccessMode[] = [];
  @Input() saveMessage = '';

  @Output() close = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<void>();
}

import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { LlmAccessMode, LlmAccessModeOption, LlmDevice, LlmStatus } from '../../models/llm-registry.models';
import { LlmRegistryFormValue } from '../../models/llm-registry-form.models';

type RequiredFieldKey = 'model_name' | 'device' | 'url';

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
  @Input({ required: true }) accessModes: LlmAccessModeOption[] = [];
  @Input() errorMessage = '';
  @Input() saveMessage = '';

  @Output() close = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<void>();

  advancedExpanded = false;
  revealedSensitiveField: 'url' | 'headers' | null = null;

  private touchedFields: Record<RequiredFieldKey, boolean> = {
    model_name: false,
    device: false,
    url: false,
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['form'] || changes['editingModelId']) {
      this.resetViewState();
    }

    if (changes['errorMessage'] && /json/i.test(this.errorMessage)) {
      this.advancedExpanded = true;
    }
  }

  get missingRequiredFields(): string[] {
    const missingFields: string[] = [];

    if (!this.form.model_name.trim()) {
      missingFields.push('Model name');
    }

    if (!this.form.device) {
      missingFields.push('Device');
    }

    if (!this.form.url.trim()) {
      missingFields.push('URL');
    }

    return missingFields;
  }

  get isSubmitDisabled(): boolean {
    return this.missingRequiredFields.length > 0;
  }

  get submitDisabledReason(): string {
    if (!this.isSubmitDisabled) {
      return '';
    }

    return `Add the required fields first: ${this.missingRequiredFields.join(', ')}.`;
  }

  get missingFieldsSummary(): string {
    return this.missingRequiredFields.join(', ');
  }

  get isUrlSensitiveHidden(): boolean {
    return !!this.editingModelId && this.revealedSensitiveField !== 'url';
  }

  get areHeadersSensitiveHidden(): boolean {
    return !!this.editingModelId && this.revealedSensitiveField !== 'headers';
  }

  markFieldTouched(field: RequiredFieldKey): void {
    this.touchedFields[field] = true;
  }

  isFieldInvalid(field: RequiredFieldKey): boolean {
    switch (field) {
      case 'model_name':
        return !this.form.model_name.trim();
      case 'device':
        return !this.form.device;
      case 'url':
        return !this.form.url.trim();
    }
  }

  shouldShowFieldHint(field: RequiredFieldKey): boolean {
    return this.touchedFields[field] && this.isFieldInvalid(field);
  }

  toggleAdvanced(): void {
    this.advancedExpanded = !this.advancedExpanded;
  }

  revealSensitiveField(field: 'url' | 'headers'): void {
    if (!this.editingModelId) {
      return;
    }

    this.revealedSensitiveField = field;
  }

  concealSensitiveField(field: 'url' | 'headers'): void {
    if (!this.editingModelId || this.revealedSensitiveField !== field) {
      return;
    }

    this.revealedSensitiveField = null;
  }

  handleReset(): void {
    this.resetViewState();
    this.reset.emit();
  }

  handleSubmit(): void {
    this.submitForm.emit();
  }

  private resetViewState(): void {
    this.advancedExpanded = false;
    this.revealedSensitiveField = null;
    this.touchedFields = {
      model_name: false,
      device: false,
      url: false,
    };
  }
}

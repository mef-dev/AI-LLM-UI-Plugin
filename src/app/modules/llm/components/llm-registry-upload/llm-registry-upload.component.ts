import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LlmDevice, LlmRegistryLocator } from '../../models/llm-registry.models';
import { LlmRegistryUploadValue } from '../../models/llm-registry-form.models';

@Component({
  selector: 'app-llm-registry-upload',
  standalone: false,
  templateUrl: './llm-registry-upload.component.html',
  styleUrls: ['./llm-registry-upload.component.scss']
})
export class LlmRegistryUploadComponent {
  @Input() model: LlmRegistryLocator | null = null;
  @Input({ required: true }) form!: LlmRegistryUploadValue;
  @Input({ required: true }) devices: LlmDevice[] = [];
  @Input() fileName = '';

  @Output() close = new EventEmitter<void>();
  @Output() fileSelected = new EventEmitter<File | null>();
  @Output() reset = new EventEmitter<void>();
  @Output() submitUpload = new EventEmitter<void>();

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.fileSelected.emit(file);
  }
}

import { Component, Input } from '@angular/core';
import { ChatCompletionsRequest } from '../../models/chat-completions.models';
import { LlmRegistryLocator } from '../../../llm/models/llm-registry.models';

type ParameterHintKey =
  | 'model'
  | 'tag'
  | 'streamInterval';

@Component({
  selector: 'app-chat-request-settings',
  standalone: false,
  templateUrl: './chat-request-settings.component.html',
  styleUrls: ['./chat-request-settings.component.scss']
})
export class ChatRequestSettingsComponent {
  @Input({ required: true }) request!: ChatCompletionsRequest;
  @Input() availableModels: LlmRegistryLocator[] = [];

  readonly defaultHintText = 'Hover a setting for a quick explanation.';

  readonly parameterHints: Record<ParameterHintKey, string> = {
    model: 'Choose which registered model this chat preview should target.',
    tag: 'Optional identifier for tracing a single run in logs or future history.',
    streamInterval: 'Controls how frequently the stage endpoint emits streamed chunks.',
  };

  activeHintKey: ParameterHintKey | null = null;
  get activeHintText(): string {
    return this.activeHintKey ? this.parameterHints[this.activeHintKey] : this.defaultHintText;
  }

  showHint(key: ParameterHintKey): void {
    this.activeHintKey = key;
  }

  clearHoverHint(): void {
    this.activeHintKey = null;
  }

  clearHintOnCardExit(event: FocusEvent): void {
    const nextTarget = event.relatedTarget;

    if (!nextTarget || !(event.currentTarget as HTMLElement).contains(nextTarget as Node)) {
      this.clearHoverHint();
    }
  }
}

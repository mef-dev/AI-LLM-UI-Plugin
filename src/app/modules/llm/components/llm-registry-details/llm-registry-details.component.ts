import { Component, EventEmitter, Input, Output } from '@angular/core';
import { formatLlmAccessMode, LlmRegistryLocator } from '../../models/llm-registry.models';

@Component({
  selector: 'app-llm-registry-details',
  standalone: false,
  templateUrl: './llm-registry-details.component.html',
  styleUrls: ['./llm-registry-details.component.scss']
})
export class LlmRegistryDetailsComponent {
  @Input() model: LlmRegistryLocator | null = null;

  @Output() edit = new EventEmitter<LlmRegistryLocator>();
  @Output() upload = new EventEmitter<LlmRegistryLocator>();
  @Output() validate = new EventEmitter<LlmRegistryLocator>();
  @Output() delete = new EventEmitter<LlmRegistryLocator>();

  formatAccessMode(value?: string | null): string {
    return formatLlmAccessMode(value);
  }

  formatJson(value: unknown): string {
    return JSON.stringify(this.redactSensitiveJson(value ?? {}), null, 2);
  }

  formatUrl(url?: string): string {
    if (!url) {
      return 'n/a';
    }

    try {
      const parsed = new URL(url);
      const hostParts = parsed.hostname.split('.');

      if (hostParts.length > 2) {
        hostParts[0] = 'redacted-resource';
      }

      parsed.hostname = hostParts.join('.');
      return parsed.toString();
    } catch {
      return url.replace(/https:\/\/[^./\s]+(\.[^\s]+)/, 'https://redacted-resource$1');
    }
  }

  private redactSensitiveJson(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.redactSensitiveJson(item));
    }

    if (!value || typeof value !== 'object') {
      return value;
    }

    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((safe, [key, item]) => {
      const normalizedKey = key.toLowerCase();
      const shouldRedact =
        normalizedKey.includes('authorization') ||
        normalizedKey.includes('api_key') ||
        normalizedKey.includes('apikey') ||
        normalizedKey.includes('token') ||
        normalizedKey.includes('secret') ||
        normalizedKey.includes('password');

      safe[key] = shouldRedact ? '[redacted]' : this.redactSensitiveJson(item);
      return safe;
    }, {});
  }
}

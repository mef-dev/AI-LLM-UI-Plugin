export type LlmAccessMode =
  | 'LLM_ACCESS_MODE_DIRECT'
  | 'LLM_ACCESS_MODE_INTERNAL_SERVICE'
  | 'LLM_ACCESS_MODE_EXTERNAL_SERVICE'
  | 'direct'
  | 'internal_service'
  | 'external_service';
export type LlmDevice = 'cpu' | 'cuda';
export type LlmStatus = 'DRAFT' | 'VALIDATED' | 'DISABLED';

export type JsonRecord = Record<string, unknown>;

export interface LlmAccessModeOption {
  value: LlmAccessMode;
  label: string;
}

export const LLM_ACCESS_MODE_OPTIONS: LlmAccessModeOption[] = [
  { value: 'LLM_ACCESS_MODE_DIRECT', label: 'direct' },
  { value: 'LLM_ACCESS_MODE_INTERNAL_SERVICE', label: 'internal_service' },
  { value: 'LLM_ACCESS_MODE_EXTERNAL_SERVICE', label: 'external_service' },
];

export function normalizeLlmAccessMode(value?: string | null): LlmAccessMode {
  switch (value) {
    case 'LLM_ACCESS_MODE_DIRECT':
    case 'direct':
      return 'LLM_ACCESS_MODE_DIRECT';
    case 'LLM_ACCESS_MODE_INTERNAL_SERVICE':
    case 'internal_service':
      return 'LLM_ACCESS_MODE_INTERNAL_SERVICE';
    case 'LLM_ACCESS_MODE_EXTERNAL_SERVICE':
    case 'external_service':
      return 'LLM_ACCESS_MODE_EXTERNAL_SERVICE';
    default:
      return 'LLM_ACCESS_MODE_DIRECT';
  }
}

export function formatLlmAccessMode(value?: string | null): string {
  const normalized = normalizeLlmAccessMode(value);

  switch (normalized) {
    case 'LLM_ACCESS_MODE_INTERNAL_SERVICE':
      return 'internal_service';
    case 'LLM_ACCESS_MODE_EXTERNAL_SERVICE':
      return 'external_service';
    case 'LLM_ACCESS_MODE_DIRECT':
    default:
      return 'direct';
  }
}

export interface LlmRegistryLocator {
  '@type': 'LLMRegistryLocator';
  model_id: string;
  model_name: string;
  display_name?: string;
  access_mode: LlmAccessMode;
  is_required: boolean;
  url?: string;
  api_key?: string;
  headers?: Record<string, string>;
  version?: string;
  device?: LlmDevice;
  status: LlmStatus;
  capabilities?: JsonRecord;
  config?: JsonRecord;
  tenantId: number;
  createdAt: string;
  updatedAt: string;
}

export interface LlmCreateRequest {
  model_name: string;
  display_name?: string;
  device?: LlmDevice;
  access_mode?: LlmAccessMode;
  is_required?: boolean;
  url?: string;
  api_key?: string;
  headers?: Record<string, string>;
  version?: string;
  capabilities?: JsonRecord;
  config?: JsonRecord;
}

export interface LlmUpdateRequest {
  model_name?: string;
  display_name?: string;
  device?: LlmDevice;
  access_mode?: LlmAccessMode;
  is_required?: boolean;
  url?: string;
  api_key?: string;
  headers?: Record<string, string>;
  version?: string;
  status?: LlmStatus;
  capabilities?: JsonRecord;
  config?: JsonRecord;
}

export interface LlmListFilters {
  status?: LlmStatus | '';
  modelName?: string;
}

export interface LlmValidationResponse {
  ok: boolean;
  status: LlmStatus | string;
}

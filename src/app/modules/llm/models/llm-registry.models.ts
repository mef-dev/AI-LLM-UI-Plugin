export type LlmAccessMode = 'direct' | 'internal_service' | 'external_service';
export type LlmDevice = 'cpu' | 'cuda';
export type LlmStatus = 'DRAFT' | 'VALIDATED' | 'DISABLED';

export type JsonRecord = Record<string, unknown>;

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

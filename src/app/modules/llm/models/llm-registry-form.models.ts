import { LlmAccessMode, LlmDevice, LlmStatus } from './llm-registry.models';

export interface LlmRegistryFormValue {
  model_name: string;
  display_name: string;
  device: LlmDevice | '';
  access_mode: LlmAccessMode;
  is_required: boolean;
  url: string;
  api_key: string;
  version: string;
  status: LlmStatus;
  headersJson: string;
  capabilitiesJson: string;
  configJson: string;
}

export interface LlmRegistryUploadValue {
  device: LlmDevice | '';
  version: string;
}

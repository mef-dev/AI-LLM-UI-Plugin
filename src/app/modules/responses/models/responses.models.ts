export type ResponsesReasoningEffort = 'low' | 'medium' | 'high';

export interface ResponsesInputTextPart {
  type: 'input_text';
  text: string;
}

export interface ResponsesInputMessage {
  role: 'developer' | 'user';
  content: ResponsesInputTextPart[];
}

export interface ResponsesRequest {
  model: string;
  stream: boolean;
  max_output_tokens: number;
  reasoning: {
    effort: ResponsesReasoningEffort;
  };
  input: ResponsesInputMessage[];
  text: {
    format: {
      type: 'text';
    };
  };
}

export interface ResponsesOutputTextPart {
  type: string;
  text?: string;
}

export interface ResponsesOutputItem {
  type?: string;
  content?: ResponsesOutputTextPart[];
}

export interface ResponsesUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
}

export interface ResponsesResponse {
  id?: string;
  model?: string;
  status?: string;
  output?: ResponsesOutputItem[];
  output_text?: string;
  usage?: ResponsesUsage;
}

export interface ResponsesStreamEvent {
  kind: 'delta' | 'response';
  rawType?: string;
  delta?: string;
  response?: ResponsesResponse;
}

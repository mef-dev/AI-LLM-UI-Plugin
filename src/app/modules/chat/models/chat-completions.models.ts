export type ChatMessageRole = 'system' | 'user' | 'assistant';

export interface ChatCompletionsRequestMessage {
  role: ChatMessageRole;
  content: string;
}

export interface ChatCompletionsRequest {
  model?: string;
  messages: ChatCompletionsRequestMessage[];
  stream?: boolean;
  max_completion_tokens?: number;
  tag?: string | null;
  stream_interval?: number;
  diversity_penalty?: number;
  do_sample?: boolean;
  early_stopping?: boolean;
  length_penalty?: number;
  max_tokens?: number;
  min_length?: number;
  no_repeat_ngram_size?: number;
  num_beams?: number;
  num_return_sequences?: number;
  past_present_share_buffer?: boolean;
  repetition_penalty?: number;
  temperature?: number;
  top_k?: number;
  top_p?: number;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatCompletionsRequestMessage;
  finish_reason: 'stop' | 'length';
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  tag: string | null;
  choices: ChatCompletionChoice[];
  usage: ChatCompletionUsage;
}

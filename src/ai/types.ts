import type Stream from '../stream';

type UniMessage = {
  role: string;
  text: string;
}

type UniOptions = {
  model?: string;
  messages: UniMessage[];
  temperature?: number;
  topP?: number;
  topK?: number;
  /** Only applicable to Gemini */
  maxOutputTokens?: number;
  /** Only applicable to OneApi */
  disableTopK?: boolean;
}

interface BaseProvider {
  readonly defaultModel?: string;
  ask(options: UniOptions): BaseProviderResponse;
  ask(question: string): BaseProviderResponse;
}

interface BaseProviderResponse extends Stream {}

export {
  UniMessage,
  UniOptions,
  BaseProvider,
  BaseProviderResponse,
}

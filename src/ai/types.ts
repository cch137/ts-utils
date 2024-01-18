import type Stream from '../stream';

type UniModel = 'gemini-pro' | 'gpt-3.5-turbo' | 'gpt-4' | 'claude-2'

type UniMessage = {
  role: string;
  text: string;
}

type UniOptions = {
  model?: UniModel;
  messages: UniMessage[];
  temperature?: number;
  topP?: number;
  topK?: number;
  /** Only applicable to Gemini */
  maxOutputTokens?: number;
}

interface BaseProvider {
  ask(options: UniOptions): BaseProviderResponse;
  ask(question: string): BaseProviderResponse;
}

interface BaseProviderResponse extends Stream {}

export {
  UniModel,
  UniMessage,
  UniOptions,
  BaseProvider,
  BaseProviderResponse,
}

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
}

type ResponseStream = Stream;

interface BaseProvider {
  ask(options: UniOptions): ResponseStream;
  ask(question: string): ResponseStream;
}

export {
  UniModel,
  UniMessage,
  UniOptions,
  BaseProvider,
  ResponseStream,
}

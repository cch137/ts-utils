import type Stream from '../stream';

export type AskInputMsg = string | UniMessage | UniMessage[];
export type AskInput = string | UniMessage | UniMessage[] | UniOptions;

export type UniMessage = {
  role: string;
  text: string;
}

export type UniOptions = {
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

export interface BaseProvider {
  readonly defaultModel?: string;
  ask(input: AskInput): BaseProviderResponse;
}

export interface BaseProviderResponse extends Stream {}

export type SuperProviderResHandler = (res: BaseProviderResponse) => any;

export class SuperProvider<Providers extends {[model: string]: BaseProvider}> {
  readonly #handlers = new Set<SuperProviderResHandler>();
  readonly providers: Providers;
  get defaultModel(): keyof Providers {return Object.keys(this.providers)[0]}

  constructor(providers: Providers) {
    this.providers = providers;
  }

  listen(handler: SuperProviderResHandler) {
    this.#handlers.add(handler);
  }

  ask(options: UniOptions, model?: keyof Providers): BaseProviderResponse
  ask(question: string, model?: keyof Providers): BaseProviderResponse
  ask(options: UniOptions | string, _defaultModel?: keyof Providers) {
    if (typeof options === 'string') return this.ask(wrapOptions(options), _defaultModel);
    const model = (options.model || _defaultModel || this.defaultModel).toString();
    const res = this.providers[model].ask({
      model,
      ...options
    });
    this.#handlers.forEach(async (h) => h(res));
    return res;
  }
}

export default SuperProvider;

import GeminiProvider from "./Gemini";
import OneApiProvider from "./OneApi";
import { wrapOptions } from './utils';

export {
  GeminiProvider,
  OneApiProvider,
}

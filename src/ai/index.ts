import type { BaseProvider, UniOptions, BaseProviderResponse } from "./types";

class SuperProvider<Providers extends {[model: string]: BaseProvider}> {
  readonly providers: Providers;
  get defaultModel(): keyof Providers {return Object.keys(this.providers)[0]}

  constructor(providers: Providers) {
    this.providers = providers;
  }

  ask(options: UniOptions, model?: keyof Providers): BaseProviderResponse
  ask(question: string, model?: keyof Providers): BaseProviderResponse
  ask(options: UniOptions | string, _defaultModel?: keyof Providers) {
    if (typeof options === 'string') return this.ask({messages: [{role: 'role', text: options}]}, _defaultModel);
    const model = (options.model || _defaultModel || this.defaultModel).toString();
    return this.providers[model].ask({
      model,
      ...options
    });
  }
}

export default SuperProvider;

import GeminiProvider from "./Gemini";
import OneApiProvider from "./OneApi";

export {
  GeminiProvider,
  OneApiProvider,
}

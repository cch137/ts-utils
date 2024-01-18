import type { BaseProvider, UniOptions, BaseProviderResponse } from "./types";

class SuperProvider<Providers extends {[model: string]: BaseProvider}> {
  readonly providers: Providers;
  get defaultModel(): keyof Providers {return Object.keys(this.providers)[0]}

  constructor(providers: Providers) {
    this.providers = providers;
  }

  ask(options: UniOptions, model?: keyof Providers): BaseProviderResponse
  ask(question: string, model?: keyof Providers): BaseProviderResponse
  ask(options: UniOptions | string, model?: keyof Providers) {
    return this.providers[model || this.defaultModel].ask({
      model: model ? model.toString() : undefined,
      ...(typeof options === 'string'
        ? {messages: [{role: 'role', text: options}]}
        : options as UniOptions)
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

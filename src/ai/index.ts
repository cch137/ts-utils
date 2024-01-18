import type { BaseProvider, UniOptions } from "./types";

class SuperProvider<Providers extends Record<string, BaseProvider>> {
  readonly providers: Providers;

  constructor(providers: Providers) {
    this.providers = providers;
  }

  ask(options: UniOptions, model?: keyof Providers) {
    return this.providers[model || Object.keys(this.providers)[0]].ask(options);
  }
}

export default SuperProvider;

import GeminiProvider from "./Gemini";
import OneApiProvider from "./OneApi";

export {
  GeminiProvider,
  OneApiProvider,
}

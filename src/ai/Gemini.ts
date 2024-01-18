import Stream from '../stream'
import type { BaseProvider, UniMessage, UniOptions, ResponseStream } from './types';
import type { GenerationConfig, InputContent, Part } from '@google/generative-ai'
import { GoogleGenerativeAI } from '@google/generative-ai'

type GeminiMessage = {
  role: 'model' | 'user';
  parts: string;
}

export type {
  GeminiMessage,
}

const convertPartsToString = (parts: string | (Part | string)[]) => {
  if (typeof parts === 'string') return parts
  const texts: string[] = []
  for (const part of parts) {
    if (typeof part === 'string') texts.push(part)
    else texts.push(part?.text || '')
  }
  return texts.join('')
}

const parseInputContents = (
  _messages: InputContent[],
  options: { endsWithUser?: boolean, startsWithUser?: boolean } = {}
) => {
  const { startsWithUser = true, endsWithUser = true } = options;
  const messages: GeminiMessage[] = [];
  let lastRoleIsModel = startsWithUser;
  for (const message of _messages) {
    if (lastRoleIsModel) {
      if (message.role === 'model') {
        messages.push({ role: 'user', parts: '' });
      }
    } else if (message.role === 'user') {
      messages.push({ role: 'model', parts: '' });
    }
    messages.push({
      ...message,
      parts: convertPartsToString(message.parts),
      role: lastRoleIsModel ? 'user' : 'model',
    });
    lastRoleIsModel = !lastRoleIsModel;
  }
  if (lastRoleIsModel && endsWithUser) {
    messages.push({ role: 'user', parts: '' });
  }
  const message = messages.pop();
  return {
    history: messages,
    message,
  }
}

class GeminiResponse extends Stream {
  constructor(
    client: GeminiProvider,
    messages: InputContent[] = [],
    generationConfig: GenerationConfig = {},
    model: string = client.defaultModel
  ) {
    super();
    (async (stream) => {
      const { history, message } = parseInputContents(messages);
      const chat = client.getGenerativeModel({ model })
        .startChat({
          history,
          generationConfig: {
            maxOutputTokens: 8000,
            ...generationConfig,
          },
        });
      let globalError: Error | undefined = undefined
      const req = await chat.sendMessageStream(message?.parts || '');
      try {
        while (true) {
          const chunk = await req.stream.next()
          if (chunk.done) break;
          const { candidates, promptFeedback } = chunk.value
          if (promptFeedback?.blockReason) {
            globalError = new Error(`Model refused to respond. (Ratings: ${promptFeedback.safetyRatings.map(r => `${r.probability} ${r.category}`).join(', ')})`)
            throw globalError
          }
          if (candidates === undefined) continue
          for (const candidate of candidates) {
            for (const part of candidate.content.parts) {
              stream.write(part?.text || '')
            }
          }
        }
      } catch (e) {
        stream.error()
      } finally {
        stream.end()
      }
      if (globalError) throw globalError
    })(this);
  }
}

const convertToGeminiMessages = (messages: UniMessage[]) => {
  return messages.map((m) => {
    const { role = '', text = '' } = m;
    return {
      role: (role === 'user' || role === 'model') ? role : 'user',
      parts: text
    } as GeminiMessage
  })
}

/**
 * More keys: (leaked from GitHub) \
 * AIzaSyDfGoWenCyM53XsN-AB6dci5dpNxFR-WXg (current) \
 * AIzaSyA_D3B_6BAio2MGZc-asmjh3D_HGXPkLsU \
 * AIzaSyB-axwh7qrTGngrI2qNLgN5YAjCFJ-w0R8 \
 * AIzaSyCsEtcUJS6fwfKgBPyskX0cNvMEN4WgCX4 \
 * AIzaSyAmjtCr0NQusUrodsQp28YHXbjW62_HsYI \
 * AIzaSyAumupRyzuW_e7SBNqJX6debuVF-R9sYPg \
 * AIzaSyCfVTilfnL266zjXh1prQ0zOWK_TSw_YZc \
 * AIzaSyBx8KBsrVk66QvGvAWr1lv6UGe8OyheyOI \
 * AIzaSyAjzOmDK6Vod719KJbKTWShRt_PPpQSY6k \
 * AIzaSyDxRSVebSxc05aCCTPsBxOuQI3OrjewB9I \
 * AIzaSyBUI3iOGqrTZvr8Gf4iVMfgWeulwxqmYuo \
 * ---
 * GeminiBaseUrl: https://generativelanguage.googleapis.com
 */

class GeminiProvider extends GoogleGenerativeAI implements BaseProvider {
  readonly defaultModel;

  constructor(apiKey: string, defaultModel = 'gemini-pro') {
    super(apiKey);
    this.defaultModel = defaultModel;
  }

  ask(options: UniOptions): ResponseStream
  ask(question: string): ResponseStream
  ask(options: UniOptions | string) {
    if (typeof options === 'string') return this.ask({
      messages: [{ role: 'user', text: options }]
    });
    const { model, messages, temperature, topK, topP } = options;
    return new GeminiResponse(
      this,
      convertToGeminiMessages(messages),
      { temperature, topK, topP },
      model,
    );
  }
}

export default GeminiProvider;

import { wrapOptions } from './utils';
import Stream from '../stream'
import type { BaseProvider, UniMessage, UniOptions, BaseProviderResponse, AskInput } from '.';
import type { InputContent, Part } from '@google/generative-ai'
import { GoogleGenerativeAI } from '@google/generative-ai'

type GeminiMessage = {
  role: 'model' | 'user';
  parts: string;
}

const convertToGeminiMessages = (messages: UniMessage[] = []) => {
  return messages.map((m) => {
    const { role = '', text = '' } = m;
    return {
      role: (role === 'user' || role === 'model') ? role : 'user',
      parts: text
    } as GeminiMessage
  })
}

const _convertPartsToString = (parts: string | (Part | string)[]) => {
  if (typeof parts === 'string') return parts
  const texts: string[] = []
  for (const part of parts) {
    if (typeof part === 'string') texts.push(part)
    else texts.push(part?.text || '')
  }
  return texts.join('')
}

const parseInputContents = (
  _messages: GeminiMessage[],
  options: { endsWithUser?: boolean, startsWithUser?: boolean } = {}
) => {
  const { startsWithUser = true, endsWithUser = true } = options;
  const messages: GeminiMessage[] = [];
  let lastRoleIsModel = startsWithUser;
  for (const message of _messages) {
    if (lastRoleIsModel) {
      if (message.role === 'model') messages.push({ role: 'user', parts: '' });
    } else {
      if (message.role === 'user') messages.push({ role: 'model', parts: '' });
    }
    messages.push(message);
    lastRoleIsModel = message.role === 'model';
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

class GeminiResponse extends Stream implements BaseProviderResponse {
  readonly model: string;
  constructor(
    client: GeminiProvider,
    options: UniOptions,
  ) {
    super();
    const {
      model = client.defaultModel,
      messages,
      temperature,
      topK,
      topP,
      maxOutputTokens = 8000
    } = options;
    this.model = model;
    (async (stream) => {
      const { history, message } = parseInputContents(convertToGeminiMessages(messages));
      const genModel = client.getGenerativeModel({ model });
      const chat = genModel.startChat({
        history,
        generationConfig: { maxOutputTokens, temperature, topK, topP }
      });
      let globalError: Error | undefined = undefined
      try {
        const req = await chat.sendMessageStream(message?.parts || '');
        while (true) {
          const chunk = await req.stream.next()
          if (chunk.done) break;
          const { candidates, promptFeedback } = chunk.value
          if (promptFeedback?.blockReason) {
            globalError = new Error(`Model does not respond: ${JSON.stringify(promptFeedback)}`)
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
        stream.error(e)
      } finally {
        stream.end()
      }
      if (globalError) throw globalError
    })(this);
  }
}

/**
 * GeminiBaseUrl: https://generativelanguage.googleapis.com
 */

class GeminiProvider extends GoogleGenerativeAI implements BaseProvider {
  readonly defaultModel;

  constructor(apiKey: string, defaultModel = 'gemini-pro') {
    super(apiKey);
    this.defaultModel = defaultModel;
  }

  ask(options: AskInput) {
    return new GeminiResponse(this, wrapOptions(options));
  }
}

export default GeminiProvider;

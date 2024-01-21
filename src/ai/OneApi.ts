import Stream from '../stream'
import type { BaseProvider, UniMessage, UniOptions, BaseProviderResponse } from './types';
import axios from 'axios'

type OneApiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

type ChatResponseChoice = {
  index: number;
  message: { role: "user" | "assistant", content: string };
  finish_reason: string | "stop";
}

type ChatResponseChoiceDelta = {
  index: number;
  delta: { role?: "user" | "assistant", content?: string };
  finish_reason: string | "stop";
}

type ChatResponseChunk = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatResponseChoiceDelta[];
}

type ChatResponse = {
  id: string;
  object: string;
  created: number; // unit: seconds
  model: string;
  choices: ChatResponseChoice[];
  usage: { prompt_tokens: number, completion_tokens: number, total_tokens: number};
}

const convertToOneApiMessages = (messages: UniMessage[] = []) => {
  return messages.map((m) => {
    const { role = '', text = '' } = m;
    return {
      role: (role === 'user' || role === 'assistant' || role === 'system') ? role : 'user',
      content: text
    } as OneApiMessage
  })
}

const NEWLINE_REGEXP = /\r\n|[\n\r\x0b\x0c\x1c\x1d\x1e\x85\u2028\u2029]/g;

class OneApiResponse extends Stream {
  constructor(client: OneApiProvider, options: UniOptions) {
    super();
    (async (stream: OneApiResponse) => {
      const url = `${client.host}/v1/chat/completions`;
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${client.key}` };
      const {
        messages,
        model = client.defaultModel,
        temperature,
        topP: top_p,
        topK: top_k,
        disableTopK = /^gpt[-_]?3$/i.test(model),
      } = options;
      const res = await axios.post(url, {
        messages: convertToOneApiMessages(messages),
        model,
        temperature,
        top_p,
        top_k: disableTopK ? undefined : top_k,
        stream: true,
      }, {
        headers, validateStatus: (_) => true,
        responseType: 'stream'
      });
      let done = false;
      res.data.on('data', (buf: Buffer) => {
        const chunks = new TextDecoder('utf-8').decode(buf).split(NEWLINE_REGEXP).map(c => c.replace(/data\:/, '').trim());
        for (const _chunk of chunks) {
          if (done) continue;
          try {
            if (_chunk.startsWith('[DONE]')) {
              done = true;
              continue;
            }
            if (!_chunk) continue;
            const chunk = JSON.parse(_chunk) as ChatResponseChunk;
            const content = chunk.choices[0]?.delta?.content;
            if (content === undefined) continue;
            stream.write(content);
          } catch (e) {
            console.error(e);
          }
        }
      })
      res.data.on('error', (e: any) => {
        stream.error(e);
      });
      res.data.on('end', () => {
        stream.end();
      });
    })(this);
  }
}

class OneApiProvider implements BaseProvider {
  readonly defaultModel;

  host: string;
  key: string;

  constructor(host: string, key: string, defaultModel = 'gpt-4') {
    this.host = host;
    this.key = key;
    this.defaultModel = defaultModel;
  }

  ask(options: UniOptions): BaseProviderResponse
  ask(question: string): BaseProviderResponse
  ask(options: UniOptions | string) {
    if (typeof options === 'string') return this.ask({
      messages: [{ role: 'user', text: options }]
    });
    return new OneApiResponse(this, options);
  }
}

export default OneApiProvider;

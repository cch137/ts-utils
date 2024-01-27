import { wrapOptions } from '.';
import Stream from '../stream'
import type { BaseProvider, UniMessage, UniOptions, BaseProviderResponse, AskInput } from '.';

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

class OneApiResponse extends Stream implements BaseProviderResponse {
  constructor(client: OneApiProvider, options: UniOptions) {
    super();
    (async (stream: OneApiResponse) => {
      let DONE = false;
      const url = `${client.host}/v1/chat/completions`;
      const decoder = new TextDecoder('utf8');
      const {
        messages,
        model = client.defaultModel,
        temperature,
        topP: top_p,
        topK: top_k,
        disableTopK = /^gpt[-_]?3/i.test(model),
      } = options;
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          messages: convertToOneApiMessages(messages),
          model,
          temperature,
          top_p,
          top_k: disableTopK ? undefined : top_k,
          stream: true,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${client.key}`
        },
      });
      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      try {
        while (true) {
          try {
            const { value, done } = await reader.read();
            if (done) break;
            const chunks = decoder.decode(value)
              .split(NEWLINE_REGEXP)
              .map(c => c.replace(/data:/, '').trim());
            for (const _chunk of chunks) {
              if (DONE) continue;
              try {
                if (_chunk.startsWith('[DONE]')) {
                  DONE = true;
                  continue;
                }
                if (!_chunk) continue;
                const chunk = JSON.parse(_chunk) as ChatResponseChunk;
                const content = chunk.choices[0]?.delta?.content;
                if (content) stream.write(content);
              } catch {}
            }
          } catch (e) {
            console.error(`Failed to parse chunk${e instanceof Error ? ': ' + e.message : ''}`);
          }
        }
      } catch (e) {
        stream.error();
      } finally {
        stream.end();
      }
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

  ask(options: AskInput) {
    return new OneApiResponse(this, wrapOptions(options));
  }
}

export default OneApiProvider;

import axios from 'axios'
import Stream from '../stream'
import type { BaseProvider, UniMessage, UniOptions } from './types';

type OneApiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

type OneApiOptions = {
  messages: OneApiMessage[];
  model: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stream?: true;
}

export type {
  OneApiMessage,
  OneApiOptions,
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

class OneApiResponse extends Stream {
  constructor(client: OneApiProvider, options: OneApiOptions) {
    super();
    const {
      messages,
      model,
      temperature = 0.3,
      top_p = 0.3,
      top_k = 2,
      stream: _stream = true
    } = options;
    (async (stream: OneApiResponse) => {
      const url = `${client.host}/v1/chat/completions`;
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${client.key}` };
      const res = await axios.post(url, {
        messages,
        model,
        temperature,
        top_p,
        top_k: model.startsWith('gpt-3.') ? undefined : top_k,
        stream: _stream,
      }, {
        headers, validateStatus: (_) => true,
        responseType: 'stream'
      });
      res.data.on('data', (buf: Buffer) => {
        const chunksString = new TextDecoder('utf-8').decode(buf)
          .split('data:').map(c => c.trim()).filter(c => c);
        for (const chunkString of chunksString) {
          try {
            const chunk = JSON.parse(chunkString) as ChatResponseChunk;
            const content = chunk.choices[0]?.delta?.content;
            if (content === undefined) continue;
            stream.write(content);
          } catch {}
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

const convertToOneApiMessages = (messages: UniMessage[]) => {
  return messages.map((m) => {
    const { role = '', text = '' } = m;
    return {
      role: (role === 'user' || role === 'model' || role === 'system') ? role : 'user',
      content: text
    } as OneApiMessage
  })  
}

class OneApiProvider implements BaseProvider {
  host: string;
  key: string;

  constructor(host: string, key: string) {
    this.host = host;
    this.key = key;
  }

  ask(options: UniOptions) {
    const { model, messages, temperature, topK: top_k, topP: top_p } = options;
    return new OneApiResponse(this, {
      model,
      messages: convertToOneApiMessages(messages),
      temperature, top_k, top_p,
    })
  }
}

export default OneApiProvider;
